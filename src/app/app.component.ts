import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/navbar.component';
import { ThemeService } from './core/theme.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <!-- Show navbar + container on all routes except /login -->
    <ng-container *ngIf="!isLogin; else loginOnly">
      <app-navbar></app-navbar>
      <main class="container py-4">
        <router-outlet></router-outlet>
      </main>
    </ng-container>

    <!-- On /login we render the page alone (no navbar, no extra container) -->
    <ng-template #loginOnly>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent {
  isLogin = false;

  constructor(
    private router: Router,
    theme: ThemeService,
    translate: TranslateService
  ) {
    // theme & language
    theme.init();
    translate.use(localStorage.getItem('lang') || 'en');

    // decide when to hide shell
    const update = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      this.isLogin = path === '/login';
    };
    update(); // initial
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(update);
  }
}
