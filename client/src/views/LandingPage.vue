<script lang="ts" setup>
  import { useRouter } from 'vue-router';
  import { useMainStore } from '@/stores/main.store';
  import Button from 'primevue/button';
  import Card from 'primevue/card';
  import { onMounted } from 'vue';

  const router = useRouter();
  const mainStore = useMainStore();

  const navigateToDashboard = () => {
    router.push({ name: 'dashboard' });
  };

  onMounted(async () => {
    await mainStore.getEmployees();
  });

  const features = [
    {
      icon: '👥',
      title: 'การจัดการพยาบาล',
      description: 'จัดการข้อมูลพยาบาลและการมอบหมายหน้าที่อย่างมีประสิทธิภาพ',
    },
    {
      icon: '🏥',
      title: 'จัดการห้องพยาบาล',
      description: 'ติดตามสถานะห้องพยาบาล ความว่างเปล่า และความพร้อมใช้งาน',
    },
    {
      icon: '📋',
      title: 'ลงทะเบียนผู้ป่วย',
      description: 'บันทึก จัดการข้อมูลผู้ป่วยและประวัติการรักษา',
    },
    {
      icon: '⏰',
      title: 'ตารางเวลา',
      description: 'จัดการตารางเวลาการทำงานและการกำหนดการของพยาบาล',
    },
    {
      icon: '📊',
      title: 'รายงานและวิเคราะห์',
      description: 'สร้างรายงานและวิเคราะห์ข้อมูลเพื่อการตัดสินใจ',
    },
    {
      icon: '🔔',
      title: 'การแจ้งเตือน',
      description: 'รับการแจ้งเตือนแบบเรียลไทม์สำหรับเหตุการณ์สำคัญ',
    },
  ];
</script>

<template>
  <div
    class="landing-page bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white"
  >
    <!-- Navigation Bar -->
    <nav
      class="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700"
    >
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"
      >
        <div class="flex items-center gap-2 text-2xl font-bold">
          <span class="text-3xl">🏥</span>
<<<<<<< HEAD
          <span
            class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Nurse Room
          </span>
=======
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
            >Nurse Room</span
          >
>>>>>>> dev_borrow
        </div>
        <Button
          label="เข้าสู่ระบบ"
          @click="navigateToDashboard"
          class="!bg-blue-600 hover:!bg-blue-700"
        />
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-6 py-20 text-center">
      <div class="mb-8 animate-pulse">
        <div class="text-6xl mb-4">🏥</div>
        <h1
          class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
        >
          Nurse Room Management System
        </h1>
<<<<<<< HEAD
        <p
          class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed"
        >
=======
        <p class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
>>>>>>> dev_borrow
          ระบบจัดการห้องพยาบาลแบบครบถ้วน ช่วยให้การบริหารและจัดการห้องพยาบาล
          และพยาบาลทำงานได้อย่างมีประสิทธิภาพสูงสุด
        </p>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col md:flex-row gap-4 justify-center mb-16">
        <Button
          label="เข้าใช้งานระบบ"
          @click="navigateToDashboard"
          class="!bg-gradient-to-r !from-blue-600 !to-cyan-600 hover:!from-blue-700 hover:!to-cyan-700 !px-8 !py-3 !text-lg"
          icon="pi pi-arrow-right"
          icon-pos="right"
        />
        <Button
          label="ดูเพิ่มเติม"
          severity="secondary"
          class="!bg-slate-700 hover:!bg-slate-600 !px-8 !py-3 !text-lg"
          outlined
        />
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-6 mb-16">
        <Card class="!bg-slate-800 !border-slate-700">
          <template #content>
            <div class="text-4xl font-bold text-blue-400 mb-2">
              {{ mainStore._employees?.length || 0 }}
            </div>
            <div class="text-slate-400">พยาบาลที่ลงทะเบียน</div>
          </template>
        </Card>
        <Card class="!bg-slate-800 !border-slate-700">
          <template #content>
            <div class="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
            <div class="text-slate-400">ความพร้อมใช้งาน</div>
          </template>
        </Card>
        <Card class="!bg-slate-800 !border-slate-700">
          <template #content>
            <div class="text-4xl font-bold text-emerald-400 mb-2">100%</div>
            <div class="text-slate-400">ประสิทธิภาพ</div>
          </template>
        </Card>
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-7xl mx-auto px-6 py-20">
      <h2
        class="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
      >
        ฟีเจอร์หลัก
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="group bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-lg border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <div
            class="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300"
          >
            {{ feature.icon }}
          </div>
          <h3 class="text-xl font-bold mb-3 text-white">{{ feature.title }}</h3>
          <p class="text-slate-400">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- How to Use Section -->
    <section class="max-w-7xl mx-auto px-6 py-20">
      <h2
        class="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
      >
        วิธีการใช้งาน
      </h2>

      <div class="space-y-8">
        <div class="flex gap-6 items-start group">
          <div class="flex-shrink-0">
            <div
              class="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors"
            >
              <span class="text-white font-bold text-lg">1</span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-2">เข้าสู่ระบบ</h3>
            <p class="text-slate-400">ลงชื่อเข้าใช้งานด้วยบัญชีของคุณ</p>
          </div>
        </div>

        <div class="flex gap-6 items-start group">
          <div class="flex-shrink-0">
            <div
              class="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors"
            >
              <span class="text-white font-bold text-lg">2</span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-2">จัดการข้อมูล</h3>
            <p class="text-slate-400">
              ตั้งค่า ข้อมูลพยาบาล ห้องพยาบาล และผู้ป่วย
            </p>
          </div>
        </div>

        <div class="flex gap-6 items-start group">
          <div class="flex-shrink-0">
            <div
              class="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 group-hover:bg-blue-500 transition-colors"
            >
              <span class="text-white font-bold text-lg">3</span>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-2">ติดตามสถานะ</h3>
            <p class="text-slate-400">ติดตามการทำงานและรายงาน แบบเรียลไทม์</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="max-w-7xl mx-auto px-6 py-20">
      <div
        class="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-12 text-center"
      >
        <h2 class="text-3xl font-bold mb-4">พร้อมที่จะเริ่มต้นหรือยัง?</h2>
        <p class="text-lg mb-8 opacity-90">
<<<<<<< HEAD
          เข้าใช้งานระบบ Nurse Room Management
          ทันทีและเพิ่มประสิทธิภาพการทำงานของคุณ
=======
          เข้าใช้งานระบบ Nurse Room Management ทันทีและเพิ่มประสิทธิภาพการทำงานของคุณ
>>>>>>> dev_borrow
        </p>
        <Button
          label="เข้าใช้งานตอนนี้"
          @click="navigateToDashboard"
          class="!bg-white !text-blue-600 hover:!bg-slate-100 !px-8 !py-3 !text-lg !font-bold"
        />
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 border-t border-slate-700 mt-20">
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 class="font-bold mb-4">เกี่ยวกับเรา</h4>
            <p class="text-slate-400">
              ระบบจัดการห้องพยาบาลแบบครบถ้วนสำหรับสถาบันการแพทย์
            </p>
          </div>
          <div>
            <h4 class="font-bold mb-4">ลิงค์ด่วน</h4>
            <ul class="text-slate-400 space-y-2">
              <li>
                <a href="#" class="hover:text-blue-400 transition">หน้าแรก</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">ฟีเจอร์</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">ติดต่อ</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4">ติดต่อเรา</h4>
            <p class="text-slate-400">อีเมล: info@nurseroom.com</p>
            <p class="text-slate-400">โทร: +66 (0) 2-XXX-XXXX</p>
          </div>
        </div>

        <div class="border-t border-slate-700 pt-8 text-center text-slate-400">
          <p>&copy; 2026 Nurse Room Management System. สัญญาอนุญาตทั้งหมด</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
<<<<<<< HEAD
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
=======
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
>>>>>>> dev_borrow
  }

  .animate-pulse {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
