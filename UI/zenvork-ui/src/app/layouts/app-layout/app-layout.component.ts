import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
  protected isMobile = false;
  protected drawerOpened = true;
  protected pageTitle = 'Dashboard';

  constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly router: Router,
  ) {
    // The same navigation becomes an overlay drawer when space is limited.
    this.breakpointObserver.observe('(max-width: 860px)').subscribe((result) => {
      this.isMobile = result.matches;
      this.drawerOpened = !result.matches;
    });

    // Reads the active child route so the mobile toolbar reflects its workspace.
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe(() => {
      this.updatePageDetails();
    });
  }

  /** Opens or closes the mobile navigation drawer. */
  protected toggleDrawer(): void {
    this.drawerOpened = !this.drawerOpened;
  }

  /** Closes the drawer after mobile navigation. */
  protected closeDrawer(): void {
    if (this.isMobile) this.drawerOpened = false;
  }

  /** Updates the toolbar label from the deepest active app route. */
  private updatePageDetails(): void {
    let activeRoute = this.router.routerState.snapshot.root;
    while (activeRoute.firstChild) activeRoute = activeRoute.firstChild;

    this.pageTitle = (activeRoute.data['title'] as string) ?? 'Dashboard';
  }
}
