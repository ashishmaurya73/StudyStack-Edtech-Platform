const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");

const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const contactUsRoute = require("./routes/Contact")

const PORT = process.env.PORT || 4000;

// database connect
database.connect();
// middlewares
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:5173", // Dev frontend
    "https://studystack-edtech.vercel.app" // Production frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin: " + origin));
    }
  },
  credentials: true, // Allow cookies/auth headers
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", // Allow REST methods
  allowedHeaders: "Origin,X-Requested-With,Content-Type,Accept,Authorization" // Allow custom headers
};

// ✅ Apply CORS globally (MUST be before routes/middleware)
app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests for all routes
app.options("*", cors(corsOptions));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
)

// cloudinary connection
cloudinaryConnect();

// routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

// default routes

app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: 'Your server is up and running....'
    });
});

app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`);
})