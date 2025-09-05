import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { MedicalDetail, Month } from '../core/medical.service';
import { EmployeeService, Employee } from '../core/employee.service';

@Component({
  selector: 'app-medical-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medical-form.component.html',
  styleUrl: './medical-form.component.scss'
})
export class MedicalFormComponent implements OnInit {
  title?: string;
  detail?: MedicalDetail;

  months: Month[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  onSave = new Subject<Omit<MedicalDetail, 'id'>>();
  form!: FormGroup;

  // employees list stays live with adds/edits/deletes
  employees: Employee[] = [];
  removedOptionId: number | null = null; // shows a disabled option if editing a record whose employee was deleted

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private empSvc: EmployeeService
  ) {
    const current = this.months[new Date().getMonth()];
    this.form = this.fb.group({
      employeeId: [null as number | null, [Validators.required]],
      policyName: ['', Validators.required],
      month: [current as Month, Validators.required],
      salary: [0, [Validators.required, Validators.min(0)]],
      claimedAmount: [0, [Validators.required, Validators.min(0)]],
      numberOfDependents: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    // Pre-fill when editing
    if (this.detail) this.form.patchValue(this.detail);

    // Live subscribe to Employees (reflects local add/edit/delete immediately)
    this.empSvc.employees$.subscribe(list => {
      this.employees = list;
      this.ensureEmployeeOption();
    });

    // In case user opens Medical first, ensure employees are loaded
    if (!this.employees.length) this.empSvc.load();
  }

  private ensureEmployeeOption() {
    const id = this.form.get('employeeId')!.value as number | null;
    if (id == null) { this.removedOptionId = null; return; }
    const exists = this.employees.some(e => e.id === id);
    this.removedOptionId = exists ? null : id; // show "removed" placeholder if needed
  }

  invalid(ctrl: string) {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    // Coerce to plain object with number employeeId
    const val = this.form.getRawValue();
    this.onSave.next(val as Omit<MedicalDetail, 'id'>);
    this.bsModalRef.hide();
  }

  close() { this.bsModalRef.hide(); }
}
