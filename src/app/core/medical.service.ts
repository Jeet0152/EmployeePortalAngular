import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Month =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export interface MedicalDetail {
  id: number;
  employeeId: number;
  policyName: string;
  salary: number;
  claimedAmount: number;
  numberOfDependents: number;
  month?: Month; // <-- new
}

// Rules:
// - Policy Max: ₹10,00,000 for salary ≤ ₹5,00,000; else 2.5 × salary
// - Balance Left = Policy Max − Claimed
export function policyMaxAmount(salary: number): number {
  return salary <= 500000 ? 1000000 : Math.round(2.5 * salary);
}
export function balanceLeft(max: number, claimed: number): number {
  return Math.max(0, max - claimed);
}

@Injectable({ providedIn: 'root' })
export class MedicalService {
  private readonly API = `${environment.apiUrl}/medicalDetails`; 

  constructor(private http: HttpClient) {}

  list(): Observable<MedicalDetail[]> {
    return this.http.get<MedicalDetail[]>(this.API);
  }
  add(m: Omit<MedicalDetail, 'id'>): Observable<MedicalDetail> {
    return this.http.post<MedicalDetail>(this.API, m);
  }
  update(m: MedicalDetail): Observable<MedicalDetail> {
    return this.http.put<MedicalDetail>(`${this.API}/${m.id}`, m);
  }
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
