import mongoose from "mongoose";

const songStatsSchema = new mongoose.Schema({
  songId: { type: String, required: true, unique: true },
  totalPlays: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  distribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
    6: { type: Number, default: 0 },
    7: { type: Number, default: 0 },
  },
});

export default mongoose.model("SongStats", songStatsSchema);
