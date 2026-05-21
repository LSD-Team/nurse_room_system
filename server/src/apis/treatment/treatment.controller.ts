import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TreatmentService } from './treatment.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';
import type {
  ICreateVisitBody,
  ICreateExternalPersonBody,
  IGetVisitListQuery,
  IUpdateVisitUsageBody,
} from './treatment.interface';

@ApiTags('treatment')
@ApiBearerAuth()
@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ─── GET /treatment/lookups ───
  @Get('lookups')
  @ApiOperation({ summary: 'Get all lookup data (treatment types, disease groups, hospitals, etc.)' })
  async getLookups() {
    return this.treatmentService.getLookups();
  }

  // ─── GET /treatment/external-people ───
  @Get('external-people')
  @ApiOperation({ summary: 'Search external people by name / national ID / company' })
  @ApiQuery({ name: 'search', required: false })
  async searchExternalPeople(@Query('search') search?: string) {
    return this.treatmentService.searchExternalPeople(search);
  }

  // ─── POST /treatment/external-people ───
  @Post('external-people')
  @ApiOperation({ summary: 'Register a new external person' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['full_name'],
      properties: {
        full_name:   { type: 'string', example: 'สมชาย ใจดี' },
        company:     { type: 'string', example: 'บริษัท ABC' },
        national_id: { type: 'string', example: '1234567890123' },
        passport_no: { type: 'string', example: '' },
        phone:       { type: 'string', example: '0812345678' },
      },
    },
  })
  async createExternalPerson(@Body() body: ICreateExternalPersonBody) {
    return this.treatmentService.createExternalPerson(body, this.currentUser);
  }

  // ─── POST /treatment/visits ───
  @Post('visits')
  @ApiOperation({ summary: 'Create a new visit record (sp_TR_01_CreateVisit)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['patient_type', 'visit_datetime'],
      properties: {
        patient_type:        { type: 'string', enum: ['EMP', 'EXT'], example: 'EMP' },
        employee_id:         { type: 'string', example: '8300' },
        external_person_id:  { type: 'number', example: null },
        visit_datetime:      { type: 'string', example: '2026-05-20T09:00:00' },
        shift_code:          { type: 'string', example: 'DAY' },
        symptoms:            { type: 'string', example: 'ปวดหัว มีไข้' },
        vitals_json:         { type: 'string', example: '{"bp_systolic":120,"bp_diastolic":80,"pulse":72,"temp_c":37.0,"spo2":98}' },
        group_id:            { type: 'number', example: 1 },
        disease_id:          { type: 'number', example: 1 },
        treatment_type_id:   { type: 'number', example: 4 },
        nursing_advice:      { type: 'string', example: 'พักผ่อนให้เพียงพอ' },
        accident_in_work_flag: { type: 'boolean', example: false },
        work_related_flag:   { type: 'boolean', example: false },
        refer_flag:          { type: 'boolean', example: false },
        usages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item_id:  { type: 'number', example: 1 },
              qty_base: { type: 'number', example: 2 },
            },
          },
        },
      },
    },
  })
  async createVisit(@Body() body: ICreateVisitBody) {
    return this.treatmentService.createVisit(body, this.currentUser);
  }

  // ─── GET /treatment/visits ───
  @Get('visits')
  @ApiOperation({ summary: 'Get visit list with filters (sp_TR_02_GetVisitList)' })
  @ApiQuery({ name: 'date_from', required: false })
  @ApiQuery({ name: 'date_to', required: false })
  @ApiQuery({ name: 'patient_type', required: false })
  @ApiQuery({ name: 'employee_id', required: false })
  @ApiQuery({ name: 'treatment_type_id', required: false })
  @ApiQuery({ name: 'page_size', required: false })
  @ApiQuery({ name: 'page_no', required: false })
  async getVisitList(@Query() query: IGetVisitListQuery) {
    return this.treatmentService.getVisitList(query);
  }

  // ─── GET /treatment/visits/:id ───
  @Get('visits/:id')
  @ApiOperation({ summary: 'Get visit detail + usages (sp_TR_03_GetVisitById)' })
  @ApiParam({ name: 'id', type: Number })
  async getVisitById(@Param('id') id: number) {
    return this.treatmentService.getVisitById(Number(id));
  }

  // ─── PUT /treatment/visits/:id/usages/:usageId ───
  @Put('visits/:id/usages/:usageId')
  @ApiOperation({ summary: 'Update medicine quantity in a visit (sp_TR_04_UpdateVisitUsage)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'usageId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['new_qty_base', 'reason'],
      properties: {
        new_qty_base: { type: 'number', example: 3 },
        reason:       { type: 'string', example: 'แก้ไขตามคำสั่งแพทย์' },
      },
    },
  })
  async updateVisitUsage(
    @Param('usageId') usageId: number,
    @Body() body: IUpdateVisitUsageBody,
  ) {
    return this.treatmentService.updateVisitUsage(Number(usageId), body, this.currentUser);
  }
}
