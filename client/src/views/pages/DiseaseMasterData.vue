<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import Swal from 'sweetalert2';
  import { MasterDataService } from '@/services/master-data.service';
  import type {
    IDiseaseGroupLookup,
    IDiseaseGroupMasterData,
    IDiseaseGroupUpsertBody,
    IDiseaseTypeMasterData,
    IDiseaseTypeUpsertBody,
  } from '@/interfaces/master-data.interfaces';

  const activeTab = ref<'groups' | 'types'>('groups');

  const loadingGroups = ref(false);
  const loadingTypes = ref(false);
  const savingGroup = ref(false);
  const savingType = ref(false);

  const groupRows = ref<IDiseaseGroupMasterData[]>([]);
  const typeRows = ref<IDiseaseTypeMasterData[]>([]);
  const groupOptions = ref<IDiseaseGroupLookup[]>([]);

  const groupSearchText = ref('');
  const typeSearchText = ref('');
  const showInactiveGroups = ref(false);
  const showInactiveTypes = ref(false);
  const typeGroupFilter = ref<number | null>(null);

  const groupDialogVisible = ref(false);
  const typeDialogVisible = ref(false);
  const isEditingGroup = ref(false);
  const isEditingType = ref(false);
  const editingGroupId = ref<number | null>(null);
  const editingTypeId = ref<number | null>(null);
  const groupSubmitted = ref(false);
  const typeSubmitted = ref(false);

  const groupForm = ref<IDiseaseGroupUpsertBody>({
    group_code: '',
    group_name_en: '',
    group_name_th: '',
    sort_order: 0,
  });

  const typeForm = ref<IDiseaseTypeUpsertBody>({
    group_id: 0,
    sub_group_code: '',
    sub_group_name_en: '',
    sub_group_name_th: '',
    sort_order: 0,
  });

  onMounted(async () => {
    await Promise.all([loadGroupOptions(), loadGroupRows(), loadTypeRows()]);
  });

  function displayName(nameEn: string | null, nameTh: string | null): string {
    const en = nameEn?.trim();
    if (en) return en;
    const th = nameTh?.trim();
    return th || '-';
  }

  function getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message;
      if (msg) return msg;
    }
    if (error instanceof Error) return error.message;
    return 'Unexpected error';
  }

  async function loadGroupOptions(): Promise<void> {
    groupOptions.value = await MasterDataService.getDiseaseGroupOptions();
  }

  async function loadGroupRows(): Promise<void> {
    loadingGroups.value = true;
    try {
      groupRows.value = await MasterDataService.getDiseaseGroups({
        search: groupSearchText.value,
        includeInactive: showInactiveGroups.value,
      });
    } finally {
      loadingGroups.value = false;
    }
  }

  async function loadTypeRows(): Promise<void> {
    loadingTypes.value = true;
    try {
      typeRows.value = await MasterDataService.getDiseaseTypes({
        groupId: typeGroupFilter.value,
        search: typeSearchText.value,
        includeInactive: showInactiveTypes.value,
      });
    } finally {
      loadingTypes.value = false;
    }
  }

  function groupOptionLabel(group: IDiseaseGroupLookup): string {
    return `${group.group_code} - ${displayName(group.group_name_en, group.group_name_th)}`;
  }

  function typeGroupDisplay(row: IDiseaseTypeMasterData): string {
    const display = displayName(row.group_name_en, row.group_name_th);
    const code = row.group_code?.trim();
    return code ? `${display} (${code})` : display;
  }

  const groupErrors = computed(() => ({
    group_code: !groupForm.value.group_code.trim()
      ? 'Group code is required.'
      : groupForm.value.group_code.trim().length > 20
        ? 'Group code must be 20 characters or less.'
        : '',
    group_name_th: !groupForm.value.group_name_th.trim()
      ? 'Thai name is required.'
      : '',
    sort_order:
      !Number.isInteger(groupForm.value.sort_order) ||
      (groupForm.value.sort_order ?? 0) < 0
        ? 'Sort order must be an integer greater than or equal to 0.'
        : '',
  }));

  const typeErrors = computed(() => ({
    group_id:
      !Number.isInteger(typeForm.value.group_id) || typeForm.value.group_id <= 0
        ? 'Disease group is required.'
        : '',
    sub_group_code: !typeForm.value.sub_group_code.trim()
      ? 'Type code is required.'
      : typeForm.value.sub_group_code.trim().length > 20
        ? 'Type code must be 20 characters or less.'
        : '',
    sub_group_name_th: !typeForm.value.sub_group_name_th.trim()
      ? 'Thai name is required.'
      : '',
    sort_order:
      !Number.isInteger(typeForm.value.sort_order) ||
      (typeForm.value.sort_order ?? 0) < 0
        ? 'Sort order must be an integer greater than or equal to 0.'
        : '',
  }));

  const canSaveGroup = computed(
    () => !Object.values(groupErrors.value).some(Boolean)
  );
  const canSaveType = computed(
    () => !Object.values(typeErrors.value).some(Boolean)
  );

  function resetGroupForm(): void {
    editingGroupId.value = null;
    isEditingGroup.value = false;
    groupSubmitted.value = false;
    groupForm.value = {
      group_code: '',
      group_name_en: '',
      group_name_th: '',
      sort_order: 0,
    };
  }

  function resetTypeForm(): void {
    editingTypeId.value = null;
    isEditingType.value = false;
    typeSubmitted.value = false;
    typeForm.value = {
      group_id: 0,
      sub_group_code: '',
      sub_group_name_en: '',
      sub_group_name_th: '',
      sort_order: 0,
    };
  }

  function openCreateGroup(): void {
    resetGroupForm();
    groupDialogVisible.value = true;
  }

  function openCreateType(): void {
    resetTypeForm();
    if (typeGroupFilter.value) {
      typeForm.value.group_id = typeGroupFilter.value;
    }
    typeDialogVisible.value = true;
  }

  function openEditGroup(row: IDiseaseGroupMasterData): void {
    resetGroupForm();
    isEditingGroup.value = true;
    editingGroupId.value = row.group_id;
    groupForm.value = {
      group_code: row.group_code,
      group_name_en: row.group_name_en || '',
      group_name_th: row.group_name_th,
      sort_order: row.sort_order,
    };
    groupDialogVisible.value = true;
  }

  function openEditType(row: IDiseaseTypeMasterData): void {
    resetTypeForm();
    isEditingType.value = true;
    editingTypeId.value = row.sub_group_id;
    typeForm.value = {
      group_id: row.group_id,
      sub_group_code: row.sub_group_code,
      sub_group_name_en: row.sub_group_name_en || '',
      sub_group_name_th: row.sub_group_name_th,
      sort_order: row.sort_order,
    };
    typeDialogVisible.value = true;
  }

  async function saveGroup(): Promise<void> {
    groupSubmitted.value = true;
    if (!canSaveGroup.value) return;

    const payload: IDiseaseGroupUpsertBody = {
      group_code: groupForm.value.group_code.trim(),
      group_name_en: groupForm.value.group_name_en?.trim(),
      group_name_th: groupForm.value.group_name_th.trim(),
      sort_order: groupForm.value.sort_order ?? 0,
    };

    savingGroup.value = true;
    try {
      if (isEditingGroup.value && editingGroupId.value != null) {
        await MasterDataService.updateDiseaseGroup(
          editingGroupId.value,
          payload
        );
      } else {
        await MasterDataService.createDiseaseGroup(payload);
      }
      groupDialogVisible.value = false;
      await Promise.all([loadGroupOptions(), loadGroupRows(), loadTypeRows()]);
      await Swal.fire({
        icon: 'success',
        title: 'Saved successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Unable to save. Please check required fields.',
        text: getErrorMessage(error),
      });
    } finally {
      savingGroup.value = false;
    }
  }

  async function saveType(): Promise<void> {
    typeSubmitted.value = true;
    if (!canSaveType.value) return;

    const payload: IDiseaseTypeUpsertBody = {
      group_id: typeForm.value.group_id,
      sub_group_code: typeForm.value.sub_group_code.trim(),
      sub_group_name_en: typeForm.value.sub_group_name_en?.trim(),
      sub_group_name_th: typeForm.value.sub_group_name_th.trim(),
      sort_order: typeForm.value.sort_order ?? 0,
    };

    savingType.value = true;
    try {
      if (isEditingType.value && editingTypeId.value != null) {
        await MasterDataService.updateDiseaseType(editingTypeId.value, payload);
      } else {
        await MasterDataService.createDiseaseType(payload);
      }
      typeDialogVisible.value = false;
      await Promise.all([loadGroupOptions(), loadTypeRows()]);
      await Swal.fire({
        icon: 'success',
        title: 'Saved successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Unable to save. Please check required fields.',
        text: getErrorMessage(error),
      });
    } finally {
      savingType.value = false;
    }
  }

  async function deactivateGroup(row: IDiseaseGroupMasterData): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Deactivate this group?',
      text: 'This action will set the record to inactive.',
      showCancelButton: true,
      confirmButtonText: 'Deactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await MasterDataService.deleteDiseaseGroup(row.group_id);
      await Promise.all([loadGroupRows(), loadTypeRows()]);
      await Swal.fire({
        icon: 'success',
        title: 'Deactivated successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      await Swal.fire({
        icon: message.includes('cannot') ? 'warning' : 'error',
        title: message.includes('cannot')
          ? 'This record is in use and cannot be deactivated.'
          : 'Unable to save. Please check required fields.',
        text: message,
      });
    }
  }

  async function deactivateType(row: IDiseaseTypeMasterData): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Deactivate this type?',
      text: 'This action will set the record to inactive.',
      showCancelButton: true,
      confirmButtonText: 'Deactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await MasterDataService.deleteDiseaseType(row.sub_group_id);
      await loadTypeRows();
      await Swal.fire({
        icon: 'success',
        title: 'Deactivated successfully',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      await Swal.fire({
        icon: 'error',
        title: 'Unable to save. Please check required fields.',
        text: getErrorMessage(error),
      });
    }
  }
</script>

<template>
  <div class="card p-4">
    <div class="flex items-center gap-2 mb-4">
      <i class="pi pi-folder text-primary text-2xl" />
      <h2 class="text-xl font-semibold m-0">Disease Master Data</h2>
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="groups">Disease Groups</Tab>
        <Tab value="types">Disease Types</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="groups">
          <div class="flex items-end gap-2 flex-wrap mb-3">
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="groupSearchText"
                placeholder="Search by code or name"
                @keydown.enter="loadGroupRows"
              />
            </IconField>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="showInactiveGroups"
                binary
                @change="loadGroupRows"
              />
              <label class="text-sm">Show inactive</label>
            </div>
            <Button
              icon="pi pi-refresh"
              outlined
              severity="secondary"
              @click="loadGroupRows"
            />
            <div class="flex-1" />
            <Button
              icon="pi pi-plus"
              label="Add Disease Group"
              @click="openCreateGroup"
            />
          </div>

          <DataTable
            :value="groupRows"
            dataKey="group_id"
            :loading="loadingGroups"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            responsiveLayout="scroll"
            emptyMessage="No records found"
          >
            <Column field="group_code" header="Code" style="width: 9rem" />
            <Column header="Name">
              <template #body="{ data }">
                {{ displayName(data.group_name_en, data.group_name_th) }}
              </template>
            </Column>
            <Column field="group_name_th" header="Thai Name" />
            <Column field="sort_order" header="Sort" style="width: 7rem" />
            <Column header="Status" style="width: 8rem">
              <template #body="{ data }">
                <Tag
                  :value="data.is_active ? 'Active' : 'Inactive'"
                  :severity="data.is_active ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="Actions" style="width: 8rem">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    text
                    severity="info"
                    @click="openEditGroup(data)"
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    severity="danger"
                    :disabled="!data.is_active"
                    @click="deactivateGroup(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <TabPanel value="types">
          <div class="flex items-end gap-2 flex-wrap mb-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm">Group Filter</label>
              <Select
                v-model="typeGroupFilter"
                :options="groupOptions"
                :optionLabel="groupOptionLabel"
                optionValue="group_id"
                placeholder="All groups"
                class="w-20rem"
                showClear
                filter
                @change="loadTypeRows"
              />
            </div>

            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="typeSearchText"
                placeholder="Search by group/code/name"
                @keydown.enter="loadTypeRows"
              />
            </IconField>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="showInactiveTypes"
                binary
                @change="loadTypeRows"
              />
              <label class="text-sm">Show inactive</label>
            </div>
            <Button
              icon="pi pi-refresh"
              outlined
              severity="secondary"
              @click="loadTypeRows"
            />
            <div class="flex-1" />
            <Button
              icon="pi pi-plus"
              label="Add Disease Type"
              @click="openCreateType"
            />
          </div>

          <DataTable
            :value="typeRows"
            dataKey="sub_group_id"
            :loading="loadingTypes"
            paginator
            :rows="10"
            :rowsPerPageOptions="[10, 20, 50]"
            responsiveLayout="scroll"
            emptyMessage="No records found"
          >
            <Column header="Group" style="min-width: 16rem">
              <template #body="{ data }">
                {{ typeGroupDisplay(data) }}
              </template>
            </Column>
            <Column
              field="sub_group_code"
              header="Type Code"
              style="width: 10rem"
            />
            <Column header="Type Name">
              <template #body="{ data }">
                {{
                  displayName(data.sub_group_name_en, data.sub_group_name_th)
                }}
              </template>
            </Column>
            <Column field="sub_group_name_th" header="Thai Name" />
            <Column field="sort_order" header="Sort" style="width: 7rem" />
            <Column header="Status" style="width: 8rem">
              <template #body="{ data }">
                <Tag
                  :value="data.is_active ? 'Active' : 'Inactive'"
                  :severity="data.is_active ? 'success' : 'secondary'"
                />
              </template>
            </Column>
            <Column header="Actions" style="width: 8rem">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    text
                    severity="info"
                    @click="openEditType(data)"
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    severity="danger"
                    :disabled="!data.is_active"
                    @click="deactivateType(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Dialog
      v-model:visible="groupDialogVisible"
      :header="isEditingGroup ? 'Edit Disease Group' : 'Add Disease Group'"
      modal
      :style="{ width: '640px' }"
    >
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Group Code
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="groupForm.group_code" />
          <small
            v-if="groupSubmitted && groupErrors.group_code"
            class="text-red-500"
          >
            {{ groupErrors.group_code }}
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sort Order</label>
          <InputNumber
            v-model="groupForm.sort_order"
            :min="0"
            :useGrouping="false"
          />
          <small
            v-if="groupSubmitted && groupErrors.sort_order"
            class="text-red-500"
          >
            {{ groupErrors.sort_order }}
          </small>
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Group Name (English)</label>
          <InputText v-model="groupForm.group_name_en" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Group Name (Thai)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="groupForm.group_name_th" />
          <small
            v-if="groupSubmitted && groupErrors.group_name_th"
            class="text-red-500"
          >
            {{ groupErrors.group_name_th }}
          </small>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          text
          severity="secondary"
          @click="groupDialogVisible = false"
        />
        <Button
          label="Save"
          icon="pi pi-save"
          :disabled="savingGroup || !canSaveGroup"
          :loading="savingGroup"
          @click="saveGroup"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="typeDialogVisible"
      :header="isEditingType ? 'Edit Disease Type' : 'Add Disease Type'"
      modal
      :style="{ width: '720px' }"
    >
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Disease Group
            <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="typeForm.group_id"
            :options="groupOptions"
            :optionLabel="groupOptionLabel"
            optionValue="group_id"
            placeholder="Select disease group"
            filter
          />
          <small
            v-if="typeSubmitted && typeErrors.group_id"
            class="text-red-500"
          >
            {{ typeErrors.group_id }}
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">
            Type Code
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="typeForm.sub_group_code" />
          <small
            v-if="typeSubmitted && typeErrors.sub_group_code"
            class="text-red-500"
          >
            {{ typeErrors.sub_group_code }}
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm">Sort Order</label>
          <InputNumber
            v-model="typeForm.sort_order"
            :min="0"
            :useGrouping="false"
          />
          <small
            v-if="typeSubmitted && typeErrors.sort_order"
            class="text-red-500"
          >
            {{ typeErrors.sort_order }}
          </small>
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">Type Name (English)</label>
          <InputText v-model="typeForm.sub_group_name_en" />
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm">
            Type Name (Thai)
            <span class="text-red-500">*</span>
          </label>
          <InputText v-model="typeForm.sub_group_name_th" />
          <small
            v-if="typeSubmitted && typeErrors.sub_group_name_th"
            class="text-red-500"
          >
            {{ typeErrors.sub_group_name_th }}
          </small>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          text
          severity="secondary"
          @click="typeDialogVisible = false"
        />
        <Button
          label="Save"
          icon="pi pi-save"
          :disabled="savingType || !canSaveType"
          :loading="savingType"
          @click="saveType"
        />
      </template>
    </Dialog>
  </div>
</template>
