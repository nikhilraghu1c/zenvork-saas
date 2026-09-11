import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

@Component({
  selector: 'app-app-layout',
  imports: [MatSidenavModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected isMobile = false;
  protected drawerOpened = true;
  protected mobilePageTitle = '';

  constructor(private readonly breakpointObserver: BreakpointObserver) {
    // The same navigation becomes an overlay drawer when space is limited.
    this.breakpointObserver
      .observe('(max-width: 860px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.isMobile = result.matches;
        this.drawerOpened = !result.matches;
      });

    this.updateMobilePageTitle();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updateMobilePageTitle());
  }

  /** Opens or closes the mobile navigation drawer. */
  protected toggleDrawer(): void {
    this.drawerOpened = !this.drawerOpened;
  }

  /** Closes the drawer after mobile navigation. */
  protected closeDrawer(): void {
    if (this.isMobile) this.drawerOpened = false;
  }

  /** Reads the deepest active route title for the mobile app bar. */
  private updateMobilePageTitle(): void {
    let route: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.mobilePageTitle = (route.data['title'] as string | undefined) ?? '';
  }
}
