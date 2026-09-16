import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ClientRecord, ClientService } from '../../client/services/client.service';
import {
  ResourceRecord,
  ResourceService,
  ResourceTypeOption,
} from '../../resources/services/resource.service';
import { BookingService, CreateBookingRequest } from './booking.service';

export interface BookingFormData {
  clients: ClientRecord[];
  resources: ResourceRecord[];
  resourceTypes: ResourceTypeOption[];
}

export interface BookingFormValues {
  selectedClient: ClientRecord | null;
  isNewClient: boolean;
  newClientName: string;
  newClientMobile: string;
  newClientEmail: string;
  resourceIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export type BookingPayloadResult =
  | { payload: CreateBookingRequest; errorMessage: '' }
  | { payload: null; errorMessage: string };

@Injectable({ providedIn: 'root' })
export class BookingFormService {
  private readonly clientService = inject(ClientService);
  private readonly resourceService = inject(ResourceService);
  private readonly bookingService = inject(BookingService);

  /** Loads all tenant-scoped records required by the booking form in parallel. */
  loadFormData() {
    return forkJoin({
      clients: this.clientService.getClients(),
      resources: this.resourceService.getResources(),
      resourceTypes: this.resourceService.getOptions(),
    });
  }

  /** Filters locally loaded tenant clients so typing does not issue repeated HTTP requests. */
  matchingClients(clients: ClientRecord[], query: string): ClientRecord[] {
    const term = query.trim().toLowerCase();
    if (!term) return clients.slice(0, 3);
    return clients
      .filter((client) =>
        [client.name, client.mobile, client.email ?? ''].some((value) =>
          value.toLowerCase().includes(term),
        ),
      )
      .slice(0, 5);
  }

  /** Builds generic resource-type choices without embedding salon-specific assumptions. */
  resourceOptions(type: ResourceTypeOption, resources: ResourceRecord[]) {
    return [
      { value: '', label: 'No assignment yet' },
      ...resources
        .filter((resource) => resource.resourceType === type.code && resource.isActive)
        .map((resource) => ({ value: resource._id, label: resource.name })),
    ];
  }

  /** Returns a selected resource name for summary display. */
  selectedResourceName(resourceId: string | undefined, resources: ResourceRecord[]): string {
    return resources.find((resource) => resource._id === resourceId)?.name ?? 'Not assigned';
  }

  /** Validates and converts India-local form values into the backend booking contract. */
  buildPayload(values: BookingFormValues): BookingPayloadResult {
    const hasScheduleValue = [values.date, values.startTime, values.endTime].some(Boolean);
    if (!values.selectedClient && !values.isNewClient) {
      return { payload: null, errorMessage: 'Select an existing client or add a new client.' };
    }
    if (values.isNewClient && !values.newClientName.trim()) {
      return { payload: null, errorMessage: 'New client name is required.' };
    }
    if (values.isNewClient && !values.newClientMobile.trim()) {
      return { payload: null, errorMessage: 'New client mobile number is required.' };
    }
    if (values.isNewClient && !/^\d{10}$/.test(values.newClientMobile.trim())) {
      return { payload: null, errorMessage: 'New client mobile number must contain 10 digits.' };
    }
    if (hasScheduleValue && (!values.date || !values.startTime || !values.endTime)) {
      return {
        payload: null,
        errorMessage:
          'Date, start time, and end time must all be provided for a scheduled booking.',
      };
    }

    const payload: CreateBookingRequest = {
      resourceIds: values.resourceIds,
      notes: values.notes.trim(),
    };
    if (values.selectedClient) payload.clientId = values.selectedClient._id;
    if (values.isNewClient) {
      payload.client = {
        name: values.newClientName.trim(),
        mobile: values.newClientMobile.trim(),
        ...(values.newClientEmail.trim() ? { email: values.newClientEmail.trim() } : {}),
      };
    }
    if (hasScheduleValue) {
      const start = new Date(`${values.date}T${values.startTime}:00+05:30`);
      const end = new Date(`${values.date}T${values.endTime}:00+05:30`);
      if (end <= start)
        return { payload: null, errorMessage: 'End time must be after start time.' };
      payload.scheduledStartAt = start.toISOString();
      payload.scheduledEndAt = end.toISOString();
    }
    return { payload, errorMessage: '' };
  }

  /** Submits a validated booking request through the domain booking API. */
  createBooking(payload: CreateBookingRequest) {
    return this.bookingService.createBooking(payload);
  }
}
