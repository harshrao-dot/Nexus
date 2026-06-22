const Room = require("../models/room");
const bcrypt = require("bcryptjs");

function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for(let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}


const createRoom = async (req, res) => {
    try {

        const { interviewMode, maxUsers, password } = req.body;

        const ownerId = req.userId;

        let roomCode = generateRoomCode();

        while (await Room.findOne({ roomCode })) {
            roomCode = generateRoomCode();
        }

        let hashedPassword = null;

        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const room = await Room.create({
            roomCode,
            owner: ownerId,
            members: [ownerId],
            interviewMode,
            maxUsers,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Room created successfully",
            roomCode: room.roomCode,
            roomId: room._id
        });

    } catch(err) {
        return res.status(500).json({
            message: err.message
        });
    }
};


const joinRoom = async(req, res) => {
    try{
        const{roomCode, password} = req.body;
        
        const room = await Room.findOne({roomCode});

        if(!room){
            return res.status(404).json({
                message : "Room not found!"
            })
        }


        if (room.password) {
            const isMatch = await bcrypt.compare(
                password || "",
                room.password
            );

            if (!isMatch) {
                return res.status(400).json({
                    message: "Incorrect password"
                });
            }
        }

        if (room.members.includes(req.userId)) {
            return res.status(400).json({
                message: "Already a member of this room"
            });
        }

        if(room.members.length >= room.maxUsers){
            return res.status(400).json({
                message : "Room is full!"
            })
        }

        room.members.push(req.userId);

        await room.save();

        return res.status(200).json({
            message: "Joined room successfully",
            roomCode: room.roomCode
        });


    
    }catch (err){
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const getMyRooms = async(req, res) => {
    try{
        const rooms = await Room.find({members : req.userId}).populate("owner", "username");
        return res.status(200).json({
            success : true,
            rooms
        })
    }catch(err){
        return res.status(500).json({
            success : false,
            message : err.message
        });
    }
};

module.exports = {createRoom, joinRoom, getMyRooms};