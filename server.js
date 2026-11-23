import express from "express";
import mongoose from "mongoose";
import todoRoutes from "./routes/todoRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 9000;

// MongoDB connection caching (safe for Vercel serverless)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME || "todoDB",
  });
  isConnected = true;
  console.log("Connected to MongoDB");
}

app.use(express.json());

// Connect to DB before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({ message: "Database unavailable", error: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", dbConnected: isConnected });
});

// Routes
app.use("/api/v1/todos", todoRoutes);
app.use("/api/v1/users", userRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
