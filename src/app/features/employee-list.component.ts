import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { Router, ActivatedRoute } from '@angular/router';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { EmployeeService, Employee } from '../core/employee.service';
import { EmployeeFormComponent } from './employee-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationService } from '../core/notification.service';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

type EmpKey = keyof Employee;

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationModule, TranslateModule],
  templateUrl: './employee-list.component.html',
  styleUrl: 'employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  // sorting
  sortKey: EmpKey = 'id';
  sortDir: 1 | -1 = 1;

  // paging
  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50];
  startIndex = 0;

  // data
  employees: Employee[] = [];
  paged: Employee[] = [];

  private destroy$ = new Subject<void>();
  constructor(
    public svc: EmployeeService,
    private modal: BsModalService,
    private notif: NotificationService,
    private router: Router,           
    private route: ActivatedRoute  
  ) { }

  get totalItems() { return this.employees.length; }
  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }
  get endIndex() { return Math.min(this.startIndex + this.paged.length, this.totalItems); }

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    const sort = (qp.get('sort') as keyof Employee) || this.sortKey;
    const dir = qp.get('dir') === 'desc' ? -1 : 1;
    const page = +(qp.get('page') || this.page);
    const size = +(qp.get('pageSize') || this.pageSize);  


    this.sortKey = sort;
    this.sortDir = dir;
    this.page = Number.isFinite(page) && page > 0 ? page : 1;
    this.pageSize = [10, 25, 50].includes(size) ? size : 10;

    this.svc.employees$
    .pipe(takeUntil(this.destroy$))
    .subscribe(list => {
      this.employees = this.sort(list);
      this.clampPage();
      this.paginate();  
    });
    this.svc.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete()
  }

  private updateUrl() {

    if (!this.router.url.startsWith('/employees')) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: this.sortKey,
        dir: this.sortDir === 1 ? 'asc' : 'desc',
        page: this.page,
        pageSize: this.pageSize
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  refresh() { this.svc.load(); }

  // ---- sort ----
  sortBy(k: EmpKey) {
    if (this.sortKey === k) {
      this.sortDir = (this.sortDir === 1 ? -1 : 1);
    } else {
      this.sortKey = k;
      this.sortDir = 1;
    }
    this.employees = this.sort(this.employees);
    this.paginate();
  }

  ariaSort(k: EmpKey) {
    if (this.sortKey !== k) return 'none';
    return this.sortDir === 1 ? 'ascending' : 'descending';
  }

  iconFor(k: EmpKey) {
    if (this.sortKey !== k) return 'bi-arrow-down-up text-muted';
    return this.sortDir === 1 ? 'bi-caret-up-fill' : 'bi-caret-down-fill';
  }

  private sort(arr: Employee[]) {
    const k = this.sortKey, d = this.sortDir;
    return [...arr].sort((a: any, b: any) => this.cmp(a?.[k], b?.[k]) * d);
  }

  private cmp(a: any, b: any) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    // If either is a string, compare as case-insensitive strings
    if (typeof a === 'string' || typeof b === 'string') {
      return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
    }
    // Otherwise numeric compare
    return (a as number) - (b as number);
  }

  // ---- paging helpers ----
  onPageSizeChange() {
    this.page = 1;
    this.paginate();
  }

  private clampPage() {
    const max = this.totalPages;
    if (this.page > max) this.page = max;
    if (this.page < 1) this.page = 1;
  }

  paginate() {
    this.clampPage();
    this.startIndex = (this.page - 1) * this.pageSize;
    this.paged = this.employees.slice(this.startIndex, this.startIndex + this.pageSize);
    this.updateUrl();
  }

  // ---- CRUD ----
  openAdd() {
    const ref: BsModalRef<EmployeeFormComponent> = this.modal.show(EmployeeFormComponent, {
      initialState: { title: 'Add Employee' },
      class: 'modal-lg modal-dialog-centered modal-dialog-scrollable',
    });

    ref.content?.onSave.pipe(take(1)).subscribe(dto => {
      const nextId = (this.employees.length ? Math.max(...this.employees.map(x => x.id)) : 1000) + 1;
      const newEmp: Employee = { id: nextId, ...dto };
      this.svc.upsertLocal(newEmp);
      this.page = this.totalPages;
      this.paginate();
      this.notif?.send('HR: New employee', `${newEmp.firstName} ${newEmp.lastName} (#${newEmp.id}) added`);
    });
  }

  openEdit(e: Employee) {
    const ref: BsModalRef<EmployeeFormComponent> = this.modal.show(EmployeeFormComponent, {
      initialState: { title: 'Edit Employee', employee: e },
      class: 'modal-lg modal-dialog-centered modal-dialog-scrollable',
    });

    ref.content?.onSave.pipe(take(1)).subscribe(dto => {
      const updated: Employee = { ...e, ...dto };
      this.svc.upsertLocal(updated);
      this.paginate();
      this.notif?.send('HR: Employee updated', `${updated.firstName} ${updated.lastName} (#${updated.id})`);
    });
  }

  confirmDelete(e: Employee) {
    if (confirm(`Delete ${e.firstName} ${e.lastName}?`)) {
      this.svc.removeLocal(e.id);
      if (this.startIndex >= this.totalItems) this.page = Math.max(1, this.page - 1);
      this.paginate();
      this.notif?.send('HR: Employee removed', `${e.firstName} ${e.lastName} (#${e.id})`);
    }
  }
}
