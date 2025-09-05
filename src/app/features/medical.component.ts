import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {
  MedicalService,
  MedicalDetail,
  policyMaxAmount,
  balanceLeft,
  Month,
} from '../core/medical.service';
import { MedicalFormComponent } from './medical-form.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-medical',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  providers: [CurrencyPipe],
  templateUrl: './medical.component.html',
  styleUrl: './medical.component.scss'
})
export class MedicalComponent implements OnInit {
  details: MedicalDetail[] = [];
  filtered: MedicalDetail[] = [];

  loading = false;
  error: string | null = null;

  months: Month[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  selectedMonth: Month | 'All' = 'All';

  // quick totals for current filter
  totalDependents = 0;
  totalClaimed = 0;
  avgClaim = 0;

  constructor(private svc: MedicalService, private modal: BsModalService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.svc.list().subscribe({
      next: (list) => {
        this.details = list;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load medical details';
        this.loading = false;
      },
    });
  }

  // ---- filter & totals ----
  onMonthChange(e: Event) {
    this.selectedMonth = (e.target as HTMLSelectElement).value as Month | 'All';
    this.applyFilter();
  }
  clearFilter() {
    this.selectedMonth = 'All';
    this.applyFilter();
  }

  private applyFilter() {
    this.filtered =
      this.selectedMonth === 'All'
        ? [...this.details]
        : this.details.filter((d) => d.month === this.selectedMonth);

    this.totalDependents = this.filtered.reduce(
      (s, d) => s + (d.numberOfDependents || 0),
      0
    );
    this.totalClaimed = this.filtered.reduce(
      (s, d) => s + (d.claimedAmount || 0),
      0
    );
    this.avgClaim = this.filtered.length
      ? Math.round(this.totalClaimed / this.filtered.length)
      : 0;
  }

  // policy helpers for template
  policyMax = policyMaxAmount;
  balance = balanceLeft;

  // ---- CRUD ----
  openAdd() {
    const ref: BsModalRef<MedicalFormComponent> = this.modal.show(
      MedicalFormComponent,
      {
        initialState: { title: 'Add Medical' },
        class: 'modal-lg modal-dialog-centered modal-dialog-scrollable',
      }
    );
    ref.content!.onSave.subscribe((dto) => {
      this.svc.add(dto as any).subscribe(() => this.load());
    });
  }

  openEdit(d: MedicalDetail) {
    const ref: BsModalRef<MedicalFormComponent> = this.modal.show(
      MedicalFormComponent,
      {
        initialState: { title: 'Edit Medical', detail: d },
        class: 'modal-lg modal-dialog-centered modal-dialog-scrollable',
      }
    );
    ref.content!.onSave.subscribe((dto) => {
      const updated: MedicalDetail = { ...d, ...dto };
      this.svc.update(updated).subscribe(() => this.load());
    });
  }

  confirmDelete(d: MedicalDetail) {
    if (confirm(`Delete policy "${d.policyName}" for Emp #${d.employeeId}?`)) {
      this.svc.remove(d.id).subscribe(() => this.load());
    }
  }
}
