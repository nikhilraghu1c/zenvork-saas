import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface Industry {
  icon: string;
  name: string;
  description: string;
  imagePath: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, MatIconModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  protected readonly industries: Industry[] = [
    {
      icon: 'content_cut',
      name: 'Salons & beauty studios',
      description: 'Manage appointments, stylists, services, and returning clients.',
      imagePath: '/images/landing/salon-studio.webp',
    },
    {
      icon: 'spa',
      name: 'Spas & wellness centres',
      description: 'Coordinate treatments, practitioners, and resources with ease.',
      imagePath: '/images/landing/spa-wellness.webp',
    },
    {
      icon: 'medical_services',
      name: 'Clinics',
      description: 'Keep appointments, practitioners, and client visits organised.',
      imagePath: '/images/landing/clinic.webp',
    },
    {
      icon: 'person',
      name: 'Independent professionals',
      description: 'Run your bookings and clients as a makeup artist, therapist, or consultant.',
      imagePath: '/images/landing/independent-professional.webp',
    },
  ];

  protected readonly valueProps = [
    ['event_available', 'Organise your day', 'A clear view of bookings, staff, and resources.'],
    ['groups', 'Delight your clients', 'Keep client information together in one place.'],
    ['account_balance_wallet', 'Get paid with ease', 'Track payments and outstanding dues.'],
    ['insights', 'Make informed decisions', 'Simple insights to help your business grow.'],
  ];

  protected readonly workflow = [
    {
      number: '1',
      title: 'Take bookings',
      description: 'Manage appointments, services, staff, and resources in a few clicks.',
    },
    {
      number: '2',
      title: 'Deliver great service',
      description: 'Keep the day moving with a clear schedule and client context.',
    },
    {
      number: '3',
      title: 'Understand your business',
      description: 'Track completed work, payments, and the patterns that matter.',
    },
  ];
}
