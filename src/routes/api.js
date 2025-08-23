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

export default router;
