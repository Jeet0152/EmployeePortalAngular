import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    show = false;
    error = '';
    form!: FormGroup;  // declare, then initialize in constructor

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        
        this.form = this.fb.group({
            id: ['', Validators.required],
            pw: ['', Validators.required]
        });
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const ok = this.auth.login(this.form.value.id!, this.form.value.pw!);
        if (!ok) {
            this.error = 'Invalid credentials';
            return;
        }
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/employees';
        this.router.navigateByUrl(returnUrl);
    }
}
