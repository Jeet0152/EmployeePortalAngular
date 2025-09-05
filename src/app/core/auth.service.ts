import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface User {
    id: number;
    name: string;
    email: string;
    username: string;
}

const STORAGE_KEY = 'ep.auth.v1';

// Dummy account (email OR username + password)
const DUMMY = {
    user: { id: 1, name: 'HR Manager', email: 'hr@example.com', username: 'hr' } as User,
    password: 'password123'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _user$ = new BehaviorSubject<User | null>(this.read());
    readonly user$ = this._user$.asObservable();
    readonly isLoggedIn$ = this.user$.pipe(map(u => !!u));

    get currentUser(): User | null { return this._user$.value; }
    isLoggedIn(): boolean { return !!this._user$.value; }

    login(identifier: string, password: string): boolean {
        const ok =
            (identifier.trim().toLowerCase() === DUMMY.user.email.toLowerCase() ||
                identifier.trim().toLowerCase() === DUMMY.user.username.toLowerCase()) &&
            password === DUMMY.password;

        if (ok) {
            this.write(DUMMY.user);
            this._user$.next(DUMMY.user);
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem(STORAGE_KEY);
        this._user$.next(null);
    }

    // storage
    private read(): User | null {
        try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as User : null; }
        catch { return null; }
    }
    private write(u: User) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); } catch { }
    }
}
