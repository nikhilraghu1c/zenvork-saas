import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ResourceService } from './resource.service';

describe('ResourceService', () => {
  it('sends creation fields with credentials and no tenant identifier', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ResourceService);
    const http = TestBed.inject(HttpTestingController);
    const payload = { name: 'Room One', resourceType: 'ROOM', linkedUserId: null };
    service.createResource(payload).subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/resources'));
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.body).toEqual(payload);
    request.flush({ message: 'Resource created successfully' });
    http.verify();
  });
});
