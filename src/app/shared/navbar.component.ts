import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../core/theme.service';
import { AuthService } from '../core/auth.service';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  mobileOpen = false;
  settingsOpen = false;
  accountOpen = false;
  lang = localStorage.getItem('lang') || 'en';
  hrNotif = false;

  @ViewChild('settingsBtn') settingsBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('settingsMenu') settingsMenu!: ElementRef<HTMLDivElement>;
  @ViewChild('accountBtn') accountBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('accountMenu') accountMenu!: ElementRef<HTMLDivElement>;

  constructor(
    private theme: ThemeService,
    private translate: TranslateService,
    public auth: AuthService,
    private router: Router,
    private notif: NotificationService
  ) {
    this.hrNotif = this.notif.isHrEnabled();
  }

  closeMobile() { this.mobileOpen = false; }
  @HostListener('window:resize') onResize() { if (window.innerWidth >= 992) this.mobileOpen = false; }

  toggleSettings(e: Event) { e.stopPropagation(); this.settingsOpen = !this.settingsOpen; }
  toggleAccount(e: Event) { e.stopPropagation(); this.accountOpen = !this.accountOpen; }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const t = ev.target as Node;
    if (this.settingsOpen && !this.settingsBtn?.nativeElement.contains(t) && !this.settingsMenu?.nativeElement.contains(t)) {
      this.settingsOpen = false;
    }
    if (this.accountOpen && !this.accountBtn?.nativeElement.contains(t) && !this.accountMenu?.nativeElement.contains(t)) {
      this.accountOpen = false;
    }
  }

  isDark() { return this.theme.get() === 'dark'; }
  onThemeToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.theme.set(checked ? 'dark' : 'light');
  }
  onLangChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.lang = v;
    localStorage.setItem('lang', v);
    this.translate.use(v);
  }

  onHrToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.hrNotif = checked;
    this.notif.setHrEnabled(checked);
  }
  async testNotification() {
    const perm = await this.notif.requestPermission();
    if (perm === 'granted') this.notif.send('HR Alerts', 'This is a test notification.');
  }

  logout() {
    this.auth.logout();
    this.accountOpen = false;
    this.router.navigate(['/login']);
  }
}
