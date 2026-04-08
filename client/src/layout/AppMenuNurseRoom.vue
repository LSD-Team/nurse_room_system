<script lang="ts" setup>
  import { ref } from 'vue';
  import AppMenuItem from './AppMenuItem.vue';

<<<<<<< HEAD
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
    color?: string;
  }

  const model = ref<MenuItem[]>([
    {
      label: 'Nurse Room System',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-fw pi-home',
          color: 'text-blue-400',
          to: '/',
        },
        {
          label: 'บันทึกการรักษาพยาบาล',
          icon: 'pi pi-fw pi-pencil',
          color: 'text-red-300',
          to: '/treatment-record',
        },
        // ...removed 'การรักษาพยาบาล' and its submenus...
        {
          label: 'ข้อมูลพยาบาลและคลังยา',
          icon: 'pi pi-fw pi-box',
          color: 'text-emerald-400',
          items: [
            {
              label: 'ข้อมูลพยาบาล',
              icon: 'pi pi-fw pi-id-card',
              color: 'text-emerald-300',
              items: [
                {
                  label: 'รายชื่อพยาบาล',
                  icon: 'pi pi-fw pi-user-edit',
                  color: 'text-emerald-300',
                  to: '/nurses-list',
                },
                {
                  label: 'ทีมพยาบาล',
                  icon: 'pi pi-fw pi-users',
                  color: 'text-emerald-300',
                  to: '/nurse-teams',
                },
                {
                  label: 'สัญญาจ้างงานพยาบาล',
                  icon: 'pi pi-fw pi-file',
                  color: 'text-emerald-300',
                  to: '/nurse-contracts',
                },
              ],
            },
            {
              label: 'จัดซื้อ & ยืม ยา/เวชภัณฑ์',
              icon: 'pi pi-fw pi-shopping-cart',
              color: 'text-cyan-300',
              items: [
                {
                  label: 'รายการยา/เวชภัณฑ์',
                  icon: 'pi pi-fw pi-list',
                  color: 'text-teal-300',
                  to: '/medicine-items',
                },
                {
                  label: 'หน่วยนับ',
                  icon: 'pi pi-fw pi-sort-numeric-up',
                  color: 'text-teal-300',
                  to: '/units',
                },
                {
                  label: 'ราคายา/เวชภัณฑ์',
                  icon: 'pi pi-fw pi-dollar',
                  color: 'text-teal-300',
                  to: '/medicine-prices',
                },
                {
                  label: 'สั่งซื้อ',
                  icon: 'pi pi-fw pi-shopping-cart',
                  color: 'text-cyan-300',
                  to: '/purchase-orders',
                },
                {
                  label: 'รับเข้า',
                  icon: 'pi pi-fw pi-inbox',
                  color: 'text-cyan-300',
                  to: '/goods-receipt',
                },
                {
                  label: 'ยืม',
                  icon: 'pi pi-fw pi-share-alt',
                  color: 'text-cyan-300',
                  to: '/borrow-medicines',
                },
              ],
            },
            {
              label: 'คลัง/สต็อก ยา/เวชภัณฑ์',
              icon: 'pi pi-fw pi-database',
              color: 'text-sky-300',
              items: [
                {
                  label: 'สถานะสต็อก',
                  icon: 'pi pi-fw pi-check-circle',
                  color: 'text-sky-300',
                  to: '/stock-status',
                },
                {
                  label: 'บันทึกเคลื่อนไหว',
                  icon: 'pi pi-fw pi-refresh',
                  color: 'text-sky-300',
                  to: '/movement-records',
                },
                {
                  label: 'ปรับยอด',
                  icon: 'pi pi-fw pi-pencil',
                  color: 'text-sky-300',
                  to: '/stock-adjustment',
                },
              ],
            },
            {
              label: 'ข้อมูลหลัก (Master Data)',
              icon: 'pi pi-fw pi-cog',
              color: 'text-purple-300',
              items: [
                {
                  label: 'ผู้จัดจำหน่าย',
                  icon: 'pi pi-fw pi-truck',
                  color: 'text-purple-300',
                  to: '/suppliers',
                },
                {
                  label: 'ประเภทการรักษา',
                  icon: 'pi pi-fw pi-check',
                  color: 'text-purple-300',
                  to: '/treatment-types',
                },
                {
                  label: 'ประเภทการ Refer',
                  icon: 'pi pi-fw pi-share-alt',
                  color: 'text-purple-300',
                  to: '/refer-types',
                },
                {
                  label: 'กลุ่มโรคและประเภทของโรค',
                  icon: 'pi pi-fw pi-folder',
                  color: 'text-purple-300',
                  to: '/disease-master-data',
                },
                {
                  label: 'สถานพยาบาล',
                  icon: 'pi pi-fw pi-building',
                  color: 'text-purple-300',
                  to: '/medical-facilities',
                },
              ],
            },
          ],
        },
        {
          label: 'พนักงานทำงานวันหยุดและอัพเดทข้อมูลประจำปี',
          icon: 'pi pi-fw pi-users',
          color: 'text-indigo-400',
          items: [
            {
              label: 'ข้อมูลตรวจสุขภาพประจำปี',
              icon: 'pi pi-fw pi-file',
              color: 'text-orange-300',
              to: '/annual-health-data',
            },
            {
              label: 'อัพเดทข้อมูลประกันสังคมพนักงาน',
              icon: 'pi pi-fw pi-refresh',
              color: 'text-indigo-300',
              to: '/social-security-update',
            },
            {
              label: 'อัพเดทข้อมูลมะเร็งปากมดลูก',
              icon: 'pi pi-fw pi-refresh',
              color: 'text-indigo-300',
              to: '/cervical-cancer-update',
            },
            {
              label: 'ข้อมูลพนักงานทำงานวันหยุด',
              icon: 'pi pi-fw pi-calendar',
              color: 'text-indigo-300',
              to: '/employee-holiday-update',
            },
          ],
        },
        {
          label: 'อนุมัติการสั่งซื้อยา',
          icon: 'pi pi-fw pi-check-square',
          color: 'text-lime-400',
          to: '/approve-purchase',
        },
        {
          label: 'เบิกยากรณีพิเศษ',
          icon: 'pi pi-fw pi-exclamation-triangle',
          color: 'text-yellow-400',
          to: '/special-medicine-request',
        },
        {
          label: 'รายงาน',
          icon: 'pi pi-fw pi-file-pdf',
          color: 'text-rose-400',
          items: [
            {
              label: 'การรักษาพยาบาล',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-treatment',
            },
            {
              label: 'ประวัติการ Refer',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-refer',
            },
            {
              label: 'ประวัติการเกิดอุบัติเหตุในงาน',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-accident',
            },
            {
              label: 'ประวัติโรคที่คาดว่าเกิดจากการทำงาน',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-occupational-disease',
            },
            {
              label: 'ประวัติเจ็บป่วยจากโรงพยาบาล',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-hospital-treatment',
            },
            {
              label: 'ประวัติโรคเจ็บป่วยเรื้อรัง',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-chronic-disease',
            },
            {
              label: 'ผลตรวจสุขภาพเข้างานใหม่',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-health-check-new',
            },
            {
              label: 'ผลตรวจสุขภาพประจำปี E1+',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-health-check-annual',
            },
            {
              label: 'ผลตรวจสุขภาพกรณีโยกย้ายงาน',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-health-check-transfer',
            },
            {
              label: 'ผลตรวจมะเร็งปากมดลูก',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-cervical-cancer',
            },
            {
              label: 'ข้อมูลพยาบาล',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-nurses',
            },
            {
              label: 'จัดซื้อยา/เวชภัณฑ์',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-purchase',
            },
            {
              label: 'ยืมยา/เวชภัณฑ์',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-borrow',
            },
            {
              label: 'สต็อก ยา/เวชภัณฑ์ รายเดือน',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-stock-monthly',
            },
            {
              label: 'การใช้ ยา/เวชภัณฑ์ รายวัน',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-usage-daily',
            },
            {
              label: 'การรักษาพยาบาลรายโรค',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-treatment-by-disease',
            },
            {
              label: 'สถานพยาบาลประกันสังคม',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-social-security',
            },
            {
              label: 'ผลตรวจสุขภาพประจำปี OP-S4',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-health-check-ops4',
            },
            {
              label: 'การเบิกยากรณีพิเศษ',
              icon: 'pi pi-fw pi-file',
              color: 'text-rose-300',
              to: '/report-special-medicine',
            },
          ],
        },
      ],
    },
  ]);
=======
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
  color?: string;
}

const model = ref<MenuItem[]>([
  {
    label: 'Nurse Room System',
    items: [
      { label: 'Dashboard', icon: 'pi pi-fw pi-home', color: 'text-blue-400', to: '/' },
      {
        label: 'บันทึกการรักษาพยาบาล',
        icon: 'pi pi-fw pi-pencil',
        color: 'text-red-300',
        to: '/treatment-record',
      },
      // ...removed 'การรักษาพยาบาล' and its submenus...
      {
        label: 'ข้อมูลพยาบาลและคลังยา',
        icon: 'pi pi-fw pi-box',
        color: 'text-emerald-400',
        items: [
          {
            label: 'ข้อมูลพยาบาล',
            icon: 'pi pi-fw pi-id-card',
            color: 'text-emerald-300',
            items: [
              {
                label: 'รายชื่อพยาบาล',
                icon: 'pi pi-fw pi-user-edit',
                color: 'text-emerald-300',
                to: '/nurses-list',
              },
              {
                label: 'ทีมพยาบาล',
                icon: 'pi pi-fw pi-users',
                color: 'text-emerald-300',
                to: '/nurse-teams',
              },
              {
                label: 'สัญญาจ้างงานพยาบาล',
                icon: 'pi pi-fw pi-file',
                color: 'text-emerald-300',
                to: '/nurse-contracts',
              },
            ],
          },
          {
            label: 'จัดซื้อ & ยืม ยา/เวชภัณฑ์',
            icon: 'pi pi-fw pi-shopping-cart',
            color: 'text-cyan-300',
            items: [
              {
                label: 'รายการยา/เวชภัณฑ์',
                icon: 'pi pi-fw pi-list',
                color: 'text-teal-300',
                to: '/medicine-items',
              },
              {
                label: 'หน่วยนับ',
                icon: 'pi pi-fw pi-sort-numeric-up',
                color: 'text-teal-300',
                to: '/units',
              },
              {
                label: 'ราคายา/เวชภัณฑ์',
                icon: 'pi pi-fw pi-dollar',
                color: 'text-teal-300',
                to: '/medicine-prices',
              },
              {
                label: 'สั่งซื้อ',
                icon: 'pi pi-fw pi-shopping-cart',
                color: 'text-cyan-300',
                to: '/purchase-orders',
              },
              {
                label: 'รับเข้า',
                icon: 'pi pi-fw pi-inbox',
                color: 'text-cyan-300',
                to: '/goods-receipt',
              },
              {
                label: 'ยืม',
                icon: 'pi pi-fw pi-share-alt',
                color: 'text-cyan-300',
                to: '/borrow-medicines',
              },
            ],
          },
          {
            label: 'คลัง/สต็อก ยา/เวชภัณฑ์',
            icon: 'pi pi-fw pi-database',
            color: 'text-sky-300',
            items: [
              {
                label: 'สถานะสต็อก',
                icon: 'pi pi-fw pi-check-circle',
                color: 'text-sky-300',
                to: '/stock-status',
              },
              {
                label: 'บันทึกเคลื่อนไหว',
                icon: 'pi pi-fw pi-refresh',
                color: 'text-sky-300',
                to: '/movement-records',
              },
              {
                label: 'ปรับยอด',
                icon: 'pi pi-fw pi-pencil',
                color: 'text-sky-300',
                to: '/stock-adjustment',
              },
            ],
          },
          {
            label: 'ข้อมูลหลัก (Master Data)',
            icon: 'pi pi-fw pi-cog',
            color: 'text-purple-300',
            items: [
              {
                label: 'ผู้จัดจำหน่าย',
                icon: 'pi pi-fw pi-truck',
                color: 'text-purple-300',
                to: '/suppliers',
              },
              {
                label: 'ประเภทการรักษา',
                icon: 'pi pi-fw pi-check',
                color: 'text-purple-300',
                to: '/treatment-types',
              },
              {
                label: 'ประเภทการ Refer',
                icon: 'pi pi-fw pi-share-alt',
                color: 'text-purple-300',
                to: '/refer-types',
              },
              {
                label: 'กลุ่มโรคและประเภทของโรค',
                icon: 'pi pi-fw pi-folder',
                color: 'text-purple-300',
                to: '/disease-master-data',
              },
              {
                label: 'สถานพยาบาล',
                icon: 'pi pi-fw pi-building',
                color: 'text-purple-300',
                to: '/medical-facilities',
              },
            ],
          },
        ],
      },
      {
        label: 'พนักงานทำงานวันหยุดและอัพเดทข้อมูลประจำปี',
        icon: 'pi pi-fw pi-users',
        color: 'text-indigo-400',
        items: [
          {
            label: 'ข้อมูลตรวจสุขภาพประจำปี',
            icon: 'pi pi-fw pi-file',
            color: 'text-orange-300',
            to: '/annual-health-data',
          },
          {
            label: 'อัพเดทข้อมูลประกันสังคมพนักงาน',
            icon: 'pi pi-fw pi-refresh',
            color: 'text-indigo-300',
            to: '/social-security-update',
          },
          {
            label: 'อัพเดทข้อมูลมะเร็งปากมดลูก',
            icon: 'pi pi-fw pi-refresh',
            color: 'text-indigo-300',
            to: '/cervical-cancer-update',
          },
          {
            label: 'ข้อมูลพนักงานทำงานวันหยุด',
            icon: 'pi pi-fw pi-calendar',
            color: 'text-indigo-300',
            to: '/employee-holiday-update',
          },
        ],
      },
      {
        label: 'อนุมัติการสั่งซื้อยา',
        icon: 'pi pi-fw pi-check-square',
        color: 'text-lime-400',
        to: '/approve-purchase',
      },
      {
        label: 'เบิกยากรณีพิเศษ',
        icon: 'pi pi-fw pi-exclamation-triangle',
        color: 'text-yellow-400',
        to: '/special-medicine-request',
      },
      {
        label: 'รายงาน',
        icon: 'pi pi-fw pi-file-pdf',
        color: 'text-rose-400',
        items: [
          {
            label: 'การรักษาพยาบาล',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-treatment',
          },
          {
            label: 'ประวัติการ Refer',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-refer',
          },
          {
            label: 'ประวัติการเกิดอุบัติเหตุในงาน',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-accident',
          },
          {
            label: 'ประวัติโรคที่คาดว่าเกิดจากการทำงาน',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-occupational-disease',
          },
          {
            label: 'ประวัติเจ็บป่วยจากโรงพยาบาล',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-hospital-treatment',
          },
          {
            label: 'ประวัติโรคเจ็บป่วยเรื้อรัง',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-chronic-disease',
          },
          {
            label: 'ผลตรวจสุขภาพเข้างานใหม่',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-health-check-new',
          },
          {
            label: 'ผลตรวจสุขภาพประจำปี E1+',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-health-check-annual',
          },
          {
            label: 'ผลตรวจสุขภาพกรณีโยกย้ายงาน',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-health-check-transfer',
          },
          {
            label: 'ผลตรวจมะเร็งปากมดลูก',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-cervical-cancer',
          },
          {
            label: 'ข้อมูลพยาบาล',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-nurses',
          },
          {
            label: 'จัดซื้อยา/เวชภัณฑ์',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-purchase',
          },
          {
            label: 'ยืมยา/เวชภัณฑ์',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-borrow',
          },
          {
            label: 'สต็อก ยา/เวชภัณฑ์ รายเดือน',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-stock-monthly',
          },
          {
            label: 'การใช้ ยา/เวชภัณฑ์ รายวัน',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-usage-daily',
          },
          {
            label: 'การรักษาพยาบาลรายโรค',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-treatment-by-disease',
          },
          {
            label: 'สถานพยาบาลประกันสังคม',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-social-security',
          },
          {
            label: 'ผลตรวจสุขภาพประจำปี OP-S4',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-health-check-ops4',
          },
          {
            label: 'การเบิกยากรณีพิเศษ',
            icon: 'pi pi-fw pi-file',
            color: 'text-rose-300',
            to: '/report-special-medicine',
          },
        ],
      },
    ],
  },
]);
>>>>>>> dev_borrow
</script>

<template>
  <ul class="layout-sidebar-nav">
    <template v-for="(item, index) of model" :key="index">
      <AppMenuItem :item="item" :index="index"></AppMenuItem>
    </template>
  </ul>
</template>
