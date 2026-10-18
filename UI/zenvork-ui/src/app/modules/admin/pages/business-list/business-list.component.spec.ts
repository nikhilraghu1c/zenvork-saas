import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { BusinessListComponent } from './business-list.component';

describe('BusinessListComponent', () => {
  let component: BusinessListComponent;
  let fixture: ComponentFixture<BusinessListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessListComponent],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: { getBusinesses: () => of({ businesses: [] }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
