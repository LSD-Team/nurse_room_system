export type HolidayWorkMessageType =
  | 'CHECK_IN_5AM'
  | 'NO_SHIFT_ALL'
  | 'NORMAL_8AM'
  | 'OTHER';

export interface IHolidayWorkAnnouncement {
  id?: number;
  work_date: string; // DATE as ISO string
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
  created_by?: number;
  created_at?: string;
  updated_by?: number | null;
  updated_at?: string | null;
}

export interface ICreateHolidayWorkDto {
  work_date: string;
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
}

export interface IUpdateHolidayWorkDto {
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
}
