import { Link } from "wouter";
import { Zap, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-xl">Sunbox</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Kenya's premier electronics destination. Quality products, competitive prices, and seamless M-Pesa payments.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-accent transition-colors">All Products</Link></li>
              <li><Link href="/cart" className="hover:text-accent transition-colors">Shopping Cart</Link></li>
              <li><Link href="/account/orders" className="hover:text-accent transition-colors">My Orders</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Categories</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link href="/products?search=phone" className="hover:text-accent transition-colors">Smartphones</Link></li>
              <li><Link href="/products?search=laptop" className="hover:text-accent transition-colors">Laptops</Link></li>
              <li><Link href="/products?search=tablet" className="hover:text-accent transition-colors">Tablets</Link></li>
              <li><Link href="/products?search=accessories" className="hover:text-accent transition-colors">Accessories</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-primary-foreground">Contact Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                +254 700 000 000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                info@sunbox.co.ke
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} Sunbox Electronics. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-accent font-semibold">M-Pesa</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
