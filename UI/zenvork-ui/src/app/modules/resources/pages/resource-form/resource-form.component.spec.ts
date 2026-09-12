import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ResourceFormComponent } from './resource-form.component';
import { ResourceService } from '../../services/resource.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StaffService } from '../../../staff/services/staff.service';

describe('ResourceFormComponent', () => {
  it('handles unavailable data without inventing records or options', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'missing' } } } },
        {
          provide: ResourceService,
          useValue: {
            getResources: () => of({ resources: [] }),
            getOptions: () => of({ resourceTypes: [] }),
          },
        },
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ id: 'owner', role: 'OWNER', name: 'Owner' }) },
        },
        { provide: StaffService, useValue: { getStaff: () => of({ users: [] }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResourceFormComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No active resource types');
  });
});
