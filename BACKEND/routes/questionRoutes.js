const express = require("express");
const router = express.Router();

const {createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion, selectQuestion,getRoomQuestion} =     require("../controllers/questionController");

const authMiddleware = require("../middlewares/authMiddleware");

router.post("/create", authMiddleware, createQuestion);
router.get("/", authMiddleware, getAllQuestions);

router.put("/select-question", authMiddleware, selectQuestion);
router.get("/question/:roomId", authMiddleware, getRoomQuestion);

router.get("/:id", authMiddleware, getQuestionById);
router.put("/:id", authMiddleware, updateQuestion);
router.delete("/:id", authMiddleware, deleteQuestion);

module.exports = router;