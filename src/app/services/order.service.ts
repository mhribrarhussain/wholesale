import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Order, CartItem, OrderStatus } from '../models/models';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private firestore: Firestore = inject(Firestore);
    private ordersCollection = collection(this.firestore, 'orders');

    private ordersSubject = new BehaviorSubject<Order[]>([]);
    public orders$ = this.ordersSubject.asObservable();

    constructor(
        private productService: ProductService,
        private customerService: CustomerService
    ) {
        this.loadOrders();
    }

    private loadOrders(): void {
        // Load orders ordered by date descending
        const q = query(this.ordersCollection, orderBy('orderDate', 'desc'));

        (collectionData(q, { idField: 'id' }) as Observable<Order[]>).subscribe(orders => {
            const processedOrders = orders.map(order => ({
                ...order,
                orderDate: (order.orderDate as any).toDate ? (order.orderDate as any).toDate() : new Date(order.orderDate)
            }));
            this.ordersSubject.next(processedOrders);
        });
    }

    getOrders(): Order[] {
        return this.ordersSubject.value;
    }

    getOrderById(id: string): Order | undefined {
        return this.ordersSubject.value.find(o => o.id === id);
    }

    async createOrder(
        customerName: string,
        customerPhone: string,
        customerAddress: string,
        items: CartItem[],
        totalAmount: number
    ): Promise<Order> {
        const orderId = 'ORD-' + Date.now();
        const order: Order = {
            id: orderId,
            customerName,
            customerPhone,
            customerAddress,
            items,
            totalAmount,
            status: OrderStatus.PENDING,
            orderDate: new Date()
        };

        // Save to Firestore
        await setDoc(doc(this.firestore, 'orders', orderId), order);

        // Update Customer Record
        await this.customerService.updateCustomerFromOrder(order);

        return order;
    }

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
        const order = this.getOrderById(orderId);

        if (order) {
            // If confirming order, reduce stock
            if (status === OrderStatus.CONFIRMED && order.status !== OrderStatus.CONFIRMED) {
                for (const item of order.items) {
                    await this.productService.updateStock(item.product.id, item.quantity);
                }
            }

            const orderDoc = doc(this.firestore, `orders/${orderId}`);
            await updateDoc(orderDoc, { status });
        }
    }

    deleteOrder(orderId: string): Promise<void> {
        const orderDoc = doc(this.firestore, `orders/${orderId}`);
        return deleteDoc(orderDoc);
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
}
