// loading-spinner.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-overlay" *ngIf="isLoading">
      <div class="spinner-container">
        <div class="spinner-border" 
             [ngClass]="spinnerSize" 
             [ngStyle]="{'color': color}" 
             role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <div *ngIf="message" class="spinner-message mt-2">
          {{ message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .spinner-message {
      color: #666;
      font-size: 0.9rem;
      text-align: center;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() isLoading: boolean = false;
  @Input() message: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() color: string = '#007bff';

  get spinnerSize(): string {
    switch (this.size) {
      case 'sm': return 'spinner-border-sm';
      case 'lg': return 'spinner-border spinner-border-lg';
      default: return 'spinner-border';
    }
  }
}