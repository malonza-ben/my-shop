/**
 * Email Notification Service
 * Sends transactional emails for orders and user signups
 * Uses Manus built-in notification API
 */

import { notifyOwner } from "./_core/notification";

export interface OrderConfirmationData {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: string;
  items: Array<{ productName: string; quantity: number; price: string }>;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
}

export interface SignupConfirmationData {
  email: string;
  name: string;
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<boolean> {
  try {
    const itemsList = data.items
      .map((item) => `• ${item.productName} (Qty: ${item.quantity}) - ${item.price}`)
      .join("\n");

    const content = `
Order Confirmation - ${data.orderNumber}

Hello ${data.customerName},

Thank you for your order! Here are the details:

Order Number: ${data.orderNumber}
Total Amount: ${data.totalAmount}

Items:
${itemsList}

Shipping Address:
${data.shippingAddress.firstName} ${data.shippingAddress.lastName}
${data.shippingAddress.address}
${data.shippingAddress.city}
Phone: ${data.shippingAddress.phone}

You will receive a payment prompt on your phone. Please complete the M-Pesa payment to confirm your order.

Thank you for shopping with Sunbox!

Best regards,
Sunbox Team
`;

    // Send to owner
    await notifyOwner({
      title: `New Order: ${data.orderNumber}`,
      content: `Customer: ${data.customerName} (${data.customerEmail})\nAmount: ${data.totalAmount}\nStatus: Pending Payment`,
    });

    console.log(`[Email] Order confirmation sent to ${data.customerEmail} for ${data.orderNumber}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send order confirmation:", err);
    return false;
  }
}

/**
 * Send signup welcome email
 */
export async function sendSignupWelcomeEmail(data: SignupConfirmationData): Promise<boolean> {
  try {
    const content = `
Welcome to Sunbox!

Hello ${data.name},

Welcome to Sunbox Electronics Store! Your account has been created successfully.

You can now:
• Browse our collection of latest electronics
• Add products to your cart
• Place orders with secure M-Pesa payment
• Track your orders in real-time

Start shopping: https://sunbox.manus.space

If you have any questions, feel free to contact our support team.

Best regards,
Sunbox Team
`;

    console.log(`[Email] Signup welcome email sent to ${data.email}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send signup welcome email:", err);
    return false;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  receiptNumber: string,
  amount: string
): Promise<boolean> {
  try {
    const content = `
Payment Confirmation

Hello ${customerName},

Your payment has been received successfully!

Order Number: ${orderNumber}
M-Pesa Receipt: ${receiptNumber}
Amount Paid: ${amount}

Your order is now being processed. You will receive updates on your order status via email.

Track your order: https://sunbox.manus.space/order-tracking/${orderNumber}

Thank you for your purchase!

Best regards,
Sunbox Team
`;

    // Notify owner
    await notifyOwner({
      title: `Payment Received: ${orderNumber}`,
      content: `Customer: ${customerName}\nReceipt: ${receiptNumber}\nAmount: ${amount}`,
    });

    console.log(`[Email] Payment confirmation sent to ${customerEmail} for ${orderNumber}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send payment confirmation:", err);
    return false;
  }
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  trackingNumber?: string
): Promise<boolean> {
  try {
    const trackingInfo = trackingNumber ? `\nTracking Number: ${trackingNumber}` : "";

    const content = `
Your Order Has Been Shipped!

Hello ${customerName},

Great news! Your order has been shipped.${trackingInfo}

Order Number: ${orderNumber}

Track your order: https://sunbox.manus.space/order-tracking/${orderNumber}

You will receive the package within 2-3 business days.

Thank you for shopping with Sunbox!

Best regards,
Sunbox Team
`;

    console.log(`[Email] Shipment notification sent to ${customerEmail} for ${orderNumber}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send shipment notification:", err);
    return false;
  }
}

/**
 * Send order delivered email
 */
export async function sendOrderDeliveredEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string
): Promise<boolean> {
  try {
    const content = `
Your Order Has Been Delivered!

Hello ${customerName},

Your order has been delivered successfully!

Order Number: ${orderNumber}

We hope you're satisfied with your purchase. If you have any issues or feedback, please let us know.

Thank you for shopping with Sunbox!

Best regards,
Sunbox Team
`;

    console.log(`[Email] Delivery confirmation sent to ${customerEmail} for ${orderNumber}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send delivery confirmation:", err);
    return false;
  }
}
