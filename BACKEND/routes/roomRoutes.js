const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {createRoom, joinRoom, getMyRooms} = require("../controllers/roomController");

router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/", authMiddleware, getMyRooms);

module.exports = router;