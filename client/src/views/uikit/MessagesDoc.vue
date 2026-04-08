<script lang="ts" setup>
<<<<<<< HEAD
  import { useToast } from 'primevue/usetoast';
  import { ref } from 'vue';

  interface InlineMessage {
    severity: string;
    content: string;
  }
=======
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

interface InlineMessage {
  severity: string;
  content: string;
}
>>>>>>> dev_borrow

  const toast = useToast();
  const message = ref<InlineMessage[]>([]);
  const username = ref(null);
  const email = ref(null);

<<<<<<< HEAD
  function showSuccess() {
    toast.add({
      severity: 'success',
      summary: 'Success Message',
      detail: 'Message Detail',
      life: 3000,
    });
  }

  function showInfo() {
    toast.add({
      severity: 'info',
      summary: 'Info Message',
      detail: 'Message Detail',
      life: 3000,
    });
  }

  function showWarn() {
    toast.add({
      severity: 'warn',
      summary: 'Warn Message',
      detail: 'Message Detail',
      life: 3000,
    });
  }

  function showError() {
    toast.add({
      severity: 'error',
      summary: 'Error Message',
      detail: 'Message Detail',
      life: 3000,
    });
  }
=======
function showSuccess() {
  toast.add({
    severity: 'success',
    summary: 'Success Message',
    detail: 'Message Detail',
    life: 3000,
  });
}

function showInfo() {
  toast.add({ severity: 'info', summary: 'Info Message', detail: 'Message Detail', life: 3000 });
}

function showWarn() {
  toast.add({ severity: 'warn', summary: 'Warn Message', detail: 'Message Detail', life: 3000 });
}

function showError() {
  toast.add({ severity: 'error', summary: 'Error Message', detail: 'Message Detail', life: 3000 });
}
>>>>>>> dev_borrow
</script>

<template>
  <div class="flex flex-col md:flex-row gap-8">
    <div class="md:w-1/2">
      <div class="card">
        <div class="font-semibold text-xl mb-4">Toast</div>
        <div class="flex flex-wrap gap-2">
          <Button @click="showSuccess()" label="Success" severity="success" />
          <Button @click="showInfo()" label="Info" severity="info" />
          <Button @click="showWarn()" label="Warn" severity="warn" />
          <Button @click="showError()" label="Error" severity="danger" />
        </div>

        <div class="font-semibold text-xl mt-4 mb-4">Inline</div>
        <div class="flex flex-wrap mb-4 gap-2">
<<<<<<< HEAD
          <InputText
            v-model="username"
            placeholder="Username"
            aria-label="username"
            invalid
          />
          <Message severity="error">Username is required</Message>
        </div>
        <div class="flex flex-wrap gap-2">
          <InputText
            v-model="email"
            placeholder="Email"
            aria-label="email"
            invalid
          />
=======
          <InputText v-model="username" placeholder="Username" aria-label="username" invalid />
          <Message severity="error">Username is required</Message>
        </div>
        <div class="flex flex-wrap gap-2">
          <InputText v-model="email" placeholder="Email" aria-label="email" invalid />
>>>>>>> dev_borrow
          <Message severity="error" icon="pi pi-times-circle" />
        </div>
      </div>
    </div>
    <div class="md:w-1/2">
      <div class="card">
        <div class="font-semibold text-xl mb-4">Message</div>
        <div class="flex flex-col gap-4 mb-4">
          <Message severity="success">Success Message</Message>
          <Message severity="info">Info Message</Message>
          <Message severity="warn">Warn Message</Message>
          <Message severity="error">Error Message</Message>
          <Message severity="secondary">Secondary Message</Message>
          <Message severity="contrast">Contrast Message</Message>
        </div>

        <transition-group name="p-message" tag="div">
<<<<<<< HEAD
          <Message
            v-for="msg of message"
            :severity="msg.severity"
            :key="msg.content"
          >
            {{ msg.content }}
          </Message>
=======
          <Message v-for="msg of message" :severity="msg.severity" :key="msg.content">{{
            msg.content
          }}</Message>
>>>>>>> dev_borrow
        </transition-group>
      </div>
    </div>
  </div>
</template>
