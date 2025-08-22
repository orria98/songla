import express from "express";
import authRoutes from "./routes/auth.js";
import apiRoute from "./routes/api.js";
import protectedRoute from "./routes/protectedRoute.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const app = express();
const allowedOrigins = ["http://localhost:3001"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));
/* app.use((req, res, next) => {
  console.log("Request Headers:", req.headers);
  console.log("Response Headers:", res.getHeaders());
  next();
}); */
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/protected", protectedRoute);
app.use("/api", apiRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
