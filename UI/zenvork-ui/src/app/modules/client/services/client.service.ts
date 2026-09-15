import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface ClientRecord {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private readonly api: ApiService) {}

  /** Loads clients belonging to the authenticated business for booking selection. */
  getClients() {
    return this.api.get<{ clients: ClientRecord[] }>('clients');
  }
}
