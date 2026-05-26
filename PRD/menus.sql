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

 Date: 26/05/2026 08:47:05
*/


-- ----------------------------
-- Table structure for menus
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[menus]') AND type IN ('U'))
	DROP TABLE [dbo].[menus]
GO

CREATE TABLE [dbo].[menus] (
  [id] int  IDENTITY(1,1) NOT NULL,
  [code] nvarchar(50) COLLATE Thai_CI_AS  NOT NULL,
  [name] nvarchar(100) COLLATE Thai_CI_AS  NOT NULL,
  [parent_id] int  NULL,
  [sort_order] int DEFAULT 0 NOT NULL,
  [icon] nvarchar(50) COLLATE Thai_CI_AS  NULL,
  [route] nvarchar(100) COLLATE Thai_CI_AS  NULL,
  [is_active] bit DEFAULT 1 NOT NULL,
  [created_at] datetime2(7) DEFAULT sysdatetime() NOT NULL,
  [updated_at] datetime2(7) DEFAULT sysdatetime() NOT NULL
)
GO

ALTER TABLE [dbo].[menus] SET (LOCK_ESCALATION = TABLE)
GO


-- ----------------------------
-- Auto increment value for menus
-- ----------------------------
DBCC CHECKIDENT ('[dbo].[menus]', RESEED, 1)
GO


-- ----------------------------
-- Primary Key structure for table menus
-- ----------------------------
ALTER TABLE [dbo].[menus] ADD CONSTRAINT [PK__menus__3213E83FC52ED351] PRIMARY KEY CLUSTERED ([id])
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)  
ON [PRIMARY]
GO

