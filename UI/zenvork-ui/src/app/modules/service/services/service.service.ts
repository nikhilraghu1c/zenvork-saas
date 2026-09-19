import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface ServiceRecord {
  _id: string;
  name: string;
  description: string;
  pricePaise: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  name: string;
  description?: string;
  pricePaise: number;
  durationMinutes: number;
  isActive?: boolean;
}

export interface UpdateServicePayload extends Partial<ServicePayload> {
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ServiceService {
  constructor(private readonly api: ApiService) {}

  getServices() {
    return this.api.get<{ services: ServiceRecord[] }>('services');
  }
  getService(id: string) {
    return this.api.get<{ service: ServiceRecord }>(`services/${id}`);
  }
  createService(payload: ServicePayload) {
    return this.api.post<{ message: string; service: ServiceRecord }, ServicePayload>(
      'services',
      payload,
    );
  }
  updateService(id: string, payload: UpdateServicePayload) {
    return this.api.patch<{ message: string; service: ServiceRecord }, UpdateServicePayload>(
      `services/${id}`,
      payload,
    );
  }
}
