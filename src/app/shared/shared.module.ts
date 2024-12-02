import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from './components/nav/nav.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ProductsTableComponent } from './components/products-table/products-table.component';

@NgModule({
  declarations: [
    ProductsTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NavComponent,
    LoadingSpinnerComponent
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  exports: [
    NavComponent,
    LoadingSpinnerComponent,
    ProductsTableComponent
  ]
})
export class SharedModule { }