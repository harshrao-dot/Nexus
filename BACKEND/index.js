require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const fileRoutes = require("./routes/fileRoutes");


const app = express();
const PORT = 5000;
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/rooms", roomRoutes);
app.use("/files", fileRoutes);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("MongoDB Connection Failed", err);
  });

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});