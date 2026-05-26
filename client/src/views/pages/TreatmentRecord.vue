<script lang="ts" setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { TreatmentService } from '@/services/treatment.service';
  import { StockService, type IStockOnHand } from '@/services/stock.service';
  import EmployeeService from '@/services/employee.service';
  import { formatDate, formatDateTime } from '@/utils/format.utils';
  import type { IViewEmployee } from '@/shared/template-web-stack-2025/employee.interface';
  import type {
    ITreatmentLookups,
    IDiseaseSubGroup,
    IExternalPerson,
    ICreateExternalPersonBody,
    IVisitUsageForm,
    IPatientProfile,
    IPatientAllergy,
    IPatientUnderlyingDisease,
    IVisitListItem,
    IVisitDetail,
    IVisitUsage,
    IVitals,
    IUpdateUsageItem,
    IUpdateVisitBody,
  } from '@/interfaces/treatment.interfaces';
  import { ReferService } from '@/services/refer.service';
  import type {
    IReferCase,
    IReferFollowup,
  } from '@/interfaces/treatment.interfaces';
  import Swal from 'sweetalert2';

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function nowTimeStr() {
    return new Date().toTimeString().slice(0, 5);
  }

  // ─── Lookups ────────────────────────────────────────────────────────────────
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

  // ─── Patient search ─────────────────────────────────────────────────────────
  const patientTab = ref<'EMP' | 'EXT'>('EMP');

  const empInputText = ref('');
  const empSuggestions = ref<IViewEmployee[]>([]);
  const selectedEmployee = ref<IViewEmployee | null>(null);

  const extInputText = ref('');
  const extSuggestions = ref<IExternalPerson[]>([]);
  const selectedExtPerson = ref<IExternalPerson | null>(null);

  const showRegisterDialog = ref(false);
  const registerForm = ref<ICreateExternalPersonBody>({
    full_name: '',
    company: '',
    national_id: '',
    passport_no: '',
    phone: '',
  });
  const registerLoading = ref(false);

  // ─── Patient Profile ────────────────────────────────────────────────────────
  const patientProfile = ref<IPatientProfile | null>(null);
  const profileLoading = ref(false);

  // ─── Visit Info ─────────────────────────────────────────────────────────────
  const visitDate = ref(todayStr());
  const visitTime = ref(nowTimeStr());
  const activeTab = ref('0');

  // ─── Vitals (PRD-spec key names) ────────────────────────────────────────────
  const vitals = ref({
    bp_systolic: undefined as number | undefined,
    bp_diastolic: undefined as number | undefined,
    pulse: undefined as number | undefined,
    temp_c: undefined as number | undefined,
    spo2: undefined as number | undefined,
    rr: undefined as number | undefined,
    weight_kg: undefined as number | undefined,
    height_cm: undefined as number | undefined,
  });

  const bmi = computed<number | null>(() => {
    const w = vitals.value.weight_kg;
    const h = vitals.value.height_cm;
    if (!w || !h || h <= 0) return null;
    return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
  });

  function getBmiCategory(
    bmiVal: number | null
  ): { label: string; severity: 'success' | 'warn' | 'danger' } | null {
    if (bmiVal === null || bmiVal === undefined) return null;
    if (bmiVal < 18.5) return { label: 'Underweight (ผอม)', severity: 'warn' };
    if (bmiVal < 23) return { label: 'Normal (สมส่วน)', severity: 'success' };
    if (bmiVal < 27.5)
      return { label: 'Overweight (น้ำหนักเกิน)', severity: 'warn' };
    return { label: 'Obese (อ้วน)', severity: 'danger' };
  }

  const bmiCategory = computed(() => getBmiCategory(bmi.value));

  // ─── Treatment Record ───────────────────────────────────────────────────────
  const symptoms = ref('');
  const selectedGroupId = ref<number | null>(null);
  const selectedDiseaseId = ref<number | null>(null);
  const selectedTreatmentTypeId = ref<number | null>(null);
  const workRelatedFlag = ref(false);
  const accidentInWorkFlag = ref(false);
  const referFlag = ref(false);
  const selectedReferTypeId = ref<number | null>(null);
  const nursingAdvice = ref('');

  const filteredDiseaseSubGroups = computed<IDiseaseSubGroup[]>(() => {
    if (!selectedGroupId.value) return [];
    return lookups.value.disease_sub_groups.filter(
      d => d.group_id === selectedGroupId.value
    );
  });

  const isReferTreatment = computed(() => {
    if (!selectedTreatmentTypeId.value) return false;
    const tt = lookups.value.treatment_types.find(
      t => t.id === selectedTreatmentTypeId.value
    );
    return !!tt?.name_en?.toLowerCase().includes('refer');
  });

  watch(isReferTreatment, val => {
    referFlag.value = val;
    if (!val) selectedReferTypeId.value = null;
  });

  // ─── Medication ─────────────────────────────────────────────────────────────
  const hasMedication = ref<boolean | null>(null);
  const medicationOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];
  const yesNoOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  const medicineInputText = ref('');
  const medicineSuggest = ref<IStockOnHand[]>([]);
  const selectedMedicine = ref<IStockOnHand | null>(null);
  const medicineQty = ref(1);
  const medicineRows = ref<IVisitUsageForm[]>([]);

  const supplyInputText = ref('');
  const supplySuggest = ref<IStockOnHand[]>([]);
  const selectedSupply = ref<IStockOnHand | null>(null);
  const supplyQty = ref(1);
  const supplyRows = ref<IVisitUsageForm[]>([]);

  const saving = ref(false);

  // ─── Visit History (Tab 2) ───────────────────────────────────────────────
  const historyVisits = ref<IVisitListItem[]>([]);
  const historyLoading = ref(false);
  const showHistoryDetail = ref(false);
  const historyDetailVisit = ref<IVisitDetail | null>(null);
  const historyDetailUsages = ref<IVisitUsage[]>([]);
  const historyDetailLoading = ref(false);
  const activeHistoryDetailTab = ref('0');

  // ─── History Edit Mode ───────────────────────────────────────────────────────
  interface IEditVisitForm {
    symptoms: string;
    nursing_advice: string;
    group_id: number | null;
    disease_id: number | null;
    treatment_type_id: number | null;
    accident_in_work_flag: boolean;
    work_related_flag: boolean;
    refer_flag: boolean;
    refer_type_id: number | null;
    severity_id: number | null;
  }
  interface IEditUsageRow {
    visit_usage_id: number | null;
    item_id: number;
    item_name: string;
    item_name_th: string;
    item_code: string;
    unit_name: string;
    qty_base: number;
    stock_qty: number;
    is_deleted: boolean;
    is_new: boolean;
  }

  const historyEditMode = ref(false);
  const historyEditForm = ref<IEditVisitForm>({
    symptoms: '',
    nursing_advice: '',
    group_id: null,
    disease_id: null,
    treatment_type_id: null,
    accident_in_work_flag: false,
    work_related_flag: false,
    refer_flag: false,
    refer_type_id: null,
    severity_id: null,
  });
  const historyEditVitals = ref<IVitals>({});
  const historyEditUsages = ref<IEditUsageRow[]>([]);
  const historyEditReason = ref('');
  const historyEditReasonInvalid = ref(false);
  const historyEditSaving = ref(false);
  const historyDeleting = ref(false);
  const lastStockCountDate = ref<string | null | undefined>(undefined);
  const historyEditNewItem = ref<IStockOnHand | null>(null);
  const historyEditNewItemText = ref('');
  const historyEditNewItemSuggest = ref<IStockOnHand[]>([]);
  const historyEditNewQty = ref<number>(1);

  // ─── Refer (Tab 3) ───────────────────────────────────────────────────────────
  const referCases = ref<IReferCase[]>([]);
  const referLoading = ref(false);
  const referFilter = ref<'ALL' | 'OPEN' | 'CLOSED'>('OPEN');
  const referFilterOptions = [
    { label: 'All (ทั้งหมด)', value: 'ALL' },
    { label: 'Open (เปิด)', value: 'OPEN' },
    { label: 'Closed (ปิด)', value: 'CLOSED' },
  ];
  const referTypeFilter = ref<number | null>(null);
  const referTypeFilterOptions = computed(() => {
    const seen = new Set<number>();
    const opts: { label: string; value: number }[] = [];
    for (const rc of referCases.value) {
      if (!seen.has(rc.refer_type_id)) {
        seen.add(rc.refer_type_id);
        opts.push({ label: rc.refer_name_en, value: rc.refer_type_id });
      }
    }
    return opts;
  });
  const filteredReferCases = computed(() => {
    let list = referCases.value;
    if (referFilter.value === 'OPEN')
      list = list.filter(rc => rc.status === 'OPEN');
    else if (referFilter.value === 'CLOSED')
      list = list.filter(
        rc => rc.status === 'CLOSED' || rc.status === 'CANCELLED'
      );
    if (referTypeFilter.value !== null)
      list = list.filter(rc => rc.refer_type_id === referTypeFilter.value);
    return list;
  });
  const expandedCaseId = ref<number | null>(null);
  const followupsByCaseId = ref<Record<number, IReferFollowup[]>>({});
  const followupsLoadingId = ref<number | null>(null);

  const showCaseDialog = ref(false);
  const caseEditId = ref<number | null>(null);
  const caseSaving = ref(false);
  const caseForm = ref({
    visit_id: null as number | null,
    refer_type_id: null as number | null,
    refer_reason: '',
    opened_at: '',
  });

  const showFollowupDialog = ref(false);
  const followupEditId = ref<number | null>(null);
  const followupForCaseId = ref<number | null>(null);
  const followupSaving = ref(false);
  const followupForm = ref({
    followup_at: '',
    hospital_id: null as number | null,
    room_no: '',
    outcome: 'FOLLOWUP_ONLY',
    back_to_work_date: '',
    followup_note: '',
    next_appointment_at: '',
    treatment_cost: null as number | null,
  });

  const outcomeOptions = [
    { label: 'Follow-up Only (ติดตามผลต่อ)', value: 'FOLLOWUP_ONLY' },
    { label: 'Admission (รับตัวไว้ในโรงพยาบาล)', value: 'ADMISSION' },
    { label: 'Discharged Home (กลับบ้าน)', value: 'BACK_TO_HOME' },
    { label: 'Return to Work (กลับเข้าทำงาน)', value: 'BACK_TO_COMPANY' },
  ];

  function outcomeSeverity(outcome: string) {
    const m: Record<string, string> = {
      FOLLOWUP_ONLY: 'info',
      ADMISSION: 'danger',
      BACK_TO_HOME: 'warn',
      BACK_TO_COMPANY: 'success',
    };
    return m[outcome] ?? 'secondary';
  }

  function outcomeLabel(outcome: string) {
    return outcomeOptions.find(o => o.value === outcome)?.label ?? outcome;
  }

  const historyParsedVitals = computed<IVitals>(() => {
    if (!historyDetailVisit.value?.vitals_json) return {};
    try {
      return JSON.parse(historyDetailVisit.value.vitals_json);
    } catch {
      return {};
    }
  });

  const canEditUsages = computed<boolean>(() => {
    if (lastStockCountDate.value === undefined || !lastStockCountDate.value)
      return true;
    if (!historyDetailVisit.value) return false;
    return (
      new Date(historyDetailVisit.value.visit_datetime) >=
      new Date(lastStockCountDate.value)
    );
  });

  const historyEditFilteredSubGroups = computed<IDiseaseSubGroup[]>(() => {
    if (!historyEditForm.value.group_id) return [];
    return lookups.value.disease_sub_groups.filter(
      d => d.group_id === historyEditForm.value.group_id
    );
  });

  const isReferTreatmentEdit = computed(() => {
    if (!historyEditForm.value.treatment_type_id) return false;
    const tt = lookups.value.treatment_types.find(
      t => t.id === historyEditForm.value.treatment_type_id
    );
    return !!tt?.name_en?.toLowerCase().includes('refer');
  });

  watch(isReferTreatmentEdit, val => {
    historyEditForm.value.refer_flag = val;
    if (!val) historyEditForm.value.refer_type_id = null;
  });

  function historyTreatmentSeverity(code: string) {
    const map: Record<string, string> = {
      REST: 'info',
      DRESSING: 'warn',
      SEND_HOME: 'secondary',
      DISPENSE: 'success',
      EYE_WASH: 'contrast',
    };
    return map[code] || 'secondary';
  }

  function historyDiseaseGroupNameEn(name?: string | null): string {
    if (!name) return '-';
    const found = lookups.value.disease_groups.find(
      g => g.name_th === name || g.name_en === name
    );
    return found?.name_en || '-';
  }

  function historyTreatmentTypeNameEn(data: {
    treatment_code?: string | null;
    treatment_type_name?: string | null;
  }): string {
    if (!data?.treatment_type_name) return '-';
    const byCode = data.treatment_code
      ? lookups.value.treatment_types.find(t => t.code === data.treatment_code)
      : undefined;
    if (byCode?.name_en) return byCode.name_en;
    const byName = lookups.value.treatment_types.find(
      t =>
        t.name_th === data.treatment_type_name ||
        t.name_en === data.treatment_type_name
    );
    return byName?.name_en || '-';
  }

  function referDiseaseLabelEn(
    groupName?: string | null,
    subGroupName?: string | null
  ): string {
    const groupEn = groupName
      ? lookups.value.disease_groups.find(
          g => g.name_th === groupName || g.name_en === groupName
        )?.name_en
      : '';
    const subGroupEn = subGroupName
      ? lookups.value.disease_sub_groups.find(
          s => s.name_th === subGroupName || s.name_en === subGroupName
        )?.name_en
      : '';

    if (groupEn && subGroupEn) return `${groupEn} · ${subGroupEn}`;
    if (groupEn) return groupEn;
    if (subGroupEn) return subGroupEn;
    return '-';
  }

  function diseaseLabel(opt: any): string {
    return opt?.name_en
      ? `${opt.name_en} (${opt.name_th})`
      : (opt?.name_th ?? '');
  }

  function itemLabel(opt: any): string {
    if (!opt) return '';
    const en = opt.item_name_en ?? opt.name_en ?? opt.item_name;
    const th = opt.item_name_th ?? opt.name_th ?? '';
    if (en) return en + (th ? ` (${th})` : '');
    return th || (opt.item_name ?? '');
  }

  // ─── Computed helpers ───────────────────────────────────────────────────────
  const patientName = computed(() =>
    patientTab.value === 'EMP'
      ? selectedEmployee.value?.thai_name || '-'
      : selectedExtPerson.value?.full_name || '-'
  );

  const patientDept = computed(() =>
    patientTab.value === 'EMP'
      ? (selectedEmployee.value as any)?.section_name || ''
      : selectedExtPerson.value?.company || ''
  );

  const patientInitials = computed(() => {
    const name = patientName.value;
    if (!name || name === '-') return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? parts[0].charAt(0) + parts[1].charAt(0)
      : name.charAt(0);
  });

  // ─── onMounted ──────────────────────────────────────────────────────────────
  onMounted(async () => {
    try {
      const [lk, stock, emps, lastDate] = await Promise.all([
        TreatmentService.getLookups(),
        StockService.getStockStatus(),
        new EmployeeService().findAll(),
        TreatmentService.getLastStockCountDate().catch(() => null),
      ]);
      lookups.value = lk;
      stockItems.value = stock;
      employees.value = emps;
      lastStockCountDate.value = lastDate;
    } catch (err: any) {
      console.error('TreatmentRecord load error:', err);
    }
  });

  // ─── Patient tab switch ─────────────────────────────────────────────────────
  function switchPatientTab(tab: 'EMP' | 'EXT') {
    patientTab.value = tab;
    selectedEmployee.value = null;
    selectedExtPerson.value = null;
    empInputText.value = '';
    extInputText.value = '';
    patientProfile.value = null;
  }

  // ─── Employee search ────────────────────────────────────────────────────────
  function searchEmployee(event: { query: string }) {
    const q = event.query.toLowerCase();
    empSuggestions.value = employees.value
      .filter(
        e =>
          e.thai_name?.toLowerCase().includes(q) ||
          e.ID?.toLowerCase().includes(q) ||
          e.eng_name?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }

  async function onSelectEmployee(event: { value: IViewEmployee }) {
    selectedEmployee.value = event.value;
    await loadPatientProfile();
  }

  // ─── External person search ─────────────────────────────────────────────────
  async function searchExtPerson(event: { query: string }) {
    if (event.query.length < 2) {
      extSuggestions.value = [];
      return;
    }
    try {
      extSuggestions.value = await TreatmentService.searchExternalPeople(
        event.query
      );
    } catch {
      extSuggestions.value = [];
    }
  }

  async function onSelectExtPerson(event: { value: IExternalPerson }) {
    selectedExtPerson.value = event.value;
    await loadPatientProfile();
  }

  // ─── Load patient profile (auto on select) ──────────────────────────────────
  async function loadPatientProfile() {
    const isEmp = patientTab.value === 'EMP';
    if (isEmp && !selectedEmployee.value) return;
    if (!isEmp && !selectedExtPerson.value) return;
    profileLoading.value = true;
    try {
      const params = isEmp
        ? {
            patient_type: 'EMP' as const,
            employee_id: selectedEmployee.value!.ID,
          }
        : {
            patient_type: 'EXT' as const,
            external_person_id: selectedExtPerson.value!.external_person_id,
          };
      patientProfile.value = await TreatmentService.getPatientProfile(params);
      referCases.value = [];
      expandedCaseId.value = null;
      followupsByCaseId.value = {};
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถโหลดข้อมูลผู้ป่วยได้',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      profileLoading.value = false;
    }
  }

  // ─── Register external person ───────────────────────────────────────────────
  function openRegisterDialog() {
    registerForm.value = {
      full_name: extInputText.value,
      company: '',
      national_id: '',
      passport_no: '',
      phone: '',
    };
    showRegisterDialog.value = true;
  }

  async function saveExternalPerson() {
    if (!registerForm.value.full_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อ-นามสกุล',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    registerLoading.value = true;
    try {
      const res = await TreatmentService.createExternalPerson(
        registerForm.value
      );
      const list = await TreatmentService.searchExternalPeople(
        registerForm.value.full_name
      );
      const created =
        list.find(p => p.external_person_id === res.external_person_id) ??
        list[0];
      if (created) {
        selectedExtPerson.value = created;
        extInputText.value = created.full_name;
        await loadPatientProfile();
      }
      showRegisterDialog.value = false;
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      registerLoading.value = false;
    }
  }

  // ─── Item search ────────────────────────────────────────────────────────────
  function searchItems(event: { query: string }, type: 'MEDICINE' | 'SUPPLY') {
    const q = event.query.toLowerCase();
    const results = stockItems.value
      .filter(
        i =>
          i.item_name_en?.toLowerCase().includes(q) ||
          i.item_name_th?.toLowerCase().includes(q) ||
          i.item_code?.toLowerCase().includes(q)
      )
      .slice(0, 10);
    if (type === 'MEDICINE') medicineSuggest.value = results;
    else supplySuggest.value = results;
  }

  // ─── Add item row ───────────────────────────────────────────────────────────
  async function addItem(type: 'MEDICINE' | 'SUPPLY') {
    const item =
      type === 'MEDICINE' ? selectedMedicine.value : selectedSupply.value;
    const qty = type === 'MEDICINE' ? medicineQty.value : supplyQty.value;
    const rows = type === 'MEDICINE' ? medicineRows : supplyRows;

    if (!item) return;
    if (qty < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'จำนวนต้องมากกว่า 0',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if ((item.qty_base ?? 0) < qty) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock ไม่เพียงพอ',
        text: `คงเหลือ ${item.qty_base ?? 0} หน่วย`,
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    const allergyMatch = patientProfile.value?.allergies.find(
      a => a.item_id != null && a.item_id === item.item_id
    );
    if (allergyMatch) {
      const severityTh: Record<string, string> = {
        LIFE_THREATENING: 'รุนแรงถึงชีวิต ⛔',
        SEVERE: 'รุนแรงมาก',
        MODERATE: 'ปานกลาง',
        MILD: 'น้อย',
      };
      const result = await Swal.fire({
        icon: 'warning',
        title: '⚠️ ผู้ป่วยแพ้ยานี้!',
        html: `<p style="text-align:left"><strong>ยา:</strong> ${allergyMatch.drug_name}</p>
               <p style="text-align:left"><strong>อาการ:</strong> ${allergyMatch.reaction || '-'}</p>
               <p style="text-align:left"><strong>ความรุนแรง:</strong> ${severityTh[allergyMatch.severity] || allergyMatch.severity}</p>`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยันจ่ายยาต่อ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
      });
      if (!result.isConfirmed) return;
    }

    const existing = rows.value.find(r => r.item_id === item.item_id);
    if (existing) {
      Swal.fire({
        icon: 'warning',
        title: 'รายการนี้มีอยู่ในรายการแล้ว',
        text: 'กรุณากดลบรายการเดิมก่อน หากต้องการเปลี่ยนจำนวน',
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }
    rows.value.push({
      item_id: item.item_id,
      item_code: item.item_code,
      item_name_en: item.item_name_en,
      item_name_th: item.item_name_th,
      unit_name: item.usage_unit_name_th || '',
      stock_qty: item.qty_base ?? 0,
      qty_base: qty,
    });

    if (type === 'MEDICINE') {
      selectedMedicine.value = null;
      medicineInputText.value = '';
      medicineQty.value = 1;
    } else {
      selectedSupply.value = null;
      supplyInputText.value = '';
      supplyQty.value = 1;
    }
  }

  function removeItem(type: 'MEDICINE' | 'SUPPLY', index: number) {
    if (type === 'MEDICINE') medicineRows.value.splice(index, 1);
    else supplyRows.value.splice(index, 1);
  }

  // ─── Save ───────────────────────────────────────────────────────────────────
  async function saveVisit() {
    if (!patientProfile.value) return;
    if (!nursingAdvice.value.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกคำแนะนำจากพยาบาล',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const allRows = [...medicineRows.value, ...supplyRows.value];
    const overStock = allRows.find(r => r.qty_base > r.stock_qty);
    if (overStock) {
      Swal.fire({
        icon: 'error',
        title: 'Stock ไม่เพียงพอ',
        text: `${overStock.item_name_th || overStock.item_name_en}: ขอเบิก ${overStock.qty_base} แต่คงเหลือ ${overStock.stock_qty} ${overStock.unit_name}`,
      });
      return;
    }
    saving.value = true;
    try {
      const visitDatetime = new Date(
        `${visitDate.value}T${visitTime.value}:00`
      );
      await TreatmentService.createVisit({
        patient_type: patientTab.value,
        employee_id:
          patientTab.value === 'EMP' ? selectedEmployee.value?.ID : undefined,
        external_person_id:
          patientTab.value === 'EXT'
            ? selectedExtPerson.value?.external_person_id
            : undefined,
        visit_datetime: visitDatetime.toISOString(),
        symptoms: symptoms.value || undefined,
        vitals_json: JSON.stringify(vitals.value),
        group_id: selectedGroupId.value || undefined,
        disease_id: selectedDiseaseId.value || undefined,
        treatment_type_id: selectedTreatmentTypeId.value || undefined,
        nursing_advice: nursingAdvice.value || undefined,
        accident_in_work_flag: accidentInWorkFlag.value,
        work_related_flag: workRelatedFlag.value,
        refer_flag: referFlag.value,
        refer_type_id: referFlag.value
          ? selectedReferTypeId.value || undefined
          : undefined,
        usages:
          hasMedication.value === true
            ? [...medicineRows.value, ...supplyRows.value].map(r => ({
                item_id: r.item_id,
                qty_base: r.qty_base,
              }))
            : [],
      });
      await Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1800,
        showConfirmButton: false,
      });
      resetForm();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      saving.value = false;
    }
  }

  // ─── Allergy Dialog ─────────────────────────────────────────────────────
  const createAllergyForm = () => ({
    allergy_type: 'DRUG' as IPatientAllergy['allergy_type'],
    allergy_name: '',
    item_id: undefined as number | undefined,
    reaction: '',
    severity: 'MILD' as IPatientAllergy['severity'],
    source: 'SELF_REPORT',
  });

  const showAllergyDialog = ref(false);
  const allergyEditId = ref<number | null>(null);
  const allergyForm = ref(createAllergyForm());
  const allergyNameInput = ref('');
  const allergyNameSuggest = ref<IStockOnHand[]>([]);
  const allergyUseStockItem = ref(true);
  const allergySaving = ref(false);

  const allergyTypeOptions = [
    { label: 'Drug (ยา)', value: 'DRUG' },
    { label: 'Food (อาหาร)', value: 'FOOD' },
    { label: 'Other Substance (สารอื่น)', value: 'SUBSTANCE' },
    { label: 'Other (อื่นๆ)', value: 'OTHER' },
  ];
  const severityOptions = [
    { label: 'Mild (น้อย)', value: 'MILD' },
    { label: 'Moderate (ปานกลาง)', value: 'MODERATE' },
    { label: 'Severe (รุนแรง)', value: 'SEVERE' },
    { label: 'Life-threatening (รุนแรงถึงชีวิต)', value: 'LIFE_THREATENING' },
  ];
  const sourceOptions = [
    { label: 'Self-report (แจ้งด้วยตนเอง)', value: 'SELF_REPORT' },
    { label: 'Medical Record (เวชระเบียน)', value: 'MEDICAL_RECORD' },
    { label: 'Reported by Relative (ญาติแจ้ง)', value: 'RELATIVE' },
  ];

  watch(allergyNameInput, value => {
    if (!allergyUseStockItem.value) return;
    const previousName = allergyForm.value.allergy_name;
    allergyForm.value.allergy_name = value;
    if (!value || value !== previousName) {
      allergyForm.value.item_id = undefined;
    }
  });

  watch(allergyUseStockItem, useStock => {
    if (!useStock) {
      allergyForm.value.item_id = undefined;
    }
    allergyNameInput.value = allergyForm.value.allergy_name;
  });

  function resetAllergyEditor() {
    allergyEditId.value = null;
    allergyForm.value = createAllergyForm();
    allergyNameInput.value = '';
    allergyNameSuggest.value = [];
    allergyUseStockItem.value = true;
  }

  function openAllergyDialog(allergy?: IPatientAllergy) {
    if (!allergy) {
      resetAllergyEditor();
    } else {
      allergyEditId.value = allergy.allergy_id;
      allergyForm.value = {
        allergy_type: allergy.allergy_type ?? 'DRUG',
        allergy_name: allergy.drug_name ?? '',
        item_id: allergy.item_id ?? undefined,
        reaction: allergy.reaction ?? '',
        severity: allergy.severity ?? 'MILD',
        source: allergy.source ?? 'SELF_REPORT',
      };
      allergyNameInput.value = allergy.drug_name ?? '';
      allergyNameSuggest.value = [];
      allergyUseStockItem.value = allergy.item_id != null;
    }
    showAllergyDialog.value = true;
  }

  function searchAllergyItem(event: { query: string }) {
    const q = event.query.toLowerCase();
    allergyNameSuggest.value = stockItems.value
      .filter(
        i =>
          i.item_name_en?.toLowerCase().includes(q) ||
          i.item_name_th?.toLowerCase().includes(q) ||
          i.item_code?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }

  function onSelectAllergyItem(event: { value: IStockOnHand }) {
    const name = event.value.item_name_en || event.value.item_name_th;
    allergyNameInput.value = name;
    allergyForm.value.allergy_name = name;
    allergyForm.value.item_id = event.value.item_id;
  }

  async function saveAllergy() {
    if (!patientProfile.value || !allergyForm.value.allergy_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อยาที่แพ้',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    allergySaving.value = true;
    try {
      await TreatmentService.upsertAllergy({
        allergy_id: allergyEditId.value ?? undefined,
        patient_id: patientProfile.value.patient_id,
        allergy_type: allergyForm.value.allergy_type,
        allergy_name: allergyForm.value.allergy_name,
        item_id: allergyUseStockItem.value
          ? allergyForm.value.item_id
          : undefined,
        reaction: allergyForm.value.reaction || undefined,
        severity: allergyForm.value.severity,
        source: allergyForm.value.source,
      });
      await loadPatientProfile();
      resetAllergyEditor();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      allergySaving.value = false;
    }
  }

  async function confirmDeleteAllergy(allergy: IPatientAllergy) {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบ "${allergy.drug_name}"?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { container: 'swal-on-top' },
    });
    if (!result.isConfirmed || !patientProfile.value) return;
    try {
      await TreatmentService.deleteAllergy(
        allergy.allergy_id,
        patientProfile.value.patient_id
      );
      await loadPatientProfile();
      if (allergyEditId.value === allergy.allergy_id) {
        resetAllergyEditor();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    }
  }

  // ─── Disease Dialog ──────────────────────────────────────────────────────
  const createDiseaseForm = () => ({
    disease_name: '',
    group_id: null as number | null,
    sub_group_id: null as number | null,
    diagnosed_year: null as number | null,
    control_status: '',
    note: '',
  });

  const showDiseaseDialog = ref(false);
  const diseaseEditId = ref<number | null>(null);
  const diseaseForm = ref(createDiseaseForm());
  const diseaseSaving = ref(false);

  const controlStatusOptions = [
    { label: 'Controlled (ควบคุมได้)', value: 'CONTROLLED' },
    { label: 'Uncontrolled (ควบคุมไม่ได้)', value: 'UNCONTROLLED' },
    { label: 'Unknown (ไม่ทราบ)', value: 'UNKNOWN' },
  ];

  const filteredSubGroupsForDialog = computed<IDiseaseSubGroup[]>(() => {
    if (!diseaseForm.value.group_id) return [];
    return lookups.value.disease_sub_groups.filter(
      d => d.group_id === diseaseForm.value.group_id
    );
  });

  function resetDiseaseEditor() {
    diseaseEditId.value = null;
    diseaseForm.value = createDiseaseForm();
  }

  function onSelectDiseaseGroup() {
    diseaseForm.value.sub_group_id = null;
  }

  function onSelectDiseaseSubGroup() {
    const sg = lookups.value.disease_sub_groups.find(
      s => s.id === diseaseForm.value.sub_group_id
    );
    if (sg && !diseaseForm.value.disease_name.trim()) {
      diseaseForm.value.disease_name = sg.name_th;
    }
  }

  function openDiseaseDialog(disease?: IPatientUnderlyingDisease) {
    if (!disease) {
      resetDiseaseEditor();
    } else {
      diseaseEditId.value = disease.condition_id;
      const sg = disease.sub_group_id
        ? lookups.value.disease_sub_groups.find(
            s => s.id === disease.sub_group_id
          )
        : null;
      diseaseForm.value = {
        disease_name: disease.disease_name ?? '',
        group_id: sg?.group_id ?? null,
        sub_group_id: disease.sub_group_id ?? null,
        diagnosed_year: disease.diagnosed_year ?? null,
        control_status: disease.control_status ?? '',
        note: '',
      };
    }
    showDiseaseDialog.value = true;
  }

  async function saveDisease() {
    if (!patientProfile.value || !diseaseForm.value.disease_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกชื่อโรค',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    diseaseSaving.value = true;
    try {
      await TreatmentService.upsertDisease({
        condition_id: diseaseEditId.value ?? undefined,
        patient_id: patientProfile.value.patient_id,
        disease_name: diseaseForm.value.disease_name,
        sub_group_id: diseaseForm.value.sub_group_id ?? undefined,
        diagnosed_year: diseaseForm.value.diagnosed_year ?? undefined,
        control_status: diseaseForm.value.control_status || undefined,
        note: diseaseForm.value.note || undefined,
      });
      await loadPatientProfile();
      resetDiseaseEditor();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      diseaseSaving.value = false;
    }
  }

  async function confirmDeleteDisease(disease: IPatientUnderlyingDisease) {
    const result = await Swal.fire({
      icon: 'warning',
      title: `ลบ "${disease.disease_name}"?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { container: 'swal-on-top' },
    });
    if (!result.isConfirmed || !patientProfile.value) return;
    try {
      await TreatmentService.deleteDisease(
        disease.condition_id,
        patientProfile.value.patient_id
      );
      await loadPatientProfile();
      if (diseaseEditId.value === disease.condition_id) {
        resetDiseaseEditor();
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    }
  }

  // ─── Refer functions ──────────────────────────────────────────────────────────
  async function loadReferCases() {
    if (!patientProfile.value?.patient_id) return;
    referLoading.value = true;
    referTypeFilter.value = null;
    try {
      referCases.value = await ReferService.getCasesByPatient(
        String(patientProfile.value.patient_id)
      );
    } catch (err: any) {
      console.error('loadReferCases error:', err);
    } finally {
      referLoading.value = false;
    }
  }

  async function toggleFollowups(caseId: number | null) {
    if (caseId === null) return;
    if (expandedCaseId.value === caseId) {
      expandedCaseId.value = null;
      return;
    }
    expandedCaseId.value = caseId;
    if (!followupsByCaseId.value[caseId]) {
      followupsLoadingId.value = caseId;
      try {
        followupsByCaseId.value[caseId] =
          await ReferService.getFollowupsByCase(caseId);
      } catch (err: any) {
        console.error('toggleFollowups error:', err);
      } finally {
        followupsLoadingId.value = null;
      }
    }
  }

  function openCaseDialog(rc?: IReferCase) {
    caseEditId.value = rc?.refer_case_id ?? null;
    caseForm.value = rc
      ? {
          visit_id: rc.visit_id,
          refer_type_id: rc.refer_type_id ?? null,
          refer_reason: rc.refer_reason ?? '',
          opened_at: rc.opened_at?.slice(0, 10) ?? '',
        }
      : {
          visit_id: historyVisits.value[0]?.visit_id ?? null,
          refer_type_id: null,
          refer_reason: '',
          opened_at: todayStr(),
        };
    showCaseDialog.value = true;
  }

  async function saveCase() {
    if (!caseForm.value.refer_type_id) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกประเภทการ Refer',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    caseSaving.value = true;
    try {
      if (caseEditId.value) {
        await ReferService.patchCase(caseEditId.value, {
          refer_type_id: caseForm.value.refer_type_id ?? undefined,
          refer_reason: caseForm.value.refer_reason || undefined,
        });
      } else {
        if (!caseForm.value.visit_id) {
          Swal.fire({
            icon: 'warning',
            title: 'กรุณาเลือก Visit',
            timer: 1500,
            showConfirmButton: false,
          });
          return;
        }
        await ReferService.createCase({
          visit_id: caseForm.value.visit_id,
          refer_type_id: caseForm.value.refer_type_id,
          refer_reason: caseForm.value.refer_reason || undefined,
          opened_at: caseForm.value.opened_at || undefined,
        });
      }
      await loadReferCases();
      showCaseDialog.value = false;
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      caseSaving.value = false;
    }
  }

  async function confirmDeleteCase(rc: IReferCase) {
    const r = await Swal.fire({
      icon: 'warning',
      title: `ลบ Refer #${rc.refer_no}?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { container: 'swal-on-top' },
    });
    if (!r.isConfirmed) return;
    try {
      await ReferService.deleteCase(rc.refer_case_id);
      if (expandedCaseId.value === rc.refer_case_id)
        expandedCaseId.value = null;
      await loadReferCases();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    }
  }

  function openFollowupDialog(caseId: number, fp?: IReferFollowup) {
    followupForCaseId.value = caseId;
    followupEditId.value = fp?.followup_id ?? null;
    followupForm.value = fp
      ? {
          followup_at: fp.followup_at?.slice(0, 10) ?? todayStr(),
          hospital_id: fp.hospital_id ?? null,
          room_no: fp.room_no ?? '',
          outcome: fp.outcome,
          back_to_work_date: fp.back_to_work_date?.slice(0, 10) ?? '',
          followup_note: fp.followup_note ?? '',
          next_appointment_at: fp.next_appointment_at
            ? fp.next_appointment_at.slice(0, 16)
            : '',
          treatment_cost: fp.treatment_cost ?? null,
        }
      : {
          followup_at: todayStr(),
          hospital_id: null,
          room_no: '',
          outcome: 'FOLLOWUP_ONLY',
          back_to_work_date: '',
          followup_note: '',
          next_appointment_at: '',
          treatment_cost: null,
        };
    showFollowupDialog.value = true;
  }

  async function saveFollowup() {
    if (!followupForm.value.followup_at) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุวันที่ติดตาม',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    if (!followupForm.value.followup_note?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกบันทึกการติดตาม',
        text: 'ต้องระบุรายละเอียดการติดตามทุกครั้ง',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (
      followupForm.value.outcome === 'BACK_TO_COMPANY' &&
      !followupForm.value.back_to_work_date
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุวันที่กลับทำงาน',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    followupSaving.value = true;
    try {
      const body = {
        followup_at: new Date(
          `${followupForm.value.followup_at}T00:00:00`
        ).toISOString(),
        hospital_id: followupForm.value.hospital_id ?? undefined,
        room_no: followupForm.value.room_no || undefined,
        outcome: followupForm.value.outcome,
        back_to_work_date: followupForm.value.back_to_work_date || undefined,
        followup_note: followupForm.value.followup_note || undefined,
        next_appointment_at: followupForm.value.next_appointment_at
          ? new Date(followupForm.value.next_appointment_at).toISOString()
          : undefined,
        treatment_cost: followupForm.value.treatment_cost ?? undefined,
      };
      if (followupEditId.value) {
        await ReferService.patchFollowup(followupEditId.value, body);
      } else {
        await ReferService.createFollowup({
          refer_case_id: followupForCaseId.value!,
          ...body,
        });
      }
      followupsByCaseId.value[followupForCaseId.value!] =
        await ReferService.getFollowupsByCase(followupForCaseId.value!);
      await loadReferCases();
      showFollowupDialog.value = false;
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      followupSaving.value = false;
    }
  }

  async function confirmDeleteFollowup(fp: IReferFollowup) {
    const r = await Swal.fire({
      icon: 'warning',
      title: `ลบ Follow-up #${fp.followup_no}?`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { container: 'swal-on-top' },
    });
    if (!r.isConfirmed) return;
    try {
      await ReferService.deleteFollowup(fp.followup_id);
      followupsByCaseId.value[fp.refer_case_id] =
        await ReferService.getFollowupsByCase(fp.refer_case_id);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
      });
    }
  }

  // Auto-create a refer_cases entry from an implicit visit-level refer, then open follow-up dialog
  async function beginTrackingCase(rc: IReferCase) {
    caseSaving.value = true;
    try {
      const res = await ReferService.createCase({
        visit_id: rc.visit_id,
        refer_type_id: rc.refer_type_id ?? undefined,
        opened_at: rc.opened_at ?? undefined,
      });
      const newCaseId: number = Array.isArray(res)
        ? res[0]?.refer_case_id
        : res?.refer_case_id;
      await loadReferCases();
      if (newCaseId) {
        expandedCaseId.value = newCaseId;
        openFollowupDialog(newCaseId);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเริ่มติดตาม',
        text: err?.response?.data?.message || err?.message,
      });
    } finally {
      caseSaving.value = false;
    }
  }

  function resetForm() {
    patientProfile.value = null;
    patientTab.value = 'EMP';
    selectedEmployee.value = null;
    selectedExtPerson.value = null;
    empInputText.value = '';
    extInputText.value = '';
    visitDate.value = todayStr();
    visitTime.value = nowTimeStr();
    symptoms.value = '';
    vitals.value = {
      bp_systolic: undefined,
      bp_diastolic: undefined,
      pulse: undefined,
      temp_c: undefined,
      spo2: undefined,
      rr: undefined,
      weight_kg: undefined,
      height_cm: undefined,
    };
    selectedGroupId.value = null;
    selectedDiseaseId.value = null;
    selectedTreatmentTypeId.value = null;
    workRelatedFlag.value = false;
    accidentInWorkFlag.value = false;
    referFlag.value = false;
    selectedReferTypeId.value = null;
    medicineRows.value = [];
    supplyRows.value = [];
    selectedMedicine.value = null;
    selectedSupply.value = null;
    medicineInputText.value = '';
    supplyInputText.value = '';
    nursingAdvice.value = '';
    hasMedication.value = null;
    activeTab.value = '0';
    showAllergyDialog.value = false;
    showDiseaseDialog.value = false;
    resetAllergyEditor();
    resetDiseaseEditor();
    historyVisits.value = [];
    historyLoading.value = false;
    showHistoryDetail.value = false;
    historyDetailVisit.value = null;
    historyDetailUsages.value = [];
    activeHistoryDetailTab.value = '0';
    referCases.value = [];
    expandedCaseId.value = null;
    followupsByCaseId.value = {};
    showCaseDialog.value = false;
    showFollowupDialog.value = false;
  }

  // ─── History tab watch + load ─────────────────────────────────────────────
  watch(activeTab, tab => {
    if (tab === '1' && patientProfile.value && !historyVisits.value.length) {
      loadPatientHistory();
    }
    if (tab === '2' && patientProfile.value) {
      if (!historyVisits.value.length) loadPatientHistory();
      loadReferCases();
    }
  });

  async function loadPatientHistory() {
    if (!patientProfile.value?.patient_id) return;
    historyLoading.value = true;
    try {
      historyVisits.value = await TreatmentService.getPatientVisitHistory(
        patientProfile.value.patient_id
      );
    } catch (err: any) {
      console.error('loadPatientHistory error:', err);
    } finally {
      historyLoading.value = false;
    }
  }

  async function openHistoryDetail(visit: IVisitListItem) {
    showHistoryDetail.value = true;
    historyDetailLoading.value = true;
    historyDetailVisit.value = null;
    historyDetailUsages.value = [];
    activeHistoryDetailTab.value = '0';
    try {
      const res = await TreatmentService.getVisitById(visit.visit_id);
      historyDetailVisit.value = res.visit;
      historyDetailUsages.value = res.usages;
    } catch (err: any) {
      console.error('openHistoryDetail error:', err);
    } finally {
      historyDetailLoading.value = false;
    }
  }

  function cancelHistoryEdit() {
    historyEditMode.value = false;
    historyEditReasonInvalid.value = false;
    historyEditNewItem.value = null;
    historyEditNewItemText.value = '';
    historyEditNewQty.value = 1;
  }

  async function enterHistoryEditMode() {
    if (!historyDetailVisit.value) return;
    const v = historyDetailVisit.value;
    historyEditForm.value = {
      symptoms: v.symptoms ?? '',
      nursing_advice: v.nursing_advice ?? '',
      group_id: v.group_id ?? null,
      disease_id: v.disease_id ?? null,
      treatment_type_id: v.treatment_type_id ?? null,
      accident_in_work_flag: v.accident_in_work_flag ?? false,
      work_related_flag: v.work_related_flag ?? false,
      refer_flag: v.refer_flag ?? false,
      refer_type_id: v.refer_type_id ?? null,
      severity_id: v.severity_id ?? null,
    };
    historyEditVitals.value = { ...historyParsedVitals.value };
    historyEditUsages.value = historyDetailUsages.value.map(u => {
      const stockItem = stockItems.value.find(s => s.item_id === u.item_id);
      return {
        visit_usage_id: u.visit_usage_id,
        item_id: u.item_id,
        item_name: u.item_name_en ?? '',
        item_name_th: u.item_name_th ?? stockItem?.item_name_th ?? '',
        item_code: u.item_code ?? '',
        unit_name: u.unit_name ?? '',
        qty_base: u.qty_base,
        stock_qty: stockItem?.qty_base ?? 0,
        is_deleted: false,
        is_new: false,
      };
    });
    historyEditReason.value = '';
    historyEditReasonInvalid.value = false;
    historyEditMode.value = true;
  }

  function searchHistoryEditNewItem(event: { query: string }) {
    const q = event.query.toLowerCase();
    historyEditNewItemSuggest.value = stockItems.value
      .filter(
        i =>
          i.item_name_en?.toLowerCase().includes(q) ||
          i.item_name_th?.toLowerCase().includes(q) ||
          i.item_code?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }

  function onSelectHistoryEditNewItem(event: { value: IStockOnHand }) {
    historyEditNewItem.value = event.value;
  }

  function addHistoryEditUsageRow() {
    if (
      !historyEditNewItem.value ||
      !historyEditNewQty.value ||
      historyEditNewQty.value <= 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกยาและระบุจำนวน',
        timer: 1500,
        showConfirmButton: false,
        customClass: { container: 'swal-on-top' },
      });
      return;
    }
    historyEditUsages.value.push({
      visit_usage_id: null,
      item_id: historyEditNewItem.value.item_id,
      item_name: historyEditNewItem.value.item_name_en ?? '',
      item_name_th: historyEditNewItem.value.item_name_th ?? '',
      item_code: historyEditNewItem.value.item_code ?? '',
      unit_name: historyEditNewItem.value.usage_unit_name_th ?? '',
      qty_base: historyEditNewQty.value,
      stock_qty: historyEditNewItem.value.qty_base ?? 0,
      is_deleted: false,
      is_new: true,
    });
    historyEditNewItem.value = null;
    historyEditNewItemText.value = '';
    historyEditNewQty.value = 1;
  }

  function toggleDeleteHistoryUsage(row: IEditUsageRow) {
    if (row.is_new) {
      historyEditUsages.value = historyEditUsages.value.filter(r => r !== row);
    } else {
      row.is_deleted = !row.is_deleted;
    }
  }

  async function saveHistoryEdit() {
    if (!historyDetailVisit.value) return;
    if (!historyEditReason.value.trim()) {
      historyEditReasonInvalid.value = true;
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุเหตุผลการแก้ไข',
        timer: 1500,
        showConfirmButton: false,
        customClass: { container: 'swal-on-top' },
      });
      return;
    }
    historyEditReasonInvalid.value = false;

    const usageChanges: IUpdateUsageItem[] = [];
    if (canEditUsages.value) {
      for (const row of historyEditUsages.value) {
        if (row.is_new && !row.is_deleted) {
          usageChanges.push({
            action: 'ADD',
            item_id: row.item_id,
            qty_base: row.qty_base,
          });
        } else if (!row.is_new && row.is_deleted) {
          usageChanges.push({
            action: 'DELETE',
            visit_usage_id: row.visit_usage_id!,
          });
        } else if (!row.is_new && !row.is_deleted) {
          const orig = historyDetailUsages.value.find(
            u => u.visit_usage_id === row.visit_usage_id
          );
          if (orig && orig.qty_base !== row.qty_base) {
            usageChanges.push({
              action: 'EDIT',
              visit_usage_id: row.visit_usage_id!,
              qty_base: row.qty_base,
            });
          }
        }
      }
    }

    const vitalsClean = Object.fromEntries(
      Object.entries(historyEditVitals.value).filter(([, v]) => v != null)
    );

    const body: IUpdateVisitBody = {
      symptoms: historyEditForm.value.symptoms || null,
      vitals_json:
        Object.keys(vitalsClean).length > 0
          ? JSON.stringify(vitalsClean)
          : null,
      nursing_advice: historyEditForm.value.nursing_advice || null,
      group_id: historyEditForm.value.group_id,
      disease_id: historyEditForm.value.disease_id,
      treatment_type_id: historyEditForm.value.treatment_type_id,
      accident_in_work_flag: historyEditForm.value.accident_in_work_flag,
      work_related_flag: historyEditForm.value.work_related_flag,
      refer_flag: historyEditForm.value.refer_flag,
      refer_type_id: historyEditForm.value.refer_flag
        ? historyEditForm.value.refer_type_id
        : null,
      severity_id: historyEditForm.value.severity_id,
      reason: historyEditReason.value,
      usages: usageChanges.length > 0 ? usageChanges : undefined,
    };

    historyEditSaving.value = true;
    try {
      await TreatmentService.updateVisit(
        historyDetailVisit.value.visit_id,
        body
      );
      const res = await TreatmentService.getVisitById(
        historyDetailVisit.value.visit_id
      );
      historyDetailVisit.value = res.visit;
      historyDetailUsages.value = res.usages;
      cancelHistoryEdit();
      await loadPatientHistory();
      Swal.fire({
        icon: 'success',
        title: 'บันทึกการแก้ไขสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
        customClass: { container: 'swal-on-top' },
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err?.response?.data?.message || err?.message,
        customClass: { container: 'swal-on-top' },
      });
    } finally {
      historyEditSaving.value = false;
    }
  }

  async function deleteHistoryVisit() {
    if (!historyDetailVisit.value) return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการลบ',
      html: `ต้องการลบบันทึกการรักษาวันที่<br><b>${historyDetailVisit.value.visit_datetime ? new Date(historyDetailVisit.value.visit_datetime).toLocaleString('th-TH') : '-'}</b><br>ระบบจะคืน Stock ยาทั้งหมดให้อัตโนมัติ`,
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
      customClass: { container: 'swal-on-top' },
    });
    if (!confirm.isConfirmed) return;
    historyDeleting.value = true;
    try {
      await TreatmentService.deleteVisit(historyDetailVisit.value.visit_id);
      showHistoryDetail.value = false;
      await loadPatientHistory();
      Swal.fire({
        icon: 'success',
        title: 'ลบบันทึกการรักษาสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
        customClass: { container: 'swal-on-top' },
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถลบได้',
        text: err?.response?.data?.message || err?.message,
        customClass: { container: 'swal-on-top' },
      });
    } finally {
      historyDeleting.value = false;
    }
  }
</script>

<template>
  <div class="py-4 space-y-4">
    <!-- Title -->
    <div class="flex items-center gap-2">
      <i class="pi pi-pencil text-red-500 text-2xl" />
      <h2 class="text-xl font-semibold text-gray-800 m-0">
        Treatment Record (บันทึกการรักษาพยาบาล)
      </h2>
    </div>

    <!-- ══ Section 1: Patient Search ══════════════════════════════════════════ -->
    <div class="card p-5">
      <!-- EMP / EXT toggle -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="opt in [
            { label: '👤 Employee (พนักงาน)', value: 'EMP' },
            { label: '🏢 External Person (บุคคลภายนอก)', value: 'EXT' },
          ]"
          :key="opt.value"
          @click="switchPatientTab(opt.value as 'EMP' | 'EXT')"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
            patientTab === opt.value
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
          ]"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Employee search -->
      <div v-if="patientTab === 'EMP'">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Search Employee (ค้นหาพนักงาน)
        </label>
        <AutoComplete
          v-model="empInputText"
          :suggestions="empSuggestions"
          optionLabel="thai_name"
          placeholder="Search by name or ID (พิมพ์ชื่อหรือรหัสพนักงาน)"
          fluid
          forceSelection
          @complete="searchEmployee"
          @option-select="onSelectEmployee"
        >
          <template #option="{ option }">
            <div class="flex flex-col gap-0.5">
              <span class="font-medium">{{ option.thai_name }}</span>
              <span class="text-xs text-gray-400">
                {{ option.ID }} · {{ option.section_name }}
              </span>
            </div>
          </template>
        </AutoComplete>
      </div>

      <!-- External person search -->
      <div v-else>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Search External Person (ค้นหาบุคคลภายนอก)
        </label>
        <div class="flex gap-2">
          <AutoComplete
            v-model="extInputText"
            :suggestions="extSuggestions"
            optionLabel="full_name"
            placeholder="Type at least 2 characters (พิมพ์อย่างน้อย 2 ตัวอักษร)"
            class="flex-1"
            fluid
            @complete="searchExtPerson"
            @option-select="onSelectExtPerson"
          >
            <template #option="{ option }">
              <div class="flex flex-col gap-0.5">
                <span class="font-medium">{{ option.full_name }}</span>
                <span class="text-xs text-gray-400">
                  {{
                    option.company || 'Company not specified (ไม่ระบุบริษัท)'
                  }}
                  · Visited {{ option.visit_count }} time(s) (มาแล้ว
                  {{ option.visit_count }} ครั้ง)
                </span>
              </div>
            </template>
          </AutoComplete>
          <Button
            icon="pi pi-user-plus"
            label="Register New (ลงทะเบียนใหม่)"
            severity="success"
            outlined
            @click="openRegisterDialog"
          />
        </div>
      </div>

      <!-- Loading indicator -->
      <div
        v-if="profileLoading"
        class="flex items-center gap-2 mt-3 text-gray-500 text-sm"
      >
        <ProgressSpinner style="width: 16px; height: 16px" strokeWidth="6" />
        <span>Loading patient information... (กำลังโหลดข้อมูลผู้ป่วย...)</span>
      </div>
    </div>

    <!-- ══ Section 2: Patient Profile ══════════════════════════════════════════ -->
    <div v-if="patientProfile" class="card p-5">
      <div class="grid grid-cols-6 gap-6 items-start">
        <!-- Col 1 (span 2): Avatar + Name + Dept + Visit count -->
        <div class="col-span-2 flex gap-3 items-start">
          <!-- EMP: show photo; EXT: show initials -->
          <img
            v-if="patientTab === 'EMP' && selectedEmployee?.cardcode"
            :src="`http://10.182.1.198/apis/employee-images/${selectedEmployee.cardcode}`"
            :alt="patientName"
            class="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-200"
            @error="
              e => ((e.target as HTMLImageElement).style.display = 'none')
            "
          />
          <div
            v-else
            class="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl flex-shrink-0"
            :style="`background-color: ${patientTab === 'EMP' ? 'var(--p-primary-color)' : 'var(--p-orange-500)'}`"
          >
            {{ patientInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-gray-800 break-words">
              {{ patientName }}
            </div>
            <div v-if="patientDept" class="text-sm text-gray-500 truncate">
              {{ patientDept }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              Visit Count (ครั้งที่มารักษา):
              <span class="font-semibold text-blue-600">
                {{ patientProfile.total_visits ?? 0 }} visit(s) (ครั้ง)
              </span>
            </div>
          </div>
        </div>

        <!-- Col 2: Allergies -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-semibold text-gray-600">
              💊 Allergies (ยาที่แพ้)
            </span>
            <Badge
              :value="patientProfile.allergies.length"
              severity="danger"
              v-if="patientProfile.allergies.length > 0"
            />
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              severity="secondary"
              v-tooltip="'Manage Allergies (จัดการยาที่แพ้)'"
              @click="openAllergyDialog()"
            />
          </div>
          <div
            v-if="
              patientProfile.no_known_allergy &&
              patientProfile.allergies.length === 0
            "
            class="text-sm text-green-600 flex items-center gap-1"
          >
            <i class="pi pi-shield" />
            No known drug allergy (ไม่มีประวัติแพ้ยา)
          </div>
          <div
            v-else-if="patientProfile.allergies.length === 0"
            class="text-sm text-gray-400"
          >
            Not specified (ไม่ระบุ)
          </div>
          <div v-else class="flex flex-wrap gap-1">
            <span
              v-for="a in patientProfile.allergies"
              :key="a.allergy_id"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200"
            >
              {{ a.drug_name }}
            </span>
          </div>
        </div>

        <!-- Col 3: Chronic Diseases -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-semibold text-gray-600">
              🫀 Underlying Disease (โรคประจำตัว)
            </span>
            <Badge
              :value="patientProfile.underlying_diseases.length"
              severity="danger"
              v-if="patientProfile.underlying_diseases.length > 0"
            />
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              severity="secondary"
              v-tooltip="'Manage Underlying Disease (จัดการโรคประจำตัว)'"
              @click="openDiseaseDialog()"
            />
          </div>
          <div
            v-if="patientProfile.underlying_diseases.length === 0"
            class="text-sm text-gray-400"
          >
            Not specified (ไม่ระบุ)
          </div>
          <div v-else class="flex flex-wrap gap-1">
            <span
              v-for="d in patientProfile.underlying_diseases"
              :key="d.condition_id"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200"
            >
              {{ d.disease_name }}
            </span>
          </div>
        </div>

        <!-- Col 4: BMI (live if vitals entered, else from last visit) -->
        <div class="text-center">
          <div class="text-sm font-semibold text-gray-600 mb-1">📊 BMI</div>

          <!-- Live BMI from current form -->
          <template v-if="bmi !== null">
            <div class="text-4xl font-bold text-blue-600">
              {{ bmi.toFixed(1) }}
            </div>
            <Tag
              v-if="bmiCategory"
              :severity="bmiCategory.severity"
              :value="bmiCategory.label"
              class="mt-1"
            />
            <div class="text-xs text-blue-400 mt-1">
              {{ vitals.weight_kg }}kg / {{ vitals.height_cm }}cm
            </div>
            <div class="text-xs text-gray-400 mt-0.5">
              📝 Current Entry (จากการกรอกปัจจุบัน)
            </div>
          </template>

          <!-- Historical BMI from view_patient_latest_vitals -->
          <template
            v-else-if="
              patientProfile.latest_physical?.bmi !== null &&
              patientProfile.latest_physical?.bmi !== undefined
            "
          >
            <div class="text-4xl font-bold text-gray-500">
              {{ patientProfile.latest_physical!.bmi!.toFixed(1) }}
            </div>
            <Tag
              v-if="getBmiCategory(patientProfile.latest_physical!.bmi)"
              :severity="
                getBmiCategory(patientProfile.latest_physical!.bmi)!.severity
              "
              :value="
                getBmiCategory(patientProfile.latest_physical!.bmi)!.label
              "
              class="mt-1"
            />
            <div class="text-xs text-gray-500 mt-1">
              {{ patientProfile.latest_physical!.weight_kg }}kg /
              {{ patientProfile.latest_physical!.height_cm }}cm
            </div>
            <div class="text-xs text-gray-400 mt-0.5">
              🕐 Latest Data (ข้อมูลล่าสุด)
            </div>
          </template>

          <!-- No data at all -->
          <template v-else>
            <div class="text-4xl font-bold text-gray-300">—</div>
            <div class="text-xs text-gray-400 mt-1">
              Enter weight/height below (กรอก น้ำหนัก/ส่วนสูง ด้านล่าง)
            </div>
          </template>
        </div>

        <!-- Col 5: Blood Type + Change Patient button -->
        <div class="text-center">
          <div class="flex items-center justify-center gap-2 mb-1">
            <span class="text-sm font-semibold text-gray-600">
              🩸 Blood Group (กรุ๊ปเลือด)
            </span>
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              text
              size="small"
              v-tooltip="'Change Patient (เปลี่ยนผู้ป่วย)'"
              @click="resetForm"
            />
          </div>
          <div
            v-if="patientTab === 'EMP' && selectedEmployee?.bloodeng"
            class="text-4xl font-bold text-red-500"
          >
            {{ selectedEmployee.bloodeng }}
          </div>
          <div v-else class="text-2xl font-bold text-gray-300">—</div>
        </div>
      </div>
    </div>

    <!-- ══ Section 3+: Visit Form ══════════════════════════════════════════════ -->
    <div v-if="patientProfile" class="card p-5">
      <!-- Date / Time -->
      <div class="grid grid-cols-2 gap-4 mb-5">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">
            Visit Date (วันที่รักษา)
          </label>
          <InputText type="date" v-model="visitDate" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-gray-700">
            Visit Time (เวลารักษา)
          </label>
          <InputText type="time" v-model="visitTime" class="w-full" />
        </div>
      </div>

      <!-- 4 Tabs -->
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="0">
            <i class="pi pi-file-edit mr-1" />
            Treatment Record (ข้อมูลการรักษาพยาบาล)
          </Tab>
          <Tab value="1">
            <i class="pi pi-history mr-1" />
            Visit History (ประวัติการรักษา)
          </Tab>
          <Tab value="2">
            <i class="pi pi-directions mr-1" />
            Refer History (ประวัติการ Refer)
          </Tab>
          <Tab value="3">
            <i class="pi pi-id-card mr-1" />
            Social Security (ประกันสังคม)
          </Tab>
        </TabList>

        <TabPanels>
          <!-- ── Tab 1: Treatment form ───────────────────────────────────── -->
          <TabPanel value="0" class="pt-5 space-y-6">
            <!-- Section 4: Vital Signs -->
            <div>
              <h3
                class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"
              >
                <i class="pi pi-heart text-red-400" />
                Vital Signs (สัญญาณชีพ)
              </h3>
              <!-- Row 1: 4-col -->
              <div class="grid grid-cols-4 gap-4 mb-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Temperature (อุณหภูมิ °C)
                  </label>
                  <InputNumber
                    v-model="vitals.temp_c"
                    :minFractionDigits="1"
                    :maxFractionDigits="1"
                    placeholder="36.5"
                    :min="30"
                    :max="45"
                    fluid
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Heart Rate (อัตราการเต้นหัวใจ)
                  </label>
                  <InputNumber
                    v-model="vitals.pulse"
                    placeholder="Ex. 72"
                    :min="0"
                    :max="300"
                    fluid
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Respiratory Rate (อัตราการหายใจ)
                  </label>
                  <InputNumber
                    v-model="vitals.rr"
                    placeholder="Ex. 18"
                    :min="0"
                    :max="100"
                    fluid
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Blood Pressure (ความดัน/BP)
                  </label>
                  <div class="flex items-center gap-1">
                    <InputNumber
                      v-model="vitals.bp_systolic"
                      placeholder="SYS"
                      :min="0"
                      :max="300"
                      class="flex-1"
                      :inputStyle="{ width: '100%' }"
                    />
                    <span class="text-gray-400 font-bold px-1">/</span>
                    <InputNumber
                      v-model="vitals.bp_diastolic"
                      placeholder="DIA"
                      :min="0"
                      :max="200"
                      class="flex-1"
                      :inputStyle="{ width: '100%' }"
                    />
                  </div>
                </div>
              </div>
              <!-- Row 2: 2-col (left-aligned) with inline BMI -->
              <div class="grid grid-cols-4 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Height (ส่วนสูง cm)
                  </label>
                  <InputNumber
                    v-model="vitals.height_cm"
                    placeholder="Ex. 170"
                    :min="0"
                    :max="250"
                    fluid
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-600">
                    Weight (น้ำหนัก kg)
                  </label>
                  <InputNumber
                    v-model="vitals.weight_kg"
                    :minFractionDigits="1"
                    placeholder="Ex. 65.0"
                    :min="0"
                    :max="300"
                    fluid
                  />
                </div>
                <div
                  v-if="bmi !== null"
                  class="col-span-2 flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-2"
                >
                  <i class="pi pi-calculator text-blue-500 text-xl" />
                  <div>
                    <div class="text-xs text-gray-500">
                      BMI Auto-calculated (BMI คำนวณอัตโนมัติ)
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-2xl font-bold text-gray-800">
                        {{ bmi.toFixed(1) }}
                      </span>
                      <Tag
                        v-if="bmiCategory"
                        :value="bmiCategory.label"
                        :severity="bmiCategory.severity"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Section 5: Treatment Record -->
            <div>
              <h3
                class="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2"
              >
                <i class="pi pi-clipboard text-blue-500" />
                Treatment Record (บันทึกการรักษา)
              </h3>
              <!-- Symptoms -->
              <div class="flex flex-col gap-1 mb-4">
                <label class="text-sm font-medium text-gray-700">
                  Chief Complaint (อาการ)
                </label>
                <Textarea
                  v-model="symptoms"
                  rows="3"
                  class="w-full"
                  placeholder="Describe chief complaint (บรรยายอาการสำคัญที่มาพบ)"
                  autoResize
                />
              </div>
              <!-- 3 dropdowns -->
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">
                    Disease Group (กลุ่มโรค)
                    <span class="text-red-500">*</span>
                  </label>
                  <Select
                    v-model="selectedGroupId"
                    :options="lookups.disease_groups"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    placeholder="Select disease group (เลือกกลุ่มโรค)"
                    class="w-full"
                    @change="selectedDiseaseId = null"
                    showClear
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">
                    Disease Type (ประเภทโรค)
                    <span class="text-red-500">*</span>
                  </label>
                  <Select
                    v-model="selectedDiseaseId"
                    :options="filteredDiseaseSubGroups"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    :placeholder="
                      selectedGroupId
                        ? 'Select disease type (เลือกประเภทโรค)'
                        : 'Select group first (เลือกกลุ่มโรคก่อน)'
                    "
                    class="w-full"
                    :disabled="!selectedGroupId"
                    showClear
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">
                    Treatment Type (ประเภทการรักษา)
                  </label>
                  <Select
                    v-model="selectedTreatmentTypeId"
                    :options="lookups.treatment_types"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    placeholder="Select treatment type (เลือกประเภทการรักษา)"
                    class="w-full"
                    showClear
                  />
                  <Select
                    v-if="isReferTreatment"
                    v-model="selectedReferTypeId"
                    :options="lookups.refer_types"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    placeholder="Refer Type (ประเภทการส่งต่อ)"
                    class="w-full mt-2"
                    showClear
                  />
                </div>
              </div>
              <!-- 2 yes/no toggles -->
              <div class="flex flex-wrap gap-6 mb-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">
                    Work-related Disease (โรคที่คาดว่าเกิดจากการทำงาน)
                  </label>
                  <SelectButton
                    v-model="workRelatedFlag"
                    :options="yesNoOptions"
                    optionLabel="label"
                    optionValue="value"
                    :allowEmpty="false"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium text-gray-700">
                    Accident in Work (อุบัติเหตุในงาน)
                  </label>
                  <SelectButton
                    v-model="accidentInWorkFlag"
                    :options="yesNoOptions"
                    optionLabel="label"
                    optionValue="value"
                    :allowEmpty="false"
                  />
                </div>
              </div>
              <!-- Nurse Advice -->
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium text-gray-700">
                  Nursing Advice (คำแนะนำจากพยาบาล)
                  <span class="text-red-500">*</span>
                </label>
                <Textarea
                  v-model="nursingAdvice"
                  rows="3"
                  class="w-full"
                  placeholder="Enter nursing advice (บันทึกคำแนะนำให้ผู้ป่วย)"
                  autoResize
                />
              </div>
            </div>

            <Divider />

            <!-- Section 6: Medication & Supplies -->
            <div>
              <div class="flex items-center gap-4 mb-4">
                <label class="text-sm font-medium text-gray-700">
                  Dispense Medicine/Supplies? (ต้องจ่ายยาหรือเวชภัณฑ์?)
                  <span class="text-red-500">*</span>
                </label>
                <SelectButton
                  v-model="hasMedication"
                  :options="medicationOptions"
                  optionLabel="label"
                  optionValue="value"
                  :allowEmpty="false"
                />
              </div>

              <div v-if="hasMedication === true">
                <!-- ยาที่ใช้ (full-width) -->
                <div>
                  <div class="font-medium text-gray-700 mb-3">
                    💊 Medicine & Supplies (ยาและเวชภัณฑ์ที่ใช้)
                  </div>
                  <!-- Add row -->
                  <div class="flex items-end gap-1 mb-1 flex-wrap">
                    <div class="flex-1 min-w-0">
                      <AutoComplete
                        v-model="medicineInputText"
                        :suggestions="medicineSuggest"
                        :optionLabel="itemLabel"
                        placeholder="Search medicine/supplies by name or code (ค้นหายา/เวชภัณฑ์)"
                        fluid
                        forceSelection
                        @complete="e => searchItems(e, 'MEDICINE')"
                        @option-select="
                          e => {
                            selectedMedicine = e.value;
                            medicineQty = 1;
                          }
                        "
                      >
                        <template #option="{ option }">
                          <div class="flex flex-col gap-0.5">
                            <span class="font-medium text-sm">
                              {{ option.item_name_th || option.item_name_en }}
                            </span>
                            <span class="text-xs text-gray-400">
                              {{ option.item_name_en }} ·
                              {{ option.item_code }} · Stock: (คงเหลือ)
                              {{ option.qty_base ?? 0 }}
                              {{ option.usage_unit_name_th }}
                            </span>
                          </div>
                        </template>
                      </AutoComplete>
                    </div>
                    <InputNumber
                      v-model="medicineQty"
                      :min="1"
                      :max="selectedMedicine?.qty_base ?? 9999"
                      :inputStyle="{ width: '5rem', textAlign: 'center' }"
                      showButtons
                      buttonLayout="horizontal"
                    />
                    <span
                      class="inline-flex items-center justify-center px-2.5 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 min-w-[4rem] text-gray-700 whitespace-nowrap"
                    >
                      {{ selectedMedicine?.usage_unit_name_th || '—' }}
                    </span>
                    <Button
                      icon="pi pi-plus"
                      outlined
                      severity="success"
                      size="small"
                      :disabled="!selectedMedicine"
                      @click="addItem('MEDICINE')"
                    />
                  </div>
                  <div
                    v-if="selectedMedicine"
                    class="mb-3 text-xs text-blue-600 pl-1"
                  >
                    Stock: (คงเหลือ) {{ selectedMedicine.qty_base ?? 0 }}
                    {{ selectedMedicine.usage_unit_name_th }}
                  </div>
                  <div v-else class="mb-3"></div>
                  <!-- Added medicines table -->
                  <div
                    v-if="medicineRows.length > 0"
                    class="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th
                            class="text-left px-3 py-2 text-gray-600 font-medium"
                          >
                            Medicine / Supplies (ยา/เวชภัณฑ์)
                          </th>
                          <th
                            class="text-center px-3 py-2 text-gray-600 font-medium w-28"
                          >
                            Quantity (จำนวน)
                          </th>
                          <th class="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, i) in medicineRows"
                          :key="row.item_id"
                          class="border-t border-gray-100"
                        >
                          <td class="px-3 py-2">
                            <div class="font-medium">{{ itemLabel(row) }}</div>
                            <div class="text-xs text-gray-400">
                              {{ row.item_code
                              }}{{
                                row.item_name_th ? ' · ' + row.item_name_th : ''
                              }}
                            </div>
                          </td>
                          <td class="text-center px-3 py-2">
                            <span class="font-semibold">
                              {{ row.qty_base }}
                            </span>
                            <span class="text-xs text-gray-500 ml-1">
                              {{ row.unit_name }}
                            </span>
                          </td>
                          <td class="px-2 py-2">
                            <Button
                              icon="pi pi-times"
                              text
                              severity="danger"
                              size="small"
                              @click="removeItem('MEDICINE', i)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div
                    v-else
                    class="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg"
                  >
                    No medicine/supplies added yet (ยังไม่มีรายการยา/เวชภัณฑ์)
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 7: Submit -->
            <Button
              label="Save Visit Record (บันทึกการรักษา)"
              icon="pi pi-save"
              class="w-full"
              size="large"
              :loading="saving"
              @click="saveVisit"
            />
          </TabPanel>

          <!-- ── Tab 2: History ──────────────────────────────────────────── -->
          <TabPanel value="1" class="pt-5">
            <!-- Header row -->
            <div class="flex items-center justify-between mb-4">
              <h3
                class="text-base font-semibold text-gray-700 flex items-center gap-2"
              >
                <i class="pi pi-history text-blue-500" />
                Visit History (ประวัติการรักษา)
                <Badge
                  v-if="historyVisits.length"
                  :value="String(historyVisits.length)"
                  severity="info"
                />
              </h3>
              <Button
                icon="pi pi-refresh"
                size="small"
                text
                severity="secondary"
                :loading="historyLoading"
                v-tooltip="'Reload (โหลดใหม่)'"
                @click="loadPatientHistory"
              />
            </div>

            <!-- Loading spinner -->
            <div v-if="historyLoading" class="flex justify-center py-8">
              <ProgressSpinner
                style="width: 32px; height: 32px"
                strokeWidth="4"
              />
            </div>

            <!-- Visit history DataTable -->
            <DataTable
              v-else
              :value="historyVisits"
              class="p-datatable-sm"
              emptyMessage="No visit history found (ไม่พบประวัติการรักษา)"
              stripedRows
              paginator
              :rows="10"
              :rowsPerPageOptions="[10, 20, 50]"
            >
              <Column header="#" style="width: 3rem">
                <template #body="{ index }">{{ index + 1 }}</template>
              </Column>
              <Column
                field="visit_datetime"
                header="Date/Time (วันที่/เวลา)"
                style="width: 11rem"
                sortable
              >
                <template #body="{ data }">
                  {{ formatDate(data.visit_datetime) }}
                </template>
              </Column>
              <Column field="symptoms" header="Chief Complaint (อาการ)">
                <template #body="{ data }">
                  <span class="text-sm">
                    {{ data.symptoms?.slice(0, 60) || '-'
                    }}{{ (data.symptoms?.length ?? 0) > 60 ? '...' : '' }}
                  </span>
                </template>
              </Column>
              <Column
                field="disease_group_name"
                header="Disease Group"
                style="width: 9rem"
              >
                <template #body="{ data }">
                  {{ historyDiseaseGroupNameEn(data.disease_group_name) }}
                </template>
              </Column>
              <Column
                field="nursing_advice"
                header="Nursing Advice (คำแนะนำจากพยาบาล)"
              >
                <template #body="{ data }">
                  <span class="text-sm">
                    {{ data.nursing_advice?.slice(0, 60) || '-'
                    }}{{ (data.nursing_advice?.length ?? 0) > 60 ? '...' : '' }}
                  </span>
                </template>
              </Column>
              <Column
                field="treatment_type_name"
                header="Treatment Type"
                style="width: 10rem"
              >
                <template #body="{ data }">
                  <Tag
                    v-if="data.treatment_code"
                    :value="historyTreatmentTypeNameEn(data)"
                    :severity="historyTreatmentSeverity(data.treatment_code)"
                  />
                  <span v-else>-</span>
                </template>
              </Column>
              <Column header="Medicine Items (รายการยา)" style="width: 6rem">
                <template #body="{ data }">
                  <Badge
                    v-if="data.usage_count > 0"
                    :value="String(data.usage_count)"
                    severity="info"
                  />
                  <span v-else class="text-color-secondary text-sm">-</span>
                </template>
              </Column>
              <Column header="" style="width: 4rem">
                <template #body="{ data }">
                  <Button
                    icon="pi pi-eye"
                    severity="info"
                    text
                    rounded
                    size="small"
                    v-tooltip="'View Details (ดูรายละเอียด)'"
                    @click="openHistoryDetail(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- ── Tab 3: Refer history ────────────────────────────────────── -->
          <TabPanel value="2" class="pt-4">
            <!-- Header bar -->
            <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <span class="font-semibold text-color-secondary text-sm">
                Refer History (ประวัติการ Refer):
                {{ filteredReferCases.length }}
                <template
                  v-if="referFilter !== 'ALL' || referTypeFilter !== null"
                >
                  / {{ referCases.length }}
                </template>
                case(s) (รายการ)
              </span>
              <div class="flex items-center gap-2 flex-wrap">
                <Select
                  v-model="referTypeFilter"
                  :options="referTypeFilterOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All refer types (ทุกประเภท Refer)"
                  showClear
                  size="small"
                  style="min-width: 160px"
                />
                <SelectButton
                  v-model="referFilter"
                  :options="referFilterOptions"
                  optionLabel="label"
                  optionValue="value"
                  size="small"
                />
                <Button
                  v-if="patientProfile && historyVisits.length"
                  icon="pi pi-plus"
                  label="Add Refer (เพิ่ม Refer)"
                  size="small"
                  @click="openCaseDialog()"
                />
              </div>
            </div>

            <!-- Loading -->
            <div v-if="referLoading" class="flex justify-center py-8">
              <ProgressSpinner style="width: 36px; height: 36px" />
            </div>

            <!-- Empty (no cases at all) -->
            <div
              v-else-if="!referCases.length"
              class="text-center py-10 text-gray-400"
            >
              <i class="pi pi-directions text-3xl mb-2 block" />
              <div class="text-sm">
                No refer history yet (ยังไม่มีประวัติการ Refer)
              </div>
            </div>

            <!-- Empty (cases exist but filtered out) -->
            <div
              v-else-if="!filteredReferCases.length"
              class="text-center py-10 text-gray-400"
            >
              <i class="pi pi-filter-slash text-3xl mb-2 block" />
              <div class="text-sm">
                No records match the filter (ไม่มีรายการที่ตรงกับตัวกรอง)
              </div>
            </div>

            <!-- Case list -->
            <div v-else class="flex flex-col gap-3">
              <div
                v-for="rc in filteredReferCases"
                :key="rc.refer_case_id ?? 'visit-' + rc.visit_id"
                class="border border-gray-200 rounded-lg overflow-hidden"
              >
                <!-- Case header row -->
                <div
                  class="flex items-center gap-2 px-3 py-2.5 bg-gray-50 transition-colors"
                  :class="
                    rc.refer_case_id !== null
                      ? 'cursor-pointer hover:bg-gray-100'
                      : ''
                  "
                  @click="toggleFollowups(rc.refer_case_id)"
                >
                  <i
                    :class="
                      rc.refer_case_id !== null &&
                      expandedCaseId === rc.refer_case_id
                        ? 'pi pi-chevron-down'
                        : 'pi pi-chevron-right'
                    "
                    class="text-xs text-gray-400 flex-none"
                  />
                  <span class="text-xs text-gray-400 font-mono flex-none">
                    #{{ rc.refer_no || '-' }}
                  </span>
                  <Tag
                    :value="rc.refer_name_en"
                    severity="warn"
                    class="text-xs"
                  />
                  <template v-if="rc.refer_case_id !== null">
                    <Tag
                      :value="
                        rc.status === 'OPEN'
                          ? 'Open (เปิด)'
                          : rc.status === 'CLOSED'
                            ? 'Closed (ปิด)'
                            : 'Cancelled (ยกเลิก)'
                      "
                      :severity="
                        rc.status === 'OPEN'
                          ? 'success'
                          : rc.status === 'CLOSED'
                            ? 'secondary'
                            : 'danger'
                      "
                      class="text-xs"
                    />
                  </template>
                  <Tag
                    v-else
                    value="Pending Follow-up (รอติดตาม)"
                    severity="secondary"
                    class="text-xs"
                  />
                  <span class="text-xs text-gray-500 ml-auto flex-none">
                    {{ formatDate(rc.opened_at) }}
                  </span>
                  <template v-if="rc.refer_case_id !== null">
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      severity="secondary"
                      class="flex-none"
                      @click.stop="openCaseDialog(rc)"
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      class="flex-none"
                      @click.stop="confirmDeleteCase(rc)"
                    />
                  </template>
                </div>

                <!-- Symptoms / Disease info row -->
                <div
                  v-if="rc.symptoms || rc.disease_group_name"
                  class="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-3 py-1.5 bg-white border-t border-gray-100 text-xs text-gray-500"
                >
                  <span
                    v-if="rc.disease_group_name"
                    class="flex items-center gap-1"
                  >
                    <i class="pi pi-tags text-gray-400" />
                    {{
                      referDiseaseLabelEn(
                        rc.disease_group_name,
                        rc.disease_sub_group_name
                      )
                    }}
                  </span>
                  <span
                    v-if="rc.symptoms"
                    class="flex items-center gap-1 min-w-0"
                  >
                    <i class="pi pi-comment text-gray-400 flex-none" />
                    <span class="line-clamp-1">{{ rc.symptoms }}</span>
                  </span>
                </div>

                <!-- Follow-up panel (explicit cases, expanded) -->
                <div
                  v-if="
                    rc.refer_case_id !== null &&
                    expandedCaseId === rc.refer_case_id
                  "
                  class="px-3 py-2"
                >
                  <div
                    v-if="followupsLoadingId === rc.refer_case_id"
                    class="flex justify-center py-4"
                  >
                    <ProgressSpinner style="width: 28px; height: 28px" />
                  </div>
                  <template v-else>
                    <div
                      v-if="!followupsByCaseId[rc.refer_case_id!]?.length"
                      class="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg mb-2"
                    >
                      No follow-up history yet (ยังไม่มีประวัติการติดตามผล)
                    </div>

                    <!-- Follow-up timeline -->
                    <Timeline
                      v-else
                      :value="followupsByCaseId[rc.refer_case_id!]"
                      class="px-1 pt-1"
                    >
                      <template #marker="{ item: fp }">
                        <span
                          class="flex w-7 h-7 rounded-full text-white text-xs items-center justify-center font-bold shadow-sm flex-shrink-0"
                          :class="
                            fp.outcome === 'BACK_TO_COMPANY'
                              ? 'bg-green-500'
                              : fp.outcome === 'ADMISSION'
                                ? 'bg-red-500'
                                : fp.outcome === 'BACK_TO_HOME'
                                  ? 'bg-orange-400'
                                  : 'bg-blue-400'
                          "
                        >
                          {{ fp.followup_no }}
                        </span>
                      </template>
                      <template #content="{ item: fp }">
                        <div class="pb-4">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex-1 min-w-0">
                              <div
                                class="flex items-center gap-2 flex-wrap mb-1"
                              >
                                <Tag
                                  :value="outcomeLabel(fp.outcome)"
                                  :severity="outcomeSeverity(fp.outcome)"
                                  class="text-xs"
                                />
                                <span class="text-xs text-gray-500 font-medium">
                                  {{ formatDate(fp.followup_at) }}
                                </span>
                                <template v-if="fp.hospital_name_th">
                                  <span class="text-gray-300">·</span>
                                  <span class="text-xs text-gray-500">
                                    {{ fp.hospital_name_th }}
                                  </span>
                                  <span
                                    v-if="fp.room_no"
                                    class="text-xs text-gray-400"
                                  >
                                    ({{ fp.room_no }})
                                  </span>
                                </template>
                              </div>
                              <div
                                v-if="fp.followup_note"
                                class="text-xs text-gray-600 whitespace-pre-wrap mb-1"
                              >
                                {{ fp.followup_note }}
                              </div>
                              <div
                                v-if="fp.treatment_cost != null"
                                class="text-xs text-indigo-600 mb-0.5"
                              >
                                <i class="pi pi-wallet mr-1" />
                                Treatment Cost (ค่าใช้จ่าย):
                                {{
                                  Number(fp.treatment_cost).toLocaleString(
                                    'th-TH',
                                    { minimumFractionDigits: 2 }
                                  )
                                }}
                                THB (บาท)
                              </div>
                              <div
                                v-if="fp.back_to_work_date"
                                class="text-xs text-green-600 mb-0.5"
                              >
                                <i class="pi pi-check-circle mr-1" />
                                Returned to Work (กลับทำงาน):
                                {{ formatDate(fp.back_to_work_date) }}
                              </div>
                              <div
                                v-if="fp.next_appointment_at"
                                class="text-xs text-blue-500"
                              >
                                <i class="pi pi-calendar mr-1" />
                                Next Appointment (นัดครั้งต่อไป):
                                {{ formatDateTime(fp.next_appointment_at) }}
                              </div>
                            </div>
                            <div class="flex gap-0.5 flex-none">
                              <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                size="small"
                                severity="secondary"
                                @click="
                                  openFollowupDialog(rc.refer_case_id!, fp)
                                "
                              />
                              <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                size="small"
                                severity="danger"
                                @click="confirmDeleteFollowup(fp)"
                              />
                            </div>
                          </div>
                        </div>
                      </template>
                    </Timeline>

                    <div
                      v-if="rc.status === 'OPEN'"
                      class="flex justify-end mt-2"
                    >
                      <Button
                        icon="pi pi-plus"
                        label="Add Follow-up (บันทึกการติดตาม)"
                        size="small"
                        outlined
                        @click="openFollowupDialog(rc.refer_case_id!)"
                      />
                    </div>
                  </template>
                </div>

                <!-- CTA panel for implicit cases (visit with refer_flag=1, not yet tracked) -->
                <div
                  v-else-if="rc.refer_case_id === null"
                  class="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 border-t border-blue-100"
                >
                  <div class="flex items-center gap-2">
                    <i class="pi pi-info-circle text-blue-500 text-sm" />
                    <span class="text-xs text-blue-700">
                      This visit has a referral — click to start follow-up.
                      (Visit นี้มีการส่งต่อ — กดเพื่อเริ่มบันทึกการติดตาม)
                    </span>
                  </div>
                  <Button
                    icon="pi pi-play"
                    label="Start Follow-up (เริ่มติดตาม)"
                    size="small"
                    severity="info"
                    outlined
                    :loading="caseSaving"
                    @click="beginTrackingCase(rc)"
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- ── Tab 4: Insurance ────────────────────────────────────────── -->
          <TabPanel value="3" class="pt-5">
            <div class="flex items-center justify-center py-12 text-gray-400">
              <div class="text-center">
                <i class="pi pi-id-card text-4xl mb-3 block" />
                <div>
                  Social Security information will appear here
                  (ข้อมูลประกันสังคมจะแสดงที่นี่)
                </div>
                <div class="text-sm mt-1">
                  Under development (อยู่ระหว่างพัฒนา)
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>

  <!-- ── Register External Person Dialog ──────────────────────────────────── -->
  <Dialog
    v-model:visible="showRegisterDialog"
    header="Register External Person (ลงทะเบียนบุคคลภายนอก)"
    modal
    style="width: 480px"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">
          Full Name (ชื่อ-นามสกุล)
          <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="registerForm.full_name"
          placeholder="Enter full name (กรอกชื่อ-นามสกุล)"
          class="w-full"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">
          Company / Organization (บริษัท / องค์กร)
        </label>
        <InputText
          v-model="registerForm.company"
          placeholder="Company name if any (ชื่อบริษัท ถ้ามี)"
          class="w-full"
        />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            National ID (เลขบัตรประชาชน)
          </label>
          <InputText
            v-model="registerForm.national_id"
            placeholder="13-digit national ID (เลขบัตร 13 หลัก)"
            class="w-full"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            Phone Number (เบอร์โทรศัพท์)
          </label>
          <InputText
            v-model="registerForm.phone"
            placeholder="0xx-xxx-xxxx"
            class="w-full"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancel (ยกเลิก)"
        severity="secondary"
        outlined
        @click="showRegisterDialog = false"
      />
      <Button
        label="Register (ลงทะเบียน)"
        icon="pi pi-save"
        :loading="registerLoading"
        @click="saveExternalPerson"
      />
    </template>
  </Dialog>

  <!-- ══ Allergy Management Dialog ══════════════════════════════════════════ -->
  <Dialog
    v-model:visible="showAllergyDialog"
    header="💊 Allergy Management (จัดการยาที่แพ้)"
    :style="{ width: '600px' }"
    modal
  >
    <div v-if="patientProfile?.allergies.length" class="mb-4">
      <div class="text-sm font-semibold text-gray-600 mb-2">
        Current Records (รายการปัจจุบัน)
      </div>
      <div class="space-y-2">
        <div
          v-for="a in patientProfile!.allergies"
          :key="a.allergy_id"
          class="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-gray-50"
        >
          <div>
            <span class="font-medium text-sm">{{ a.drug_name }}</span>
            <span class="ml-2 text-xs text-gray-400">
              {{ a.allergy_type }} · {{ a.severity }}
            </span>
            <span v-if="a.reaction" class="ml-2 text-xs text-gray-500">
              · {{ a.reaction }}
            </span>
          </div>
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              severity="secondary"
              @click="openAllergyDialog(a)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              @click="confirmDeleteAllergy(a)"
            />
          </div>
        </div>
      </div>
      <Divider />
    </div>

    <div class="text-sm font-semibold text-gray-600 mb-3">
      {{
        allergyEditId
          ? '✏️ Edit Record (แก้ไขรายการ)'
          : '➕ Add New Record (เพิ่มรายการใหม่)'
      }}
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">Type (ประเภท)</label>
        <Select
          v-model="allergyForm.allergy_type"
          :options="allergyTypeOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Severity (ระดับความรุนแรง)
        </label>
        <Select
          v-model="allergyForm.severity"
          :options="severityOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1 col-span-2">
        <label class="text-xs font-medium text-gray-600">
          Allergen Name (ชื่อยา/สารที่แพ้)
          <span
            class="ml-2 text-blue-500 cursor-pointer text-xs"
            @click="allergyUseStockItem = !allergyUseStockItem"
          >
            {{
              allergyUseStockItem
                ? '[ Manual Entry (พิมพ์เอง) ]'
                : '[ Select from System (เลือกจากระบบ) ]'
            }}
          </span>
        </label>
        <AutoComplete
          v-if="allergyUseStockItem"
          v-model="allergyNameInput"
          :suggestions="allergyNameSuggest"
          :optionLabel="itemLabel"
          placeholder="Search medicine in system (ค้นหายาในระบบ)"
          fluid
          forceSelection
          @complete="searchAllergyItem"
          @option-select="onSelectAllergyItem"
        >
          <template #option="{ option }">
            <div class="flex flex-col gap-0.5">
              <span class="font-medium text-sm">{{ itemLabel(option) }}</span>
              <span class="text-xs text-gray-400">
                {{ option.item_code }} · Stock: (คงเหลือ)
                {{ option.qty_base ?? 0 }} {{ option.usage_unit_name_th }}
              </span>
            </div>
          </template>
        </AutoComplete>
        <InputText
          v-else
          v-model="allergyForm.allergy_name"
          placeholder="Allergen name (ชื่อยาหรือสารที่แพ้)"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1 col-span-2">
        <label class="text-xs font-medium text-gray-600">
          Reaction (อาการที่เกิดขึ้น)
        </label>
        <Textarea
          v-model="allergyForm.reaction"
          placeholder="e.g. rash, itching (เช่น ผื่นลมพิษ คันตามตัว)"
          rows="2"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Source (แหล่งที่มา)
        </label>
        <Select
          v-model="allergyForm.source"
          :options="sourceOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel (ยกเลิก)"
        severity="secondary"
        outlined
        @click="
          resetAllergyEditor();
          showAllergyDialog = false;
        "
      />
      <Button
        :label="
          allergyEditId
            ? 'Save Changes (บันทึกการแก้ไข)'
            : 'Add Record (เพิ่มรายการ)'
        "
        icon="pi pi-save"
        :loading="allergySaving"
        @click="saveAllergy"
      />
    </template>
  </Dialog>

  <!-- ══ History Detail Dialog ══════════════════════════════════════════════ -->
  <Dialog
    v-model:visible="showHistoryDetail"
    :header="`📋 Visit Details (รายละเอียดการรักษา) — ${patientName}`"
    modal
    style="width: 700px"
    maximizable
    @hide="cancelHistoryEdit"
  >
    <div v-if="historyDetailLoading" class="flex justify-content-center py-6">
      <ProgressSpinner />
    </div>
    <div v-else-if="historyDetailVisit">
      <!-- Visit date/shift summary -->
      <div
        class="surface-100 border-round p-3 mb-3 flex items-center justify-between"
      >
        <div class="text-sm text-color-secondary">
          <i class="pi pi-calendar mr-1" />
          {{ formatDate(historyDetailVisit.visit_datetime) }}
        </div>
      </div>

      <!-- Edit mode banner + reason + actions -->
      <div class="mb-3">
        <div v-if="historyEditMode" class="flex flex-col gap-2 mb-2">
          <div
            class="flex items-center gap-2 text-sm text-orange-600 font-medium"
          >
            <i class="pi pi-pencil" />
            Edit Mode (โหมดแก้ไข)
            <Tag
              v-if="!canEditUsages"
              value="Medicines Locked (รายการยาถูกล็อค)"
              severity="warn"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-gray-600">
              Edit Reason (เหตุผลการแก้ไข)
              <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="historyEditReason"
              placeholder="Enter reason (ระบุเหตุผล)"
              fluid
              :invalid="historyEditReasonInvalid"
              @input="historyEditReasonInvalid = false"
            />
            <small v-if="historyEditReasonInvalid" class="text-red-500">
              Please enter edit reason (กรุณาระบุเหตุผลการแก้ไข)
            </small>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <template v-if="!historyEditMode">
            <Button
              icon="pi pi-trash"
              label="Delete (ลบ)"
              size="small"
              outlined
              severity="danger"
              :loading="historyDeleting"
              @click="deleteHistoryVisit"
            />
            <Button
              icon="pi pi-pencil"
              label="Edit (แก้ไข)"
              size="small"
              outlined
              severity="info"
              @click="enterHistoryEditMode"
            />
          </template>
          <template v-else>
            <Button
              icon="pi pi-times"
              label="Cancel (ยกเลิก)"
              size="small"
              severity="secondary"
              outlined
              :disabled="historyEditSaving"
              @click="cancelHistoryEdit"
            />
            <Button
              icon="pi pi-save"
              label="Save Changes (บันทึกการแก้ไข)"
              size="small"
              :loading="historyEditSaving"
              @click="saveHistoryEdit"
            />
          </template>
        </div>
      </div>

      <Tabs v-model:value="activeHistoryDetailTab">
        <TabList>
          <Tab value="0">Visit Information (ข้อมูล Visit)</Tab>
          <Tab value="1">Vital Signs (สัญญาณชีพ)</Tab>
          <Tab value="2">
            Medicine List (รายการยา) ({{
              historyEditMode
                ? historyEditUsages.filter(r => !r.is_deleted).length
                : historyDetailUsages.length
            }})
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div
              class="text-sm flex flex-col divide-y"
              style="border-color: var(--p-surface-200)"
            >
              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Chief Complaint (อาการ)
                </span>
                <div class="flex-1">
                  <Textarea
                    v-if="historyEditMode"
                    v-model="historyEditForm.symptoms"
                    rows="2"
                    fluid
                    autoResize
                  />
                  <span v-else class="whitespace-pre-wrap">
                    {{ historyDetailVisit.symptoms || '-' }}
                  </span>
                </div>
              </div>

              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Disease Group (กลุ่มโรค)
                </span>
                <div class="flex-1">
                  <Select
                    v-if="historyEditMode"
                    v-model="historyEditForm.group_id"
                    :options="lookups.disease_groups"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    fluid
                    showClear
                    @update:modelValue="historyEditForm.disease_id = null"
                  />
                  <span v-else>
                    {{ historyDetailVisit.disease_group_name || '-' }}
                  </span>
                </div>
              </div>

              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Disease Type (ประเภทโรค)
                </span>
                <div class="flex-1">
                  <Select
                    v-if="historyEditMode"
                    v-model="historyEditForm.disease_id"
                    :options="historyEditFilteredSubGroups"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    fluid
                    showClear
                    :disabled="!historyEditForm.group_id"
                  />
                  <span v-else>
                    {{ historyDetailVisit.disease_sub_group_name || '-' }}
                  </span>
                </div>
              </div>

              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Treatment Type (ประเภทการรักษา)
                </span>
                <div class="flex-1">
                  <Select
                    v-if="historyEditMode"
                    v-model="historyEditForm.treatment_type_id"
                    :options="lookups.treatment_types"
                    :optionLabel="diseaseLabel"
                    optionValue="id"
                    fluid
                    showClear
                  />
                  <template v-else>
                    <Tag
                      v-if="historyDetailVisit.treatment_code"
                      :value="historyDetailVisit.treatment_type_name"
                      :severity="
                        historyTreatmentSeverity(
                          historyDetailVisit.treatment_code
                        )
                      "
                    />
                    <span v-else>-</span>
                  </template>
                </div>
              </div>

              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Accident/Work-related (อุบัติเหตุ/โรคจากงาน)
                </span>
                <div class="flex-1">
                  <div v-if="historyEditMode" class="flex gap-4 flex-wrap">
                    <label
                      class="flex items-center gap-1 cursor-pointer text-sm"
                    >
                      <Checkbox
                        v-model="historyEditForm.accident_in_work_flag"
                        :binary="true"
                      />
                      Work Accident (อุบัติเหตุในงาน)
                    </label>
                    <label
                      class="flex items-center gap-1 cursor-pointer text-sm"
                    >
                      <Checkbox
                        v-model="historyEditForm.work_related_flag"
                        :binary="true"
                      />
                      Work-related Disease (โรคจากการทำงาน)
                    </label>
                  </div>
                  <div v-else class="flex gap-2 flex-wrap">
                    <Tag
                      :value="
                        historyDetailVisit.accident_in_work_flag
                          ? 'Work Accident (อุบัติเหตุในงาน)'
                          : 'No Accident (ไม่ใช่อุบัติเหตุ)'
                      "
                      :severity="
                        historyDetailVisit.accident_in_work_flag
                          ? 'danger'
                          : 'secondary'
                      "
                    />
                    <Tag
                      v-if="historyDetailVisit.work_related_flag"
                      value="Work-related Disease (โรคจากการทำงาน)"
                      severity="warn"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="historyEditMode || historyDetailVisit.severity_id"
                class="flex items-start gap-3 py-2.5"
              >
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Severity (ความรุนแรง)
                </span>
                <div class="flex-1">
                  <Select
                    v-if="historyEditMode"
                    v-model="historyEditForm.severity_id"
                    :options="lookups.severity_types"
                    optionLabel="name_th"
                    optionValue="id"
                    fluid
                    showClear
                  />
                  <span v-else>
                    {{ historyDetailVisit.severity_name || '-' }}
                  </span>
                </div>
              </div>

              <div
                v-if="historyEditMode || historyDetailVisit.refer_flag"
                class="flex items-start gap-3 py-2.5"
              >
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Referral (ส่งต่อ)
                </span>
                <div class="flex-1 flex flex-col gap-1">
                  <template v-if="historyEditMode">
                    <Select
                      v-if="isReferTreatmentEdit"
                      v-model="historyEditForm.refer_type_id"
                      :options="lookups.refer_types"
                      :optionLabel="diseaseLabel"
                      optionValue="id"
                      fluid
                      showClear
                      placeholder="Refer Type (ประเภทการส่งต่อ)"
                    />
                    <span v-else class="text-sm text-gray-400">-</span>
                  </template>
                  <template v-else>
                    <div class="flex items-center gap-2">
                      <Tag value="Referred (ส่งต่อ)" severity="warn" />
                      <span class="text-color-secondary">
                        {{ historyDetailVisit.refer_type_name }} ·
                        {{ historyDetailVisit.hospital_name_th || '-' }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>

              <div class="flex items-start gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Nursing Advice (คำแนะนำพยาบาล)
                </span>
                <div class="flex-1">
                  <Textarea
                    v-if="historyEditMode"
                    v-model="historyEditForm.nursing_advice"
                    rows="2"
                    fluid
                    autoResize
                  />
                  <span v-else class="whitespace-pre-wrap">
                    {{ historyDetailVisit.nursing_advice || '-' }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3 py-2.5">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Recorded By (บันทึกโดย)
                </span>
                <span>{{ historyDetailVisit.created_by }}</span>
              </div>
              <div
                v-if="historyDetailVisit.updated_by"
                class="flex items-center gap-3 py-2.5"
              >
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 9rem"
                >
                  Last Edited By (แก้ไขล่าสุดโดย)
                </span>
                <span>{{ historyDetailVisit.updated_by }}</span>
              </div>
            </div>
          </TabPanel>

          <!-- Tab 1: Vitals -->
          <TabPanel value="1">
            <div
              v-if="historyEditMode"
              class="text-sm flex flex-col divide-y"
              style="border-color: var(--p-surface-200)"
            >
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  BP Systolic (ความดัน Systolic mmHg)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.bp_systolic"
                    fluid
                    :min="0"
                    :max="300"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  BP Diastolic (ความดัน Diastolic mmHg)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.bp_diastolic"
                    fluid
                    :min="0"
                    :max="300"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  Pulse Rate (ชีพจร /min)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.pulse"
                    fluid
                    :min="0"
                    :max="300"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  Temperature (อุณหภูมิ °C)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.temp_c"
                    fluid
                    :minFractionDigits="1"
                    :maxFractionDigits="1"
                    :min="30"
                    :max="45"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  Weight (น้ำหนัก kg)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.weight_kg"
                    fluid
                    :minFractionDigits="1"
                    :maxFractionDigits="1"
                    :min="0"
                    :max="300"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  Height (ส่วนสูง cm)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.height_cm"
                    fluid
                    :minFractionDigits="1"
                    :maxFractionDigits="1"
                    :min="0"
                    :max="250"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  O2 Saturation
                  <span class="text-xs font-normal">(%)</span>
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.spo2"
                    fluid
                    :min="0"
                    :max="100"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 py-2">
                <span
                  class="font-semibold text-color-secondary flex-none"
                  style="width: 12rem"
                >
                  Respiratory Rate (อัตราการหายใจ /min)
                </span>
                <div class="flex-1">
                  <InputNumber
                    v-model="historyEditVitals.rr"
                    fluid
                    :min="0"
                    :max="100"
                  />
                </div>
              </div>
            </div>
            <template v-else>
              <div
                v-if="
                  Object.keys(historyParsedVitals).filter(
                    k => historyParsedVitals[k as keyof IVitals] != null
                  ).length === 0
                "
                class="text-color-secondary text-center py-3"
              >
                No vital signs data (ไม่มีข้อมูลสัญญาณชีพ)
              </div>
              <div
                v-else
                class="text-sm flex flex-col divide-y"
                style="border-color: var(--p-surface-200)"
              >
                <template
                  v-if="
                    historyParsedVitals.bp_systolic != null ||
                    historyParsedVitals.bp_diastolic != null
                  "
                >
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Blood Pressure (ความดันโลหิต)
                    </span>
                    <span>
                      {{ historyParsedVitals.bp_systolic }}/{{
                        historyParsedVitals.bp_diastolic
                      }}
                      <span class="text-color-secondary text-xs">mmHg</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.pulse != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Pulse Rate (ชีพจร)
                    </span>
                    <span>
                      {{ historyParsedVitals.pulse }}
                      <span class="text-color-secondary text-xs">/min</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.temp_c != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Temperature (อุณหภูมิ)
                    </span>
                    <span>
                      {{ historyParsedVitals.temp_c }}
                      <span class="text-color-secondary text-xs">°C</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.weight_kg != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Weight (น้ำหนัก)
                    </span>
                    <span>
                      {{ historyParsedVitals.weight_kg }}
                      <span class="text-color-secondary text-xs">kg</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.height_cm != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Height (ส่วนสูง)
                    </span>
                    <span>
                      {{ historyParsedVitals.height_cm }}
                      <span class="text-color-secondary text-xs">cm</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.spo2 != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      O2 Saturation
                    </span>
                    <span>
                      {{ historyParsedVitals.spo2 }}
                      <span class="text-color-secondary text-xs">%</span>
                    </span>
                  </div>
                </template>
                <template v-if="historyParsedVitals.rr != null">
                  <div class="flex items-center gap-3 py-2.5">
                    <span
                      class="font-semibold text-color-secondary flex-none"
                      style="width: 10rem"
                    >
                      Respiratory Rate (อัตราการหายใจ)
                    </span>
                    <span>
                      {{ historyParsedVitals.rr }}
                      <span class="text-color-secondary text-xs">/min</span>
                    </span>
                  </div>
                </template>
              </div>
            </template>
          </TabPanel>

          <!-- Tab 2: Usages -->
          <TabPanel value="2">
            <!-- Locked banner (edit mode only, when locked) -->
            <div
              v-if="historyEditMode && !canEditUsages"
              class="border-round border-1 border-orange-200 bg-orange-50 p-3 mb-3 text-center"
            >
              <i class="pi pi-lock text-orange-500 mr-2" />
              <span class="text-sm text-orange-700 font-medium">
                Medicines Locked (รายการยาถูกล็อค)
              </span>
              <div class="text-xs text-gray-500 mt-1">
                This visit predates the latest approved stock count. Medicine
                list cannot be edited. (Visit นี้เกิดก่อน Stock Count
                ที่อนุมัติล่าสุด)
              </div>
            </div>

            <!-- Editable table (edit mode + not locked) -->
            <template v-if="historyEditMode && canEditUsages">
              <div
                v-if="historyEditUsages.length > 0"
                class="border border-gray-200 rounded-lg overflow-hidden mb-2"
              >
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        class="text-left px-3 py-2 text-gray-500 font-medium text-xs w-8"
                      >
                        #
                      </th>
                      <th
                        class="text-left px-3 py-2 text-gray-500 font-medium text-xs"
                      >
                        Medicine / Supplies (ยา/เวชภัณฑ์)
                      </th>
                      <th
                        class="text-center px-3 py-2 text-gray-500 font-medium text-xs w-44"
                      >
                        Quantity (จำนวน)
                      </th>
                      <th class="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, i) in historyEditUsages"
                      :key="row.visit_usage_id ?? 'new-' + i"
                      class="border-t border-gray-100"
                      :class="row.is_deleted ? 'bg-red-50' : ''"
                    >
                      <td class="px-3 py-2 text-gray-400 text-xs">
                        {{ i + 1 }}
                      </td>
                      <td class="px-3 py-2">
                        <div
                          :class="
                            row.is_deleted
                              ? 'line-through text-red-400 font-medium'
                              : 'font-medium text-gray-800'
                          "
                        >
                          {{ row.item_name_th || row.item_name }}
                        </div>
                        <div
                          class="text-xs text-gray-400"
                          :class="row.is_deleted ? 'line-through' : ''"
                        >
                          {{ row.item_name }} · {{ row.item_code }}
                        </div>
                        <div
                          v-if="!row.is_deleted"
                          class="text-xs text-blue-500 mt-0.5"
                        >
                          Stock: (คงเหลือ) {{ row.stock_qty }}
                          {{ row.unit_name }}
                        </div>
                      </td>
                      <td class="px-2 py-1.5 text-center">
                        <InputNumber
                          v-if="!row.is_deleted"
                          v-model="row.qty_base"
                          :min="1"
                          showButtons
                          buttonLayout="horizontal"
                          :inputStyle="{ width: '3.5rem', textAlign: 'center' }"
                        />
                        <span v-else class="text-red-400 line-through text-sm">
                          {{ row.qty_base }} {{ row.unit_name }}
                        </span>
                      </td>
                      <td class="px-1 py-1.5">
                        <Button
                          v-if="!row.is_deleted"
                          icon="pi pi-trash"
                          text
                          rounded
                          severity="danger"
                          size="small"
                          v-tooltip="'Delete (ลบ)'"
                          @click="toggleDeleteHistoryUsage(row)"
                        />
                        <Button
                          v-else
                          icon="pi pi-undo"
                          text
                          rounded
                          severity="secondary"
                          size="small"
                          v-tooltip="'Undo Delete (ยกเลิกลบ)'"
                          @click="toggleDeleteHistoryUsage(row)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                v-else
                class="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg mb-2"
              >
                No medicine/supplies added yet (ยังไม่มีรายการยา/เวชภัณฑ์)
              </div>

              <!-- Add new item row -->
              <div
                class="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-3"
              >
                <div class="flex items-end gap-2 flex-wrap">
                  <div class="flex-1 min-w-0">
                    <AutoComplete
                      v-model="historyEditNewItemText"
                      :suggestions="historyEditNewItemSuggest"
                      :optionLabel="itemLabel"
                      placeholder="Search item by name or code (ค้นหายา/เวชภัณฑ์)"
                      fluid
                      forceSelection
                      @complete="searchHistoryEditNewItem"
                      @option-select="onSelectHistoryEditNewItem"
                    >
                      <template #option="{ option }">
                        <div class="flex flex-col gap-0.5">
                          <span class="font-medium text-sm">
                            {{ itemLabel(option) }}
                          </span>
                          <span class="text-xs text-gray-400">
                            {{
                              option.item_name_th
                                ? option.item_name_th + ' · '
                                : ''
                            }}{{ option.item_code }} · Stock: (คงเหลือ)
                            {{ option.qty_base ?? 0 }}
                            {{ option.usage_unit_name_th }}
                          </span>
                        </div>
                      </template>
                    </AutoComplete>
                  </div>
                  <InputNumber
                    v-model="historyEditNewQty"
                    :min="1"
                    :max="historyEditNewItem?.qty_base ?? 9999"
                    showButtons
                    buttonLayout="horizontal"
                    :inputStyle="{ width: '3.5rem', textAlign: 'center' }"
                  />
                  <span
                    class="inline-flex items-center justify-center px-2.5 py-1.5 text-sm border border-gray-300 rounded bg-white min-w-[4rem] text-gray-700 whitespace-nowrap"
                  >
                    {{ historyEditNewItem?.usage_unit_name_th || '—' }}
                  </span>
                  <Button
                    icon="pi pi-plus"
                    label="Add (เพิ่ม)"
                    size="small"
                    severity="success"
                    :disabled="!historyEditNewItem"
                    @click="addHistoryEditUsageRow"
                  />
                </div>
                <div
                  v-if="historyEditNewItem"
                  class="text-xs text-blue-600 mt-1.5 pl-1"
                >
                  Stock: (คงเหลือ) {{ historyEditNewItem.qty_base ?? 0 }}
                  {{ historyEditNewItem.usage_unit_name_th }}
                </div>
              </div>
            </template>

            <!-- Read-only table (read mode OR edit mode + locked) -->
            <DataTable
              v-if="!historyEditMode || !canEditUsages"
              :value="historyDetailUsages"
              class="p-datatable-sm"
              emptyMessage="No medicine/supplies items (ไม่มีรายการยา/อุปกรณ์)"
            >
              <Column header="#" style="width: 3rem">
                <template #body="{ index }">{{ index + 1 }}</template>
              </Column>
              <Column
                field="item_code"
                header="Code (รหัส)"
                style="width: 7rem"
              />
              <Column header="Medicine / Supplies (ชื่อยา/อุปกรณ์)">
                <template #body="{ data }">
                  <div class="font-medium">
                    {{ data.item_name_th || data.item_name_en }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ data.item_name_en }}
                  </div>
                </template>
              </Column>
              <Column
                field="qty_base"
                header="Quantity (จำนวน)"
                style="width: 6rem"
              />
              <Column
                field="unit_name"
                header="Unit (หน่วย)"
                style="width: 5rem"
              />
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </Dialog>

  <!-- ══ Disease Management Dialog ══════════════════════════════════════════ -->
  <Dialog
    v-model:visible="showDiseaseDialog"
    header="🫀 Underlying Disease Management (จัดการโรคประจำตัว)"
    :style="{ width: '600px' }"
    modal
  >
    <div v-if="patientProfile?.underlying_diseases.length" class="mb-4">
      <div class="text-sm font-semibold text-gray-600 mb-2">
        Current Records (รายการปัจจุบัน)
      </div>
      <div class="space-y-2">
        <div
          v-for="d in patientProfile!.underlying_diseases"
          :key="d.condition_id"
          class="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-gray-50"
        >
          <div>
            <span class="font-medium text-sm">{{ d.disease_name }}</span>
            <span v-if="d.diagnosed_year" class="ml-2 text-xs text-gray-400">
              Year (ปี) {{ d.diagnosed_year }}
            </span>
            <span v-if="d.control_status" class="ml-2 text-xs text-gray-500">
              · {{ d.control_status }}
            </span>
          </div>
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              size="small"
              text
              severity="secondary"
              @click="openDiseaseDialog(d)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              @click="confirmDeleteDisease(d)"
            />
          </div>
        </div>
      </div>
      <Divider />
    </div>

    <div class="text-sm font-semibold text-gray-600 mb-3">
      {{
        diseaseEditId
          ? '✏️ Edit Record (แก้ไขรายการ)'
          : '➕ Add New Record (เพิ่มรายการใหม่)'
      }}
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Disease Group (กลุ่มโรค)
        </label>
        <Select
          v-model="diseaseForm.group_id"
          :options="lookups.disease_groups"
          :optionLabel="diseaseLabel"
          optionValue="id"
          placeholder="Select disease group (เลือกกลุ่มโรค)"
          fluid
          showClear
          @change="onSelectDiseaseGroup"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Sub-category (หมวดหมู่ย่อย)
        </label>
        <Select
          v-model="diseaseForm.sub_group_id"
          :options="filteredSubGroupsForDialog"
          :optionLabel="diseaseLabel"
          optionValue="id"
          placeholder="Select sub-category (เลือกหมวดหมู่ย่อย)"
          fluid
          showClear
          :disabled="!diseaseForm.group_id"
          @change="onSelectDiseaseSubGroup"
        />
      </div>
      <div class="flex flex-col gap-1 col-span-2">
        <label class="text-xs font-medium text-gray-600">
          Disease Name / Diagnosis (ชื่อโรค / การวินิจฉัย)
          <span class="text-gray-400"></span>
        </label>
        <InputText
          v-model="diseaseForm.disease_name"
          placeholder="Enter disease name (ระบุชื่อโรค)"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Year Diagnosed AD (ปีที่วินิจฉัย ค.ศ.)
        </label>
        <InputNumber
          v-model="diseaseForm.diagnosed_year"
          :useGrouping="false"
          :min="1900"
          :max="2100"
          placeholder="e.g. 2022"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Disease Control Status (สถานะการควบคุมโรค)
        </label>
        <Select
          v-model="diseaseForm.control_status"
          :options="controlStatusOptions"
          optionLabel="label"
          optionValue="value"
          showClear
          placeholder="Select status (เลือกสถานะ)"
          fluid
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel (ยกเลิก)"
        severity="secondary"
        outlined
        @click="
          resetDiseaseEditor();
          showDiseaseDialog = false;
        "
      />
      <Button
        :label="
          diseaseEditId
            ? 'Save Changes (บันทึกการแก้ไข)'
            : 'Add Record (เพิ่มรายการ)'
        "
        icon="pi pi-save"
        :loading="diseaseSaving"
        @click="saveDisease"
      />
    </template>
  </Dialog>

  <!-- ── Refer Case Dialog ─────────────────────────────────────────────── -->
  <Dialog
    v-model:visible="showCaseDialog"
    :header="
      caseEditId
        ? 'Edit Refer Case (แก้ไข Refer Case)'
        : 'Add Refer Case (เพิ่ม Refer ใหม่)'
    "
    modal
    style="width: 480px"
  >
    <div class="flex flex-col gap-3 pt-1">
      <div v-if="!caseEditId" class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Related Visit (Visit ที่เกี่ยวข้อง)
        </label>
        <Select
          v-model="caseForm.visit_id"
          :options="historyVisits"
          :optionLabel="(v: any) => formatDateTime(v.visit_datetime)"
          optionValue="visit_id"
          placeholder="Select visit (เลือก Visit)"
          fluid
          showClear
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Refer Type (ประเภทการ Refer)
          <span class="text-red-400">*</span>
        </label>
        <Select
          v-model="caseForm.refer_type_id"
          :options="lookups.refer_types"
          :optionLabel="diseaseLabel"
          optionValue="id"
          placeholder="Select type (เลือกประเภท)"
          fluid
          showClear
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Refer Reason (เหตุผลการ Refer)
        </label>
        <Textarea
          v-model="caseForm.refer_reason"
          rows="2"
          autoResize
          fluid
          placeholder="Enter reason (ระบุเหตุผล)"
        />
      </div>
      <div v-if="!caseEditId" class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Referral Date (วันที่ส่งต่อ)
        </label>
        <InputText v-model="caseForm.opened_at" type="date" fluid />
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancel (ยกเลิก)"
        severity="secondary"
        outlined
        @click="showCaseDialog = false"
      />
      <Button
        :label="
          caseEditId
            ? 'Save Changes (บันทึกการแก้ไข)'
            : 'Create Refer (สร้าง Refer)'
        "
        icon="pi pi-save"
        :loading="caseSaving"
        @click="saveCase"
      />
    </template>
  </Dialog>

  <!-- ── Refer Followup Dialog ─────────────────────────────────────────── -->
  <Dialog
    v-model:visible="showFollowupDialog"
    :header="
      followupEditId
        ? 'Edit Follow-up (แก้ไขการติดตามผล)'
        : 'Add Follow-up (บันทึกการติดตามผล)'
    "
    modal
    style="width: 520px"
  >
    <div class="grid grid-cols-2 gap-3 pt-1">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Follow-up Date (วันที่ติดตาม)
          <span class="text-red-400">*</span>
        </label>
        <InputText v-model="followupForm.followup_at" type="date" fluid />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Follow-up Outcome (ผลการติดตาม)
          <span class="text-red-400">*</span>
        </label>
        <Select
          v-model="followupForm.outcome"
          :options="outcomeOptions"
          optionLabel="label"
          optionValue="value"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Hospital (โรงพยาบาล)
        </label>
        <Select
          v-model="followupForm.hospital_id"
          :options="lookups.hospitals"
          optionLabel="hospital_name_th"
          optionValue="hospital_id"
          placeholder="Select hospital (เลือกโรงพยาบาล)"
          fluid
          showClear
          filter
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Room / Department (ห้อง / แผนก)
        </label>
        <InputText
          v-model="followupForm.room_no"
          placeholder="e.g. ER-01"
          fluid
        />
      </div>
      <div
        v-if="followupForm.outcome === 'BACK_TO_COMPANY'"
        class="flex flex-col gap-1"
      >
        <label class="text-xs font-medium text-gray-600">
          Return to Work Date (วันกลับทำงาน)
          <span class="text-red-400">*</span>
        </label>
        <InputText v-model="followupForm.back_to_work_date" type="date" fluid />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Next Appointment (นัดติดตามครั้งต่อไป)
        </label>
        <InputText
          v-model="followupForm.next_appointment_at"
          type="datetime-local"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium text-gray-600">
          Treatment Cost (ค่าใช้จ่ายในการรักษา) THB (บาท)
        </label>
        <InputNumber
          v-model="followupForm.treatment_cost"
          :minFractionDigits="2"
          :maxFractionDigits="2"
          :min="0"
          placeholder="0.00"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1 col-span-2">
        <label class="text-xs font-medium text-gray-600">
          Follow-up Notes (บันทึกการติดตาม)
          <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="followupForm.followup_note"
          rows="2"
          autoResize
          fluid
          placeholder="Follow-up details, required (รายละเอียดการติดตาม จำเป็น)"
        />
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancel (ยกเลิก)"
        severity="secondary"
        outlined
        @click="showFollowupDialog = false"
      />
      <Button
        :label="
          followupEditId
            ? 'Save Changes (บันทึกการแก้ไข)'
            : 'Add Follow-up (บันทึกการติดตาม)'
        "
        icon="pi pi-save"
        :loading="followupSaving"
        @click="saveFollowup"
      />
    </template>
  </Dialog>
</template>

<style>
  .swal-on-top {
    z-index: 9999 !important;
  }
</style>
