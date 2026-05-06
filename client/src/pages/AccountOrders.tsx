import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";

export default function AccountOrders() {
  const { isAuthenticated, user } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In to View Orders</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your order history.</p>
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
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-primary-foreground/70 mt-1">Welcome back, {user?.name}</p>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 p-3 mb-2">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link href="/account/orders">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium cursor-pointer">
                      <Package className="w-4 h-4" /> My Orders
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold mb-4">Order History</h2>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                      <div className="flex justify-between mb-3">
                        <div className="h-4 bg-muted rounded w-32" />
                        <div className="h-4 bg-muted rounded w-20" />
                      </div>
                      <div className="h-3 bg-muted rounded w-48" />
                    </div>
                  ))}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No orders yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here.</p>
                  <Link href="/products"><Button size="sm">Browse Products</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const o = order as any as {
                      id: number;
                      orderNumber: string;
                      status: string;
                      totalAmount: string;
                      createdAt: Date;
                      itemCount: number;
                    };
                    return (
                      <Link key={o.id} href={`/order-confirmation/${o.id}`}>
                        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-primary">{o.orderNumber}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {new Date(o.createdAt).toLocaleDateString("en-KE", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatKES(o.totalAmount)}</p>
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-1 inline-block ${getOrderStatusColor(String(o.status))}`}>
                                {getOrderStatusLabel(String(o.status))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
