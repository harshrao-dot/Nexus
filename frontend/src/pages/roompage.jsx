import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import ProjectRoomPage from "./ProjectRoomPage";
import InterviewRoomPage from "./InterviewRoomPage";

function RoomPage() {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);

    useEffect(() => {
        fetchRoom();
    }, [roomId]);

    const fetchRoom = async () => {
        const res = await api.get("/rooms");

        const currentRoom = res.data.rooms.find(
            (r) => String(r._id) === String(roomId)
        );

        setRoom(currentRoom);
    };

    if (!room) return <h2>Loading...</h2>;

    return room.interviewMode
        ? <InterviewRoomPage />
        : <ProjectRoomPage />;
}

export default RoomPage;