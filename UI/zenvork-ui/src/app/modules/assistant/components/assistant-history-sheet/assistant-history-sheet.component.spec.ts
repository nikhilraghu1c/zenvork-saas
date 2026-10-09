import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssistantHistorySheetComponent } from './assistant-history-sheet.component';

describe('AssistantHistorySheetComponent', () => {
  let component: AssistantHistorySheetComponent;
  let fixture: ComponentFixture<AssistantHistorySheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantHistorySheetComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { conversations: [], selectedConversationId: null } },
        { provide: MatBottomSheetRef, useValue: { dismiss: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AssistantHistorySheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
