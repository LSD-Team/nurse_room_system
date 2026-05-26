import { Api } from '@/services/api.service';
import type {
  IDiseaseGroupLookup,
  IDiseaseGroupMasterData,
  IDiseaseGroupUpsertBody,
  IDiseaseTypeMasterData,
  IDiseaseTypeUpsertBody,
  IHospitalMasterData,
  IHospitalTypeLookup,
  IHospitalUpsertBody,
  IItemMasterData,
  IItemTypeLookup,
  IItemUpsertBody,
  IReferTypeMasterData,
  IReferTypeUpsertBody,
  ISupplierPriceListBulkBody,
  ISupplierPriceListItemsResponse,
  ISupplierMasterData,
  ISupplierUpsertBody,
  ITreatmentTypeMasterData,
  ITreatmentTypeUpsertBody,
  IUnitMasterData,
  IUnitUpsertBody,
} from '@/interfaces/master-data.interfaces';

export class MasterDataService {
  // ─── Suppliers ───────────────────────────────────────────────────────────────
  static async getSuppliers(search?: string): Promise<ISupplierMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<ISupplierMasterData[]>(`/master-data/suppliers${query}`);
  }

  static async createSupplier(
    body: ISupplierUpsertBody
  ): Promise<ISupplierMasterData> {
    return Api.post<ISupplierMasterData>('/master-data/suppliers', body);
  }

  static async updateSupplier(
    id: number,
    body: ISupplierUpsertBody
  ): Promise<ISupplierMasterData> {
    return Api.put<ISupplierMasterData>(`/master-data/suppliers/${id}`, body);
  }

  static async deleteSupplier(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/suppliers/${id}`);
  }

  static async getSupplierPriceListItems(
    supplierId: number
  ): Promise<ISupplierPriceListItemsResponse> {
    return Api.get<ISupplierPriceListItemsResponse>(
      `/master-data/suppliers/${supplierId}/price-list-items`
    );
  }

  static async saveSupplierPriceListBulk(
    supplierId: number,
    body: ISupplierPriceListBulkBody
  ): Promise<{ saved: boolean }> {
    return Api.post<{ saved: boolean }>(
      `/master-data/suppliers/${supplierId}/price-list-bulk`,
      body
    );
  }

  // ─── Treatment Types ────────────────────────────────────────────────────────
  static async getTreatmentTypes(
    search?: string
  ): Promise<ITreatmentTypeMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<ITreatmentTypeMasterData[]>(
      `/master-data/treatment-types${query}`
    );
  }

  static async createTreatmentType(
    body: ITreatmentTypeUpsertBody
  ): Promise<ITreatmentTypeMasterData> {
    return Api.post<ITreatmentTypeMasterData>(
      '/master-data/treatment-types',
      body
    );
  }

  static async updateTreatmentType(
    id: number,
    body: ITreatmentTypeUpsertBody
  ): Promise<ITreatmentTypeMasterData> {
    return Api.put<ITreatmentTypeMasterData>(
      `/master-data/treatment-types/${id}`,
      body
    );
  }

  static async deleteTreatmentType(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(
      `/master-data/treatment-types/${id}`
    );
  }

  // ─── Refer Types ────────────────────────────────────────────────────────────
  static async getReferTypes(search?: string): Promise<IReferTypeMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<IReferTypeMasterData[]>(`/master-data/refer-types${query}`);
  }

  static async createReferType(
    body: IReferTypeUpsertBody
  ): Promise<IReferTypeMasterData> {
    return Api.post<IReferTypeMasterData>('/master-data/refer-types', body);
  }

  static async updateReferType(
    id: number,
    body: IReferTypeUpsertBody
  ): Promise<IReferTypeMasterData> {
    return Api.put<IReferTypeMasterData>(
      `/master-data/refer-types/${id}`,
      body
    );
  }

  static async deleteReferType(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/refer-types/${id}`);
  }

  // ─── Disease Groups ──────────────────────────────────────────────────────────
  static async getDiseaseGroups(params?: {
    search?: string;
    includeInactive?: boolean;
  }): Promise<IDiseaseGroupMasterData[]> {
    const query = new URLSearchParams();
    const search = params?.search?.trim();
    if (search) query.set('search', search);
    if (params?.includeInactive) query.set('includeInactive', 'true');
    const suffix = query.size ? `?${query.toString()}` : '';
    return Api.get<IDiseaseGroupMasterData[]>(
      `/master-data/disease-groups${suffix}`
    );
  }

  static async getDiseaseGroupOptions(): Promise<IDiseaseGroupLookup[]> {
    return Api.get<IDiseaseGroupLookup[]>('/master-data/disease-group-options');
  }

  static async createDiseaseGroup(
    body: IDiseaseGroupUpsertBody
  ): Promise<IDiseaseGroupMasterData> {
    return Api.post<IDiseaseGroupMasterData>(
      '/master-data/disease-groups',
      body
    );
  }

  static async updateDiseaseGroup(
    id: number,
    body: IDiseaseGroupUpsertBody
  ): Promise<IDiseaseGroupMasterData> {
    return Api.put<IDiseaseGroupMasterData>(
      `/master-data/disease-groups/${id}`,
      body
    );
  }

  static async deleteDiseaseGroup(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(
      `/master-data/disease-groups/${id}`
    );
  }

  // ─── Disease Types ───────────────────────────────────────────────────────────
  static async getDiseaseTypes(params?: {
    groupId?: number | null;
    search?: string;
    includeInactive?: boolean;
  }): Promise<IDiseaseTypeMasterData[]> {
    const query = new URLSearchParams();
    if (params?.groupId) query.set('groupId', String(params.groupId));
    const search = params?.search?.trim();
    if (search) query.set('search', search);
    if (params?.includeInactive) query.set('includeInactive', 'true');
    const suffix = query.size ? `?${query.toString()}` : '';
    return Api.get<IDiseaseTypeMasterData[]>(
      `/master-data/disease-types${suffix}`
    );
  }

  static async createDiseaseType(
    body: IDiseaseTypeUpsertBody
  ): Promise<IDiseaseTypeMasterData> {
    return Api.post<IDiseaseTypeMasterData>('/master-data/disease-types', body);
  }

  static async updateDiseaseType(
    id: number,
    body: IDiseaseTypeUpsertBody
  ): Promise<IDiseaseTypeMasterData> {
    return Api.put<IDiseaseTypeMasterData>(
      `/master-data/disease-types/${id}`,
      body
    );
  }

  static async deleteDiseaseType(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/disease-types/${id}`);
  }

  // ─── Hospitals ───────────────────────────────────────────────────────────────
  static async getHospitals(search?: string): Promise<IHospitalMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<IHospitalMasterData[]>(`/master-data/hospitals${query}`);
  }

  static async getHospitalTypes(): Promise<IHospitalTypeLookup[]> {
    return Api.get<IHospitalTypeLookup[]>('/master-data/hospital-types');
  }

  static async createHospital(
    body: IHospitalUpsertBody
  ): Promise<IHospitalMasterData> {
    return Api.post<IHospitalMasterData>('/master-data/hospitals', body);
  }

  static async updateHospital(
    id: number,
    body: IHospitalUpsertBody
  ): Promise<IHospitalMasterData> {
    return Api.put<IHospitalMasterData>(`/master-data/hospitals/${id}`, body);
  }

  static async deleteHospital(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/hospitals/${id}`);
  }

  // ─── Units ───────────────────────────────────────────────────────────────────
  static async getUnits(search?: string): Promise<IUnitMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<IUnitMasterData[]>(`/master-data/units${query}`);
  }

  static async createUnit(body: IUnitUpsertBody): Promise<IUnitMasterData> {
    return Api.post<IUnitMasterData>('/master-data/units', body);
  }

  static async updateUnit(
    id: number,
    body: IUnitUpsertBody
  ): Promise<IUnitMasterData> {
    return Api.put<IUnitMasterData>(`/master-data/units/${id}`, body);
  }

  static async deleteUnit(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/units/${id}`);
  }

  // ─── Item type lookups ───────────────────────────────────────────────────────
  static async getItemTypes(): Promise<IItemTypeLookup[]> {
    return Api.get<IItemTypeLookup[]>('/master-data/item-types');
  }

  // ─── Items ───────────────────────────────────────────────────────────────────
  static async getItems(search?: string): Promise<IItemMasterData[]> {
    const query = search?.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : '';
    return Api.get<IItemMasterData[]>(`/master-data/items${query}`);
  }

  static async createItem(body: IItemUpsertBody): Promise<IItemMasterData> {
    return Api.post<IItemMasterData>('/master-data/items', body);
  }

  static async updateItem(
    id: number,
    body: IItemUpsertBody
  ): Promise<IItemMasterData> {
    return Api.put<IItemMasterData>(`/master-data/items/${id}`, body);
  }

  static async deleteItem(id: number): Promise<{ deleted: boolean }> {
    return Api.delete<{ deleted: boolean }>(`/master-data/items/${id}`);
  }
}
