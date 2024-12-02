import { Component } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'mi-app';
}