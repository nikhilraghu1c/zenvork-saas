import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ResourceListComponent } from './resource-list.component';
import { ResourceService } from '../../services/resource.service';
import { AuthService } from '../../../auth/services/auth.service';

describe('ResourceListComponent', () => {
  it('handles unavailable data without inventing records or options', async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceListComponent],
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
    const fixture = TestBed.createComponent(ResourceListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No Resources Yet');
  });
});
