import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Use raw SQL for seeding
await connection.execute(`
  INSERT IGNORE INTO categories (name, slug, description, icon) VALUES
  ('Smartphones', 'smartphones', 'Latest smartphones and mobile devices', '📱'),
  ('Laptops', 'laptops', 'Powerful laptops for work and play', '💻'),
  ('Tablets', 'tablets', 'Tablets for productivity and entertainment', '📟'),
  ('Audio', 'audio', 'Headphones, earbuds, and speakers', '🎧'),
  ('Accessories', 'accessories', 'Cables, cases, chargers and more', '🔌'),
  ('Smart Home', 'smart-home', 'Smart home devices and gadgets', '🏠')
`);

console.log("✅ Categories seeded");

// Get category IDs
const [catRows] = await connection.execute("SELECT id, slug FROM categories");
const catMap = {};
for (const row of catRows) {
  catMap[row.slug] = row.id;
}

// Seed products
const sampleProducts = [
  {
    categoryId: catMap["smartphones"],
    name: "Samsung Galaxy S24 Ultra",
    slug: "samsung-galaxy-s24-ultra",
    description: "The ultimate Samsung flagship with a built-in S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor. Experience AI-powered photography and all-day battery life.",
    price: "185000.00",
    originalPrice: "195000.00",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    brand: "Samsung",
    sku: "SAM-S24U-256",
    featured: true,
    active: true,
  },
  {
    categoryId: catMap["smartphones"],
    name: "iPhone 15 Pro Max",
    slug: "iphone-15-pro-max",
    description: "Apple's most powerful iPhone with titanium design, A17 Pro chip, and a 48MP camera system. Featuring USB-C and Action Button for ultimate versatility.",
    price: "195000.00",
    originalPrice: "205000.00",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    brand: "Apple",
    sku: "APL-IP15PM-256",
    featured: true,
    active: true,
  },
  {
    categoryId: catMap["smartphones"],
    name: "Google Pixel 8 Pro",
    slug: "google-pixel-8-pro",
    description: "Google's flagship phone with Tensor G3 chip, 50MP camera with AI enhancements, and 7 years of OS updates. Best-in-class computational photography.",
    price: "125000.00",
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
    brand: "Google",
    sku: "GGL-PX8P-128",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["laptops"],
    name: "MacBook Pro 14\" M3 Pro",
    slug: "macbook-pro-14-m3-pro",
    description: "Supercharged by M3 Pro chip with up to 18-core CPU and 30-core GPU. Stunning Liquid Retina XDR display, up to 22 hours battery life.",
    price: "295000.00",
    originalPrice: "310000.00",
    stock: 6,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    brand: "Apple",
    sku: "APL-MBP14-M3P",
    featured: true,
    active: true,
  },
  {
    categoryId: catMap["laptops"],
    name: "Dell XPS 15 (2024)",
    slug: "dell-xps-15-2024",
    description: "Premium Windows laptop with Intel Core Ultra 9, OLED display, NVIDIA RTX 4070, and 86Whr battery. Perfect for professionals and creatives.",
    price: "245000.00",
    stock: 5,
    imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80",
    brand: "Dell",
    sku: "DELL-XPS15-24",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["laptops"],
    name: "Lenovo ThinkPad X1 Carbon",
    slug: "lenovo-thinkpad-x1-carbon",
    description: "Ultra-lightweight business laptop at just 1.12kg. Intel Core Ultra 7, 14\" IPS display, MIL-SPEC durability, and legendary ThinkPad keyboard.",
    price: "185000.00",
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
    brand: "Lenovo",
    sku: "LNV-X1C-GEN12",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["tablets"],
    name: "iPad Pro 12.9\" M4",
    slug: "ipad-pro-129-m4",
    description: "The most advanced iPad ever with M4 chip, Ultra Retina XDR display with OLED technology, Apple Pencil Pro support, and all-day battery.",
    price: "175000.00",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
    brand: "Apple",
    sku: "APL-IPADPRO-M4",
    featured: true,
    active: true,
  },
  {
    categoryId: catMap["audio"],
    name: "Sony WH-1000XM5",
    slug: "sony-wh-1000xm5",
    description: "Industry-leading noise canceling headphones with 30-hour battery, multipoint connection, and crystal clear hands-free calling. Foldable design for portability.",
    price: "45000.00",
    originalPrice: "52000.00",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    brand: "Sony",
    sku: "SNY-WH1000XM5",
    featured: true,
    active: true,
  },
  {
    categoryId: catMap["audio"],
    name: "Apple AirPods Pro (2nd Gen)",
    slug: "airpods-pro-2nd-gen",
    description: "Active Noise Cancellation, Transparency mode, Adaptive Audio, and Personalized Spatial Audio. Up to 6 hours listening time with ANC enabled.",
    price: "32000.00",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80",
    brand: "Apple",
    sku: "APL-APP2-USBC",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["accessories"],
    name: "Anker 65W GaN Charger",
    slug: "anker-65w-gan-charger",
    description: "Compact 65W GaN charger with 3 ports (2x USB-C, 1x USB-A). Charge a MacBook, iPhone, and iPad simultaneously. Foldable plug design.",
    price: "4500.00",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&q=80",
    brand: "Anker",
    sku: "ANK-65W-GAN3P",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["accessories"],
    name: "Samsung 45W USB-C Cable (2m)",
    slug: "samsung-45w-usbc-cable-2m",
    description: "Official Samsung braided USB-C cable supporting 45W fast charging and USB 3.2 Gen 2 data transfer speeds. 2-meter length for convenience.",
    price: "1800.00",
    stock: 100,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    brand: "Samsung",
    sku: "SAM-USBC-2M45W",
    featured: false,
    active: true,
  },
  {
    categoryId: catMap["smart-home"],
    name: "Amazon Echo Dot (5th Gen)",
    slug: "amazon-echo-dot-5th-gen",
    description: "Compact smart speaker with improved bass, motion detection, and temperature sensor. Control your smart home with Alexa voice commands.",
    price: "8500.00",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&q=80",
    brand: "Amazon",
    sku: "AMZ-ECHO5-CHR",
    featured: false,
    active: true,
  },
];

for (const product of sampleProducts) {
  if (!product.categoryId) {
    console.log(`⚠️  Skipping ${product.name} - category not found`);
    continue;
  }
  try {
    await connection.execute(
      `INSERT IGNORE INTO products 
       (categoryId, name, slug, description, price, originalPrice, stock, imageUrl, featured, active, specifications, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [
        product.categoryId,
        product.name,
        product.slug,
        product.description,
        product.price,
        product.originalPrice ?? null,
        product.stock,
        product.imageUrl ?? null,
        product.featured ? 1 : 0,
        product.active ? 1 : 0,
      ]
    );
    console.log(`✅ Product: ${product.name}`);
  } catch (err) {
    console.log(`⚠️  Skipped ${product.name}: ${err.message}`);
  }
}

await connection.end();
console.log("\n🎉 Seed complete!");
