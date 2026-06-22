const express = require("express");
const router = express.Router();

const {createFile, getFiles, renameFile, deleteFile, updateFileContent, getSingleFile,} = require("../controllers/fileController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createFile);

router.get("/:roomId", authMiddleware, getFiles);

router.get("/single/:fileId", authMiddleware, getSingleFile);

router.put("/rename/:fileId", authMiddleware, renameFile);

router.put("/content/:fileId", authMiddleware, updateFileContent);

router.delete("/:fileId", authMiddleware, deleteFile);


module.exports = router;