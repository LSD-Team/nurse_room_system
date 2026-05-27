import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  ICreateSpecialDrugClaimBody,
  IReturnSpecialDrugBody,
  ISpecialDrugClaimHeader,
  ISpecialDrugClaimItem,
  IUpdateSpecialDrugClaimBody,
} from './special-drug-claim.interface';

@Injectable()
export class SpecialDrugClaimService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.databaseService.getDatabaseName();
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const query = `
      SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        WHERE t.name = @tableName
          AND c.name = @columnName
      ) THEN 1 ELSE 0 END AS has_column
    `;
    const rows = await this.databaseService.query<{ has_column: number }>(
      this.DATABASE_NAME,
      query,
      { tableName, columnName },
    );
    return (rows[0]?.has_column ?? 0) === 1;
  }

  private async spHasParameter(
    procedureName: string,
    parameterNameWithAt: string,
  ): Promise<boolean> {
    const query = `
      SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM sys.parameters p
        INNER JOIN sys.procedures pr ON pr.object_id = p.object_id
        WHERE pr.name = @procedureName
          AND p.name = @parameterName
      ) THEN 1 ELSE 0 END AS has_param
    `;
    const rows = await this.databaseService.query<{ has_param: number }>(
      this.DATABASE_NAME,
      query,
      {
        procedureName,
        parameterName: parameterNameWithAt,
      },
    );
    return (rows[0]?.has_param ?? 0) === 1;
  }

  async getClaims(): Promise<ISpecialDrugClaimHeader[]> {
    const hasVisitId = await this.hasColumn('special_drug_claims', 'visit_id');
    const hasStatus = await this.hasColumn('special_drug_claims', 'status');

    const selectFields = [
      'sc.claim_id',
      hasVisitId ? 'sc.visit_id' : 'CAST(NULL AS INT) AS visit_id',
      'sc.claim_datetime',
      'sc.reason',
      hasStatus ? 'sc.status' : "CAST('OPEN' AS NVARCHAR(20)) AS status",
      'sc.created_by',
      'sc.created_at',
    ].join(',\n          ');

    const query = `
        SELECT
          ${selectFields}
        FROM dbo.special_drug_claims sc
        ORDER BY sc.claim_id DESC
      `;

    return this.databaseService.query<ISpecialDrugClaimHeader>(
      this.DATABASE_NAME,
      query,
    );
  }

  async getClaimById(claimId: number) {
    const hasVisitId = await this.hasColumn('special_drug_claims', 'visit_id');
    const hasStatus = await this.hasColumn('special_drug_claims', 'status');

    const selectFields = [
      'sc.claim_id',
      hasVisitId ? 'sc.visit_id' : 'CAST(NULL AS INT) AS visit_id',
      'sc.claim_datetime',
      'sc.reason',
      hasStatus ? 'sc.status' : "CAST('OPEN' AS NVARCHAR(20)) AS status",
      'sc.created_by',
      'sc.created_at',
    ].join(',\n          ');

    const headerQuery = `
        SELECT
          ${selectFields}
        FROM dbo.special_drug_claims sc
        WHERE sc.claim_id = @claimId
      `;

    const itemsQuery = `
      SELECT
        sci.claim_item_id,
        sci.claim_id,
        sci.item_id,
        i.item_code,
        i.item_name_th,
        i.item_name_en,
        sci.qty_issued_base,
        sci.base_unit_id,
        u.unit_name_th AS base_unit_name_th,
        sci.created_at
      FROM dbo.special_drug_claim_items sci
      LEFT JOIN dbo.items i ON i.item_id = sci.item_id
      LEFT JOIN dbo.units u ON u.unit_id = sci.base_unit_id
      WHERE sci.claim_id = @claimId
      ORDER BY sci.claim_item_id
    `;

    const movementSummaryQuery = `
      SELECT
        sm.item_id,
        SUM(CASE WHEN sm.movement_type = 'WITHDRAW' THEN sm.qty_base ELSE 0 END) AS qty_withdrawn,
        SUM(CASE WHEN sm.movement_type = 'RETURN' THEN sm.qty_base ELSE 0 END) AS qty_returned
      FROM dbo.stock_movements sm
      WHERE sm.ref_type = 'SPECIAL_DRUG_CLAIM'
        AND sm.ref_id = CAST(@claimId AS VARCHAR(50))
        AND sm.movement_type IN ('WITHDRAW', 'RETURN')
      GROUP BY sm.item_id
    `;

    const [headerRows, items, movementSummary] = await Promise.all([
      this.databaseService.query<ISpecialDrugClaimHeader>(
        this.DATABASE_NAME,
        headerQuery,
        { claimId },
      ),
      this.databaseService.query<ISpecialDrugClaimItem>(
        this.DATABASE_NAME,
        itemsQuery,
        { claimId },
      ),
      this.databaseService.query<{
        item_id: number;
        qty_withdrawn: number;
        qty_returned: number;
      }>(this.DATABASE_NAME, movementSummaryQuery, { claimId }),
    ]);

    return {
      header: headerRows[0] ?? null,
      items,
      movement_summary: movementSummary,
    };
  }

  async createClaim(body: ICreateSpecialDrugClaimBody, createdBy: string) {
    const params: Record<string, unknown> = {
      ClaimDatetime: body.claim_datetime ?? null,
      Reason: body.reason ?? null,
      JsonItems: JSON.stringify(body.items ?? []),
      CreatedBy: createdBy,
    };

    const hasVisitParam = await this.spHasParameter('sp_SC_01_Create', '@VisitId');
    if (hasVisitParam) {
      params.VisitId = body.visit_id ?? null;
    }

    return this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_SC_01_Create',
      params,
    );
  }

  async updateClaim(
    claimId: number,
    body: IUpdateSpecialDrugClaimBody,
    editedBy: string,
  ) {
    const adjustments = body.adjustments ?? null;
    return this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_SC_03_Update',
      {
        ClaimId: claimId,
        ClaimDatetime: body.claim_datetime ?? null,
        Reason: body.reason ?? null,
        JsonAdjustments: adjustments ? JSON.stringify(adjustments) : null,
        EditedBy: editedBy,
      },
    );
  }

  async returnClaimItem(body: IReturnSpecialDrugBody, createdBy: string) {
    return this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_SC_02_Return',
      {
        ClaimItemId: body.claim_item_id,
        QtyReturnBase: body.qty_return_base,
        ReturnDatetime: body.return_datetime ?? null,
        Reason: body.reason ?? null,
        CreatedBy: createdBy,
      },
    );
  }

  async closeClaim(claimId: number, closedBy: string) {
    return this.databaseService.executeStoredProcedure<any>(
      this.DATABASE_NAME,
      'sp_SC_04_Close',
      {
        ClaimId: claimId,
        ClosedBy: closedBy,
      },
    );
  }
}
