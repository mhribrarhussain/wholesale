import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly PRODUCTS_KEY = 'wholesale_products';
    private productsSubject = new BehaviorSubject<Product[]>([]);
    public products$ = this.productsSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.loadProducts();
    }

    private loadProducts(): void {
        let products = this.storageService.getItem<Product[]>(this.PRODUCTS_KEY);

        // If no products exist, initialize with sample data
        if (!products || products.length === 0) {
            products = this.getSampleProducts();
            this.storageService.setItem(this.PRODUCTS_KEY, products);
        }

        this.productsSubject.next(products);
    }

    private getSampleProducts(): Product[] {
        return [
            { id: '1', name: 'Rice (25kg)', category: 'Grains', price: 3500, stock: 100, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Premium quality rice' },
            { id: '2', name: 'Wheat Flour (10kg)', category: 'Grains', price: 800, stock: 150, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', description: 'Fresh wheat flour' },
            { id: '3', name: 'Sugar (50kg)', category: 'Groceries', price: 4500, stock: 80, image: 'https://images.unsplash.com/photo-1587108280210-13ec0cfc5ac8?w=400', description: 'White refined sugar' },
            { id: '4', name: 'Cooking Oil (5L)', category: 'Oils', price: 1200, stock: 200, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', description: 'Pure cooking oil' },
            { id: '5', name: 'Milk Powder (1kg)', category: 'Dairy', price: 950, stock: 120, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', description: 'Instant milk powder' },
            { id: '6', name: 'Tea (500g)', category: 'Beverages', price: 450, stock: 180, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', description: 'Premium tea leaves' },
            { id: '7', name: 'Lentils (5kg)', category: 'Grains', price: 650, stock: 90, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400', description: 'Mixed lentils' },
            { id: '8', name: 'Spices Mix (500g)', category: 'Spices', price: 380, stock: 140, image: 'https://images.unsplash.com/photo-1596040033229-a0b03c7d1cd0?w=400', description: 'Assorted spices' },
            { id: '9', name: 'Salt (1kg)', category: 'Groceries', price: 60, stock: 300, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', description: 'Iodized salt' },
            { id: '10', name: 'Ghee (1kg)', category: 'Dairy', price: 1500, stock: 70, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', description: 'Pure cow ghee' },
            { id: '11', name: 'Biscuits (Pack)', category: 'Snacks', price: 280, stock: 250, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', description: 'Assorted biscuits' },
            { id: '12', name: 'Pasta (1kg)', category: 'Grains', price: 320, stock: 160, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', description: 'Italian pasta' }
        ];
    }

    getProducts(): Product[] {
        return this.productsSubject.value;
    }

    getProductById(id: string): Product | undefined {
        return this.productsSubject.value.find(p => p.id === id);
    }

    addProduct(product: Product): void {
        const products = this.getProducts();
        product.id = Date.now().toString();
        products.push(product);
        this.saveProducts(products);
    }

    updateProduct(product: Product): void {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === product.id);
        if (index !== -1) {
            products[index] = product;
            this.saveProducts(products);
        }
    }

    deleteProduct(id: string): void {
        const products = this.getProducts().filter(p => p.id !== id);
        this.saveProducts(products);
    }

    updateStock(productId: string, quantity: number): void {
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            product.stock -= quantity;
            this.saveProducts(products);
        }
    }

    private saveProducts(products: Product[]): void {
        this.storageService.setItem(this.PRODUCTS_KEY, products);
        this.productsSubject.next(products);
    }
}
