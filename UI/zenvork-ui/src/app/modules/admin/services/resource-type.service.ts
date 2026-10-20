import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface AdminResourceType {
  businessTypeId: string;
  businessTypeCode: string;
  businessTypeName: string;
  businessTypeIsActive: boolean;
  code: string;
  name: string;
  isPerson: boolean;
  isActive: boolean;
}

export interface CreateResourceTypeRequest {
  businessTypeId: string;
  code: string;
  name: string;
  isPerson: boolean;
}

@Injectable({ providedIn: 'root' })
export class ResourceTypeService {
  constructor(private readonly api: ApiService) {}

  /** Lists all platform resource-type configurations, including inactive entries. */
  getAll(): Observable<{ resourceTypes: AdminResourceType[] }> {
    return this.api.get<{ resourceTypes: AdminResourceType[] }>('admin/resource-types');
  }

  create(payload: CreateResourceTypeRequest): Observable<{ resourceType: AdminResourceType }> {
    return this.api.post<{ resourceType: AdminResourceType }, CreateResourceTypeRequest>(
      'admin/resource-types',
      payload,
    );
  }

  updateName(
    resourceType: Pick<AdminResourceType, 'businessTypeId' | 'code'>,
    name: string,
  ): Observable<{ resourceType: AdminResourceType }> {
    return this.api.patch<{ resourceType: AdminResourceType }, { name: string }>(
      this.path(resourceType),
      { name },
    );
  }

  updateStatus(
    resourceType: Pick<AdminResourceType, 'businessTypeId' | 'code'>,
    isActive: boolean,
  ): Observable<{ resourceType: AdminResourceType }> {
    return this.api.patch<{ resourceType: AdminResourceType }, { isActive: boolean }>(
      `${this.path(resourceType)}/status`,
      { isActive },
    );
  }

  private path(resourceType: Pick<AdminResourceType, 'businessTypeId' | 'code'>): string {
    return `admin/resource-types/${encodeURIComponent(resourceType.businessTypeId)}/${encodeURIComponent(
      resourceType.code,
    )}`;
  }
}
