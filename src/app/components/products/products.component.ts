import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CustomerService } from '../../services/customer.service';
import { Product, Customer } from '../../models/models';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];

    searchTerm: string = '';
    selectedCategory: string = 'all';

    cartCount: number = 0;
    activeCustomer: Customer | null = null;

    protected Math = Math;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private customerService: CustomerService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Subscribe to active customer
        this.customerService.activeCustomer$.subscribe(customer => {
            this.activeCustomer = customer;
            // Admin-only check: If no customer is selected, they should probably select one first
            // But let's keep it flexible for now, maybe they just want to browse
        });

        this.productService.products$.subscribe(products => {
            this.products = products;
            this.filteredProducts = products;
            this.extractCategories();
        });

        this.cartService.cart$.subscribe(() => {
            this.cartCount = this.cartService.getCartCount();
        });
    }

    extractCategories(): void {
        const categorySet = new Set(this.products.map(p => p.category));
        this.categories = Array.from(categorySet);
    }

    searchProducts(): void {
        this.filterProducts();
    }

    filterProducts(): void {
        let filtered = this.products;

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === this.selectedCategory);
        }

        // Filter by search term
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.category.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term)
            );
        }

        this.filteredProducts = filtered;
    }

    addToCart(product: Product, quantity: number): void {
        if (quantity > product.stock) {
            alert('Not enough stock available!');
            return;
        }

        this.cartService.addToCart(product, quantity);
        this.showSuccess('Added to cart!');
    }

    adjustQuantity(input: HTMLInputElement, change: number, max: number): void {
        let val = parseInt(input.value) || 1;
        val += change;

        if (val < 1) val = 1;
        if (val > max) val = max;

        input.value = val.toString();
    }

    viewCart(): void {
        this.router.navigate(['/cart']);
    }

    goToAdmin(): void {
        this.router.navigate(['/login']);
    }

    private showSuccess(message: string): void {
        // You can implement a toast notification here
        alert(message);
    }
}
