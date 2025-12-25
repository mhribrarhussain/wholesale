import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, Product } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly CART_KEY = 'wholesale_cart';
    private cartSubject = new BehaviorSubject<CartItem[]>([]);
    public cart$ = this.cartSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.loadCart();
    }

    private loadCart(): void {
        const cart = this.storageService.getItem<CartItem[]>(this.CART_KEY) || [];
        this.cartSubject.next(cart);
    }

    getCart(): CartItem[] {
        return this.cartSubject.value;
    }

    getCartCount(): number {
        return this.getCart().reduce((total, item) => total + item.quantity, 0);
    }

    getTotalAmount(): number {
        return this.getCart().reduce((total, item) => total + (item.product.price * item.quantity), 0);
    }

    addToCart(product: Product, quantity: number = 1): void {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ product, quantity });
        }

        this.saveCart(cart);
    }

    updateQuantity(productId: string, quantity: number): void {
        const cart = this.getCart();
        const item = cart.find(i => i.product.id === productId);

        if (item) {
            if (quantity > 0 && quantity <= item.product.stock) {
                item.quantity = quantity;
            }
            this.saveCart(cart);
        }
    }

    removeFromCart(productId: string): void {
        const cart = this.getCart().filter(item => item.product.id !== productId);
        this.saveCart(cart);
    }

    clearCart(): void {
        this.saveCart([]);
    }

    private saveCart(cart: CartItem[]): void {
        this.storageService.setItem(this.CART_KEY, cart);
        this.cartSubject.next(cart);
    }
}
