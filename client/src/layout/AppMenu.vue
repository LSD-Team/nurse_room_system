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
  }

  const model = ref<MenuItem[]>([
    {
      label: 'Home',
      items: [
        { label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' },
      ],
    },
    {
      label: 'UI Components',
      items: [
        {
          label: 'Form Layout',
          icon: 'pi pi-fw pi-id-card',
          to: '/dashboard/uikit/formlayout',
        },
        {
          label: 'Input',
          icon: 'pi pi-fw pi-check-square',
          to: '/dashboard/uikit/input',
        },
        {
          label: 'Button',
          icon: 'pi pi-fw pi-mobile',
          to: '/dashboard/uikit/button',
          class: 'rotated-icon',
        },
        {
          label: 'Table',
          icon: 'pi pi-fw pi-table',
          to: '/dashboard/uikit/table',
        },
        {
          label: 'List',
          icon: 'pi pi-fw pi-list',
          to: '/dashboard/uikit/list',
        },
        {
          label: 'Tree',
          icon: 'pi pi-fw pi-share-alt',
          to: '/dashboard/uikit/tree',
        },
        {
          label: 'Panel',
          icon: 'pi pi-fw pi-tablet',
          to: '/dashboard/uikit/panel',
        },
        {
          label: 'Overlay',
          icon: 'pi pi-fw pi-clone',
          to: '/dashboard/uikit/overlay',
        },
        {
          label: 'Media',
          icon: 'pi pi-fw pi-image',
          to: '/dashboard/uikit/media',
        },
        {
          label: 'Menu',
          icon: 'pi pi-fw pi-bars',
          to: '/dashboard/uikit/menu',
        },
        {
          label: 'Message',
          icon: 'pi pi-fw pi-comment',
          to: '/dashboard/uikit/message',
        },
        {
          label: 'File',
          icon: 'pi pi-fw pi-file',
          to: '/dashboard/uikit/file',
        },
        {
          label: 'Chart',
          icon: 'pi pi-fw pi-chart-bar',
          to: '/dashboard/uikit/charts',
        },
        {
          label: 'Timeline',
          icon: 'pi pi-fw pi-calendar',
          to: '/dashboard/uikit/timeline',
        },
        {
          label: 'Misc',
          icon: 'pi pi-fw pi-circle',
          to: '/dashboard/uikit/misc',
        },
      ],
    },
    {
      label: 'Pages',
      icon: 'pi pi-fw pi-briefcase',
      to: '/pages',
      items: [
        {
          label: 'Landing',
          icon: 'pi pi-fw pi-globe',
          to: '/',
        },
        {
          label: 'Auth',
          icon: 'pi pi-fw pi-user',
          items: [
            {
              label: 'Login',
              icon: 'pi pi-fw pi-sign-in',
              to: '/auth/login',
            },
            {
              label: 'Error',
              icon: 'pi pi-fw pi-times-circle',
              to: '/auth/error',
            },
            {
              label: 'Access Denied',
              icon: 'pi pi-fw pi-lock',
              to: '/auth/access',
            },
          ],
        },
        {
          label: 'Crud',
          icon: 'pi pi-fw pi-pencil',
          to: '/dashboard/pages/crud',
        },
        {
          label: 'Not Found',
          icon: 'pi pi-fw pi-exclamation-circle',
          to: '/pages/notfound',
        },
        {
          label: 'Empty',
          icon: 'pi pi-fw pi-circle-off',
          to: '/dashboard/pages/empty',
        },
      ],
    },
    {
      label: 'Hierarchy',
      items: [
        {
          label: 'Submenu 1',
          icon: 'pi pi-fw pi-bookmark',
          items: [
            {
              label: 'Submenu 1.1',
              icon: 'pi pi-fw pi-bookmark',
              items: [
                { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
              ],
            },
            {
              label: 'Submenu 1.2',
              icon: 'pi pi-fw pi-bookmark',
              items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }],
            },
          ],
        },
        {
          label: 'Submenu 2',
          icon: 'pi pi-fw pi-bookmark',
          items: [
            {
              label: 'Submenu 2.1',
              icon: 'pi pi-fw pi-bookmark',
              items: [
                { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' },
              ],
            },
            {
              label: 'Submenu 2.2',
              icon: 'pi pi-fw pi-bookmark',
              items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }],
            },
          ],
        },
      ],
    },
    {
      label: 'Get Started',
      items: [
        {
          label: 'Documentation',
          icon: 'pi pi-fw pi-book',
          to: '/documentation',
        },
        {
          label: 'View Source',
          icon: 'pi pi-fw pi-github',
          url: 'https://github.com/primefaces/sakai-vue',
          target: '_blank',
        },
      ],
    },
    // Adding a separator item example
    {
      separator: true,
      label: 'Separator',
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
}

const model = ref<MenuItem[]>([
  {
    label: 'Home',
    items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }],
  },
  {
    label: 'UI Components',
    items: [
      { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', to: '/dashboard/uikit/formlayout' },
      { label: 'Input', icon: 'pi pi-fw pi-check-square', to: '/dashboard/uikit/input' },
      {
        label: 'Button',
        icon: 'pi pi-fw pi-mobile',
        to: '/dashboard/uikit/button',
        class: 'rotated-icon',
      },
      { label: 'Table', icon: 'pi pi-fw pi-table', to: '/dashboard/uikit/table' },
      { label: 'List', icon: 'pi pi-fw pi-list', to: '/dashboard/uikit/list' },
      { label: 'Tree', icon: 'pi pi-fw pi-share-alt', to: '/dashboard/uikit/tree' },
      { label: 'Panel', icon: 'pi pi-fw pi-tablet', to: '/dashboard/uikit/panel' },
      { label: 'Overlay', icon: 'pi pi-fw pi-clone', to: '/dashboard/uikit/overlay' },
      { label: 'Media', icon: 'pi pi-fw pi-image', to: '/dashboard/uikit/media' },
      { label: 'Menu', icon: 'pi pi-fw pi-bars', to: '/dashboard/uikit/menu' },
      { label: 'Message', icon: 'pi pi-fw pi-comment', to: '/dashboard/uikit/message' },
      { label: 'File', icon: 'pi pi-fw pi-file', to: '/dashboard/uikit/file' },
      { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', to: '/dashboard/uikit/charts' },
      { label: 'Timeline', icon: 'pi pi-fw pi-calendar', to: '/dashboard/uikit/timeline' },
      { label: 'Misc', icon: 'pi pi-fw pi-circle', to: '/dashboard/uikit/misc' },
    ],
  },
  {
    label: 'Pages',
    icon: 'pi pi-fw pi-briefcase',
    to: '/pages',
    items: [
      {
        label: 'Landing',
        icon: 'pi pi-fw pi-globe',
        to: '/',
      },
      {
        label: 'Auth',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'Login',
            icon: 'pi pi-fw pi-sign-in',
            to: '/auth/login',
          },
          {
            label: 'Error',
            icon: 'pi pi-fw pi-times-circle',
            to: '/auth/error',
          },
          {
            label: 'Access Denied',
            icon: 'pi pi-fw pi-lock',
            to: '/auth/access',
          },
        ],
      },
      {
        label: 'Crud',
        icon: 'pi pi-fw pi-pencil',
        to: '/dashboard/pages/crud',
      },
      {
        label: 'Not Found',
        icon: 'pi pi-fw pi-exclamation-circle',
        to: '/pages/notfound',
      },
      {
        label: 'Empty',
        icon: 'pi pi-fw pi-circle-off',
        to: '/dashboard/pages/empty',
      },
    ],
  },
  {
    label: 'Hierarchy',
    items: [
      {
        label: 'Submenu 1',
        icon: 'pi pi-fw pi-bookmark',
        items: [
          {
            label: 'Submenu 1.1',
            icon: 'pi pi-fw pi-bookmark',
            items: [
              { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
              { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
              { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' },
            ],
          },
          {
            label: 'Submenu 1.2',
            icon: 'pi pi-fw pi-bookmark',
            items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }],
          },
        ],
      },
      {
        label: 'Submenu 2',
        icon: 'pi pi-fw pi-bookmark',
        items: [
          {
            label: 'Submenu 2.1',
            icon: 'pi pi-fw pi-bookmark',
            items: [
              { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
              { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' },
            ],
          },
          {
            label: 'Submenu 2.2',
            icon: 'pi pi-fw pi-bookmark',
            items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }],
          },
        ],
      },
    ],
  },
  {
    label: 'Get Started',
    items: [
      {
        label: 'Documentation',
        icon: 'pi pi-fw pi-book',
        to: '/documentation',
      },
      {
        label: 'View Source',
        icon: 'pi pi-fw pi-github',
        url: 'https://github.com/primefaces/sakai-vue',
        target: '_blank',
      },
    ],
  },
  // Adding a separator item example
  {
    separator: true,
    label: 'Separator',
  },
]);
>>>>>>> dev_borrow
</script>

<template>
  <ul class="layout-menu">
    <template v-for="(item, i) in model" :key="item">
<<<<<<< HEAD
      <app-menu-item
        v-if="!item.separator"
        :item="item"
        :index="i"
      ></app-menu-item>
=======
      <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
>>>>>>> dev_borrow
      <li v-if="item.separator" class="menu-separator"></li>
    </template>
  </ul>
</template>

<style lang="scss" scoped></style>
