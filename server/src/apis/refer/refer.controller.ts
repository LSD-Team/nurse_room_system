import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ReferService } from './refer.service';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';
import type {
  ICreateReferCaseBody,
  IPatchReferCaseBody,
  ICreateFollowupBody,
  IPatchFollowupBody,
} from './refer.interface';

@ApiTags('refer')
@ApiBearerAuth()
@Controller('refer')
export class ReferController {
  constructor(private readonly referService: ReferService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ─── GET /refer/by-patient/:patientId ─────────────────────────────────────────
  @Get('by-patient/:patientId')
  @ApiOperation({
    summary: 'Get all refer cases for a patient across all visits',
  })
  @ApiParam({ name: 'patientId', type: String })
  async getByPatient(@Param('patientId') patientId: string) {
    return this.referService.getByPatient(patientId);
  }

  // ─── GET /refer/cases/:visitId ────────────────────────────────────────────────
  @Get('cases/:visitId')
  @ApiOperation({
    summary: 'Get all refer cases under a visit (vw_refer_cases_summary)',
  })
  @ApiParam({ name: 'visitId', type: Number })
  async getCasesByVisit(@Param('visitId') visitId: string) {
    return this.referService.getCasesByVisit(Number(visitId));
  }

  // ─── POST /refer/cases ────────────────────────────────────────────────────────
  @Post('cases')
  @ApiOperation({ summary: 'Create a new refer case (sp_Refer_01_CreateCase)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['visit_id', 'refer_type_id'],
      properties: {
        visit_id: { type: 'number', example: 11 },
        refer_type_id: { type: 'number', example: 2 },
        refer_reason: { type: 'string', example: 'อุบัติเหตุในที่ทำงาน' },
        opened_at: { type: 'string', example: '2026-05-23T10:00:00' },
      },
    },
  })
  async createCase(@Body() body: ICreateReferCaseBody) {
    return this.referService.createCase(body, this.currentUser);
  }

  // ─── PATCH /refer/cases/:caseId ───────────────────────────────────────────────
  @Patch('cases/:caseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update refer case fields (status, reason, etc.)' })
  @ApiParam({ name: 'caseId', type: Number })
  async patchCase(
    @Param('caseId') caseId: string,
    @Body() body: IPatchReferCaseBody,
  ) {
    return this.referService.patchCase(Number(caseId), body, this.currentUser);
  }

  // ─── DELETE /refer/cases/:caseId ──────────────────────────────────────────────
  @Delete('cases/:caseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a refer case' })
  @ApiParam({ name: 'caseId', type: Number })
  async deleteCase(@Param('caseId') caseId: string) {
    return this.referService.deleteCase(Number(caseId), this.currentUser);
  }

  // ─── GET /refer/followups/:caseId ─────────────────────────────────────────────
  @Get('followups/:caseId')
  @ApiOperation({
    summary:
      'Get follow-up timeline for a refer case (vw_refer_followups_timeline)',
  })
  @ApiParam({ name: 'caseId', type: Number })
  async getFollowupsByCase(@Param('caseId') caseId: string) {
    return this.referService.getFollowupsByCase(Number(caseId));
  }

  // ─── POST /refer/followups ────────────────────────────────────────────────────
  @Post('followups')
  @ApiOperation({
    summary:
      'Create a new follow-up under a refer case (sp_Refer_02_CreateFollowup)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refer_case_id', 'outcome'],
      properties: {
        refer_case_id: { type: 'number', example: 1 },
        followup_at: { type: 'string', example: '2026-05-23T10:00:00' },
        hospital_id: { type: 'number', example: 5 },
        room_no: { type: 'string', example: 'ER-01' },
        outcome: {
          type: 'string',
          enum: [
            'ADMISSION',
            'BACK_TO_COMPANY',
            'BACK_TO_HOME',
            'FOLLOWUP_ONLY',
          ],
          example: 'FOLLOWUP_ONLY',
        },
        back_to_work_date: { type: 'string', example: '2026-06-01' },
        followup_note: { type: 'string', example: 'ทำแผลเรียบร้อย' },
        next_appointment_at: { type: 'string', example: '2026-05-30T10:00:00' },
      },
    },
  })
  async createFollowup(@Body() body: ICreateFollowupBody) {
    return this.referService.createFollowup(body, this.currentUser);
  }

  // ─── PATCH /refer/followups/:followupId ───────────────────────────────────────
  @Patch('followups/:followupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a follow-up record' })
  @ApiParam({ name: 'followupId', type: Number })
  async patchFollowup(
    @Param('followupId') followupId: string,
    @Body() body: IPatchFollowupBody,
  ) {
    return this.referService.patchFollowup(
      Number(followupId),
      body,
      this.currentUser,
    );
  }

  // ─── DELETE /refer/followups/:followupId ──────────────────────────────────────
  @Delete('followups/:followupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a follow-up record' })
  @ApiParam({ name: 'followupId', type: Number })
  async deleteFollowup(@Param('followupId') followupId: string) {
    return this.referService.deleteFollowup(
      Number(followupId),
      this.currentUser,
    );
  }
}
