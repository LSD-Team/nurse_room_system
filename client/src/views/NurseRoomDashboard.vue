<script lang="ts" setup>
// TODO: นำเข้า auth service เมื่อพร้อม
// import AuthService from '@/services/auth.service';
// const authService = new AuthService();

// TODO: สร้าง function สำหรับตรวจสอบสิทธิแบบแต่ละหน้า
// const checkUserPermission = (requiredRole: string) => {
//   return authService.checkRole(requiredRole);
// };

// TODO: สร้าง guard สำหรับ route ที่ต้องการสิทธิ์พิเศษ
// const requireAuth = async (to, from, next) => {
//   const isAuthenticated = await authService.isAuthenticated();
//   if (isAuthenticated) {
//     next();
//   } else {
//     next('/auth/login');
//   }
// };
</script>

<template>
  <div>
    <!-- ยังไม่ได้เพิ่ม component หน้า nurse room -->
    <!-- TODO: สร้าง view component สำหรับแต่ละ feature ตามที่กำหนดใน AppMenuNurseRoom.vue -->
    <p>Dashboard - Nurse Room Management System</p>
  </div>
</template>
