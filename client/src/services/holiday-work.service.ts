import { Api } from './api.service';
import type {
  IHolidayWorkAnnouncement,
  ICreateHolidayWorkInput,
  IUpdateHolidayWorkInput,
} from '@/interfaces/holiday-work.interfaces';

export class HolidayWorkService {
  private static readonly BASE_URL = '/holiday-work';

  static async getActive(silent = false): Promise<IHolidayWorkAnnouncement[]> {
    return Api.get<IHolidayWorkAnnouncement[]>(`${this.BASE_URL}/active`, {}, { silent } as any);
  }

  static async getAll(silent = false): Promise<IHolidayWorkAnnouncement[]> {
    return Api.get<IHolidayWorkAnnouncement[]>(`${this.BASE_URL}/all`, {}, { silent } as any);
  }

  static async getByDate(date: string): Promise<IHolidayWorkAnnouncement | null> {
    return Api.get<IHolidayWorkAnnouncement | null>(`${this.BASE_URL}/by-date`, {
      params: { date },
    });
  }

  static async create(data: ICreateHolidayWorkInput): Promise<any> {
    return Api.post<any>(this.BASE_URL, data);
  }

  static async update(date: string, data: IUpdateHolidayWorkInput): Promise<any> {
    return Api.put<any>(`${this.BASE_URL}/${date}`, data);
  }

  static async delete(date: string): Promise<any> {
    return Api.delete<any>(`${this.BASE_URL}/${date}`);
  }
}
