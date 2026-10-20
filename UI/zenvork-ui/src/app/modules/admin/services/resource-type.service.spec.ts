import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ResourceTypeService } from './resource-type.service';

describe('ResourceTypeService', () => {
  it('creates the service', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    expect(TestBed.inject(ResourceTypeService)).toBeTruthy();
  });
});
