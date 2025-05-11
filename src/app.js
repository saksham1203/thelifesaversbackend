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
const notificationRoutes = require("./routes/notificationRoutes");

// Existing setup
console.log("Hello! Backend server is starting...");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, origin); // Dynamically allow all origins
    },
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

// CORS - Allow all origins (dynamically)
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // Reflect the request origin
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

// Routes
app.use("/api/notifications", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api/blogs", blogRoutes);

// New route to send notifications to all connected users
app.post("/send-notification", (req, res) => {
  const notificationMessage = req.body.message || "Default notification message";
  io.emit("notification", notificationMessage);
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
  res.status(statusCode).json({ message, status: statusCode });
});

// Socket.IO connection for real-time chat
let onlineUsers = 0;

io.on("connection", (socket) => {
  onlineUsers++;
  console.log("A user connected:", socket.id);
  io.emit("usersOnline", onlineUsers);

  socket.on("sendMessage", async (messageData) => {
    try {
      console.log("Received message data:", messageData);
      io.emit("receiveMessage", messageData);
      await chatController.saveMessage(messageData);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("userTyping", () => {
    socket.broadcast.emit("userTyping");
  });

  socket.on("userStoppedTyping", () => {
    socket.broadcast.emit("userStoppedTyping");
  });

  socket.on("disconnect", () => {
    onlineUsers--;
    console.log("User disconnected:", socket.id);
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
