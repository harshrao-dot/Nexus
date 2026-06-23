const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {createRoom, joinRoom, getMyRooms, selectQuestion, getRoomQuestion} = require("../controllers/roomController");

router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/", authMiddleware, getMyRooms);
router.put("/select-question", authMiddleware, selectQuestion );
router.get("/question/:roomId", authMiddleware, getRoomQuestion);

module.exports = router;