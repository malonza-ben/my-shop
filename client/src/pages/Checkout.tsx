import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatKES } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Loader2, Package, Phone, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type CheckoutStep = "details" | "payment" | "confirming";

export default function Checkout() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [customerMessage, setCustomerMessage] = useState<string>("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    phone: "",
    address: "",
    city: "",
    county: "",
    mpesaPhone: "",
    notes: "",
  });

  const { data: cartItems } = trpc.cart.get.useQuery(undefined, { enabled: isAuthenticated });

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const initiatePayment = trpc.mpesa.initiatePayment.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const { data: paymentStatus, refetch: refetchStatus } = trpc.mpesa.checkStatus.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId && step === "confirming", refetchInterval: false }
  );

  // Poll payment status
  useEffect(() => {
    if (step === "confirming" && orderId) {
      pollingRef.current = setInterval(() => {
        refetchStatus();
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, orderId, refetchStatus]);

  // React to payment status changes
  useEffect(() => {
    if (!paymentStatus) return;
    if (paymentStatus.status === "success" || paymentStatus.orderStatus === "paid") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setLocation(`/order-confirmation/${orderId}`);
    } else if (paymentStatus.status === "cancelled") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      toast.error("Payment was cancelled. You can retry from your orders page.");
      setStep("payment");
    } else if (paymentStatus.status === "failed") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      toast.error("Payment failed. Please try again.");
      setStep("payment");
    }
  }, [paymentStatus, orderId, setLocation]);

  const totalAmount = cartItems?.reduce((sum, item) => {
    return sum + parseFloat(String(item.product.price)) * item.quantity;
  }, 0) ?? 0;

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city || !form.county) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const result = await createOrder.mutateAsync({
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          county: form.county,
        },
        customerPhone: form.phone,
        notes: form.notes || undefined,
      });
      setOrderId(result.orderId);
      setStep("payment");
    } catch { /* handled by onError */ }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    if (!form.mpesaPhone || form.mpesaPhone.length < 9) {
      toast.error("Please enter a valid M-Pesa phone number");
      return;
    }
    try {
      const result = await initiatePayment.mutateAsync({
        orderId,
        phoneNumber: form.mpesaPhone,
      });
      setCheckoutRequestId(result.checkoutRequestId);
      setCustomerMessage(result.customerMessage ?? "Check your phone for the M-Pesa prompt.");
      setStep("confirming");
      toast.success("M-Pesa prompt sent to your phone!");
    } catch { /* handled by onError */ }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In to Checkout</h2>
          <p className="text-muted-foreground mb-6">Please sign in to complete your purchase.</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart before checking out.</p>
          <Link href="/products"><Button>Browse Products</Button></Link>
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
            <h1 className="text-3xl font-bold">Checkout</h1>
            <div className="flex items-center gap-3 mt-3">
              {["details", "payment", "confirming"].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s || (step === "confirming" && s === "payment") || (["payment","confirming"].includes(step) && s === "details") ? "bg-accent text-accent-foreground" : "bg-primary-foreground/20 text-primary-foreground/60"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm hidden sm:block ${step === s ? "text-accent font-medium" : "text-primary-foreground/60"}`}>
                    {s === "details" ? "Delivery Details" : s === "payment" ? "M-Pesa Payment" : "Confirming"}
                  </span>
                  {i < 2 && <div className="w-8 h-px bg-primary-foreground/30" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main form */}
            <div className="lg:col-span-2">
              {/* Step 1: Delivery Details */}
              {step === "details" && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-6">Delivery Details</h2>
                  <form onSubmit={handleSubmitDetails} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712345678" required className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street" required className="mt-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Nairobi" required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="county">County *</Label>
                        <Input id="county" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="Nairobi County" required className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions..." className="mt-1" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Link href="/cart">
                        <Button type="button" variant="outline" className="gap-2">
                          <ArrowLeft className="w-4 h-4" /> Back to Cart
                        </Button>
                      </Link>
                      <Button type="submit" className="flex-1 gap-2" disabled={createOrder.isPending}>
                        {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 2: M-Pesa Payment */}
              {step === "payment" && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Lipa Na M-Pesa</h2>
                      <p className="text-sm text-muted-foreground">Enter your M-Pesa number to receive a payment prompt</p>
                    </div>
                  </div>
                  <form onSubmit={handleInitiatePayment} className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-800 font-medium mb-1">How it works:</p>
                      <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                        <li>Enter your Safaricom M-Pesa number</li>
                        <li>Click "Send M-Pesa Prompt"</li>
                        <li>Check your phone for the payment prompt</li>
                        <li>Enter your M-Pesa PIN to confirm</li>
                      </ol>
                    </div>
                    <div>
                      <Label htmlFor="mpesaPhone">M-Pesa Phone Number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="mpesaPhone"
                          value={form.mpesaPhone}
                          onChange={(e) => setForm({ ...form, mpesaPhone: e.target.value })}
                          placeholder="0712345678 or 254712345678"
                          required
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Safaricom number registered with M-Pesa</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Amount to Pay</span>
                        <span className="text-2xl font-bold text-primary">{formatKES(totalAmount)}</span>
                      </div>
                    </div>
                    <Button type="submit" className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg" disabled={initiatePayment.isPending}>
                      {initiatePayment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                      Send M-Pesa Prompt
                    </Button>
                  </form>
                </div>
              )}

              {/* Step 3: Confirming Payment */}
              {step === "confirming" && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Waiting for Payment</h2>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {customerMessage || "A payment prompt has been sent to your M-Pesa number. Please enter your PIN to complete the payment."}
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left max-w-sm mx-auto mb-6">
                    <p className="text-sm text-green-800 font-medium mb-2">Steps to complete:</p>
                    <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                      <li>Check your phone for M-Pesa prompt</li>
                      <li>Enter your M-Pesa PIN</li>
                      <li>Wait for confirmation</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This page will automatically update once payment is confirmed. Do not close this page.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
                <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 leading-snug">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0">
                        {formatKES(parseFloat(String(item.product.price)) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">{formatKES(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
