import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@/lib/utils";
import { ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => { toast.success("Item removed"); utils.cart.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const totalAmount = cartItems?.reduce((sum, item) => {
    return sum + parseFloat(String(item.product.price)) * item.quantity;
  }, 0) ?? 0;

  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In to View Cart</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your shopping cart.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-primary-foreground/70 mt-1">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="container py-8">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cartItems || cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some products to get started.</p>
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const itemTotal = parseFloat(String(item.product.price)) * item.quantity;
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                      {/* Image */}
                      <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                        <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm leading-snug mb-1">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-primary font-bold">{formatKES(item.product.price)}</p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <button
                          onClick={() => removeItem.mutate({ id: item.id })}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem.mutate({ id: item.id });
                              } else {
                                updateItem.mutate({ id: item.id, quantity: item.quantity - 1 });
                              }
                            }}
                            disabled={updateItem.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                            onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                            disabled={updateItem.isPending || item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatKES(itemTotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
                  <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                          {item.product.name} × {item.quantity}
                        </span>
                        <span className="font-medium flex-shrink-0">
                          {formatKES(parseFloat(String(item.product.price)) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="text-xl font-bold text-primary">{formatKES(totalAmount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
                  </div>
                  <Link href="/checkout">
                    <Button className="w-full gap-2" size="lg">
                      Proceed to Checkout <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button variant="ghost" className="w-full mt-2">Continue Shopping</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
