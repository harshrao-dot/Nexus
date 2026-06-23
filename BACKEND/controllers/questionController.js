const Room = require("../models/room");
const Question = require("../models/question");

const createQuestion = async (req, res) => {
    try {
        const {
            title,
            statement,
            constraints,
            examples,
            visibleTestCases,
            hiddenTestCases,
            difficulty,
            tags,
        } = req.body;

        const question = await Question.create({
            title,
            statement,
            constraints,
            examples,
            visibleTestCases,
            hiddenTestCases,
            difficulty,
            tags,
            createdBy: req.userId,
        });

        res.status(201).json({
            success: true,
            message: "Question created successfully",
            question,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find({
            createdBy: req.userId,
        });

        res.status(200).json({
            success: true,
            questions,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        res.status(200).json({
            success: true,
            question,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        if (question.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: "Question updated successfully",
            question: updatedQuestion,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        if (question.createdBy.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        await Question.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Question deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const selectQuestion = async (req, res) => {
    try {
        const { roomId, questionId } = req.body;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        if (room.owner.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Only owner can select question",
            });
        }

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        room.selectedQuestion = questionId;
        await room.save();

        res.status(200).json({
            success: true,
            message: "Question selected successfully",
            room,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

const getRoomQuestion = async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId)
            .populate("selectedQuestion");

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found",
            });
        }

        res.status(200).json({
            success: true,
            question: room.selectedQuestion,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {createQuestion,getAllQuestions,getQuestionById,updateQuestion,deleteQuestion,selectQuestion,getRoomQuestion,};