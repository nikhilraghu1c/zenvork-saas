import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface BusinessRegistrationRequest {
  businessName: string;
  businessType: 'SALON' | 'CLINIC';
  ownerName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface BusinessRegistrationResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessRegistrationService {
  constructor(private readonly api: ApiService) {}

  register(payload: BusinessRegistrationRequest): Observable<BusinessRegistrationResponse> {
    return this.api.post<BusinessRegistrationResponse, BusinessRegistrationRequest>(
      'register-business',
      payload,
    );
  }
}
