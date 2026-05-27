import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import {
  ICreateHolidayWorkDto,
  IHolidayWorkAnnouncement,
  IUpdateHolidayWorkDto,
} from './holiday-work.interface';

@Injectable()
export class HolidayWorkService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  async getActive(): Promise<IHolidayWorkAnnouncement[]> {
    return this.databaseService.executeStoredProcedure<IHolidayWorkAnnouncement>(
      this.DATABASE_NAME,
      'sp_HolidayWork_GetActive',
    );
  }

  async getAll(): Promise<IHolidayWorkAnnouncement[]> {
    return this.databaseService.executeStoredProcedure<IHolidayWorkAnnouncement>(
      this.DATABASE_NAME,
      'sp_HolidayWork_GetAll',
    );
  }

  async getByDate(workDate: string): Promise<IHolidayWorkAnnouncement | null> {
    const rows = await this.databaseService.executeStoredProcedure<IHolidayWorkAnnouncement>(
      this.DATABASE_NAME,
      'sp_HolidayWork_GetByDate',
      { work_date: workDate },
    );
    return rows[0] || null;
  }

  async create(body: ICreateHolidayWorkDto, createdBy: string) {
    try {
      return await this.databaseService.executeStoredProcedure<any>(
        this.DATABASE_NAME,
        'sp_HolidayWork_Create',
        {
          work_date: body.work_date,
          day_shift_count: body.day_shift_count,
          night_shift_count: body.night_shift_count,
          message_type: body.message_type,
          custom_message: body.custom_message,
          created_by: createdBy,
        },
      );
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  async update(workDate: string, body: IUpdateHolidayWorkDto, updatedBy: string) {
    try {
      return await this.databaseService.executeStoredProcedure<any>(
        this.DATABASE_NAME,
        'sp_HolidayWork_Update',
        {
          work_date: workDate,
          day_shift_count: body.day_shift_count,
          night_shift_count: body.night_shift_count,
          message_type: body.message_type,
          custom_message: body.custom_message,
          updated_by: updatedBy,
        },
      );
    } catch (error: any) {
      if (error.message?.includes('No record found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  async delete(workDate: string) {
    try {
      return await this.databaseService.executeStoredProcedure<any>(
        this.DATABASE_NAME,
        'sp_HolidayWork_Delete',
        { work_date: workDate },
      );
    } catch (error: any) {
      if (error.message?.includes('No record found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
