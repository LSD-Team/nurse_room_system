import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@/src/database/database.service';
import type {
  ICreateDiseaseGroupBody,
  ICreateDiseaseTypeBody,
  ICreateHospitalBody,
  ICreateItemBody,
  ICreateReferTypeBody,
  ICreateSupplierBody,
  ICreateTreatmentTypeBody,
  ICreateUnitBody,
  IDiseaseGroupLookup,
  IDiseaseGroupMasterData,
  IDiseaseTypeMasterData,
  IHospitalMasterData,
  IHospitalTypeLookup,
  IItemMasterData,
  IItemTypeLookup,
  IReferTypeMasterData,
  ISupplierPriceListBulkBody,
  ISupplierPriceListItemsResponse,
  ISupplierMasterData,
  ITreatmentTypeMasterData,
  IUnitLookupOption,
  IUnitMasterData,
  IUpdateDiseaseGroupBody,
  IUpdateDiseaseTypeBody,
  IUpdateHospitalBody,
  IUpdateItemBody,
  IUpdateReferTypeBody,
  IUpdateSupplierBody,
  IUpdateTreatmentTypeBody,
  IUpdateUnitBody,
} from './master-data.interface';

@Injectable()
export class MasterDataService {
  private readonly logger = new Logger(MasterDataService.name);

  constructor(private readonly db: DatabaseService) {}

  private get DATABASE_NAME(): string {
    return this.db.getDatabaseName();
  }

  private normalizeRequiredText(
    value: string | undefined,
    fieldName: string,
  ): string {
    const text = value?.trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    return text;
  }

  private normalizeOptionalText(value?: string): string | null {
    const text = value?.trim();
    return text ? text : null;
  }

  private normalizeSortOrder(value?: number): number {
    const num = value ?? 0;
    if (!Number.isInteger(num) || num < 0) {
      throw new BadRequestException(
        'sort_order must be a non-negative integer',
      );
    }
    return num;
  }

  private normalizeOptionalInteger(
    value?: number | null,
    fieldName?: string,
  ): number | null {
    if (value == null) return null;
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        `${fieldName || 'value'} must be a non-negative integer`,
      );
    }
    return value;
  }

  private normalizePositiveDecimal(
    value: number | null | undefined,
    fieldName: string,
  ): number {
    if (value == null || Number.isNaN(Number(value)) || Number(value) <= 0) {
      throw new BadRequestException(`${fieldName} must be greater than 0`);
    }
    return Number(value);
  }

  private normalizeRequiredDate(
    value: string | null | undefined,
    fieldName: string,
  ): string {
    const text = value?.trim();
    if (!text) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }
    return text.slice(0, 10);
  }

  private normalizeOptionalDate(
    value: string | null | undefined,
    fieldName: string,
  ): string | null {
    const text = value?.trim();
    if (!text) return null;
    const d = new Date(text);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }
    return text.slice(0, 10);
  }

  private validateItemMinMax(
    itemMin: number | null,
    itemMax: number | null,
  ): void {
    if (itemMin != null && itemMax != null && itemMin > itemMax) {
      throw new BadRequestException(
        'item_min must be less than or equal to item_max',
      );
    }
  }

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  async getSuppliers(search?: string): Promise<ISupplierMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<ISupplierMasterData>(
        this.DATABASE_NAME,
        `SELECT
            supplier_id, supplier_code, supplier_name, contact_name, phone, email, address, tax_id, note,
            is_active, created_by, created_at
         FROM suppliers
         WHERE is_active = 1
           AND (
             @search IS NULL
             OR supplier_code LIKE '%' + @search + '%'
             OR supplier_name LIKE '%' + @search + '%'
           )
         ORDER BY supplier_code ASC, supplier_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get suppliers', error);
      throw new InternalServerErrorException('Failed to get suppliers');
    }
  }

  private async ensureUniqueSupplierCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM suppliers
       WHERE UPPER(LTRIM(RTRIM(supplier_code))) = UPPER(@supplier_code)
         AND (@exclude_id IS NULL OR supplier_id <> @exclude_id)`,
      { supplier_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Supplier code already exists');
    }
  }

  async createSupplier(
    body: ICreateSupplierBody,
    currentUser: string,
  ): Promise<ISupplierMasterData> {
    const supplierCode = this.normalizeRequiredText(
      body.supplier_code,
      'supplier_code',
    );
    const supplierName = this.normalizeRequiredText(
      body.supplier_name,
      'supplier_name',
    );
    try {
      await this.ensureUniqueSupplierCode(supplierCode);
      const insertRows = await this.db.query<{ supplier_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO suppliers (
              supplier_code, supplier_name, contact_name, phone, email, address, tax_id, note, is_active, created_by, created_at
            ) VALUES (
              @supplier_code, @supplier_name, @contact_name, @phone, @email, @address, @tax_id, @note, 1, @created_by, GETDATE()
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS supplier_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          supplier_code: supplierCode,
          supplier_name: supplierName,
          contact_name: this.normalizeOptionalText(body.contact_name),
          phone: this.normalizeOptionalText(body.phone),
          email: this.normalizeOptionalText(body.email),
          address: this.normalizeOptionalText(body.address),
          tax_id: this.normalizeOptionalText(body.tax_id),
          note: this.normalizeOptionalText(body.note),
          created_by: currentUser,
        },
      );

      const supplierId = insertRows[0]?.supplier_id;
      const rows = await this.db.query<ISupplierMasterData>(
        this.DATABASE_NAME,
        `SELECT
            supplier_id, supplier_code, supplier_name, contact_name, phone, email, address, tax_id, note,
            is_active, created_by, created_at
         FROM suppliers
         WHERE supplier_id = @supplier_id`,
        { supplier_id: supplierId },
      );

      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create supplier', error);
      throw new InternalServerErrorException('Failed to create supplier');
    }
  }

  async updateSupplier(
    id: number,
    body: IUpdateSupplierBody,
  ): Promise<ISupplierMasterData> {
    const supplierCode = this.normalizeRequiredText(
      body.supplier_code,
      'supplier_code',
    );
    const supplierName = this.normalizeRequiredText(
      body.supplier_name,
      'supplier_name',
    );
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM suppliers
         WHERE supplier_id = @supplier_id
           AND is_active = 1`,
        { supplier_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Supplier not found');
      }

      await this.ensureUniqueSupplierCode(supplierCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE suppliers
            SET supplier_code = @supplier_code,
                supplier_name = @supplier_name,
                contact_name = @contact_name,
                phone = @phone,
                email = @email,
                address = @address,
                tax_id = @tax_id,
                note = @note
            WHERE supplier_id = @supplier_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          supplier_id: id,
          supplier_code: supplierCode,
          supplier_name: supplierName,
          contact_name: this.normalizeOptionalText(body.contact_name),
          phone: this.normalizeOptionalText(body.phone),
          email: this.normalizeOptionalText(body.email),
          address: this.normalizeOptionalText(body.address),
          tax_id: this.normalizeOptionalText(body.tax_id),
          note: this.normalizeOptionalText(body.note),
        },
      );

      const rows = await this.db.query<ISupplierMasterData>(
        this.DATABASE_NAME,
        `SELECT
            supplier_id, supplier_code, supplier_name, contact_name, phone, email, address, tax_id, note,
            is_active, created_by, created_at
         FROM suppliers
         WHERE supplier_id = @supplier_id`,
        { supplier_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update supplier ${id}`, error);
      throw new InternalServerErrorException('Failed to update supplier');
    }
  }

  async deleteSupplier(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE suppliers
         SET is_active = 0
         WHERE supplier_id = @supplier_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { supplier_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Supplier not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete supplier ${id}`, error);
      throw new InternalServerErrorException('Failed to delete supplier');
    }
  }

  async getSupplierPriceListItems(
    supplierId: number,
  ): Promise<ISupplierPriceListItemsResponse> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new BadRequestException('supplier_id must be a positive integer');
    }
    try {
      const supplierRows = await this.db.query<{
        supplier_id: number;
        supplier_code: string;
        supplier_name: string;
      }>(
        this.DATABASE_NAME,
        `SELECT supplier_id, supplier_code, supplier_name
         FROM suppliers
         WHERE supplier_id = @supplier_id
           AND is_active = 1`,
        { supplier_id: supplierId },
      );
      if (!supplierRows.length) {
        throw new NotFoundException('Supplier not found');
      }

      const [items, units] = await Promise.all([
        this.db.query<
          ISupplierPriceListItemsResponse['items'][number] & {
            selected_raw: number;
          }
        >(
          this.DATABASE_NAME,
          `SELECT
              i.item_id,
              i.item_code,
              i.item_name_th,
              i.item_name_en,
              i.usage_unit_id,
              u.unit_name_th AS usage_unit_name_th,
              u.unit_name_en AS usage_unit_name_en,
              CASE WHEN ap.price_id IS NULL THEN 0 ELSE 1 END AS selected_raw,
              ap.price_id,
              COALESCE(ap.unit_id, lp.unit_id) AS unit_id,
              COALESCE(ap.unit_price, lp.unit_price) AS unit_price,
              COALESCE(ap.conversion_factor, lp.conversion_factor, 1) AS conversion_factor,
              COALESCE(ap.effective_date, lp.effective_date) AS effective_date,
              COALESCE(ap.expire_date, lp.expire_date) AS expire_date,
              ap.is_active
           FROM items i
           LEFT JOIN units u ON i.usage_unit_id = u.unit_id
           OUTER APPLY (
             SELECT TOP 1
               spl.price_id,
               spl.unit_id,
               spl.unit_price,
               spl.conversion_factor,
               spl.effective_date,
               spl.expire_date,
               spl.is_active
             FROM supplier_price_list spl
             WHERE spl.supplier_id = @supplier_id
               AND spl.item_id = i.item_id
               AND spl.is_active = 1
             ORDER BY spl.effective_date DESC, spl.price_id DESC
           ) ap
           OUTER APPLY (
             SELECT TOP 1
               spl.unit_id,
               spl.unit_price,
               spl.conversion_factor,
               spl.effective_date,
               spl.expire_date
             FROM supplier_price_list spl
             WHERE spl.supplier_id = @supplier_id
               AND spl.item_id = i.item_id
             ORDER BY spl.effective_date DESC, spl.price_id DESC
           ) lp
           WHERE i.is_active = 1
           ORDER BY i.item_code ASC, i.item_id ASC`,
          { supplier_id: supplierId },
        ),
        this.db.query<IUnitLookupOption>(
          this.DATABASE_NAME,
          `SELECT unit_id, unit_code, unit_name_th, unit_name_en
           FROM units
           WHERE is_active = 1
           ORDER BY unit_code ASC, unit_id ASC`,
        ),
      ]);

      return {
        ...supplierRows[0],
        items: items.map((row) => ({
          item_id: row.item_id,
          item_code: row.item_code,
          item_name_th: row.item_name_th,
          item_name_en: row.item_name_en,
          usage_unit_id: row.usage_unit_id,
          usage_unit_name_th: row.usage_unit_name_th,
          usage_unit_name_en: row.usage_unit_name_en,
          selected: row.selected_raw === 1,
          price_id: row.price_id,
          unit_id: row.unit_id,
          unit_price: row.unit_price,
          conversion_factor: row.conversion_factor,
          effective_date: row.effective_date,
          expire_date: row.expire_date,
          is_active: row.is_active,
        })),
        units,
      };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to get supplier price list items for supplier ${supplierId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to get supplier price list items',
      );
    }
  }

  async saveSupplierPriceListBulk(
    supplierId: number,
    body: ISupplierPriceListBulkBody,
    currentUser: string,
  ): Promise<{ saved: boolean }> {
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      throw new BadRequestException('supplier_id must be a positive integer');
    }
    if (!Array.isArray(body?.rows)) {
      throw new BadRequestException('rows must be an array');
    }

    const rows = body.rows.map((row, index) => {
      const itemId = Number(row.item_id);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        throw new BadRequestException(
          `rows[${index}].item_id must be a positive integer`,
        );
      }

      const selected = !!row.selected;
      if (!selected) {
        return {
          item_id: itemId,
          selected,
          price_id:
            row.price_id == null
              ? null
              : Number.isInteger(Number(row.price_id))
                ? Number(row.price_id)
                : null,
          unit_id: null,
          unit_price: null,
          conversion_factor: null,
          effective_date: null as string | null,
        };
      }

      const unitId = Number(row.unit_id);
      if (!Number.isInteger(unitId) || unitId <= 0) {
        throw new BadRequestException(`rows[${index}].unit_id is required`);
      }
      const unitPrice = this.normalizePositiveDecimal(
        row.unit_price ?? null,
        `rows[${index}].unit_price`,
      );
      const conversionFactor = this.normalizePositiveDecimal(
        row.conversion_factor ?? null,
        `rows[${index}].conversion_factor`,
      );
      const effectiveDate = this.normalizeRequiredDate(
        row.effective_date ?? null,
        `rows[${index}].effective_date`,
      );

      return {
        item_id: itemId,
        selected,
        price_id:
          row.price_id == null
            ? null
            : Number.isInteger(Number(row.price_id))
              ? Number(row.price_id)
              : null,
        unit_id: unitId,
        unit_price: unitPrice,
        conversion_factor: conversionFactor,
        effective_date: effectiveDate,
      };
    });

    try {
      const supplierRows = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM suppliers
         WHERE supplier_id = @supplier_id
           AND is_active = 1`,
        { supplier_id: supplierId },
      );
      if ((supplierRows[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Supplier not found');
      }

      const payloadJson = JSON.stringify(rows);
      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;

            DECLARE @rows TABLE (
              item_id INT NOT NULL,
              selected BIT NOT NULL,
              price_id INT NULL,
              unit_id INT NULL,
              unit_price DECIMAL(18,4) NULL,
              conversion_factor DECIMAL(18,4) NULL,
              effective_date DATE NULL
            );

            INSERT INTO @rows (
              item_id, selected, price_id, unit_id, unit_price,
              conversion_factor, effective_date
            )
            SELECT
              item_id,
              selected,
              price_id,
              unit_id,
              unit_price,
              conversion_factor,
              effective_date
            FROM OPENJSON(@rows_json)
            WITH (
              item_id INT '$.item_id',
              selected BIT '$.selected',
              price_id INT '$.price_id',
              unit_id INT '$.unit_id',
              unit_price DECIMAL(18,4) '$.unit_price',
              conversion_factor DECIMAL(18,4) '$.conversion_factor',
              effective_date DATE '$.effective_date'
            );

            IF EXISTS (
              SELECT 1
              FROM @rows
              WHERE selected = 1
                AND (
                  unit_id IS NULL
                  OR unit_price IS NULL
                  OR conversion_factor IS NULL
                  OR effective_date IS NULL
                  OR unit_price <= 0
                  OR conversion_factor <= 0
                )
            )
              THROW 50001, 'Please fill required fields for selected items.', 1;

            IF EXISTS (
              SELECT 1
              FROM @rows r
              LEFT JOIN items i ON i.item_id = r.item_id AND i.is_active = 1
              WHERE r.selected = 1
                AND i.item_id IS NULL
            )
              THROW 50002, 'Invalid item_id in selected rows.', 1;

            IF EXISTS (
              SELECT 1
              FROM @rows r
              LEFT JOIN units u ON u.unit_id = r.unit_id AND u.is_active = 1
              WHERE r.selected = 1
                AND u.unit_id IS NULL
            )
              THROW 50003, 'Invalid unit_id in selected rows.', 1;

            MERGE supplier_price_list AS target
            USING (
              SELECT item_id, unit_id, unit_price, conversion_factor, effective_date
              FROM @rows
              WHERE selected = 1
            ) AS src
              ON target.supplier_id = @supplier_id
             AND target.item_id = src.item_id
             AND target.unit_id = src.unit_id
             AND target.effective_date = src.effective_date
            WHEN MATCHED THEN
              UPDATE
              SET target.unit_price = src.unit_price,
                  target.conversion_factor = src.conversion_factor,
                  target.is_active = 1,
                  target.updated_by = @updated_by
            WHEN NOT MATCHED THEN
              INSERT (
                supplier_id, item_id, unit_id, unit_price, effective_date,
                conversion_factor, is_active, created_by, created_at, updated_by, updated_at
              )
              VALUES (
                @supplier_id, src.item_id, src.unit_id, src.unit_price, src.effective_date,
                src.conversion_factor, 1, @created_by, GETDATE(), @updated_by, GETDATE()
              );

            UPDATE spl
            SET spl.is_active = 0,
                spl.updated_by = @updated_by
            FROM supplier_price_list spl
            INNER JOIN @rows r ON r.price_id = spl.price_id
            WHERE r.selected = 0
              AND r.price_id IS NOT NULL
              AND spl.supplier_id = @supplier_id
              AND spl.is_active = 1;

            UPDATE spl
            SET spl.is_active = 0,
                spl.updated_by = @updated_by
            FROM supplier_price_list spl
            INNER JOIN @rows r
              ON r.selected = 1
             AND spl.supplier_id = @supplier_id
             AND spl.item_id = r.item_id
            WHERE spl.is_active = 1
              AND NOT (
                spl.unit_id = r.unit_id
                AND spl.effective_date = r.effective_date
              );

            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          supplier_id: supplierId,
          rows_json: payloadJson,
          created_by: currentUser,
          updated_by: currentUser,
        },
      );

      return { saved: true };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error?.number === 2601 || error?.number === 2627) {
        throw new ConflictException(
          'Duplicate price key (item/unit/effective date).',
        );
      }

      if (error?.number >= 50000 && typeof error?.message === 'string') {
        throw new BadRequestException(error.message);
      }

      this.logger.error(
        `Failed to save supplier price list for supplier ${supplierId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to save supplier price list',
      );
    }
  }

  // ─── Treatment Types ────────────────────────────────────────────────────────
  async getTreatmentTypes(
    search?: string,
  ): Promise<ITreatmentTypeMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<ITreatmentTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            treatment_type_id, treatment_code, treatment_name_th, treatment_name_en, sort_order, is_active
         FROM treatment_types
         WHERE is_active = 1
           AND (
             @search IS NULL
             OR treatment_code LIKE '%' + @search + '%'
             OR treatment_name_th LIKE '%' + @search + '%'
             OR treatment_name_en LIKE '%' + @search + '%'
           )
         ORDER BY sort_order ASC, treatment_type_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get treatment types', error);
      throw new InternalServerErrorException('Failed to get treatment types');
    }
  }

  private async ensureUniqueTreatmentCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM treatment_types
       WHERE UPPER(LTRIM(RTRIM(treatment_code))) = UPPER(@treatment_code)
         AND (@exclude_id IS NULL OR treatment_type_id <> @exclude_id)`,
      { treatment_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Treatment code already exists');
    }
  }

  async createTreatmentType(
    body: ICreateTreatmentTypeBody,
  ): Promise<ITreatmentTypeMasterData> {
    const treatmentCode = this.normalizeRequiredText(
      body.treatment_code,
      'treatment_code',
    );
    const treatmentNameTh = this.normalizeRequiredText(
      body.treatment_name_th,
      'treatment_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      await this.ensureUniqueTreatmentCode(treatmentCode);
      const insertRows = await this.db.query<{ treatment_type_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO treatment_types (
              treatment_code, treatment_name_th, treatment_name_en, sort_order, is_active
            ) VALUES (
              @treatment_code, @treatment_name_th, @treatment_name_en, @sort_order, 1
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS treatment_type_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          treatment_code: treatmentCode,
          treatment_name_th: treatmentNameTh,
          treatment_name_en: this.normalizeOptionalText(body.treatment_name_en),
          sort_order: sortOrder,
        },
      );
      const treatmentTypeId = insertRows[0]?.treatment_type_id;
      const rows = await this.db.query<ITreatmentTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            treatment_type_id, treatment_code, treatment_name_th, treatment_name_en, sort_order, is_active
         FROM treatment_types
         WHERE treatment_type_id = @treatment_type_id`,
        { treatment_type_id: treatmentTypeId },
      );
      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create treatment type', error);
      throw new InternalServerErrorException('Failed to create treatment type');
    }
  }

  async updateTreatmentType(
    id: number,
    body: IUpdateTreatmentTypeBody,
  ): Promise<ITreatmentTypeMasterData> {
    const treatmentCode = this.normalizeRequiredText(
      body.treatment_code,
      'treatment_code',
    );
    const treatmentNameTh = this.normalizeRequiredText(
      body.treatment_name_th,
      'treatment_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM treatment_types
         WHERE treatment_type_id = @treatment_type_id
           AND is_active = 1`,
        { treatment_type_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Treatment type not found');
      }

      await this.ensureUniqueTreatmentCode(treatmentCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE treatment_types
            SET treatment_code = @treatment_code,
                treatment_name_th = @treatment_name_th,
                treatment_name_en = @treatment_name_en,
                sort_order = @sort_order
            WHERE treatment_type_id = @treatment_type_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          treatment_type_id: id,
          treatment_code: treatmentCode,
          treatment_name_th: treatmentNameTh,
          treatment_name_en: this.normalizeOptionalText(body.treatment_name_en),
          sort_order: sortOrder,
        },
      );

      const rows = await this.db.query<ITreatmentTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            treatment_type_id, treatment_code, treatment_name_th, treatment_name_en, sort_order, is_active
         FROM treatment_types
         WHERE treatment_type_id = @treatment_type_id`,
        { treatment_type_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update treatment type ${id}`, error);
      throw new InternalServerErrorException('Failed to update treatment type');
    }
  }

  async deleteTreatmentType(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE treatment_types
         SET is_active = 0
         WHERE treatment_type_id = @treatment_type_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { treatment_type_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Treatment type not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete treatment type ${id}`, error);
      throw new InternalServerErrorException('Failed to delete treatment type');
    }
  }

  // ─── Refer Types ────────────────────────────────────────────────────────────
  async getReferTypes(search?: string): Promise<IReferTypeMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<IReferTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            refer_type_id, refer_code, refer_name_th, refer_name_en, sort_order, is_active
         FROM refer_types
         WHERE is_active = 1
           AND (
             @search IS NULL
             OR refer_code LIKE '%' + @search + '%'
             OR refer_name_th LIKE '%' + @search + '%'
             OR refer_name_en LIKE '%' + @search + '%'
           )
         ORDER BY sort_order ASC, refer_type_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get refer types', error);
      throw new InternalServerErrorException('Failed to get refer types');
    }
  }

  private async ensureUniqueReferCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM refer_types
       WHERE UPPER(LTRIM(RTRIM(refer_code))) = UPPER(@refer_code)
         AND (@exclude_id IS NULL OR refer_type_id <> @exclude_id)`,
      { refer_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Refer code already exists');
    }
  }

  async createReferType(
    body: ICreateReferTypeBody,
  ): Promise<IReferTypeMasterData> {
    const referCode = this.normalizeRequiredText(body.refer_code, 'refer_code');
    const referNameTh = this.normalizeRequiredText(
      body.refer_name_th,
      'refer_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      await this.ensureUniqueReferCode(referCode);
      const insertRows = await this.db.query<{ refer_type_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO refer_types (
              refer_code, refer_name_th, refer_name_en, sort_order, is_active
            ) VALUES (
              @refer_code, @refer_name_th, @refer_name_en, @sort_order, 1
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS refer_type_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          refer_code: referCode,
          refer_name_th: referNameTh,
          refer_name_en: this.normalizeOptionalText(body.refer_name_en),
          sort_order: sortOrder,
        },
      );
      const referTypeId = insertRows[0]?.refer_type_id;
      const rows = await this.db.query<IReferTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            refer_type_id, refer_code, refer_name_th, refer_name_en, sort_order, is_active
         FROM refer_types
         WHERE refer_type_id = @refer_type_id`,
        { refer_type_id: referTypeId },
      );
      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create refer type', error);
      throw new InternalServerErrorException('Failed to create refer type');
    }
  }

  async updateReferType(
    id: number,
    body: IUpdateReferTypeBody,
  ): Promise<IReferTypeMasterData> {
    const referCode = this.normalizeRequiredText(body.refer_code, 'refer_code');
    const referNameTh = this.normalizeRequiredText(
      body.refer_name_th,
      'refer_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM refer_types
         WHERE refer_type_id = @refer_type_id
           AND is_active = 1`,
        { refer_type_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Refer type not found');
      }

      await this.ensureUniqueReferCode(referCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE refer_types
            SET refer_code = @refer_code,
                refer_name_th = @refer_name_th,
                refer_name_en = @refer_name_en,
                sort_order = @sort_order
            WHERE refer_type_id = @refer_type_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          refer_type_id: id,
          refer_code: referCode,
          refer_name_th: referNameTh,
          refer_name_en: this.normalizeOptionalText(body.refer_name_en),
          sort_order: sortOrder,
        },
      );

      const rows = await this.db.query<IReferTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            refer_type_id, refer_code, refer_name_th, refer_name_en, sort_order, is_active
         FROM refer_types
         WHERE refer_type_id = @refer_type_id`,
        { refer_type_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update refer type ${id}`, error);
      throw new InternalServerErrorException('Failed to update refer type');
    }
  }

  async deleteReferType(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE refer_types
         SET is_active = 0
         WHERE refer_type_id = @refer_type_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { refer_type_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Refer type not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete refer type ${id}`, error);
      throw new InternalServerErrorException('Failed to delete refer type');
    }
  }

  // ─── Disease Groups / Disease Types ─────────────────────────────────────────
  private normalizeCode(value: string | undefined, fieldName: string): string {
    const code = this.normalizeRequiredText(value, fieldName);
    if (code.length > 20) {
      throw new BadRequestException(
        `${fieldName} must be 20 characters or less`,
      );
    }
    return code;
  }

  async getDiseaseGroups(
    search?: string,
    includeInactive = false,
  ): Promise<IDiseaseGroupMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<IDiseaseGroupMasterData>(
        this.DATABASE_NAME,
        `SELECT
            group_id, group_code, group_name_th, group_name_en,
            sort_order, is_active, created_at, updated_at
         FROM disease_groups
         WHERE (@include_inactive = 1 OR is_active = 1)
           AND (
             @search IS NULL
             OR group_code LIKE '%' + @search + '%'
             OR group_name_th LIKE '%' + @search + '%'
             OR group_name_en LIKE '%' + @search + '%'
           )
         ORDER BY sort_order ASC, group_code ASC, group_id ASC`,
        {
          search: keyword,
          include_inactive: includeInactive ? 1 : 0,
        },
      );
    } catch (error: any) {
      this.logger.error('Failed to get disease groups', error);
      throw new InternalServerErrorException('Failed to get disease groups');
    }
  }

  async getDiseaseGroupOptions(): Promise<IDiseaseGroupLookup[]> {
    try {
      return await this.db.query<IDiseaseGroupLookup>(
        this.DATABASE_NAME,
        `SELECT
            group_id, group_code, group_name_th, group_name_en, sort_order
         FROM disease_groups
         WHERE is_active = 1
         ORDER BY sort_order ASC, group_code ASC, group_id ASC`,
      );
    } catch (error: any) {
      this.logger.error('Failed to get disease group options', error);
      throw new InternalServerErrorException(
        'Failed to get disease group options',
      );
    }
  }

  private async ensureUniqueDiseaseGroupCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM disease_groups
       WHERE UPPER(LTRIM(RTRIM(group_code))) = UPPER(@group_code)
         AND (@exclude_id IS NULL OR group_id <> @exclude_id)`,
      { group_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Disease group code already exists');
    }
  }

  async createDiseaseGroup(
    body: ICreateDiseaseGroupBody,
  ): Promise<IDiseaseGroupMasterData> {
    const groupCode = this.normalizeCode(body.group_code, 'group_code');
    const groupNameTh = this.normalizeRequiredText(
      body.group_name_th,
      'group_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      await this.ensureUniqueDiseaseGroupCode(groupCode);
      const insertRows = await this.db.query<{ group_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO disease_groups (
              group_code, group_name_th, group_name_en, sort_order, is_active, created_at, updated_at
            ) VALUES (
              @group_code, @group_name_th, @group_name_en, @sort_order, 1, GETDATE(), NULL
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS group_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          group_code: groupCode,
          group_name_th: groupNameTh,
          group_name_en: this.normalizeOptionalText(body.group_name_en),
          sort_order: sortOrder,
        },
      );

      const groupId = insertRows[0]?.group_id;
      const rows = await this.db.query<IDiseaseGroupMasterData>(
        this.DATABASE_NAME,
        `SELECT
            group_id, group_code, group_name_th, group_name_en,
            sort_order, is_active, created_at, updated_at
         FROM disease_groups
         WHERE group_id = @group_id`,
        { group_id: groupId },
      );

      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create disease group', error);
      throw new InternalServerErrorException('Failed to create disease group');
    }
  }

  async updateDiseaseGroup(
    id: number,
    body: IUpdateDiseaseGroupBody,
  ): Promise<IDiseaseGroupMasterData> {
    const groupCode = this.normalizeCode(body.group_code, 'group_code');
    const groupNameTh = this.normalizeRequiredText(
      body.group_name_th,
      'group_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM disease_groups
         WHERE group_id = @group_id
           AND is_active = 1`,
        { group_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Disease group not found');
      }

      await this.ensureUniqueDiseaseGroupCode(groupCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE disease_groups
            SET group_code = @group_code,
                group_name_th = @group_name_th,
                group_name_en = @group_name_en,
                sort_order = @sort_order,
                updated_at = GETDATE()
            WHERE group_id = @group_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          group_id: id,
          group_code: groupCode,
          group_name_th: groupNameTh,
          group_name_en: this.normalizeOptionalText(body.group_name_en),
          sort_order: sortOrder,
        },
      );

      const rows = await this.db.query<IDiseaseGroupMasterData>(
        this.DATABASE_NAME,
        `SELECT
            group_id, group_code, group_name_th, group_name_en,
            sort_order, is_active, created_at, updated_at
         FROM disease_groups
         WHERE group_id = @group_id`,
        { group_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update disease group ${id}`, error);
      throw new InternalServerErrorException('Failed to update disease group');
    }
  }

  async deleteDiseaseGroup(id: number): Promise<{ deleted: boolean }> {
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM disease_groups
         WHERE group_id = @group_id
           AND is_active = 1`,
        { group_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Disease group not found');
      }

      const activeChildren = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM disease_sub_groups
         WHERE group_id = @group_id
           AND is_active = 1`,
        { group_id: id },
      );
      if ((activeChildren[0]?.cnt ?? 0) > 0) {
        throw new BadRequestException(
          'This group has active disease types. Please deactivate them first.',
        );
      }

      await this.db.query(
        this.DATABASE_NAME,
        `UPDATE disease_groups
         SET is_active = 0,
             updated_at = GETDATE()
         WHERE group_id = @group_id
           AND is_active = 1`,
        { group_id: id },
      );

      return { deleted: true };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to delete disease group ${id}`, error);
      throw new InternalServerErrorException('Failed to delete disease group');
    }
  }

  async getDiseaseTypes(
    groupId?: number,
    search?: string,
    includeInactive = false,
  ): Promise<IDiseaseTypeMasterData[]> {
    const keyword = search?.trim() || null;
    const normalizedGroupId = Number(groupId);
    if (
      groupId !== undefined &&
      (!Number.isInteger(normalizedGroupId) || normalizedGroupId <= 0)
    ) {
      throw new BadRequestException('group_id must be a positive integer');
    }
    try {
      return await this.db.query<IDiseaseTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            ds.sub_group_id, ds.group_id,
            dg.group_code, dg.group_name_th, dg.group_name_en,
            ds.sub_group_code, ds.sub_group_name_th, ds.sub_group_name_en,
            ds.sort_order, ds.is_active, ds.created_at, ds.updated_at
         FROM disease_sub_groups ds
         LEFT JOIN disease_groups dg ON dg.group_id = ds.group_id
         WHERE (@include_inactive = 1 OR ds.is_active = 1)
           AND (@group_id IS NULL OR ds.group_id = @group_id)
           AND (
             @search IS NULL
             OR ds.sub_group_code LIKE '%' + @search + '%'
             OR ds.sub_group_name_th LIKE '%' + @search + '%'
             OR ds.sub_group_name_en LIKE '%' + @search + '%'
             OR dg.group_code LIKE '%' + @search + '%'
             OR dg.group_name_th LIKE '%' + @search + '%'
             OR dg.group_name_en LIKE '%' + @search + '%'
           )
         ORDER BY
           dg.sort_order ASC, dg.group_code ASC, dg.group_id ASC,
           ds.sort_order ASC, ds.sub_group_code ASC, ds.sub_group_id ASC`,
        {
          group_id: groupId ?? null,
          search: keyword,
          include_inactive: includeInactive ? 1 : 0,
        },
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to get disease types', error);
      throw new InternalServerErrorException('Failed to get disease types');
    }
  }

  private async ensureDiseaseGroupActive(groupId: number): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM disease_groups
       WHERE group_id = @group_id
         AND is_active = 1`,
      { group_id: groupId },
    );
    if ((rows[0]?.cnt ?? 0) === 0) {
      throw new BadRequestException('Invalid or inactive disease group');
    }
  }

  private async ensureUniqueDiseaseTypeCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM disease_sub_groups
       WHERE UPPER(LTRIM(RTRIM(sub_group_code))) = UPPER(@sub_group_code)
         AND (@exclude_id IS NULL OR sub_group_id <> @exclude_id)`,
      { sub_group_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Disease type code already exists');
    }
  }

  async createDiseaseType(
    body: ICreateDiseaseTypeBody,
  ): Promise<IDiseaseTypeMasterData> {
    const groupId = Number(body.group_id);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      throw new BadRequestException('group_id is required');
    }
    const subGroupCode = this.normalizeCode(
      body.sub_group_code,
      'sub_group_code',
    );
    const subGroupNameTh = this.normalizeRequiredText(
      body.sub_group_name_th,
      'sub_group_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      await this.ensureDiseaseGroupActive(groupId);
      await this.ensureUniqueDiseaseTypeCode(subGroupCode);

      const insertRows = await this.db.query<{ sub_group_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO disease_sub_groups (
              group_id, sub_group_code, sub_group_name_th, sub_group_name_en,
              sort_order, is_active, created_at, updated_at
            ) VALUES (
              @group_id, @sub_group_code, @sub_group_name_th, @sub_group_name_en,
              @sort_order, 1, GETDATE(), NULL
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS sub_group_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          group_id: groupId,
          sub_group_code: subGroupCode,
          sub_group_name_th: subGroupNameTh,
          sub_group_name_en: this.normalizeOptionalText(body.sub_group_name_en),
          sort_order: sortOrder,
        },
      );

      const subGroupId = insertRows[0]?.sub_group_id;
      const rows = await this.db.query<IDiseaseTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            ds.sub_group_id, ds.group_id,
            dg.group_code, dg.group_name_th, dg.group_name_en,
            ds.sub_group_code, ds.sub_group_name_th, ds.sub_group_name_en,
            ds.sort_order, ds.is_active, ds.created_at, ds.updated_at
         FROM disease_sub_groups ds
         LEFT JOIN disease_groups dg ON dg.group_id = ds.group_id
         WHERE ds.sub_group_id = @sub_group_id`,
        { sub_group_id: subGroupId },
      );

      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create disease type', error);
      throw new InternalServerErrorException('Failed to create disease type');
    }
  }

  async updateDiseaseType(
    id: number,
    body: IUpdateDiseaseTypeBody,
  ): Promise<IDiseaseTypeMasterData> {
    const groupId = Number(body.group_id);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      throw new BadRequestException('group_id is required');
    }
    const subGroupCode = this.normalizeCode(
      body.sub_group_code,
      'sub_group_code',
    );
    const subGroupNameTh = this.normalizeRequiredText(
      body.sub_group_name_th,
      'sub_group_name_th',
    );
    const sortOrder = this.normalizeSortOrder(body.sort_order);
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM disease_sub_groups
         WHERE sub_group_id = @sub_group_id
           AND is_active = 1`,
        { sub_group_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Disease type not found');
      }

      await this.ensureDiseaseGroupActive(groupId);
      await this.ensureUniqueDiseaseTypeCode(subGroupCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE disease_sub_groups
            SET group_id = @group_id,
                sub_group_code = @sub_group_code,
                sub_group_name_th = @sub_group_name_th,
                sub_group_name_en = @sub_group_name_en,
                sort_order = @sort_order,
                updated_at = GETDATE()
            WHERE sub_group_id = @sub_group_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          sub_group_id: id,
          group_id: groupId,
          sub_group_code: subGroupCode,
          sub_group_name_th: subGroupNameTh,
          sub_group_name_en: this.normalizeOptionalText(body.sub_group_name_en),
          sort_order: sortOrder,
        },
      );

      const rows = await this.db.query<IDiseaseTypeMasterData>(
        this.DATABASE_NAME,
        `SELECT
            ds.sub_group_id, ds.group_id,
            dg.group_code, dg.group_name_th, dg.group_name_en,
            ds.sub_group_code, ds.sub_group_name_th, ds.sub_group_name_en,
            ds.sort_order, ds.is_active, ds.created_at, ds.updated_at
         FROM disease_sub_groups ds
         LEFT JOIN disease_groups dg ON dg.group_id = ds.group_id
         WHERE ds.sub_group_id = @sub_group_id`,
        { sub_group_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update disease type ${id}`, error);
      throw new InternalServerErrorException('Failed to update disease type');
    }
  }

  async deleteDiseaseType(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE disease_sub_groups
         SET is_active = 0,
             updated_at = GETDATE()
         WHERE sub_group_id = @sub_group_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { sub_group_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Disease type not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete disease type ${id}`, error);
      throw new InternalServerErrorException('Failed to delete disease type');
    }
  }

  // ─── Hospitals ───────────────────────────────────────────────────────────────
  async getHospitals(search?: string): Promise<IHospitalMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<IHospitalMasterData>(
        this.DATABASE_NAME,
        `SELECT
            hospital_id, hospital_code, hospital_name_th, hospital_name_en, hospital_type, address, phone, is_active, created_at
         FROM hospitals
         WHERE is_active = 1
           AND (
             @search IS NULL
             OR hospital_code LIKE '%' + @search + '%'
             OR hospital_name_th LIKE '%' + @search + '%'
             OR hospital_name_en LIKE '%' + @search + '%'
             OR hospital_type LIKE '%' + @search + '%'
           )
         ORDER BY hospital_code ASC, hospital_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get hospitals', error);
      throw new InternalServerErrorException('Failed to get hospitals');
    }
  }

  private async ensureUniqueHospitalCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM hospitals
       WHERE UPPER(LTRIM(RTRIM(hospital_code))) = UPPER(@hospital_code)
         AND (@exclude_id IS NULL OR hospital_id <> @exclude_id)`,
      { hospital_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Hospital code already exists');
    }
  }

  async getHospitalTypes(): Promise<IHospitalTypeLookup[]> {
    try {
      return await this.db.query<IHospitalTypeLookup>(
        this.DATABASE_NAME,
        `SELECT
            hospital_type, type_name_th, type_name_en
         FROM hospital_type
         WHERE is_active = 1
         ORDER BY
           COALESCE(NULLIF(LTRIM(RTRIM(type_name_en)), ''), type_name_th) ASC,
           type_name_th ASC`,
      );
    } catch (error: any) {
      this.logger.error('Failed to get hospital types', error);
      throw new InternalServerErrorException('Failed to get hospital types');
    }
  }

  private async normalizeHospitalTypeNameTh(
    value?: string,
  ): Promise<string | null> {
    const typeNameTh = this.normalizeOptionalText(value);
    if (!typeNameTh) return null;

    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM hospital_type
       WHERE is_active = 1
         AND type_name_th = @type_name_th`,
      { type_name_th: typeNameTh },
    );

    if ((rows[0]?.cnt ?? 0) === 0) {
      throw new BadRequestException('Invalid hospital type');
    }

    return typeNameTh;
  }

  async createHospital(
    body: ICreateHospitalBody,
  ): Promise<IHospitalMasterData> {
    const hospitalNameTh = this.normalizeRequiredText(
      body.hospital_name_th,
      'hospital_name_th',
    );
    const hospitalType = await this.normalizeHospitalTypeNameTh(
      body.hospital_type,
    );
    try {
      const insertRows = await this.db.query<{ hospital_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            
            -- Auto-generate hospital_code
            DECLARE @next_no INT;
            DECLARE @generated_code NVARCHAR(20);
            
            SELECT @next_no = COUNT(1) + 1 FROM hospitals;
            SET @generated_code = 'H' + RIGHT('0000' + CAST(@next_no AS NVARCHAR(10)), 4);

            INSERT INTO hospitals (
              hospital_code, hospital_name_th, hospital_name_en, hospital_type, address, phone, is_active, created_at
            ) VALUES (
              @generated_code, @hospital_name_th, @hospital_name_en, @hospital_type, @address, @phone, 1, GETDATE()
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS hospital_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          hospital_name_th: hospitalNameTh,
          hospital_name_en: this.normalizeOptionalText(body.hospital_name_en),
          hospital_type: hospitalType,
          address: this.normalizeOptionalText(body.address),
          phone: this.normalizeOptionalText(body.phone),
        },
      );

      const hospitalId = insertRows[0]?.hospital_id;
      const rows = await this.db.query<IHospitalMasterData>(
        this.DATABASE_NAME,
        `SELECT
            hospital_id, hospital_code, hospital_name_th, hospital_name_en, hospital_type, address, phone, is_active, created_at
         FROM hospitals
         WHERE hospital_id = @hospital_id`,
        { hospital_id: hospitalId },
      );

      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create hospital', error);
      throw new InternalServerErrorException('Failed to create hospital');
    }
  }

  async updateHospital(
    id: number,
    body: IUpdateHospitalBody,
  ): Promise<IHospitalMasterData> {
    const hospitalCode = this.normalizeRequiredText(
      body.hospital_code,
      'hospital_code',
    );
    const hospitalNameTh = this.normalizeRequiredText(
      body.hospital_name_th,
      'hospital_name_th',
    );
    const hospitalType = await this.normalizeHospitalTypeNameTh(
      body.hospital_type,
    );
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM hospitals
         WHERE hospital_id = @hospital_id
           AND is_active = 1`,
        { hospital_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Hospital not found');
      }

      await this.ensureUniqueHospitalCode(hospitalCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE hospitals
            SET hospital_code = @hospital_code,
                hospital_name_th = @hospital_name_th,
                hospital_name_en = @hospital_name_en,
                hospital_type = @hospital_type,
                address = @address,
                phone = @phone
            WHERE hospital_id = @hospital_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          hospital_id: id,
          hospital_code: hospitalCode,
          hospital_name_th: hospitalNameTh,
          hospital_name_en: this.normalizeOptionalText(body.hospital_name_en),
          hospital_type: hospitalType,
          address: this.normalizeOptionalText(body.address),
          phone: this.normalizeOptionalText(body.phone),
        },
      );

      const rows = await this.db.query<IHospitalMasterData>(
        this.DATABASE_NAME,
        `SELECT
            hospital_id, hospital_code, hospital_name_th, hospital_name_en, hospital_type, address, phone, is_active, created_at
         FROM hospitals
         WHERE hospital_id = @hospital_id`,
        { hospital_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update hospital ${id}`, error);
      throw new InternalServerErrorException('Failed to update hospital');
    }
  }

  async deleteHospital(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE hospitals
         SET is_active = 0
         WHERE hospital_id = @hospital_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { hospital_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Hospital not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete hospital ${id}`, error);
      throw new InternalServerErrorException('Failed to delete hospital');
    }
  }

  // ─── Units ───────────────────────────────────────────────────────────────────
  async getUnits(search?: string): Promise<IUnitMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<IUnitMasterData>(
        this.DATABASE_NAME,
        `SELECT
            unit_id, unit_code, unit_name_th, unit_name_en, is_active, created_at
         FROM units
         WHERE is_active = 1
           AND (
             @search IS NULL
             OR unit_code LIKE '%' + @search + '%'
             OR unit_name_th LIKE '%' + @search + '%'
             OR unit_name_en LIKE '%' + @search + '%'
           )
         ORDER BY unit_code ASC, unit_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get units', error);
      throw new InternalServerErrorException('Failed to get units');
    }
  }

  private async ensureUniqueUnitCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM units
       WHERE UPPER(LTRIM(RTRIM(unit_code))) = UPPER(@unit_code)
         AND (@exclude_id IS NULL OR unit_id <> @exclude_id)`,
      { unit_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Unit code already exists');
    }
  }

  async createUnit(body: ICreateUnitBody): Promise<IUnitMasterData> {
    const unitCode = this.normalizeRequiredText(body.unit_code, 'unit_code');
    try {
      await this.ensureUniqueUnitCode(unitCode);
      const insertRows = await this.db.query<{ unit_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            INSERT INTO units (
              unit_code, unit_name_th, unit_name_en, is_active, created_at
            ) VALUES (
              @unit_code, @unit_name_th, @unit_name_en, 1, GETDATE()
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS unit_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          unit_code: unitCode,
          unit_name_th: this.normalizeOptionalText(body.unit_name_th),
          unit_name_en: this.normalizeOptionalText(body.unit_name_en),
        },
      );

      const unitId = insertRows[0]?.unit_id;
      const rows = await this.db.query<IUnitMasterData>(
        this.DATABASE_NAME,
        `SELECT
            unit_id, unit_code, unit_name_th, unit_name_en, is_active, created_at
         FROM units
         WHERE unit_id = @unit_id`,
        { unit_id: unitId },
      );

      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create unit', error);
      throw new InternalServerErrorException('Failed to create unit');
    }
  }

  async updateUnit(
    id: number,
    body: IUpdateUnitBody,
  ): Promise<IUnitMasterData> {
    const unitCode = this.normalizeRequiredText(body.unit_code, 'unit_code');
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM units
         WHERE unit_id = @unit_id
           AND is_active = 1`,
        { unit_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Unit not found');
      }

      await this.ensureUniqueUnitCode(unitCode, id);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE units
            SET unit_code = @unit_code,
                unit_name_th = @unit_name_th,
                unit_name_en = @unit_name_en
            WHERE unit_id = @unit_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          unit_id: id,
          unit_code: unitCode,
          unit_name_th: this.normalizeOptionalText(body.unit_name_th),
          unit_name_en: this.normalizeOptionalText(body.unit_name_en),
        },
      );

      const rows = await this.db.query<IUnitMasterData>(
        this.DATABASE_NAME,
        `SELECT
            unit_id, unit_code, unit_name_th, unit_name_en, is_active, created_at
         FROM units
         WHERE unit_id = @unit_id`,
        { unit_id: id },
      );

      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update unit ${id}`, error);
      throw new InternalServerErrorException('Failed to update unit');
    }
  }

  async deleteUnit(id: number): Promise<{ deleted: boolean }> {
    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM units
         WHERE unit_id = @unit_id
           AND is_active = 1`,
        { unit_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Unit not found');
      }

      const used = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM items
         WHERE usage_unit_id = @unit_id
           AND is_active = 1`,
        { unit_id: id },
      );
      if ((used[0]?.cnt ?? 0) > 0) {
        throw new BadRequestException(
          'Cannot disable this unit because it is currently used by active items',
        );
      }

      await this.db.query(
        this.DATABASE_NAME,
        `UPDATE units
         SET is_active = 0
         WHERE unit_id = @unit_id
           AND is_active = 1`,
        { unit_id: id },
      );

      return { deleted: true };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to delete unit ${id}`, error);
      throw new InternalServerErrorException('Failed to delete unit');
    }
  }

  // ─── Item types lookup ───────────────────────────────────────────────────────
  async getItemTypes(): Promise<IItemTypeLookup[]> {
    try {
      return await this.db.query<IItemTypeLookup>(
        this.DATABASE_NAME,
        `SELECT item_type_id, item_type_name
         FROM item_type
         WHERE is_active = 1
         ORDER BY item_type_name ASC, item_type_id ASC`,
      );
    } catch (error: any) {
      this.logger.error('Failed to get item types', error);
      throw new InternalServerErrorException('Failed to get item types');
    }
  }

  // ─── Items ───────────────────────────────────────────────────────────────────
  async getItems(search?: string): Promise<IItemMasterData[]> {
    const keyword = search?.trim() || null;
    try {
      return await this.db.query<IItemMasterData>(
        this.DATABASE_NAME,
        `SELECT
            i.item_id, i.item_code, i.item_name_th, i.item_name_en,
            i.item_type_id, it.item_type_name,
            i.usage_unit_id, u.unit_name_th AS usage_unit_name_th, u.unit_name_en AS usage_unit_name_en,
            i.item_min, i.item_max, i.is_active, i.created_at, i.update_at
         FROM items i
         LEFT JOIN item_type it ON it.item_type_id = i.item_type_id
         LEFT JOIN units u ON u.unit_id = i.usage_unit_id
         WHERE i.is_active = 1
           AND (
             @search IS NULL
             OR i.item_code LIKE '%' + @search + '%'
             OR i.item_name_th LIKE '%' + @search + '%'
             OR i.item_name_en LIKE '%' + @search + '%'
           )
         ORDER BY i.item_code ASC, i.item_id ASC`,
        { search: keyword },
      );
    } catch (error: any) {
      this.logger.error('Failed to get items', error);
      throw new InternalServerErrorException('Failed to get items');
    }
  }

  private async ensureUniqueItemCode(
    code: string,
    excludeId?: number,
  ): Promise<void> {
    const rows = await this.db.query<{ cnt: number }>(
      this.DATABASE_NAME,
      `SELECT COUNT(1) AS cnt
       FROM items
       WHERE UPPER(LTRIM(RTRIM(item_code))) = UPPER(@item_code)
         AND (@exclude_id IS NULL OR item_id <> @exclude_id)`,
      { item_code: code, exclude_id: excludeId ?? null },
    );
    if ((rows[0]?.cnt ?? 0) > 0) {
      throw new BadRequestException('Item code already exists');
    }
  }

  private async validateItemForeignKeys(
    itemTypeId: number,
    usageUnitId: number,
  ): Promise<void> {
    const [itemType, unit] = await Promise.all([
      this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM item_type
         WHERE item_type_id = @item_type_id
           AND is_active = 1`,
        { item_type_id: itemTypeId },
      ),
      this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM units
         WHERE unit_id = @unit_id
           AND is_active = 1`,
        { unit_id: usageUnitId },
      ),
    ]);

    if ((itemType[0]?.cnt ?? 0) === 0) {
      throw new BadRequestException('Invalid or inactive item type');
    }
    if ((unit[0]?.cnt ?? 0) === 0) {
      throw new BadRequestException('Invalid or inactive usage unit');
    }
  }

  async createItem(
    body: ICreateItemBody,
    currentUser: string,
  ): Promise<IItemMasterData> {
    const itemNameTh = this.normalizeRequiredText(
      body.item_name_th,
      'item_name_th',
    );
    const itemNameEn = this.normalizeRequiredText(
      body.item_name_en,
      'item_name_en',
    );
    const itemTypeId = Number(body.item_type_id);
    const usageUnitId = Number(body.usage_unit_id);
    const itemMin = this.normalizeOptionalInteger(
      body.item_min ?? null,
      'item_min',
    );
    const itemMax = this.normalizeOptionalInteger(
      body.item_max ?? null,
      'item_max',
    );
    this.validateItemMinMax(itemMin, itemMax);

    if (!Number.isInteger(itemTypeId) || itemTypeId <= 0) {
      throw new BadRequestException('item_type_id is required');
    }
    if (!Number.isInteger(usageUnitId) || usageUnitId <= 0) {
      throw new BadRequestException('usage_unit_id is required');
    }

    try {
      await this.validateItemForeignKeys(itemTypeId, usageUnitId);

      const insertRows = await this.db.query<{ item_id: number }>(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            
            -- Auto-generate item_code based on type
            DECLARE @prefix NVARCHAR(2);
            DECLARE @next_no INT;
            DECLARE @generated_code NVARCHAR(20);
            
            SET @prefix = CASE WHEN @item_type_id = 2 THEN 'MD' ELSE 'DR' END;
            SELECT @next_no = COUNT(1) + 1 FROM items WHERE item_type_id = @item_type_id;
            SET @generated_code = @prefix + RIGHT('0000' + CAST(@next_no AS NVARCHAR(10)), 4);

            INSERT INTO items (
              item_code, item_name_en, usage_unit_id, is_active, created_at, item_name_th, item_min, item_max, update_at, item_type_id
            ) VALUES (
              @generated_code, @item_name_en, @usage_unit_id, 1, GETDATE(), @item_name_th, @item_min, @item_max, GETDATE(), @item_type_id
            );
            SELECT CAST(SCOPE_IDENTITY() AS int) AS item_id;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          item_name_en: itemNameEn,
          usage_unit_id: usageUnitId,
          item_name_th: itemNameTh,
          item_min: itemMin,
          item_max: itemMax,
          item_type_id: itemTypeId,
          update_by: currentUser,
        },
      );

      const itemId = insertRows[0]?.item_id;
      const rows = await this.db.query<IItemMasterData>(
        this.DATABASE_NAME,
        `SELECT
            i.item_id, i.item_code, i.item_name_th, i.item_name_en,
            i.item_type_id, it.item_type_name,
            i.usage_unit_id, u.unit_name_th AS usage_unit_name_th, u.unit_name_en AS usage_unit_name_en,
            i.item_min, i.item_max, i.is_active, i.created_at, i.update_at
         FROM items i
         LEFT JOIN item_type it ON it.item_type_id = i.item_type_id
         LEFT JOIN units u ON u.unit_id = i.usage_unit_id
         WHERE i.item_id = @item_id`,
        { item_id: itemId },
      );
      return rows[0];
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to create item', error);
      throw new InternalServerErrorException('Failed to create item');
    }
  }

  async updateItem(
    id: number,
    body: IUpdateItemBody,
    currentUser: string,
  ): Promise<IItemMasterData> {
    const itemCode = this.normalizeRequiredText(body.item_code, 'item_code');
    const itemNameTh = this.normalizeRequiredText(
      body.item_name_th,
      'item_name_th',
    );
    const itemNameEn = this.normalizeRequiredText(
      body.item_name_en,
      'item_name_en',
    );
    const itemTypeId = Number(body.item_type_id);
    const usageUnitId = Number(body.usage_unit_id);
    const itemMin = this.normalizeOptionalInteger(
      body.item_min ?? null,
      'item_min',
    );
    const itemMax = this.normalizeOptionalInteger(
      body.item_max ?? null,
      'item_max',
    );
    this.validateItemMinMax(itemMin, itemMax);

    if (!Number.isInteger(itemTypeId) || itemTypeId <= 0) {
      throw new BadRequestException('item_type_id is required');
    }
    if (!Number.isInteger(usageUnitId) || usageUnitId <= 0) {
      throw new BadRequestException('usage_unit_id is required');
    }

    try {
      const exists = await this.db.query<{ cnt: number }>(
        this.DATABASE_NAME,
        `SELECT COUNT(1) AS cnt
         FROM items
         WHERE item_id = @item_id
           AND is_active = 1`,
        { item_id: id },
      );
      if ((exists[0]?.cnt ?? 0) === 0) {
        throw new NotFoundException('Item not found');
      }

      await this.ensureUniqueItemCode(itemCode, id);
      await this.validateItemForeignKeys(itemTypeId, usageUnitId);

      await this.db.query(
        this.DATABASE_NAME,
        `BEGIN TRY
            BEGIN TRANSACTION;
            UPDATE items
            SET item_code = @item_code,
                item_name_th = @item_name_th,
                item_name_en = @item_name_en,
                item_type_id = @item_type_id,
                usage_unit_id = @usage_unit_id,
                item_min = @item_min,
                item_max = @item_max,
                update_at = GETDATE()
            WHERE item_id = @item_id
              AND is_active = 1;
            COMMIT TRANSACTION;
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
            THROW;
          END CATCH`,
        {
          item_id: id,
          item_code: itemCode,
          item_name_th: itemNameTh,
          item_name_en: itemNameEn,
          item_type_id: itemTypeId,
          usage_unit_id: usageUnitId,
          item_min: itemMin,
          item_max: itemMax,
          update_by: currentUser,
        },
      );

      const rows = await this.db.query<IItemMasterData>(
        this.DATABASE_NAME,
        `SELECT
            i.item_id, i.item_code, i.item_name_th, i.item_name_en,
            i.item_type_id, it.item_type_name,
            i.usage_unit_id, u.unit_name_th AS usage_unit_name_th, u.unit_name_en AS usage_unit_name_en,
            i.item_min, i.item_max, i.is_active, i.created_at, i.update_at
         FROM items i
         LEFT JOIN item_type it ON it.item_type_id = i.item_type_id
         LEFT JOIN units u ON u.unit_id = i.usage_unit_id
         WHERE i.item_id = @item_id`,
        { item_id: id },
      );
      return rows[0];
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      this.logger.error(`Failed to update item ${id}`, error);
      throw new InternalServerErrorException('Failed to update item');
    }
  }

  async deleteItem(id: number): Promise<{ deleted: boolean }> {
    try {
      const rows = await this.db.query<{ affected: number }>(
        this.DATABASE_NAME,
        `UPDATE items
         SET is_active = 0, update_at = GETDATE()
         WHERE item_id = @item_id
           AND is_active = 1;
         SELECT @@ROWCOUNT AS affected;`,
        { item_id: id },
      );
      if ((rows[0]?.affected ?? 0) === 0) {
        throw new NotFoundException('Item not found');
      }
      return { deleted: true };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete item ${id}`, error);
      throw new InternalServerErrorException('Failed to delete item');
    }
  }
}
