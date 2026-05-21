<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useMainStore } from '@/stores/main.store';
  import { TreatmentService } from '@/services/treatment.service';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import EmployeeService from '@/services/employee.service';
  import { formatDate } from '@/utils/format.utils';
  import type { IViewEmployee } from '@/shared/template-web-stack-2025/employee.interface';
  import type {
    ITreatmentLookups,
    ILookupItem,
    IDiseaseSubGroup,
    IExternalPerson,
    ICreateExternalPersonBody,
    IVisitUsageForm,
    IVitals,
  } from '@/interfaces/treatment.interfaces';
  import Swal from 'sweetalert2';

  const mainStore = useMainStore();

  // ─── Lookup data ──────────────────────────────────────────────────────
  const lookups = ref<ITreatmentLookups>({
    treatment_types: [],
    refer_types: [],
    severity_types: [],
    disease_groups: [],
    disease_sub_groups: [],
    hospitals: [],
  });
  const stockItems = ref<IStockOnHand[]>([]);
  const employees = ref<IViewEmployee[]>([]);

  // ─── Stepper state ─────────────────────────────────────────────────────
  const currentStep = ref(0);
  const steps = [
    { label: 'ค้นหาผู้ป่วย' },
    { label: 'ข้อมูลผู้ป่วย' },
    { label: 'ข้อมูล Visit' },
    { label: 'วินิจฉัย/การรักษา' },
    { label: 'รายการยา' },
    { label: 'บันทึก' },
  ];

  // ─── Step 1: Patient selection ─────────────────────────────────────────
  const patientTab = ref<'EMP' | 'EXT'>('EMP');

  // Employee
  const empSearchText = ref('');
  const empSuggestions = ref<IViewEmployee[]>([]);
  const selectedEmployee = ref<IViewEmployee | null>(null);

  // External person
  const extSearchText = ref('');
  const extSuggestions = ref<IExternalPerson[]>([]);
  const selectedExtPerson = ref<IExternalPerson | null>(null);

  // Register dialog
  const showRegisterDialog = ref(false);
  const registerForm = ref<ICreateExternalPersonBody>({
    full_name: '',
    company: '',
    national_id: '',
    passport_no: '',
    phone: '',
  });
  const registerLoading = ref(false);

  // ─── Step 3: Visit info ─────────────────────────────────────────────────
  const visitDatetime = ref(new Date());
  const shiftCode = ref<string | null>(null);
  const symptoms = ref('');

  const vitals = ref<IVitals>({
    bp_systolic: undefined,
    bp_diastolic: undefined,
    pulse: undefined,
    temp: undefined,
    weight: undefined,
    height: undefined,
    o2_sat: undefined,
    rr: undefined,
  });

  const shiftOptions = [
    { label: 'เช้า', value: 'MORNING' },
    { label: 'บ่าย', value: 'AFTERNOON' },
    { label: 'ดึก', value: 'NIGHT' },
  ];

  // ─── Step 4: Diagnosis ─────────────────────────────────────────────────
  const selectedGroupId = ref<number | null>(null);
  const selectedDiseaseId = ref<number | null>(null);
  const selectedTreatmentTypeId = ref<number | null>(null);
  const accidentInWorkFlag = ref(false);
  const workRelatedFlag = ref(false);
  const selectedSeverityId = ref<number | null>(null);
  const referFlag = ref(false);
  const selectedReferTypeId = ref<number | null>(null);
  const selectedHospitalId = ref<number | null>(null);

  const filteredDiseaseSubGroups = computed<IDiseaseSubGroup[]>(() => {
    if (!selectedGroupId.value) return [];
    return lookups.value.disease_sub_groups.filter(d => d.group_id === selectedGroupId.value);
  });

  // ─── Step 5: Medicines ─────────────────────────────────────────────────
  const usageRows = ref<IVisitUsageForm[]>([]);
  const itemSearchText = ref('');
  const itemSuggestions = ref<IStockOnHand[]>([]);
  const selectedItem = ref<IStockOnHand | null>(null);
  const newItemQty = ref(1);

  // ─── Step 6: Nursing advice ────────────────────────────────────────────
  const nursingAdvice = ref('');
  const saving = ref(false);

  // ─────────────────────────────────────────────────────────────────────────
  onMounted(async () => {
    try {
      const [lk, stock, emps] = await Promise.all([
        TreatmentService.getLookups(),
        StockService.getStockStatus(),
        new EmployeeService().findAll(),
      ]);
      lookups.value = lk;
      stockItems.value = stock;
      employees.value = emps;
    } catch (err: any) {
      console.error('TreatmentRecord load error:', err);
    }
  });

  // ─── Employee AutoComplete ─────────────────────────────────────────────
  function searchEmployee(event: { query: string }) {
    const q = event.query.toLowerCase();
    empSuggestions.value = employees.value.filter(
      e =>
        e.thai_name?.toLowerCase().includes(q) ||
        e.ID?.toLowerCase().includes(q) ||
        e.eng_name?.toLowerCase().includes(q)
    ).slice(0, 10);
  }

  function onSelectEmployee(event: { value: IViewEmployee }) {
    selectedEmployee.value = event.value;
  }

  // ─── External Person AutoComplete ─────────────────────────────────────
  async function searchExtPerson(event: { query: string }) {
    if (event.query.length < 2) { extSuggestions.value = []; return; }
    try {
      extSuggestions.value = await TreatmentService.searchExternalPeople(event.query);
    } catch { extSuggestions.value = []; }
  }

  function onSelectExtPerson(event: { value: IExternalPerson }) {
    selectedExtPerson.value = event.value;
  }

  // ─── Register external person ──────────────────────────────────────────
  function openRegisterDialog() {
    registerForm.value = { full_name: extSearchText.value, company: '', national_id: '', passport_no: '', phone: '' };
    showRegisterDialog.value = true;
  }

  async function saveExternalPerson() {
    if (!registerForm.value.full_name.trim()) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อ-นามสกุล', timer: 2000, showConfirmButton: false });
      return;
    }
    registerLoading.value = true;
    try {
      const res = await TreatmentService.createExternalPerson({
        full_name: registerForm.value.full_name,
        company: registerForm.value.company || undefined,
        national_id: registerForm.value.national_id || undefined,
        passport_no: registerForm.value.passport_no || undefined,
        phone: registerForm.value.phone || undefined,
      });
      // Re-search to get full record
      const list = await TreatmentService.searchExternalPeople(registerForm.value.full_name);
      const created = list.find(p => p.external_person_id === res.external_person_id) ?? list[0];
      if (created) {
        selectedExtPerson.value = created;
        extSearchText.value = created.full_name;
      }
      showRegisterDialog.value = false;
      Swal.fire({ icon: 'success', title: 'ลงทะเบียนสำเร็จ', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err?.response?.data?.message || err?.message });
    } finally {
      registerLoading.value = false;
    }
  }

  // ─── Step validation ───────────────────────────────────────────────────
  function canGoNext(): boolean {
    if (currentStep.value === 0) {
      return patientTab.value === 'EMP' ? !!selectedEmployee.value : !!selectedExtPerson.value;
    }
    return true;
  }

  function nextStep() {
    if (!canGoNext()) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกผู้ป่วยก่อน', timer: 2000, showConfirmButton: false });
      return;
    }
    currentStep.value++;
  }

  function prevStep() {
    if (currentStep.value > 0) currentStep.value--;
  }

  // ─── Patient display ───────────────────────────────────────────────────
  const patientName = computed(() => {
    if (patientTab.value === 'EMP') return selectedEmployee.value?.thai_name || '-';
    return selectedExtPerson.value?.full_name || '-';
  });

  const patientCompany = computed(() => {
    if (patientTab.value === 'EMP') return (selectedEmployee.value as any)?.section_name || '';
    return selectedExtPerson.value?.company || '';
  });

  // ─── Item AutoComplete ─────────────────────────────────────────────────
  function searchItem(event: { query: string }) {
    const q = event.query.toLowerCase();
    itemSuggestions.value = stockItems.value
      .filter(i => i.item_name_en?.toLowerCase().includes(q) || i.item_code?.toLowerCase().includes(q))
      .slice(0, 10);
  }

  function addItemRow() {
    if (!selectedItem.value) return;
    if (newItemQty.value < 1) {
      Swal.fire({ icon: 'warning', title: 'จำนวนต้องมากกว่า 0', timer: 1500, showConfirmButton: false });
      return;
    }
    if ((selectedItem.value.qty_base ?? 0) < newItemQty.value) {
      Swal.fire({ icon: 'warning', title: 'Stock ไม่เพียงพอ', text: `คงเหลือ ${selectedItem.value.qty_base ?? 0} หน่วย`, timer: 2500, showConfirmButton: false });
      return;
    }
    const existing = usageRows.value.find(r => r.item_id === selectedItem.value!.item_id);
    if (existing) {
      existing.qty_base += newItemQty.value;
    } else {
      usageRows.value.push({
        item_id: selectedItem.value.item_id,
        item_code: selectedItem.value.item_code,
        item_name_en: selectedItem.value.item_name_en,
        unit_name: '',
        stock_qty: selectedItem.value.qty_base ?? 0,
        qty_base: newItemQty.value,
      });
    }
    selectedItem.value = null;
    itemSearchText.value = '';
    newItemQty.value = 1;
  }

  function removeItemRow(index: number) {
    usageRows.value.splice(index, 1);
  }

  // ─── Save ─────────────────────────────────────────────────────────────
  async function saveVisit() {
    saving.value = true;
    try {
      const vitalsJson = JSON.stringify(vitals.value);
      const body = {
        patient_type: patientTab.value,
        employee_id: patientTab.value === 'EMP' ? selectedEmployee.value?.ID : undefined,
        external_person_id: patientTab.value === 'EXT' ? selectedExtPerson.value?.external_person_id : undefined,
        visit_datetime: visitDatetime.value.toISOString(),
        shift_code: shiftCode.value || undefined,
        symptoms: symptoms.value || undefined,
        vitals_json: vitalsJson,
        group_id: selectedGroupId.value || undefined,
        disease_id: selectedDiseaseId.value || undefined,
        treatment_type_id: selectedTreatmentTypeId.value || undefined,
        nursing_advice: nursingAdvice.value || undefined,
        accident_in_work_flag: accidentInWorkFlag.value,
        work_related_flag: workRelatedFlag.value,
        severity_id: accidentInWorkFlag.value ? (selectedSeverityId.value || undefined) : undefined,
        refer_flag: referFlag.value,
        refer_type_id: referFlag.value ? (selectedReferTypeId.value || undefined) : undefined,
        hospital_id: referFlag.value ? (selectedHospitalId.value || undefined) : undefined,
        usages: usageRows.value.map(r => ({ item_id: r.item_id, qty_base: r.qty_base })),
      };

      await TreatmentService.createVisit(body);
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1800, showConfirmButton: false });
      resetForm();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err?.response?.data?.message || err?.message });
    } finally {
      saving.value = false;
    }
  }

  function resetForm() {
    currentStep.value = 0;
    patientTab.value = 'EMP';
    selectedEmployee.value = null;
    selectedExtPerson.value = null;
    empSearchText.value = '';
    extSearchText.value = '';
    visitDatetime.value = new Date();
    shiftCode.value = null;
    symptoms.value = '';
    vitals.value = {};
    selectedGroupId.value = null;
    selectedDiseaseId.value = null;
    selectedTreatmentTypeId.value = null;
    accidentInWorkFlag.value = false;
    workRelatedFlag.value = false;
    selectedSeverityId.value = null;
    referFlag.value = false;
    selectedReferTypeId.value = null;
    selectedHospitalId.value = null;
    usageRows.value = [];
    nursingAdvice.value = '';
  }
</script>

<template>
  <div class="card">
    <div class="flex align-items-center gap-2 mb-4">
      <i class="pi pi-heart-fill text-red-500 text-2xl" />
      <h2 class="text-xl font-semibold m-0">บันทึกการรักษาพยาบาล</h2>
    </div>

    <!-- Stepper header -->
    <div class="flex gap-0 mb-5 overflow-x-auto">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="flex-1 text-center py-2 px-1 border-bottom-2 font-medium text-sm cursor-pointer transition-colors"
        :class="idx === currentStep
          ? 'border-primary text-primary'
          : idx < currentStep
            ? 'border-green-500 text-green-600'
            : 'border-200 text-color-secondary'"
        @click="idx < currentStep && (currentStep = idx)"
      >
        <i
          :class="idx < currentStep ? 'pi pi-check-circle text-green-500' : 'pi pi-circle'"
          class="mr-1"
        />
        {{ step.label }}
      </div>
    </div>

    <!-- ── Step 0: ค้นหาผู้ป่วย ── -->
    <div v-if="currentStep === 0">
      <div class="flex gap-2 mb-4">
        <Button
          :label="'พนักงาน'"
          :severity="patientTab === 'EMP' ? 'primary' : 'secondary'"
          icon="pi pi-user"
          @click="patientTab = 'EMP'; selectedEmployee = null; empSearchText = ''"
        />
        <Button
          :label="'บุคคลภายนอก'"
          :severity="patientTab === 'EXT' ? 'primary' : 'secondary'"
          icon="pi pi-users"
          @click="patientTab = 'EXT'; selectedExtPerson = null; extSearchText = ''"
        />
      </div>

      <!-- Employee search -->
      <div v-if="patientTab === 'EMP'" class="flex flex-column gap-3">
        <label class="font-medium">ค้นหาพนักงาน (ชื่อ / รหัส)</label>
        <AutoComplete
          v-model="empSearchText"
          :suggestions="empSuggestions"
          optionLabel="FULLNAME_TH"
          placeholder="พิมพ์ชื่อหรือรหัสพนักงาน..."
          class="w-full md:w-24rem"
          @complete="searchEmployee"
          @item-select="onSelectEmployee"
          forceSelection
        >
          <template #option="{ option }">
            <div class="flex flex-column">
              <span class="font-medium">{{ option.thai_name }}</span>
              <span class="text-xs text-color-secondary">{{ option.ID }} · {{ option.section_name }}</span>
            </div>
          </template>
        </AutoComplete>
        <div v-if="selectedEmployee" class="p-3 border-round surface-100">
          <div class="font-semibold">{{ selectedEmployee.thai_name }}</div>
          <div class="text-sm text-color-secondary">{{ selectedEmployee.ID }} · {{ selectedEmployee.section_name }}</div>
        </div>
      </div>

      <!-- External person search -->
      <div v-else class="flex flex-column gap-3">
        <label class="font-medium">ค้นหาบุคคลภายนอก (ชื่อ / เลขบัตร / บริษัท)</label>
        <div class="flex gap-2 align-items-center">
          <AutoComplete
            v-model="extSearchText"
            :suggestions="extSuggestions"
            optionLabel="full_name"
            placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร..."
            class="flex-1 md:w-24rem"
            @complete="searchExtPerson"
            @item-select="onSelectExtPerson"
          >
            <template #option="{ option }">
              <div class="flex flex-column">
                <span class="font-medium">{{ option.full_name }}</span>
                <span class="text-xs text-color-secondary">
                  {{ option.company || 'ไม่ระบุบริษัท' }} ·
                  บัตร: {{ option.national_id || '-' }} ·
                  เข้ารับบริการ {{ option.visit_count }} ครั้ง
                </span>
              </div>
            </template>
          </AutoComplete>
          <Button label="ลงทะเบียนใหม่" icon="pi pi-user-plus" severity="success" @click="openRegisterDialog" />
        </div>
        <div v-if="selectedExtPerson" class="p-3 border-round surface-100">
          <div class="font-semibold">{{ selectedExtPerson.full_name }}</div>
          <div class="text-sm text-color-secondary">
            {{ selectedExtPerson.company || 'ไม่ระบุบริษัท' }} ·
            บัตร: {{ selectedExtPerson.national_id || '-' }} ·
            เบอร์: {{ selectedExtPerson.phone || '-' }}
          </div>
          <div class="text-xs text-color-secondary mt-1">เข้ารับบริการมาแล้ว {{ selectedExtPerson.visit_count }} ครั้ง</div>
        </div>
      </div>
    </div>

    <!-- ── Step 1: Patient Summary ── -->
    <div v-else-if="currentStep === 1">
      <div class="p-4 surface-100 border-round mb-3">
        <div class="flex align-items-center gap-3 mb-3">
          <i class="pi pi-user text-3xl text-primary" />
          <div>
            <div class="text-xl font-bold">{{ patientName }}</div>
            <div class="text-color-secondary">{{ patientCompany }}</div>
          </div>
          <Tag :value="patientTab === 'EMP' ? 'พนักงาน' : 'บุคคลภายนอก'" :severity="patientTab === 'EMP' ? 'info' : 'warning'" class="ml-auto" />
        </div>
        <Divider />
        <p class="text-color-secondary text-sm m-0">
          <i class="pi pi-info-circle mr-1" />
          ข้อมูลสุขภาพเพิ่มเติม (ประวัติแพ้ยา, โรคประจำตัว) จะแสดงเมื่อ integration กับ patient profile พร้อม
        </p>
      </div>
    </div>

    <!-- ── Step 2: Visit Info ── -->
    <div v-else-if="currentStep === 2">
      <div class="grid">
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">วันและเวลาที่เข้ารับบริการ *</label>
          <DatePicker v-model="visitDatetime" showTime hourFormat="24" class="w-full" dateFormat="dd/mm/yy" />
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">กะงาน</label>
          <Select v-model="shiftCode" :options="shiftOptions" optionLabel="label" optionValue="value" placeholder="เลือกกะงาน" class="w-full" />
        </div>
        <div class="col-12 flex flex-column gap-2">
          <label class="font-medium">อาการ / ประวัติการเจ็บป่วย</label>
          <Textarea v-model="symptoms" rows="3" class="w-full" placeholder="บรรยายอาการ..." autoResize />
        </div>
      </div>

      <Divider />
      <div class="font-semibold mb-3">สัญญาณชีพ (Vital Signs)</div>
      <div class="grid">
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">ความดันโลหิต Systolic</label>
          <InputNumber v-model="vitals.bp_systolic" suffix=" mmHg" class="w-full" :min="0" :max="300" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">ความดันโลหิต Diastolic</label>
          <InputNumber v-model="vitals.bp_diastolic" suffix=" mmHg" class="w-full" :min="0" :max="200" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">ชีพจร (Pulse)</label>
          <InputNumber v-model="vitals.pulse" suffix=" /min" class="w-full" :min="0" :max="300" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">อุณหภูมิ (Temp)</label>
          <InputNumber v-model="vitals.temp" suffix=" °C" :minFractionDigits="1" :maxFractionDigits="1" class="w-full" :min="30" :max="45" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">น้ำหนัก (Weight)</label>
          <InputNumber v-model="vitals.weight" suffix=" kg" :minFractionDigits="1" class="w-full" :min="0" :max="300" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">ส่วนสูง (Height)</label>
          <InputNumber v-model="vitals.height" suffix=" cm" class="w-full" :min="0" :max="250" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">O2 Saturation</label>
          <InputNumber v-model="vitals.o2_sat" suffix=" %" class="w-full" :min="0" :max="100" />
        </div>
        <div class="col-6 md:col-3 flex flex-column gap-1">
          <label class="text-sm">อัตราการหายใจ (RR)</label>
          <InputNumber v-model="vitals.rr" suffix=" /min" class="w-full" :min="0" :max="100" />
        </div>
      </div>
    </div>

    <!-- ── Step 3: Diagnosis / Treatment ── -->
    <div v-else-if="currentStep === 3">
      <div class="grid">
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">กลุ่มโรค</label>
          <Select
            v-model="selectedGroupId"
            :options="lookups.disease_groups"
            optionLabel="name_th"
            optionValue="id"
            placeholder="เลือกกลุ่มโรค"
            class="w-full"
            @change="selectedDiseaseId = null"
            showClear
          />
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">ประเภทโรค</label>
          <Select
            v-model="selectedDiseaseId"
            :options="filteredDiseaseSubGroups"
            optionLabel="name_th"
            optionValue="id"
            placeholder="เลือกกลุ่มโรคก่อน"
            class="w-full"
            :disabled="!selectedGroupId"
            showClear
          />
        </div>
        <div class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">ประเภทการรักษา</label>
          <Select
            v-model="selectedTreatmentTypeId"
            :options="lookups.treatment_types"
            optionLabel="name_th"
            optionValue="id"
            placeholder="เลือกประเภทการรักษา"
            class="w-full"
            showClear
          />
        </div>
      </div>

      <Divider />
      <div class="grid">
        <div class="col-12 md:col-6 flex flex-column gap-3">
          <div class="flex align-items-center gap-3">
            <Checkbox v-model="accidentInWorkFlag" :binary="true" inputId="accidentFlag" />
            <label for="accidentFlag" class="cursor-pointer">อุบัติเหตุในงาน</label>
          </div>
          <div class="flex align-items-center gap-3">
            <Checkbox v-model="workRelatedFlag" :binary="true" inputId="workFlag" />
            <label for="workFlag" class="cursor-pointer">โรคจากการทำงาน</label>
          </div>
        </div>
        <div v-if="accidentInWorkFlag" class="col-12 md:col-6 flex flex-column gap-2">
          <label class="font-medium">ความรุนแรง</label>
          <Select
            v-model="selectedSeverityId"
            :options="lookups.severity_types"
            optionLabel="name_th"
            optionValue="id"
            placeholder="เลือกระดับความรุนแรง"
            class="w-full"
            showClear
          />
        </div>
      </div>

      <Divider />
      <div class="grid">
        <div class="col-12 flex align-items-center gap-3 mb-2">
          <Checkbox v-model="referFlag" :binary="true" inputId="referFlag" />
          <label for="referFlag" class="cursor-pointer font-medium">ส่งต่อโรงพยาบาล</label>
        </div>
        <template v-if="referFlag">
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="font-medium">ประเภทการส่งต่อ</label>
            <Select
              v-model="selectedReferTypeId"
              :options="lookups.refer_types"
              optionLabel="name_th"
              optionValue="id"
              placeholder="เลือกประเภทการส่งต่อ"
              class="w-full"
              showClear
            />
          </div>
          <div class="col-12 md:col-6 flex flex-column gap-2">
            <label class="font-medium">โรงพยาบาลที่ส่งต่อ</label>
            <Select
              v-model="selectedHospitalId"
              :options="lookups.hospitals"
              optionLabel="hospital_name_th"
              optionValue="hospital_id"
              placeholder="เลือกโรงพยาบาล"
              class="w-full"
              showClear
              filter
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ── Step 4: Medicines ── -->
    <div v-else-if="currentStep === 4">
      <div class="flex gap-2 mb-3 align-items-end flex-wrap">
        <div class="flex flex-column gap-1 flex-1" style="min-width: 220px">
          <label class="text-sm font-medium">ค้นหายา/อุปกรณ์</label>
          <AutoComplete
            v-model="itemSearchText"
            :suggestions="itemSuggestions"
            optionLabel="item_name_en"
            placeholder="พิมพ์ชื่อหรือรหัส..."
            class="w-full"
            @complete="searchItem"
            @item-select="(e) => { selectedItem = e.value; newItemQty = 1 }"
            forceSelection
          >
            <template #option="{ option }">
              <div class="flex justify-content-between gap-3">
                <span>{{ option.item_code }} — {{ option.item_name_en }}</span>
                <Tag :value="`Stock: ${option.qty_base ?? 0}`" :severity="(option.qty_base ?? 0) > 0 ? 'success' : 'danger'" />
              </div>
            </template>
          </AutoComplete>
        </div>
        <div class="flex flex-column gap-1" style="width: 130px">
          <label class="text-sm font-medium">จำนวน</label>
          <InputNumber v-model="newItemQty" :min="1" :max="999" class="w-full" />
        </div>
        <Button icon="pi pi-plus" label="เพิ่ม" severity="success" :disabled="!selectedItem" @click="addItemRow" />
      </div>

      <DataTable :value="usageRows" class="p-datatable-sm" emptyMessage="ยังไม่มีรายการยา">
        <Column header="#" style="width: 3rem">
          <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column field="item_code" header="รหัส" style="width: 8rem" />
        <Column field="item_name_en" header="ชื่อยา/อุปกรณ์" />
        <Column field="stock_qty" header="Stock คงเหลือ" style="width: 9rem">
          <template #body="{ data }">
            <Tag :value="String(data.stock_qty)" :severity="data.stock_qty > 0 ? 'success' : 'danger'" />
          </template>
        </Column>
        <Column field="qty_base" header="จำนวนที่ใช้" style="width: 9rem">
          <template #body="{ data }">
            <InputNumber v-model="data.qty_base" :min="1" :max="data.stock_qty" class="w-full" :inputStyle="{ textAlign: 'center' }" />
          </template>
        </Column>
        <Column header="" style="width: 4rem">
          <template #body="{ index }">
            <Button icon="pi pi-trash" severity="danger" text rounded @click="removeItemRow(index)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ── Step 5: Nursing Advice & Save ── -->
    <div v-else-if="currentStep === 5">
      <div class="mb-4">
        <div class="surface-100 border-round p-3 mb-3">
          <div class="font-semibold mb-2">สรุปข้อมูลก่อนบันทึก</div>
          <div class="grid text-sm">
            <div class="col-3 text-color-secondary">ผู้ป่วย</div>
            <div class="col-9 font-medium">{{ patientName }} <Tag :value="patientTab === 'EMP' ? 'พนักงาน' : 'บุคคลภายนอก'" :severity="patientTab === 'EMP' ? 'info' : 'warning'" class="ml-2 text-xs" /></div>
            <div class="col-3 text-color-secondary">วันที่</div>
            <div class="col-9">{{ formatDate(visitDatetime.toISOString()) }}</div>
            <div class="col-3 text-color-secondary">อาการ</div>
            <div class="col-9">{{ symptoms || '-' }}</div>
            <div class="col-3 text-color-secondary">รายการยา</div>
            <div class="col-9">{{ usageRows.length }} รายการ</div>
          </div>
        </div>

        <label class="font-medium block mb-2">คำแนะนำพยาบาล</label>
        <Textarea v-model="nursingAdvice" rows="4" class="w-full" placeholder="บันทึกคำแนะนำ..." autoResize />
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="flex justify-content-between mt-4">
      <Button
        v-if="currentStep > 0"
        label="ย้อนกลับ"
        icon="pi pi-arrow-left"
        severity="secondary"
        @click="prevStep"
      />
      <div v-else />

      <Button
        v-if="currentStep < steps.length - 1"
        label="ถัดไป"
        icon="pi pi-arrow-right"
        iconPos="right"
        @click="nextStep"
      />
      <Button
        v-else
        label="บันทึกการรักษา"
        icon="pi pi-save"
        severity="success"
        :loading="saving"
        @click="saveVisit"
      />
    </div>
  </div>

  <!-- ── Register External Person Dialog ── -->
  <Dialog v-model:visible="showRegisterDialog" header="ลงทะเบียนบุคคลภายนอก" modal style="width: 500px">
    <div class="flex flex-column gap-3">
      <div class="flex flex-column gap-1">
        <label class="font-medium">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
        <InputText v-model="registerForm.full_name" placeholder="ชื่อ-นามสกุล" class="w-full" />
      </div>
      <div class="flex flex-column gap-1">
        <label class="font-medium">บริษัท/หน่วยงาน</label>
        <InputText v-model="registerForm.company" placeholder="บริษัทหรือหน่วยงาน" class="w-full" />
      </div>
      <div class="grid">
        <div class="col-6 flex flex-column gap-1">
          <label class="font-medium">เลขบัตรประชาชน</label>
          <InputText v-model="registerForm.national_id" placeholder="13 หลัก" class="w-full" maxlength="13" />
        </div>
        <div class="col-6 flex flex-column gap-1">
          <label class="font-medium">เลขพาสปอร์ต</label>
          <InputText v-model="registerForm.passport_no" placeholder="Passport No." class="w-full" />
        </div>
      </div>
      <div class="flex flex-column gap-1">
        <label class="font-medium">เบอร์โทรศัพท์</label>
        <InputText v-model="registerForm.phone" placeholder="0812345678" class="w-full" />
      </div>
    </div>
    <template #footer>
      <Button label="ยกเลิก" severity="secondary" @click="showRegisterDialog = false" />
      <Button label="ลงทะเบียน" icon="pi pi-save" severity="success" :loading="registerLoading" @click="saveExternalPerson" />
    </template>
  </Dialog>
</template>
