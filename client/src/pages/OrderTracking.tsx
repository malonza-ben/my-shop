import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { CheckCircle, Clock, Package, Truck, AlertCircle, ShoppingBag } from "lucide-react";
import { useParams } from "wouter";
import React from "react";
import { Link } from "wouter";

const statusSteps = [
  { status: "pending", label: "Order Placed", icon: ShoppingBag },
  { status: "payment_initiated", label: "Payment Processing", icon: Clock },
  { status: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

const statusOrder = ["pending", "payment_initiated", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function OrderTracking() {
  const { isAuthenticated, user } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const orderIdNum = parseInt(orderId || "0");

  const { data: order, isLoading, refetch } = trpc.orders.byId.useQuery(
    { id: orderIdNum },
    { enabled: isAuthenticated && orderIdNum > 0 }
  );

  // Auto-poll for status updates every 5 seconds if order is not delivered/cancelled
  React.useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled" || order.status === "refunded") {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [order?.status, refetch]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In to Track Order</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your order tracking information.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find the order you're looking for.</p>
          <Link href="/account/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any;
  const currentStatusIndex = statusOrder.indexOf(String(o.status));
  const isCompleted = o.status === "delivered";
  const isCancelled = o.status === "cancelled" || o.status === "refunded";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container">
            <h1 className="text-3xl font-bold">Order Tracking</h1>
            <p className="text-primary-foreground/70 mt-1">Track your order in real-time</p>
          </div>
        </div>

        <div className="container py-12">
          <div className="max-w-3xl mx-auto">
            {/* Order Header */}
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-2xl font-bold text-primary">{o.orderNumber}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getOrderStatusColor(String(o.status))}`}>
                  {getOrderStatusLabel(String(o.status))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(o.createdAt).toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">{formatKES(o.totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-card border border-border rounded-xl p-8 mb-8">
              <h2 className="text-xl font-bold mb-8">Order Status Timeline</h2>
              <div className="space-y-6">
                {statusSteps.map((step, index) => {
                  const isActive = statusOrder.indexOf(step.status) <= currentStatusIndex;
                  const isCurrent = statusOrder.indexOf(step.status) === currentStatusIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground border-2 border-border"
                          }`}
                        >
                          {isActive ? <StepIcon className="w-5 h-5" /> : index + 1}
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-12 mt-2 ${isActive ? "bg-primary" : "bg-border"}`}
                          />
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 pt-1">
                        <p className={`font-semibold ${isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.status === "pending" && "Your order has been placed"}
                            {step.status === "payment_initiated" && "Waiting for payment confirmation"}
                            {step.status === "paid" && "Payment received, preparing for shipment"}
                            {step.status === "processing" && "Your order is being prepared"}
                            {step.status === "shipped" && "Your order is on its way"}
                            {step.status === "delivered" && "Order delivered successfully"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-xl p-8 mb-8">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              {o.items && Array.isArray(o.items) && o.items.length > 0 ? (
                <div className="space-y-3">
                  {o.items.map((item: { productName?: string; quantity?: number; price?: string }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div>
                        <p className="font-medium">{item.productName || "Product"}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="font-semibold">{formatKES(item.price || "0")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items in this order</p>
              )}
            </div>

            {/* Shipping Address */}
            {o.shippingAddress && (
              <div className="bg-card border border-border rounded-xl p-8">
                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">
                    {String((o.shippingAddress as Record<string, unknown>).firstName)} {String((o.shippingAddress as Record<string, unknown>).lastName)}
                  </p>
                  <p>{String((o.shippingAddress as Record<string, unknown>).address)}</p>
                  <p>{String((o.shippingAddress as Record<string, unknown>).city)}</p>
                  <p className="text-muted-foreground">{String((o.shippingAddress as Record<string, unknown>).phone)}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Link href="/account/orders" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Orders
                </Button>
              </Link>
              <Link href="/products" className="flex-1">
                <Button className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
