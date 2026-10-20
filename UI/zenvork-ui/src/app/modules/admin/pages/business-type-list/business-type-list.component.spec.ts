import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BusinessTypeService } from '../../services/business-type.service';
import { BusinessTypeListComponent } from './business-type-list.component';

describe('BusinessTypeListComponent', () => {
  let component: BusinessTypeListComponent;
  let fixture: ComponentFixture<BusinessTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessTypeListComponent],
      providers: [{ provide: BusinessTypeService, useValue: { getAll: () => of({ businessTypes: [] }) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(BusinessTypeListComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
