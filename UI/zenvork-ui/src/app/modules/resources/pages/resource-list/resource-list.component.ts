import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { AppButtonComponent } from '../../../../shared/button/button.component';
import { AppInputComponent } from '../../../../shared/input/input.component';
import { AuthService } from '../../../auth/services/auth.service';
import {
  ResourceRecord,
  ResourceService,
  ResourceTypeOption,
} from '../../services/resource.service';

interface ResourceGroup {
  code: string;
  name: string;
  activeCount: number;
  resources: ResourceRecord[];
}

@Component({
  selector: 'app-resource-list',
  imports: [ReactiveFormsModule, RouterLink, MatIconModule, AppButtonComponent, AppInputComponent],
  templateUrl: './resource-list.component.html',
  styleUrl: './resource-list.component.scss',
})
export class ResourceListComponent implements OnInit {
  private readonly service = inject(ResourceService);
  protected readonly isOwner = inject(AuthService).getCurrentUser()?.role === 'OWNER';

  /** Search value used to narrow resource names and types. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected resources: ResourceRecord[] = [];
  protected types: ResourceTypeOption[] = [];
  protected selectedType = 'ALL';
  protected selectedStatus: 'ACTIVE' | 'INACTIVE' | 'ALL' = 'ACTIVE';
  protected loading = true;
  protected errorMessage = '';

  /** Produces type chips only for types that have at least one resource. */
  protected get typeFilters(): { code: string; name: string; count: number }[] {
    return [
      { code: 'ALL', name: 'All', count: this.resources.length },
      ...this.orderedTypeCodes().map((code) => ({
        code,
        name: this.typeName(code),
        count: this.resources.filter((resource) => resource.resourceType === code).length,
      })),
    ];
  }

  /** Groups the current filtered result by resource type for a predictable, scan-friendly list. */
  protected get resourceGroups(): ResourceGroup[] {
    const filtered = this.resources.filter((resource) => this.matchesFilters(resource));
    const groupCodes =
      this.selectedType === 'ALL' ? this.orderedTypeCodes() : [this.selectedType];

    return groupCodes
      .map((code) => {
        const resources = filtered
          .filter((resource) => resource.resourceType === code)
          .sort(this.sortResources);
        const typeResources = this.resources.filter((resource) => resource.resourceType === code);

        return {
          code,
          name: this.typeName(code),
          resources,
          activeCount: typeResources.filter((resource) => resource.isActive).length,
        };
      })
      .filter((group) => group.resources.length > 0);
  }

  /** Loads both tenant resources and their configured display labels. */
  ngOnInit(): void {
    forkJoin({
      resources: this.service.getResources(),
      // Type labels improve grouping but must not hide resources if configuration cannot be loaded.
      options: this.service.getOptions().pipe(catchError(() => of({ resourceTypes: [] }))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ resources, options }) => {
          this.resources = resources.resources;
          this.types = options.resourceTypes;
        },
        error: (error) =>
          (this.errorMessage = error.error?.message ?? 'Unable to load resources.'),
      });
  }

  /** Updates the selected resource-type filter. */
  protected selectType(type: string): void {
    this.selectedType = type;
  }

  /** Updates the selected availability filter. */
  protected selectStatus(status: 'ACTIVE' | 'INACTIVE' | 'ALL'): void {
    this.selectedStatus = status;
  }

  /** Chooses a familiar icon without assuming a business type has a fixed catalog. */
  protected resourceIcon(resource: ResourceRecord): string {
    if (resource.isPerson) return 'person';

    const type = resource.resourceType.toLowerCase();
    if (type.includes('room')) return 'meeting_room';
    if (type.includes('chair')) return 'chair';
    if (type.includes('bed')) return 'bed';
    if (type.includes('equipment') || type.includes('machine')) return 'handyman';
    return 'category';
  }

  /** Gives each row only metadata that the current API actually supplies. */
  protected resourceSummary(resource: ResourceRecord): string {
    if (!resource.isActive) return 'Inactive and unavailable for new bookings';
    if (!resource.isPerson) return 'Available for bookings';
    return resource.linkedUserId ? 'Login account linked' : 'No login account linked';
  }

  /** Returns an accessible text label for the row's resource type. */
  protected resourceTypeName(resource: ResourceRecord): string {
    return this.typeName(resource.resourceType);
  }

  private matchesFilters(resource: ResourceRecord): boolean {
    const query = this.searchControl.value.trim().toLowerCase();
    const typeMatches = this.selectedType === 'ALL' || resource.resourceType === this.selectedType;
    const statusMatches =
      this.selectedStatus === 'ALL' ||
      (this.selectedStatus === 'ACTIVE' ? resource.isActive : !resource.isActive);
    const searchMatches =
      !query ||
      [resource.name, resource.resourceType, this.typeName(resource.resourceType)]
        .some((value) => value.toLowerCase().includes(query));

    return typeMatches && statusMatches && searchMatches;
  }

  /** Keeps configured type order first and retains any older type codes as a stable fallback. */
  private orderedTypeCodes(): string[] {
    const resourceCodes = new Set(this.resources.map((resource) => resource.resourceType));
    const configuredCodes = this.types
      .map((type) => type.code)
      .filter((code) => resourceCodes.has(code));
    const remainingCodes = [...resourceCodes]
      .filter((code) => !configuredCodes.includes(code))
      .sort((first, second) => this.typeName(first).localeCompare(this.typeName(second)));

    return [...configuredCodes, ...remainingCodes];
  }

  private typeName(code: string): string {
    const configuredType = this.types.find((type) => type.code === code);
    return configuredType?.name ?? this.humanizeTypeCode(code);
  }

  private humanizeTypeCode(code: string): string {
    return code
      .toLowerCase()
      .split(/[_-]/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private readonly sortResources = (first: ResourceRecord, second: ResourceRecord): number => {
    if (first.isActive !== second.isActive) return first.isActive ? -1 : 1;
    return first.name.localeCompare(second.name) || first._id.localeCompare(second._id);
  };
}
