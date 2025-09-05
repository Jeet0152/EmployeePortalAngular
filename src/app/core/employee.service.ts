import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of } from 'rxjs';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  contactNumber?: string;
  imageUrl?: string;
  salary?: number;
  profession?: string;
}

interface RandomUserResponse { results: RandomUser[]; }
interface RandomUser {
  name: { first: string; last: string };
  email: string;
  phone?: string;
  cell?: string;
  picture?: { thumbnail?: string; medium?: string; large?: string };
  dob?: { age?: number };
}

const LS_REMOVED = 'emp_removed_ids';
const LS_ADDS = 'emp_local_adds';
const LS_EDITS = 'emp_local_edits';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  // Reliable dummy source; we map to stable IDs so your local changes stick.
  private readonly API =
    'https://randomuser.me/api/?results=50&nat=us,gb,ca,au,in';

  private _employees$ = new BehaviorSubject<Employee[]>([]);
  readonly employees$ = this._employees$.asObservable();

  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) { }

  // === PUBLIC API ===
  load() {
    this.loading = true; this.error = null;

    this.http.get<RandomUserResponse>(this.API).pipe(
      map(res => res?.results ?? []),
      map(list => list.map(p => this.mapToEmployee(p))),
      catchError(() => { this.error = 'Failed to load employees'; return of([] as Employee[]); })
    ).subscribe(serverList => {
      const merged = this.applyLocalChanges(serverList);
      this._employees$.next(merged);
      this.loading = false;
    });
  }

  /** Add or edit locally (persists to localStorage, overrides server forever). */
  upsertLocal(e: Employee) {
    // Clear any tombstone for this id
    this.removeRemoved(e.id);

    // If it's an existing server/local item -> record as local edit (deltas)
    const current = this._employees$.value;
    const exists = current.some(x => x.id === e.id);

    if (exists) {
      const { id, ...rest } = e;
      const edits = this.getEdits();
      const key = String(id);
      edits[key] = { ...(edits[key] || {}), ...rest };
      this.setEdits(edits);
    } else {
      // New local addition
      const adds = this.getAdds();
      const i = adds.findIndex(a => a.id === e.id);
      if (i > -1) adds[i] = e; else adds.unshift(e);
      this.setAdds(adds);
    }

    // Update stream immediately
    const list = [...current];
    const i = list.findIndex(x => x.id === e.id);
    if (i > -1) list[i] = { ...list[i], ...e };
    else list.unshift(e);
    this._employees$.next(list);
  }

  /** Delete locally (persists a tombstone so server data won’t bring it back). */
  removeLocal(id: number) {
    this.addRemoved(id);
    // Also remove from local adds/edits to keep storage tidy
    this.setAdds(this.getAdds().filter(a => a.id !== id));
    const edits = this.getEdits(); delete edits[String(id)]; this.setEdits(edits);
    this._employees$.next(this._employees$.value.filter(x => x.id !== id));
  }

  // Optional helper if you ever want to reset local changes:
  // resetLocal() { localStorage.removeItem(LS_REMOVED); localStorage.removeItem(LS_ADDS); localStorage.removeItem(LS_EDITS); this.load(); }

  // === INTERNALS ===
  private mapToEmployee(p: RandomUser): Employee {
    const id = this.stableIdFromEmail(p.email || '');
    return {
      id,
      firstName: p.name?.first ?? '—',
      lastName: p.name?.last ?? '',
      email: p.email ?? '',
      age: p.dob?.age,
      contactNumber: p.phone || p.cell,
      imageUrl: p.picture?.thumbnail || p.picture?.medium,
      salary: this.roughSalary(p.dob?.age),
      profession: this.fakeProfession(),
    };
  }

  private applyLocalChanges(server: Employee[]): Employee[] {
    let list = [...server];

    // 1) Remove tombstoned IDs
    const removed = this.getRemoved();
    if (removed.length) list = list.filter(e => !removed.includes(e.id));

    // 2) Apply local edits (field-level overrides)
    const edits = this.getEdits();
    if (Object.keys(edits).length) {
      list = list.map(e => {
        const delta = edits[String(e.id)];
        return delta ? { ...e, ...delta } : e;
      });
    }

    // 3) Merge local additions (prefer local if duplicate id)
    const adds = this.getAdds();
    if (adds.length) {
      const byId = new Map<number, Employee>(list.map(x => [x.id, x]));
      for (const a of adds) byId.set(a.id, { ...(byId.get(a.id) || {} as Employee), ...a });
      list = Array.from(byId.values());
      // Put local additions near the top for visibility
      list.sort((a, b) => (adds.some(x => x.id === b.id) ? 1 : 0) - (adds.some(x => x.id === a.id) ? 1 : 0));
    }

    return list;
  }

  // --- localStorage helpers ---
  private getRemoved(): number[] {
    try { return JSON.parse(localStorage.getItem(LS_REMOVED) || '[]'); } catch { return []; }
  }
  private setRemoved(ids: number[]) { localStorage.setItem(LS_REMOVED, JSON.stringify(ids)); }
  private addRemoved(id: number) {
    const s = this.getRemoved(); if (!s.includes(id)) { s.push(id); this.setRemoved(s); }
  }
  private removeRemoved(id: number) { this.setRemoved(this.getRemoved().filter(x => x !== id)); }

  private getAdds(): Employee[] {
    try { return JSON.parse(localStorage.getItem(LS_ADDS) || '[]'); } catch { return []; }
  }
  private setAdds(list: Employee[]) { localStorage.setItem(LS_ADDS, JSON.stringify(list)); }

  private getEdits(): Record<string, Partial<Employee>> {
    try { return JSON.parse(localStorage.getItem(LS_EDITS) || '{}'); } catch { return {}; }
  }
  private setEdits(map: Record<string, Partial<Employee>>) {
    localStorage.setItem(LS_EDITS, JSON.stringify(map));
  }

  // --- misc helpers ---
  private stableIdFromEmail(email: string): number {
    // deterministic 7-digit id from email
    let h = 0;
    for (let i = 0; i < email.length; i++) {
      h = ((h << 5) - h) + email.charCodeAt(i);
      h |= 0;
    }
    const pos = Math.abs(h) % 9000000; // 0..8,999,999
    return 1000000 + pos;             // 1,000,000..9,999,999
  }

  private fakeProfession(): string {
    const list = [
      'Software Engineer', 'QA Analyst', 'HR', 'UI/UX Designer',
      'Project Manager', 'DevOps', 'Support', 'Data Analyst'
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  private roughSalary(age?: number): number {
    const base = (age && age > 22) ? 300000 : 250000;
    const jitter = Math.floor(Math.random() * 800000);
    return base + jitter;
  }
}
