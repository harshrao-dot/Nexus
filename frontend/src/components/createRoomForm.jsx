import { useState } from "react";

export default function CreateRoomForm({onCreateRoom}) {
    const [interviewMode, setInterviewMode] = useState(false);
    const [maxUsers, setMaxUsers] = useState(4);
    const [password, setPassword] = useState("");

    return (
        <div>
            <h2>Create Room</h2>

            <label>
                <input
                    type="checkbox"
                    checked={interviewMode}
                    onChange={(e) =>
                        setInterviewMode(e.target.checked)
                    }
                />
                Interview Mode
            </label>

            <br />

            <select
                value={maxUsers}
                onChange={(e) =>
                    setMaxUsers(Number(e.target.value))
                }
            >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
            </select>

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

            <button onClick={() => onCreateRoom({interviewMode, maxUsers, password,})}>
                Create Room
            </button>
        </div>
    );
}