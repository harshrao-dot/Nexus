import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/navbar";
import CreateRoomForm from "../components/createRoomForm";
import JoinRoomForm from "../components/joinRoomForm";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

export default function Dashboard() {
    const [rooms, setRooms] = useState([]);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get("/rooms");
            setRooms(res.data.rooms);
        } catch (err) {
            console.error(err);
        }
    };

    const createRoom = async ({interviewMode, maxUsers, password,}) => {
        try {
            const res = await api.post("/rooms/create", {interviewMode, maxUsers, password,});

            fetchRooms();
            setShowCreateRoom(false);

        } catch (err) {
            console.error(err);
        }
    };

    const joinRoom = async ({roomCode, password,}) => {
        try {
            const res = await api.post("/rooms/join", {roomCode,password,});

            await fetchRooms();
            setShowJoinRoom(false);

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard">
            <Navbar />

            <div className="actions">
                <div
                    className="action-card"
                    onClick={() => setShowCreateRoom(true)}
                >
                    Create Room
                </div>

                <div
                    className="action-card"
                    onClick={() => setShowJoinRoom(true)}
                >
                    Join Room
                </div>
            </div>

            {showCreateRoom && (
                <CreateRoomForm onCreateRoom={createRoom}/>
            )}

            {showJoinRoom && (
                <JoinRoomForm onJoinRoom={joinRoom}/>
            )}

            <div className="rooms-section">
                <h2>Your Rooms</h2>

                <div className="rooms-container">
                    {rooms.map((room) => (
                        <div className="room-card" key={room._id}>
                            <h3>{room.roomCode}</h3>

                            <p>
                                Mode: {room.interviewMode
                                    ? "Interview"
                                    : "Project"}
                            </p>

                            <p>
                                Members: {room.members.length}/{room.maxUsers}
                            </p>

                            <button
                                onClick={() => navigate(`/room/${room._id}`)}
                            >
                                Open Room
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}