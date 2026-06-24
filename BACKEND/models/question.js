const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema(
    {
        title : {
            type : String,
            required : true
        },

        statement : {
            type : String,
            required : true
        },

        constraints : [
            {
                type : String
            }
        ],

        examples: [
            {
                input: {
                    type: String,
                    default: "",
                },

                output: {
                    type: String,
                    default: "",
                },

                explanation: {
                    type: String,
                    required: true,
                },
            },
        ],

        visibleTestCases: [
            {
                input: {
                    type: String,
                    default: "",
                },

                output: {
                    type: String,
                    default: "",
                },
            },
        ],

        hiddenTestCases: [
            {
                input: {
                    type: String,
                    default: "",
                },

                output: {
                    type: String,
                    default: "",
                },
            },
        ],

        difficulty : {
            type : String,
            enum : ["Easy", "Medium", "Hard"],
            required : true
        },

        tags : [
            {
                type : String
            }
        ],

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

module.exports = mongoose.model("Question", questionSchema);