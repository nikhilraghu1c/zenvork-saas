import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppSelectComponent } from '../../../../shared/select/select.component';
import { ClientRecord } from '../../../client/services/client.service';
import { ResourceRecord, ResourceTypeOption } from '../../../resources/services/resource.service';
import { BookingFormService } from '../../services/booking-form.service';

@Component({
  selector: 'app-booking-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
  ],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss',
})
export class BookingFormComponent implements OnInit {
  private readonly formService = inject(BookingFormService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clientSearchControl = new FormControl('', { nonNullable: true });
  protected readonly newClientNameControl = new FormControl('', { nonNullable: true });
  protected readonly newClientMobileControl = new FormControl('', { nonNullable: true });
  protected readonly newClientEmailControl = new FormControl('', { nonNullable: true });
  protected readonly dateControl = new FormControl('', { nonNullable: true });
  protected readonly startTimeControl = new FormControl('', { nonNullable: true });
  protected readonly endTimeControl = new FormControl('', { nonNullable: true });
  protected readonly notesControl = new FormControl('', { nonNullable: true });
  protected readonly resourceSelections: Record<string, FormControl<string>> = {};

  protected clients: ClientRecord[] = [];
  protected resources: ResourceRecord[] = [];
  protected resourceTypes: ResourceTypeOption[] = [];
  protected selectedClient: ClientRecord | null = null;
  protected showNewClientForm = false;
  protected loading = true;
  protected submitting = false;
  protected errorMessage = '';

  /** Loads only tenant-owned clients, resources, and configured resource types needed by the form. */
  ngOnInit(): void {
    this.formService
      .loadFormData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ clients, resources, resourceTypes }) => {
          this.clients = clients.clients;
          this.resources = resources.resources;
          this.resourceTypes = resourceTypes.resourceTypes;
          this.resourceTypes.forEach(
            (type) =>
              (this.resourceSelections[type.code] = new FormControl('', { nonNullable: true })),
          );
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load booking form data.';
          this.loading = false;
        },
      });
  }

  /** Narrows the local tenant client list without sending a request for every key press. */
  protected matchingClients(): ClientRecord[] {
    return this.formService.matchingClients(this.clients, this.clientSearchControl.value);
  }

  /** Selects an existing client and clears any in-progress inline-client choice. */
  protected selectClient(client: ClientRecord): void {
    this.selectedClient = client;
    this.showNewClientForm = false;
    this.errorMessage = '';
  }

  /** Opens the inline new-client form and uses an entered phone number when available. */
  protected addNewClient(): void {
    this.selectedClient = null;
    this.showNewClientForm = true;
    if (/^\d{10}$/.test(this.clientSearchControl.value.trim())) {
      this.newClientMobileControl.setValue(this.clientSearchControl.value.trim());
    }
    this.errorMessage = '';
  }

  /** Returns to client search without accidentally starting an inline new-client record. */
  protected changeClient(): void {
    this.selectedClient = null;
    this.showNewClientForm = false;
    this.errorMessage = '';
  }

  /** Returns the resource choices configured for one generic business resource type. */
  protected resourceOptions(type: ResourceTypeOption) {
    return this.formService.resourceOptions(type, this.resources);
  }

  /** Gives each resource-type field a stable reactive control after configuration loads. */
  protected resourceControl(typeCode: string): FormControl<string> {
    return this.resourceSelections[typeCode];
  }

  /** Creates the booking and redirects to its detail workspace after a successful response. */
  protected submit(): void {
    const { payload, errorMessage } = this.formService.buildPayload({
      selectedClient: this.selectedClient,
      isNewClient: this.showNewClientForm,
      newClientName: this.newClientNameControl.value,
      newClientMobile: this.newClientMobileControl.value,
      newClientEmail: this.newClientEmailControl.value,
      resourceIds: this.resourceTypes
        .map((type) => this.resourceControl(type.code)?.value)
        .filter((value): value is string => Boolean(value)),
      date: this.dateControl.value,
      startTime: this.startTimeControl.value,
      endTime: this.endTimeControl.value,
      notes: this.notesControl.value,
    });
    this.errorMessage = errorMessage;
    if (!payload) return;

    this.submitting = true;
    this.formService
      .createBooking(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bookingId }) => {
          this.submitting = false;
          if (!bookingId) {
            this.errorMessage =
              'Booking was created, but its ID was not returned. Refresh the booking list.';
            return;
          }

          // Surface navigation failure instead of leaving the confirmation control in a loading state.
          void this.router.navigate(['/app/booking', bookingId]).then((navigated) => {
            if (!navigated)
              this.errorMessage = 'Booking was created, but the detail page could not open.';
          });
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to create booking.';
          this.submitting = false;
        },
      });
  }

  /** Provides a concise name for the sticky summary without exposing form internals to the template. */
  protected summaryClient(): string {
    if (this.selectedClient) return this.selectedClient.name;
    return this.showNewClientForm
      ? this.newClientNameControl.value.trim() || 'New client'
      : 'Not selected';
  }

  /** Displays selected resource names or an honest unassigned state in the confirmation summary. */
  protected summaryResource(type: ResourceTypeOption): string {
    return this.formService.selectedResourceName(this.resourceControl(type.code)?.value, this.resources);
  }
}
