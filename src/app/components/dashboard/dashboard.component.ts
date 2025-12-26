import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Order, Product } from '../../models/models';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    totalRevenue: number = 0;
    totalProfit: number = 0;
    totalOrders: number = 0;
    recentOrders: Order[] = [];
    topProducts: { name: string, quantity: number, revenue: number }[] = [];

    constructor(
        private orderService: OrderService,
        private productService: ProductService
    ) { }

    ngOnInit(): void {
        this.orderService.orders$.subscribe(orders => {
            this.calculateMetrics(orders);
        });
    }

    calculateMetrics(orders: Order[]): void {
        const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'delivered');

        this.totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        this.totalOrders = confirmedOrders.length;
        this.recentOrders = orders.slice(0, 5); // Last 5 orders

        // Calculate Profit and Top Products
        this.calculateProfitAndTopProducts(confirmedOrders);
    }

    calculateProfitAndTopProducts(orders: Order[]): void {
        let costOfGoods = 0;
        const productSales = new Map<string, { qty: number, rev: number }>();

        orders.forEach(order => {
            order.items.forEach(item => {
                const product = item.product;

                // Profit Calc
                const cost = product.costPrice || 0; // Default to 0 if not set
                costOfGoods += (cost * item.quantity);

                // Top Products Calc
                if (!productSales.has(product.id)) {
                    productSales.set(product.id, { qty: 0, rev: 0 });
                }
                const current = productSales.get(product.id)!;
                current.qty += item.quantity;
                current.rev += (product.price * item.quantity);
            });
        });

        this.totalProfit = this.totalRevenue - costOfGoods;

        // Sort top products
        this.topProducts = Array.from(productSales.entries())
            .map(([id, data]) => {
                // Find name from product list (we need to subscribe to products or just use what's in the order item if reliable)
                // For simplicity, we trust the item snapshots in orders. In a real DB, we'd join.
                // We'll try to find the name from the first orderItem that has this product ID.
                const name = orders.flatMap(o => o.items).find(i => i.product.id === id)?.product.name || 'Unknown Product';
                return { name, quantity: data.qty, revenue: data.rev };
            })
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }
}
