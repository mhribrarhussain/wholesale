import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {

    generateInvoice(order: Order): void {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(20, 184, 166); // Teal color
        doc.text('WHOLESALE INVENTORY', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('123 Warehouse St, Business District', 14, 26);
        doc.text('City, Country 12345', 14, 30);
        doc.text('Phone: +92 300 1234567', 14, 34);

        // Invoice Label & Details
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.text(`Invoice #: ${order.id}`, pageWidth - 14, 26, { align: 'right' });
        doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, pageWidth - 14, 30, { align: 'right' });
        doc.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 14, 34, { align: 'right' });

        // Customer Details
        doc.line(14, 40, pageWidth - 14, 40);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('Bill To:', 14, 50);
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(order.customerName, 14, 56);
        doc.text(order.customerPhone, 14, 60);

        // Split address into multiple lines if needed
        const splitAddress = doc.splitTextToSize(order.customerAddress, 80);
        doc.text(splitAddress, 14, 64);

        // Table
        const tableBody = order.items.map((item, index) => [
            index + 1,
            item.product.name,
            item.quantity,
            `Rs. ${item.product.price.toLocaleString()}`,
            `Rs. ${(item.quantity * item.product.price).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['#', 'Item', 'Qty', 'Unit Price', 'Total']],
            body: tableBody,
            headStyles: { fillColor: [20, 184, 166], textColor: 255 },
            alternateRowStyles: { fillColor: [240, 250, 250] },
            margin: { top: 80 },
        });

        // Total Calculation using autoTable finalY to position correctly
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Amount: Rs. ${order.totalAmount.toLocaleString()}`, pageWidth - 14, finalY, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' });

        // Save
        doc.save(`invoice-${order.id}.pdf`);
    }
}
