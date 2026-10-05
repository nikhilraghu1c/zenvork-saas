import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReminderSendConfirmationDialogComponent } from './reminder-send-confirmation-dialog.component';

describe('ReminderSendConfirmationDialogComponent', () => {
  let component: ReminderSendConfirmationDialogComponent;
  let fixture: ComponentFixture<ReminderSendConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderSendConfirmationDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ReminderSendConfirmationDialogComponent);
    component = fixture.componentInstance;
    component.clientName = 'Hemant';
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });
});
