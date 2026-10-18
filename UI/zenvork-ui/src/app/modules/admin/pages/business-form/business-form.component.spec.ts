import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BusinessTypeService } from '../../services/business-type.service';
import { AdminService } from '../../services/admin.service';
import { BusinessFormComponent } from './business-form.component';

describe('BusinessFormComponent', () => {
  let component: BusinessFormComponent;
  let fixture: ComponentFixture<BusinessFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessFormComponent],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: { createBusiness: () => of() } },
        { provide: BusinessTypeService, useValue: { getActive: () => of({ businessTypes: [] }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
