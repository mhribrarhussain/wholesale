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
        costPrice: 0,
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

    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
        try {
            await this.orderService.updateOrderStatus(orderId, status);
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    async openWhatsApp(order: Order): Promise<void> {
        const url = this.orderService.getWhatsAppUrl(order);
        // Update status to whatsapp_sent
        await this.orderService.updateOrderStatus(order.id, OrderStatus.WHATSAPP_SENT);
        // Open WhatsApp
        window.open(url, '_blank');
    }

    async deleteOrder(orderId: string): Promise<void> {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                await this.orderService.deleteOrder(orderId);
            } catch (error) {
                console.error('Error deleting order:', error);
            }
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

    async saveProduct(): Promise<void> {
        try {
            console.log('Attempting to save product...', this.productForm);
            if (this.editingProduct) {
                await this.productService.updateProduct(this.productForm);
            } else {
                await this.productService.addProduct(this.productForm);
            }
            console.log('Product saved successfully');
            this.closeProductModal();
        } catch (error) {
            console.error('FULL ERROR DETAILS:', error);
            alert(`Error saving product: ${JSON.stringify(error)}`);
        }
    }

    async deleteProduct(id: string): Promise<void> {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await this.productService.deleteProduct(id);
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Error deleting product.');
            }
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

            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            this.selectedFileName = file.name;

            // Compress Image
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event: any) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Max dimensions
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                    // Check size check (approximate base64 size)
                    if (dataUrl.length > 1000000) { // ~750KB limit to be safe for 1MB doc
                        alert('Image is too complex/large even after compression. Please choose a simpler image.');
                        return;
                    }

                    this.productForm.image = dataUrl;
                };
            };
        }
    }

    removeImage(): void {
        this.productForm.image = '';
        this.selectedFileName = '';
    }
}
