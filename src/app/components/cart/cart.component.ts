import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/models';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
    cartItems: CartItem[] = [];
    totalAmount: number = 0;

    constructor(
        private cartService: CartService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.cartService.cart$.subscribe(cart => {
            this.cartItems = cart;
            this.totalAmount = this.cartService.getTotalAmount();
        });
    }

    updateQuantity(productId: string, quantity: number): void {
        this.cartService.updateQuantity(productId, quantity);
    }

    removeItem(productId: string): void {
        if (confirm('Remove this item from cart?')) {
            this.cartService.removeFromCart(productId);
        }
    }

    goBack(): void {
        this.router.navigate(['/']);
    }

    proceedToCheckout(): void {
        if (this.cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        this.router.navigate(['/checkout']);
    }
}
