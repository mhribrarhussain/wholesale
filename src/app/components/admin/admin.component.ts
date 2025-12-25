import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { InvoiceService } from '../../services/invoice.service';
import { Product, Order, OrderStatus } from '../../models/models';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
    activeTab: 'orders' | 'products' = 'orders';
    protected OrderStatus = OrderStatus;

    // Orders
    orders: Order[] = [];
    filteredOrders: Order[] = [];
    selectedOrderFilter: string = 'all';

    // Products
    products: Product[] = [];
    showProductModal: boolean = false;
    editingProduct: Product | null = null;

    productForm: Product = {
        id: '',
        name: '',
        category: '',
        price: 0,
        stock: 0,
        image: '',
        description: ''
    };

    selectedFileName: string = '';

    constructor(
        private productService: ProductService,
        private orderService: OrderService,
        private authService: AuthService,
        private invoiceService: InvoiceService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.orderService.orders$.subscribe(orders => {
            this.orders = orders;
            this.filterOrders();
        });

        this.productService.products$.subscribe(products => {
            this.products = products;
        });
    }

    // Tab Management
    switchTab(tab: 'orders' | 'products'): void {
        this.activeTab = tab;
    }

    // Order Management
    filterOrders(): void {
        if (this.selectedOrderFilter === 'all') {
            this.filteredOrders = this.orders;
        } else {
            this.filteredOrders = this.orders.filter(
                o => o.status === this.selectedOrderFilter
            );
        }
    }

    updateOrderStatus(orderId: string, status: OrderStatus): void {
        this.orderService.updateOrderStatus(orderId, status);
    }

    openWhatsApp(order: Order): void {
        const url = this.orderService.getWhatsAppUrl(order);
        // Update status to whatsapp_sent
        this.orderService.updateOrderStatus(order.id, OrderStatus.WHATSAPP_SENT);
        // Open WhatsApp
        window.open(url, '_blank');
    }

    deleteOrder(orderId: string): void {
        if (confirm('Are you sure you want to delete this order?')) {
            this.orderService.deleteOrder(orderId);
        }
    }

    getStatusClass(status: string): string {
        return `status-${status}`;
    }

    getStatusLabel(status: string): string {
        return status.replace('_', ' ').toUpperCase();
    }

    // Product Management
    openProductModal(product?: Product): void {
        if (product) {
            this.editingProduct = product;
            this.productForm = { ...product };
        } else {
            this.editingProduct = null;
            this.productForm = {
                id: '',
                name: '',
                category: '',
                price: 0,
                stock: 0,
                image: '',
                description: ''
            };
        }
        this.showProductModal = true;
    }

    closeProductModal(): void {
        this.showProductModal = false;
        this.editingProduct = null;
        this.selectedFileName = '';
    }

    saveProduct(): void {
        if (this.editingProduct) {
            this.productService.updateProduct(this.productForm);
        } else {
            this.productService.addProduct(this.productForm);
        }
        this.closeProductModal();
    }

    deleteProduct(id: string): void {
        if (confirm('Are you sure you want to delete this product?')) {
            this.productService.deleteProduct(id);
        }
    }

    exitAdmin(): void {
        this.router.navigate(['/']);
    }

    downloadInvoice(order: Order): void {
        this.invoiceService.generateInvoice(order);
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }

            this.selectedFileName = file.name;

            // Convert to base64
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target && e.target.result) {
                    this.productForm.image = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.productForm.image = '';
        this.selectedFileName = '';
    }
}
