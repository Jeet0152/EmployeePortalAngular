import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  lang = localStorage.getItem('lang') || 'en';
  dark = (localStorage.getItem('theme') || 'light') === 'dark';

  constructor(private theme: ThemeService, private translate: TranslateService) { }

  applyTheme() {
    this.theme.set(this.dark ? 'dark' : 'light');
  }
  applyLang() {
    localStorage.setItem('lang', this.lang);
    this.translate.use(this.lang);
  }
}
