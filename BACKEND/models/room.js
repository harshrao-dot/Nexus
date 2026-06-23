const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema(
    {
        roomCode : {
            type : String,
            required : true,
            unique : true
        },
        
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true
        },

        members : [
            {
                type : Schema.Types.ObjectId,
                ref : "User"
            }
        ],

        files : [
            {
                type : Schema.Types.ObjectId,
                ref : "File"
            }
        ],

        selectedQuestion : {
            type : Schema.Types.ObjectId,
            ref : "Question",
            default : null
        },

        interviewMode : {
            type : Boolean,
            default : null
        },

        maxUsers : {
            type : Number,
            default : 4
        },

        password : {
            type : String,
            default : null
        },

        messages: [
            {
                sender: {
                    type: Schema.Types.ObjectId,
                    ref: "User"
                },

                text: {
                    type: String
                },

                timestamp: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps : true
    }
);


module.exports = mongoose.model("Room", roomSchema);