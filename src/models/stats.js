const statsSchema = new mongoose.Schema({
  songId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
  guessNumber: { type: Number, required: true },
  dnf: { type: Boolean, default: false },
});

export default mongoose.model("Stats", statsSchema);
