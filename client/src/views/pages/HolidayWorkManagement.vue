<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import Swal from 'sweetalert2';
  import { HolidayWorkService } from '@/services/holiday-work.service';
  import { formatSysdatetimeoffset } from '@/utils/format.utils';
  import type {
    IHolidayWorkAnnouncement,
    HolidayWorkMessageType,
  } from '@/interfaces/holiday-work.interfaces';

  const loading = ref(false);
  const announcements = ref<IHolidayWorkAnnouncement[]>([]);
  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const showDialog = ref(false);
  const isEdit = ref(false);
  const submitted = ref(false);

  const form = ref({
    work_date: new Date(),
    day_shift_count: 0,
    night_shift_count: 0,
    message_type: 'NORMAL_8AM' as HolidayWorkMessageType,
    custom_message: '' as string | null,
  });

  const messageTypeOptions = [
    {
      label: 'เข้าเวร 05:00 น. (ฝากกระเป๋ายาที่ป้อมยาม)',
      value: 'CHECK_IN_5AM',
    },
    { label: 'ไม่มีเวรทั้งกลางวันและกลางคืน', value: 'NO_SHIFT_ALL' },
    { label: 'เข้าเวรปกติ 08:00 น.', value: 'NORMAL_8AM' },
    { label: 'อื่นๆ (ระบุข้อความเอง)', value: 'OTHER' },
  ];

  const getMessageLabel = (type: HolidayWorkMessageType) => {
    return messageTypeOptions.find(opt => opt.value === type)?.label || type;
  };

  const tableData = computed(() => {
    return announcements.value.map((a, index) => ({
      ...a,
      rowNo: index + 1,
    }));
  });

  async function loadAnnouncements() {
    loading.value = true;
    try {
      announcements.value = await HolidayWorkService.getAll();
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadAnnouncements();
  });

  function openNew() {
    isEdit.value = false;
    submitted.value = false;
    form.value = {
      work_date: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to tomorrow
      day_shift_count: 0,
      night_shift_count: 0,
      message_type: 'NORMAL_8AM',
      custom_message: null,
    };
    showDialog.value = true;
  }

  function editAnnouncement(data: IHolidayWorkAnnouncement) {
    isEdit.value = true;
    submitted.value = false;
    form.value = {
      work_date: new Date(data.work_date),
      day_shift_count: data.day_shift_count,
      night_shift_count: data.night_shift_count,
      message_type: data.message_type,
      custom_message: data.custom_message,
    };
    showDialog.value = true;
  }

  async function confirmDelete(data: IHolidayWorkAnnouncement) {
    const result = await Swal.fire({
      title: 'Confirm Delete?',
      text: `Do you want to delete the announcement for ${data.work_date}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    });

    if (result.isConfirmed) {
      try {
        loading.value = true;
        await HolidayWorkService.delete(data.work_date);
        await Swal.fire(
          'Deleted!',
          'Announcement has been deleted.',
          'success'
        );
        await loadAnnouncements();
      } catch (error: any) {
        await Swal.fire(
          'Error',
          error.response?.data?.message || error.message,
          'error'
        );
      } finally {
        loading.value = false;
      }
    }
  }

  async function saveAnnouncement() {
    submitted.value = true;

    // Validation
    if (
      form.value.message_type === 'OTHER' &&
      !form.value.custom_message?.trim()
    ) {
      return;
    }

    try {
      loading.value = true;

      // Format date to YYYY-MM-DD manually to avoid timezone shift from toISOString()
      const d = form.value.work_date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const payload = {
        ...form.value,
        work_date: formattedDate,
        custom_message:
          form.value.message_type === 'OTHER'
            ? form.value.custom_message
            : null,
      };

      if (isEdit.value) {
        await HolidayWorkService.update(payload.work_date, payload);
        await Swal.fire(
          'Updated!',
          'Successfully updated the announcement.',
          'success'
        );
      } else {
        await HolidayWorkService.create(payload);
        await Swal.fire(
          'Created!',
          'Successfully created the announcement.',
          'success'
        );
      }
      showDialog.value = false;
      await loadAnnouncements();
    } catch (error: any) {
      await Swal.fire(
        'Error',
        error.response?.data?.message || error.message,
        'error'
      );
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => form.value.message_type,
    newType => {
      if (newType !== 'OTHER') {
        form.value.custom_message = null;
      }
    }
  );

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<template>
  <div>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold">Holiday Work Management</h2>
        <p class="text-surface-500 mt-1">
          Manage announcements for holiday work shifts
        </p>
      </div>
      <Button icon="pi pi-plus" label="Add Announcement" @click="openNew" />
    </div>

    <DataTable
      :value="tableData"
      v-model:filters="filters"
      :loading="loading"
      dataKey="work_date"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20]"
      :globalFilterFields="['work_date', 'custom_message']"
      class="p-datatable-sm"
    >
      <template #header>
        <div class="flex justify-end">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters.global.value" placeholder="Search..." />
          </IconField>
        </div>
      </template>

      <Column field="rowNo" header="#" style="width: 70px" />
      <Column field="work_date" header="Date" sortable>
        <template #body="{ data }">
          <span class="font-bold text-primary">
            {{ formatDate(data.work_date) }}
          </span>
        </template>
      </Column>
      <Column header="Shift Counts" style="min-width: 150px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Tag severity="info" :value="`Day: ${data.day_shift_count}`" />
            <Tag
              severity="secondary"
              :value="`Night: ${data.night_shift_count}`"
            />
          </div>
        </template>
      </Column>
      <Column field="message_type" header="Message Type">
        <template #body="{ data }">
          <div class="flex flex-col">
            <span class="font-medium">
              {{ getMessageLabel(data.message_type) }}
            </span>
            <small
              v-if="data.message_type === 'OTHER'"
              class="text-surface-500 italic"
            >
              "{{ data.custom_message }}"
            </small>
          </div>
        </template>
      </Column>
      <Column field="updated_at" header="Last Updated">
        <template #body="{ data }">
          {{ data.updated_at ? formatSysdatetimeoffset(data.updated_at) : '-' }}
        </template>
      </Column>
      <Column header="Actions" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="warn"
              @click="editAnnouncement(data)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="showDialog"
    modal
    :style="{ width: '450px' }"
    :header="isEdit ? 'Edit Announcement' : 'Add Announcement'"
    class="p-fluid"
  >
    <div class="field mb-4">
      <label for="work_date" class="block mb-2 font-medium">Work Date</label>
      <DatePicker
        id="work_date"
        v-model="form.work_date"
        dateFormat="yy-mm-dd"
        :disabled="isEdit"
        showIcon
        class="w-full"
      />
      <small v-if="isEdit" class="text-surface-500">
        Date cannot be changed once created.
      </small>
    </div>

    <div class="grid grid-cols-12 gap-4 mb-4">
      <div class="col-span-4">
        <label for="day_shift" class="block mb-2 font-medium">
          Day Shift Count
        </label>
        <InputNumber
          id="day_shift"
          v-model="form.day_shift_count"
          :min="0"
          showButtons
          buttonLayout="horizontal"
          :inputStyle="{ width: '60px', textAlign: 'center' }"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
        />
      </div>
      <div class="col-span-4">
        <label for="night_shift" class="block mb-2 font-medium">
          Night Shift Count
        </label>
        <InputNumber
          id="night_shift"
          v-model="form.night_shift_count"
          :min="0"
          showButtons
          buttonLayout="horizontal"
          :inputStyle="{ width: '60px', textAlign: 'center' }"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
        />
      </div>
    </div>

    <div class="field mb-4">
      <label for="message_type" class="block mb-2 font-medium">
        Message Type
      </label>
      <Select
        id="message_type"
        v-model="form.message_type"
        :options="messageTypeOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select a Message Type"
        class="w-full"
      />
    </div>

    <div v-if="form.message_type === 'OTHER'" class="field mb-4">
      <label for="custom_message" class="block mb-2 font-medium">
        Custom Message
      </label>
      <Textarea
        id="custom_message"
        v-model="form.custom_message"
        rows="3"
        required
        :class="{ 'p-invalid': submitted && !form.custom_message }"
        placeholder="Enter custom announcement message"
      />
      <small class="p-error" v-if="submitted && !form.custom_message">
        Custom message is required when type is 'OTHER'.
      </small>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="showDialog = false"
      />
      <Button label="Save" icon="pi pi-check" @click="saveAnnouncement" />
    </template>
  </Dialog></div>
</template>

<style scoped>
  .field label {
    display: block;
  }
</style>
