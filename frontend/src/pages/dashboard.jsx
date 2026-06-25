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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-10">
                <Navbar />

                <div className="mb-10">
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                        Dashboard
                    </h1>
                    <p className="mt-3 max-w-2xl text-slate-400">
                        Create collaborative coding rooms or continue your existing sessions.
                    </p>
                </div>

                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div
                        onClick={() => setShowCreateRoom(true)}
                        className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-indigo-500 hover:shadow-indigo-600/20"
                    >
                        <div className="mb-5 text-5xl">🚀</div>
                        <h2 className="mb-2 text-2xl font-semibold">Create Room</h2>
                        <p className="text-slate-400">
                            Start a new interview or collaborative coding session.
                        </p>
                    </div>

                    <div
                        onClick={() => setShowJoinRoom(true)}
                        className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-cyan-500 hover:shadow-cyan-500/20"
                    >
                        <div className="mb-5 text-5xl">🤝</div>
                        <h2 className="mb-2 text-2xl font-semibold">Join Room</h2>
                        <p className="text-slate-400">
                            Enter an existing room using the room code.
                        </p>
                    </div>

                    <div
                        onClick={() => navigate("/questions")}
                        className="cursor-pointer rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-purple-500 hover:shadow-purple-500/20"
                    >
                        <div className="mb-5 text-5xl">📚</div>
                        <h2 className="mb-2 text-2xl font-semibold">Question Library</h2>
                        <p className="text-slate-400">
                            Browse interview questions and coding challenges.
                        </p>
                    </div>
                </div>

                {showCreateRoom && <CreateRoomForm onCreateRoom={createRoom} />}

                {showJoinRoom && <JoinRoomForm onJoinRoom={joinRoom} />}

                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-3xl font-bold">Your Rooms</h2>
                        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-1 text-sm text-slate-300">
                            {rooms.length} Rooms
                        </span>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-12 text-center backdrop-blur">
                            <div className="mb-4 text-6xl">💻</div>
                            <h3 className="mb-2 text-2xl font-semibold">No Rooms Yet</h3>
                            <p className="text-slate-400">
                                Create your first collaborative coding room.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {rooms.map((room) => (
                                <div
                                    key={room._id}
                                    className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-indigo-500"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {room.roomCode}
                                            </h3>
                                            <p className="mt-2 text-slate-400">
                                                {room.interviewMode
                                                    ? "Interview Room"
                                                    : "Project Room"}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-indigo-600/20 px-3 py-1 text-xs text-indigo-300">
                                            Active
                                        </span>
                                    </div>

                                    <div className="mt-6 space-y-2 text-slate-300">
                                        <p>
                                            👥 {room.members.length} / {room.maxUsers} Members
                                        </p>
                                        <p>
                                            📝{" "}
                                            {room.interviewMode
                                                ? "Interview Mode"
                                                : "Project Mode"}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/room/${room._id}`)}
                                        className="mt-8 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500"
                                    >
                                        Open Room
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}