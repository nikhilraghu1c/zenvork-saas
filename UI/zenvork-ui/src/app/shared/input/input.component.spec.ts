import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppInputComponent } from './input.component';

describe('AppInputComponent', () => {
  let component: AppInputComponent;
  let fixture: ComponentFixture<AppInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppInputComponent);
    component = fixture.componentInstance;
    component.label = 'Business name';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should associate an outside label with its input', () => {
    component.labelPlacement = 'outside';
    component.inputId = 'business-name';
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(label.htmlFor).toBe('business-name');
    expect(input.id).toBe('business-name');
  });
});
