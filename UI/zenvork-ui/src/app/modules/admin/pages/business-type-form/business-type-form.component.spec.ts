import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BusinessTypeService } from '../../services/business-type.service';
import { BusinessTypeFormComponent } from './business-type-form.component';

describe('BusinessTypeFormComponent', () => {
  let component: BusinessTypeFormComponent;
  let fixture: ComponentFixture<BusinessTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessTypeFormComponent],
      providers: [{ provide: BusinessTypeService, useValue: { getAll: () => of({ businessTypes: [] }) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessTypeFormComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
