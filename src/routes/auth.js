import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import connectDB from "../lib/db.js";
import { generateRefreshToken, hashRefreshToken } from "../lib/refreshToken.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import User from "../models/user.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "username and password required" });
    }

    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      username,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({ message: "User registered", userId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const db = await connectDB();
    const users = db.collection("users");

    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "username and password required" });

    const user = await users.findOne({ username });
    if (!user) return res.status(401).json({ error: "Authentication failed" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ error: "Authentication failed" });

    const payload = { userId: user._id, username: user.username };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "15m",
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    const ttlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    const refreshTokens = db.collection("refreshTokens");
    await refreshTokens.insertOne({
      userId: user._id,
      tokenHash,
      createdAt: now,
      expiresAt,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: accessToken,
      username: user.username,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    console.log("Raw refresh token:", rawRefreshToken);
    if (!rawRefreshToken)
      return res.status(401).json({ error: "Missing refresh token" });

    const db = await connectDB();
    const refreshTokens = db.collection("refreshTokens");

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const tokenDoc = await refreshTokens.findOne({ tokenHash });
    if (!tokenDoc)
      return res.status(403).json({ error: "Invalid refresh token" });

    if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
      await refreshTokens.deleteOne({ _id: tokenDoc._id });
      return res.status(403).json({ error: "Refresh token expired" });
    }

    const payload = { userId: tokenDoc.userId, username: tokenDoc.username };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION || "10m",
    });

    const newRefreshToken = generateRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);
    const ttlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

    await refreshTokens.deleteOne({ _id: tokenDoc._id });
    await refreshTokens.insertOne({
      userId: tokenDoc.userId,
      tokenHash: newHash,
      createdAt: now,
      expiresAt,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth/refresh-token",
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Token refresh failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    const db = await connectDB();
    const refreshTokens = db.collection("refreshTokens");

    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      await refreshTokens.deleteOne({ tokenHash });
    }

    res.clearCookie("refreshToken", { path: "/auth/refresh-token" });
    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = await User.findById(req.userId).select("-password");
    if (!userId) return res.status(404).json({ message: "User not found" });

    res.json(userId);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
