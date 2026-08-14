import mongoose from "mongoose";

import dns from "dns";

dns.setServers(["1.1.1.1","8.8.8.8"])


export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/afyacare";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected -> ${uri}`);
}
