import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Customer, Order } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private readonly CUSTOMERS_KEY = 'wholesale_customers';
    private customersSubject = new BehaviorSubject<Customer[]>([]);
    public customers$ = this.customersSubject.asObservable();

    constructor(private storageService: StorageService) {
        this.loadCustomers();
    }

    private loadCustomers(): void {
        const customers = this.storageService.getItem<Customer[]>(this.CUSTOMERS_KEY) || [];
        // Convert date strings back to Date objects
        customers.forEach(customer => {
            if (customer.lastOrderDate) {
                customer.lastOrderDate = new Date(customer.lastOrderDate);
            }
        });
        this.customersSubject.next(customers);
    }

    getCustomers(): Customer[] {
        return this.customersSubject.value;
    }

    // Called when a new order is created to update customer data
    updateCustomerFromOrder(order: Order): void {
        const customers = this.getCustomers();

        // Try to find existing customer by phone number (primary identifier)
        let customer = customers.find(c => c.phone === order.customerPhone);

        if (customer) {
            // Update existing customer
            customer.name = order.customerName; // Update name in case of correction
            customer.address = order.customerAddress; // Update address to latest
            customer.totalOrders += 1;
            customer.totalSpent += order.totalAmount;
            customer.lastOrderDate = new Date();
            if (!customer.orders) customer.orders = [];
            customer.orders.push(order.id);
        } else {
            // Create new customer
            customer = {
                id: 'CUST-' + Date.now(),
                name: order.customerName,
                phone: order.customerPhone,
                address: order.customerAddress,
                totalOrders: 1,
                totalSpent: order.totalAmount,
                lastOrderDate: new Date(),
                orders: [order.id]
            };
            customers.push(customer);
        }

        this.saveCustomers(customers);
    }

    private saveCustomers(customers: Customer[]): void {
        this.storageService.setItem(this.CUSTOMERS_KEY, customers);
        this.customersSubject.next(customers);
    }
}
