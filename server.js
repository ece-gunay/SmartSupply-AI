require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const chatRoutes = require("./routes/chat");
const inventoryRoutes = require("./routes/inventory");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Statik frontend
app.use(express.static(path.join(__dirname, "public")));

// API rotaları
app.use("/api", chatRoutes);
app.use("/api", inventoryRoutes);

// Basit health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`\n🚀 SmartSupply AI sunucusu çalışıyor: http://localhost:${PORT}\n`);
});
