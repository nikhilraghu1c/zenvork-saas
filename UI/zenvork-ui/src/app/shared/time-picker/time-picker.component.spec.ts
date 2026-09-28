import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppTimePickerComponent } from './time-picker.component';

describe('AppTimePickerComponent', () => {
  let component: AppTimePickerComponent;
  let fixture: ComponentFixture<AppTimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppTimePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppTimePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Start time');
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
