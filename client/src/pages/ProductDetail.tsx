import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useParams } from "wouter";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = trpc.products.bySlug.useQuery({ slug: slug ?? "" });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success(`${product?.name} added to cart!`);
      utils.cart.get.invalidate();
    },
    onError: (err) => {
      if (err.message.includes("UNAUTHORIZED") || err.message.includes("not authenticated")) {
        toast.error("Please sign in to add items to cart");
      } else {
        toast.error(err.message);
      }
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error("Please sign in to add items to cart"); return; }
    if (!product) return;
    addToCart.mutate({ productId: product.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">This product doesn't exist or has been removed.</p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = (product.images as string[] | null) ?? (product.imageUrl ? [product.imageUrl] : []);
  const specs = product.specifications as Record<string, string> | null;
  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPct = hasDiscount
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
            <span>/</span>
            <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              <div className="aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
                {images[selectedImage] ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-border"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.featured && (
                  <Badge className="bg-accent text-accent-foreground">
                    <Star className="w-3 h-3 mr-1" /> Featured
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge className="bg-red-500 text-white">-{discountPct}% OFF</Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="secondary">Out of Stock</Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">{formatKES(product.price)}</span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through">{formatKES(product.originalPrice!)}</span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-6">
                {product.stock > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      {product.stock > 10 ? "In Stock" : `Only ${product.stock} left`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-red-500 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
              )}

              {/* Quantity + Add to Cart */}
              {product.stock > 0 && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="flex-1 gap-2"
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </Button>
                </div>
              )}

              {/* Delivery info */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Fast Delivery Available</p>
                  <p className="text-xs text-muted-foreground">Delivered to your doorstep across Kenya</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {specs && Object.keys(specs).length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-foreground mb-6">Specifications</h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(specs).map(([key, value], i) => (
                      <tr key={key} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                        <td className="px-6 py-3 text-sm font-medium text-foreground w-1/3">{key}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link href="/products">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
