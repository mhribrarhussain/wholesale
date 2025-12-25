import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../models/models';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
    cartItems: CartItem[] = [];
    totalAmount: number = 0;

    customerName: string = '';
    customerPhone: string = '';
    customerAddress: string = '';

    constructor(
        private cartService: CartService,
        private orderService: OrderService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cartItems = this.cartService.getCart();
        this.totalAmount = this.cartService.getTotalAmount();

        if (this.cartItems.length === 0) {
            this.router.navigate(['/']);
        }
    }

    placeOrder(): void {
        if (!this.customerName || !this.customerPhone || !this.customerAddress) {
            alert('Please fill in all fields');
            return;
        }

        const order = this.orderService.createOrder(
            this.customerName,
            this.customerPhone,
            this.customerAddress,
            this.cartItems,
            this.totalAmount
        );

        this.cartService.clearCart();

        alert(`Order placed successfully!\nOrder ID: ${order.id}\n\nWe will contact you soon on WhatsApp to confirm your order.`);

        this.router.navigate(['/']);
    }

    goBack(): void {
        this.router.navigate(['/cart']);
    }
}
