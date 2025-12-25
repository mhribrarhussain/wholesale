import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Product } from '../models/models';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private firestore: Firestore = inject(Firestore);
    private productsCollection = collection(this.firestore, 'products');

    // Maintain local BehaviorSubject for backward compatibility
    private productsSubject = new BehaviorSubject<Product[]>([]);
    public products$ = this.productsSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.loadProducts();
    }

    private loadProducts(): void {
        const q = query(this.productsCollection, orderBy('name'));

        (collectionData(q, { idField: 'id' }) as Observable<Product[]>).subscribe(products => {
            this.productsSubject.next(products);

            // Sync to local storage for backup/initial load reference
            this.storageService.setItem('backup_products', products);
        });
    }

    getProducts(): Product[] {
        return this.productsSubject.value;
    }

    getProductById(id: string): Product | undefined {
        return this.productsSubject.value.find(p => p.id === id);
    }

    addProduct(product: Product): Promise<any> {
        // Remove ID for Firestore specific add (it generates its own)
        const { id, ...data } = product;
        return addDoc(this.productsCollection, data);
    }

    updateProduct(product: Product): Promise<void> {
        const productDoc = doc(this.firestore, `products/${product.id}`);
        const { id, ...data } = product;
        return updateDoc(productDoc, data as any);
    }

    updateStock(productId: string, quantity: number): Promise<void> {
        const product = this.getProductById(productId);
        if (product) {
            const productDoc = doc(this.firestore, `products/${productId}`);
            return updateDoc(productDoc, { stock: product.stock - quantity });
        }
        return Promise.resolve();
    }

    deleteProduct(productId: string): Promise<void> {
        const productDoc = doc(this.firestore, `products/${productId}`);
        return deleteDoc(productDoc);
    }
}
