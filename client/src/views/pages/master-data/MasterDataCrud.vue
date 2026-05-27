<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import Swal from 'sweetalert2';
  import { MasterDataService } from '@/services/master-data.service';
  import SupplierPriceListDialog from './SupplierPriceListDialog.vue';
  import type {
    IHospitalMasterData,
    IHospitalTypeLookup,
    IHospitalUpsertBody,
    IItemMasterData,
    IItemTypeLookup,
    IItemUpsertBody,
    IReferTypeMasterData,
    IReferTypeUpsertBody,
    ISupplierMasterData,
    ISupplierUpsertBody,
    ITreatmentTypeMasterData,
    ITreatmentTypeUpsertBody,
    IUnitMasterData,
    IUnitUpsertBody,
  } from '@/interfaces/master-data.interfaces';

  type MasterDataKind =
    | 'suppliers'
    | 'treatment-types'
    | 'refer-types'
    | 'hospitals'
    | 'items'
    | 'units';

  type MasterDataRow =
    | ISupplierMasterData
    | ITreatmentTypeMasterData
    | IReferTypeMasterData
    | IHospitalMasterData
    | IItemMasterData
    | IUnitMasterData;

  interface IProps {
    kind: MasterDataKind;
  }

  const props = defineProps<IProps>();

  const loading = ref(false);
  const rows = ref<MasterDataRow[]>([]);
  const searchText = ref('');
  const dialogVisible = ref(false);
  const supplierPriceDialogVisible = ref(false);
  const selectedSupplier = ref<ISupplierMasterData | null>(null);
  const saving = ref(false);
  const isEditing = ref(false);
  const editingId = ref<number | null>(null);

  const itemTypes = ref<IItemTypeLookup[]>([]);
  const activeUnits = ref<IUnitMasterData[]>([]);
  const hospitalTypes = ref<IHospitalTypeLookup[]>([]);

  const supplierForm = ref<ISupplierUpsertBody>({
    supplier_code: '',
    supplier_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    note: '',
  });

  const treatmentTypeForm = ref<ITreatmentTypeUpsertBody>({
    treatment_code: '',
    treatment_name_th: '',
    treatment_name_en: '',
    sort_order: 0,
  });

  const referTypeForm = ref<IReferTypeUpsertBody>({
    refer_code: '',
    refer_name_th: '',
    refer_name_en: '',
    sort_order: 0,
  });

  const hospitalForm = ref<IHospitalUpsertBody>({
    hospital_code: '',
    hospital_name_th: '',
    hospital_name_en: '',
    hospital_type: '',
    phone: '',
    address: '',
  });

  const unitForm = ref<IUnitUpsertBody>({
    unit_code: '',
    unit_name_th: '',
    unit_name_en: '',
  });

  const itemForm = ref<IItemUpsertBody>({
    item_code: '',
    item_name_th: '',
    item_name_en: '',
    item_type_id: 0,
    usage_unit_id: 0,
    item_min: null,
    item_max: null,
  });

  const pageConfig = computed(() => {
    if (props.kind === 'suppliers') {
      return {
        title: 'Suppliers (ผู้จัดจำหน่าย)',
        icon: 'pi pi-truck',
        addLabel: 'Add Supplier (เพิ่มผู้จัดจำหน่าย)',
        editLabel: 'Edit Supplier (แก้ไขผู้จัดจำหน่าย)',
        dialogWidth: '760px',
      };
    }
    if (props.kind === 'treatment-types') {
      return {
        title: 'Treatment Types (ประเภทการรักษา)',
        icon: 'pi pi-clipboard',
        addLabel: 'Add Treatment Type (เพิ่มประเภทการรักษา)',
        editLabel: 'Edit Treatment Type (แก้ไขประเภทการรักษา)',
        dialogWidth: '560px',
      };
    }
    if (props.kind === 'refer-types') {
      return {
        title: 'Refer Types (ประเภทการ Refer)',
        icon: 'pi pi-directions',
        addLabel: 'Add Refer Type (เพิ่มประเภทการ Refer)',
        editLabel: 'Edit Refer Type (แก้ไขประเภทการ Refer)',
        dialogWidth: '560px',
      };
    }
    if (props.kind === 'hospitals') {
      return {
        title: 'Hospitals (สถานพยาบาล)',
        icon: 'pi pi-building',
        addLabel: 'Add Hospital (เพิ่มสถานพยาบาล)',
        editLabel: 'Edit Hospital (แก้ไขสถานพยาบาล)',
        dialogWidth: '760px',
      };
    }
    if (props.kind === 'units') {
      return {
        title: 'Units (หน่วยนับ)',
        icon: 'pi pi-sort-numeric-up',
        addLabel: 'Add Unit (เพิ่มหน่วยนับ)',
        editLabel: 'Edit Unit (แก้ไขหน่วยนับ)',
        dialogWidth: '560px',
      };
    }
    return {
      title: 'Items (รายการยา/เวชภัณฑ์)',
      icon: 'pi pi-list',
      addLabel: 'Add Item (เพิ่มรายการยา/เวชภัณฑ์)',
      editLabel: 'Edit Item (แก้ไขรายการยา/เวชภัณฑ์)',
      dialogWidth: '860px',
    };
  });

  const dialogTitle = computed(() =>
    isEditing.value ? pageConfig.value.editLabel : pageConfig.value.addLabel
  );

  const tableDataKey = computed(() => {
    if (props.kind === 'suppliers') return 'supplier_id';
    if (props.kind === 'treatment-types') return 'treatment_type_id';
    if (props.kind === 'refer-types') return 'refer_type_id';
    if (props.kind === 'hospitals') return 'hospital_id';
    if (props.kind === 'units') return 'unit_id';
    return 'item_id';
  });

  onMounted(async () => {
    await loadRows();
    if (props.kind === 'hospitals') {
      await loadHospitalTypeLookups();
    } else if (props.kind === 'items') {
      await loadItemLookups();
    }
  });

  function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message;
      if (msg) return msg;
    }
    if (error instanceof Error) return error.message;
    return 'Unexpected error';
  }

  async function loadRows(): Promise<void> {
    loading.value = true;
    try {
      if (props.kind === 'suppliers') {
        rows.value = await MasterDataService.getSuppliers(searchText.value);
      } else if (props.kind === 'treatment-types') {
        rows.value = await MasterDataService.getTreatmentTypes(
          searchText.value
        );
      } else if (props.kind === 'refer-types') {
        rows.value = await MasterDataService.getReferTypes(searchText.value);
      } else if (props.kind === 'hospitals') {
        rows.value = await MasterDataService.getHospitals(searchText.value);
      } else if (props.kind === 'units') {
        rows.value = await MasterDataService.getUnits(searchText.value);
      } else {
        rows.value = await MasterDataService.getItems(searchText.value);
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadItemLookups(): Promise<void> {
    const [types, units] = await Promise.all([
      MasterDataService.getItemTypes(),
      MasterDataService.getUnits(),
    ]);
    itemTypes.value = types;
    activeUnits.value = units;
  }

  async function loadHospitalTypeLookups(): Promise<void> {
    hospitalTypes.value = await MasterDataService.getHospitalTypes();
  }

  function resetForm(): void {
    editingId.value = null;
    isEditing.value = false;
    supplierForm.value = {
      supplier_code: '',
      supplier_name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      tax_id: '',
      note: '',
    };
    treatmentTypeForm.value = {
      treatment_code: '',
      treatment_name_th: '',
      treatment_name_en: '',
      sort_order: 0,
    };
    referTypeForm.value = {
      refer_code: '',
      refer_name_th: '',
      refer_name_en: '',
      sort_order: 0,
    };
    hospitalForm.value = {
      hospital_code: '',
      hospital_name_th: '',
      hospital_name_en: '',
      hospital_type: '',
      phone: '',
      address: '',
    };
    unitForm.value = {
      unit_code: '',
      unit_name_th: '',
      unit_name_en: '',
    };
    itemForm.value = {
      item_code: '',
      item_name_th: '',
      item_name_en: '',
      item_type_id: 0,
      usage_unit_id: 0,
      item_min: null,
      item_max: null,
    };
  }

  async function openCreate(): Promise<void> {
    resetForm();
    if (props.kind === 'hospitals' && !hospitalTypes.value.length) {
      await loadHospitalTypeLookups();
    }
    dialogVisible.value = true;
  }

  async function openEdit(row: MasterDataRow): Promise<void> {
    resetForm();
    isEditing.value = true;

    if (props.kind === 'suppliers') {
      const data = row as ISupplierMasterData;
      editingId.value = data.supplier_id;
      supplierForm.value = {
        supplier_code: data.supplier_code,
        supplier_name: data.supplier_name,
        contact_name: data.contact_name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        tax_id: data.tax_id || '',
        note: data.note || '',
      };
    } else if (props.kind === 'treatment-types') {
      const data = row as ITreatmentTypeMasterData;
      editingId.value = data.treatment_type_id;
      treatmentTypeForm.value = {
        treatment_code: data.treatment_code,
        treatment_name_th: data.treatment_name_th,
        treatment_name_en: data.treatment_name_en || '',
        sort_order: data.sort_order,
      };
    } else if (props.kind === 'refer-types') {
      const data = row as IReferTypeMasterData;
      editingId.value = data.refer_type_id;
      referTypeForm.value = {
        refer_code: data.refer_code,
        refer_name_th: data.refer_name_th,
        refer_name_en: data.refer_name_en || '',
        sort_order: data.sort_order,
      };
    } else if (props.kind === 'hospitals') {
      const data = row as IHospitalMasterData;
      editingId.value = data.hospital_id;
      if (!hospitalTypes.value.length) {
        await loadHospitalTypeLookups();
      }
      hospitalForm.value = {
        hospital_code: data.hospital_code,
        hospital_name_th: data.hospital_name_th,
        hospital_name_en: data.hospital_name_en || '',
        hospital_type: data.hospital_type || '',
        phone: data.phone || '',
        address: data.address || '',
      };
    } else if (props.kind === 'units') {
      const data = row as IUnitMasterData;
      editingId.value = data.unit_id;
      unitForm.value = {
        unit_code: data.unit_code,
        unit_name_th: data.unit_name_th || '',
        unit_name_en: data.unit_name_en || '',
      };
    } else {
      const data = row as IItemMasterData;
      editingId.value = data.item_id;
      if (!itemTypes.value.length || !activeUnits.value.length) {
        await loadItemLookups();
      }
      itemForm.value = {
        item_code: data.item_code,
        item_name_th: data.item_name_th,
        item_name_en: data.item_name_en,
        item_type_id: data.item_type_id,
        usage_unit_id: data.usage_unit_id,
        item_min: data.item_min,
        item_max: data.item_max,
      };
    }

    dialogVisible.value = true;
  }

  function openSupplierPriceDialog(row: MasterDataRow): void {
    if (props.kind !== 'suppliers') return;
    selectedSupplier.value = row as ISupplierMasterData;
    supplierPriceDialogVisible.value = true;
  }

  function validateForm(): boolean {
    if (props.kind === 'suppliers') {
      if (!supplierForm.value.supplier_code?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter supplier code (กรุณาระบุรหัสผู้จัดจำหน่าย)',
        });
        return false;
      }
      if (!supplierForm.value.supplier_name?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter supplier name (กรุณาระบุชื่อผู้จัดจำหน่าย)',
        });
        return false;
      }
      return true;
    }

    if (props.kind === 'treatment-types') {
      if (!treatmentTypeForm.value.treatment_code?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter treatment code (กรุณาระบุรหัสประเภทการรักษา)',
        });
        return false;
      }
      if (!treatmentTypeForm.value.treatment_name_th?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title:
            'Please enter treatment name (TH) (กรุณาระบุชื่อประเภทการรักษา ภาษาไทย)',
        });
        return false;
      }
      if ((treatmentTypeForm.value.sort_order ?? 0) < 0) {
        void Swal.fire({
          icon: 'warning',
          title:
            'Sort order must be 0 or greater (ลำดับต้องมากกว่าหรือเท่ากับ 0)',
        });
        return false;
      }
      return true;
    }

    if (props.kind === 'refer-types') {
      if (!referTypeForm.value.refer_code?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter refer code (กรุณาระบุรหัสประเภท Refer)',
        });
        return false;
      }
      if (!referTypeForm.value.refer_name_th?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title:
            'Please enter refer name (TH) (กรุณาระบุชื่อประเภท Refer ภาษาไทย)',
        });
        return false;
      }
      if ((referTypeForm.value.sort_order ?? 0) < 0) {
        void Swal.fire({
          icon: 'warning',
          title:
            'Sort order must be 0 or greater (ลำดับต้องมากกว่าหรือเท่ากับ 0)',
        });
        return false;
      }
      return true;
    }

    if (props.kind === 'hospitals') {
      if (isEditing.value && !hospitalForm.value.hospital_code?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter hospital code (กรุณาระบุรหัสสถานพยาบาล)',
        });
        return false;
      }
      if (!hospitalForm.value.hospital_name_th?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title:
            'Please enter hospital name (TH) (กรุณาระบุชื่อสถานพยาบาล ภาษาไทย)',
        });
        return false;
      }
      return true;
    }

    if (props.kind === 'units') {
      if (!unitForm.value.unit_code?.trim()) {
        void Swal.fire({
          icon: 'warning',
          title: 'Please enter unit code (กรุณาระบุรหัสหน่วยนับ)',
        });
        return false;
      }
      return true;
    }

    if (isEditing.value && !itemForm.value.item_code?.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Please enter item code (กรุณาระบุรหัสรายการยา/เวชภัณฑ์)',
      });
      return false;
    }
    if (!itemForm.value.item_name_th?.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Please enter item name (TH) (กรุณาระบุชื่อรายการ ภาษาไทย)',
      });
      return false;
    }
    if (!itemForm.value.item_name_en?.trim()) {
      void Swal.fire({
        icon: 'warning',
        title: 'Please enter item name (EN) (กรุณาระบุชื่อรายการ ภาษาอังกฤษ)',
      });
      return false;
    }
    if (!itemForm.value.item_type_id || itemForm.value.item_type_id <= 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Please select item type (กรุณาเลือกประเภทรายการ)',
      });
      return false;
    }
    if (!itemForm.value.usage_unit_id || itemForm.value.usage_unit_id <= 0) {
      void Swal.fire({
        icon: 'warning',
        title: 'Please select usage unit (กรุณาเลือกหน่วยนับการใช้งาน)',
      });
      return false;
    }
    if (
      itemForm.value.item_min != null &&
      itemForm.value.item_max != null &&
      itemForm.value.item_min > itemForm.value.item_max
    ) {
      void Swal.fire({
        icon: 'warning',
        title:
          'item_min must be less than or equal to item_max (ค่าขั้นต่ำต้องไม่มากกว่าค่าสูงสุด)',
      });
      return false;
    }
    return true;
  }

  async function save(): Promise<void> {
    if (!validateForm()) return;

    saving.value = true;
    try {
      if (props.kind === 'suppliers') {
        const payload: ISupplierUpsertBody = {
          supplier_code: supplierForm.value.supplier_code.trim(),
          supplier_name: supplierForm.value.supplier_name.trim(),
          contact_name: supplierForm.value.contact_name?.trim(),
          phone: supplierForm.value.phone?.trim(),
          email: supplierForm.value.email?.trim(),
          address: supplierForm.value.address?.trim(),
          tax_id: supplierForm.value.tax_id?.trim(),
          note: supplierForm.value.note?.trim(),
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateSupplier(editingId.value, payload);
        } else {
          await MasterDataService.createSupplier(payload);
        }
      } else if (props.kind === 'treatment-types') {
        const payload: ITreatmentTypeUpsertBody = {
          treatment_code: treatmentTypeForm.value.treatment_code.trim(),
          treatment_name_th: treatmentTypeForm.value.treatment_name_th.trim(),
          treatment_name_en: treatmentTypeForm.value.treatment_name_en?.trim(),
          sort_order: treatmentTypeForm.value.sort_order ?? 0,
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateTreatmentType(editingId.value, payload);
        } else {
          await MasterDataService.createTreatmentType(payload);
        }
      } else if (props.kind === 'refer-types') {
        const payload: IReferTypeUpsertBody = {
          refer_code: referTypeForm.value.refer_code.trim(),
          refer_name_th: referTypeForm.value.refer_name_th.trim(),
          refer_name_en: referTypeForm.value.refer_name_en?.trim(),
          sort_order: referTypeForm.value.sort_order ?? 0,
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateReferType(editingId.value, payload);
        } else {
          await MasterDataService.createReferType(payload);
        }
      } else if (props.kind === 'hospitals') {
        const payload: IHospitalUpsertBody = {
          hospital_code: hospitalForm.value.hospital_code.trim(),
          hospital_name_th: hospitalForm.value.hospital_name_th.trim(),
          hospital_name_en: hospitalForm.value.hospital_name_en?.trim(),
          hospital_type: hospitalForm.value.hospital_type?.trim(),
          phone: hospitalForm.value.phone?.trim(),
          address: hospitalForm.value.address?.trim(),
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateHospital(editingId.value, payload);
        } else {
          await MasterDataService.createHospital(payload);
        }
      } else if (props.kind === 'units') {
        const payload: IUnitUpsertBody = {
          unit_code: unitForm.value.unit_code.trim(),
          unit_name_th: unitForm.value.unit_name_th?.trim(),
          unit_name_en: unitForm.value.unit_name_en?.trim(),
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateUnit(editingId.value, payload);
        } else {
          await MasterDataService.createUnit(payload);
        }
      } else {
        const payload: IItemUpsertBody = {
          item_code: itemForm.value.item_code.trim(),
          item_name_th: itemForm.value.item_name_th.trim(),
          item_name_en: itemForm.value.item_name_en.trim(),
          item_type_id: itemForm.value.item_type_id,
          usage_unit_id: itemForm.value.usage_unit_id,
          item_min: itemForm.value.item_min ?? null,
          item_max: itemForm.value.item_max ?? null,
        };
        if (isEditing.value && editingId.value != null) {
          await MasterDataService.updateItem(editingId.value, payload);
        } else {
          await MasterDataService.createItem(payload);
        }
      }

      dialogVisible.value = false;
      await loadRows();
      await Swal.fire({
        icon: 'success',
        title: isEditing.value ? 'Updated successfully' : 'Saved successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Operation failed',
        text: getErrorMessage(error),
      });
    } finally {
      saving.value = false;
    }
  }

  async function confirmDelete(row: MasterDataRow): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm disable record?',
      text: 'The record will be set to inactive',
      showCancelButton: true,
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      if (props.kind === 'suppliers') {
        await MasterDataService.deleteSupplier(
          (row as ISupplierMasterData).supplier_id
        );
      } else if (props.kind === 'treatment-types') {
        await MasterDataService.deleteTreatmentType(
          (row as ITreatmentTypeMasterData).treatment_type_id
        );
      } else if (props.kind === 'refer-types') {
        await MasterDataService.deleteReferType(
          (row as IReferTypeMasterData).refer_type_id
        );
      } else if (props.kind === 'hospitals') {
        await MasterDataService.deleteHospital(
          (row as IHospitalMasterData).hospital_id
        );
      } else if (props.kind === 'units') {
        await MasterDataService.deleteUnit((row as IUnitMasterData).unit_id);
      } else {
        await MasterDataService.deleteItem((row as IItemMasterData).item_id);
      }

      await loadRows();
      await Swal.fire({
        icon: 'success',
        title: 'Disabled successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Cannot disable record',
        text: getErrorMessage(error),
      });
    }
  }

  function unitLabel(opt: IUnitMasterData): string {
    const en = opt.unit_name_en || '';
    const th = opt.unit_name_th || '';
    const name = en ? `${en}${th ? ` (${th})` : ''}` : th || '-';
    return `${opt.unit_code} - ${name}`;
  }

  function hospitalTypeLabel(opt: IHospitalTypeLookup): string {
    const en = opt.type_name_en?.trim() || '';
    const th = opt.type_name_th?.trim() || '';
    return en ? `${en}${th ? ` (${th})` : ''}` : th || opt.hospital_type;
  }

  function hospitalTypeDisplay(typeNameTh: string | null): string {
    if (!typeNameTh) return '-';
    const matched = hospitalTypes.value.find(
      type => type.type_name_th === typeNameTh
    );
    return matched ? hospitalTypeLabel(matched) : typeNameTh;
  }
</script>

<template>
  <div class="card p-4">
    <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
      <h2 class="text-xl font-semibold m-0 flex items-center gap-2">
        <i :class="pageConfig.icon" />
        {{ pageConfig.title }}
      </h2>

      <div class="flex items-center gap-2">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchText"
            placeholder="Search by code or name (ค้นหารหัสหรือชื่อ)"
            @keydown.enter="loadRows"
          />
        </IconField>
        <Button
          icon="pi pi-refresh"
          outlined
          severity="secondary"
          @click="loadRows"
        />
        <Button
          icon="pi pi-plus"
          :label="pageConfig.addLabel"
          @click="openCreate"
        />
      </div>
    </div>

    <DataTable
      :value="rows"
      :dataKey="tableDataKey"
      :loading="loading"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50]"
      class="p-datatable-sm"
      responsiveLayout="scroll"
      emptyMessage="No data found (ไม่พบข้อมูล)"
    >
      <template v-if="props.kind === 'suppliers'">
        <Column
          field="supplier_code"
          header="Code (รหัส)"
          style="width: 8rem"
        />
        <Column
          field="supplier_name"
          header="Supplier Name (ชื่อผู้จัดจำหน่าย)"
        />
        <Column
          field="contact_name"
          header="Contact (ผู้ติดต่อ)"
          style="width: 12rem"
        />
        <Column field="phone" header="Phone (โทรศัพท์)" style="width: 10rem" />
        <Column field="email" header="Email" style="width: 14rem" />
        <Column field="tax_id" header="Tax ID" style="width: 9rem" />
      </template>

      <template v-else-if="props.kind === 'treatment-types'">
        <Column
          field="treatment_code"
          header="Code (รหัส)"
          style="width: 9rem"
        />
        <Column field="treatment_name_th" header="Name (TH) (ชื่อไทย)" />
        <Column field="treatment_name_en" header="Name (EN) (ชื่ออังกฤษ)" />
        <Column
          field="sort_order"
          header="Sort Order (ลำดับ)"
          style="width: 8rem"
        />
      </template>

      <template v-else-if="props.kind === 'refer-types'">
        <Column field="refer_code" header="Code (รหัส)" style="width: 9rem" />
        <Column field="refer_name_th" header="Name (TH) (ชื่อไทย)" />
        <Column field="refer_name_en" header="Name (EN) (ชื่ออังกฤษ)" />
        <Column
          field="sort_order"
          header="Sort Order (ลำดับ)"
          style="width: 8rem"
        />
      </template>

      <template v-else-if="props.kind === 'hospitals'">
        <Column
          field="hospital_code"
          header="Code (รหัส)"
          style="width: 9rem"
        />
        <Column
          field="hospital_name_th"
          header="Hospital Name (TH) (ชื่อสถานพยาบาลภาษาไทย)"
        />
        <Column
          field="hospital_name_en"
          header="Hospital Name (EN) (ชื่อสถานพยาบาลภาษาอังกฤษ)"
        />
        <Column header="Type (ประเภท)" style="width: 16rem">
          <template #body="{ data }">
            <span>{{ hospitalTypeDisplay(data.hospital_type) }}</span>
          </template>
        </Column>
        <Column field="phone" header="Phone (โทรศัพท์)" style="width: 10rem" />
      </template>

      <template v-else-if="props.kind === 'units'">
        <Column field="unit_code" header="Code (รหัส)" style="width: 9rem" />
        <Column field="unit_name_th" header="Name (TH) (ชื่อไทย)" />
        <Column field="unit_name_en" header="Name (EN) (ชื่ออังกฤษ)" />
      </template>

      <template v-else>
        <Column field="item_code" header="Code (รหัส)" style="width: 9rem" />
        <Column field="item_name_th" header="Item Name (TH) (ชื่อไทย)" />
        <Column field="item_name_en" header="Item Name (EN) (ชื่ออังกฤษ)" />
        <Column
          field="item_type_name"
          header="Item Type (ประเภทรายการ)"
          style="width: 12rem"
        />
        <Column header="Usage Unit (หน่วยใช้งาน)" style="width: 12rem">
          <template #body="{ data }">
            <span>
              {{ data.usage_unit_name_th || data.usage_unit_name_en || '-' }}
            </span>
          </template>
        </Column>
        <Column header="Min / Max" style="width: 8rem">
          <template #body="{ data }">
            <span>{{ data.item_min ?? '-' }} / {{ data.item_max ?? '-' }}</span>
          </template>
        </Column>
      </template>

      <Column header="Actions (จัดการ)" style="width: 10rem">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <Button
              v-if="props.kind === 'suppliers'"
              icon="pi pi-tags"
              text
              severity="help"
              aria-label="Manage items and prices"
              @click="openSupplierPriceDialog(data)"
            />
            <Button
              icon="pi pi-pencil"
              text
              severity="info"
              @click="openEdit(data)"
            />
            <Button
              icon="pi pi-trash"
              text
              severity="danger"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="dialogTitle"
      modal
      :style="{ width: pageConfig.dialogWidth }"
    >
      <div v-if="props.kind === 'suppliers'" class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Supplier Code (รหัสผู้จัดจำหน่าย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="supplierForm.supplier_code" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Supplier Name (ชื่อผู้จัดจำหน่าย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="supplierForm.supplier_name" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Contact Name (ชื่อผู้ติดต่อ)</label>
          <InputText v-model="supplierForm.contact_name" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Phone (โทรศัพท์)</label>
          <InputText v-model="supplierForm.phone" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Email</label>
          <InputText v-model="supplierForm.email" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Tax ID</label>
          <InputText v-model="supplierForm.tax_id" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Address (ที่อยู่)</label>
          <Textarea v-model="supplierForm.address" rows="2" autoResize />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Note (หมายเหตุ)</label>
          <Textarea v-model="supplierForm.note" rows="2" autoResize />
        </div>
      </div>

      <div
        v-else-if="props.kind === 'treatment-types'"
        class="grid grid-cols-2 gap-3"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Treatment Code (รหัสประเภทการรักษา)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="treatmentTypeForm.treatment_code" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sort Order (ลำดับ)</label>
          <InputNumber
            v-model="treatmentTypeForm.sort_order"
            :min="0"
            :useGrouping="false"
          />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Name (TH) (ชื่อไทย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="treatmentTypeForm.treatment_name_th" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Name (EN) (ชื่ออังกฤษ)</label>
          <InputText v-model="treatmentTypeForm.treatment_name_en" />
        </div>
      </div>

      <div
        v-else-if="props.kind === 'refer-types'"
        class="grid grid-cols-2 gap-3"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Refer Code (รหัสประเภท Refer)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="referTypeForm.refer_code" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sort Order (ลำดับ)</label>
          <InputNumber
            v-model="referTypeForm.sort_order"
            :min="0"
            :useGrouping="false"
          />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Name (TH) (ชื่อไทย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="referTypeForm.refer_name_th" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Name (EN) (ชื่ออังกฤษ)</label>
          <InputText v-model="referTypeForm.refer_name_en" />
        </div>
      </div>

      <div
        v-else-if="props.kind === 'hospitals'"
        class="grid grid-cols-2 gap-3"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Hospital Code (รหัสสถานพยาบาล)
            <span class="text-blue-500">(System Managed)</span>
          </label>
          <InputText
            v-model="hospitalForm.hospital_code"
            :disabled="true"
            :placeholder="isEditing ? '' : 'System will generate HXXXX'"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Hospital Type (ประเภทสถานพยาบาล)</label>
          <Select
            v-model="hospitalForm.hospital_type"
            :options="hospitalTypes"
            :optionLabel="hospitalTypeLabel"
            optionValue="type_name_th"
            placeholder="Select hospital type (เลือกประเภทสถานพยาบาล)"
            showClear
            filter
          />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Hospital Name (TH) (ชื่อสถานพยาบาลภาษาไทย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="hospitalForm.hospital_name_th" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Hospital Name (EN) (ชื่อสถานพยาบาลภาษาอังกฤษ)
          </label>
          <InputText v-model="hospitalForm.hospital_name_en" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Phone (โทรศัพท์)</label>
          <InputText v-model="hospitalForm.phone" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Address (ที่อยู่)</label>
          <Textarea v-model="hospitalForm.address" rows="2" autoResize />
        </div>
      </div>

      <div v-else-if="props.kind === 'units'" class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Unit Code (รหัสหน่วยนับ)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="unitForm.unit_code" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Name (TH) (ชื่อไทย)</label>
          <InputText v-model="unitForm.unit_name_th" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Name (EN) (ชื่ออังกฤษ)</label>
          <InputText v-model="unitForm.unit_name_en" />
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Item Code (รหัสรายการ)
            <span class="text-blue-500">(System Managed)</span>
          </label>
          <InputText
            v-model="itemForm.item_code"
            :disabled="true"
            :placeholder="isEditing ? '' : 'System will generate DR/MDXXXX'"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Item Type (ประเภทรายการ)
            <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="itemForm.item_type_id"
            :options="itemTypes"
            optionLabel="item_type_name"
            optionValue="item_type_id"
            placeholder="Select item type (เลือกประเภทรายการ)"
          />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Item Name (TH) (ชื่อรายการภาษาไทย)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="itemForm.item_name_th" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Item Name (EN) (ชื่อรายการภาษาอังกฤษ)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="itemForm.item_name_en" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Usage Unit (หน่วยใช้งาน)
            <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="itemForm.usage_unit_id"
            :options="activeUnits"
            :optionLabel="unitLabel"
            optionValue="unit_id"
            placeholder="Select usage unit (เลือกหน่วยใช้งาน)"
            filter
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Item Min (ขั้นต่ำ)</label>
          <InputNumber
            v-model="itemForm.item_min"
            :min="0"
            :useGrouping="false"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Item Max (สูงสุด)</label>
          <InputNumber
            v-model="itemForm.item_max"
            :min="0"
            :useGrouping="false"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel (ยกเลิก)"
          severity="secondary"
          outlined
          @click="dialogVisible = false"
        />
        <Button
          :label="isEditing ? 'Save Changes (บันทึกการแก้ไข)' : 'Save (บันทึก)'"
          icon="pi pi-save"
          :loading="saving"
          @click="save"
        />
      </template>
    </Dialog>

    <SupplierPriceListDialog
      v-model="supplierPriceDialogVisible"
      :supplier="selectedSupplier"
      @saved="loadRows"
    />
  </div>
</template>
