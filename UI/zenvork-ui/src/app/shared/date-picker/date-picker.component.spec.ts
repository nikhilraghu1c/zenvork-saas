import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDatePickerComponent } from './date-picker.component';

describe('AppDatePickerComponent', () => {
  let component: AppDatePickerComponent;
  let fixture: ComponentFixture<AppDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppDatePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppDatePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Date');
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
