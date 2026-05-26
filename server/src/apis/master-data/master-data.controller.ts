import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';
import type {
  ICreateDiseaseGroupBody,
  ICreateDiseaseTypeBody,
  ICreateHospitalBody,
  ICreateItemBody,
  ICreateReferTypeBody,
  ICreateSupplierBody,
  ICreateTreatmentTypeBody,
  ICreateUnitBody,
  ISupplierPriceListBulkBody,
  IUpdateDiseaseGroupBody,
  IUpdateDiseaseTypeBody,
  IUpdateHospitalBody,
  IUpdateItemBody,
  IUpdateReferTypeBody,
  IUpdateSupplierBody,
  IUpdateTreatmentTypeBody,
  IUpdateUnitBody,
} from './master-data.interface';
import { JwtPayloadData } from '@/shared/lsd-system-center/auth.interface';

@ApiTags('master-data')
@ApiBearerAuth()
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  private get currentUser(): string {
    return (global.jwtPayload as JwtPayloadData)?.UserID || 'UNKNOWN';
  }

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  @Get('suppliers')
  @ApiOperation({ summary: 'Get active suppliers' })
  @ApiQuery({ name: 'search', required: false })
  async getSuppliers(@Query('search') search?: string) {
    return this.masterDataService.getSuppliers(search);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  async createSupplier(@Body() body: ICreateSupplierBody) {
    return this.masterDataService.createSupplier(body, this.currentUser);
  }

  @Put('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiParam({ name: 'id', type: Number })
  async updateSupplier(
    @Param('id') id: string,
    @Body() body: IUpdateSupplierBody,
  ) {
    return this.masterDataService.updateSupplier(Number(id), body);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Soft delete supplier (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteSupplier(@Param('id') id: string) {
    return this.masterDataService.deleteSupplier(Number(id));
  }

  @Get('suppliers/:id/price-list-items')
  @ApiOperation({ summary: 'Get supplier price list management data' })
  @ApiParam({ name: 'id', type: Number })
  async getSupplierPriceListItems(@Param('id') id: string) {
    return this.masterDataService.getSupplierPriceListItems(Number(id));
  }

  @Post('suppliers/:id/price-list-bulk')
  @ApiOperation({ summary: 'Bulk upsert/deactivate supplier price list rows' })
  @ApiParam({ name: 'id', type: Number })
  async saveSupplierPriceListBulk(
    @Param('id') id: string,
    @Body() body: ISupplierPriceListBulkBody,
  ) {
    return this.masterDataService.saveSupplierPriceListBulk(
      Number(id),
      body,
      this.currentUser,
    );
  }

  // ─── Treatment Types ────────────────────────────────────────────────────────
  @Get('treatment-types')
  @ApiOperation({ summary: 'Get active treatment types' })
  @ApiQuery({ name: 'search', required: false })
  async getTreatmentTypes(@Query('search') search?: string) {
    return this.masterDataService.getTreatmentTypes(search);
  }

  @Post('treatment-types')
  @ApiOperation({ summary: 'Create treatment type' })
  async createTreatmentType(@Body() body: ICreateTreatmentTypeBody) {
    return this.masterDataService.createTreatmentType(body);
  }

  @Put('treatment-types/:id')
  @ApiOperation({ summary: 'Update treatment type' })
  @ApiParam({ name: 'id', type: Number })
  async updateTreatmentType(
    @Param('id') id: string,
    @Body() body: IUpdateTreatmentTypeBody,
  ) {
    return this.masterDataService.updateTreatmentType(Number(id), body);
  }

  @Delete('treatment-types/:id')
  @ApiOperation({ summary: 'Soft delete treatment type (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteTreatmentType(@Param('id') id: string) {
    return this.masterDataService.deleteTreatmentType(Number(id));
  }

  // ─── Refer Types ────────────────────────────────────────────────────────────
  @Get('refer-types')
  @ApiOperation({ summary: 'Get active refer types' })
  @ApiQuery({ name: 'search', required: false })
  async getReferTypes(@Query('search') search?: string) {
    return this.masterDataService.getReferTypes(search);
  }

  @Post('refer-types')
  @ApiOperation({ summary: 'Create refer type' })
  async createReferType(@Body() body: ICreateReferTypeBody) {
    return this.masterDataService.createReferType(body);
  }

  @Put('refer-types/:id')
  @ApiOperation({ summary: 'Update refer type' })
  @ApiParam({ name: 'id', type: Number })
  async updateReferType(
    @Param('id') id: string,
    @Body() body: IUpdateReferTypeBody,
  ) {
    return this.masterDataService.updateReferType(Number(id), body);
  }

  @Delete('refer-types/:id')
  @ApiOperation({ summary: 'Soft delete refer type (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteReferType(@Param('id') id: string) {
    return this.masterDataService.deleteReferType(Number(id));
  }

  // ─── Disease Groups / Disease Types ─────────────────────────────────────────
  @Get('disease-groups')
  @ApiOperation({ summary: 'Get disease groups' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getDiseaseGroups(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.masterDataService.getDiseaseGroups(
      search,
      includeInactive === 'true',
    );
  }

  @Get('disease-group-options')
  @ApiOperation({ summary: 'Get active disease groups for dropdown options' })
  async getDiseaseGroupOptions() {
    return this.masterDataService.getDiseaseGroupOptions();
  }

  @Post('disease-groups')
  @ApiOperation({ summary: 'Create disease group' })
  async createDiseaseGroup(@Body() body: ICreateDiseaseGroupBody) {
    return this.masterDataService.createDiseaseGroup(body);
  }

  @Put('disease-groups/:id')
  @ApiOperation({ summary: 'Update disease group' })
  @ApiParam({ name: 'id', type: Number })
  async updateDiseaseGroup(
    @Param('id') id: string,
    @Body() body: IUpdateDiseaseGroupBody,
  ) {
    return this.masterDataService.updateDiseaseGroup(Number(id), body);
  }

  @Delete('disease-groups/:id')
  @ApiOperation({ summary: 'Soft delete disease group (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteDiseaseGroup(@Param('id') id: string) {
    return this.masterDataService.deleteDiseaseGroup(Number(id));
  }

  @Get('disease-types')
  @ApiOperation({ summary: 'Get disease types' })
  @ApiQuery({ name: 'groupId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async getDiseaseTypes(
    @Query('groupId') groupId?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.masterDataService.getDiseaseTypes(
      groupId ? Number(groupId) : undefined,
      search,
      includeInactive === 'true',
    );
  }

  @Post('disease-types')
  @ApiOperation({ summary: 'Create disease type' })
  async createDiseaseType(@Body() body: ICreateDiseaseTypeBody) {
    return this.masterDataService.createDiseaseType(body);
  }

  @Put('disease-types/:id')
  @ApiOperation({ summary: 'Update disease type' })
  @ApiParam({ name: 'id', type: Number })
  async updateDiseaseType(
    @Param('id') id: string,
    @Body() body: IUpdateDiseaseTypeBody,
  ) {
    return this.masterDataService.updateDiseaseType(Number(id), body);
  }

  @Delete('disease-types/:id')
  @ApiOperation({ summary: 'Soft delete disease type (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteDiseaseType(@Param('id') id: string) {
    return this.masterDataService.deleteDiseaseType(Number(id));
  }

  // ─── Hospitals ───────────────────────────────────────────────────────────────
  @Get('hospital-types')
  @ApiOperation({ summary: 'Get active hospital type lookup' })
  async getHospitalTypes() {
    return this.masterDataService.getHospitalTypes();
  }

  @Get('hospitals')
  @ApiOperation({ summary: 'Get active hospitals' })
  @ApiQuery({ name: 'search', required: false })
  async getHospitals(@Query('search') search?: string) {
    return this.masterDataService.getHospitals(search);
  }

  @Post('hospitals')
  @ApiOperation({ summary: 'Create hospital' })
  async createHospital(@Body() body: ICreateHospitalBody) {
    return this.masterDataService.createHospital(body);
  }

  @Put('hospitals/:id')
  @ApiOperation({ summary: 'Update hospital' })
  @ApiParam({ name: 'id', type: Number })
  async updateHospital(
    @Param('id') id: string,
    @Body() body: IUpdateHospitalBody,
  ) {
    return this.masterDataService.updateHospital(Number(id), body);
  }

  @Delete('hospitals/:id')
  @ApiOperation({ summary: 'Soft delete hospital (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteHospital(@Param('id') id: string) {
    return this.masterDataService.deleteHospital(Number(id));
  }

  // ─── Units ───────────────────────────────────────────────────────────────────
  @Get('units')
  @ApiOperation({ summary: 'Get active units' })
  @ApiQuery({ name: 'search', required: false })
  async getUnits(@Query('search') search?: string) {
    return this.masterDataService.getUnits(search);
  }

  @Post('units')
  @ApiOperation({ summary: 'Create unit' })
  async createUnit(@Body() body: ICreateUnitBody) {
    return this.masterDataService.createUnit(body);
  }

  @Put('units/:id')
  @ApiOperation({ summary: 'Update unit' })
  @ApiParam({ name: 'id', type: Number })
  async updateUnit(@Param('id') id: string, @Body() body: IUpdateUnitBody) {
    return this.masterDataService.updateUnit(Number(id), body);
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Soft delete unit (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteUnit(@Param('id') id: string) {
    return this.masterDataService.deleteUnit(Number(id));
  }

  // ─── Item types lookup ───────────────────────────────────────────────────────
  @Get('item-types')
  @ApiOperation({ summary: 'Get active item types lookup' })
  async getItemTypes() {
    return this.masterDataService.getItemTypes();
  }

  // ─── Items ───────────────────────────────────────────────────────────────────
  @Get('items')
  @ApiOperation({ summary: 'Get active medicine/supply items' })
  @ApiQuery({ name: 'search', required: false })
  async getItems(@Query('search') search?: string) {
    return this.masterDataService.getItems(search);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create item' })
  async createItem(@Body() body: ICreateItemBody) {
    return this.masterDataService.createItem(body, this.currentUser);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update item' })
  @ApiParam({ name: 'id', type: Number })
  async updateItem(@Param('id') id: string, @Body() body: IUpdateItemBody) {
    return this.masterDataService.updateItem(
      Number(id),
      body,
      this.currentUser,
    );
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Soft delete item (is_active = 0)' })
  @ApiParam({ name: 'id', type: Number })
  async deleteItem(@Param('id') id: string) {
    return this.masterDataService.deleteItem(Number(id));
  }
}
