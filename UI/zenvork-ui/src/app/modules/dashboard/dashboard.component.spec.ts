import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './services/dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { getCurrentUser: () => ({ name: 'Owner', role: 'OWNER' }) },
        },
        {
          provide: DashboardService,
          useValue: {
            getResources: () => of({ resources: [] }),
            getStaffUsers: () => of({ users: [] }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
