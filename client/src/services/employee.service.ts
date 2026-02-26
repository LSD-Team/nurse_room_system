import { Api } from '@/services/api.service';

// ----- interface & types -----
import type { LoadingOptions } from '@/interfaces/api.interfaces';
import type { IViewEmployee } from '@/shared/template-web-stack-2025/employee.interface';

export class EmployeeService {
  async findAll(): Promise<IViewEmployee[]> {
    const url: string = '/employees';
    const config = undefined;
    const loadingOptions: LoadingOptions = {
      message: 'Loading Employees information...',
      delay: 300,
    };
    return await Api.get<IViewEmployee[]>(url, config, loadingOptions);
  }
}

export default EmployeeService;
