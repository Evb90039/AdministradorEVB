import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { NavComponent } from '../../shared/components/nav/nav.component';
import { FinanzasComponent } from "../../shared/components/finanzas/finanzas.component";
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavComponent, FinanzasComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  logout() {
    this.auth.logout(); // Necesitaremos añadir este método
    this.router.navigate(['/login']);
  }
}