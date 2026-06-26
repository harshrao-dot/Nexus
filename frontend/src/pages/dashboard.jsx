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
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute rounded-full -top-24 -left-24 h-80 w-80 bg-indigo-600/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 rounded-full h-80 w-80 bg-cyan-500/20 blur-3xl" />
        </div>

        <div className="relative px-6 py-10 mx-auto max-w-7xl">
            <Navbar />

            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Dashboard</h1>
                <p className="max-w-2xl mt-3 text-slate-400">
                    Create collaborative coding rooms or continue your existing sessions.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-3">
                <div
                    onClick={() => setShowCreateRoom(true)}
                    className="p-8 transition duration-300 border shadow-xl cursor-pointer rounded-3xl border-slate-800 bg-slate-900/80 backdrop-blur-xl hover:-translate-y-2 hover:border-indigo-500 hover:shadow-indigo-600/20"
                >
                    <div className="mb-5 text-5xl">🚀</div>
                    <h2 className="mb-2 text-2xl font-semibold">Create Room</h2>
                    <p className="text-slate-400">Start a new interview or collaborative coding session.</p>
                </div>

                <div
                    onClick={() => setShowJoinRoom(true)}
                    className="p-8 transition duration-300 border shadow-xl cursor-pointer rounded-3xl border-slate-800 bg-slate-900/80 backdrop-blur-xl hover:-translate-y-2 hover:border-cyan-500 hover:shadow-cyan-500/20"
                >
                    <div className="mb-5 text-5xl">🤝</div>
                    <h2 className="mb-2 text-2xl font-semibold">Join Room</h2>
                    <p className="text-slate-400">Enter an existing room using the room code.</p>
                </div>

                <div
                    onClick={() => navigate("/questions")}
                    className="p-8 transition duration-300 border shadow-xl cursor-pointer rounded-3xl border-slate-800 bg-slate-900/80 backdrop-blur-xl hover:-translate-y-2 hover:border-purple-500 hover:shadow-purple-500/20"
                >
                    <div className="mb-5 text-5xl">📚</div>
                    <h2 className="mb-2 text-2xl font-semibold">Question Library</h2>
                    <p className="text-slate-400">Browse interview questions and coding challenges.</p>
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoom && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowCreateRoom(false)}
                >
                    <div
                        className="relative w-full max-w-md px-8 pb-10 border shadow-2xl rounded-3xl border-slate-800 bg-slate-900/95 pt-14 backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute rounded-full pointer-events-none -top-20 -left-20 h-60 w-60 bg-indigo-600/20 blur-3xl" />
                        <div className="absolute rounded-full pointer-events-none -bottom-20 -right-20 h-60 w-60 bg-cyan-500/15 blur-3xl" />

                        <button
                            onClick={() => setShowCreateRoom(false)}
                            className="absolute text-xl leading-none transition top-4 right-4 text-slate-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="relative">
                            <div className="mb-6 text-center">
                                <div className="mb-3 text-4xl">🚀</div>
                                <h2 className="text-2xl font-bold tracking-tight text-white">Create Room</h2>
                                <p className="mt-1 text-sm text-slate-400">Set up a new coding session</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); createRoom({ interviewMode: e.target.interviewMode.checked, maxUsers: Number(e.target.maxUsers.value), password: e.target.password.value }); }} className="space-y-5">
                                <div className="flex items-center justify-between px-4 py-3 border rounded-xl border-slate-700 bg-slate-800/80">
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Interview Mode</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Enable structured interview flow</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="interviewMode" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                    </label>
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-slate-300">Max Users</label>
                                    <select
                                        name="maxUsers"
                                        defaultValue={4}
                                        className="w-full px-4 py-3 text-white transition border outline-none cursor-pointer rounded-xl border-slate-700 bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                    >
                                        {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                                            <option key={n} value={n} className="bg-slate-800">{n} Users</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-slate-300">
                                        Password <span className="font-normal text-slate-500">(optional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Leave blank for open room"
                                        className="w-full px-4 py-3 text-white transition border outline-none rounded-xl border-slate-700 bg-slate-800 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.99]"
                                >
                                    Create Room
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Room Modal */}
            {showJoinRoom && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowJoinRoom(false)}
                >
                    <div
                        className="relative w-full max-w-md px-8 pb-10 border shadow-2xl rounded-3xl border-slate-800 bg-slate-900/95 pt-14 backdrop-blur-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute rounded-full pointer-events-none -top-20 -left-20 h-60 w-60 bg-cyan-500/20 blur-3xl" />
                        <div className="absolute rounded-full pointer-events-none -bottom-20 -right-20 h-60 w-60 bg-indigo-600/15 blur-3xl" />

                        <button
                            onClick={() => setShowJoinRoom(false)}
                            className="absolute text-xl leading-none transition top-4 right-4 text-slate-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="relative">
                            <div className="mb-6 text-center">
                                <div className="mb-1 text-4xl">🤝</div>
                                <h2 className="text-xl font-bold tracking-tight text-white">Join Room</h2>
                                <p className="mt-1 text-sm text-slate-400">Enter a room code to get started</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); joinRoom({ roomCode: e.target.roomCode.value, password: e.target.password.value }); }} className="space-y-5">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-slate-300">Room Code</label>
                                    <input
                                        type="text"
                                        name="roomCode"
                                        placeholder="e.g. ABC-1234"
                                        required
                                        className="w-full px-4 py-3 tracking-widest text-white uppercase transition border outline-none rounded-xl border-slate-700 bg-slate-800 placeholder:text-slate-500 placeholder:tracking-normal placeholder:normal-case focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-slate-300">
                                        Password <span className="font-normal text-slate-500">(if required)</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Leave blank if none"
                                        className="w-full px-4 py-3 text-white transition border outline-none rounded-xl border-slate-700 bg-slate-800 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white transition hover:bg-cyan-500 active:scale-[0.99]"
                                >
                                    Join Room
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold">Your Rooms</h2>
                    <span className="px-4 py-1 text-sm border rounded-full border-slate-700 bg-slate-900/70 text-slate-300">
                        {rooms.length} Rooms
                    </span>
                </div>

                {rooms.length === 0 ? (
                    <div className="p-12 text-center border border-dashed rounded-3xl border-slate-700 bg-slate-900/60 backdrop-blur">
                        <div className="mb-4 text-6xl">💻</div>
                        <h3 className="mb-2 text-2xl font-semibold">No Rooms Yet</h3>
                        <p className="text-slate-400">Create your first collaborative coding room.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {rooms.map((room) => (
                            <div
                                key={room._id}
                                className="p-6 transition border shadow-xl rounded-3xl border-slate-800 bg-slate-900/80 backdrop-blur-xl hover:-translate-y-1 hover:border-indigo-500"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold">{room.roomCode}</h3>
                                        <p className="mt-2 text-slate-400">
                                            {room.interviewMode ? "Interview Room" : "Project Room"}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 text-xs text-indigo-300 rounded-full bg-indigo-600/20">
                                        Active
                                    </span>
                                </div>

                                <div className="mt-6 space-y-2 text-slate-300">
                                    <p>👥 {room.members.length} / {room.maxUsers} Members</p>
                                    <p>📝 {room.interviewMode ? "Interview Mode" : "Project Mode"}</p>
                                </div>

                                <button
                                    onClick={() => navigate(`/room/${room._id}`)}
                                    className="w-full py-3 mt-8 font-semibold text-white transition bg-indigo-600 rounded-xl hover:bg-indigo-500"
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