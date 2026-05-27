import { Api } from '@/services/api.service';
import type {
  ICreateSpecialDrugClaimBody,
  IReturnSpecialDrugBody,
  ISpecialDrugClaimDetail,
  ISpecialDrugClaimHeader,
  IUpdateSpecialDrugClaimBody,
} from '@/interfaces/special-drug-claim.interfaces';

export class SpecialDrugClaimService {
  static async getClaims(): Promise<ISpecialDrugClaimHeader[]> {
    return Api.get<ISpecialDrugClaimHeader[]>('/special-drug-claim');
  }

  static async getClaimById(claimId: number): Promise<ISpecialDrugClaimDetail> {
    return Api.get<ISpecialDrugClaimDetail>(`/special-drug-claim/${claimId}`);
  }

  static async createClaim(body: ICreateSpecialDrugClaimBody): Promise<any> {
    return Api.post('/special-drug-claim', body);
  }

  static async updateClaim(
    claimId: number,
    body: IUpdateSpecialDrugClaimBody,
  ): Promise<any> {
    return Api.put(`/special-drug-claim/${claimId}`, body);
  }

  static async returnClaimItem(body: IReturnSpecialDrugBody): Promise<any> {
    return Api.post('/special-drug-claim/return', body);
  }

  static async closeClaim(claimId: number): Promise<any> {
    return Api.post(`/special-drug-claim/${claimId}/close`);
  }
}
