export type HolidayWorkMessageType =
  | 'CHECK_IN_5AM'
  | 'NO_SHIFT_ALL'
  | 'NORMAL_8AM'
  | 'OTHER';

export interface IHolidayWorkAnnouncement {
  work_date: string;
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
  updated_at?: string | null;
}

export interface ICreateHolidayWorkInput {
  work_date: string;
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
}

export interface IUpdateHolidayWorkInput {
  day_shift_count: number;
  night_shift_count: number;
  message_type: HolidayWorkMessageType;
  custom_message: string | null;
}
