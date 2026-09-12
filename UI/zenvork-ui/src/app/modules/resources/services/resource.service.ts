import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface ResourceRecord {
  isPerson: boolean;
  _id: string;
  name: string;
  resourceType: string;
  isActive: boolean;
  linkedUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ResourceTypeOption {
  isPerson: boolean;
  code: string;
  name: string;
}
export interface CreateResourceRequest {
  name: string;
  resourceType: string;
  linkedUserId: string | null;
}

@Injectable({ providedIn: 'root' })
export class ResourceService {
  constructor(private readonly api: ApiService) {}
  /** Loads resources belonging to the authenticated business. */
  getResources() {
    return this.api.get<{ resources: ResourceRecord[] }>('resources');
  }
  /** Loads the active resource types configured for the authenticated business. */
  getOptions() {
    return this.api.get<{ resourceTypes: ResourceTypeOption[] }>('resources/options');
  }
  /** Creates a resource without accepting a client-supplied tenant identifier. */
  createResource(payload: CreateResourceRequest) {
    return this.api.post<{ message: string }, CreateResourceRequest>('resources', payload);
  }
}
