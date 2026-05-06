import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";

export default function Products() {
  const { isAuthenticated } = useAuth();
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const selectedCategoryId = params.get("category") ? Number(params.get("category")) : undefined;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products, isLoading } = trpc.products.list.useQuery({
    categoryId: selectedCategoryId,
    search: debouncedSearch || undefined,
    limit: 48,
  });

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

  const handleCategorySelect = (catId?: number) => {
    const newParams = new URLSearchParams(searchString);
    if (catId) {
      newParams.set("category", String(catId));
    } else {
      newParams.delete("category");
    }
    setLocation(`/products?${newParams.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setLocation("/products");
  };

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const hasFilters = !!selectedCategoryId || !!debouncedSearch;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container">
            <h1 className="text-3xl font-bold mb-1">
              {selectedCategory ? selectedCategory.name : "All Products"}
            </h1>
            <p className="text-primary-foreground/70">
              {products ? `${products.length} products found` : "Loading..."}
            </p>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar filters */}
            <aside className="w-full md:w-56 flex-shrink-0">
              <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Filters</span>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs text-muted-foreground" onClick={handleClearFilters}>
                      Clear <X className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* Categories */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleCategorySelect(undefined)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!selectedCategoryId ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-foreground"}`}
                    >
                      All Categories
                    </button>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${selectedCategoryId === cat.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-foreground"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products grid */}
            <main className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                      <div className="aspect-square bg-muted rounded-t-xl" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-8 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={addToCart.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {hasFilters ? "Try adjusting your search or filters." : "No products available yet."}
                  </p>
                  {hasFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
