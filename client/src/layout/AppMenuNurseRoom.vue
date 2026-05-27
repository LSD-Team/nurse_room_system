<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import { useMenuNotificationsStore } from '@/stores/menu-notifications.store';
import { Api } from '@/services/api.service';

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
  badge?: number;
}

const menuNotificationsStore = useMenuNotificationsStore();
const rawMenus = ref<any[]>([]);

onMounted(async () => {
  await menuNotificationsStore.loadAllCounts();
  try {
    const menus = await Api.get<any[]>('/menus');
    rawMenus.value = menus || [];
  } catch (error) {
    console.error('[Menu] Failed to load menus:', error);
  }
});

const model = computed(() => {
  // Access store values to establish a reactive dependency
  const trigger = 
    menuNotificationsStore.po + 
    menuNotificationsStore.rec + 
    menuNotificationsStore.borrow + 
    menuNotificationsStore.apv + 
    menuNotificationsStore.all + 
    menuNotificationsStore.stockCountApv;
  
  if (rawMenus.value.length === 0) return [];
  return buildTree(rawMenus.value);
});

function buildTree(items: any[]): MenuItem[] {
  const map = new Map<number, any>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: any[] = [];

  items.forEach((i) => {
    const node = map.get(i.id);
    if (i.parent_id == null) {
      roots.push(node);
    } else {
      const parent = map.get(i.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });

  function sortNodes(a: any, b: any) {
    return (a.sort_order || 0) - (b.sort_order || 0) || (a.id - b.id);
  }

  function mapNode(n: any): MenuItem {
    const children = (n.children || []).sort(sortNodes).map(mapNode);
    const item: MenuItem = {
      label: n.name,
      icon: n.icon || undefined,
      to: n.route || undefined,
      color: resolveColor(n),
      items: children.length ? children : undefined,
      badge: computeBadge(n),
    };
    return item;
  }

  return roots.sort(sortNodes).map(mapNode);
}

function resolveColor(node: any): string | undefined {
  if (node.color) return node.color;

  const byCode: Record<string, string> = {
    TREATMENT_RECORD: 'text-red-300',
    PURCHASE_BORROW_GROUP: 'text-cyan-300',
    PO_LIST: 'text-cyan-300',
    GOODS_RECEIPT: 'text-cyan-300',
    BORROW_MEDICINES: 'text-cyan-300',
    STOCK_GROUP: 'text-sky-300',
    STOCK_STATUS: 'text-sky-300',
    MOVEMENT_RECORDS: 'text-sky-300',
    STOCK_MONTHLY_RECORD: 'text-amber-400',
    NURSE_GROUP: 'text-emerald-300',
    NURSES_LIST: 'text-emerald-300',
    NURSE_TEAMS: 'text-emerald-300',
    NURSE_CONTRACTS: 'text-emerald-300',
    MASTER_DATA_GROUP: 'text-purple-300',
    SUPPLIERS: 'text-purple-300',
    TREATMENT_TYPES: 'text-purple-300',
    REFER_TYPES: 'text-purple-300',
    DISEASE_MASTER: 'text-purple-300',
    MEDICAL_FACILITIES: 'text-purple-300',
    MEDICINE_ITEMS: 'text-purple-300',
    UNITS: 'text-purple-300',
    MEDICINE_PRICES: 'text-purple-300',
    EMP_HOLIDAY_GROUP: 'text-indigo-400',
    ANNUAL_HEALTH_DATA: 'text-orange-300',
    SOCIAL_SECURITY_UPDATE: 'text-indigo-300',
    CERVICAL_CANCER_UPDATE: 'text-indigo-300',
    EMPLOYEE_HOLIDAY_UPDATE: 'text-indigo-300',
    APPROVE_PURCHASE: 'text-lime-400',
    STOCK_COUNT_APPROVE_MENU: 'text-teal-400',
    SPECIAL_MED_REQ: 'text-yellow-400',
    REPORTS_GROUP: 'text-rose-400',
  };
  if (node.code && byCode[node.code]) return byCode[node.code];

  const route = node.route as string | undefined;
  if (!route) return undefined;
  if (route.startsWith('/report-')) return 'text-rose-300';
  if (route === '/stock-count-approval') return 'text-teal-400';
  return undefined;
}

function computeBadge(node: any): number | undefined {
  // Show total count (all) for Purchase & Borrow Group (menus.id = 3)
  if (Number(node.id) === 3) {
    return menuNotificationsStore.all > 0 ? menuNotificationsStore.all : undefined;
  }

  if (!node.route) return undefined;
  const route = node.route;
  if (route === '/purchase-orders')
    return menuNotificationsStore.po > 0 ? menuNotificationsStore.po : undefined;
  if (route === '/goods-receipt')
    return menuNotificationsStore.rec > 0 ? menuNotificationsStore.rec : undefined;
  if (route === '/borrow-medicines')
    return menuNotificationsStore.borrow > 0 ? menuNotificationsStore.borrow : undefined;
  if (route === '/approve-purchase')
    return menuNotificationsStore.apv > 0 ? menuNotificationsStore.apv : undefined;
  if (route === '/stock-count-approval')
    return menuNotificationsStore.stockCountApv > 0
      ? menuNotificationsStore.stockCountApv
      : undefined;
  return undefined;
}
</script>

<template>
  <ul class="layout-sidebar-nav">
    <template v-for="(item, index) of model" :key="index">
      <AppMenuItem :item="item" :index="index"></AppMenuItem>
    </template>
  </ul>
</template>
