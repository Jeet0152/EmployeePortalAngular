import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { Employee } from '../core/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  title?: string;
  employee?: Employee;

  onSave: Subject<Omit<Employee, 'id'>> = new Subject<Omit<Employee, 'id'>>();
  form!: FormGroup;
  defaultAvatar = 'https://placehold.co/56x56?text=👤';

  constructor(public bsModalRef: BsModalRef, private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      contactNumber: [''],
      age: [undefined as number | undefined],
      profession: [''],
      salary: [undefined as number | undefined, [Validators.min(0)]],
      imageUrl: ['']
    });
  }

  ngOnInit() {
    if (this.employee) {
      this.form.patchValue({
        firstName: this.employee.firstName,
        lastName: this.employee.lastName,
        email: this.employee.email,
        contactNumber: this.employee.contactNumber || '',
        age: this.employee.age,
        profession: this.employee.profession || '',
        salary: this.employee.salary,
        imageUrl: this.employee.imageUrl || ''
      });
    }
  }

  invalid(ctrl: string) {
    const c = this.form.get(ctrl);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.onSave.next(this.form.getRawValue() as Omit<Employee, 'id'>);
    this.bsModalRef.hide();
  }

  close() { this.bsModalRef.hide(); }
}
