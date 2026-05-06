import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatKES, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { CheckCircle, Package, Truck } from "lucide-react";
import { Link, useParams } from "wouter";

type ShippingAddr = { fullName: string; phone: string; address: string; city: string; county: string };
function AddressDisplay({ addr }: { addr: ShippingAddr }) {
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <p className="font-medium text-foreground">{addr.fullName}</p>
      <p>{addr.address}</p>
      <p>{addr.city}, {addr.county}</p>
      <p>{addr.phone}</p>
    </div>
  );
}

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);

  const { data: orderRaw, isLoading } = trpc.orders.byId.useQuery({ id }, { enabled: !!id });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderRaw as any as {
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: string;
    shippingAddress: ShippingAddr | null;
    items: Array<{ id: number; productName: string; productImage: string | null; quantity: number; unitPrice: string; subtotal: string }>;
    userId: number;
    customerPhone: string | null;
    customerName: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <div className="w-16 h-16 bg-muted rounded-full animate-pulse mx-auto mb-4" />
          <div className="h-6 bg-muted rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <Link href="/account/orders"><Button>View My Orders</Button></Link>
        </div>
      </div>
    );
  }

    type OrderItem = {
    id: number;
    productName: string;
    productImage: string | null;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  };
  const items = (order.items ?? []) as OrderItem[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="container py-12 max-w-2xl mx-auto">
          {/* Success header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase. Your order has been received.
            </p>
          </div>


          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-bold text-primary">{String(order.orderNumber ?? '')}</p>
              </div>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getOrderStatusColor(String(order.status))}`}>
                {getOrderStatusLabel(String(order.status))}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatKES(item.unitPrice)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatKES(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-bold">Total Paid</span>
              <span className="text-xl font-bold text-primary">{formatKES(String(order.totalAmount ?? 0))}</span>
            </div>
          </div>

          {/* Shipping info */}
          {order.shippingAddress && (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Delivery Address</h3>
              </div>
              {order.shippingAddress && <AddressDisplay addr={order.shippingAddress} />}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/account/orders" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Package className="w-4 h-4" /> View All Orders
              </Button>
            </Link>
            <Link href="/products" className="flex-1">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
