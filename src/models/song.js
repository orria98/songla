import mongoose from "mongoose";

const instrumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  audioUrl: { type: String, required: true },
});

const songSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  spotifyPlays: { type: Number, required: true },
  hint: { type: String, required: true },
  difficulty: { type: String, required: true },
  instruments: [instrumentSchema],
});

export default mongoose.model("Song", songSchema);
