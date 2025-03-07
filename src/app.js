// Required imports
const express = require("express");
const http = require("http");
const path = require("path");
const connectDB = require("./config/db");
const userRoutes = require("./routes/index");
const blogRoutes = require("./routes/blogRoutes");
const chatController = require("./controllers/chatController");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const socketIo = require("socket.io");
require("dotenv").config();

// Start message
console.log("Hello! Backend server is starting...");

// Setup app & server
const app = express();
const server = http.createServer(app);

// ⚠️ Full list of allowed origins (including Capacitor & your domains)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost",
  "capacitor://localhost",
  "https://the-life-savers-fronend.vercel.app",
  "https://www.thelifesavers.in",
  "https://service.thelifesavers.in"
];

// ⚙️ Setup Socket.io with correct CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Database Connection
connectDB();

// Serve static files (public folder)
app.use("/public", express.static(path.join(__dirname, "public")));

// Simple health check route
app.get("/", (req, res) => {
  res.send("Hello! Backend server is running.");
});

// 🛡️ Security Middleware (Helmet, Sanitizers, etc.)
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Compression for performance
app.use(compression());

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Full CORS middleware setup
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Allow OPTIONS for preflight
app.options("*", cors());

// 🛡️ Rate Limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  })
);

// 🛣️ API Routes
app.use("/api", userRoutes);
app.use("/api/blogs", blogRoutes);

// Notification broadcast route (optional)
app.post("/send-notification", (req, res) => {
  const notificationMessage = req.body.message || "Default notification message";
  io.emit("notification", notificationMessage);
  res.status(200).json({ message: "Notification sent to all users!" });
});

// 🐛 404 Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// 🐛 Global Error Handler
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const message = error.message || "Internal Server Error";
  if (process.env.NODE_ENV !== "production") {
    console.error(error.stack);
  }
  res.status(statusCode).json({ message, status: statusCode });
});

// 💬 WebSockets for Real-time Chat
let onlineUsers = 0;

io.on("connection", (socket) => {
  onlineUsers++;
  console.log("✅ User connected:", socket.id);
  io.emit("usersOnline", onlineUsers);

  socket.on("sendMessage", async (messageData) => {
    try {
      io.emit("receiveMessage", messageData);
      await chatController.saveMessage(messageData);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("userTyping", () => socket.broadcast.emit("userTyping"));
  socket.on("userStoppedTyping", () => socket.broadcast.emit("userStoppedTyping"));

  socket.on("disconnect", () => {
    onlineUsers--;
    console.log("❌ User disconnected:", socket.id);
    io.emit("usersOnline", onlineUsers);
  });
});

// 💥 Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
