import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatKES, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import {
  BarChart3,
  Edit,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type AdminTab = "overview" | "products" | "orders";

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
  brand: string;
  sku: string;
  isFeatured: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  imageUrl: "",
  brand: "",
  sku: "",
  isFeatured: false,
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const utils = trpc.useUtils();

  const { data: stats } = trpc.products.adminStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: productsRaw, isLoading: productsLoading } = trpc.products.adminList.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const products = productsRaw;
  const { data: orders, isLoading: ordersLoading } = trpc.orders.adminList.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: categories } = trpc.categories.list.useQuery();

  const createProduct = trpc.products.adminCreate.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      setShowProductForm(false);
      setForm(emptyForm);
      utils.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateProduct = trpc.products.adminUpdate.useMutation({
    onSuccess: () => {
      toast.success("Product updated!");
      setEditingProduct(null);
      setShowProductForm(false);
      setForm(emptyForm);
      utils.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProduct = trpc.products.adminDelete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted");
      utils.products.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateOrderStatus = trpc.orders.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      utils.orders.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 container py-20 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You do not have permission to access the admin dashboard.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: form.price,
      stock: parseInt(form.stock) || 0,
      categoryId: form.categoryId ? parseInt(form.categoryId) : (1 as number),
      imageUrl: form.imageUrl || undefined,
      featured: form.isFeatured,
    };
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
  };

  const startEdit = (product: Record<string, unknown>) => {
    setForm({
      name: String(product.name ?? ""),
      slug: String(product.slug ?? ""),
      description: String(product.description ?? ""),
      price: String(product.price ?? ""),
      stock: String(product.stock ?? "0"),
      categoryId: String(product.categoryId ?? ""),
      imageUrl: String(product.imageUrl ?? ""),
      brand: String(product.brand ?? ""),
      sku: String(product.sku ?? ""),
      isFeatured: Boolean(product.isFeatured),
    });
    setEditingProduct(product.id as number);
    setShowProductForm(true);
  };

  const statsData = stats as { productCount: number; orderCount: number } | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-primary text-primary-foreground py-10">
          <div className="container">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-primary-foreground/70 mt-1">Manage your store</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border">
            {(["overview", "products", "orders"] as AdminTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                  tab === t
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === "overview" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Products", value: statsData?.productCount ?? "—", icon: Package, color: "text-blue-600 bg-blue-50" },
                  { label: "Total Orders", value: statsData?.orderCount ?? "—", icon: ShoppingBag, color: "text-green-600 bg-green-50" },
                  { label: "Total Revenue", value: "—", icon: BarChart3, color: "text-purple-600 bg-purple-50" },
                  { label: "Total Users", value: "—", icon: Users, color: "text-orange-600 bg-orange-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setTab("products"); setShowProductForm(true); setForm(emptyForm); setEditingProduct(null); }}>
                      <PackagePlus className="w-4 h-4" /> Add New Product
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setTab("orders")}>
                      <ShoppingBag className="w-4 h-4" /> View All Orders
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === "products" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Products</h2>
                <Button
                  onClick={() => { setShowProductForm(!showProductForm); setForm(emptyForm); setEditingProduct(null); }}
                  className="gap-2"
                >
                  {showProductForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showProductForm ? "Cancel" : "Add Product"}
                </Button>
              </div>

              {/* Product Form */}
              {showProductForm && (
                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                  <h3 className="font-semibold mb-4">{editingProduct ? "Edit Product" : "New Product"}</h3>
                  <form onSubmit={handleSubmitProduct} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Product Name *</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="iPhone 15 Pro" required className="mt-1" />
                      </div>
                      <div>
                        <Label>Slug</Label>
                        <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="iphone-15-pro" className="mt-1" />
                      </div>
                      <div>
                        <Label>Price (KES) *</Label>
                        <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150000" required type="number" step="0.01" className="mt-1" />
                      </div>
                      <div>
                        <Label>Stock *</Label>
                        <Input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" required type="number" className="mt-1" />
                      </div>
                      <div>
                        <Label>Brand</Label>
                        <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Apple" className="mt-1" />
                      </div>
                      <div>
                        <Label>SKU</Label>
                        <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="APPL-IP15P-256" className="mt-1" />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <select
                          value={form.categoryId}
                          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                          className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select category</option>
                          {categories?.map((cat: { id: number; name: string }) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                        </select>
                      </div>
                      <div>
                        <Label>Image URL</Label>
                        <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Product description..."
                        rows={3}
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={form.isFeatured}
                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isFeatured">Featured Product</Label>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="gap-2" disabled={createProduct.isPending || updateProduct.isPending}>
                        {(createProduct.isPending || updateProduct.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {editingProduct ? "Update Product" : "Create Product"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setShowProductForm(false); setForm(emptyForm); setEditingProduct(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products List */}
              {productsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse flex gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary/30">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Product</th>
                        <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Category</th>
                        <th className="text-right px-4 py-3 font-semibold">Price</th>
                        <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Stock</th>
                        <th className="text-right px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map((product) => (
                        <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium line-clamp-1">{product.name}</p>
                                {(product as unknown as Record<string, unknown>).brand ? <p className="text-xs text-muted-foreground">{String((product as unknown as Record<string, unknown>).brand)}</p> : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {(product as unknown as Record<string, unknown>).categoryName as string ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{formatKES(product.price)}</td>
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startEdit(product as unknown as Record<string, unknown>)}
                                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${product.name}"?`)) {
                                    deleteProduct.mutate({ id: product.id });
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!products || products.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                      No products yet. Add your first product above.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {tab === "orders" && (
            <div>
              <h2 className="text-xl font-bold mb-6">All Orders</h2>
              {ordersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-4 bg-muted rounded w-32" />
                        <div className="h-4 bg-muted rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-secondary/30">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Order</th>
                        <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Customer</th>
                        <th className="text-right px-4 py-3 font-semibold">Amount</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Date</th>
                        <th className="text-right px-4 py-3 font-semibold">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((order) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const o = order as any;
                        return (
                          <tr key={o.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/order-confirmation/${o.id}`}>
                                <p className="font-semibold text-primary hover:underline">{o.orderNumber}</p>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{o.customerName ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatKES(o.totalAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getOrderStatusColor(String(o.status))}`}>
                                {getOrderStatusLabel(String(o.status))}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                              {new Date(o.createdAt).toLocaleDateString("en-KE")}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <select
                                value={o.status}
                                onChange={(e) => updateOrderStatus.mutate({ id: o.id, status: e.target.value as "pending" | "payment_initiated" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" })}
                                className="text-xs border border-input rounded-md px-2 py-1 bg-background"
                              >
                                {["pending","payment_initiated","paid","processing","shipped","delivered","cancelled","refunded"].map((s) => (
                                  <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(!orders || orders.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
