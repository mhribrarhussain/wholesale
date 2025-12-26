import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/models';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './customers.component.html',
    styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
    customers: Customer[] = [];

    constructor(
        private customerService: CustomerService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.customerService.customers$.subscribe(customers => {
            this.customers = customers;
        });
    }

    createNewOrder(customer: Customer): void {
        this.customerService.setActiveCustomer(customer);
        this.router.navigate(['/']);
    }
}
