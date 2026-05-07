import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import {
  IAvailablePo,
  IGrDetail,
  IGrHeader,
  IGrHeaderList,
  IGrLine,
  IPendingItem,
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

      // Get lines with conversion_factor from supplier_price_list
      const linesQuery = `
        WITH ranked_prices AS (
          SELECT
            spl.item_id,
            spl.conversion_factor,
            ROW_NUMBER() OVER (PARTITION BY spl.item_id ORDER BY spl.effective_date DESC, spl.unit_price ASC) AS rn
          FROM [${this.DATABASE_NAME}].dbo.supplier_price_list spl
          WHERE spl.is_active = 1
            AND spl.effective_date <= CAST(GETDATE() AS DATE)
            AND (spl.expire_date IS NULL OR spl.expire_date >= CAST(GETDATE() AS DATE))
        )
        SELECT
          l.gr_line_id,
          l.gr_id,
          h.gr_no,
          h.gr_date,
          l.item_id,
          i.item_code,
          i.item_name_th,
          i.item_name_en,
          l.qty_receive,
          l.unit_price,
          l.total_price,
          l.po_line_id,
          p.po_id,
          ph.po_no,
          ISNULL(rp.conversion_factor, 1) AS conversion_factor
        FROM [${this.DATABASE_NAME}].dbo.gr_lines l
        LEFT JOIN [${this.DATABASE_NAME}].dbo.gr_headers h ON l.gr_id = h.gr_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.items i ON l.item_id = i.item_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.po_lines p ON l.po_line_id = p.po_line_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.po_headers ph ON p.po_id = ph.po_id
        LEFT JOIN ranked_prices rp ON rp.item_id = l.item_id AND rp.rn = 1
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

  // ─── GET: pending items จาก specific PO ───
  async getPendingItems(poId: number): Promise<IPendingItem[]> {
    try {
      console.log('[GrService] getPendingItems called with poId=', poId);

      const query = `
        SELECT 
          pl.po_line_id,
          pl.item_id,
          i.item_code,
          i.item_name_th,
          i.item_name_en,
          pl.qty_order,
          pl.qty_received,
          (pl.qty_order - pl.qty_received) AS qty_remaining,
          spl.unit_price,
          spl.conversion_factor,
          u.unit_name_th,
          u.unit_code,
          pl.line_type
        FROM [${this.DATABASE_NAME}].dbo.po_lines pl
        LEFT JOIN [${this.DATABASE_NAME}].dbo.items i ON pl.item_id = i.item_id
        LEFT JOIN [${this.DATABASE_NAME}].dbo.supplier_price_list spl 
          ON spl.item_id = pl.item_id 
          AND spl.supplier_id = (SELECT supplier_id FROM [${this.DATABASE_NAME}].dbo.po_headers WHERE po_id = ${poId})
          AND spl.is_active = 1
          AND spl.effective_date <= CAST(GETDATE() AS DATE)
          AND (spl.expire_date IS NULL OR spl.expire_date >= CAST(GETDATE() AS DATE))
        LEFT JOIN [${this.DATABASE_NAME}].dbo.units u ON u.unit_id = spl.unit_id
        WHERE pl.po_id = ${poId}
          AND pl.qty_received < pl.qty_order
        ORDER BY pl.po_line_id
      `;

      const results = await this.databaseService.query<IPendingItem>(
        this.DATABASE_NAME,
        query,
      );

      console.log(
        '[GrService] getPendingItems returned:',
        results?.length || 0,
        'pending items',
      );
      return results || [];
    } catch (error) {
      console.error('[GrService] Error in getPendingItems:', error);
      throw new InternalServerErrorException(
        'Failed to fetch pending items',
      );
    }
  }

  // ─── POST: สร้าง GR ใหม่ (sp_GR_02_CreateGR) ───
  async createGr(
    poId: number,
    jsonLines: string | undefined,
    note: string | null,
    createdBy: string,
  ): Promise<{ gr_id: number; gr_no: string }> {
    try {
      console.log('[GrService] createGr called:', {
        poId,
        jsonLines: jsonLines || 'not provided',
        note,
        createdBy,
      });

      // SP params: PoId, JsonLines, Note, CreatedBy
      // JsonLines can be provided by client, or SP will build it from po_lines
      const result = await this.databaseService.executeStoredProcedure(
        this.DATABASE_NAME,
        'sp_GR_02_CreateGR',
        {
          PoId: poId.toString(),
          JsonLines: jsonLines || null,
          Note: note,
          CreatedBy: createdBy,
        },
      );

      if (!result || result.length === 0) {
        throw new Error('No result from sp_GR_02_CreateGR');
      }

      interface SpResponse {
        Status: string;
        Message: string;
        gr_id?: number;
        gr_no?: string;
      }
      const response = result[0] as SpResponse;
      if (response.Status !== 'Success') {
        throw new Error(response.Message || 'Failed to create GR');
      }

      console.log('[GrService] GR created successfully:', response);
      return {
        gr_id: response.gr_id || 0,
        gr_no: response.gr_no || '',
      };
    } catch (error) {
      console.error('[GrService] Error in createGr:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to create GR',
      );
    }
  }

  // ─── POST: ยืนยัน GR (sp_GR_03_ConfirmGR) ───
  async confirmGr(
    grId: number,
    confirmedBy: string,
  ): Promise<{ status: string; message: string }> {
    try {
      console.log('[GrService] confirmGr called:', {
        grId,
        confirmedBy,
      });

      const result = await this.databaseService.executeStoredProcedure(
        this.DATABASE_NAME,
        'sp_GR_03_ConfirmGR',
        {
          GrId: grId.toString(),
          ConfirmedBy: confirmedBy,
        },
      );

      if (!result || result.length === 0) {
        throw new Error('No result from sp_GR_03_ConfirmGR');
      }

      interface SpResponse {
        Status: string;
        Message: string;
      }
      const response = result[0] as SpResponse;
      if (response.Status !== 'Success') {
        throw new Error(response.Message || 'Failed to confirm GR');
      }

      console.log('[GrService] GR confirmed successfully:', response);
      return {
        status: response.Status,
        message: response.Message,
      };
    } catch (error) {
      console.error('[GrService] Error in confirmGr:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to confirm GR',
      );
    }
  }

  // ─── POST: ยกเลิก GR (sp_GRCancel) ───
  async cancelGr(
    grId: number,
    cancelledBy: string,
  ): Promise<{ status: string; message: string }> {
    try {
      console.log('[GrService] cancelGr called:', {
        grId,
        cancelledBy,
      });

      const result = await this.databaseService.executeStoredProcedure(
        this.DATABASE_NAME,
        'sp_GRCancel',
        {
          GrId: grId.toString(),
          CancelledBy: cancelledBy,
          Reason: null,
        },
      );

      if (!result || result.length === 0) {
        throw new Error('No result from sp_GRCancel');
      }

      interface SpResponse {
        Status: string;
        Message: string;
      }
      const response = result[0] as SpResponse;
      if (response.Status !== 'Success') {
        throw new Error(response.Message || 'Failed to cancel GR');
      }

      console.log('[GrService] GR cancelled successfully:', response);
      return {
        status: response.Status,
        message: response.Message,
      };
    } catch (error) {
      console.error('[GrService] Error in cancelGr:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to cancel GR',
      );
    }
  }

  // ─── GET: Count GRs with DRAFT status ───
  async getGrDraftCount(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM [${this.DATABASE_NAME}].dbo.gr_headers
        WHERE status = 'DRAFT'
      `;
      const result = await this.databaseService.query<{ count: number }>(
        this.DATABASE_NAME,
        query,
      );
      return result?.[0]?.count || 0;
    } catch (error) {
      console.error('[GrService] Error getting GR draft count:', error);
      return 0;
    }
  }
}
