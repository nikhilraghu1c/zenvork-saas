import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceTypeGridActionsComponent } from './resource-type-grid-actions.component';

describe('ResourceTypeGridActionsComponent', () => {
  let component: ResourceTypeGridActionsComponent;
  let fixture: ComponentFixture<ResourceTypeGridActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ResourceTypeGridActionsComponent] }).compileComponents();
    fixture = TestBed.createComponent(ResourceTypeGridActionsComponent);
    component = fixture.componentInstance;
  });

  it('shows deactivate for an active resource type', () => {
    component.agInit({ data: { isActive: true } } as never);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Deactivate');
  });
});
