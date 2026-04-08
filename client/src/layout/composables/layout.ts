import { computed, reactive } from 'vue';

interface LayoutConfig {
  preset: string;
  primary: string;
  surface: string | null;
  darkTheme: boolean;
  menuMode: string;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  profileSidebarVisible: boolean;
  configSidebarVisible: boolean;
  staticMenuMobileActive: boolean;
  menuHoverActive: boolean;
  activeMenuItem: any | null;
}

const layoutConfig = reactive<LayoutConfig>({
  preset: 'Aura',
  primary: 'emerald',
  surface: null,
  darkTheme: false,
  menuMode: 'static',
});

const layoutState = reactive<LayoutState>({
  staticMenuDesktopInactive: false,
  overlayMenuActive: false,
  profileSidebarVisible: false,
  configSidebarVisible: false,
  staticMenuMobileActive: false,
  menuHoverActive: false,
  activeMenuItem: null,
});

export function useLayout() {
  const setActiveMenuItem = (item: any) => {
    layoutState.activeMenuItem = item.value || item;
  };

  const toggleDarkMode = () => {
    if (!document.startViewTransition) {
      executeDarkModeToggle();
      return;
    }

    document.startViewTransition(() => executeDarkModeToggle());
  };

  const executeDarkModeToggle = () => {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    layoutConfig.preset = 'Aura';
    if (layoutConfig.darkTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  };

  const setScale = (scale: number) => {
    document.documentElement.style.fontSize = `${scale}px`;
  };

  const onMenuToggle = () => {
    if (layoutConfig.menuMode === 'overlay') {
      layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
    }

    if (window.innerWidth > 991) {
<<<<<<< HEAD
      layoutState.staticMenuDesktopInactive =
        !layoutState.staticMenuDesktopInactive;
=======
      layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
>>>>>>> dev_borrow
    } else {
      layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
    }
  };

  const isSidebarActive = computed(
<<<<<<< HEAD
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive
=======
    () => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive,
>>>>>>> dev_borrow
  );

  const isDarkTheme = computed(() => layoutConfig.darkTheme);

  return {
    layoutConfig,
    layoutState,
    setScale,
    onMenuToggle,
    isSidebarActive,
    isDarkTheme,
    setActiveMenuItem,
    toggleDarkMode,
  };
}
