import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Order, CartItem, OrderStatus } from '../models/models';
import { StorageService } from './storage.service';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly ORDERS_KEY = 'wholesale_orders';
    private ordersSubject = new BehaviorSubject<Order[]>([]);
    public orders$ = this.ordersSubject.asObservable();

    constructor(
        private storageService: StorageService,
        private productService: ProductService,
        private customerService: CustomerService
    ) {
        this.loadOrders();
    }

    private loadOrders(): void {
        const orders = this.storageService.getItem<Order[]>(this.ORDERS_KEY) || [];
        // Convert date strings back to Date objects
        orders.forEach(order => {
            order.orderDate = new Date(order.orderDate);
        });
        this.ordersSubject.next(orders);
    }

    getOrders(): Order[] {
        return this.ordersSubject.value;
    }

    getOrderById(id: string): Order | undefined {
        return this.ordersSubject.value.find(o => o.id === id);
    }

    createOrder(
        customerName: string,
        customerPhone: string,
        customerAddress: string,
        items: CartItem[],
        totalAmount: number
    ): Order {
        const order: Order = {
            id: 'ORD-' + Date.now(),
            customerName,
            customerPhone,
            customerAddress,
            items,
            totalAmount,
            status: OrderStatus.PENDING,
            orderDate: new Date()
        };

        const orders = this.getOrders();
        orders.unshift(order); // Add to beginning  
        this.saveOrders(orders);

        // Update Customer Record
        this.customerService.updateCustomerFromOrder(order);

        return order;
    }

    updateOrderStatus(orderId: string, status: OrderStatus): void {
        const orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);

        if (order) {
            // If confirming order, reduce stock
            if (status === OrderStatus.CONFIRMED && order.status !== OrderStatus.CONFIRMED) {
                order.items.forEach(item => {
                    this.productService.updateStock(item.product.id, item.quantity);
                });
            }

            order.status = status;
            this.saveOrders(orders);
        }
    }

    deleteOrder(orderId: string): void {
        const orders = this.getOrders().filter(o => o.id !== orderId);
        this.saveOrders(orders);
    }

    // Generate WhatsApp message for order confirmation
    generateWhatsAppMessage(order: Order): string {
        let message = `Hello ${order.customerName}!\n\n`;
        message += `Your order #${order.id} has been received:\n\n`;

        message += `📦 *Order Details:*\n`;
        order.items.forEach((item, index) => {
            message += `${index + 1}. ${item.product.name} - ${item.quantity} x Rs.${item.product.price} = Rs.${item.quantity * item.product.price}\n`;
        });

        message += `\n💰 *Total Amount: Rs.${order.totalAmount}*\n\n`;
        message += `📍 *Delivery Address:*\n${order.customerAddress}\n\n`;
        message += `Please reply with *YES* to confirm this order.\n\nThank you!`;

        return encodeURIComponent(message);
    }

    // Generate WhatsApp Click-to-Chat URL
    getWhatsAppUrl(order: Order): string {
        const phone = order.customerPhone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        const message = this.generateWhatsAppMessage(order);

        // Use Pakistan country code if number doesn't start with country code
        let formattedPhone = phone;
        if (!phone.startsWith('92') && phone.startsWith('0')) {
            formattedPhone = '92' + phone.substring(1);
        } else if (!phone.startsWith('92')) {
            formattedPhone = '92' + phone;
        }

        return `https://wa.me/${formattedPhone}?text=${message}`;
    }

    private saveOrders(orders: Order[]): void {
        this.storageService.setItem(this.ORDERS_KEY, orders);
        this.ordersSubject.next(orders);
    }
}
