<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { TreatmentService } from '@/services/treatment.service';
  import { formatDate } from '@/utils/format.utils';
  import type { IVisitListItem, IVisitDetail, IVisitUsage, IVitals } from '@/interfaces/treatment.interfaces';

  // ─── List ──────────────────────────────────────────────────────────────
  const visits = ref<IVisitListItem[]>([]);
  const loading = ref(false);
  const errorMsg = ref('');

  // ─── Filters ───────────────────────────────────────────────────────────
  const filterDateFrom = ref<Date | null>(null);
  const filterDateTo = ref<Date | null>(null);
  const filterPatientType = ref<string | null>(null);

  const tableFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    patient_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    treatment_type_name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const patientTypeOptions = [
    { label: 'ทั้งหมด', value: null },
    { label: 'พนักงาน', value: 'EMP' },
    { label: 'บุคคลภายนอก', value: 'EXT' },
  ];

  // ─── Detail dialog ─────────────────────────────────────────────────────
  const showDetail = ref(false);
  const detailVisit = ref<IVisitDetail | null>(null);
  const detailUsages = ref<IVisitUsage[]>([]);
  const detailLoading = ref(false);

  // ─── Computed vitals from JSON ─────────────────────────────────────────
  const parsedVitals = computed<IVitals>(() => {
    if (!detailVisit.value?.vitals_json) return {};
    try { return JSON.parse(detailVisit.value.vitals_json); } catch { return {}; }
  });

  // ─────────────────────────────────────────────────────────────────────────
  onMounted(() => loadVisits());

  async function loadVisits() {
    loading.value = true;
    errorMsg.value = '';
    try {
      visits.value = await TreatmentService.getVisitList({
        date_from: filterDateFrom.value?.toISOString().slice(0, 10) || undefined,
        date_to: filterDateTo.value?.toISOString().slice(0, 10) || undefined,
        patient_type: filterPatientType.value || undefined,
        page_size: 100,
        page_no: 1,
      });
    } catch (err: any) {
      errorMsg.value = err?.response?.data?.message || err?.message || String(err);
      console.error('TreatmentHistory error:', err);
    } finally {
      loading.value = false;
    }
  }

  async function openDetail(visit: IVisitListItem) {
    showDetail.value = true;
    detailLoading.value = true;
    detailVisit.value = null;
    detailUsages.value = [];
    try {
      const res = await TreatmentService.getVisitById(visit.visit_id);
      detailVisit.value = res.visit;
      detailUsages.value = res.usages;
    } catch (err: any) {
      console.error('Visit detail error:', err);
    } finally {
      detailLoading.value = false;
    }
  }

  function treatmentSeverity(code: string) {
    const map: Record<string, string> = {
      REST: 'info',
      DRESSING: 'warning',
      SEND_HOME: 'secondary',
      DISPENSE: 'success',
      EYE_WASH: 'contrast',
    };
    return map[code] || 'secondary';
  }

  function patientTypeSeverity(type: string) {
    return type === 'EMP' ? 'info' : 'warning';
  }

  function patientTypeLabel(type: string) {
    return type === 'EMP' ? 'พนักงาน' : 'บุคคลภายนอก';
  }
</script>

<template>
  <div class="card">
    <div class="flex align-items-center gap-2 mb-4">
      <i class="pi pi-history text-primary text-2xl" />
      <h2 class="text-xl font-semibold m-0">ประวัติการรักษาพยาบาล</h2>
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap gap-3 mb-4 align-items-end">
      <div class="flex flex-column gap-1">
        <label class="text-sm font-medium">วันที่เริ่มต้น</label>
        <DatePicker v-model="filterDateFrom" dateFormat="dd/mm/yy" placeholder="จากวันที่" class="w-10rem" showClear />
      </div>
      <div class="flex flex-column gap-1">
        <label class="text-sm font-medium">วันที่สิ้นสุด</label>
        <DatePicker v-model="filterDateTo" dateFormat="dd/mm/yy" placeholder="ถึงวันที่" class="w-10rem" showClear />
      </div>
      <div class="flex flex-column gap-1">
        <label class="text-sm font-medium">ประเภทผู้ป่วย</label>
        <Select v-model="filterPatientType" :options="patientTypeOptions" optionLabel="label" optionValue="value" class="w-10rem" />
      </div>
      <Button label="ค้นหา" icon="pi pi-search" @click="loadVisits" :loading="loading" />
      <div class="flex-1" />
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="tableFilters.global.value" placeholder="ค้นหาในตาราง..." class="w-14rem" />
      </IconField>
    </div>

    <Message v-if="errorMsg" severity="error" class="mb-3">{{ errorMsg }}</Message>

    <DataTable
      :value="visits"
      :loading="loading"
      v-model:filters="tableFilters"
      filterDisplay="menu"
      paginator
      :rows="20"
      :rowsPerPageOptions="[10, 20, 50]"
      class="p-datatable-sm"
      emptyMessage="ไม่พบข้อมูลการรักษา"
      stripedRows
    >
      <Column header="#" style="width: 3.5rem">
        <template #body="{ index }">{{ index + 1 }}</template>
      </Column>
      <Column field="visit_datetime" header="วันที่/เวลา" style="width: 10rem" sortable>
        <template #body="{ data }">{{ formatDate(data.visit_datetime) }}</template>
      </Column>
      <Column field="patient_name" header="ชื่อผู้ป่วย" sortable />
      <Column field="patient_type" header="ประเภท" style="width: 8rem">
        <template #body="{ data }">
          <Tag :value="patientTypeLabel(data.patient_type)" :severity="patientTypeSeverity(data.patient_type)" />
        </template>
      </Column>
      <Column field="symptoms" header="อาการ">
        <template #body="{ data }">
          <span class="text-sm">{{ data.symptoms?.slice(0, 60) || '-' }}{{ data.symptoms?.length > 60 ? '...' : '' }}</span>
        </template>
      </Column>
      <Column field="disease_group_name" header="กลุ่มโรค" style="width: 9rem">
        <template #body="{ data }">{{ data.disease_group_name || '-' }}</template>
      </Column>
      <Column field="treatment_type_name" header="ประเภทการรักษา" style="width: 10rem">
        <template #body="{ data }">
          <Tag
            v-if="data.treatment_code"
            :value="data.treatment_type_name"
            :severity="treatmentSeverity(data.treatment_code)"
          />
          <span v-else>-</span>
        </template>
      </Column>
      <Column header="รายการยา" style="width: 6rem">
        <template #body="{ data }">
          <Badge v-if="data.usage_count > 0" :value="String(data.usage_count)" severity="info" />
          <span v-else class="text-color-secondary text-sm">-</span>
        </template>
      </Column>
      <Column header="" style="width: 5rem">
        <template #body="{ data }">
          <Button icon="pi pi-eye" severity="info" text rounded @click="openDetail(data)" v-tooltip="'ดูรายละเอียด'" />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- ── Detail Dialog ── -->
  <Dialog v-model:visible="showDetail" header="รายละเอียดการรักษา" modal style="width: 700px" maximizable>
    <div v-if="detailLoading" class="flex justify-content-center py-6">
      <ProgressSpinner />
    </div>
    <div v-else-if="detailVisit">
      <!-- Patient info -->
      <div class="surface-100 border-round p-3 mb-3">
        <div class="flex align-items-center gap-3">
          <i class="pi pi-user text-2xl text-primary" />
          <div class="flex-1">
            <div class="font-bold text-lg">
              {{ detailVisit.patient_type === 'EMP' ? detailVisit.employee_id : detailVisit.ext_patient_name }}
            </div>
            <div class="text-sm text-color-secondary">
              {{ detailVisit.patient_type === 'EXT' ? detailVisit.ext_patient_company : '' }}
            </div>
          </div>
          <div class="text-right">
            <Tag :value="patientTypeLabel(detailVisit.patient_type)" :severity="patientTypeSeverity(detailVisit.patient_type)" />
            <div class="text-xs text-color-secondary mt-1">{{ formatDate(detailVisit.visit_datetime) }}</div>
          </div>
        </div>
      </div>

      <TabView>
        <!-- Visit info tab -->
        <TabPanel value="0" header="ข้อมูล Visit">
          <div class="grid text-sm">
            <div class="col-4 text-color-secondary font-medium">กะงาน</div>
            <div class="col-8">{{ detailVisit.shift_code || '-' }}</div>
            <div class="col-4 text-color-secondary font-medium">อาการ</div>
            <div class="col-8">{{ detailVisit.symptoms || '-' }}</div>
            <div class="col-4 text-color-secondary font-medium">กลุ่มโรค</div>
            <div class="col-8">{{ detailVisit.disease_group_name || '-' }}</div>
            <div class="col-4 text-color-secondary font-medium">ประเภทโรค</div>
            <div class="col-8">{{ detailVisit.disease_sub_group_name || '-' }}</div>
            <div class="col-4 text-color-secondary font-medium">ประเภทการรักษา</div>
            <div class="col-8">
              <Tag v-if="detailVisit.treatment_code" :value="detailVisit.treatment_type_name" :severity="treatmentSeverity(detailVisit.treatment_code)" />
              <span v-else>-</span>
            </div>
            <div class="col-4 text-color-secondary font-medium">อุบัติเหตุในงาน</div>
            <div class="col-8">
              <Tag :value="detailVisit.accident_in_work_flag ? 'ใช่' : 'ไม่ใช่'" :severity="detailVisit.accident_in_work_flag ? 'danger' : 'secondary'" />
            </div>
            <template v-if="detailVisit.refer_flag">
              <div class="col-4 text-color-secondary font-medium">ส่งต่อ</div>
              <div class="col-8">
                <Tag value="ส่งต่อ" severity="warning" class="mr-2" />
                {{ detailVisit.refer_type_name }} · {{ detailVisit.hospital_name_th || '-' }}
              </div>
            </template>
            <div class="col-4 text-color-secondary font-medium">คำแนะนำพยาบาล</div>
            <div class="col-8">{{ detailVisit.nursing_advice || '-' }}</div>
            <div class="col-4 text-color-secondary font-medium">บันทึกโดย</div>
            <div class="col-8">{{ detailVisit.created_by }}</div>
          </div>
        </TabPanel>

        <!-- Vitals tab -->
        <TabPanel value="1" header="สัญญาณชีพ">
          <div v-if="Object.keys(parsedVitals).filter(k => parsedVitals[k as keyof IVitals] != null).length === 0" class="text-color-secondary text-center py-3">
            ไม่มีข้อมูลสัญญาณชีพ
          </div>
          <div v-else class="grid text-sm">
            <template v-if="parsedVitals.bp_systolic != null || parsedVitals.bp_diastolic != null">
              <div class="col-5 text-color-secondary font-medium">ความดันโลหิต</div>
              <div class="col-7">{{ parsedVitals.bp_systolic }}/{{ parsedVitals.bp_diastolic }} mmHg</div>
            </template>
            <template v-if="parsedVitals.pulse != null">
              <div class="col-5 text-color-secondary font-medium">ชีพจร</div>
              <div class="col-7">{{ parsedVitals.pulse }} /min</div>
            </template>
            <template v-if="parsedVitals.temp != null">
              <div class="col-5 text-color-secondary font-medium">อุณหภูมิ</div>
              <div class="col-7">{{ parsedVitals.temp }} °C</div>
            </template>
            <template v-if="parsedVitals.weight != null">
              <div class="col-5 text-color-secondary font-medium">น้ำหนัก</div>
              <div class="col-7">{{ parsedVitals.weight }} kg</div>
            </template>
            <template v-if="parsedVitals.height != null">
              <div class="col-5 text-color-secondary font-medium">ส่วนสูง</div>
              <div class="col-7">{{ parsedVitals.height }} cm</div>
            </template>
            <template v-if="parsedVitals.o2_sat != null">
              <div class="col-5 text-color-secondary font-medium">O2 Saturation</div>
              <div class="col-7">{{ parsedVitals.o2_sat }} %</div>
            </template>
            <template v-if="parsedVitals.rr != null">
              <div class="col-5 text-color-secondary font-medium">อัตราการหายใจ</div>
              <div class="col-7">{{ parsedVitals.rr }} /min</div>
            </template>
          </div>
        </TabPanel>

        <!-- Usages tab -->
        <TabPanel value="2" :header="`รายการยา (${detailUsages.length})`">
          <DataTable :value="detailUsages" class="p-datatable-sm" emptyMessage="ไม่มีรายการยา/อุปกรณ์">
            <Column header="#" style="width: 3rem">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column field="item_code" header="รหัส" style="width: 7rem" />
            <Column field="item_name_en" header="ชื่อยา/อุปกรณ์" />
            <Column field="qty_base" header="จำนวน" style="width: 6rem" />
            <Column field="unit_name" header="หน่วย" style="width: 5rem" />
          </DataTable>
        </TabPanel>
      </TabView>
    </div>
  </Dialog>
</template>
