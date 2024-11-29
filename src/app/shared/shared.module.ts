import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from './components/nav/nav.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
@NgModule({
  imports: [
    CommonModule,
    NavComponent,  // Importamos el componente standalone en lugar de declararlo
    LoadingSpinnerComponent
  ],
  exports: [
    NavComponent,  // Lo exportamos para que esté disponible en otros módulos
    LoadingSpinnerComponent
  ]
})
export class SharedModule { }