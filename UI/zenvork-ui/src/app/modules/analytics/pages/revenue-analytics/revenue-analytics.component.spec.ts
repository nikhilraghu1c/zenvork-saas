import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnalyticsService } from '../../services/analytics.service';
import { RevenueAnalyticsComponent } from './revenue-analytics.component';

describe('RevenueAnalyticsComponent', () => {
  let component: RevenueAnalyticsComponent;
  let fixture: ComponentFixture<RevenueAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueAnalyticsComponent],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            getRevenue: () =>
              of({
                period: 'month',
                range: { from: '2026-09-01T18:30:00.000Z', to: '2026-09-30T18:30:00.000Z' },
                revenue: {
                  billedPaise: 0,
                  billedBookingsCount: 0,
                  previousBilledPaise: 0,
                  collectedPaise: 0,
                  collectedBookingsCount: 0,
                  previousCollectedPaise: 0,
                  outstandingPaise: 0,
                  outstandingBookingsCount: 0,
                  extraChargesPaise: 0,
                },
                daily: [],
                services: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevenueAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
