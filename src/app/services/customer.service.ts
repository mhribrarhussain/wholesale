import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer, Order } from '../models/models';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, query, where } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private firestore: Firestore = inject(Firestore);
    private customersCollection = collection(this.firestore, 'customers');

    private customersSubject = new BehaviorSubject<Customer[]>([]);
    public customers$ = this.customersSubject.asObservable();

    constructor() {
        this.loadCustomers();
    }

    private loadCustomers(): void {
        (collectionData(this.customersCollection, { idField: 'id' }) as Observable<Customer[]>).subscribe(customers => {
            // Convert timestamps if necessary
            const processedCustomers = customers.map(c => ({
                ...c,
                lastOrderDate: c.lastOrderDate ? (c.lastOrderDate as any).toDate ? (c.lastOrderDate as any).toDate() : new Date(c.lastOrderDate) : new Date()
            }));
            this.customersSubject.next(processedCustomers);
        });
    }

    getCustomers(): Customer[] {
        return this.customersSubject.value;
    }

    // Called when a new order is created to update customer data
    async updateCustomerFromOrder(order: Order): Promise<void> {
        const customers = this.getCustomers();
        let customer = customers.find(c => c.phone === order.customerPhone);

        if (customer) {
            // Update existing customer
            const customerDoc = doc(this.firestore, `customers/${customer.id}`);
            await updateDoc(customerDoc, {
                name: order.customerName,
                address: order.customerAddress,
                totalOrders: (customer.totalOrders || 0) + 1,
                totalSpent: (customer.totalSpent || 0) + order.totalAmount,
                lastOrderDate: new Date(),
                orders: [...(customer.orders || []), order.id]
            });
        } else {
            // Create new customer
            const newId = 'CUST-' + Date.now();
            const newCustomer: any = {
                name: order.customerName,
                phone: order.customerPhone,
                address: order.customerAddress,
                totalOrders: 1,
                totalSpent: order.totalAmount,
                lastOrderDate: new Date(),
                orders: [order.id]
            };

            // Use setDoc to define custom ID or let Firestore generate one
            await setDoc(doc(this.firestore, 'customers', newId), newCustomer);
        }
    }
}
