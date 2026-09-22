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
            getSummary: () =>
              of({
                summary: {
                  period: 'today',
                  range: { from: '2026-09-21T18:30:00.000Z', to: '2026-09-22T18:30:00.000Z' },
                  bookingsCount: 0,
                  revenue: {
                    earnedPaise: 0,
                    previousEarnedPaise: 0,
                    collectedPaise: 0,
                    outstandingPaise: 0,
                  },
                  noShows: { count: 0, resolvedBookings: 0, rate: 0 },
                  activeStaffCount: 0,
                  topServices: [],
                  topStaff: [],
                },
              }),
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
