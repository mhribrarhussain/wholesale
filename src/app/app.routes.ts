import { Routes } from '@angular/router';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
    { path: '', component: ProductsComponent },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'admin', component: AdminComponent },
    { path: '**', redirectTo: '' }
];
