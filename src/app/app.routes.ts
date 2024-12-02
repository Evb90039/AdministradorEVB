import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/component/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/guards/auth.guard';
import { CitasComponent } from './features/citas/citas.component';

export const routes: Routes = [
    { 
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    { 
        path: 'login',
        component: LoginComponent,
        title: 'Login'
    },
    {
        path: 'home',
        component: HomeComponent,
        title: 'Home',
        canActivate: [authGuard]
    },
    {
        path: 'citas',
        component: CitasComponent,
        title: 'Citas',
        canActivate: [authGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];