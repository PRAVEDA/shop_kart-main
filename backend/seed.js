const dns = require("dns");
const dotenv = require("dotenv");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

const mongoose = require("mongoose");
const Product = require("./models/product.model");

const sampleProducts = [
  {
    name: "Mechanical Keyboard",
    description: "Custom RGB mechanical keyboard with tactile blue switches, double-shot PBT keycaps, and aircraft-grade aluminum frame.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    stock: 15
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active hybrid noise cancellation, 40-hour battery life, and crystal-clear studio acoustics.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    stock: 25
  },
  {
    name: "Ultra HD Smart Watch",
    description: "Sleek fitness and lifestyle smartwatch featuring AMOLED always-on display, heart-rate tracking, GPS, and water resistance up to 50m.",
    price: 3499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    stock: 8
  },
  {
    name: "Wireless Ergonomic Mouse",
    description: "Precision wireless mouse designed for all-day comfort with silent magnetic switches, thumb rest, and rechargeable battery.",
    price: 1299,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    stock: 30
  },
  {
    name: "Classic Denim Jacket",
    description: "Timeless vintage wash denim jacket made from 100% sustainable organic cotton with rugged metal button closures.",
    price: 2499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    stock: 12
  },
  {
    name: "Minimalist Canvas Backpack",
    description: "Durable water-resistant canvas travel backpack with padded laptop sleeve, anti-theft hidden pocket, and ergonomic shoulder straps.",
    price: 1899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    stock: 18
  },
  {
    name: "Clean Code Handbook",
    description: "The definitive guide to software craftsmanship by Robert C. Martin, covering best engineering practices, refactoring, and code hygiene.",
    price: 899,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    stock: 40
  },
  {
    name: "Atomic Habits Hardcover",
    description: "An easy and proven way to build good habits and break bad ones by James Clear. Global bestseller with actionable transformation frameworks.",
    price: 599,
    category: "Books",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    stock: 50
  },
  {
    name: "Modern Ceramic Desk Lamp",
    description: "Contemporary Nordic style ceramic table lamp with touch-dimmable warm ambient LED light and matte stone finish.",
    price: 1499,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    stock: 14
  },
  {
    name: "Aroma Ultrasonic Diffuser",
    description: "Quiet ultrasonic essential oil diffuser with 7-color ambient night light, auto-shutoff timer, and wood-grain aesthetic design.",
    price: 1199,
    category: "Home",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    stock: 22
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Check existing count
    const existingCount = await Product.countDocuments();
    console.log(`Current products in database: ${existingCount}`);

    if (existingCount === 0) {
      console.log("Seeding sample products...");
      await Product.insertMany(sampleProducts);
      console.log(`Successfully seeded ${sampleProducts.length} products.`);
    } else {
      console.log("Database already has products. Ensuring sample products are available...");
      for (const p of sampleProducts) {
        const found = await Product.findOne({ name: p.name });
        if (!found) {
          await Product.create(p);
          console.log(`Added: ${p.name}`);
        }
      }
    }

    const total = await Product.countDocuments();
    console.log(`Total products now in database: ${total}`);

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database disconnected.");
  }
}

seedDatabase();
