import { formatKES } from "@/lib/utils";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "wouter";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  originalPrice?: string | null;
  imageUrl?: string | null;
  stock: number;
  featured: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  isAddingToCart?: boolean;
}

export default function ProductCard({ product, onAddToCart, isAddingToCart }: ProductCardProps) {
  const hasDiscount =
    product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPct = hasDiscount
    ? Math.round(
        ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
          parseFloat(product.originalPrice!)) *
          100
      )
    : 0;

  return (
    <div className="product-card bg-card rounded-xl border border-border overflow-hidden group">
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square bg-secondary overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-xs font-bold">
                -{discountPct}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-accent text-accent-foreground text-xs font-bold">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors mb-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-primary">
            {formatKES(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatKES(product.originalPrice!)}
            </span>
          )}
        </div>

        <Button
          size="sm"
          className="w-full gap-2"
          disabled={product.stock === 0 || isAddingToCart}
          onClick={() => onAddToCart?.(product.id)}
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
