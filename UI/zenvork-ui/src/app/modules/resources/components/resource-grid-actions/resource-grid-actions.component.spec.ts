import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResourceGridActionsComponent } from './resource-grid-actions.component';

describe('ResourceGridActionsComponent', () => {
  let component: ResourceGridActionsComponent;
  let fixture: ComponentFixture<ResourceGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceGridActionsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourceGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
