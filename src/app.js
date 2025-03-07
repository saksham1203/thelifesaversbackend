// Existing imports
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

// Existing setup
console.log("Hello! Backend server is starting...");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://the-life-savers-fronend.vercel.app",
      "https://www.thelifesavers.in",
      "https://thelifesavers.in"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Connect to the database
connectDB();

// Serve static files from the 'public' directory
app.use("/public", express.static(path.join(__dirname, "public")));

// Root route
app.get("/", (req, res) => {
  res.send("Hello! Backend server is running.");
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "trusted-cdn.com"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
  })
);

app.use(mongoSanitize());
app.use(xss());

const allowedOrigins = [
  "http://localhost:5173",
  "https://the-life-savers-fronend.vercel.app",
  "https://www.thelifesavers.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Define routes
app.use("/api", userRoutes);
app.use("/api/blogs", blogRoutes);

// New route to send notifications to all connected users
app.post("/send-notification", (req, res) => {
  const notificationMessage = req.body.message || "Default notification message";

  // Broadcast the notification to all connected users
  io.emit("notification", notificationMessage);

  // Send a response back to indicate success
  res.status(200).json({ message: "Notification sent to all users!" });
});

// Error handling
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const message = error.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(error.stack);
  }

  res.status(statusCode).json({
    message,
    status: statusCode,
  });
});

// Socket.IO connection for real-time chat
let onlineUsers = 0; // Track the number of connected users

io.on("connection", (socket) => {
  onlineUsers++; // Increment user count
  console.log("A user connected:", socket.id);

  // Emit the updated online user count to all connected clients
  io.emit("usersOnline", onlineUsers);

  // Listen for incoming messages
  socket.on("sendMessage", async (messageData) => {
    try {
      console.log("Received message data:", messageData);
      io.emit("receiveMessage", messageData); // Broadcast message to clients
      await chatController.saveMessage(messageData); // Save message to DB
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Typing event handling
  socket.on("userTyping", () => {
    socket.broadcast.emit("userTyping"); // Notify other users that someone is typing
  });

  socket.on("userStoppedTyping", () => {
    socket.broadcast.emit("userStoppedTyping"); // Notify others that typing has stopped
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    onlineUsers--; // Decrement user count
    console.log("User disconnected:", socket.id);

    // Emit the updated online user count to all connected clients
    io.emit("usersOnline", onlineUsers);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});

// Start the server
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port ${process.env.PORT || 5000}`);
});
