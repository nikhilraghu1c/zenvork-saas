import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideMarkdown } from 'ngx-markdown';
import { AssistantWorkspaceComponent } from './assistant-workspace.component';

describe('AssistantWorkspaceComponent', () => {
  let component: AssistantWorkspaceComponent;
  let fixture: ComponentFixture<AssistantWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantWorkspaceComponent],
      providers: [provideHttpClient(), provideMarkdown(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
