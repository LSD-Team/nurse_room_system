// ----- lib -----
import { defineStore } from 'pinia';

// ----- Service -----
import AuthService from '@/services/auth.service';
import EmployeeService from '@/services/employee.service';

// ----- interface & types -----
import type { IViewEmployee } from '@/shared/template-web-stack-2025/employee.interface';

const authService = new AuthService();
const employeeService = new EmployeeService();

interface IMainStoreState {
  userInfo: IViewEmployee;
  loading: boolean;
  loadingMessage: string;
  isSilder: boolean;
  employees: IViewEmployee[];
}

//  ===== default state =====
const default_state: IMainStoreState = {
  userInfo: {
    ID: '',
    cardcode: '',
    thai_name: '',
    eng_name: '',
    email: '',
    position_name: '',
    position_level: '',
    JobPositionCode: '',
    WorkStatus: 'Active',
    ExeOfficeCode: '',
    ExeOfficeDesc: '',
    SECCD: '',
    section_name: '',
    GRPCD: '',
    group_name: '',
  },
  loading: false,
  loadingMessage: 'Loading...',
  isSilder: false,
  employees: [],
};

export const useMainStore = defineStore('main', {
  state: (): IMainStoreState => ({ ...default_state }),
  getters: {
    _loading: state => state.loading,
    _loadingMessage: state => state.loadingMessage,
    _isSilder: state => state.isSilder,
    _userInfo: state => state.userInfo,
    _employees: state => state.employees,
  },
  actions: {
    async setLoading(status: boolean, message?: string) {
      this.loading = status;
      if (message) {
        this.loadingMessage = message;
      }
    },
    async setSlider(status: boolean) {
      this.isSilder = status;
    },
    async getUserData() {
      const response = await authService.userInfo();
      this.setUserData(response);
    },
    async setUserData(data: IViewEmployee) {
      this.userInfo = data;
    },

    async getEmployees() {
      const response = await employeeService.findAll();
      this.employees = response;
    },
  },
});
