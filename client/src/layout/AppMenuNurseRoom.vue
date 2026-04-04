<script lang="ts" setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

// Define proper types for menu items
interface MenuItem {
    label: string;
    items?: MenuItem[];
    icon?: string;
    to?: string;
    url?: string;
    target?: string;
    class?: string;
    separator?: boolean;
}

const model = ref<MenuItem[]>([
    {
        label: 'ระบบหลัก',
        items: [
            { label: 'แดชบอร์ด', icon: 'pi pi-fw pi-home', to: '/dashboard' }
        ]
    },
    {
        label: 'การจัดการห้องพยาบาล',
        icon: 'pi pi-fw pi-building',
        items: [
            { label: 'ข้อมูลห้องพยาบาล', icon: 'pi pi-fw pi-th-large', to: '/dashboard/nurse-rooms' },
            { label: 'การจัดสถานะห้อง', icon: 'pi pi-fw pi-check-circle', to: '/dashboard/room-status' },
            { label: 'ประเมินความสะอาด', icon: 'pi pi-fw pi-book', to: '/dashboard/room-inspection' }
            // TODO: เพิ่ม권한 validation ที่นี่ (ตรวจสอบ role)
        ]
    },
    {
        label: 'การจัดการพยาบาล',
        icon: 'pi pi-fw pi-users',
        items: [
            { label: 'ข้อมูลพยาบาล', icon: 'pi pi-fw pi-list', to: '/dashboard/nurses' },
            { label: 'การจัดเวรพยาบาล', icon: 'pi pi-fw pi-calendar', to: '/dashboard/nurse-schedule' },
            { label: 'ประวัติการทำงาน', icon: 'pi pi-fw pi-history', to: '/dashboard/nurse-history' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'การจัดการผู้ป่วย',
        icon: 'pi pi-fw pi-heart',
        items: [
            { label: 'ลงทะเบียนผู้ป่วย', icon: 'pi pi-fw pi-user-plus', to: '/dashboard/patient-registration' },
            { label: 'ข้อมูลผู้ป่วย', icon: 'pi pi-fw pi-id-card', to: '/dashboard/patients' },
            { label: 'การจัดสรรห้อง', icon: 'pi pi-fw pi-arrows-h', to: '/dashboard/patient-room-allocation' },
            { label: 'ประวัติการรักษา', icon: 'pi pi-fw pi-file-edit', to: '/dashboard/patient-treatment-history' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'การจัดการอุปกรณ์',
        icon: 'pi pi-fw pi-toolbox',
        items: [
            { label: 'สินค้าและอุปกรณ์', icon: 'pi pi-fw pi-box', to: '/dashboard/items' },
            { label: 'ระดับคลัง', icon: 'pi pi-fw pi-chart-bar', to: '/dashboard/inventory' },
            { label: 'การขอยืมอุปกรณ์', icon: 'pi pi-fw pi-share', to: '/dashboard/equipment-borrow' },
            { label: 'การคืนอุปกรณ์', icon: 'pi pi-fw pi-reply', to: '/dashboard/equipment-return' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'การจัดการซื้อ-ขาย',
        icon: 'pi pi-fw pi-shopping-cart',
        items: [
            { label: 'Purchase Order', icon: 'pi pi-fw pi-list', to: '/dashboard/purchase-orders' },
            { label: 'การรับสินค้า', icon: 'pi pi-fw pi-inbox', to: '/dashboard/goods-receipt' },
            { label: 'การอนุมัติ', icon: 'pi pi-fw pi-check-square', to: '/dashboard/approvals' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'การจัดการโรค',
        icon: 'pi pi-fw pi-exclamation-triangle',
        items: [
            { label: 'กลุ่มโรค', icon: 'pi pi-fw pi-folder', to: '/dashboard/disease-groups' },
            { label: 'โรคเฉพาะ', icon: 'pi pi-fw pi-file', to: '/dashboard/disease-sub-groups' },
            { label: 'ความรุนแรงอุบัติเหตุ', icon: 'pi pi-fw pi-flag', to: '/dashboard/accident-severity' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'รายงานและวิเคราะห์',
        icon: 'pi pi-fw pi-chart-line',
        items: [
            { label: 'รายงานการใช้ห้อง', icon: 'pi pi-fw pi-chart-bar', to: '/dashboard/reports/room-usage' },
            { label: 'รายงานคลัง', icon: 'pi pi-fw pi-chart-pie', to: '/dashboard/reports/inventory' },
            { label: 'รายงานงบประมาณ', icon: 'pi pi-fw pi-dollar', to: '/dashboard/reports/budget' },
            { label: 'วิเคราะห์ประสิทธิภาพ', icon: 'pi pi-fw pi-chart-area', to: '/dashboard/analytics/performance' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'ตั้งค่าระบบ',
        icon: 'pi pi-fw pi-cog',
        items: [
            { label: 'ข้อมูลหน่วยงาน', icon: 'pi pi-fw pi-building', to: '/dashboard/settings/hospital-info' },
            { label: 'การจัดการผู้ใช้', icon: 'pi pi-fw pi-users', to: '/dashboard/settings/users' },
            { label: 'บทบาทและสิทธิ์', icon: 'pi pi-fw pi-shield', to: '/dashboard/settings/roles-permissions' },
            { label: 'ตั้งค่าทั่วไป', icon: 'pi pi-fw pi-sliders-v', to: '/dashboard/settings/general' }
            // TODO: เพิ่ม권한 validation ที่นี่
        ]
    },
    {
        label: 'ช่วยเหลือและสนับสนุน',
        icon: 'pi pi-fw pi-question-circle',
        items: [
            { label: 'คู่มือการใช้งาน', icon: 'pi pi-fw pi-book', to: '/dashboard/help/guide' },
            { label: 'ติดต่อสนับสนุน', icon: 'pi pi-fw pi-envelope', to: '/dashboard/help/support' },
            { label: 'ข้อมูลระบบ', icon: 'pi pi-fw pi-info-circle', to: '/dashboard/help/about' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-sidebar-nav">
        <template v-for="(item, index) of model" :key="index">
            <AppMenuItem :item="item" :index="index"></AppMenuItem>
        </template>
    </ul>
</template>
