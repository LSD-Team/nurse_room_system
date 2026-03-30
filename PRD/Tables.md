/*
 Navicat Premium Dump SQL

 Source Server         : Linux_DB
 Source Server Type    : SQL Server
 Source Server Version : 14003500 (14.00.3500)
 Source Host           : 10.182.4.16:14331
 Source Catalog        : NURSE_ROOM
 Source Schema         : dbo

 Target Server Type    : SQL Server
 Target Server Version : 14003500 (14.00.3500)
 File Encoding         : 65001

 Date: 30/03/2026 07:51:33
*/


-- ----------------------------
-- Table structure for accident_severity_types
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[accident_severity_types]') AND type IN ('U'))
	DROP TABLE [dbo].[accident_severity_types]
GO

CREATE TABLE [dbo].[accident_severity_types] (
  [severity_id] int  IDENTITY(1,1) NOT NULL,
  [severity_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [severity_name_th] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [severity_name_en] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [sort_order] int DEFAULT 0 NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL
)
GO

ALTER TABLE [dbo].[accident_severity_types] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of accident_severity_types
-- ----------------------------
SET IDENTITY_INSERT [dbo].[accident_severity_types] ON
GO

INSERT INTO [dbo].[accident_severity_types] ([severity_id], [severity_code], [severity_name_th], [severity_name_en], [sort_order], [is_active]) VALUES (N'1', N'STOP_WORK', N'หยุดงาน', N'Stop Work', N'1', N'1')
GO

INSERT INTO [dbo].[accident_severity_types] ([severity_id], [severity_code], [severity_name_th], [severity_name_en], [sort_order], [is_active]) VALUES (N'2', N'REST', N'นอนพัก', N'Rest at Clinic', N'2', N'1')
GO

INSERT INTO [dbo].[accident_severity_types] ([severity_id], [severity_code], [severity_name_th], [severity_name_en], [sort_order], [is_active]) VALUES (N'3', N'WORK_NORMAL', N'ทำงานต่อได้', N'Work as Normal', N'3', N'1')
GO

INSERT INTO [dbo].[accident_severity_types] ([severity_id], [severity_code], [severity_name_th], [severity_name_en], [sort_order], [is_active]) VALUES (N'4', N'REFER_HOSP', N'ส่งโรงพยาบาล', N'Refer to Hospital', N'4', N'1')
GO

SET IDENTITY_INSERT [dbo].[accident_severity_types] OFF
GO


-- ----------------------------
-- Table structure for approval_roles
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[approval_roles]') AND type IN ('U'))
	DROP TABLE [dbo].[approval_roles]
GO

CREATE TABLE [dbo].[approval_roles] (
  [role_id] int  IDENTITY(1,1) NOT NULL,
  [role_code] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [role_name] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [approver_id] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[approval_roles] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of approval_roles
-- ----------------------------
SET IDENTITY_INSERT [dbo].[approval_roles] ON
GO

INSERT INTO [dbo].[approval_roles] ([role_id], [role_code], [role_name], [approver_id], [is_active], [created_by], [created_at]) VALUES (N'1', N'GROUP_LEAD', N'หัวหน้ากลุ่ม', N'0027', N'1', N'Admin', N'2026-03-16 11:32:23.120')
GO

INSERT INTO [dbo].[approval_roles] ([role_id], [role_code], [role_name], [approver_id], [is_active], [created_by], [created_at]) VALUES (N'2', N'MANAGER', N'ผู้จัดการ', N'1547', N'1', N'Admin', N'2026-03-16 11:32:23.120')
GO

INSERT INTO [dbo].[approval_roles] ([role_id], [role_code], [role_name], [approver_id], [is_active], [created_by], [created_at]) VALUES (N'3', N'DEPARTMENT', N'หัวหน้าแผนก', N'3346', N'1', N'Admin', N'2026-03-16 11:32:23.120')
GO

SET IDENTITY_INSERT [dbo].[approval_roles] OFF
GO


-- ----------------------------
-- Table structure for borrow_approvals
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[borrow_approvals]') AND type IN ('U'))
	DROP TABLE [dbo].[borrow_approvals]
GO

CREATE TABLE [dbo].[borrow_approvals] (
  [approval_id] int  IDENTITY(1,1) NOT NULL,
  [borrow_id] int  NOT NULL,
  [approval_level] int  NOT NULL,
  [approval_role] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [status] varchar(20) COLLATE Thai_CI_AS DEFAULT 'PENDING' NOT NULL,
  [actioned_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [actioned_at] datetime  NULL,
  [remark] nvarchar(200) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[borrow_approvals] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of borrow_approvals
-- ----------------------------
SET IDENTITY_INSERT [dbo].[borrow_approvals] ON
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'4', N'1', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-20 11:11:56.793', N'Rework')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'5', N'1', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-20 11:12:21.360', N'Rework')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'6', N'1', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-20 11:12:27.997', N'Rework')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'7', N'2', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-20 11:31:24.097', N'แปลงหน่วยยา')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'8', N'2', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-20 11:31:45.243', N'แปลงหน่วยยา')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'9', N'2', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-20 11:31:51.120', N'แปลงหน่วยยา')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'13', N'4', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-26 15:04:10.920', N'OK')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'14', N'4', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-26 15:04:35.867', N'OK')
GO

INSERT INTO [dbo].[borrow_approvals] ([approval_id], [borrow_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'15', N'4', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-26 15:04:56.770', N'OK')
GO

SET IDENTITY_INSERT [dbo].[borrow_approvals] OFF
GO


-- ----------------------------
-- Table structure for borrow_headers
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[borrow_headers]') AND type IN ('U'))
	DROP TABLE [dbo].[borrow_headers]
GO

CREATE TABLE [dbo].[borrow_headers] (
  [borrow_id] int  IDENTITY(1,1) NOT NULL,
  [borrow_no] varchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [borrow_date] date  NOT NULL,
  [supplier_id] int  NOT NULL,
  [status] varchar(30) COLLATE Thai_CI_AS DEFAULT 'DRAFT' NOT NULL,
  [note] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [po_id] int  NULL,
  [settled_at] datetime  NULL,
  [settled_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [cancelled_at] datetime  NULL,
  [cancelled_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[borrow_headers] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of borrow_headers
-- ----------------------------
SET IDENTITY_INSERT [dbo].[borrow_headers] ON
GO

INSERT INTO [dbo].[borrow_headers] ([borrow_id], [borrow_no], [borrow_date], [supplier_id], [status], [note], [po_id], [settled_at], [settled_by], [created_by], [created_at], [cancelled_at], [cancelled_by], [updated_by], [updated_at]) VALUES (N'1', N'BR202603-001', N'2026-03-20', N'1', N'SETTLED', N'แก้ไขเพิ่ม BUSCOPAN และปรับ PARACET', N'3', N'2026-03-20 11:48:23.180', N'8300', N'8300', N'2026-03-20 11:05:57.813', NULL, NULL, N'8300', N'2026-03-20 11:07:41.233')
GO

INSERT INTO [dbo].[borrow_headers] ([borrow_id], [borrow_no], [borrow_date], [supplier_id], [status], [note], [po_id], [settled_at], [settled_by], [created_by], [created_at], [cancelled_at], [cancelled_by], [updated_by], [updated_at]) VALUES (N'2', N'BR202603-002', N'2026-03-20', N'1', N'SETTLED', N'ยามีการแปลงหน่วย มี.ค. 2026', N'3', N'2026-03-20 11:48:23.180', N'8300', N'8300', N'2026-03-20 11:30:17.670', NULL, NULL, NULL, NULL)
GO

INSERT INTO [dbo].[borrow_headers] ([borrow_id], [borrow_no], [borrow_date], [supplier_id], [status], [note], [po_id], [settled_at], [settled_by], [created_by], [created_at], [cancelled_at], [cancelled_by], [updated_by], [updated_at]) VALUES (N'3', N'BR202603-003', N'2026-03-20', N'1', N'CANCELLED', N'Test | ยกเลิกเนื่องจาก: ไม่ยืมแล้ว', NULL, NULL, NULL, N'8300', N'2026-03-20 16:49:47.653', N'2026-03-26 14:59:26.677', N'8300', NULL, NULL)
GO

INSERT INTO [dbo].[borrow_headers] ([borrow_id], [borrow_no], [borrow_date], [supplier_id], [status], [note], [po_id], [settled_at], [settled_by], [created_by], [created_at], [cancelled_at], [cancelled_by], [updated_by], [updated_at]) VALUES (N'4', N'BR202603-004', N'2026-03-26', N'1', N'SETTLED', N'ยืมยาผิด', N'5', N'2026-03-26 15:40:13.507', N'8300', N'8300', N'2026-03-26 14:54:19.547', NULL, NULL, N'8300', N'2026-03-26 14:58:57.903')
GO

SET IDENTITY_INSERT [dbo].[borrow_headers] OFF
GO


-- ----------------------------
-- Table structure for borrow_lines
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[borrow_lines]') AND type IN ('U'))
	DROP TABLE [dbo].[borrow_lines]
GO

CREATE TABLE [dbo].[borrow_lines] (
  [borrow_line_id] int  IDENTITY(1,1) NOT NULL,
  [borrow_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [qty_borrow] decimal(18,4)  NOT NULL,
  [unit_price] decimal(18,4)  NOT NULL,
  [total_price] AS ([qty_borrow]*[unit_price]) PERSISTED,
  [po_line_id] int  NULL
)
GO

ALTER TABLE [dbo].[borrow_lines] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of borrow_lines
-- ----------------------------
SET IDENTITY_INSERT [dbo].[borrow_lines] ON
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'4', N'1', N'5', N'150.0000', N'0.5000', N'10')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'5', N'1', N'10', N'200.0000', N'0.1500', N'11')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'6', N'1', N'21', N'50.0000', N'2.5000', N'12')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'7', N'1', N'9', N'100.0000', N'3.0000', N'13')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'8', N'2', N'2', N'10.0000', N'60.0000', N'14')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'9', N'2', N'4', N'20.0000', N'150.0000', N'15')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'10', N'2', N'7', N'2.0000', N'285.0000', N'16')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'11', N'3', N'1', N'10.0000', N'4.0000', NULL)
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'15', N'4', N'20', N'10.0000', N'96.0000', N'130')
GO

INSERT INTO [dbo].[borrow_lines] ([borrow_line_id], [borrow_id], [item_id], [qty_borrow], [unit_price], [po_line_id]) VALUES (N'16', N'4', N'24', N'10.0000', N'10.0000', N'131')
GO

SET IDENTITY_INSERT [dbo].[borrow_lines] OFF
GO


-- ----------------------------
-- Table structure for disease_groups
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[disease_groups]') AND type IN ('U'))
	DROP TABLE [dbo].[disease_groups]
GO

CREATE TABLE [dbo].[disease_groups] (
  [group_id] int  IDENTITY(1,1) NOT NULL,
  [group_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [group_name_th] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [group_name_en] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [updated_at] datetime  NULL,
  [sort_order] int DEFAULT 0 NOT NULL
)
GO

ALTER TABLE [dbo].[disease_groups] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of disease_groups
-- ----------------------------
SET IDENTITY_INSERT [dbo].[disease_groups] ON
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'1', N'DG01', N'ระบบทางเดินหายใจ', N'Respiratory System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'2', N'DG02', N'ระบบทางเดินอาหาร', N'Digestive System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'3', N'DG03', N'ระบบกล้ามเนื้อและกระดูก', N'Musculoskeletal System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'4', N'DG04', N'ระบบผิวหนัง', N'Skin & Integumentary System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'5', N'DG05', N'ระบบหัวใจและหลอดเลือด', N'Cardiovascular System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'6', N'DG06', N'ระบบประสาท', N'Nervous System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'7', N'DG07', N'ระบบทางเดินปัสสาวะ', N'Urinary System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'8', N'DG08', N'ระบบต่อมไร้ท่อ', N'Endocrine System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'9', N'DG09', N'ระบบตาและหู', N'Eye & Ear System', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'10', N'DG10', N'อาการทั่วไป / อื่น ๆ', N'General / Others', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'11', N'DG11', N'อุบัติเหตุและการบาดเจ็บ', N'Accidents & Injuries', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

INSERT INTO [dbo].[disease_groups] ([group_id], [group_code], [group_name_th], [group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'12', N'DG12', N'สุขภาพจิต', N'Mental Health', N'1', N'2026-03-26 11:04:49.033', NULL, N'0')
GO

SET IDENTITY_INSERT [dbo].[disease_groups] OFF
GO


-- ----------------------------
-- Table structure for disease_sub_groups
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[disease_sub_groups]') AND type IN ('U'))
	DROP TABLE [dbo].[disease_sub_groups]
GO

CREATE TABLE [dbo].[disease_sub_groups] (
  [sub_group_id] int  IDENTITY(1,1) NOT NULL,
  [group_id] int  NOT NULL,
  [sub_group_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [sub_group_name_th] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [sub_group_name_en] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [updated_at] datetime  NULL,
  [sort_order] int DEFAULT 0 NOT NULL
)
GO

ALTER TABLE [dbo].[disease_sub_groups] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of disease_sub_groups
-- ----------------------------
SET IDENTITY_INSERT [dbo].[disease_sub_groups] ON
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'1', N'1', N'DS0101', N'ไข้หวัด / หวัด', N'Common Cold / Flu', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'2', N'1', N'DS0102', N'ไซนัสอักเสบ', N'Sinusitis', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'3', N'1', N'DS0103', N'คออักเสบ / เจ็บคอ', N'Pharyngitis / Sore Throat', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'4', N'1', N'DS0104', N'หลอดลมอักเสบ', N'Bronchitis', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'5', N'1', N'DS0105', N'หอบหืด / หายใจลำบาก', N'Asthma / Dyspnea', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'6', N'1', N'DS0106', N'ปอดอักเสบ / ปอดบวม', N'Pneumonia', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'7', N'2', N'DS0201', N'ปวดท้อง / ท้องเสีย', N'Abdominal Pain / Diarrhea', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'8', N'2', N'DS0202', N'คลื่นไส้ อาเจียน', N'Nausea / Vomiting', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'9', N'2', N'DS0203', N'ท้องผูก', N'Constipation', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'10', N'2', N'DS0204', N'กระเพาะอาหารอักเสบ / แผลในกระเพาะ', N'Gastritis / Peptic Ulcer', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'11', N'2', N'DS0205', N'ท้องอืด / แน่นท้อง', N'Bloating / Flatulence', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'12', N'2', N'DS0206', N'ริดสีดวงทวาร', N'Hemorrhoids', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'13', N'3', N'DS0301', N'ปวดหลัง / ปวดเอว', N'Back Pain / Lumbago', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'14', N'3', N'DS0302', N'ปวดคอ / ปวดบ่า', N'Neck / Shoulder Pain', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'15', N'3', N'DS0303', N'ปวดข้อ / ข้ออักเสบ', N'Joint Pain / Arthritis', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'16', N'3', N'DS0304', N'กล้ามเนื้ออักเสบ / เกร็ง', N'Muscle Strain / Spasm', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'17', N'3', N'DS0305', N'ปวดเข่า', N'Knee Pain', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'18', N'4', N'DS0401', N'ผื่นคัน / ลมพิษ', N'Rash / Urticaria', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'19', N'4', N'DS0402', N'แผลถลอก / แผลฉีกขาด', N'Abrasion / Laceration', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'20', N'4', N'DS0403', N'แผลไฟไหม้ / น้ำร้อนลวก', N'Burn / Scald', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'21', N'4', N'DS0404', N'เชื้อรา / กลากเกลื้อน', N'Fungal Infection / Tinea', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'22', N'4', N'DS0405', N'สิว / ฝี / ตุ่มหนอง', N'Acne / Abscess / Pustule', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'23', N'5', N'DS0501', N'ความดันโลหิตสูง', N'Hypertension', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'24', N'5', N'DS0502', N'ความดันโลหิตต่ำ / เป็นลม', N'Hypotension / Syncope', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'25', N'5', N'DS0503', N'ใจสั่น / เจ็บหน้าอก', N'Palpitation / Chest Pain', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'26', N'6', N'DS0601', N'ปวดหัว / ไมเกรน', N'Headache / Migraine', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'27', N'6', N'DS0602', N'เวียนศีรษะ / บ้านหมุน', N'Dizziness / Vertigo', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'28', N'6', N'DS0603', N'นอนไม่หลับ', N'Insomnia', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'29', N'6', N'DS0604', N'ชาปลายมือปลายเท้า', N'Peripheral Neuropathy', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'30', N'7', N'DS0701', N'กระเพาะปัสสาวะอักเสบ', N'Cystitis / UTI', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'31', N'7', N'DS0702', N'นิ่วในไต / ปวดบั้นเอว', N'Kidney Stone / Renal Colic', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'32', N'8', N'DS0801', N'เบาหวาน', N'Diabetes Mellitus', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'33', N'8', N'DS0802', N'โรคไทรอยด์', N'Thyroid Disorder', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'34', N'8', N'DS0803', N'ภาวะอ้วน / น้ำหนักเกิน', N'Obesity / Overweight', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'35', N'9', N'DS0901', N'ตาแดง / ตาอักเสบ', N'Conjunctivitis', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'36', N'9', N'DS0902', N'ตาแห้ง / ระคายเคืองตา', N'Dry Eye / Eye Irritation', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'37', N'9', N'DS0903', N'หูอื้อ / หูอักเสบ', N'Tinnitus / Otitis', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'38', N'10', N'DS1001', N'ไข้ / มีไข้สูง', N'Fever / High Fever', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'39', N'10', N'DS1002', N'อ่อนเพลีย / เหนื่อยง่าย', N'Fatigue / Weakness', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'40', N'10', N'DS1003', N'แพ้ยา / แพ้อาหาร', N'Drug / Food Allergy', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'41', N'10', N'DS1004', N'ตรวจสุขภาพประจำปี', N'Annual Health Check', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'42', N'10', N'DS1005', N'อื่น ๆ ที่ไม่จัดกลุ่ม', N'Unclassified / Others', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'43', N'11', N'DS1101', N'บาดเจ็บจากการทำงาน', N'Occupational Injury', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'44', N'11', N'DS1102', N'อุบัติเหตุทั่วไป (นอกงาน)', N'General Accident (Non-work)', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'45', N'11', N'DS1103', N'ข้อเคล็ด / ข้อแพลง', N'Sprain / Strain', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'46', N'11', N'DS1104', N'กระดูกหัก / ข้อหลุด', N'Fracture / Dislocation', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'47', N'11', N'DS1105', N'แมลงกัด / สัตว์กัด', N'Insect / Animal Bite', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'48', N'12', N'DS1201', N'ความเครียด / วิตกกังวล', N'Stress / Anxiety', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'49', N'12', N'DS1202', N'ภาวะซึมเศร้า', N'Depression', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

INSERT INTO [dbo].[disease_sub_groups] ([sub_group_id], [group_id], [sub_group_code], [sub_group_name_th], [sub_group_name_en], [is_active], [created_at], [updated_at], [sort_order]) VALUES (N'50', N'12', N'DS1203', N'เหนื่อยล้าจากการทำงาน (Burnout)', N'Burnout Syndrome', N'1', N'2026-03-26 11:04:49.110', NULL, N'0')
GO

SET IDENTITY_INSERT [dbo].[disease_sub_groups] OFF
GO


-- ----------------------------
-- Table structure for external_people
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[external_people]') AND type IN ('U'))
	DROP TABLE [dbo].[external_people]
GO

CREATE TABLE [dbo].[external_people] (
  [external_person_id] int  IDENTITY(1,1) NOT NULL,
  [full_name] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [company] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [national_id] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [passport_no] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [phone] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [is_deleted] bit DEFAULT 0 NOT NULL,
  [deleted_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[external_people] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of external_people
-- ----------------------------
SET IDENTITY_INSERT [dbo].[external_people] ON
GO

INSERT INTO [dbo].[external_people] ([external_person_id], [full_name], [company], [national_id], [passport_no], [phone], [created_at], [is_deleted], [deleted_at]) VALUES (N'1', N'นายมานะ มานะครับ', N'YET', N'3810100670854', NULL, N'0846096241', N'2026-03-27 10:24:10.830', N'0', N'2026-03-27 11:41:49.963')
GO

INSERT INTO [dbo].[external_people] ([external_person_id], [full_name], [company], [national_id], [passport_no], [phone], [created_at], [is_deleted], [deleted_at]) VALUES (N'2', N'นางมานี มีใจ', N'OpLay', N'1234', N'ABC', N'01234567890', N'2026-03-27 11:17:37.180', N'0', NULL)
GO

INSERT INTO [dbo].[external_people] ([external_person_id], [full_name], [company], [national_id], [passport_no], [phone], [created_at], [is_deleted], [deleted_at]) VALUES (N'3', N'นางสาวกานดา มาหาตา', N'Hoya', N'', N'', N'1234', N'2026-03-27 11:33:10.103', N'0', NULL)
GO

SET IDENTITY_INSERT [dbo].[external_people] OFF
GO


-- ----------------------------
-- Table structure for gr_headers
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[gr_headers]') AND type IN ('U'))
	DROP TABLE [dbo].[gr_headers]
GO

CREATE TABLE [dbo].[gr_headers] (
  [gr_id] int  IDENTITY(1,1) NOT NULL,
  [gr_no] varchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [gr_date] date  NOT NULL,
  [supplier_id] int  NOT NULL,
  [po_id] int  NULL,
  [status] varchar(20) COLLATE Thai_CI_AS DEFAULT 'DRAFT' NOT NULL,
  [note] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [confirmed_at] datetime  NULL,
  [confirmed_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [cancelled_at] datetime  NULL,
  [cancelled_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[gr_headers] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of gr_headers
-- ----------------------------
SET IDENTITY_INSERT [dbo].[gr_headers] ON
GO

INSERT INTO [dbo].[gr_headers] ([gr_id], [gr_no], [gr_date], [supplier_id], [po_id], [status], [note], [confirmed_at], [confirmed_by], [cancelled_at], [cancelled_by], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'4', N'GR202603-001', N'2026-03-20', N'1', N'3', N'CONFIRMED', N'รับของครั้งที่ 1 (บางส่วน)', N'2026-03-20 12:00:36.130', N'8300', NULL, NULL, N'8300', N'2026-03-20 11:56:02.190', N'8300', N'2026-03-20 12:00:36.130')
GO

INSERT INTO [dbo].[gr_headers] ([gr_id], [gr_no], [gr_date], [supplier_id], [po_id], [status], [note], [confirmed_at], [confirmed_by], [cancelled_at], [cancelled_by], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'5', N'GR202603-002', N'2026-03-20', N'1', N'3', N'CONFIRMED', N'รับของครั้งที่ 2 ส่วนที่เหลือ', N'2026-03-20 12:06:23.210', N'8300', NULL, NULL, N'8300', N'2026-03-20 12:05:52.323', N'8300', N'2026-03-20 12:06:23.210')
GO

INSERT INTO [dbo].[gr_headers] ([gr_id], [gr_no], [gr_date], [supplier_id], [po_id], [status], [note], [confirmed_at], [confirmed_by], [cancelled_at], [cancelled_by], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'6', N'GR202603-003', N'2026-03-26', N'1', N'5', N'CONFIRMED', N'รับเฉพาะเลขคี่', N'2026-03-26 15:50:52.650', N'8300', NULL, NULL, N'8300', N'2026-03-26 15:48:08.300', N'8300', N'2026-03-26 15:50:52.650')
GO

INSERT INTO [dbo].[gr_headers] ([gr_id], [gr_no], [gr_date], [supplier_id], [po_id], [status], [note], [confirmed_at], [confirmed_by], [cancelled_at], [cancelled_by], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'7', N'GR202603-004', N'2026-03-26', N'1', N'5', N'CONFIRMED', N'รับเฉพาะเลขคี่', N'2026-03-26 15:50:45.290', N'8300', NULL, NULL, N'8300', N'2026-03-26 15:49:55.710', N'8300', N'2026-03-26 15:50:45.290')
GO

INSERT INTO [dbo].[gr_headers] ([gr_id], [gr_no], [gr_date], [supplier_id], [po_id], [status], [note], [confirmed_at], [confirmed_by], [cancelled_at], [cancelled_by], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'8', N'GR202603-005', N'2026-03-26', N'1', N'5', N'CONFIRMED', N'รับเฉพาะเลขคี่', N'2026-03-26 15:57:39.160', N'8300', NULL, NULL, N'8300', N'2026-03-26 15:56:47.340', N'8300', N'2026-03-26 15:57:39.160')
GO

SET IDENTITY_INSERT [dbo].[gr_headers] OFF
GO


-- ----------------------------
-- Table structure for gr_lines
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[gr_lines]') AND type IN ('U'))
	DROP TABLE [dbo].[gr_lines]
GO

CREATE TABLE [dbo].[gr_lines] (
  [gr_line_id] int  IDENTITY(1,1) NOT NULL,
  [gr_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [qty_receive] decimal(18,4)  NOT NULL,
  [unit_price] decimal(18,4)  NOT NULL,
  [total_price] AS ([qty_receive]*[unit_price]) PERSISTED,
  [po_line_id] int  NULL
)
GO

ALTER TABLE [dbo].[gr_lines] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of gr_lines
-- ----------------------------
SET IDENTITY_INSERT [dbo].[gr_lines] ON
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'1', N'4', N'10', N'30.0000', N'0.1500', N'11')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'2', N'4', N'10', N'30.0000', N'0.1500', N'18')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'3', N'4', N'16', N'200.0000', N'2.0000', N'19')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'4', N'5', N'5', N'150.0000', N'0.5000', N'10')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'5', N'5', N'10', N'170.0000', N'0.1500', N'11')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'6', N'5', N'10', N'170.0000', N'0.1500', N'18')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'7', N'5', N'21', N'50.0000', N'2.5000', N'12')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'8', N'5', N'9', N'100.0000', N'3.0000', N'13')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'9', N'5', N'2', N'10.0000', N'60.0000', N'14')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'10', N'5', N'4', N'20.0000', N'150.0000', N'15')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'11', N'5', N'7', N'2.0000', N'285.0000', N'16')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'12', N'5', N'14', N'5.0000', N'680.0000', N'17')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'13', N'5', N'10', N'170.0000', N'0.1500', N'11')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'14', N'5', N'10', N'170.0000', N'0.1500', N'18')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'15', N'5', N'22', N'150.0000', N'1.5000', N'20')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'16', N'5', N'12', N'100.0000', N'0.5000', N'21')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'17', N'6', N'1', N'62.0000', N'4.0000', N'76')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'18', N'6', N'3', N'4.0000', N'18.0000', N'78')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'19', N'6', N'5', N'84.0000', N'0.5000', N'80')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'20', N'6', N'7', N'1.0000', N'285.0000', N'82')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'21', N'6', N'9', N'88.0000', N'3.0000', N'84')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'22', N'6', N'11', N'22.0000', N'0.5000', N'86')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'23', N'6', N'13', N'9.0000', N'75.0000', N'88')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'24', N'6', N'15', N'3.0000', N'20.0000', N'90')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'25', N'6', N'17', N'66.0000', N'0.4500', N'92')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'26', N'6', N'19', N'17.0000', N'18.0000', N'94')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'27', N'6', N'21', N'240.0000', N'2.5000', N'96')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'28', N'6', N'23', N'6.0000', N'35.0000', N'98')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'29', N'6', N'25', N'41.0000', N'1.8000', N'100')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'30', N'6', N'27', N'12.0000', N'2.5000', N'102')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'31', N'6', N'29', N'1.0000', N'40.0000', N'104')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'32', N'6', N'31', N'98.0000', N'280.0000', N'106')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'33', N'6', N'33', N'5.0000', N'15.0000', N'108')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'34', N'6', N'35', N'4.0000', N'60.0000', N'110')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'35', N'6', N'37', N'2.0000', N'70.0000', N'112')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'36', N'6', N'39', N'2.0000', N'25.0000', N'114')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'37', N'6', N'41', N'11.0000', N'1.3000', N'116')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'38', N'6', N'43', N'1.0000', N'35.0000', N'118')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'39', N'6', N'45', N'6.0000', N'45.0000', N'120')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'40', N'6', N'47', N'8.0000', N'1.8000', N'122')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'41', N'6', N'49', N'18.0000', N'78.0000', N'124')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'42', N'6', N'53', N'1.0000', N'40.0000', N'126')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'43', N'6', N'55', N'7.0000', N'18.0000', N'128')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'44', N'7', N'1', N'62.0000', N'4.0000', N'76')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'45', N'7', N'3', N'4.0000', N'18.0000', N'78')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'46', N'7', N'5', N'84.0000', N'0.5000', N'80')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'47', N'7', N'7', N'1.0000', N'285.0000', N'82')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'48', N'7', N'9', N'88.0000', N'3.0000', N'84')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'49', N'7', N'11', N'22.0000', N'0.5000', N'86')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'50', N'7', N'13', N'9.0000', N'75.0000', N'88')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'51', N'7', N'15', N'3.0000', N'20.0000', N'90')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'52', N'7', N'17', N'66.0000', N'0.4500', N'92')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'53', N'7', N'19', N'17.0000', N'18.0000', N'94')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'54', N'7', N'21', N'240.0000', N'2.5000', N'96')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'55', N'7', N'23', N'6.0000', N'35.0000', N'98')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'56', N'7', N'25', N'41.0000', N'1.8000', N'100')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'57', N'7', N'27', N'12.0000', N'2.5000', N'102')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'58', N'7', N'29', N'1.0000', N'40.0000', N'104')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'59', N'7', N'31', N'98.0000', N'280.0000', N'106')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'60', N'7', N'33', N'5.0000', N'15.0000', N'108')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'61', N'7', N'35', N'4.0000', N'60.0000', N'110')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'62', N'7', N'37', N'2.0000', N'70.0000', N'112')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'63', N'7', N'39', N'2.0000', N'25.0000', N'114')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'64', N'7', N'41', N'11.0000', N'1.3000', N'116')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'65', N'7', N'43', N'1.0000', N'35.0000', N'118')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'66', N'7', N'45', N'6.0000', N'45.0000', N'120')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'67', N'7', N'47', N'8.0000', N'1.8000', N'122')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'68', N'7', N'49', N'18.0000', N'78.0000', N'124')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'69', N'7', N'53', N'1.0000', N'40.0000', N'126')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'70', N'7', N'55', N'7.0000', N'18.0000', N'128')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'71', N'8', N'2', N'7.0000', N'60.0000', N'77')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'72', N'8', N'4', N'19.0000', N'150.0000', N'79')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'73', N'8', N'6', N'51.0000', N'1.5000', N'81')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'74', N'8', N'8', N'42.0000', N'1.5000', N'83')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'75', N'8', N'10', N'133.0000', N'0.1500', N'85')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'76', N'8', N'12', N'145.0000', N'0.5000', N'87')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'77', N'8', N'14', N'73.0000', N'680.0000', N'89')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'78', N'8', N'16', N'97.0000', N'2.0000', N'91')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'79', N'8', N'18', N'4.0000', N'420.0000', N'93')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'80', N'8', N'20', N'2.0000', N'96.0000', N'95')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'81', N'8', N'20', N'2.0000', N'96.0000', N'130')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'82', N'8', N'22', N'111.0000', N'1.5000', N'97')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'83', N'8', N'24', N'10.0000', N'10.0000', N'99')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'84', N'8', N'24', N'10.0000', N'10.0000', N'131')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'85', N'8', N'26', N'8.0000', N'70.0000', N'101')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'86', N'8', N'28', N'14.0000', N'7.0000', N'103')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'87', N'8', N'30', N'150.0000', N'45.0000', N'105')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'88', N'8', N'32', N'5.0000', N'25.0000', N'107')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'89', N'8', N'34', N'47.0000', N'80.0000', N'109')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'90', N'8', N'36', N'3.0000', N'80.0000', N'111')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'91', N'8', N'38', N'5.0000', N'10.0000', N'113')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'92', N'8', N'40', N'1.0000', N'15.0000', N'115')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'93', N'8', N'42', N'1.0000', N'35.0000', N'117')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'94', N'8', N'44', N'1.0000', N'145.0000', N'119')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'95', N'8', N'46', N'15.0000', N'1.8000', N'121')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'96', N'8', N'48', N'25.0000', N'150.0000', N'123')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'97', N'8', N'50', N'1.0000', N'20.0000', N'125')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'98', N'8', N'54', N'4.0000', N'390.0000', N'127')
GO

INSERT INTO [dbo].[gr_lines] ([gr_line_id], [gr_id], [item_id], [qty_receive], [unit_price], [po_line_id]) VALUES (N'99', N'8', N'56', N'2.0000', N'20.0000', N'129')
GO

SET IDENTITY_INSERT [dbo].[gr_lines] OFF
GO


-- ----------------------------
-- Table structure for hospitals
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[hospitals]') AND type IN ('U'))
	DROP TABLE [dbo].[hospitals]
GO

CREATE TABLE [dbo].[hospitals] (
  [hospital_id] int  IDENTITY(1,1) NOT NULL,
  [hospital_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [hospital_name_th] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [hospital_name_en] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [address] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [phone] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [hospital_type] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[hospitals] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of hospitals
-- ----------------------------
SET IDENTITY_INSERT [dbo].[hospitals] ON
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'1', N'CM001', N'โรงพยาบาลนครพิงค์', N'Nakornping Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'2', N'CM002', N'โรงพยาบาลมหาราชนครเชียงใหม่', N'Maharaj Nakorn Chiang Mai Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'3', N'CM003', N'โรงพยาบาลราชเวชเชียงใหม่', N'Rajavej Chiang Mai Hospital', N'เชียงใหม่', NULL, N'เอกชน', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'4', N'CM004', N'โรงพยาบาลลานนา', N'Lanna Hospital', N'เชียงใหม่', NULL, N'เอกชน', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'5', N'CM005', N'โรงพยาบาลเทพปัญญา', N'Thep Paniya Hospital', N'เชียงใหม่', NULL, N'เอกชน', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'6', N'CM006', N'โรงพยาบาลเชียงใหม่ใกล้หมอ', N'Chiang Mai Close to Doctor Hospital', N'เชียงใหม่', NULL, N'เอกชน', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'7', N'CM007', N'โรงพยาบาลสันป่าตอง', N'San Pa Tong Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'8', N'CM008', N'โรงพยาบาลหางดง', N'Hang Dong Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'9', N'CM009', N'โรงพยาบาลสันทราย', N'San Sai Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'10', N'CM010', N'โรงพยาบาลจอมทอง', N'Chom Thong Hospital', N'เชียงใหม่', NULL, N'รัฐ', N'1', N'2026-03-26 14:11:39.693')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'11', N'LP001', N'โรงพยาบาลลำพูน', N'Lamphun Hospital', N'ลำพูน', NULL, N'รัฐ', N'1', N'2026-03-26 14:12:51.213')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'12', N'LP002', N'โรงพยาบาลหริภุญชัยเมโมเรียล', N'Hariphunchai Memorial Hospital', N'ลำพูน', NULL, N'เอกชน', N'1', N'2026-03-26 14:12:51.213')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'13', N'LP003', N'โรงพยาบาลศิริเวชลำพูน', N'Sirivej Lamphun Hospital', N'ลำพูน', NULL, N'เอกชน', N'1', N'2026-03-26 14:12:51.213')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'14', N'LP004', N'โรงพยาบาลพริ้นซ์ ลำพูน', N'Prince Lamphun Hospital', N'ลำพูน', NULL, N'เอกชน', N'1', N'2026-03-26 14:12:51.213')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'15', N'LP005', N'โรงพยาบาลลำพูนใกล้หมอ', N'Lamphun Close to Doctor Hospital', N'ลำพูน', NULL, N'เอกชน', N'1', N'2026-03-26 14:12:51.213')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'16', N'LPA001', N'โรงพยาบาลลำปาง', N'Lampang Hospital', N'ลำปาง', NULL, N'รัฐ', N'1', N'2026-03-26 14:13:16.360')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'17', N'LPA002', N'โรงพยาบาลค่ายสุรศักดิ์มนตรี', N'Surasak Montri Army Hospital', N'ลำปาง', NULL, N'รัฐ', N'1', N'2026-03-26 14:13:16.360')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'18', N'LPA003', N'โรงพยาบาลงาว', N'Ngao Hospital', N'ลำปาง', NULL, N'รัฐ', N'1', N'2026-03-26 14:13:16.360')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'19', N'LPA004', N'โรงพยาบาลเกาะคา', N'Koh Ka Hospital', N'ลำปาง', NULL, N'รัฐ', N'1', N'2026-03-26 14:13:16.360')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'20', N'LPA005', N'โรงพยาบาลเด่นชัย', N'Den Chai Hospital', N'ลำปาง', NULL, N'รัฐ', N'1', N'2026-03-26 14:13:16.360')
GO

INSERT INTO [dbo].[hospitals] ([hospital_id], [hospital_code], [hospital_name_th], [hospital_name_en], [address], [phone], [hospital_type], [is_active], [created_at]) VALUES (N'21', N'CM0011', N'โรงพยาบาลลานนา3', N'Lanna3 Hospital', N'เชียงใหม่', NULL, N'เอกชน', N'1', N'2026-03-26 14:11:39.693')
GO

SET IDENTITY_INSERT [dbo].[hospitals] OFF
GO


-- ----------------------------
-- Table structure for inventory_period_closings
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory_period_closings]') AND type IN ('U'))
	DROP TABLE [dbo].[inventory_period_closings]
GO

CREATE TABLE [dbo].[inventory_period_closings] (
  [period_id] int  IDENTITY(1,1) NOT NULL,
  [month] int  NOT NULL,
  [year] int  NOT NULL,
  [status] nvarchar(20) COLLATE Thai_CI_AS DEFAULT 'CLOSED' NOT NULL,
  [closed_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [closed_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[inventory_period_closings] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of inventory_period_closings
-- ----------------------------
SET IDENTITY_INSERT [dbo].[inventory_period_closings] ON
GO

INSERT INTO [dbo].[inventory_period_closings] ([period_id], [month], [year], [status], [closed_by], [closed_at]) VALUES (N'1', N'3', N'2026', N'closed', N'8300', N'2026-03-05 13:10:47.827')
GO

SET IDENTITY_INSERT [dbo].[inventory_period_closings] OFF
GO


-- ----------------------------
-- Table structure for item_type
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[item_type]') AND type IN ('U'))
	DROP TABLE [dbo].[item_type]
GO

CREATE TABLE [dbo].[item_type] (
  [item_type_name] varchar(200) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [update_at] datetime  NULL,
  [update_by] varchar(10) COLLATE Thai_CI_AS  NULL,
  [item_type_id] int  IDENTITY(1,1) NOT NULL
)
GO

ALTER TABLE [dbo].[item_type] SET (LOCK_ESCALATION = AUTO)
GO


-- ----------------------------
-- Records of item_type
-- ----------------------------
SET IDENTITY_INSERT [dbo].[item_type] ON
GO

INSERT INTO [dbo].[item_type] ([item_type_name], [is_active], [update_at], [update_by], [item_type_id]) VALUES (N'Medical supplies', N'1', N'2026-03-04 13:54:03.967', N'8300', N'2')
GO

INSERT INTO [dbo].[item_type] ([item_type_name], [is_active], [update_at], [update_by], [item_type_id]) VALUES (N'Medicine', N'1', N'2026-03-04 13:52:18.863', N'8300', N'1')
GO

SET IDENTITY_INSERT [dbo].[item_type] OFF
GO


-- ----------------------------
-- Table structure for item_unit_conversions
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[item_unit_conversions]') AND type IN ('U'))
	DROP TABLE [dbo].[item_unit_conversions]
GO

CREATE TABLE [dbo].[item_unit_conversions] (
  [conversion_id] int  IDENTITY(1,1) NOT NULL,
  [item_id] int  NOT NULL,
  [supplier_id] int  NOT NULL,
  [from_unit_id] int  NOT NULL,
  [to_unit_id] int  NOT NULL,
  [conversion_factor] decimal(18,4)  NOT NULL,
  [note] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[item_unit_conversions] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of item_unit_conversions
-- ----------------------------
SET IDENTITY_INSERT [dbo].[item_unit_conversions] ON
GO

INSERT INTO [dbo].[item_unit_conversions] ([conversion_id], [item_id], [supplier_id], [from_unit_id], [to_unit_id], [conversion_factor], [note], [is_active], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'1', N'26', N'1', N'1', N'1', N'8.0000', N'1 ขวดใหญ่ 240ml = 8 ขวดจ่าย 30ml', N'1', N'Admin', N'2026-03-19 09:15:38.377', NULL, NULL)
GO

INSERT INTO [dbo].[item_unit_conversions] ([conversion_id], [item_id], [supplier_id], [from_unit_id], [to_unit_id], [conversion_factor], [note], [is_active], [created_by], [created_at], [updated_by], [updated_at]) VALUES (N'2', N'26', N'2', N'1', N'1', N'4.0000', N'1 ขวดใหญ่ 120ml = 4 ขวดจ่าย 30ml', N'1', N'Admin', N'2026-03-19 09:15:38.377', NULL, NULL)
GO

SET IDENTITY_INSERT [dbo].[item_unit_conversions] OFF
GO


-- ----------------------------
-- Table structure for items
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[items]') AND type IN ('U'))
	DROP TABLE [dbo].[items]
GO

CREATE TABLE [dbo].[items] (
  [item_id] int  IDENTITY(1,1) NOT NULL,
  [item_code] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [item_name_en] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [usage_unit_id] int  NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [item_name_th] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [item_min] int  NULL,
  [item_max] int  NULL,
  [update_at] datetime DEFAULT getdate() NULL,
  [item_type_id] int  NOT NULL
)
GO

ALTER TABLE [dbo].[items] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of items
-- ----------------------------
SET IDENTITY_INSERT [dbo].[items] ON
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'1', N'DR0001', N'O'' LYTE', N'17', N'1', N'2026-03-04 14:47:20.930', N'เกลือแร่รักษาอาการท้องเสีย', N'30', N'100', N'2026-03-04 14:47:20.930', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'2', N'DR0002', N'VA', N'17', N'1', N'2026-03-04 14:47:20.960', N'ยาหอม', N'24', N'36', N'2026-03-04 14:47:20.960', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'3', N'DR0003', N'Vilerm ', N'17', N'1', N'2026-03-04 14:47:20.980', N'ยาทารักษาเริม', N'5', N'10', N'2026-03-04 14:47:20.980', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'4', N'DR0004', N'COUNTER  PAIN ', N'18', N'1', N'2026-03-04 14:47:20.997', N'ยาทาแก้ปวดเมื่อย', N'40', N'100', N'2026-03-04 14:47:20.997', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'5', N'DR0005', N'PARACET ', N'14', N'1', N'2026-03-04 14:47:21.027', N'ยาแก้ปวด, ลดไข้หวัด', N'200', N'500', N'2026-03-04 14:47:21.027', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'6', N'DR0006', N'PONSTAN ', N'14', N'1', N'2026-03-04 14:47:21.050', N'ยาแก้ปวดท้องชนิดแคปซูล', N'200', N'300', N'2026-03-04 14:47:21.050', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'7', N'DR0007', N'ALUGEL', N'1', N'1', N'2026-03-04 14:47:21.067', N'ยากระเพาะชนิดน้ำ', N'30', N'60', N'2026-03-04 14:47:21.067', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'8', N'DR0008', N'AIR-X', N'14', N'1', N'2026-03-04 14:47:21.097', N'ยาแก้ท้องอืดชนิดเม็ด', N'100', N'200', N'2026-03-04 14:47:21.097', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'9', N'DR0009', N'BUSCOPAN ', N'14', N'1', N'2026-03-04 14:47:21.117', N'ยาแก้ปวดท้อง', N'100', N'200', N'2026-03-04 14:47:21.117', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'10', N'DR0010', N'CPM ', N'14', N'1', N'2026-03-04 14:47:21.140', N'ยาแก้แพ้ ลดน้ำมูก', N'100', N'200', N'2026-03-04 14:47:21.140', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'11', N'DR0011', N'DRAMAMINE ', N'14', N'1', N'2026-03-04 14:47:21.160', N'ยาแก้เวียนศรีษะ คลื่นไส้ อาเจียน', N'50', N'100', N'2026-03-04 14:47:21.160', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'12', N'DR0012', N'DICLOFENAC', N'14', N'1', N'2026-03-04 14:47:21.180', N'ยารักษาข้ออักเสบ', N'200', N'300', N'2026-03-04 14:47:21.180', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'13', N'DR0013', N'BALM ', N'18', N'1', N'2026-03-04 14:47:21.200', N'ยาหม่อง', N'10', N'30', N'2026-03-04 14:47:21.200', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'14', N'DR0014', N'BETA-N CREAM ', N'18', N'1', N'2026-03-04 14:47:21.220', N'ยาทาแก้ผื่นคัน', N'20', N'100', N'2026-03-04 14:47:21.220', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'15', N'DR0015', N'CALAMINE  LOTION ', N'1', N'1', N'2026-03-04 14:47:21.237', N'ยาทาแก้ผื่นคันชนิดน้ำ', N'5', N'10', N'2026-03-04 14:47:21.237', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'16', N'DR0016', N'BRUFEN  (400) ', N'14', N'1', N'2026-03-04 14:47:21.257', N'ยาแก้ปวด', N'100', N'300', N'2026-03-04 14:47:21.257', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'17', N'DR0017', N'BROMHEXINE ', N'14', N'1', N'2026-03-04 14:47:21.277', N'ยาแก้ไอขับเสมหะชนิดเม็ด', N'100', N'300', N'2026-03-04 14:47:21.277', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'18', N'DR0018', N'HISTA-OPH ', N'1', N'1', N'2026-03-04 14:47:21.307', N'ยาหยอดตา ', N'6', N'12', N'2026-03-04 14:47:21.307', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'19', N'DR0019', N'M.TUSSIS ', N'1', N'1', N'2026-03-04 14:47:21.330', N'ยาแก้ไอชนิดน้ำ', N'20', N'80', N'2026-03-04 14:47:21.330', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'20', N'DR0020', N'INHALEX ', N'16', N'1', N'2026-03-04 14:47:21.350', N'ยาดม', N'24', N'48', N'2026-03-04 14:47:21.350', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'21', N'DR0021', N'Logadine', N'14', N'1', N'2026-03-04 14:47:21.370', N'ยาแก้หวัด คัดจมูก ลดน้ำมูก', N'300', N'600', N'2026-03-04 14:47:21.370', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'22', N'DR0022', N'MYDOCALM ', N'14', N'1', N'2026-03-04 14:47:21.390', N'ยาคลายกล้ามเนื้อ', N'200', N'400', N'2026-03-04 14:47:21.390', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'23', N'DR0023', N'POLY-OPH ', N'1', N'1', N'2026-03-04 14:47:21.410', N'ยาหยอดตา (ตาอักเสบ)', N'6', N'24', N'2026-03-04 14:47:21.410', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'24', N'DR0024', N'MYBACIN ', N'17', N'1', N'2026-03-04 14:47:21.430', N'ยาอมแก้ไอเจ็บคอ', N'50', N'80', N'2026-03-04 14:47:21.430', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'25', N'DR0025', N'Motilium ', N'14', N'1', N'2026-03-04 14:47:21.450', N'แก้คลื่นไส้อาเจียน', N'50', N'100', N'2026-03-04 14:47:21.450', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'26', N'DR0026', N'M.CARMINATIVE', N'1', N'1', N'2026-03-04 14:47:21.470', N'ยาขับลมชนิดน้ำ', N'15', N'30', N'2026-03-04 14:47:21.470', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'27', N'DR0027', N'CIMETIDINE ', N'14', N'1', N'2026-03-04 14:47:21.490', N'ยารักษาแผลในกระเพาะชนิดเม็ด', N'100', N'200', N'2026-03-04 14:47:21.490', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'28', N'DR0028', N'Kanolone ', N'17', N'1', N'2026-03-04 14:47:21.513', N'ยาทาแผลในปาก', N'24', N'48', N'2026-03-04 14:47:21.513', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'29', N'DR0029', N'Silverderm', N'18', N'1', N'2026-03-04 14:47:21.530', N'ยาทาแผลไฟไหม้', N'1', N'2', N'2026-03-04 14:47:21.530', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'30', N'DR0030', N'OPSIL', N'9', N'1', N'2026-03-04 14:47:21.547', N'น้ำยาล้างตา(ขนาดเล็ก)', N'100', N'600', N'2026-03-04 14:47:21.547', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'31', N'DR0031', N'Oreda', N'17', N'1', N'2026-03-04 14:47:21.567', N'ผงเกลือแร่', N'60', N'200', N'2026-03-04 14:47:21.567', N'1')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'32', N'MD0001', N'ELASTIC BANDAGE 3"', N'12', N'1', N'2026-03-04 14:47:21.583', N'ผ้าก๊อซพันแผล 3 นิ้ว', N'5', N'10', N'2026-03-04 14:47:21.583', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'33', N'MD0002', N'ELASTIC BANDAGE 2"', N'12', N'1', N'2026-03-04 14:47:21.603', N'ผ้าก๊อซพันแผล 2 นิ้ว', N'5', N'10', N'2026-03-04 14:47:21.603', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'34', N'MD0003', N'Tensoplast', N'11', N'1', N'2026-03-04 14:47:21.623', N'พลาสติกปิดแผล', N'20', N'100', N'2026-03-04 14:47:21.623', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'35', N'MD0004', N'GAUZE  PAD  2" ', N'11', N'1', N'2026-03-04 14:47:21.643', N'ผ้าก๊อชปิดแผล ขนาด 2 นิ้ว', N'5', N'10', N'2026-03-04 14:47:21.643', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'36', N'MD0005', N'GAUZE  PAD  3" ', N'11', N'1', N'2026-03-04 14:47:21.660', N'ผ้าก๊อชปิดแผล ขนาด 3 นิ้ว', N'5', N'10', N'2026-03-04 14:47:21.660', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'37', N'MD0006', N'Easyfix ', N'19', N'1', N'2026-03-04 14:47:21.680', N'ที่พันแผลแบบติดแน่น', N'2', N'5', N'2026-03-04 14:47:21.680', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'38', N'MD0007', N'Eye pad', N'11', N'1', N'2026-03-04 14:47:21.697', N'ก๊อชปิดตา', N'5', N'10', N'2026-03-04 14:47:21.697', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'39', N'MD0008', N'PLASTER  3M ', N'19', N'1', N'2026-03-04 14:47:21.720', N'พลาสเตอร์ปิดแผล', N'3', N'6', N'2026-03-04 14:47:21.720', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'40', N'MD0009', N'Plastic small  bag', N'17', N'1', N'2026-03-04 14:47:21.737', N'ซองยาเล็ก ขนาด 5.5 * 7.5 ซม.', N'2', N'5', N'2026-03-04 14:47:21.737', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'41', N'MD0010', N'Plastic small  box ', N'18', N'1', N'2026-03-04 14:47:21.760', N'ตลับแบ่งยา  เล็ก', N'20', N'100', N'2026-03-04 14:47:21.760', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'42', N'MD0011', N'NSS  0.9 %', N'9', N'1', N'2026-03-04 14:47:21.780', N'น้ำเกลือล้างแผล', N'1', N'3', N'2026-03-04 14:47:21.780', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'43', N'MD0012', N'SWAB', N'11', N'1', N'2026-03-04 14:47:21.797', N'ไม้พันสำลี', N'1', N'2', N'2026-03-04 14:47:21.797', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'44', N'MD0013', N'COTTON  BALL', N'11', N'1', N'2026-03-04 14:47:21.817', N'สำลี ชนิดก้อนกลม (ถุงใหญ่-ตราพยาบาล)', N'1', N'1', N'2026-03-04 14:47:21.817', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'45', N'MD0014', N'ETHYL  ALC.  ', N'9', N'1', N'2026-03-04 14:47:21.837', N'แอลกอฮอล์ฆ่าเชื้อโรค', N'6', N'42', N'2026-03-04 14:47:21.837', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'46', N'MD0015', N'Plastic  big  box ', N'18', N'1', N'2026-03-04 14:47:21.860', N'ตลับแบ่งยา  ใหญ่', N'20', N'100', N'2026-03-04 14:47:21.860', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'47', N'MD0016', N'Plastic small   bottle', N'1', N'1', N'2026-03-04 14:47:21.873', N'ขวดแบ่งยา  เล็ก', N'20', N'100', N'2026-03-04 14:47:21.873', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'48', N'MD0017', N'POVIDINE ', N'9', N'1', N'2026-03-04 14:47:21.893', N'น้ำยาฆ่าเชื้อสำหรับทาแผล', N'100', N'450', N'2026-03-04 14:47:21.893', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'49', N'MD0018', N'Wooden tongue depressor', N'11', N'1', N'2026-03-04 14:47:21.910', N'ไม้กดลิ้น', N'50', N'100', N'2026-03-04 14:47:21.910', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'50', N'MD0019', N'Sofratulle', N'19', N'1', N'2026-03-04 14:47:21.937', N'ตาข่ายปิดแผล', N'2', N'4', N'2026-03-04 14:47:21.937', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'53', N'MD0020', N'Sterile Water ', N'9', N'1', N'2026-03-04 14:48:18.437', N'นำกลั่นเติม Oxygen', N'1', N'2', N'2026-03-04 14:48:18.437', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'54', N'MD0021', N'Alcohol Gel Clean Me', N'7', N'1', N'2026-03-04 14:48:18.463', N'เจลแอลกอฮอล์ สครับมือ', N'5', N'30', N'2026-03-04 14:48:18.463', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'55', N'MD0022', N'Ammonia', N'9', N'1', N'2026-03-04 14:48:18.480', N'แอมโมเนีย', N'150', N'300', N'2026-03-04 14:48:18.480', N'2')
GO

INSERT INTO [dbo].[items] ([item_id], [item_code], [item_name_en], [usage_unit_id], [is_active], [created_at], [item_name_th], [item_min], [item_max], [update_at], [item_type_id]) VALUES (N'56', N'MD0023', N'Sterile Dressing Set', N'13', N'1', N'2026-03-04 14:48:18.503', N'ชุดทำแผลปลอดเชื้อ', N'3', N'10', N'2026-03-04 14:48:18.503', N'2')
GO

SET IDENTITY_INSERT [dbo].[items] OFF
GO


-- ----------------------------
-- Table structure for movement_types
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[movement_types]') AND type IN ('U'))
	DROP TABLE [dbo].[movement_types]
GO

CREATE TABLE [dbo].[movement_types] (
  [movement_type_code] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [direction] int  NOT NULL,
  [affect_on_hand] bit DEFAULT 1 NOT NULL,
  [display_name_th] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [display_name_en] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [description] nvarchar(255) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[movement_types] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of movement_types
-- ----------------------------
INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'ADJUST_IN', N'1', N'1', N'ปรับเพิ่มสต็อก', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'ADJUST_OUT', N'-1', N'1', N'ปรับลดสต็อก', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'INITIAL_LOAD', N'1', N'1', N'ตั้งยอดเริ่มต้น', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'ISSUE', N'-1', N'1', N'จ่ายออกจากคลัง', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'RECEIVE', N'1', N'1', N'รับเข้าสต็อก', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'RETURN', N'1', N'1', N'รับคืนเข้าสต็อก', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'USAGE', N'-1', N'1', N'ใช้ยา/เวชภัณฑ์', NULL, NULL)
GO

INSERT INTO [dbo].[movement_types] ([movement_type_code], [direction], [affect_on_hand], [display_name_th], [display_name_en], [description]) VALUES (N'WITHDRAW', N'-1', N'1', N'เบิกออกไปใช้', NULL, NULL)
GO


-- ----------------------------
-- Table structure for patient_allergies
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_allergies]') AND type IN ('U'))
	DROP TABLE [dbo].[patient_allergies]
GO

CREATE TABLE [dbo].[patient_allergies] (
  [allergy_id] int  IDENTITY(1,1) NOT NULL,
  [patient_id] int  NOT NULL,
  [item_id] int  NULL,
  [drug_name] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [reaction] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [severity] nvarchar(20) COLLATE Thai_CI_AS DEFAULT 'MILD' NULL,
  [noted_at] date  NOT NULL,
  [noted_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [allergy_type] nvarchar(20) COLLATE Thai_CI_AS DEFAULT 'DRUG' NOT NULL,
  [source] nvarchar(30) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[patient_allergies] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of patient_allergies
-- ----------------------------
SET IDENTITY_INSERT [dbo].[patient_allergies] ON
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'1', N'3', NULL, N'ยาแก้ปวด', N'ผื่นลมพิษ คันตามตัว', N'MILD', N'2026-03-27', N'8300', N'1', N'DRUG', N'SELF_REPORT')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'2', N'3', N'0', N'ยาแก้ปวด', N'ผื่นลมพิษ คันตามตัว', N'MILD', N'2026-03-27', N'8300', N'1', N'DRUG', N'SELF_REPORT')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'3', N'2', N'0', N'Penicillin', N'ผื่นลมพิษ คันตามตัว2', N'MILD', N'2026-03-27', N'8300', N'1', N'DRUG', N'SELF_REPORT')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'4', N'2', N'2', N'', N'ตัวร้อน', N'SEVERE', N'2026-03-27', N'8300', N'1', N'DRUG', N'MEDICAL_RECORD')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'5', N'4', N'0', N'พี่บอล', N'ใจสั่น', N'SEVERE', N'2026-03-27', N'8300', N'1', N'FOOD', N'')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'6', N'6', N'0', N'ตัวเอ', N'ใจสั่น', N'SEVERE', N'2026-03-27', N'8300', N'1', N'FOOD', N'')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'8', N'3', N'0', N'ตัวเอง', N'ใจสั่น', N'SEVERE', N'2026-03-27', N'8300', N'0', N'FOOD', N'')
GO

INSERT INTO [dbo].[patient_allergies] ([allergy_id], [patient_id], [item_id], [drug_name], [reaction], [severity], [noted_at], [noted_by], [is_active], [allergy_type], [source]) VALUES (N'12', N'3', N'0', N'ตัวเอง', N'ใจสั่น', N'SEVERE', N'2026-03-27', N'8300', N'1', N'FOOD', N'')
GO

SET IDENTITY_INSERT [dbo].[patient_allergies] OFF
GO


-- ----------------------------
-- Table structure for patient_physical_info
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_physical_info]') AND type IN ('U'))
	DROP TABLE [dbo].[patient_physical_info]
GO

CREATE TABLE [dbo].[patient_physical_info] (
  [physical_id] int  IDENTITY(1,1) NOT NULL,
  [patient_id] int  NOT NULL,
  [weight_kg] decimal(5,2)  NOT NULL,
  [height_cm] decimal(5,2)  NOT NULL,
  [bmi] AS (round([weight_kg]/power([height_cm]/(100.0),(2)),(2))) PERSISTED,
  [waist_cm] decimal(5,2)  NULL,
  [measured_at] date  NOT NULL,
  [measured_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [note] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[patient_physical_info] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of patient_physical_info
-- ----------------------------
SET IDENTITY_INSERT [dbo].[patient_physical_info] ON
GO

SET IDENTITY_INSERT [dbo].[patient_physical_info] OFF
GO


-- ----------------------------
-- Table structure for patient_profiles
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_profiles]') AND type IN ('U'))
	DROP TABLE [dbo].[patient_profiles]
GO

CREATE TABLE [dbo].[patient_profiles] (
  [patient_id] int  IDENTITY(1,1) NOT NULL,
  [patient_type] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [employee_id] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [external_person_id] int  NULL,
  [no_known_allergy] bit DEFAULT 0 NOT NULL,
  [no_known_allergy_confirmed_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [no_known_allergy_confirmed_at] datetime  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL
)
GO

ALTER TABLE [dbo].[patient_profiles] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of patient_profiles
-- ----------------------------
SET IDENTITY_INSERT [dbo].[patient_profiles] ON
GO

INSERT INTO [dbo].[patient_profiles] ([patient_id], [patient_type], [employee_id], [external_person_id], [no_known_allergy], [no_known_allergy_confirmed_by], [no_known_allergy_confirmed_at], [created_at], [created_by]) VALUES (N'2', N'EMP', N'8300', NULL, N'0', NULL, NULL, N'2026-03-27 10:22:20.663', N'8300')
GO

INSERT INTO [dbo].[patient_profiles] ([patient_id], [patient_type], [employee_id], [external_person_id], [no_known_allergy], [no_known_allergy_confirmed_by], [no_known_allergy_confirmed_at], [created_at], [created_by]) VALUES (N'3', N'EXT', NULL, N'1', N'0', NULL, NULL, N'2026-03-27 10:24:44.417', N'8300')
GO

INSERT INTO [dbo].[patient_profiles] ([patient_id], [patient_type], [employee_id], [external_person_id], [no_known_allergy], [no_known_allergy_confirmed_by], [no_known_allergy_confirmed_at], [created_at], [created_by]) VALUES (N'4', N'EMP', N'8304', NULL, N'0', NULL, NULL, N'2026-03-27 11:02:34.620', N'8300')
GO

INSERT INTO [dbo].[patient_profiles] ([patient_id], [patient_type], [employee_id], [external_person_id], [no_known_allergy], [no_known_allergy_confirmed_by], [no_known_allergy_confirmed_at], [created_at], [created_by]) VALUES (N'6', N'EXT', NULL, N'2', N'0', NULL, NULL, N'2026-03-27 11:25:49.893', N'8300')
GO

SET IDENTITY_INSERT [dbo].[patient_profiles] OFF
GO


-- ----------------------------
-- Table structure for patient_social_security
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_social_security]') AND type IN ('U'))
	DROP TABLE [dbo].[patient_social_security]
GO

CREATE TABLE [dbo].[patient_social_security] (
  [ss_id] int  IDENTITY(1,1) NOT NULL,
  [patient_id] int  NOT NULL,
  [hospital_id] int  NULL,
  [effective_year] int  NULL,
  [note] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL,
  [ss_status] nvarchar(20) COLLATE Thai_CI_AS DEFAULT 'ACTIVE' NOT NULL
)
GO

ALTER TABLE [dbo].[patient_social_security] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of patient_social_security
-- ----------------------------
SET IDENTITY_INSERT [dbo].[patient_social_security] ON
GO

SET IDENTITY_INSERT [dbo].[patient_social_security] OFF
GO


-- ----------------------------
-- Table structure for patient_underlying_diseases
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[patient_underlying_diseases]') AND type IN ('U'))
	DROP TABLE [dbo].[patient_underlying_diseases]
GO

CREATE TABLE [dbo].[patient_underlying_diseases] (
  [condition_id] int  IDENTITY(1,1) NOT NULL,
  [patient_id] int  NOT NULL,
  [disease_name] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [sub_group_id] int  NULL,
  [diagnosed_year] int  NULL,
  [note] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [control_status] nvarchar(30) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[patient_underlying_diseases] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of patient_underlying_diseases
-- ----------------------------
SET IDENTITY_INSERT [dbo].[patient_underlying_diseases] ON
GO

SET IDENTITY_INSERT [dbo].[patient_underlying_diseases] OFF
GO


-- ----------------------------
-- Table structure for po_approvals
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[po_approvals]') AND type IN ('U'))
	DROP TABLE [dbo].[po_approvals]
GO

CREATE TABLE [dbo].[po_approvals] (
  [approval_id] int  IDENTITY(1,1) NOT NULL,
  [po_id] int  NOT NULL,
  [approval_level] int  NOT NULL,
  [approval_role] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [status] varchar(20) COLLATE Thai_CI_AS DEFAULT 'PENDING' NOT NULL,
  [actioned_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [actioned_at] datetime  NULL,
  [remark] nvarchar(200) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[po_approvals] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of po_approvals
-- ----------------------------
SET IDENTITY_INSERT [dbo].[po_approvals] ON
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'1', N'3', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-20 11:53:23.377', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'2', N'3', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-20 11:53:33.267', N'OK2')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'3', N'3', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-20 11:53:46.350', N'OK3')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'4', N'4', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-26 15:25:18.887', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'5', N'4', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-26 15:25:26.653', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'6', N'4', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-26 15:25:37.200', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'7', N'5', N'1', N'GROUP_LEAD', N'APPROVE', N'0027', N'2026-03-26 15:41:03.110', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'8', N'5', N'2', N'MANAGER', N'APPROVE', N'1547', N'2026-03-26 15:41:11.823', N'OK')
GO

INSERT INTO [dbo].[po_approvals] ([approval_id], [po_id], [approval_level], [approval_role], [status], [actioned_by], [actioned_at], [remark]) VALUES (N'9', N'5', N'3', N'DEPARTMENT', N'APPROVE', N'3346', N'2026-03-26 15:41:43.320', N'OK')
GO

SET IDENTITY_INSERT [dbo].[po_approvals] OFF
GO


-- ----------------------------
-- Table structure for po_headers
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[po_headers]') AND type IN ('U'))
	DROP TABLE [dbo].[po_headers]
GO

CREATE TABLE [dbo].[po_headers] (
  [po_id] int  IDENTITY(1,1) NOT NULL,
  [po_no] varchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [po_date] date  NOT NULL,
  [supplier_id] int  NOT NULL,
  [due_date] date  NULL,
  [status] varchar(30) COLLATE Thai_CI_AS DEFAULT 'DRAFT' NOT NULL,
  [note] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[po_headers] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of po_headers
-- ----------------------------
SET IDENTITY_INSERT [dbo].[po_headers] ON
GO

INSERT INTO [dbo].[po_headers] ([po_id], [po_no], [po_date], [supplier_id], [due_date], [status], [note], [created_at], [created_by], [updated_by], [updated_at]) VALUES (N'3', N'PO202603-001', N'2026-03-20', N'1', N'2026-03-30', N'PARTIAL', N'แก้ไขเพิ่ม DICLOFENAC และขยาย due_date', N'2026-03-20 11:48:23.170', N'8300', N'8300', N'2026-03-20 11:50:47.093')
GO

INSERT INTO [dbo].[po_headers] ([po_id], [po_no], [po_date], [supplier_id], [due_date], [status], [note], [created_at], [created_by], [updated_by], [updated_at]) VALUES (N'4', N'PO202603-002', N'2026-03-26', N'1', N'2026-04-01', N'CANCELLED', N'ออก po รวมยาที่ยืม | ยกเลิก: ลืมใส่ยืม', N'2026-03-26 15:23:21.850', N'8300', N'8300', N'2026-03-26 15:35:16.160')
GO

INSERT INTO [dbo].[po_headers] ([po_id], [po_no], [po_date], [supplier_id], [due_date], [status], [note], [created_at], [created_by], [updated_by], [updated_at]) VALUES (N'5', N'PO202603-003', N'2026-03-26', N'1', N'2026-04-01', N'PARTIAL', N'ออก po รวมยาที่ยืม', N'2026-03-26 15:40:13.490', N'8300', NULL, NULL)
GO

SET IDENTITY_INSERT [dbo].[po_headers] OFF
GO


-- ----------------------------
-- Table structure for po_lines
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[po_lines]') AND type IN ('U'))
	DROP TABLE [dbo].[po_lines]
GO

CREATE TABLE [dbo].[po_lines] (
  [po_line_id] int  IDENTITY(1,1) NOT NULL,
  [po_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [qty_order] decimal(18,4)  NOT NULL,
  [qty_received] decimal(18,4) DEFAULT 0 NOT NULL,
  [unit_price] decimal(18,4) DEFAULT 0 NOT NULL,
  [total_price] AS ([qty_order]*[unit_price]) PERSISTED,
  [remark] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [line_type] varchar(10) COLLATE Thai_CI_AS DEFAULT 'ORDER' NOT NULL,
  [borrow_line_id] int  NULL
)
GO

ALTER TABLE [dbo].[po_lines] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of po_lines
-- ----------------------------
SET IDENTITY_INSERT [dbo].[po_lines] ON
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'10', N'3', N'5', N'150.0000', N'150.0000', N'0.5000', NULL, N'BORROW', N'4')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'11', N'3', N'10', N'200.0000', N'200.0000', N'0.1500', NULL, N'BORROW', N'5')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'12', N'3', N'21', N'50.0000', N'50.0000', N'2.5000', NULL, N'BORROW', N'6')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'13', N'3', N'9', N'100.0000', N'100.0000', N'3.0000', NULL, N'BORROW', N'7')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'14', N'3', N'2', N'10.0000', N'10.0000', N'60.0000', NULL, N'BORROW', N'8')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'15', N'3', N'4', N'20.0000', N'20.0000', N'150.0000', NULL, N'BORROW', N'9')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'16', N'3', N'7', N'2.0000', N'2.0000', N'285.0000', NULL, N'BORROW', N'10')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'17', N'3', N'14', N'5.0000', N'5.0000', N'680.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'18', N'3', N'10', N'300.0000', N'200.0000', N'0.1500', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'19', N'3', N'16', N'200.0000', N'200.0000', N'2.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'20', N'3', N'22', N'150.0000', N'150.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'21', N'3', N'12', N'100.0000', N'100.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'22', N'4', N'1', N'62.0000', N'0.0000', N'4.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'23', N'4', N'2', N'7.0000', N'0.0000', N'60.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'24', N'4', N'3', N'4.0000', N'0.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'25', N'4', N'4', N'19.0000', N'0.0000', N'150.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'26', N'4', N'5', N'84.0000', N'0.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'27', N'4', N'6', N'51.0000', N'0.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'28', N'4', N'7', N'1.0000', N'0.0000', N'285.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'29', N'4', N'8', N'42.0000', N'0.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'30', N'4', N'9', N'88.0000', N'0.0000', N'3.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'31', N'4', N'10', N'133.0000', N'0.0000', N'0.1500', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'32', N'4', N'11', N'22.0000', N'0.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'33', N'4', N'12', N'145.0000', N'0.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'34', N'4', N'13', N'9.0000', N'0.0000', N'75.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'35', N'4', N'14', N'73.0000', N'0.0000', N'680.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'36', N'4', N'15', N'3.0000', N'0.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'37', N'4', N'16', N'97.0000', N'0.0000', N'2.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'38', N'4', N'17', N'66.0000', N'0.0000', N'0.4500', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'39', N'4', N'18', N'4.0000', N'0.0000', N'420.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'40', N'4', N'19', N'17.0000', N'0.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'41', N'4', N'20', N'2.0000', N'0.0000', N'96.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'42', N'4', N'21', N'240.0000', N'0.0000', N'2.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'43', N'4', N'22', N'111.0000', N'0.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'44', N'4', N'23', N'6.0000', N'0.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'45', N'4', N'24', N'33.0000', N'0.0000', N'10.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'46', N'4', N'25', N'41.0000', N'0.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'47', N'4', N'26', N'8.0000', N'0.0000', N'70.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'48', N'4', N'27', N'12.0000', N'0.0000', N'2.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'49', N'4', N'28', N'14.0000', N'0.0000', N'7.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'50', N'4', N'29', N'1.0000', N'0.0000', N'40.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'51', N'4', N'30', N'150.0000', N'0.0000', N'45.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'52', N'4', N'31', N'98.0000', N'0.0000', N'280.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'53', N'4', N'32', N'5.0000', N'0.0000', N'25.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'54', N'4', N'33', N'5.0000', N'0.0000', N'15.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'55', N'4', N'34', N'47.0000', N'0.0000', N'80.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'56', N'4', N'35', N'4.0000', N'0.0000', N'60.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'57', N'4', N'36', N'3.0000', N'0.0000', N'80.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'58', N'4', N'37', N'2.0000', N'0.0000', N'70.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'59', N'4', N'38', N'5.0000', N'0.0000', N'10.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'60', N'4', N'39', N'2.0000', N'0.0000', N'25.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'61', N'4', N'40', N'1.0000', N'0.0000', N'15.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'62', N'4', N'41', N'11.0000', N'0.0000', N'1.3000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'63', N'4', N'42', N'1.0000', N'0.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'64', N'4', N'43', N'1.0000', N'0.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'65', N'4', N'44', N'1.0000', N'0.0000', N'145.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'66', N'4', N'45', N'6.0000', N'0.0000', N'45.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'67', N'4', N'46', N'15.0000', N'0.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'68', N'4', N'47', N'8.0000', N'0.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'69', N'4', N'48', N'25.0000', N'0.0000', N'150.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'70', N'4', N'49', N'18.0000', N'0.0000', N'78.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'71', N'4', N'50', N'1.0000', N'0.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'72', N'4', N'53', N'1.0000', N'0.0000', N'40.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'73', N'4', N'54', N'4.0000', N'0.0000', N'390.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'74', N'4', N'55', N'7.0000', N'0.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'75', N'4', N'56', N'2.0000', N'0.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'76', N'5', N'1', N'62.0000', N'124.0000', N'4.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'77', N'5', N'2', N'7.0000', N'7.0000', N'60.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'78', N'5', N'3', N'4.0000', N'8.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'79', N'5', N'4', N'19.0000', N'19.0000', N'150.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'80', N'5', N'5', N'84.0000', N'168.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'81', N'5', N'6', N'51.0000', N'51.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'82', N'5', N'7', N'1.0000', N'2.0000', N'285.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'83', N'5', N'8', N'42.0000', N'42.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'84', N'5', N'9', N'88.0000', N'176.0000', N'3.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'85', N'5', N'10', N'133.0000', N'133.0000', N'0.1500', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'86', N'5', N'11', N'22.0000', N'44.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'87', N'5', N'12', N'145.0000', N'145.0000', N'0.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'88', N'5', N'13', N'9.0000', N'18.0000', N'75.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'89', N'5', N'14', N'73.0000', N'73.0000', N'680.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'90', N'5', N'15', N'3.0000', N'6.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'91', N'5', N'16', N'97.0000', N'97.0000', N'2.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'92', N'5', N'17', N'66.0000', N'132.0000', N'0.4500', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'93', N'5', N'18', N'4.0000', N'4.0000', N'420.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'94', N'5', N'19', N'17.0000', N'34.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'95', N'5', N'20', N'2.0000', N'2.0000', N'96.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'96', N'5', N'21', N'240.0000', N'480.0000', N'2.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'97', N'5', N'22', N'111.0000', N'111.0000', N'1.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'98', N'5', N'23', N'6.0000', N'12.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'99', N'5', N'24', N'33.0000', N'10.0000', N'10.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'100', N'5', N'25', N'41.0000', N'82.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'101', N'5', N'26', N'8.0000', N'8.0000', N'70.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'102', N'5', N'27', N'12.0000', N'24.0000', N'2.5000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'103', N'5', N'28', N'14.0000', N'14.0000', N'7.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'104', N'5', N'29', N'1.0000', N'2.0000', N'40.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'105', N'5', N'30', N'150.0000', N'150.0000', N'45.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'106', N'5', N'31', N'98.0000', N'196.0000', N'280.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'107', N'5', N'32', N'5.0000', N'5.0000', N'25.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'108', N'5', N'33', N'5.0000', N'10.0000', N'15.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'109', N'5', N'34', N'47.0000', N'47.0000', N'80.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'110', N'5', N'35', N'4.0000', N'8.0000', N'60.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'111', N'5', N'36', N'3.0000', N'3.0000', N'80.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'112', N'5', N'37', N'2.0000', N'4.0000', N'70.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'113', N'5', N'38', N'5.0000', N'5.0000', N'10.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'114', N'5', N'39', N'2.0000', N'4.0000', N'25.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'115', N'5', N'40', N'1.0000', N'1.0000', N'15.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'116', N'5', N'41', N'11.0000', N'22.0000', N'1.3000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'117', N'5', N'42', N'1.0000', N'1.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'118', N'5', N'43', N'1.0000', N'2.0000', N'35.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'119', N'5', N'44', N'1.0000', N'1.0000', N'145.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'120', N'5', N'45', N'6.0000', N'12.0000', N'45.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'121', N'5', N'46', N'15.0000', N'15.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'122', N'5', N'47', N'8.0000', N'16.0000', N'1.8000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'123', N'5', N'48', N'25.0000', N'25.0000', N'150.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'124', N'5', N'49', N'18.0000', N'36.0000', N'78.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'125', N'5', N'50', N'1.0000', N'1.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'126', N'5', N'53', N'1.0000', N'2.0000', N'40.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'127', N'5', N'54', N'4.0000', N'4.0000', N'390.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'128', N'5', N'55', N'7.0000', N'14.0000', N'18.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'129', N'5', N'56', N'2.0000', N'2.0000', N'20.0000', NULL, N'ORDER', NULL)
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'130', N'5', N'20', N'10.0000', N'2.0000', N'96.0000', NULL, N'BORROW', N'15')
GO

INSERT INTO [dbo].[po_lines] ([po_line_id], [po_id], [item_id], [qty_order], [qty_received], [unit_price], [remark], [line_type], [borrow_line_id]) VALUES (N'131', N'5', N'24', N'10.0000', N'10.0000', N'10.0000', NULL, N'BORROW', N'16')
GO

SET IDENTITY_INSERT [dbo].[po_lines] OFF
GO


-- ----------------------------
-- Table structure for refer_types
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[refer_types]') AND type IN ('U'))
	DROP TABLE [dbo].[refer_types]
GO

CREATE TABLE [dbo].[refer_types] (
  [refer_type_id] int  IDENTITY(1,1) NOT NULL,
  [refer_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [refer_name_th] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [refer_name_en] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [sort_order] int DEFAULT 0 NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL
)
GO

ALTER TABLE [dbo].[refer_types] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of refer_types
-- ----------------------------
SET IDENTITY_INSERT [dbo].[refer_types] ON
GO

INSERT INTO [dbo].[refer_types] ([refer_type_id], [refer_code], [refer_name_th], [refer_name_en], [sort_order], [is_active]) VALUES (N'1', N'EMERGENCY', N'ส่งด่วนฉุกเฉิน', N'Emergency Refer', N'1', N'1')
GO

INSERT INTO [dbo].[refer_types] ([refer_type_id], [refer_code], [refer_name_th], [refer_name_en], [sort_order], [is_active]) VALUES (N'2', N'REST_REFER', N'นอนพักและส่งโรงพยาบาล', N'Rest & Refer', N'2', N'1')
GO

INSERT INTO [dbo].[refer_types] ([refer_type_id], [refer_code], [refer_name_th], [refer_name_en], [sort_order], [is_active]) VALUES (N'3', N'ACCIDENT_REFER', N'อุบัติเหตุในงานและส่งโรงพยาบาล', N'Accident In Work & Refer', N'3', N'1')
GO

INSERT INTO [dbo].[refer_types] ([refer_type_id], [refer_code], [refer_name_th], [refer_name_en], [sort_order], [is_active]) VALUES (N'4', N'DRESSING_REFER', N'ทำแผลและส่งโรงพยาบาล', N'Dressing & Refer', N'4', N'1')
GO

SET IDENTITY_INSERT [dbo].[refer_types] OFF
GO


-- ----------------------------
-- Table structure for stock_adjustment_lines
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_adjustment_lines]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_adjustment_lines]
GO

CREATE TABLE [dbo].[stock_adjustment_lines] (
  [line_id] int  IDENTITY(1,1) NOT NULL,
  [adjustment_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [system_qty_base] int  NOT NULL,
  [counted_qty_base] int  NOT NULL,
  [diff_qty_base] int  NOT NULL,
  [line_reason] nvarchar(500) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[stock_adjustment_lines] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_adjustment_lines
-- ----------------------------
SET IDENTITY_INSERT [dbo].[stock_adjustment_lines] ON
GO

SET IDENTITY_INSERT [dbo].[stock_adjustment_lines] OFF
GO


-- ----------------------------
-- Table structure for stock_adjustments
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_adjustments]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_adjustments]
GO

CREATE TABLE [dbo].[stock_adjustments] (
  [adjustment_id] int  IDENTITY(1,1) NOT NULL,
  [adjustment_month] int  NOT NULL,
  [adjustment_year] int  NOT NULL,
  [status] nvarchar(20) COLLATE Thai_CI_AS DEFAULT 'DRAFT' NOT NULL,
  [reason] nvarchar(500) COLLATE Thai_CI_AS  NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [posted_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [posted_at] datetime  NULL,
  [reversal_of_id] int  NULL
)
GO

ALTER TABLE [dbo].[stock_adjustments] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_adjustments
-- ----------------------------
SET IDENTITY_INSERT [dbo].[stock_adjustments] ON
GO

SET IDENTITY_INSERT [dbo].[stock_adjustments] OFF
GO


-- ----------------------------
-- Table structure for stock_movements
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_movements]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_movements]
GO

CREATE TABLE [dbo].[stock_movements] (
  [movement_id] bigint  IDENTITY(1,1) NOT NULL,
  [movement_type] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [item_id] int  NOT NULL,
  [qty_base] int  NOT NULL,
  [ref_type] nvarchar(30) COLLATE Thai_CI_AS  NOT NULL,
  [ref_id] varchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [reason] nvarchar(500) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[stock_movements] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_movements
-- ----------------------------
SET IDENTITY_INSERT [dbo].[stock_movements] ON
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'1', N'INITIAL_LOAD', N'1', N'110', N'', N'', N'8300', N'2026-03-16 13:47:11.710', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'2', N'INITIAL_LOAD', N'2', N'58', N'', N'', N'8300', N'2026-03-16 13:47:11.710', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'3', N'INITIAL_LOAD', N'3', N'108', N'', N'', N'8300', N'2026-03-16 09:06:22.120', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'4', N'INITIAL_LOAD', N'4', N'18', N'', N'', N'8300', N'2026-03-12 14:11:37.760', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'5', N'INITIAL_LOAD', N'5', N'52', N'', N'', N'8300', N'2026-03-12 14:11:37.760', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'6', N'INITIAL_LOAD', N'6', N'8', N'', N'', N'8300', N'2026-03-05 13:36:58.583', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'7', N'INITIAL_LOAD', N'7', N'25', N'', N'', N'8300', N'2026-03-05 14:38:03.973', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'8', N'INITIAL_LOAD', N'8', N'90', N'', N'', N'8300', N'2026-03-05 14:38:03.973', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'9', N'INITIAL_LOAD', N'9', N'97', N'', N'', N'8300', N'2026-03-05 13:36:58.620', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'10', N'INITIAL_LOAD', N'10', N'228', N'', N'', N'8300', N'2026-03-12 11:02:57.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'11', N'INITIAL_LOAD', N'11', N'16', N'', N'', N'8300', N'2026-03-05 13:36:58.663', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'12', N'INITIAL_LOAD', N'12', N'64', N'', N'', N'8300', N'2026-03-05 13:36:58.590', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'13', N'INITIAL_LOAD', N'13', N'17', N'', N'', N'8300', N'2026-03-05 13:36:58.730', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'14', N'INITIAL_LOAD', N'14', N'79', N'', N'', N'8300', N'2026-03-05 13:36:58.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'15', N'INITIAL_LOAD', N'15', N'3', N'', N'', N'8300', N'2026-03-05 13:36:58.727', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'16', N'INITIAL_LOAD', N'16', N'131', N'', N'', N'8300', N'2026-03-05 13:36:58.610', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'17', N'INITIAL_LOAD', N'17', N'159', N'', N'', N'8300', N'2026-03-05 13:36:58.677', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'18', N'INITIAL_LOAD', N'18', N'6', N'', N'', N'8300', N'2026-03-05 13:36:58.773', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'19', N'INITIAL_LOAD', N'19', N'29', N'', N'', N'8300', N'2026-03-05 13:36:58.663', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'20', N'INITIAL_LOAD', N'20', N'5', N'', N'', N'8300', N'2026-03-05 13:36:58.697', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'21', N'INITIAL_LOAD', N'21', N'186', N'', N'', N'8300', N'2026-03-05 13:36:58.573', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'22', N'INITIAL_LOAD', N'22', N'111', N'', N'', N'8300', N'2026-03-05 13:36:58.587', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'23', N'INITIAL_LOAD', N'23', N'17', N'', N'', N'8300', N'2026-03-05 13:36:58.747', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'24', N'INITIAL_LOAD', N'24', N'1', N'', N'', N'8300', N'2026-03-05 13:36:58.620', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'25', N'INITIAL_LOAD', N'25', N'0', N'', N'', N'8300', N'2026-03-05 15:30:28.887', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'26', N'INITIAL_LOAD', N'26', N'13', N'', N'', N'8300', N'2026-03-05 13:36:58.697', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'27', N'INITIAL_LOAD', N'27', N'1', N'', N'', N'8300', N'2026-03-05 13:36:58.600', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'28', N'INITIAL_LOAD', N'28', N'16', N'', N'', N'8300', N'2026-03-05 13:36:58.707', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'29', N'INITIAL_LOAD', N'29', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.773', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'30', N'INITIAL_LOAD', N'30', N'252', N'', N'', N'8300', N'2026-03-05 13:36:58.760', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'31', N'INITIAL_LOAD', N'31', N'113', N'', N'', N'8300', N'2026-03-05 13:36:58.657', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'32', N'INITIAL_LOAD', N'32', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.713', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'33', N'INITIAL_LOAD', N'33', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.720', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'34', N'INITIAL_LOAD', N'34', N'59', N'', N'', N'8300', N'2026-03-05 13:36:58.693', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'35', N'INITIAL_LOAD', N'35', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.710', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'36', N'INITIAL_LOAD', N'36', N'4', N'', N'', N'8300', N'2026-03-05 13:36:58.733', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'37', N'INITIAL_LOAD', N'37', N'2', N'', N'', N'8300', N'2026-03-05 13:36:58.753', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'38', N'INITIAL_LOAD', N'38', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.740', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'39', N'INITIAL_LOAD', N'39', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.743', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'40', N'INITIAL_LOAD', N'40', N'1', N'', N'', N'8300', N'2026-03-05 13:36:58.750', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'41', N'INITIAL_LOAD', N'41', N'17', N'', N'', N'8300', N'2026-03-05 13:36:58.673', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'42', N'INITIAL_LOAD', N'42', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.763', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'43', N'INITIAL_LOAD', N'43', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.767', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'44', N'INITIAL_LOAD', N'44', N'0', N'', N'', N'8300', N'2026-03-05 13:36:58.780', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'45', N'INITIAL_LOAD', N'45', N'9', N'', N'', N'8300', N'2026-03-05 13:36:58.690', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'46', N'INITIAL_LOAD', N'46', N'34', N'', N'', N'8300', N'2026-03-05 13:36:58.633', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'47', N'INITIAL_LOAD', N'47', N'16', N'', N'', N'8300', N'2026-03-05 13:36:58.640', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'48', N'INITIAL_LOAD', N'48', N'152', N'', N'', N'8300', N'2026-03-05 13:36:58.653', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'49', N'INITIAL_LOAD', N'49', N'31', N'', N'', N'8300', N'2026-03-05 13:36:58.630', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'50', N'INITIAL_LOAD', N'50', N'2', N'', N'', N'8300', N'2026-03-05 13:36:58.770', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'52', N'INITIAL_LOAD', N'53', N'1', N'', N'', N'8300', N'2026-03-05 13:36:58.783', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'53', N'INITIAL_LOAD', N'54', N'5', N'', N'', N'8300', N'2026-03-05 13:36:58.717', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'54', N'INITIAL_LOAD', N'55', N'14', N'', N'', N'8300', N'2026-03-05 13:36:58.563', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'55', N'INITIAL_LOAD', N'56', N'3', N'', N'', N'8300', N'2026-03-05 13:36:58.730', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'56', N'RECEIVE', N'5', N'150', N'BORROW', N'BR202603-001', N'8300', N'2026-03-20 11:19:53.887', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'57', N'RECEIVE', N'10', N'200', N'BORROW', N'BR202603-001', N'8300', N'2026-03-20 11:19:53.887', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'58', N'RECEIVE', N'21', N'50', N'BORROW', N'BR202603-001', N'8300', N'2026-03-20 11:19:53.887', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'59', N'RECEIVE', N'9', N'100', N'BORROW', N'BR202603-001', N'8300', N'2026-03-20 11:19:53.887', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'60', N'RECEIVE', N'2', N'120', N'BORROW', N'BR202603-002', N'8300', N'2026-03-20 11:31:59.140', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'61', N'RECEIVE', N'4', N'280', N'BORROW', N'BR202603-002', N'8300', N'2026-03-20 11:31:59.140', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'62', N'RECEIVE', N'7', N'24', N'BORROW', N'BR202603-002', N'8300', N'2026-03-20 11:31:59.140', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'63', N'RECEIVE', N'10', N'30', N'GR', N'GR202603-001', N'8300', N'2026-03-20 12:00:36.130', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'64', N'RECEIVE', N'10', N'30', N'GR', N'GR202603-001', N'8300', N'2026-03-20 12:00:36.130', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'65', N'RECEIVE', N'16', N'200', N'GR', N'GR202603-001', N'8300', N'2026-03-20 12:00:36.130', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'66', N'RECEIVE', N'5', N'150', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'67', N'RECEIVE', N'10', N'170', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'68', N'RECEIVE', N'10', N'170', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'69', N'RECEIVE', N'21', N'50', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'70', N'RECEIVE', N'9', N'100', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'71', N'RECEIVE', N'2', N'120', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'72', N'RECEIVE', N'4', N'280', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'73', N'RECEIVE', N'7', N'24', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'74', N'RECEIVE', N'14', N'500', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'75', N'RECEIVE', N'10', N'170', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'76', N'RECEIVE', N'10', N'170', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'77', N'RECEIVE', N'22', N'150', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'78', N'RECEIVE', N'12', N'100', N'GR', N'GR202603-002', N'8300', N'2026-03-20 12:06:23.217', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'79', N'USAGE', N'5', N'10', N'MANUAL', N'MANUAL-001', N'8300', N'1900-01-01 00:00:00.000', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'80', N'USAGE', N'10', N'5', N'MANUAL', N'MANUAL-001', N'8300', N'1900-01-01 00:00:00.000', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'81', N'USAGE', N'5', N'10', N'MANUAL', N'MANUAL-001', N'8300', N'1900-01-01 00:00:00.000', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'82', N'USAGE', N'10', N'5', N'MANUAL', N'MANUAL-001', N'8300', N'1900-01-01 00:00:00.000', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'83', N'RECEIVE', N'20', N'120', N'BORROW', N'BR202603-004', N'8300', N'2026-03-26 15:05:48.597', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'84', N'RECEIVE', N'24', N'10', N'BORROW', N'BR202603-004', N'8300', N'2026-03-26 15:05:48.597', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'85', N'RECEIVE', N'1', N'62', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'86', N'RECEIVE', N'3', N'4', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'87', N'RECEIVE', N'5', N'84', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'88', N'RECEIVE', N'7', N'12', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'89', N'RECEIVE', N'9', N'88', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'90', N'RECEIVE', N'11', N'22', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'91', N'RECEIVE', N'13', N'108', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'92', N'RECEIVE', N'15', N'3', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'93', N'RECEIVE', N'17', N'66', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'94', N'RECEIVE', N'19', N'17', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'95', N'RECEIVE', N'21', N'240', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'96', N'RECEIVE', N'23', N'6', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'97', N'RECEIVE', N'25', N'41', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'98', N'RECEIVE', N'27', N'12', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'99', N'RECEIVE', N'29', N'5', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'100', N'RECEIVE', N'31', N'9800', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'101', N'RECEIVE', N'33', N'5', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'102', N'RECEIVE', N'35', N'320', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'103', N'RECEIVE', N'37', N'400', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'104', N'RECEIVE', N'39', N'914', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'105', N'RECEIVE', N'41', N'1100', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'106', N'RECEIVE', N'43', N'100', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'107', N'RECEIVE', N'45', N'2700', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'108', N'RECEIVE', N'47', N'800', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'109', N'RECEIVE', N'49', N'1800', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'110', N'RECEIVE', N'53', N'1000', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'111', N'RECEIVE', N'55', N'210', N'GR', N'GR202603-004', N'8300', N'2026-03-26 15:50:45.290', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'112', N'RECEIVE', N'1', N'62', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'113', N'RECEIVE', N'3', N'4', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'114', N'RECEIVE', N'5', N'84', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'115', N'RECEIVE', N'7', N'12', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'116', N'RECEIVE', N'9', N'88', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'117', N'RECEIVE', N'11', N'22', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'118', N'RECEIVE', N'13', N'108', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'119', N'RECEIVE', N'15', N'3', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'120', N'RECEIVE', N'17', N'66', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'121', N'RECEIVE', N'19', N'17', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'122', N'RECEIVE', N'21', N'240', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'123', N'RECEIVE', N'23', N'6', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'124', N'RECEIVE', N'25', N'41', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'125', N'RECEIVE', N'27', N'12', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'126', N'RECEIVE', N'29', N'5', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'127', N'RECEIVE', N'31', N'9800', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'128', N'RECEIVE', N'33', N'5', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'129', N'RECEIVE', N'35', N'320', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'130', N'RECEIVE', N'37', N'400', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'131', N'RECEIVE', N'39', N'914', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'132', N'RECEIVE', N'41', N'1100', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'133', N'RECEIVE', N'43', N'100', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'134', N'RECEIVE', N'45', N'2700', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'135', N'RECEIVE', N'47', N'800', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'136', N'RECEIVE', N'49', N'1800', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'137', N'RECEIVE', N'53', N'1000', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'138', N'RECEIVE', N'55', N'210', N'GR', N'GR202603-003', N'8300', N'2026-03-26 15:50:52.650', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'139', N'RECEIVE', N'2', N'84', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'140', N'RECEIVE', N'4', N'266', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'141', N'RECEIVE', N'6', N'51', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'142', N'RECEIVE', N'8', N'42', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'143', N'RECEIVE', N'10', N'133', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'144', N'RECEIVE', N'12', N'145', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'145', N'RECEIVE', N'14', N'7300', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'146', N'RECEIVE', N'16', N'97', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'147', N'RECEIVE', N'18', N'48', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'148', N'RECEIVE', N'20', N'24', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'149', N'RECEIVE', N'20', N'24', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'150', N'RECEIVE', N'22', N'111', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'151', N'RECEIVE', N'24', N'10', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'152', N'RECEIVE', N'24', N'10', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'153', N'RECEIVE', N'26', N'64', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'154', N'RECEIVE', N'28', N'14', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'155', N'RECEIVE', N'30', N'15000', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'156', N'RECEIVE', N'32', N'5', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'157', N'RECEIVE', N'34', N'4700', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'158', N'RECEIVE', N'36', N'240', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'159', N'RECEIVE', N'38', N'5', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'160', N'RECEIVE', N'40', N'100', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'161', N'RECEIVE', N'42', N'500', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'162', N'RECEIVE', N'44', N'1000', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'163', N'RECEIVE', N'46', N'1500', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'164', N'RECEIVE', N'48', N'11250', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'165', N'RECEIVE', N'50', N'10', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'166', N'RECEIVE', N'54', N'20000', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'167', N'RECEIVE', N'56', N'2', N'GR', N'GR202603-005', N'8300', N'2026-03-26 15:57:39.160', NULL)
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'168', N'ADJUST_OUT', N'1', N'204', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 234, Actual: 30)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'169', N'ADJUST_OUT', N'2', N'358', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 382, Actual: 24)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'170', N'ADJUST_OUT', N'3', N'111', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 116, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'171', N'ADJUST_OUT', N'4', N'804', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 844, Actual: 40)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'172', N'ADJUST_OUT', N'5', N'300', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 500, Actual: 200)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'173', N'ADJUST_IN', N'6', N'141', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 59, Actual: 200)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'174', N'ADJUST_OUT', N'7', N'67', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 97, Actual: 30)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'175', N'ADJUST_OUT', N'8', N'32', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 132, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'176', N'ADJUST_OUT', N'9', N'373', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 473, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'177', N'ADJUST_OUT', N'10', N'1191', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 1291, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'178', N'ADJUST_OUT', N'11', N'10', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 60, Actual: 50)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'179', N'ADJUST_OUT', N'12', N'109', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 309, Actual: 200)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'180', N'ADJUST_OUT', N'13', N'223', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 233, Actual: 10)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'181', N'ADJUST_OUT', N'14', N'7859', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 7879, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'182', N'ADJUST_OUT', N'15', N'4', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 9, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'183', N'ADJUST_OUT', N'16', N'328', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 428, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'184', N'ADJUST_OUT', N'17', N'191', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 291, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'185', N'ADJUST_OUT', N'18', N'48', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 54, Actual: 6)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'186', N'ADJUST_OUT', N'19', N'43', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 63, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'187', N'ADJUST_OUT', N'20', N'149', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 173, Actual: 24)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'188', N'ADJUST_OUT', N'21', N'466', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 766, Actual: 300)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'189', N'ADJUST_OUT', N'22', N'172', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 372, Actual: 200)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'190', N'ADJUST_OUT', N'23', N'23', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 29, Actual: 6)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'191', N'ADJUST_IN', N'24', N'19', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 31, Actual: 50)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'192', N'ADJUST_OUT', N'25', N'32', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 82, Actual: 50)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'193', N'ADJUST_OUT', N'26', N'62', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 77, Actual: 15)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'194', N'ADJUST_IN', N'27', N'75', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 25, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'195', N'ADJUST_OUT', N'28', N'6', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 30, Actual: 24)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'196', N'ADJUST_OUT', N'29', N'9', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 10, Actual: 1)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'197', N'ADJUST_OUT', N'30', N'15152', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 15252, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'198', N'ADJUST_OUT', N'31', N'19653', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 19713, Actual: 60)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'199', N'ADJUST_OUT', N'33', N'5', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 10, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'200', N'ADJUST_OUT', N'34', N'4739', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 4759, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'201', N'ADJUST_OUT', N'35', N'635', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 640, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'202', N'ADJUST_OUT', N'36', N'239', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 244, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'203', N'ADJUST_OUT', N'37', N'800', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 802, Actual: 2)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'204', N'ADJUST_OUT', N'39', N'1825', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 1828, Actual: 3)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'205', N'ADJUST_OUT', N'40', N'99', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 101, Actual: 2)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'206', N'ADJUST_OUT', N'41', N'2197', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 2217, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'207', N'ADJUST_OUT', N'42', N'499', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 500, Actual: 1)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'208', N'ADJUST_OUT', N'43', N'199', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 200, Actual: 1)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'209', N'ADJUST_OUT', N'44', N'999', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 1000, Actual: 1)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'210', N'ADJUST_OUT', N'45', N'5403', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 5409, Actual: 6)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'211', N'ADJUST_OUT', N'46', N'1514', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 1534, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'212', N'ADJUST_OUT', N'47', N'1596', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 1616, Actual: 20)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'213', N'ADJUST_OUT', N'48', N'11302', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 11402, Actual: 100)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'214', N'ADJUST_OUT', N'49', N'3581', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 3631, Actual: 50)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'215', N'ADJUST_OUT', N'50', N'10', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 12, Actual: 2)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'216', N'ADJUST_OUT', N'53', N'2000', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 2001, Actual: 1)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'217', N'ADJUST_OUT', N'54', N'20000', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 20005, Actual: 5)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'218', N'ADJUST_OUT', N'55', N'284', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 434, Actual: 150)')
GO

INSERT INTO [dbo].[stock_movements] ([movement_id], [movement_type], [item_id], [qty_base], [ref_type], [ref_id], [created_by], [created_at], [reason]) VALUES (N'219', N'ADJUST_OUT', N'56', N'2', N'PHYSICAL_COUNT', N'ADJ', N'8300', N'2026-03-26 16:01:59.993', N'ปรับครั้งใหญ่ (Movement Sum: 5, Actual: 3)')
GO

SET IDENTITY_INSERT [dbo].[stock_movements] OFF
GO


-- ----------------------------
-- Table structure for stock_on_hand
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_on_hand]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_on_hand]
GO

CREATE TABLE [dbo].[stock_on_hand] (
  [item_id] int  NOT NULL,
  [qty_base] int DEFAULT 0 NOT NULL,
  [updated_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[stock_on_hand] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_on_hand
-- ----------------------------
INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'1', N'30', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'2', N'24', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'3', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'4', N'40', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'5', N'200', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'6', N'200', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'7', N'30', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'8', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'9', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'10', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'11', N'50', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'12', N'200', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'13', N'10', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'14', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'15', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'16', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'17', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'18', N'6', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'19', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'20', N'24', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'21', N'300', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'22', N'200', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'23', N'6', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'24', N'50', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'25', N'50', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'26', N'15', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'27', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'28', N'24', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'29', N'1', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'30', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'31', N'60', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'32', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'33', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'34', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'35', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'36', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'37', N'2', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'38', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'39', N'3', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'40', N'2', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'41', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'42', N'1', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'43', N'1', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'44', N'1', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'45', N'6', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'46', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'47', N'20', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'48', N'100', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'49', N'50', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'50', N'2', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'53', N'1', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'54', N'5', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'55', N'150', N'2026-03-26 16:02:00.000')
GO

INSERT INTO [dbo].[stock_on_hand] ([item_id], [qty_base], [updated_at]) VALUES (N'56', N'3', N'2026-03-26 16:02:00.000')
GO


-- ----------------------------
-- Table structure for stock_period_snapshot
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_period_snapshot]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_period_snapshot]
GO

CREATE TABLE [dbo].[stock_period_snapshot] (
  [snapshot_id] bigint  IDENTITY(1,1) NOT NULL,
  [period_code] varchar(10) COLLATE Thai_CI_AS  NOT NULL,
  [item_id] int  NOT NULL,
  [opening_qty] int  NOT NULL,
  [receipts] int  NOT NULL,
  [issues] int  NOT NULL,
  [adjustments] int  NOT NULL,
  [net_movement] int  NOT NULL,
  [expected_closing] int  NOT NULL,
  [actual_closing] int  NOT NULL,
  [diff_qty] int  NOT NULL,
  [created_at] datetime  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL
)
GO

ALTER TABLE [dbo].[stock_period_snapshot] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_period_snapshot
-- ----------------------------
SET IDENTITY_INSERT [dbo].[stock_period_snapshot] ON
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'1', N'202603-001', N'1', N'110', N'0', N'0', N'0', N'0', N'110', N'110', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'2', N'202603-001', N'2', N'298', N'0', N'0', N'0', N'0', N'298', N'298', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'3', N'202603-001', N'3', N'108', N'0', N'0', N'0', N'0', N'108', N'108', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'4', N'202603-001', N'4', N'578', N'0', N'0', N'0', N'0', N'578', N'578', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'5', N'202603-001', N'5', N'332', N'0', N'0', N'0', N'0', N'332', N'332', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'6', N'202603-001', N'6', N'8', N'0', N'0', N'0', N'0', N'8', N'8', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'7', N'202603-001', N'7', N'73', N'0', N'0', N'0', N'0', N'73', N'73', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'8', N'202603-001', N'8', N'90', N'0', N'0', N'0', N'0', N'90', N'90', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'9', N'202603-001', N'9', N'297', N'0', N'0', N'0', N'0', N'297', N'297', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'10', N'202603-001', N'10', N'1158', N'0', N'0', N'0', N'0', N'1158', N'1158', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'11', N'202603-001', N'11', N'16', N'0', N'0', N'0', N'0', N'16', N'16', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'12', N'202603-001', N'12', N'164', N'0', N'0', N'0', N'0', N'164', N'164', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'13', N'202603-001', N'13', N'17', N'0', N'0', N'0', N'0', N'17', N'17', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'14', N'202603-001', N'14', N'579', N'0', N'0', N'0', N'0', N'579', N'579', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'15', N'202603-001', N'15', N'3', N'0', N'0', N'0', N'0', N'3', N'3', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'16', N'202603-001', N'16', N'331', N'0', N'0', N'0', N'0', N'331', N'331', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'17', N'202603-001', N'17', N'159', N'0', N'0', N'0', N'0', N'159', N'159', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'18', N'202603-001', N'18', N'6', N'0', N'0', N'0', N'0', N'6', N'6', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'19', N'202603-001', N'19', N'29', N'0', N'0', N'0', N'0', N'29', N'29', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'20', N'202603-001', N'20', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'21', N'202603-001', N'21', N'286', N'0', N'0', N'0', N'0', N'286', N'286', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'22', N'202603-001', N'22', N'261', N'0', N'0', N'0', N'0', N'261', N'261', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'23', N'202603-001', N'23', N'17', N'0', N'0', N'0', N'0', N'17', N'17', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'24', N'202603-001', N'24', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'25', N'202603-001', N'25', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'26', N'202603-001', N'26', N'13', N'0', N'0', N'0', N'0', N'13', N'13', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'27', N'202603-001', N'27', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'28', N'202603-001', N'28', N'16', N'0', N'0', N'0', N'0', N'16', N'16', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'29', N'202603-001', N'29', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'30', N'202603-001', N'30', N'252', N'0', N'0', N'0', N'0', N'252', N'252', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'31', N'202603-001', N'31', N'113', N'0', N'0', N'0', N'0', N'113', N'113', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'32', N'202603-001', N'32', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'33', N'202603-001', N'33', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'34', N'202603-001', N'34', N'59', N'0', N'0', N'0', N'0', N'59', N'59', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'35', N'202603-001', N'35', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'36', N'202603-001', N'36', N'4', N'0', N'0', N'0', N'0', N'4', N'4', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'37', N'202603-001', N'37', N'2', N'0', N'0', N'0', N'0', N'2', N'2', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'38', N'202603-001', N'38', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'39', N'202603-001', N'39', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'40', N'202603-001', N'40', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'41', N'202603-001', N'41', N'17', N'0', N'0', N'0', N'0', N'17', N'17', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'42', N'202603-001', N'42', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'43', N'202603-001', N'43', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'44', N'202603-001', N'44', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'45', N'202603-001', N'45', N'9', N'0', N'0', N'0', N'0', N'9', N'9', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'46', N'202603-001', N'46', N'34', N'0', N'0', N'0', N'0', N'34', N'34', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'47', N'202603-001', N'47', N'16', N'0', N'0', N'0', N'0', N'16', N'16', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'48', N'202603-001', N'48', N'152', N'0', N'0', N'0', N'0', N'152', N'152', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'49', N'202603-001', N'49', N'31', N'0', N'0', N'0', N'0', N'31', N'31', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'50', N'202603-001', N'50', N'2', N'0', N'0', N'0', N'0', N'2', N'2', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'51', N'202603-001', N'53', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'52', N'202603-001', N'54', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'53', N'202603-001', N'55', N'14', N'0', N'0', N'0', N'0', N'14', N'14', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'54', N'202603-001', N'56', N'3', N'0', N'0', N'0', N'0', N'3', N'3', N'0', N'2026-03-20 12:13:24.603', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'55', N'202604-002', N'1', N'30', N'0', N'0', N'0', N'0', N'30', N'30', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'56', N'202604-002', N'2', N'24', N'0', N'0', N'0', N'0', N'24', N'24', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'57', N'202604-002', N'3', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'58', N'202604-002', N'4', N'40', N'0', N'0', N'0', N'0', N'40', N'40', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'59', N'202604-002', N'5', N'200', N'0', N'0', N'0', N'0', N'200', N'200', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'60', N'202604-002', N'6', N'200', N'0', N'0', N'0', N'0', N'200', N'200', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'61', N'202604-002', N'7', N'30', N'0', N'0', N'0', N'0', N'30', N'30', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'62', N'202604-002', N'8', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'63', N'202604-002', N'9', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'64', N'202604-002', N'10', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'65', N'202604-002', N'11', N'50', N'0', N'0', N'0', N'0', N'50', N'50', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'66', N'202604-002', N'12', N'200', N'0', N'0', N'0', N'0', N'200', N'200', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'67', N'202604-002', N'13', N'10', N'0', N'0', N'0', N'0', N'10', N'10', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'68', N'202604-002', N'14', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'69', N'202604-002', N'15', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'70', N'202604-002', N'16', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'71', N'202604-002', N'17', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'72', N'202604-002', N'18', N'6', N'0', N'0', N'0', N'0', N'6', N'6', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'73', N'202604-002', N'19', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'74', N'202604-002', N'20', N'24', N'0', N'0', N'0', N'0', N'24', N'24', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'75', N'202604-002', N'21', N'300', N'0', N'0', N'0', N'0', N'300', N'300', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'76', N'202604-002', N'22', N'200', N'0', N'0', N'0', N'0', N'200', N'200', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'77', N'202604-002', N'23', N'6', N'0', N'0', N'0', N'0', N'6', N'6', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'78', N'202604-002', N'24', N'50', N'0', N'0', N'0', N'0', N'50', N'50', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'79', N'202604-002', N'25', N'50', N'0', N'0', N'0', N'0', N'50', N'50', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'80', N'202604-002', N'26', N'15', N'0', N'0', N'0', N'0', N'15', N'15', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'81', N'202604-002', N'27', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'82', N'202604-002', N'28', N'24', N'0', N'0', N'0', N'0', N'24', N'24', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'83', N'202604-002', N'29', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'84', N'202604-002', N'30', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'85', N'202604-002', N'31', N'60', N'0', N'0', N'0', N'0', N'60', N'60', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'86', N'202604-002', N'32', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'87', N'202604-002', N'33', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'88', N'202604-002', N'34', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'89', N'202604-002', N'35', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'90', N'202604-002', N'36', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'91', N'202604-002', N'37', N'2', N'0', N'0', N'0', N'0', N'2', N'2', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'92', N'202604-002', N'38', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'93', N'202604-002', N'39', N'3', N'0', N'0', N'0', N'0', N'3', N'3', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'94', N'202604-002', N'40', N'2', N'0', N'0', N'0', N'0', N'2', N'2', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'95', N'202604-002', N'41', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'96', N'202604-002', N'42', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'97', N'202604-002', N'43', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'98', N'202604-002', N'44', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'99', N'202604-002', N'45', N'6', N'0', N'0', N'0', N'0', N'6', N'6', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'100', N'202604-002', N'46', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'101', N'202604-002', N'47', N'20', N'0', N'0', N'0', N'0', N'20', N'20', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'102', N'202604-002', N'48', N'100', N'0', N'0', N'0', N'0', N'100', N'100', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'103', N'202604-002', N'49', N'50', N'0', N'0', N'0', N'0', N'50', N'50', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'104', N'202604-002', N'50', N'2', N'0', N'0', N'0', N'0', N'2', N'2', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'105', N'202604-002', N'53', N'1', N'0', N'0', N'0', N'0', N'1', N'1', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'106', N'202604-002', N'54', N'5', N'0', N'0', N'0', N'0', N'5', N'5', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'107', N'202604-002', N'55', N'150', N'0', N'0', N'0', N'0', N'150', N'150', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

INSERT INTO [dbo].[stock_period_snapshot] ([snapshot_id], [period_code], [item_id], [opening_qty], [receipts], [issues], [adjustments], [net_movement], [expected_closing], [actual_closing], [diff_qty], [created_at], [created_by]) VALUES (N'108', N'202604-002', N'56', N'3', N'0', N'0', N'0', N'0', N'3', N'3', N'0', N'2026-03-26 16:05:37.133', N'8300')
GO

SET IDENTITY_INSERT [dbo].[stock_period_snapshot] OFF
GO


-- ----------------------------
-- Table structure for stock_periods
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[stock_periods]') AND type IN ('U'))
	DROP TABLE [dbo].[stock_periods]
GO

CREATE TABLE [dbo].[stock_periods] (
  [period_code] varchar(10) COLLATE Thai_CI_AS  NOT NULL,
  [period_start] date  NOT NULL,
  [period_end] date  NOT NULL,
  [created_at] datetime  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [period_status] varchar(20) COLLATE Thai_CI_AS DEFAULT 'OPEN' NOT NULL
)
GO

ALTER TABLE [dbo].[stock_periods] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of stock_periods
-- ----------------------------
INSERT INTO [dbo].[stock_periods] ([period_code], [period_start], [period_end], [created_at], [created_by], [period_status]) VALUES (N'202603-001', N'2026-03-31', N'2026-03-31', N'2026-03-20 12:11:42.987', N'8300', N'SNAPSHOT_DONE')
GO

INSERT INTO [dbo].[stock_periods] ([period_code], [period_start], [period_end], [created_at], [created_by], [period_status]) VALUES (N'202604-002', N'2026-04-01', N'2026-04-01', N'2026-03-26 16:04:43.750', N'8300', N'SNAPSHOT_DONE')
GO


-- ----------------------------
-- Table structure for supplier_price_list
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[supplier_price_list]') AND type IN ('U'))
	DROP TABLE [dbo].[supplier_price_list]
GO

CREATE TABLE [dbo].[supplier_price_list] (
  [price_id] int  IDENTITY(1,1) NOT NULL,
  [supplier_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [unit_id] int  NOT NULL,
  [unit_price] decimal(18,4)  NOT NULL,
  [effective_date] date  NOT NULL,
  [expire_date] date  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [conversion_factor] decimal(18,4) DEFAULT 1 NOT NULL,
  [updated_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [updated_at] datetime  NULL
)
GO

ALTER TABLE [dbo].[supplier_price_list] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of supplier_price_list
-- ----------------------------
SET IDENTITY_INSERT [dbo].[supplier_price_list] ON
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'4', N'1', N'1', N'14', N'1.0000', N'2026-01-01', N'2026-02-28', N'0', N'8300', N'2026-03-13 10:59:28.613', N'1.0000', N'8300', N'2026-03-19 09:55:29.010')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'5', N'1', N'1', N'14', N'4.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-13 10:59:28.617', N'1.0000', N'8300', N'2026-03-19 09:55:29.020')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'6', N'1', N'2', N'14', N'60.0000', N'2026-01-01', NULL, N'1', N'8300', N'2026-03-13 10:59:28.620', N'12.0000', N'8300', N'2026-03-19 09:55:29.033')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'7', N'1', N'3', N'11', N'18.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-13 14:36:21.917', N'1.0000', N'8300', N'2026-03-19 09:55:29.040')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'23', N'1', N'4', N'15', N'150.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:22.900', N'14.0000', N'8300', N'2026-03-19 09:55:29.047')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'25', N'1', N'5', N'14', N'0.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.353', N'1.0000', N'8300', N'2026-03-19 09:55:29.060')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'26', N'1', N'6', N'14', N'1.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.370', N'1.0000', N'8300', N'2026-03-19 09:55:29.070')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'27', N'1', N'7', N'6', N'285.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.390', N'12.0000', N'8300', N'2026-03-19 09:55:29.080')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'28', N'1', N'8', N'14', N'1.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.407', N'1.0000', N'8300', N'2026-03-19 09:55:29.087')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'29', N'1', N'9', N'14', N'3.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.427', N'1.0000', N'8300', N'2026-03-19 09:55:29.093')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'30', N'1', N'10', N'14', N'0.1500', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.450', N'1.0000', N'8300', N'2026-03-19 09:55:29.103')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'31', N'1', N'11', N'14', N'0.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.470', N'1.0000', N'8300', N'2026-03-19 09:55:29.110')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'32', N'1', N'12', N'14', N'0.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.487', N'1.0000', N'8300', N'2026-03-19 09:55:29.120')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'33', N'1', N'13', N'6', N'75.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.510', N'12.0000', N'8300', N'2026-03-19 09:55:29.123')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'34', N'1', N'14', N'3', N'680.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.530', N'100.0000', N'8300', N'2026-03-19 09:55:29.130')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'35', N'1', N'15', N'1', N'20.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.550', N'1.0000', N'8300', N'2026-03-19 09:55:29.140')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'36', N'1', N'16', N'14', N'2.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.573', N'1.0000', N'8300', N'2026-03-19 09:55:29.147')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'37', N'1', N'17', N'14', N'0.4500', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.597', N'1.0000', N'8300', N'2026-03-19 09:55:29.160')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'38', N'1', N'18', N'6', N'420.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.610', N'12.0000', N'8300', N'2026-03-19 09:55:29.173')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'39', N'1', N'19', N'1', N'18.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.633', N'1.0000', N'8300', N'2026-03-19 09:55:29.180')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'40', N'1', N'20', N'6', N'96.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.650', N'12.0000', N'8300', N'2026-03-19 09:55:29.190')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'41', N'1', N'21', N'14', N'2.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.673', N'1.0000', N'8300', N'2026-03-19 09:55:29.210')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'42', N'1', N'22', N'14', N'1.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.700', N'1.0000', N'8300', N'2026-03-19 09:55:29.227')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'43', N'1', N'23', N'1', N'35.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.723', N'1.0000', N'8300', N'2026-03-19 09:55:29.233')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'44', N'1', N'24', N'17', N'10.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.743', N'1.0000', N'8300', N'2026-03-19 09:55:29.243')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'45', N'1', N'25', N'14', N'1.8000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.760', N'1.0000', N'8300', N'2026-03-19 09:55:29.250')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'46', N'1', N'26', N'1', N'70.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.780', N'8.0000', N'8300', N'2026-03-19 09:55:29.260')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'47', N'1', N'27', N'14', N'2.5000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.800', N'1.0000', N'8300', N'2026-03-19 09:55:29.267')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'48', N'1', N'28', N'17', N'7.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.823', N'1.0000', N'8300', N'2026-03-19 09:55:29.277')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'49', N'1', N'29', N'15', N'40.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.843', N'5.0000', N'8300', N'2026-03-19 09:55:29.287')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'50', N'1', N'30', N'1', N'45.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.873', N'100.0000', N'8300', N'2026-03-19 09:55:29.297')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'51', N'1', N'31', N'2', N'280.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.897', N'100.0000', N'8300', N'2026-03-19 09:55:29.303')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'52', N'1', N'32', N'12', N'25.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:29.927', N'1.0000', N'8300', N'2026-03-19 09:55:29.310')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'53', N'1', N'33', N'12', N'15.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.217', N'1.0000', N'8300', N'2026-03-19 09:55:29.320')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'54', N'1', N'34', N'2', N'80.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.237', N'100.0000', N'8300', N'2026-03-19 09:55:29.330')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'55', N'1', N'35', N'2', N'60.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.260', N'80.0000', N'8300', N'2026-03-19 09:55:29.337')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'56', N'1', N'36', N'2', N'80.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.280', N'80.0000', N'8300', N'2026-03-19 09:55:29.343')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'57', N'1', N'37', N'12', N'70.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.300', N'200.0000', N'8300', N'2026-03-19 09:55:29.360')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'58', N'1', N'38', N'11', N'10.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.317', N'1.0000', N'8300', N'2026-03-19 09:55:29.377')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'59', N'1', N'39', N'12', N'25.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.337', N'457.0000', N'8300', N'2026-03-19 09:55:29.387')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'60', N'1', N'40', N'10', N'15.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.357', N'100.0000', N'8300', N'2026-03-19 09:55:29.393')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'61', N'1', N'41', N'18', N'1.3000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.377', N'100.0000', N'8300', N'2026-03-19 09:55:29.407')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'62', N'1', N'42', N'1', N'35.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.397', N'500.0000', N'8300', N'2026-03-19 09:55:29.420')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'63', N'1', N'43', N'10', N'35.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.417', N'100.0000', N'8300', N'2026-03-19 09:55:29.427')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'64', N'1', N'44', N'10', N'145.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.443', N'1000.0000', N'8300', N'2026-03-19 09:55:29.433')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'65', N'1', N'45', N'1', N'45.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.460', N'450.0000', N'8300', N'2026-03-19 09:55:29.443')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'66', N'1', N'46', N'18', N'1.8000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.480', N'100.0000', N'8300', N'2026-03-19 09:55:29.453')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'67', N'1', N'47', N'1', N'1.8000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.500', N'100.0000', N'8300', N'2026-03-19 09:55:29.463')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'68', N'1', N'48', N'1', N'150.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.517', N'450.0000', N'8300', N'2026-03-19 09:55:29.477')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'69', N'1', N'49', N'2', N'78.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.537', N'100.0000', N'8300', N'2026-03-19 09:55:29.487')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'70', N'1', N'50', N'17', N'20.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.567', N'10.0000', N'8300', N'2026-03-19 09:55:29.497')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'71', N'1', N'53', N'1', N'40.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.587', N'1000.0000', N'8300', N'2026-03-19 09:55:29.503')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'72', N'1', N'54', N'7', N'390.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.603', N'5000.0000', N'8300', N'2026-03-19 09:55:29.517')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'73', N'1', N'55', N'1', N'18.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.633', N'30.0000', N'8300', N'2026-03-19 09:55:29.523')
GO

INSERT INTO [dbo].[supplier_price_list] ([price_id], [supplier_id], [item_id], [unit_id], [unit_price], [effective_date], [expire_date], [is_active], [created_by], [created_at], [conversion_factor], [updated_by], [updated_at]) VALUES (N'74', N'1', N'56', N'13', N'20.0000', N'2026-03-01', NULL, N'1', N'8300', N'2026-03-19 09:54:30.657', N'1.0000', N'8300', N'2026-03-19 09:55:29.533')
GO

SET IDENTITY_INSERT [dbo].[supplier_price_list] OFF
GO


-- ----------------------------
-- Table structure for suppliers
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[suppliers]') AND type IN ('U'))
	DROP TABLE [dbo].[suppliers]
GO

CREATE TABLE [dbo].[suppliers] (
  [supplier_id] int  IDENTITY(1,1) NOT NULL,
  [supplier_code] varchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [supplier_name] nvarchar(200) COLLATE Thai_CI_AS  NOT NULL,
  [contact_name] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [phone] varchar(20) COLLATE Thai_CI_AS  NULL,
  [email] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [address] nvarchar(500) COLLATE Thai_CI_AS  NULL,
  [tax_id] varchar(20) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [note] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[suppliers] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of suppliers
-- ----------------------------
SET IDENTITY_INSERT [dbo].[suppliers] ON
GO

INSERT INTO [dbo].[suppliers] ([supplier_id], [supplier_code], [supplier_name], [contact_name], [phone], [email], [address], [tax_id], [is_active], [note], [created_by], [created_at]) VALUES (N'1', N'SUP001', N'CH.CHAROEN', N'CH.CHAROEN', N'0546876546', N'-', N'CNX', N'54321', N'1', N'ผู้ค้ายา', N'8300', N'2026-03-13 10:53:53.747')
GO

INSERT INTO [dbo].[suppliers] ([supplier_id], [supplier_code], [supplier_name], [contact_name], [phone], [email], [address], [tax_id], [is_active], [note], [created_by], [created_at]) VALUES (N'2', N'SUP002', N'Punya Drugstore Lamphun', N'ร้านปันยา ลำพูน', N'084 029 6421', N'otto2py@hotmail.com', N'492 Charoen Rat Rd, Nai Mueang, เมือง Lamphun 51000, Thailand', N'123456', N'1', N'ร้านขายยา "ปันยา" รับคนละครึ่งพลัส', N'8300', N'2026-03-13 13:40:29.333')
GO

SET IDENTITY_INSERT [dbo].[suppliers] OFF
GO


-- ----------------------------
-- Table structure for treatment_types
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[treatment_types]') AND type IN ('U'))
	DROP TABLE [dbo].[treatment_types]
GO

CREATE TABLE [dbo].[treatment_types] (
  [treatment_type_id] int  IDENTITY(1,1) NOT NULL,
  [treatment_code] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [treatment_name_th] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [treatment_name_en] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [sort_order] int DEFAULT 0 NOT NULL,
  [is_active] bit DEFAULT 1 NOT NULL
)
GO

ALTER TABLE [dbo].[treatment_types] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of treatment_types
-- ----------------------------
SET IDENTITY_INSERT [dbo].[treatment_types] ON
GO

INSERT INTO [dbo].[treatment_types] ([treatment_type_id], [treatment_code], [treatment_name_th], [treatment_name_en], [sort_order], [is_active]) VALUES (N'1', N'REST', N'พักรักษาตัว', N'Rest', N'1', N'1')
GO

INSERT INTO [dbo].[treatment_types] ([treatment_type_id], [treatment_code], [treatment_name_th], [treatment_name_en], [sort_order], [is_active]) VALUES (N'2', N'DRESSING', N'ทำแผล', N'Dressing', N'2', N'1')
GO

INSERT INTO [dbo].[treatment_types] ([treatment_type_id], [treatment_code], [treatment_name_th], [treatment_name_en], [sort_order], [is_active]) VALUES (N'3', N'SEND_HOME', N'ลากลับบ้าน', N'Send Home', N'3', N'1')
GO

INSERT INTO [dbo].[treatment_types] ([treatment_type_id], [treatment_code], [treatment_name_th], [treatment_name_en], [sort_order], [is_active]) VALUES (N'4', N'DISPENSE', N'รับยาแล้วกลับ', N'Dispense & Go', N'4', N'1')
GO

INSERT INTO [dbo].[treatment_types] ([treatment_type_id], [treatment_code], [treatment_name_th], [treatment_name_en], [sort_order], [is_active]) VALUES (N'5', N'EYE_WASH', N'ล้างตา', N'Eye Wash', N'5', N'1')
GO

SET IDENTITY_INSERT [dbo].[treatment_types] OFF
GO


-- ----------------------------
-- Table structure for units
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[units]') AND type IN ('U'))
	DROP TABLE [dbo].[units]
GO

CREATE TABLE [dbo].[units] (
  [unit_id] int  IDENTITY(1,1) NOT NULL,
  [unit_code] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [unit_name_th] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [unit_name_en] nvarchar(200) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[units] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of units
-- ----------------------------
SET IDENTITY_INSERT [dbo].[units] ON
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'1', N'BTL', N'ขวด', N'Bottle', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'2', N'BOX', N'กล่อง', N'Box', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'3', N'CAN', N'กระป๋อง', N'Can', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'4', N'CAP', N'แคปซูล', N'Capsule', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'5', N'COMP', N'คอมแพค', N'Compact', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'6', N'DOZ', N'โหล', N'Dozen', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'7', N'GAL', N'แกลลอน', N'Gallon', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'8', N'GM', N'กรัม', N'Gram', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'9', N'ML', N'มิลลิลิตร', N'Milliliter', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'10', N'PACK', N'แพ็ก', N'Pack', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'11', N'PCS', N'ชิ้น', N'Pieces', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'12', N'ROLL', N'ม้วน', N'Roll', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'13', N'SET', N'ชุด', N'Set', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'14', N'TAB', N'เม็ด', N'Tablet', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'15', N'TUBE', N'หลอด', N'Tube', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'16', N'STK', N'แท่ง', N'Stick', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'17', N'SACH', N'ซอง', N'Sachet', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'18', N'CART', N'ตลับ', N'Cartridge', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'19', N'CM', N'เซนติเมตร', N'Centimeter', N'1', N'2026-04-03 00:00:00.000')
GO

INSERT INTO [dbo].[units] ([unit_id], [unit_code], [unit_name_th], [unit_name_en], [is_active], [created_at]) VALUES (N'20', N'TIME', N'ครั้ง', N'Time/Occasion', N'1', N'2026-04-03 00:00:00.000')
GO

SET IDENTITY_INSERT [dbo].[units] OFF
GO


-- ----------------------------
-- Table structure for visit_usage_edit_logs
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visit_usage_edit_logs]') AND type IN ('U'))
	DROP TABLE [dbo].[visit_usage_edit_logs]
GO

CREATE TABLE [dbo].[visit_usage_edit_logs] (
  [log_id] int  IDENTITY(1,1) NOT NULL,
  [visit_usage_id] int  NOT NULL,
  [edited_by] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [edited_at] datetime DEFAULT getdate() NOT NULL,
  [old_qty_base] int  NOT NULL,
  [new_qty_base] int  NOT NULL,
  [reason] nvarchar(500) COLLATE Thai_CI_AS  NOT NULL
)
GO

ALTER TABLE [dbo].[visit_usage_edit_logs] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of visit_usage_edit_logs
-- ----------------------------
SET IDENTITY_INSERT [dbo].[visit_usage_edit_logs] ON
GO

SET IDENTITY_INSERT [dbo].[visit_usage_edit_logs] OFF
GO


-- ----------------------------
-- Table structure for visit_usages
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visit_usages]') AND type IN ('U'))
	DROP TABLE [dbo].[visit_usages]
GO

CREATE TABLE [dbo].[visit_usages] (
  [visit_usage_id] int  IDENTITY(1,1) NOT NULL,
  [visit_id] int  NOT NULL,
  [item_id] int  NOT NULL,
  [qty_base] int  NOT NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL
)
GO

ALTER TABLE [dbo].[visit_usages] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of visit_usages
-- ----------------------------
SET IDENTITY_INSERT [dbo].[visit_usages] ON
GO

SET IDENTITY_INSERT [dbo].[visit_usages] OFF
GO


-- ----------------------------
-- Table structure for visits
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[visits]') AND type IN ('U'))
	DROP TABLE [dbo].[visits]
GO

CREATE TABLE [dbo].[visits] (
  [visit_id] int  IDENTITY(1,1) NOT NULL,
  [visit_datetime] datetime  NOT NULL,
  [shift_code] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [patient_type] nvarchar(20) COLLATE Thai_CI_AS  NOT NULL,
  [employee_id] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [external_person_id] int  NULL,
  [symptoms] nvarchar(1000) COLLATE Thai_CI_AS  NULL,
  [refer_type] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [accident_in_work_flag] bit DEFAULT 0 NOT NULL,
  [vitals_json] nvarchar(max) COLLATE Thai_CI_AS  NULL,
  [nursing_advice] nvarchar(1000) COLLATE Thai_CI_AS  NULL,
  [created_by] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [created_at] datetime DEFAULT getdate() NOT NULL,
  [group_id] int  NULL,
  [disease_id] int  NULL,
  [treatment_type_id] int  NULL,
  [work_related_flag] bit DEFAULT 0 NOT NULL,
  [severity_id] int  NULL,
  [refer_flag] bit DEFAULT 0 NOT NULL,
  [refer_type_id] int  NULL,
  [patient_id] int  NULL
)
GO

ALTER TABLE [dbo].[visits] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Records of visits
-- ----------------------------
SET IDENTITY_INSERT [dbo].[visits] ON
GO

SET IDENTITY_INSERT [dbo].[visits] OFF
GO