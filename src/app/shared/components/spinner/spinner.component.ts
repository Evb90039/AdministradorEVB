import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  `,
  styles: [`
    .spinner-container {
      position: absolute;
      top: 50%;
      left: 50%;
      border-radius: 50%;
      height: 96px;
      width: 96px;
      animation: rotate_3922 1.2s linear infinite;
      background-color: #9b59b6;
      background-image: linear-gradient(#9b59b6, #84cdfa, #5ad1cd);
      z-index: 1000;
    }

    .spinner-container span {
      position: absolute;
      border-radius: 50%;
      height: 100%;
      width: 100%;
      background-color: #9b59b6;
      background-image: linear-gradient(#9b59b6, #84cdfa, #5ad1cd);
    }

    .spinner-container span:nth-of-type(1) {
      filter: blur(5px);
    }

    .spinner-container span:nth-of-type(2) {
      filter: blur(10px);
    }

    .spinner-container span:nth-of-type(3) {
      filter: blur(25px);
    }

    .spinner-container span:nth-of-type(4) {
      filter: blur(50px);
    }

    .spinner-container::after {
      content: "";
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      background-color: #fff;
      border: solid 5px #ffffff;
      border-radius: 50%;
    }

    @keyframes rotate_3922 {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }

      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      z-index: 999;
    }
  `]
})
export class SpinnerComponent {} 