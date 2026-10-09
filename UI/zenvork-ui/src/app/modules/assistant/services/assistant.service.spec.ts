import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssistantService } from './assistant.service';

describe('AssistantService', () => {
  let service: AssistantService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssistantService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssistantService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends messages to the selected private conversation', () => {
    service.sendMessage('conversation-id', 'Help me plan today').subscribe();

    const request = http.expectOne('http://localhost:4001/api/assistant/conversations/conversation-id/messages');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ content: 'Help me plan today' });
    expect(request.request.withCredentials).toBeTrue();
    request.flush({
      conversation: {
        _id: 'conversation-id',
        title: 'Help me plan today',
        createdAt: '2026-10-07T00:00:00.000Z',
        lastMessageAt: '2026-10-07T00:00:00.000Z',
        messages: [],
      },
    });
  });
});
