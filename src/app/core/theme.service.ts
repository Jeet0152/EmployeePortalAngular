import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark';
const KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private current: Theme = 'light';

    init() {
        const saved = (localStorage.getItem(KEY) as Theme) || 'light';
        this.set(saved);
    }

    get(): Theme { return this.current; }

    set(theme: Theme) {
        this.current = theme;
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem(KEY, theme);
    }

    toggle() { this.set(this.current === 'light' ? 'dark' : 'light'); }
}
