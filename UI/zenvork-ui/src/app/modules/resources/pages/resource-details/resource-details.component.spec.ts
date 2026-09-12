import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ResourceDetailsComponent } from './resource-details.component';
import { ResourceService } from '../../services/resource.service';
import { AuthService } from '../../../auth/services/auth.service';

describe('ResourceDetailsComponent', () => {
  it('handles unavailable data without inventing records or options', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceDetailsComponent],
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
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResourceDetailsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resource not found.');
  });
});
