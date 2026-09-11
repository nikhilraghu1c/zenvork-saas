import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface DashboardResource {
  _id: string;
  name: string;
  resourceType: string;
  isActive: boolean;
}

export interface DashboardStaffUser {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  role: 'STAFF';
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly api: ApiService) {}

  /** Loads tenant-scoped resources for the dashboard summary. */
  getResources(): Observable<{ resources: DashboardResource[] }> {
    return this.api.get<{ resources: DashboardResource[] }>('resources');
  }

  /** Loads owner-visible staff accounts for the dashboard summary. */
  getStaffUsers(): Observable<{ users: DashboardStaffUser[] }> {
    return this.api.get<{ users: DashboardStaffUser[] }>('users');
  }
}
