const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {createRoom, joinRoom} = require("../controllers/roomController");

router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);

module.exports = router;