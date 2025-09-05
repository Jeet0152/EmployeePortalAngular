import { Routes } from '@angular/router';
import { EmployeeListComponent } from './features/employee-list.component';
import { MedicalComponent } from './features/medical.component';
import { ChartsComponent } from './features/charts.component';
import { NotFoundComponent } from './features/not-found.component';
import { LoginComponent } from './features/login.component';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },

    { path: '', redirectTo: 'employees', pathMatch: 'full' },

    // Protected pages
    { path: 'employees', component: EmployeeListComponent, canActivate: [AuthGuard] },
    { path: 'medical', component: MedicalComponent, canActivate: [AuthGuard] },
    { path: 'charts', component: ChartsComponent, canActivate: [AuthGuard] },

    // 404 last
    { path: '**', component: NotFoundComponent }
];
