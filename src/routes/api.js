import verifyToken from "../middleware/authMiddleware.js";
import Song from "../models/song.js";
import express from "express";
import connectDB from "../lib/db.js";
import fs from "fs/promises";

const router = express.Router();

router.post("/daily", verifyToken, async (req, res) => {
  try {
    const {
      title,
      artist,
      date,
      hint,
      releaseYear,
      spotifyPlays,
      difficulty,
      instruments,
    } = req.body;
    const db = await connectDB();
    const songs = db.collection("songs");

    if (
      !title ||
      !artist ||
      !date ||
      !hint ||
      !releaseYear ||
      !spotifyPlays ||
      !difficulty ||
      !instruments
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("Attempting to save song:", {
      title,
      artist,
      date,
      hint,
      releaseYear,
      spotifyPlays,
      difficulty,
      instruments,
    });
    const song = new Song({
      date,
      title,
      artist,
      releaseYear,
      spotifyPlays,
      hint,
      difficulty,
      instruments,
    });
    const result = await songs.insertOne(song);
    res
      .status(201)
      .json({ message: "Song saved successfully", songId: result.insertedId });
  } catch (err) {
    console.error("Error saving song:", err);
    res.status(500).json({ error: "Failed to save song" });
  }
});

router.get("/daily", async (req, res) => {
  try {
    const db = await connectDB();
    const songs = db.collection("songs");
    const dailySongs = await songs.find({}).toArray();
    const today = new Date().toISOString().split("T")[0];
    const songOfTheDay = dailySongs.find(
      (song) => new Date(song.date).toISOString().split("T")[0] === today
    );
    res.status(200).json(songOfTheDay);
  } catch (err) {
    console.error("Error fetching daily songs:", err);
    res.status(500).json({ error: "Failed to fetch daily songs" });
  }
});

router.get("/allSongs", (req, res) => {
  fs.readFile("./data/playlist_artist_song.json", "utf8")
    .then((data) => {
      const songs = JSON.parse(data);
      res.status(200).json(songs);
    })
    .catch((err) => {
      console.error("Error reading song data:", err);
      res.status(500).json({ error: "Failed to read song data" });
    });
});

router.get("/songsLast7Days", async (req, res) => {
  try {
    const db = await connectDB();
    const songs = db.collection("songs");
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 400);
    const recentSongs = await songs
      .find({ date: { $gte: last7Days } })
      .toArray();
    res.status(200).json(recentSongs);
  } catch (err) {
    console.error("Error fetching songs from the last 9 days:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch songs from the last 9 days" });
  }
});

import { ObjectId } from "mongodb";

router.post("/stats/:songId", async (req, res) => {
  try {
    const { songId } = req.params;
    const { won, guessNumber } = req.body;

    if (typeof won !== "boolean" || typeof guessNumber !== "number") {
      return res.status(400).json({ error: "won og guessNumber eru nauðsynleg" });
    }

    const db = await connectDB();
    const songStats = db.collection("songStats");

    const bucket = Math.min(Math.max(guessNumber, 1), 7);

    const updateObj = {
      $inc: {
        totalPlays: 1,
        ...(won && { totalWins: 1 }),
        ...(won && { [`distribution.${bucket}`]: 1 }),
      },
    };

    await songStats.updateOne({ songId }, updateObj, { upsert: true });

    res.status(200).json({ message: "Tölfræði vistuð" });
  } catch (err) {
    console.error("Villa við að vista tölfræði:", err);
    res.status(500).json({ error: "Gat ekki vistað tölfræði" });
  }
});

router.get("/stats/:songId", async (req, res) => {
  try {
    const { songId } = req.params;
    const db = await connectDB();
    const songStats = db.collection("songStats");

    const stats = await songStats.findOne({ songId });

    if (!stats) {
      return res.status(200).json({
        songId,
        totalPlays: 0,
        totalWins: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
      });
    }

    res.status(200).json(stats);
  } catch (err) {
    console.error("Villa við að sækja tölfræði:", err);
    res.status(500).json({ error: "Gat ekki sótt tölfræði" });
  }
});

router.get("/song/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const songs = db.collection("songs");
    const song = await songs.findOne({ _id: new ObjectId(req.params.id) });

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }
    res.status(200).json(song);
  } catch (err) {
    console.error("Error fetching song:", err);
    res.status(500).json({ error: "Failed to fetch song" });
  }
});

export default router;
