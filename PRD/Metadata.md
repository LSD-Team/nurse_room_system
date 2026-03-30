-- ----------------------------
-- Auto increment value for accident_severity_types
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[accident_severity_types]', RESEED, 4)
GO


-- ----------------------------
-- Uniques structure for table accident_severity_types
-- ----------------------------
ALTER TABLE [dbo].[accident_severity_types] ADD CONSTRAINT [UQ_accident_severity_code] UNIQUE NONCLUSTERED ([severity_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table accident_severity_types
-- ----------------------------
ALTER TABLE [dbo].[accident_severity_types] ADD CONSTRAINT [PK_accident_severity_types] PRIMARY KEY CLUSTERED ([severity_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for approval_roles
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[approval_roles]', RESEED, 3)
GO


-- ----------------------------
-- Uniques structure for table approval_roles
-- ----------------------------
ALTER TABLE [dbo].[approval_roles] ADD CONSTRAINT [UQ__approval__BAE630756EFAC756] UNIQUE NONCLUSTERED ([role_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table approval_roles
-- ----------------------------
ALTER TABLE [dbo].[approval_roles] ADD CONSTRAINT [PK__approval__760965CC929F2F9D] PRIMARY KEY CLUSTERED ([role_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for borrow_approvals
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[borrow_approvals]', RESEED, 15)
GO


-- ----------------------------
-- Primary Key structure for table borrow_approvals
-- ----------------------------
ALTER TABLE [dbo].[borrow_approvals] ADD CONSTRAINT [PK__borrow_a__C94AE61A6ACA99CC] PRIMARY KEY CLUSTERED ([approval_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for borrow_headers
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[borrow_headers]', RESEED, 4)
GO


-- ----------------------------
-- Uniques structure for table borrow_headers
-- ----------------------------
ALTER TABLE [dbo].[borrow_headers] ADD CONSTRAINT [UQ__borrow_h__262B3EF3BD57B0D4] UNIQUE NONCLUSTERED ([borrow_no] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table borrow_headers
-- ----------------------------
ALTER TABLE [dbo].[borrow_headers] ADD CONSTRAINT [PK__borrow_h__262B57A082313639] PRIMARY KEY CLUSTERED ([borrow_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for borrow_lines
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[borrow_lines]', RESEED, 16)
GO


-- ----------------------------
-- Primary Key structure for table borrow_lines
-- ----------------------------
ALTER TABLE [dbo].[borrow_lines] ADD CONSTRAINT [PK__borrow_l__9FFB81A98B79BEC5] PRIMARY KEY CLUSTERED ([borrow_line_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for disease_groups
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[disease_groups]', RESEED, 12)
GO


-- ----------------------------
-- Uniques structure for table disease_groups
-- ----------------------------
ALTER TABLE [dbo].[disease_groups] ADD CONSTRAINT [UQ_disease_groups_code] UNIQUE NONCLUSTERED ([group_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table disease_groups
-- ----------------------------
ALTER TABLE [dbo].[disease_groups] ADD CONSTRAINT [PK_disease_groups] PRIMARY KEY CLUSTERED ([group_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for disease_sub_groups
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[disease_sub_groups]', RESEED, 50)
GO


-- ----------------------------
-- Uniques structure for table disease_sub_groups
-- ----------------------------
ALTER TABLE [dbo].[disease_sub_groups] ADD CONSTRAINT [UQ_disease_sub_groups_code] UNIQUE NONCLUSTERED ([sub_group_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table disease_sub_groups
-- ----------------------------
ALTER TABLE [dbo].[disease_sub_groups] ADD CONSTRAINT [PK_disease_sub_groups] PRIMARY KEY CLUSTERED ([sub_group_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for external_people
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[external_people]', RESEED, 3)
GO


-- ----------------------------
-- Primary Key structure for table external_people
-- ----------------------------
ALTER TABLE [dbo].[external_people] ADD CONSTRAINT [PK_external_people] PRIMARY KEY CLUSTERED ([external_person_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for gr_headers
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[gr_headers]', RESEED, 8)
GO


-- ----------------------------
-- Uniques structure for table gr_headers
-- ----------------------------
ALTER TABLE [dbo].[gr_headers] ADD CONSTRAINT [UQ__gr_heade__2BC09334F7C307A1] UNIQUE NONCLUSTERED ([gr_no] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table gr_headers
-- ----------------------------
ALTER TABLE [dbo].[gr_headers] ADD CONSTRAINT [PK__gr_heade__2BC0F88EFF0D8DAD] PRIMARY KEY CLUSTERED ([gr_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for gr_lines
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[gr_lines]', RESEED, 99)
GO


-- ----------------------------
-- Primary Key structure for table gr_lines
-- ----------------------------
ALTER TABLE [dbo].[gr_lines] ADD CONSTRAINT [PK__gr_lines__26EAEDCCF8453C4D] PRIMARY KEY CLUSTERED ([gr_line_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for hospitals
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[hospitals]', RESEED, 21)
GO


-- ----------------------------
-- Uniques structure for table hospitals
-- ----------------------------
ALTER TABLE [dbo].[hospitals] ADD CONSTRAINT [UQ_hospitals_code] UNIQUE NONCLUSTERED ([hospital_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table hospitals
-- ----------------------------
ALTER TABLE [dbo].[hospitals] ADD CONSTRAINT [PK_hospitals] PRIMARY KEY CLUSTERED ([hospital_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for inventory_period_closings
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[inventory_period_closings]', RESEED, 1)
GO


-- ----------------------------
-- Uniques structure for table inventory_period_closings
-- ----------------------------
ALTER TABLE [dbo].[inventory_period_closings] ADD CONSTRAINT [UQ_inventory_period_closings_month_year] UNIQUE NONCLUSTERED ([month] ASC, [year] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Checks structure for table inventory_period_closings
-- ----------------------------
ALTER TABLE [dbo].[inventory_period_closings] ADD CONSTRAINT [CK_inventory_period_closings_month] CHECK ([month]>=(1) AND [month]<=(12))
GO

ALTER TABLE [dbo].[inventory_period_closings] ADD CONSTRAINT [CK_inventory_period_closings_year] CHECK ([year]>=(2000) AND [year]<=(2100))
GO


-- ----------------------------
-- Primary Key structure for table inventory_period_closings
-- ----------------------------
ALTER TABLE [dbo].[inventory_period_closings] ADD CONSTRAINT [PK_inventory_period_closings] PRIMARY KEY CLUSTERED ([period_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for item_type
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[item_type]', RESEED, 2)
GO


-- ----------------------------
-- Triggers structure for table item_type
-- ----------------------------
CREATE TRIGGER [dbo].[trg_item_type_set_updateat]
ON [dbo].[item_type]
WITH EXECUTE AS CALLER
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- อัพเดตเฉพาะแถวที่มีการเปลี่ยนจริง (ใช้ PK เป็น item_type_id)
    UPDATE t
    SET update_at = GETDATE()
    FROM dbo.item_type t
    INNER JOIN inserted i ON t.item_type_id = i.item_type_id;
END;
GO


-- ----------------------------
-- Primary Key structure for table item_type
-- ----------------------------
ALTER TABLE [dbo].[item_type] ADD CONSTRAINT [PK__item_typ__470682ABB6C99B08] PRIMARY KEY CLUSTERED ([item_type_id] DESC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for item_unit_conversions
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[item_unit_conversions]', RESEED, 2)
GO


-- ----------------------------
-- Indexes structure for table item_unit_conversions
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_item_unit_conversions_item_supplier]
ON [dbo].[item_unit_conversions] (
  [item_id] ASC,
  [supplier_id] ASC
)
GO


-- ----------------------------
-- Uniques structure for table item_unit_conversions
-- ----------------------------
ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [UQ_item_unit_conversions_key] UNIQUE NONCLUSTERED ([item_id] ASC, [supplier_id] ASC, [from_unit_id] ASC, [to_unit_id] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Checks structure for table item_unit_conversions
-- ----------------------------
ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [CK_item_unit_conversions_factor_positive] CHECK ([conversion_factor]>(0))
GO


-- ----------------------------
-- Primary Key structure for table item_unit_conversions
-- ----------------------------
ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [PK_item_unit_conversions] PRIMARY KEY CLUSTERED ([conversion_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for items
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[items]', RESEED, 56)
GO


-- ----------------------------
-- Uniques structure for table items
-- ----------------------------
ALTER TABLE [dbo].[items] ADD CONSTRAINT [UQ_items_item_code] UNIQUE NONCLUSTERED ([item_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table items
-- ----------------------------
ALTER TABLE [dbo].[items] ADD CONSTRAINT [PK_items] PRIMARY KEY CLUSTERED ([item_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table movement_types
-- ----------------------------
ALTER TABLE [dbo].[movement_types] ADD CONSTRAINT [PK__movement__522EA57AF48C2A84] PRIMARY KEY CLUSTERED ([movement_type_code])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for patient_allergies
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[patient_allergies]', RESEED, 12)
GO


-- ----------------------------
-- Auto increment value for patient_physical_info
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[patient_physical_info]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table patient_physical_info
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_patient_physical_info_patient]
ON [dbo].[patient_physical_info] (
  [patient_id] ASC,
  [measured_at] DESC
)
GO


-- ----------------------------
-- Primary Key structure for table patient_physical_info
-- ----------------------------
ALTER TABLE [dbo].[patient_physical_info] ADD CONSTRAINT [PK_patient_physical_info] PRIMARY KEY CLUSTERED ([physical_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for patient_profiles
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[patient_profiles]', RESEED, 6)
GO


-- ----------------------------
-- Indexes structure for table patient_profiles
-- ----------------------------
CREATE UNIQUE NONCLUSTERED INDEX [UQ_patient_profiles_employee]
ON [dbo].[patient_profiles] (
  [employee_id] ASC
)
WHERE ([employee_id] IS NOT NULL)
GO

CREATE UNIQUE NONCLUSTERED INDEX [UQ_patient_profiles_external]
ON [dbo].[patient_profiles] (
  [external_person_id] ASC
)
WHERE ([external_person_id] IS NOT NULL)
GO


-- ----------------------------
-- Checks structure for table patient_profiles
-- ----------------------------
ALTER TABLE [dbo].[patient_profiles] ADD CONSTRAINT [CK__patient_profiles__3EA749C6] CHECK ([patient_type]='EMP' AND [employee_id] IS NOT NULL AND [external_person_id] IS NULL OR [patient_type]='EXT' AND [external_person_id] IS NOT NULL AND [employee_id] IS NULL)
GO


-- ----------------------------
-- Primary Key structure for table patient_profiles
-- ----------------------------
ALTER TABLE [dbo].[patient_profiles] ADD CONSTRAINT [PK_patient_profiles] PRIMARY KEY CLUSTERED ([patient_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for patient_social_security
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[patient_social_security]', RESEED, 1)
GO


-- ----------------------------
-- Uniques structure for table patient_social_security
-- ----------------------------
ALTER TABLE [dbo].[patient_social_security] ADD CONSTRAINT [UQ_patient_social_security_patient] UNIQUE NONCLUSTERED ([patient_id] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for patient_underlying_diseases
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[patient_underlying_diseases]', RESEED, 1)
GO


-- ----------------------------
-- Auto increment value for po_approvals
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[po_approvals]', RESEED, 9)
GO


-- ----------------------------
-- Primary Key structure for table po_approvals
-- ----------------------------
ALTER TABLE [dbo].[po_approvals] ADD CONSTRAINT [PK__po_appro__C94AE61A26E4B521] PRIMARY KEY CLUSTERED ([approval_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for po_headers
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[po_headers]', RESEED, 5)
GO


-- ----------------------------
-- Uniques structure for table po_headers
-- ----------------------------
ALTER TABLE [dbo].[po_headers] ADD CONSTRAINT [UQ__po_heade__368B4751F0E4FDFF] UNIQUE NONCLUSTERED ([po_no] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table po_headers
-- ----------------------------
ALTER TABLE [dbo].[po_headers] ADD CONSTRAINT [PK__po_heade__368DA7F0F637213D] PRIMARY KEY CLUSTERED ([po_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for po_lines
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[po_lines]', RESEED, 131)
GO


-- ----------------------------
-- Primary Key structure for table po_lines
-- ----------------------------
ALTER TABLE [dbo].[po_lines] ADD CONSTRAINT [PK__po_lines__331E0922E7E9E6C0] PRIMARY KEY CLUSTERED ([po_line_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for refer_types
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[refer_types]', RESEED, 4)
GO


-- ----------------------------
-- Uniques structure for table refer_types
-- ----------------------------
ALTER TABLE [dbo].[refer_types] ADD CONSTRAINT [UQ_refer_types_code] UNIQUE NONCLUSTERED ([refer_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table refer_types
-- ----------------------------
ALTER TABLE [dbo].[refer_types] ADD CONSTRAINT [PK_refer_types] PRIMARY KEY CLUSTERED ([refer_type_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for stock_adjustment_lines
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[stock_adjustment_lines]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table stock_adjustment_lines
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_stock_adjustment_lines_adjustment_id]
ON [dbo].[stock_adjustment_lines] (
  [adjustment_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_stock_adjustment_lines_item_id]
ON [dbo].[stock_adjustment_lines] (
  [item_id] ASC
)
GO


-- ----------------------------
-- Uniques structure for table stock_adjustment_lines
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustment_lines] ADD CONSTRAINT [UQ_stock_adjustment_lines_doc_item] UNIQUE NONCLUSTERED ([adjustment_id] ASC, [item_id] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table stock_adjustment_lines
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustment_lines] ADD CONSTRAINT [PK_stock_adjustment_lines] PRIMARY KEY CLUSTERED ([line_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for stock_adjustments
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[stock_adjustments]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table stock_adjustments
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_stock_adjustments_month_year]
ON [dbo].[stock_adjustments] (
  [adjustment_year] ASC,
  [adjustment_month] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_stock_adjustments_status]
ON [dbo].[stock_adjustments] (
  [status] ASC
)
GO


-- ----------------------------
-- Checks structure for table stock_adjustments
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustments] ADD CONSTRAINT [CK_stock_adjustments_month] CHECK ([adjustment_month]>=(1) AND [adjustment_month]<=(12))
GO

ALTER TABLE [dbo].[stock_adjustments] ADD CONSTRAINT [CK_stock_adjustments_year] CHECK ([adjustment_year]>=(2000) AND [adjustment_year]<=(2100))
GO


-- ----------------------------
-- Primary Key structure for table stock_adjustments
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustments] ADD CONSTRAINT [PK_stock_adjustments] PRIMARY KEY CLUSTERED ([adjustment_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for stock_movements
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[stock_movements]', RESEED, 219)
GO


-- ----------------------------
-- Indexes structure for table stock_movements
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_stock_movements_item_created_at]
ON [dbo].[stock_movements] (
  [item_id] ASC,
  [created_at] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table stock_movements
-- ----------------------------
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [PK_stock_movements] PRIMARY KEY CLUSTERED ([movement_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Checks structure for table stock_on_hand
-- ----------------------------
ALTER TABLE [dbo].[stock_on_hand] ADD CONSTRAINT [CK_stock_on_hand_qty_base_nonneg] CHECK ([qty_base]>=(0))
GO


-- ----------------------------
-- Primary Key structure for table stock_on_hand
-- ----------------------------
ALTER TABLE [dbo].[stock_on_hand] ADD CONSTRAINT [PK_stock_on_hand] PRIMARY KEY CLUSTERED ([item_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for stock_period_snapshot
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[stock_period_snapshot]', RESEED, 108)
GO


-- ----------------------------
-- Primary Key structure for table stock_periods
-- ----------------------------
ALTER TABLE [dbo].[stock_periods] ADD CONSTRAINT [PK__stock_pe__0445629877E7FA8E] PRIMARY KEY CLUSTERED ([period_code])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for supplier_price_list
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[supplier_price_list]', RESEED, 74)
GO


-- ----------------------------
-- Triggers structure for table supplier_price_list
-- ----------------------------
CREATE TRIGGER [dbo].[trg_supplier_price_list_updated_at]
ON [dbo].[supplier_price_list]
WITH EXECUTE AS CALLER
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(updated_at) RETURN;  -- ป้องกัน loop

    UPDATE spl
    SET updated_at = GETDATE()
    FROM dbo.supplier_price_list spl
    INNER JOIN inserted i ON spl.price_id = i.price_id;
END;
GO


-- ----------------------------
-- Uniques structure for table supplier_price_list
-- ----------------------------
ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [uq_supplier_price] UNIQUE NONCLUSTERED ([supplier_id] ASC, [item_id] ASC, [unit_id] ASC, [effective_date] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Checks structure for table supplier_price_list
-- ----------------------------
ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [CK_supplier_price_list_conversion_factor_positive] CHECK ([conversion_factor]>(0))
GO


-- ----------------------------
-- Primary Key structure for table supplier_price_list
-- ----------------------------
ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [PK__supplier__1681726DFA473AA0] PRIMARY KEY CLUSTERED ([price_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for suppliers
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[suppliers]', RESEED, 2)
GO


-- ----------------------------
-- Uniques structure for table suppliers
-- ----------------------------
ALTER TABLE [dbo].[suppliers] ADD CONSTRAINT [UQ__supplier__A82CE469BD272208] UNIQUE NONCLUSTERED ([supplier_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table suppliers
-- ----------------------------
ALTER TABLE [dbo].[suppliers] ADD CONSTRAINT [PK__supplier__6EE594E8D1B2B218] PRIMARY KEY CLUSTERED ([supplier_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for treatment_types
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[treatment_types]', RESEED, 5)
GO


-- ----------------------------
-- Uniques structure for table treatment_types
-- ----------------------------
ALTER TABLE [dbo].[treatment_types] ADD CONSTRAINT [UQ_treatment_types_code] UNIQUE NONCLUSTERED ([treatment_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table treatment_types
-- ----------------------------
ALTER TABLE [dbo].[treatment_types] ADD CONSTRAINT [PK_treatment_types] PRIMARY KEY CLUSTERED ([treatment_type_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for units
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[units]', RESEED, 20)
GO


-- ----------------------------
-- Uniques structure for table units
-- ----------------------------
ALTER TABLE [dbo].[units] ADD CONSTRAINT [UQ_units_unit_code] UNIQUE NONCLUSTERED ([unit_code] ASC)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Primary Key structure for table units
-- ----------------------------
ALTER TABLE [dbo].[units] ADD CONSTRAINT [PK_units] PRIMARY KEY CLUSTERED ([unit_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for visit_usage_edit_logs
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[visit_usage_edit_logs]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table visit_usage_edit_logs
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_visit_usage_edit_logs_visit_usage_id]
ON [dbo].[visit_usage_edit_logs] (
  [visit_usage_id] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table visit_usage_edit_logs
-- ----------------------------
ALTER TABLE [dbo].[visit_usage_edit_logs] ADD CONSTRAINT [PK_visit_usage_edit_logs] PRIMARY KEY CLUSTERED ([log_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for visit_usages
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[visit_usages]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table visit_usages
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_visit_usages_visit_id]
ON [dbo].[visit_usages] (
  [visit_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_visit_usages_item_id]
ON [dbo].[visit_usages] (
  [item_id] ASC
)
GO


-- ----------------------------
-- Checks structure for table visit_usages
-- ----------------------------
ALTER TABLE [dbo].[visit_usages] ADD CONSTRAINT [CK_visit_usages_qty_base_nonneg] CHECK ([qty_base]>=(0))
GO


-- ----------------------------
-- Primary Key structure for table visit_usages
-- ----------------------------
ALTER TABLE [dbo].[visit_usages] ADD CONSTRAINT [PK_visit_usages] PRIMARY KEY CLUSTERED ([visit_usage_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Auto increment value for visits
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[visits]', RESEED, 1)
GO


-- ----------------------------
-- Indexes structure for table visits
-- ----------------------------
CREATE NONCLUSTERED INDEX [IX_visits_visit_datetime]
ON [dbo].[visits] (
  [visit_datetime] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_visits_external_person_id]
ON [dbo].[visits] (
  [external_person_id] ASC
)
GO

CREATE NONCLUSTERED INDEX [IX_visits_patient_id]
ON [dbo].[visits] (
  [patient_id] ASC
)
GO


-- ----------------------------
-- Primary Key structure for table visits
-- ----------------------------
ALTER TABLE [dbo].[visits] ADD CONSTRAINT [PK_visits] PRIMARY KEY CLUSTERED ([visit_id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO


-- ----------------------------
-- Foreign Keys structure for table borrow_approvals
-- ----------------------------
ALTER TABLE [dbo].[borrow_approvals] ADD CONSTRAINT [FK_borrowapproval_header] FOREIGN KEY ([borrow_id]) REFERENCES [dbo].[borrow_headers] ([borrow_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table borrow_headers
-- ----------------------------
ALTER TABLE [dbo].[borrow_headers] ADD CONSTRAINT [FK_borrow_supplier] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers] ([supplier_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[borrow_headers] ADD CONSTRAINT [FK_borrow_po] FOREIGN KEY ([po_id]) REFERENCES [dbo].[po_headers] ([po_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table borrow_lines
-- ----------------------------
ALTER TABLE [dbo].[borrow_lines] ADD CONSTRAINT [FK_borrowline_header] FOREIGN KEY ([borrow_id]) REFERENCES [dbo].[borrow_headers] ([borrow_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[borrow_lines] ADD CONSTRAINT [FK_borrowline_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[borrow_lines] ADD CONSTRAINT [FK_borrowline_poline] FOREIGN KEY ([po_line_id]) REFERENCES [dbo].[po_lines] ([po_line_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table disease_sub_groups
-- ----------------------------
ALTER TABLE [dbo].[disease_sub_groups] ADD CONSTRAINT [FK_disease_sub_groups_group] FOREIGN KEY ([group_id]) REFERENCES [dbo].[disease_groups] ([group_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table gr_headers
-- ----------------------------
ALTER TABLE [dbo].[gr_headers] ADD CONSTRAINT [FK__gr_header__suppl__3EDC53F0] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers] ([supplier_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[gr_headers] ADD CONSTRAINT [FK__gr_header__po_id__3FD07829] FOREIGN KEY ([po_id]) REFERENCES [dbo].[po_headers] ([po_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table gr_lines
-- ----------------------------
ALTER TABLE [dbo].[gr_lines] ADD CONSTRAINT [fk_gr_lines_gr] FOREIGN KEY ([gr_id]) REFERENCES [dbo].[gr_headers] ([gr_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[gr_lines] ADD CONSTRAINT [fk_gr_lines_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[gr_lines] ADD CONSTRAINT [fk_gr_lines_po] FOREIGN KEY ([po_line_id]) REFERENCES [dbo].[po_lines] ([po_line_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table item_unit_conversions
-- ----------------------------
ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [FK_item_unit_conversions_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [FK_item_unit_conversions_supplier] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers] ([supplier_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [FK_item_unit_conversions_from_unit] FOREIGN KEY ([from_unit_id]) REFERENCES [dbo].[units] ([unit_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[item_unit_conversions] ADD CONSTRAINT [FK_item_unit_conversions_to_unit] FOREIGN KEY ([to_unit_id]) REFERENCES [dbo].[units] ([unit_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table items
-- ----------------------------
ALTER TABLE [dbo].[items] ADD CONSTRAINT [FK__items__item_type__2CF2ADDF] FOREIGN KEY ([item_type_id]) REFERENCES [dbo].[item_type] ([item_type_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[items] ADD CONSTRAINT [FK__items__stock_uni__69C6B1F5] FOREIGN KEY ([usage_unit_id]) REFERENCES [dbo].[units] ([unit_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table patient_allergies
-- ----------------------------
ALTER TABLE [dbo].[patient_allergies] ADD CONSTRAINT [FK_patient_allergies_profile] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[patient_profiles] ([patient_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table patient_physical_info
-- ----------------------------
ALTER TABLE [dbo].[patient_physical_info] ADD CONSTRAINT [FK_patient_physical_info_profile] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[patient_profiles] ([patient_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table patient_profiles
-- ----------------------------
ALTER TABLE [dbo].[patient_profiles] ADD CONSTRAINT [FK_patient_profiles_external] FOREIGN KEY ([external_person_id]) REFERENCES [dbo].[external_people] ([external_person_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table patient_social_security
-- ----------------------------
ALTER TABLE [dbo].[patient_social_security] ADD CONSTRAINT [FK_patient_social_security_profile] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[patient_profiles] ([patient_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table patient_underlying_diseases
-- ----------------------------
ALTER TABLE [dbo].[patient_underlying_diseases] ADD CONSTRAINT [FK_patient_diseases_profile] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[patient_profiles] ([patient_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table po_approvals
-- ----------------------------
ALTER TABLE [dbo].[po_approvals] ADD CONSTRAINT [fk_po_approvals_po_id] FOREIGN KEY ([po_id]) REFERENCES [dbo].[po_headers] ([po_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table po_headers
-- ----------------------------
ALTER TABLE [dbo].[po_headers] ADD CONSTRAINT [FK__po_header__suppl__40C49C62] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers] ([supplier_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table po_lines
-- ----------------------------
ALTER TABLE [dbo].[po_lines] ADD CONSTRAINT [FK__po_lines__item_i__41B8C09B] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[po_lines] ADD CONSTRAINT [FK__po_lines__borrow__42ACE4D4] FOREIGN KEY ([borrow_line_id]) REFERENCES [dbo].[borrow_lines] ([borrow_line_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[po_lines] ADD CONSTRAINT [fk_po_lines_po_id] FOREIGN KEY ([po_id]) REFERENCES [dbo].[po_headers] ([po_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table stock_adjustment_lines
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustment_lines] ADD CONSTRAINT [FK_stock_adjustment_lines_adjustment] FOREIGN KEY ([adjustment_id]) REFERENCES [dbo].[stock_adjustments] ([adjustment_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[stock_adjustment_lines] ADD CONSTRAINT [FK_stock_adjustment_lines_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table stock_adjustments
-- ----------------------------
ALTER TABLE [dbo].[stock_adjustments] ADD CONSTRAINT [FK_stock_adjustments_reversal_of] FOREIGN KEY ([reversal_of_id]) REFERENCES [dbo].[stock_adjustments] ([adjustment_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table stock_movements
-- ----------------------------
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [FK_stock_movements_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table stock_on_hand
-- ----------------------------
ALTER TABLE [dbo].[stock_on_hand] ADD CONSTRAINT [FK_stock_on_hand_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table supplier_price_list
-- ----------------------------
ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [fk_price_supplier] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers] ([supplier_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [fk_price_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[supplier_price_list] ADD CONSTRAINT [fk_price_unit] FOREIGN KEY ([unit_id]) REFERENCES [dbo].[units] ([unit_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table visit_usage_edit_logs
-- ----------------------------
ALTER TABLE [dbo].[visit_usage_edit_logs] ADD CONSTRAINT [FK_visit_usage_edit_logs_usage] FOREIGN KEY ([visit_usage_id]) REFERENCES [dbo].[visit_usages] ([visit_usage_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table visit_usages
-- ----------------------------
ALTER TABLE [dbo].[visit_usages] ADD CONSTRAINT [FK_visit_usages_visit] FOREIGN KEY ([visit_id]) REFERENCES [dbo].[visits] ([visit_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[visit_usages] ADD CONSTRAINT [FK_visit_usages_item] FOREIGN KEY ([item_id]) REFERENCES [dbo].[items] ([item_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO


-- ----------------------------
-- Foreign Keys structure for table visits
-- ----------------------------
ALTER TABLE [dbo].[visits] ADD CONSTRAINT [FK_visits_patient_profile] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[patient_profiles] ([patient_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO

ALTER TABLE [dbo].[visits] ADD CONSTRAINT [FK_visits_external_person] FOREIGN KEY ([external_person_id]) REFERENCES [dbo].[external_people] ([external_person_id]) ON DELETE NO ACTION ON UPDATE NO ACTION
GO