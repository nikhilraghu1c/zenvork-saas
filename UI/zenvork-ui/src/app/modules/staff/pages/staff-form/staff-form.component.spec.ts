import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { StaffFormComponent } from './staff-form.component';

describe('StaffFormComponent', () => {
  let component: StaffFormComponent;
  let fixture: ComponentFixture<StaffFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffFormComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
