export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'whatsapp_sent' | 'confirmed' | 'delivered';
  orderDate: Date;
}

export enum OrderStatus {
  PENDING = 'pending',
  WHATSAPP_SENT = 'whatsapp_sent',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered'
}
