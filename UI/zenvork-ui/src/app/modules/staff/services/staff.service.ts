import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface StaffUser {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  role: 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffRequest {
  name: string;
  email?: string;
  mobile: string;
  password: string;
}

export interface StaffListResponse {
  users: StaffUser[];
}

@Injectable({ providedIn: 'root' })
export class StaffService {
  constructor(private readonly api: ApiService) {}

  /** Loads staff accounts belonging to the signed-in owner's business. */
  getStaff(): Observable<StaffListResponse> {
    return this.api.get<StaffListResponse>('users');
  }

  /** Creates a new staff account for the signed-in owner's business. */
  createStaff(payload: CreateStaffRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }, CreateStaffRequest>('users', payload);
  }

  /** Changes whether a staff account can sign in without deleting its operational history. */
  updateStaffStatus(
    staffId: string,
    isActive: boolean,
  ): Observable<{ message: string; user: StaffUser }> {
    return this.api.patch<{ message: string; user: StaffUser }, { isActive: boolean }>(
      `users/${staffId}/status`,
      { isActive },
    );
  }
}
