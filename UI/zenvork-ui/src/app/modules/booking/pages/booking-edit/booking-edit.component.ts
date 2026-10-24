import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BusinessDateTimeService } from '../../../../core/services/business-date-time.service';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppDatePickerComponent } from '../../../../shared/date-picker/date-picker.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AppSelectComponent, AppSelectOption } from '../../../../shared/select/select.component';
import { AppTimePickerComponent } from '../../../../shared/time-picker/time-picker.component';
import { QuantityStepperComponent } from '../../../../shared/quantity-stepper/quantity-stepper.component';
import { ClientRecord } from '../../../client/services/client.service';
import { ResourceRecord, ResourceTypeOption } from '../../../resources/services/resource.service';
import { ServiceOption } from '../../../service/services/service.service';
import {
  BookingRecord,
  BookingDiscountType,
  BookingService,
  BookingServiceItemRequest,
  UpdateBookingRequest,
} from '../../services/booking.service';
import { BookingFormService } from '../../services/booking-form.service';

@Component({
  selector: 'app-booking-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppDatePickerComponent,
    AppTimePickerComponent,
    QuantityStepperComponent,
  ],
  templateUrl: './booking-edit.component.html',
  styleUrl: './booking-edit.component.scss',
})
export class BookingEditComponent implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly formService = inject(BookingFormService);
  protected readonly dateTime = inject(BusinessDateTimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly dateControl = new FormControl('', { nonNullable: true });
  protected readonly clientSearchControl = new FormControl('', { nonNullable: true });
  protected readonly startTimeControl = new FormControl('', { nonNullable: true });
  protected readonly endTimeControl = new FormControl('', { nonNullable: true });
  protected readonly notesControl = new FormControl('', { nonNullable: true });
  protected readonly serviceIdsControl = new FormControl<string[]>([], { nonNullable: true });
  protected readonly discountTypeControl = new FormControl<BookingDiscountType>('none', {
    nonNullable: true,
  });
  protected readonly discountValueControl = new FormControl('', { nonNullable: true });
  protected readonly extraAmountControl = new FormControl('', { nonNullable: true });
  protected readonly resourceSelections: Record<string, FormControl<string>> = {};
  protected readonly serviceQuantities: Record<string, FormControl<string>> = {};

  protected booking: BookingRecord | null = null;
  protected clients: ClientRecord[] = [];
  protected selectedClient: ClientRecord | null = null;
  protected resources: ResourceRecord[] = [];
  protected resourceTypes: ResourceTypeOption[] = [];
  protected serviceOptions: ServiceOption[] = [];
  protected loading = true;
  protected saving = false;
  protected errorMessage = '';
  private initialDate = '';
  private initialStartTime = '';
  private initialEndTime = '';
  private initialNotes = '';
  private initialServiceItems: BookingServiceItemRequest[] = [];
  private initialDiscountType: BookingDiscountType = 'none';
  private initialDiscountValue = 0;
  private initialExtraAmountPaise = 0;
  private initialResourceIds: string[] = [];

  /** Loads the tenant-owned booking and the active choices needed for fields that may be edited. */
  ngOnInit(): void {
    this.serviceIdsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((serviceIds) => {
        serviceIds.forEach((serviceId) => {
          this.serviceQuantityControl(serviceId);
        });
      });
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      this.errorMessage = 'Booking not found.';
      this.loading = false;
      return;
    }

    forkJoin({
      booking: this.bookingService.getBooking(bookingId),
      formData: this.formService.loadFormData(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ booking: { booking }, formData }) => {
          this.booking = booking;
          this.clients = formData.clients.clients;
          this.resources = formData.resources.resources;
          this.resourceTypes = formData.resourceTypes.resourceTypes;
          this.serviceOptions = formData.services.services;
          this.resourceTypes.forEach(
            (type) =>
              (this.resourceSelections[type.code] = new FormControl('', { nonNullable: true })),
          );
          this.populateForm(booking);
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to load this booking for editing.';
          this.loading = false;
        },
      });
  }

  /** Only pre-check-in bookings may change their planned slot. */
  protected get canEditSchedule(): boolean {
    return this.booking?.status === 'PENDING' || this.booking?.status === 'SCHEDULED';
  }

  /** A live booking may add the person or assets needed by a newly added service. */
  protected get canEditResources(): boolean {
    return ['PENDING', 'SCHEDULED', 'CHECKED_IN'].includes(this.booking?.status ?? '');
  }

  /** Client correction is allowed only before a booking has been scheduled or checked in. */
  protected get canEditClient(): boolean {
    return this.booking?.status === 'PENDING';
  }

  /** The bill remains editable until completion, when its saved price snapshots become immutable. */
  protected get canEditBill(): boolean {
    return ['PENDING', 'SCHEDULED', 'CHECKED_IN'].includes(this.booking?.status ?? '');
  }

  protected get canEdit(): boolean {
    return this.canEditResources || this.canEditBill;
  }

  protected resourceOptions(type: ResourceTypeOption): AppSelectOption[] {
    return this.formService.resourceOptions(type, this.resources);
  }

  protected matchingClients(): ClientRecord[] {
    return this.formService.matchingClients(this.clients, this.clientSearchControl.value);
  }

  protected selectClient(client: ClientRecord): void {
    this.selectedClient = client;
    this.clientSearchControl.setValue('');
    this.errorMessage = '';
  }

  protected changeClient(): void {
    this.selectedClient = null;
    this.errorMessage = '';
  }

  protected resourceControl(typeCode: string): FormControl<string> {
    return this.resourceSelections[typeCode];
  }

  protected serviceOptionsForSelect(): AppSelectOption[] {
    return this.serviceOptions.map((service) => ({
      value: service._id,
      label: `${service.name} · ${this.formatAmount(service.pricePaise)}`,
    }));
  }

  protected selectedServices(): ServiceOption[] {
    const selectedIds = new Set(this.serviceIdsControl.value);
    return this.serviceOptions.filter((service) => selectedIds.has(service._id));
  }

  /** Keeps line-item quantities stable while selected services are edited. */
  protected serviceQuantityControl(serviceId: string): FormControl<string> {
    if (!this.serviceQuantities[serviceId]) {
      this.serviceQuantities[serviceId] = new FormControl('1', { nonNullable: true });
    }
    return this.serviceQuantities[serviceId];
  }

  protected selectedServiceItems(): BookingServiceItemRequest[] {
    return this.serviceIdsControl.value.map((serviceId) => {
      const quantity = Number(this.serviceQuantityControl(serviceId).value);
      return { serviceId, quantity };
    });
  }

  protected discountOptions(): AppSelectOption[] {
    return [
      { value: 'none', label: 'No discount' },
      { value: 'amount', label: 'Amount (₹)' },
      { value: 'percentage', label: 'Percentage (%)' },
    ];
  }

  /** Shows the staffing rule before an owner saves a service change. */
  protected requiresPersonResource(): boolean {
    const selectedIds = new Set(this.serviceIdsControl.value);
    return this.serviceOptions.some(
      (service) => selectedIds.has(service._id) && service.requiresPersonResource,
    );
  }

  protected hasSelectedPersonResource(): boolean {
    return this.resourceTypes
      .filter((type) => type.isPerson)
      .some((type) => Boolean(this.resourceControl(type.code)?.value));
  }

  protected personRequirementText(): string {
    return 'Assign a team member or professional';
  }

  protected estimatedTotal(): string {
    const quantities = new Map(
      this.selectedServiceItems().map((item) => [item.serviceId, item.quantity]),
    );
    const servicesTotal = this.serviceOptions.reduce((total, service) => {
      return total + service.pricePaise * (quantities.get(service._id) ?? 0);
    }, 0);
    const extra = this.extraAmountPaise();
    const discountValue = Number(this.discountValueControl.value || 0);
    const discount =
      this.discountTypeControl.value === 'amount'
        ? Math.round(discountValue * 100)
        : this.discountTypeControl.value === 'percentage'
          ? Math.floor((servicesTotal * discountValue) / 100)
          : 0;
    return this.formatAmount(Math.max(0, servicesTotal - discount) + (extra >= 0 ? extra : 0));
  }

  protected formatAmount(amountPaise: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amountPaise / 100);
  }

  /** Saves only changed, backend-permitted fields so an old service snapshot is never rewritten accidentally. */
  protected save(): void {
    if (!this.booking || this.saving || !this.canEdit) return;

    const payload = this.buildPayload();
    if (!payload) return;
    if (Object.keys(payload).length === 0) {
      void this.router.navigate(['/app/booking'], { queryParamsHandling: 'preserve' });
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.bookingService
      .updateBooking(this.booking._id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/app/booking'], { queryParamsHandling: 'preserve' });
        },
        error: (error) => {
          this.errorMessage = error.error?.message ?? 'Unable to save booking changes.';
          this.saving = false;
        },
      });
  }

  protected cancel(): void {
    if (!this.saving && this.booking) {
      void this.router.navigate(['/app/booking'], { queryParamsHandling: 'preserve' });
    }
  }

  private populateForm(booking: BookingRecord): void {
    const start = this.dateTime.businessDateTimeInputValues(booking.scheduledStartAt);
    const end = this.dateTime.businessDateTimeInputValues(booking.scheduledEndAt);
    this.initialDate = start?.date ?? '';
    this.initialStartTime = start?.time ?? '';
    this.initialEndTime = end?.time ?? '';
    this.initialNotes = booking.notes;
    this.initialServiceItems = (booking.services ?? []).map((service) => ({
      serviceId: service.serviceId,
      quantity: service.quantity ?? 1,
    }));
    this.initialDiscountType = booking.discountType;
    this.initialDiscountValue = booking.discountValue;
    this.initialExtraAmountPaise = booking.extraAmountPaise;
    this.initialResourceIds = booking.resources.map((resource) => resource._id);
    this.selectedClient = this.clients.find((client) => client._id === booking.client?._id) ?? null;
    this.dateControl.setValue(this.initialDate);
    this.startTimeControl.setValue(this.initialStartTime);
    this.endTimeControl.setValue(this.initialEndTime);
    this.notesControl.setValue(this.initialNotes);
    this.initialServiceItems.forEach((item) => {
      this.serviceQuantityControl(item.serviceId).setValue(String(item.quantity));
    });
    this.serviceIdsControl.setValue(this.initialServiceItems.map((item) => item.serviceId));
    this.discountTypeControl.setValue(this.initialDiscountType);
    this.discountValueControl.setValue(
      this.initialDiscountType === 'amount'
        ? this.moneyInputValue(this.initialDiscountValue)
        : this.initialDiscountType === 'percentage'
          ? String(this.initialDiscountValue / 100)
          : '',
    );
    this.extraAmountControl.setValue(this.moneyInputValue(this.initialExtraAmountPaise));

    booking.resources.forEach((resource) => {
      const control = this.resourceSelections[resource.resourceType];
      if (control) control.setValue(resource._id);
    });
  }

  private buildPayload(): UpdateBookingRequest | null {
    if (!this.booking) return null;
    const payload: UpdateBookingRequest = {};
    const notes = this.notesControl.value.trim();
    const serviceItems = this.selectedServiceItems();
    const extraAmountPaise = this.extraAmountPaise();

    if (extraAmountPaise < 0 || !Number.isSafeInteger(extraAmountPaise)) {
      this.errorMessage = 'Enter a valid non-negative extra charge.';
      return null;
    }
    if (serviceItems.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
      this.errorMessage = 'Each selected service needs a quantity of at least one.';
      return null;
    }
    if (notes !== this.initialNotes) payload.notes = notes;
    if (
      this.canEditClient &&
      this.selectedClient &&
      this.selectedClient._id !== this.booking.client?._id
    ) {
      payload.clientId = this.selectedClient._id;
    }
    if (!this.sameServiceItems(serviceItems, this.initialServiceItems)) {
      payload.serviceItems = serviceItems;
    }
    const discountResult = this.formService.buildDiscount(
      this.discountTypeControl.value,
      this.discountValueControl.value,
    );
    if (typeof discountResult === 'string') {
      this.errorMessage = discountResult;
      return null;
    }
    const discountChanged =
      this.discountTypeControl.value !== this.initialDiscountType ||
      this.discountValueAsStored() !== this.initialDiscountValue;
    if (discountChanged) {
      payload.discount = discountResult;
    }
    if (extraAmountPaise !== this.initialExtraAmountPaise)
      payload.extraAmountPaise = extraAmountPaise;

    const resourceIds = this.canEditResources
      ? this.resourceTypes
          .map((type) => this.resourceControl(type.code)?.value)
          .filter((value): value is string => Boolean(value))
      : [];
    if (
      this.booking.status === 'CHECKED_IN' &&
      this.requiresPersonResource() &&
      !this.hasSelectedPersonResource()
    ) {
      this.errorMessage = 'Assign a team member or professional before saving these services.';
      return null;
    }
    if (this.canEditResources && !this.sameIds(resourceIds, this.initialResourceIds)) {
      payload.resourceIds = resourceIds;
    }
    if (!this.canEditSchedule) return payload;
    const hasScheduleValue = [
      this.dateControl.value,
      this.startTimeControl.value,
      this.endTimeControl.value,
    ].some(Boolean);
    if (
      hasScheduleValue &&
      (!this.dateControl.value || !this.startTimeControl.value || !this.endTimeControl.value)
    ) {
      this.errorMessage =
        'Date, start time, and end time must all be provided for a scheduled booking.';
      return null;
    }
    if (this.booking.status === 'SCHEDULED' && !hasScheduleValue) {
      this.errorMessage = 'A scheduled booking must retain its date and time.';
      return null;
    }
    if (this.booking.status === 'PENDING' && resourceIds.length > 0 && !hasScheduleValue) {
      this.errorMessage = 'Select a date and time before assigning resources to a pending booking.';
      return null;
    }
    const scheduleChanged =
      this.dateControl.value !== this.initialDate ||
      this.startTimeControl.value !== this.initialStartTime ||
      this.endTimeControl.value !== this.initialEndTime;
    if (scheduleChanged && hasScheduleValue) {
      try {
        const scheduledStartAt = this.dateTime.toBusinessDateTimeIso(
          this.dateControl.value,
          this.startTimeControl.value,
        );
        const scheduledEndAt = this.dateTime.toBusinessDateTimeIso(
          this.dateControl.value,
          this.endTimeControl.value,
        );
        if (scheduledEndAt <= scheduledStartAt) {
          this.errorMessage = 'End time must be after start time.';
          return null;
        }
        payload.scheduledStartAt = scheduledStartAt;
        payload.scheduledEndAt = scheduledEndAt;
      } catch {
        this.errorMessage = 'Enter a valid appointment date and time.';
        return null;
      }
    }
    return payload;
  }

  private extraAmountPaise(): number {
    const value = this.extraAmountControl.value.trim();
    if (!value) return 0;
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return -1;
    return Math.round(Number(value) * 100);
  }

  private moneyInputValue(amountPaise: number): string {
    return amountPaise ? (amountPaise / 100).toFixed(2).replace(/\.00$/, '') : '';
  }

  private sameIds(first: string[], second: string[]): boolean {
    return first.length === second.length && first.every((id) => second.includes(id));
  }

  private sameServiceItems(
    first: BookingServiceItemRequest[],
    second: BookingServiceItemRequest[],
  ): boolean {
    return (
      first.length === second.length &&
      first.every((item) => {
        return second.some((initialItem) => {
          return initialItem.serviceId === item.serviceId && initialItem.quantity === item.quantity;
        });
      })
    );
  }

  private discountValueAsStored(): number {
    const value = Number(this.discountValueControl.value || 0);
    if (!Number.isFinite(value)) {
      return -1;
    }
    return this.discountTypeControl.value === 'amount'
      ? Math.round(value * 100)
      : Math.round(value * 100);
  }
}
