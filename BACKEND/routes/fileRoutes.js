const express = require("express");
const router = express.Router();

const {createFile, getFiles, renameFile, deleteFile} = require("../controllers/fileController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createFile);

router.get("/:roomId", authMiddleware, getFiles);

router.put("/rename/:fileId", authMiddleware, renameFile);

router.delete("/:fileId", authMiddleware, deleteFile);

module.exports = router;