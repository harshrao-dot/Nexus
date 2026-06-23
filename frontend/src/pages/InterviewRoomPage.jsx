import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Editor from "@monaco-editor/react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import "./roompage.css";

function InterviewRoomPage() {
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [code, setCode] = useState("");
    const [activeUsers, setActiveUsers] = useState([]);
    const [question, setQuestion] = useState(null);
    const [showQuestionLibrary, setShowQuestionLibrary] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [interviewLanguage, setInterviewLanguage] = useState("javascript");
    
    const [selectedFile, setSelectedFile] = useState(null);

    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
        fetchQuestion();
    }, [roomId]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = Math.min(Math.max(e.clientX, 250), 600);
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => setIsResizing(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        socket.on("active-users", (users) => setActiveUsers(users));
        return () => socket.off("active-users");
    }, []);

    useEffect(() => {
        socket.on("question-updated", () => {
            fetchQuestion();
        });
        return () => socket.off("question-updated");
    }, []);

    useEffect(() => {
        if (!user) return;
        socket.emit("join-room", { roomId, username: user.username });
    }, [roomId, user]);

    useEffect(() => {
        const handleCodeUpdate = ({ fileId, code }) => {
            if (selectedFile && selectedFile._id === fileId) {
                setCode(code);
            }
        };

        socket.on("code-update", handleCodeUpdate);
        return () => socket.off("code-update", handleCodeUpdate);
    }, [selectedFile]);

    useEffect(() => {
        const handleLanguageUpdate = (language) => {
            setInterviewLanguage(language);
        };

        socket.on("language-update", handleLanguageUpdate);

        return () => {
            socket.off("language-update", handleLanguageUpdate);
        };
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/files/${roomId}`);
            // If files exist, directly open the first file to trigger state sync
            if (res.data.files && res.data.files.length > 0) {
                openFile(res.data.files[0]._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const openFile = async (fileId) => {
        try {
            const res = await api.get(`/files/single/${fileId}`);
            setSelectedFile(res.data.file);
            setCode(res.data.file.content);

            socket.emit("get-file-state", fileId, (latestCode) => {
                if (latestCode !== null) {
                    setCode(latestCode);
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestion = async () => {
        try {
            const res = await api.get(`/questions/question/${roomId}`);
            setQuestion(res.data.question);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async () => {
        try {
            const res = await api.get("/questions");
            setQuestions(res.data.questions);
        } catch (err) {
            console.error(err);
        }
    };

    const selectQuestion = async (questionId) => {
        try {
            await api.put("/questions/select-question", { roomId, questionId });
            socket.emit("question-selected", { roomId });
            fetchQuestion();
            setShowQuestionLibrary(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCodeChange = (value) => {
        const newCode = value || "";
        setCode(newCode);
        
        if (selectedFile) {
            socket.emit("code-change", {
                roomId,
                fileId: selectedFile._id,
                code: newCode
            });
        }
    };

    const leaveRoom = () => {
        socket.emit("leave-room", roomId);
        navigate("/dashboard");
    };

    return (
        <div className="room-page">
            <div className="file-explorer" style={{ width: `${sidebarWidth}px` }}>
                <div className="question-header">
                    <h2>{question ? question.title : "No Question Selected"}</h2>
                    <div className="question-meta">
                        <span>{question?.difficulty}</span>
                        {question?.tags?.map((tag) => (
                            <span key={tag}> • {tag}</span>
                        ))}
                    </div>
                    <button onClick={() => { fetchQuestions(); setShowQuestionLibrary(true); }}>
                        Change Question
                    </button>
                </div>

                <h3>Description</h3>
                <p>{question ? question.statement : "Select a question first"}</p>

                <h3>Constraints</h3>
                {question?.constraints?.length ? (
                    question.constraints.map((c, index) => <p key={index}>{c}</p>)
                ) : (
                    <p>No constraints available</p>
                )}

                <h3>Examples</h3>
                {question?.examples?.length ? (
                    question.examples.map((example, index) => (
                        <div key={example._id || index}>
                            <p><strong>Input:</strong> {example.input}</p>
                            <p><strong>Output:</strong> {example.output}</p>
                            <p><strong>Explanation:</strong> {example.explanation}</p>
                            <hr />
                        </div>
                    ))
                ) : (
                    <p>No examples available</p>
                )}

                <div className="members-section">
                    <h4>Active Users ({activeUsers.length})</h4>
                    {activeUsers.map((user) => (
                        <div key={user.socketId}>{user.username}</div>
                    ))}
                </div>
            </div>

            <div className="resize-handle" onMouseDown={() => setIsResizing(true)} />

            <div className="editor-section">
                <button onClick={leaveRoom}>Leave Room</button>

                <div className="editor-header">
                    <select
                        value={interviewLanguage}
                        onChange={(e) => {
                            const language = e.target.value;

                            setInterviewLanguage(language);

                            socket.emit("language-change", {
                                roomId,
                                language
                            });
                        }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                        <option value="python">Python</option>
                    </select>
                </div>
                
                <Editor
                    height="90vh"
                    language={interviewLanguage}
                    value={code}
                    onChange={handleCodeChange}
                />
            </div>

            {showQuestionLibrary && (
                <div className="question-modal">
                    <h2>Questions</h2>
                    {questions.map((q) => (
                        <div key={q._id}>
                            <span>{q.title}</span>
                            <button onClick={() => selectQuestion(q._id)}>Select</button>
                        </div>
                    ))}
                    <button onClick={() => setShowQuestionLibrary(false)}>Close</button>
                </div>
            )}
        </div>
    );
}

export default InterviewRoomPage;