import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface AdminBusiness {
  _id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  planExpiresAt: string | null;
  ownerId: { name: string; email: string; mobile: string } | null;
  businessTypeId: { code: string; name: string; iconName: string } | null;
  createdAt: string;
}
export interface CreateBusinessRequest {
  businessName: string;
  businessTypeId: string;
  ownerName: string;
  email: string;
  mobile: string;
  planExpiresAt: string | null;
}
export interface AdminDashboardSummary {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  expiringBusinesses: number;
  byBusinessType: Record<string, number>;
  businessTypeDistribution: Array<{
    code: string;
    name: string;
    iconName: string;
    isActive: boolean;
    count: number;
  }>;
  recentBusinesses: Array<{
    _id: string;
    name: string;
    status: string;
    createdAt: string;
    ownerName: string;
    businessType: { code: string; name: string; iconName: string };
  }>;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiService) {}
  getBusinesses() {
    return this.api.get<{ businesses: AdminBusiness[] }>('admin/businesses');
  }
  getSummary() {
    return this.api.get<AdminDashboardSummary>('admin/summary');
  }
  createBusiness(payload: CreateBusinessRequest) {
    return this.api.post<
      { message: string; business: AdminBusiness; temporaryPassword: string },
      CreateBusinessRequest
    >('admin/businesses', payload);
  }
  updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.api.patch<{ message: string; business: AdminBusiness }, { status: string }>(
      `admin/businesses/${id}/status`,
      { status },
    );
  }
  resetOwnerPassword(id: string) {
    return this.api.post<{ message: string; temporaryPassword: string }, Record<string, never>>(
      `admin/businesses/${id}/reset-owner-password`,
      {},
    );
  }
}
