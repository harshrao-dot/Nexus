require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();
const PORT = 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
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

const roomUsers = {};

io.on("connection", (socket) => {

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
    }


    roomUsers[roomId].push({
        socketId: socket.id,
        username
    });

    
    io.to(roomId).emit(
        "active-users",
        roomUsers[roomId]
    );

    socket.to(roomId).emit("user-joined", {socketId: socket.id});
  });

  socket.on("leave-room", (roomId) => {
    if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(
            (user) => user.socketId !== socket.id
        );

        if (roomUsers[roomId].length === 0) {
            delete roomUsers[roomId];
        }

        io.to(roomId).emit("active-users", roomUsers[roomId] || []);
    }

    socket.leave(roomId);
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("disconnect", () => {
      const roomId = socket.roomId;

      if (roomId && roomUsers[roomId]) {
          roomUsers[roomId] = roomUsers[roomId].filter(
              (user) => user.socketId !== socket.id
          );

          io.to(roomId).emit(
              "active-users",
              roomUsers[roomId]
          );
      }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});