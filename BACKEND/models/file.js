const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true
        },
        content: {
            type: String,
            default: ""
        },
        language: {
            type: String,
            required: true
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },
        createdBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true
        }
    },
    {
        timestamps : true
    }
);

module.exports = mongoose.model("File", fileSchema);