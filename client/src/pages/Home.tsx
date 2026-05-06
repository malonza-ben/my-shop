import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowRight,
  Cpu,
  Headphones,
  Laptop,
  Monitor,
  Shield,
  Smartphone,
  Tablet,
  Truck,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  phones: Smartphone,
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  accessories: Headphones,
  monitors: Monitor,
  computers: Cpu,
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: featuredProducts, isLoading: loadingFeatured } = trpc.products.list.useQuery({ featured: true, limit: 8 });
  const { data: latestProducts, isLoading: loadingLatest } = trpc.products.list.useQuery({ limit: 8 });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => { toast.success("Added to cart!"); utils.cart.get.invalidate(); },
    onError: (err) => {
      if (err.message.includes("UNAUTHORIZED") || err.message.includes("not authenticated")) {
        toast.error("Please sign in to add items to cart");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) { toast.error("Please sign in to add items to cart"); return; }
    addToCart.mutate({ productId, quantity: 1 });
  };

  const ProductSkeleton = () => (
    <div className="bg-card rounded-xl border border-border animate-pulse">
      <div className="aspect-square bg-muted rounded-t-xl" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">
          <div className="container py-20 md:py-28">
            <div className="max-w-3xl">
              <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 text-sm px-4 py-1.5">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Kenya's Premier Electronics Store
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Technology That{" "}
                <span className="text-accent">Empowers</span>{" "}
                Your World
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl leading-relaxed">
                Discover the latest smartphones, laptops, and electronics. Pay seamlessly with M-Pesa — fast, secure, and convenient.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-semibold">
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2" onClick={() => (window.location.href = getLoginUrl())}>
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-accent" />
            <div className="absolute bottom-10 right-40 w-40 h-40 rounded-full bg-white" />
          </div>
        </div>
        <div className="bg-white border-b border-border">
          <div className="container py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Truck className="w-4 h-4 text-primary" /><span className="hidden sm:block">Fast Delivery</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" /><span className="hidden sm:block">Secure M-Pesa</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" /><span className="hidden sm:block">Genuine Products</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-14">
          <div className="container">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Shop by Category</h2>
              <p className="text-muted-foreground mt-1">Find exactly what you need</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] ?? Cpu;
                return (
                  <Link key={cat.id} href={`/products?category=${cat.id}`}>
                    <div className="group bg-card border border-border rounded-xl p-4 text-center hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary transition-colors">
                        <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(loadingFeatured || (featuredProducts && featuredProducts.length > 0)) && (
        <section className="py-14 bg-secondary/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Featured Products</h2>
                <p className="text-muted-foreground mt-1">Handpicked for you</p>
              </div>
              <Link href="/products?featured=true">
                <Button variant="ghost" className="gap-1 text-primary">View All <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {loadingFeatured ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />) :
                featuredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} isAddingToCart={addToCart.isPending} />
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="py-14">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Latest Arrivals</h2>
              <p className="text-muted-foreground mt-1">Fresh stock, just in</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="gap-1 text-primary">View All <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          {loadingLatest ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : latestProducts && latestProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {latestProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} isAddingToCart={addToCart.isPending} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground">Products will appear here once added by the admin.</p>
            </div>
          )}
        </div>
      </section>

      {/* M-Pesa CTA */}
      <section className="py-14 bg-accent/10 border-y border-accent/20">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-accent-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pay with M-Pesa</h2>
            <p className="text-muted-foreground text-lg mb-6">
              Checkout in seconds using Lipa Na M-Pesa. Fast, secure, and trusted by millions of Kenyans.
            </p>
            <Link href="/products">
              <Button size="lg" className="gap-2">Start Shopping <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
