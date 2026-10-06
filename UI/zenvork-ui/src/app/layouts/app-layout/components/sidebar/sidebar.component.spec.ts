import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('makes the resource workspace available to staff', () => {
    const resources = component['navigationGroups']
      .flatMap((group) => group.items)
      .find((item) => item.route === '/app/resources');

    expect(resources?.requiresOwner).not.toBeTrue();
  });

  it('does not include the retired chat workspace', () => {
    const routes = component['navigationGroups'].flatMap((group) => group.items.map((item) => item.route));

    expect(routes).not.toContain('/app/chat');
  });
});
