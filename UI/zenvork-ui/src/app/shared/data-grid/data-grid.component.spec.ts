import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppDataGridComponent } from './data-grid.component';

describe('AppDataGridComponent', () => {
  let component: AppDataGridComponent;
  let fixture: ComponentFixture<AppDataGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppDataGridComponent] }).compileComponents();
    fixture = TestBed.createComponent(AppDataGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
