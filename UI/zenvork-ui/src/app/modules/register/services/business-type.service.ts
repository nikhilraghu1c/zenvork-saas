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

interface BusinessTypesResponse {
  businessTypes: BusinessTypeOption[];
}

@Injectable({ providedIn: 'root' })
export class BusinessTypeService {
  constructor(private readonly api: ApiService) {}

  getActive(): Observable<BusinessTypesResponse> {
    return this.api.get<BusinessTypesResponse>('business-types');
  }
}
