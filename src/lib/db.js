import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri =
  "mongodb+srv://orriantons:cbpJiGH66GoU3Bah@cluster0.f0ffvuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  if (db) return db;

  try {
    await client.connect();
    db = client.db("songla");
    console.log("✅ Connected to MongoDB");
    return db;
  } catch (err) {
    console.error("❌ Could not connect to MongoDB", err);
    throw err;
  }
}

export default connectDB;
