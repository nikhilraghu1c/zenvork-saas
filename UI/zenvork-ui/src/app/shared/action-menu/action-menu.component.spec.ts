import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppActionMenuComponent } from './action-menu.component';

describe('AppActionMenuComponent', () => {
  let component: AppActionMenuComponent;
  let fixture: ComponentFixture<AppActionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppActionMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppActionMenuComponent);
    component = fixture.componentInstance;
    component.ariaLabel = 'Record actions';
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
