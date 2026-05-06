import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Smartphone, Laptop, Headphones, Watch, Zap, TrendingUp, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const categories = [
  { id: 1, name: "Smartphones", icon: Smartphone, color: "from-blue-500 to-blue-600" },
  { id: 2, name: "Laptops", icon: Laptop, color: "from-purple-500 to-purple-600" },
  { id: 3, name: "Accessories", icon: Headphones, color: "from-pink-500 to-pink-600" },
  { id: 4, name: "Wearables", icon: Watch, color: "from-green-500 to-green-600" },
];

const promotions = [
  {
    title: "Summer Sale",
    subtitle: "Up to 40% off on selected items",
    badge: "SUMMER40",
    color: "from-orange-400 to-red-500",
  },
  {
    title: "Fast Delivery",
    subtitle: "Free shipping on orders over KES 5,000",
    badge: "FREE5K",
    color: "from-green-400 to-emerald-500",
  },
  {
    title: "Secure Payment",
    subtitle: "100% secure M-Pesa transactions",
    badge: "SECURE",
    color: "from-blue-400 to-cyan-500",
  },
];

export default function HomeEnhanced() {
  const { isAuthenticated } = useAuth();
  const { data: featuredProducts, isLoading } = trpc.products.list.useQuery({
    featured: true,
    limit: 8,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-block mb-4 px-3 py-1 bg-primary/20 border border-primary/40 rounded-full">
              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Kenya's Premier Electronics Store
              </p>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Technology That <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Empowers</span> Your World
            </h1>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Discover the latest smartphones, laptops, and electronics. Pay seamlessly with M-Pesa — fast, secure, and convenient.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white/20 hover:bg-white/20"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Banners */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promotions.map((promo, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${promo.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{promo.title}</h3>
                  <p className="text-sm text-white/80">{promo.subtitle}</p>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{promo.badge}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => (window.location.href = "/products")}
              >
                Learn More
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      <div className="container py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Browse our wide selection of electronics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} href={`/products?category=${cat.id}`}>
                <div className={`bg-gradient-to-br ${cat.color} rounded-xl p-6 text-white cursor-pointer hover:shadow-lg transition-all hover:scale-105`}>
                  <Icon className="w-8 h-8 mb-3" />
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="text-xs text-white/70 mt-2">Explore →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Products */}
      <div className="container py-16">
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-primary" />
                Featured Products
              </h2>
              <p className="text-muted-foreground">Handpicked electronics you'll love</p>
            </div>
            <Link href="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available</p>
          </div>
        )}
      </div>

      {/* Trust Section */}
      <div className="bg-primary/5 border-y border-border py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why Shop with Sunbox?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Get your electronics delivered within 2-3 business days</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Genuine Products</h3>
              <p className="text-muted-foreground">100% authentic electronics with warranty support</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Best Prices</h3>
              <p className="text-muted-foreground">Competitive pricing with regular promotions and discounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container py-16">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Upgrade Your Tech?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Browse our collection and find the perfect electronics for your needs. Secure M-Pesa payment, fast delivery, and genuine products guaranteed.
          </p>
          <Link href="/products">
            <Button size="lg" variant="secondary">
              Start Shopping Now
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
