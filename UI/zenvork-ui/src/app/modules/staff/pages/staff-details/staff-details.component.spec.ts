import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StaffService } from '../../services/staff.service';
import { StaffDetailsComponent } from './staff-details.component';

describe('StaffDetailsComponent', () => {
  let component: StaffDetailsComponent;
  let fixture: ComponentFixture<StaffDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'staff-id' } } } },
        { provide: StaffService, useValue: { getStaff: () => of({ users: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
