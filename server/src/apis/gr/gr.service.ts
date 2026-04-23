import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import {
  IAvailablePo,
  IGrDetail,
  IGrHeader,
  IGrHeaderList,
  IGrLine,
} from './gr.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GrService {
  private DATABASE_NAME = 'TEMPLATE_WEB_STACK_2025';

  constructor(
    private databaseService: DatabaseService,
    private configService: ConfigService,
  ) {
    this.DATABASE_NAME =
      this.configService.get('DATABASE_NAME') || this.DATABASE_NAME;
  }

  // ─── GET: รายการ GR ทั้งหมด ───
  async getGrList(): Promise<IGrHeaderList[]> {
    try {
      const query = `
        SELECT 
          h.gr_id,
          h.gr_no,
          h.gr_date,
          s.supplier_name,
          p.po_no,
          h.status,
          h.created_by
        FROM [${this.DATABASE_NAME}].dbo.gr_headers h
        LEFT JOIN [${this.DATABASE_NAME}].dbo.suppliers s ON h.supplier_id = s.supplier_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.po_headers p ON h.po_id = p.po_id
        ORDER BY h.created_at DESC
      `;

      const results = await this.databaseService.query<IGrHeaderList>(
        this.DATABASE_NAME,
        query,
      );

      console.log(
        '[GrService] getGrList returned:',
        results?.length || 0,
        'records',
      );
      return results || [];
    } catch (error) {
      console.error('[GrService] Error in getGrList:', error);
      throw new InternalServerErrorException('Failed to fetch GR list');
    }
  }

  // ─── GET: รายละเอียด GR (Header + Lines) ───
  async getGrDetail(grId: number): Promise<IGrDetail> {
    try {
      console.log('[GrService] getGrDetail called with grId=', grId);

      // Get header
      const headerQuery = `
        SELECT 
          h.gr_id,
          h.gr_no,
          h.gr_date,
          h.supplier_id,
          s.supplier_name,
          h.po_id,
          p.po_no,
          h.status,
          h.note,
          h.confirmed_at,
          h.confirmed_by,
          h.cancelled_at,
          h.cancelled_by,
          h.created_by,
          h.created_at,
          h.updated_by,
          h.updated_at
        FROM [${this.DATABASE_NAME}].dbo.gr_headers h
        LEFT JOIN [${this.DATABASE_NAME}].dbo.suppliers s ON h.supplier_id = s.supplier_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.po_headers p ON h.po_id = p.po_id
        WHERE h.gr_id = ${grId}
      `;

      const headers = await this.databaseService.query<IGrHeader>(
        this.DATABASE_NAME,
        headerQuery,
      );

      if (!headers || headers.length === 0) {
        console.warn('[GrService] No header found for grId=', grId);
        return { header: null, lines: [] };
      }

      const header = headers[0];

      // Get lines
      const linesQuery = `
        SELECT 
          l.gr_line_id,
          l.gr_id,
          l.item_id,
          i.item_code,
          i.item_name_th,
          l.qty_receive,
          l.unit_price,
          l.total_price,
          l.po_line_id
        FROM [${this.DATABASE_NAME}].dbo.gr_lines l
        LEFT JOIN [${this.DATABASE_NAME}].dbo.items i ON l.item_id = i.item_id
        WHERE l.gr_id = ${grId}
        ORDER BY l.gr_line_id
      `;

      const lines = await this.databaseService.query<IGrLine>(
        this.DATABASE_NAME,
        linesQuery,
      );

      console.log(
        '[GrService] Detail fetched - header: 1, lines:',
        lines?.length || 0,
      );

      return {
        header: header,
        lines: lines || [],
      };
    } catch (error) {
      console.error('[GrService] Error in getGrDetail:', error);
      throw new InternalServerErrorException('Failed to fetch GR detail');
    }
  }

  // ─── GET: รายการ PO ที่สามารถรับของได้ ───
  async getAvailablePos(): Promise<IAvailablePo[]> {
    try {
      const query = `
        SELECT 
          p.po_id,
          p.po_no,
          p.po_date,
          s.supplier_id,
          s.supplier_name,
          p.status
        FROM [${this.DATABASE_NAME}].dbo.po_headers p
        LEFT JOIN [${this.DATABASE_NAME}].dbo.suppliers s ON p.supplier_id = s.supplier_id
        WHERE p.status IN ('ORDERED', 'PARTIAL')
        ORDER BY p.po_no DESC
      `;

      const results = await this.databaseService.query<IAvailablePo>(
        this.DATABASE_NAME,
        query,
      );

      console.log(
        '[GrService] getAvailablePos returned:',
        results?.length || 0,
        'records',
      );
      return results || [];
    } catch (error) {
      console.error('[GrService] Error in getAvailablePos:', error);
      throw new InternalServerErrorException(
        'Failed to fetch available POs',
      );
    }
  }
}
