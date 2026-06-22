import { useState } from "react";

export default function JoinRoomForm({ onJoinRoom }) {
    const [roomCode, setRoomCode] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div>
            <h2>Join Room</h2>

            <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) =>
                    setRoomCode(e.target.value)
                }
            />

            <br />

            <input
                type="text"
                placeholder="Password (optional)"
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
            />

            <br />

            <button
                onClick={() =>
                    onJoinRoom({
                        roomCode,
                        password,
                    })
                }
            >
                Join Room
            </button>
        </div>
    );
}