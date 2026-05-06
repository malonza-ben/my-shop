import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  User,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: cartItems } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-white border-b border-border"
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-primary tracking-tight">
              Sunbox
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={cn(location === "/" && "bg-secondary")}
              >
                Home
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="ghost"
                size="sm"
                className={cn(location.startsWith("/products") && "bg-secondary")}
              >
                All Products
              </Button>
            </Link>
            {categories && categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Categories <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.id} asChild>
                      <Link href={`/products?category=${cat.id}`}>
                        {cat.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-semibold">
                        {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                      {user.name ?? user.email ?? "Account"}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="flex items-center gap-2">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Settings className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-destructive flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="container py-4 flex flex-col gap-1">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">Home</Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" className="w-full justify-start">All Products</Button>
            </Link>
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.id}`}>
                <Button variant="ghost" className="w-full justify-start pl-6 text-muted-foreground">
                  {cat.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
