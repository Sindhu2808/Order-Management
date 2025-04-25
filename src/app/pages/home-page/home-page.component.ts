import { Component, inject, OnInit } from '@angular/core';
import { OidcSecurityService } from "angular-auth-oidc-client";
import { Product } from "../../model/product";
import { ProductService } from "../../services/product/product.service";
import { AsyncPipe, JsonPipe } from "@angular/common";
import { Router } from "@angular/router";
import { Order } from "../../model/order";
import { FormsModule } from "@angular/forms";
import { OrderService } from "../../services/order/order.service";
import { map, switchMap, take } from "rxjs/operators";

@Component({
  selector: 'app-homepage',
  templateUrl: './home-page.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    JsonPipe,
    FormsModule
  ],
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly productService = inject(ProductService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  isAuthenticated = false;
  products: Array<Product> = [];
  quantityIsNull = false;
  orderSuccess = false;
  orderFailed = false;

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated = isAuthenticated;

      this.productService.getProducts().subscribe(product => {
        this.products = product;
        console.log("Fetched Products:", this.products); // ✅ Debug: Check if products contain skuCode
      });
    });
  }

  goToCreateProductPage() {
    this.router.navigateByUrl('/add-product');
  }

  orderProduct(product: Product, quantity: string) {
    console.log("Product before ordering:", product); // ✅ Debugging Step: Check if skuCode exists

    if (!quantity) {
      this.orderFailed = true;
      this.orderSuccess = false;
      this.quantityIsNull = true;
      return;
    }

    this.oidcSecurityService.userData$
      .pipe(
        take(1), // ✅ Take only the latest userData
        map(result => ({
          email: result.userData?.email ?? "unknown@example.com",
          firstName: result.userData?.firstName ?? "Unknown",
          lastName: result.userData?.lastName ?? "Unknown"
        })),
        switchMap(userDetails => {
          const order: Order = {
            skuCode: product.skuCode ?? "UNKNOWN_SKU", // ✅ Ensure skuCode is set
            price: product.price,
            quantity: Number(quantity),
            userDetails: userDetails
          };

          console.log("Final Order Payload:", order); // ✅ Debugging Step: Verify request payload

          return this.orderService.orderProduct(order);
        })
      )
      .subscribe({
        next: () => this.orderSuccess = true,
        error: () => this.orderFailed = true
      });
  }
}
