-- Run this script to create sp_PP_03_UpsertUnderlyingDisease
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_PP_03_UpsertUnderlyingDisease]') AND type IN ('P', 'PC', 'RF', 'X'))
    DROP PROCEDURE [dbo].[sp_PP_03_UpsertUnderlyingDisease]
GO

CREATE PROCEDURE [dbo].[sp_PP_03_UpsertUnderlyingDisease]
    @ConditionId    INT             = NULL,     -- NULL/0 = insert, else = update
    @PatientId      INT,
    @DiseaseName    NVARCHAR(200),
    @SubGroupId     INT             = NULL,     -- nullable
    @DiagnosedYear  INT             = NULL,     -- nullable
    @ControlStatus  NVARCHAR(30)    = NULL,
    @Note           NVARCHAR(500)   = NULL,
    @IsActive       BIT             = 1,
    @CreatedBy      NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF @ConditionId = 0 SET @ConditionId = NULL;

    IF @ConditionId IS NULL
    BEGIN
        INSERT INTO dbo.patient_underlying_diseases
            (patient_id, disease_name, sub_group_id, diagnosed_year, control_status, note, is_active, created_by)
        VALUES
            (@PatientId, @DiseaseName, @SubGroupId, @DiagnosedYear, @ControlStatus, @Note, @IsActive, @CreatedBy);
        SELECT SCOPE_IDENTITY() AS condition_id, 'CREATED' AS action;
    END
    ELSE
    BEGIN
        UPDATE dbo.patient_underlying_diseases SET
            disease_name    = @DiseaseName,
            sub_group_id    = @SubGroupId,
            diagnosed_year  = @DiagnosedYear,
            control_status  = @ControlStatus,
            note            = @Note,
            is_active       = @IsActive
        WHERE condition_id = @ConditionId
          AND patient_id   = @PatientId;
        SELECT @ConditionId AS condition_id, 'UPDATED' AS action;
    END
END
GO
