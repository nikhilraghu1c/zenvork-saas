import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientService } from '../../services/client.service';
import { ClientListComponent } from './client-list.component';

describe('ClientListComponent', () => {
  it('shows the empty state when the tenant has no clients', async () => {
    await TestBed.configureTestingModule({
      imports: [ClientListComponent],
      providers: [{ provide: ClientService, useValue: { getClients: () => of({ clients: [] }) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ClientListComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No Clients Yet');
  });
});
