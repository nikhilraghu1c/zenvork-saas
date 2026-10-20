import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ResourceTypeOption {
  isPerson: boolean;
  code: string;
  name: string;
}

export interface BusinessTypeOption {
  id: string;
  code: string;
  name: string;
  iconName: string;
  resourceTypes: ResourceTypeOption[];
}

export interface AdminBusinessType extends BusinessTypeOption {
  isActive: boolean;
}

export interface CreateBusinessTypeRequest {
  code: string;
  name: string;
  iconName?: string;
}

interface BusinessTypesResponse<TBusinessType extends BusinessTypeOption = BusinessTypeOption> {
  businessTypes: TBusinessType[];
}

@Injectable({ providedIn: 'root' })
export class BusinessTypeService {
  constructor(private readonly api: ApiService) {}

  /** Loads active platform-managed types for the business registration form. */
  getActive(): Observable<BusinessTypesResponse> {
    return this.api.get<BusinessTypesResponse>('admin/business-types/active');
  }

  /** Loads the full catalogue, including inactive types, for platform lifecycle management. */
  getAll(): Observable<BusinessTypesResponse<AdminBusinessType>> {
    return this.api.get<BusinessTypesResponse<AdminBusinessType>>('admin/business-types');
  }

  create(payload: CreateBusinessTypeRequest): Observable<{ businessType: AdminBusinessType }> {
    return this.api.post<{ businessType: AdminBusinessType }, CreateBusinessTypeRequest>(
      'admin/business-types',
      payload,
    );
  }

  update(
    businessTypeId: string,
    payload: Pick<CreateBusinessTypeRequest, 'name' | 'iconName'>,
  ): Observable<{ businessType: AdminBusinessType }> {
    return this.api.patch<{ businessType: AdminBusinessType }, Pick<CreateBusinessTypeRequest, 'name' | 'iconName'>>(
      `admin/business-types/${encodeURIComponent(businessTypeId)}`,
      payload,
    );
  }

  updateStatus(
    businessTypeId: string,
    isActive: boolean,
  ): Observable<{ businessType: AdminBusinessType }> {
    return this.api.patch<{ businessType: AdminBusinessType }, { isActive: boolean }>(
      `admin/business-types/${encodeURIComponent(businessTypeId)}/status`,
      { isActive },
    );
  }
}
