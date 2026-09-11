import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StaffService } from '../../services/staff.service';
import { StaffListComponent } from './staff-list.component';

describe('StaffListComponent', () => {
  let component: StaffListComponent;
  let fixture: ComponentFixture<StaffListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffListComponent],
      providers: [
        provideRouter([]),
        { provide: StaffService, useValue: { getStaff: () => of({ users: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
