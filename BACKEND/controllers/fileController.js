const File = require("../models/file");
const Room = require("../models/room");

const createFile = async (req, res) => {
    try {
        const { roomId, name, language } = req.body;

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const file = await File.create({
            name,
            language,
            room: roomId,
            createdBy: req.userId
        });

        room.files.push(file._id);
        await room.save();

        res.status(201).json({
            success: true,
            message: "File created Successfully",
            file
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const getFiles = async (req, res) => {
    try {
        const { roomId } = req.params;

        const files = await File.find({ room: roomId });

        res.status(200).json({
            success: true,
            files
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const renameFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { name } = req.body;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        file.name = name;
        await file.save();

        res.status(200).json({
            success: true,
            file
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        await Room.findByIdAndUpdate(
            file.room,
            { $pull: { files: file._id } }
        );

        await File.findByIdAndDelete(fileId);

        res.status(200).json({
            success: true,
            message: "File deleted successfully"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateFileContent = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { content } = req.body;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        file.content = content;

        await file.save();

        res.status(200).json({
            message: "File content updated",
            file,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

const getSingleFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }

        res.status(200).json({
            file,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

module.exports = {createFile, getFiles, renameFile, deleteFile, updateFileContent, getSingleFile};