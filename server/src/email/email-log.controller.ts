import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EmailLogService } from '@/src/email/services/email-log.service';

/**
 * Email Log Controller - REST endpoints สำหรับ query email logs
 * ใช้สำหรับ track และ debug การส่ง email
 */
@ApiTags('Email Logs')
@Controller('email-logs')
export class EmailLogController {
  constructor(private readonly emailLogService: EmailLogService) {}

  /**
   * ดึงข้อมูล email log โดย ID
   * GET /email-logs/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get email log by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Email log ID' })
  async getEmailLog(@Param('id', ParseIntPipe) emailLogId: number) {
    const log = await this.emailLogService.findById(emailLogId);
    return {
      success: !!log,
      data: log,
    };
  }

  /**
   * ดึงข้อมูล email logs สำหรับเอกสาร
   * GET /email-logs/document/:documentType/:documentId
   */
  @Get('document/:documentType/:documentId')
  @ApiOperation({ summary: 'Get email logs by document type and ID' })
  @ApiParam({ name: 'documentType', enum: ['PO', 'BORROW'] })
  @ApiParam({ name: 'documentId', type: Number })
  async getDocumentEmailLogs(
    @Param('documentType') documentType: 'PO' | 'BORROW',
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    const logs = await this.emailLogService.findByDocument(
      documentType,
      documentId,
    );
    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  }

  /**
   * ดึงสถิติการส่ง email ทั่วไป
   * GET /email-logs/stats
   */
  @Get('stats/all')
  @ApiOperation({ summary: 'Get email statistics' })
  async getStatistics() {
    const stats = await this.emailLogService.getStatistics();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * ดึงสถิติการส่ง email โดย notify type
   * GET /email-logs/stats/by-type
   */
  @Get('stats/by-type')
  @ApiOperation({ summary: 'Get email statistics by notify type' })
  async getStatisticsByNotifyType() {
    const stats = await this.emailLogService.getStatisticsByNotifyType();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * ดึงข้อมูล email ที่ล้มเหลว
   * GET /email-logs/failed
   */
  @Get('failed')
  @ApiOperation({ summary: 'Get failed emails for retry' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 100 })
  async getFailedEmails(@Query('limit') limit?: number) {
    const emails = await this.emailLogService.getFailedEmails(limit || 100);
    return {
      success: true,
      count: emails.length,
      data: emails,
    };
  }

  /**
   * ดึงประวัติส่ง email ในช่วงเวลา
   * GET /email-logs/history
   */
  @Get('history')
  @ApiOperation({ summary: 'Get email history by date range' })
  @ApiQuery({
    name: 'from',
    type: String,
    description: 'From date (ISO string)',
  })
  @ApiQuery({ name: 'to', type: String, description: 'To date (ISO string)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 100 })
  async getEmailHistory(
    @Query('from') fromDate: string,
    @Query('to') toDate: string,
    @Query('limit') limit?: number,
  ) {
    const history = await this.emailLogService.getEmailHistory(
      new Date(fromDate),
      new Date(toDate),
      limit || 100,
    );
    return {
      success: true,
      count: history.length,
      data: history,
    };
  }
}
