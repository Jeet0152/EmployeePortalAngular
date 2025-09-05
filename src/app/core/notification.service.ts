import { Injectable } from '@angular/core';

export interface NotificationPrefs { hrEnabled: boolean; }
const STORAGE_KEY = 'ep.notif.prefs.v1';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private prefs: NotificationPrefs;

    constructor() { this.prefs = this.read(); }

    // ---- storage helpers ----
    private read(): NotificationPrefs {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return { hrEnabled: !!JSON.parse(raw).hrEnabled };
        } catch { }
        return { hrEnabled: false };
    }
    private write() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.prefs)); } catch { } }

    // ---- public API ----
    getPrefs(): NotificationPrefs { return { ...this.prefs }; }
    isHrEnabled(): boolean { return !!this.prefs.hrEnabled; }

    setHrEnabled(v: boolean) {
        this.prefs.hrEnabled = v;
        this.write();
        if (v) this.requestPermission();     // ask browser when enabling
    }

    async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
        if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'default') {
            try { return await Notification.requestPermission(); } catch { /* ignore */ }
        }
        return Notification.permission;
    }

    // Optional helper if you want to trigger alerts later (e.g., after add/delete)
    send(title: string, body: string) {
        if (!('Notification' in window)) return;
        if (!this.prefs.hrEnabled) return;
        if (Notification.permission !== 'granted') return;
        new Notification(title, { body });
    }
}
