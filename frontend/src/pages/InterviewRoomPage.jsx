import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Editor from "@monaco-editor/react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import "./roompage.css";

function InterviewRoomPage() {
    
    const languageTemplates = {
        javascript: 'const input = require("fs").readFileSync(0, "utf8").trim();\n\n// Write your code here',

        python: 'import sys\n\ninput_data = sys.stdin.read().strip()\n\n# Write your code here',

        java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n        // Write your code here\n    }\n}',

        cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n    // Write your code here\n\n    return 0;\n}',
    };

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

    const [output, setOutput] = useState("");
    const [running, setRunning] = useState(false);
    const [consoleHeight, setConsoleHeight] = useState(180);
    const [isConsoleResizing, setIsConsoleResizing] = useState(false);
    const [showConsole, setShowConsole] = useState(true);

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

        if (isConsoleResizing) {
            document.body.style.userSelect = "none";
        } else {
            document.body.style.userSelect = "";
        }

        const handleMouseMove = (e) => {
            if (!isConsoleResizing) return;

            const newHeight = window.innerHeight - e.clientY - 40;

            setConsoleHeight(Math.min(Math.max(newHeight, 100), 400));
        };

        const handleMouseUp = () => setIsConsoleResizing(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isConsoleResizing]);

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
        socket.on("files-updated", fetchFiles);

        return () => {
            socket.off("files-updated", fetchFiles);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        socket.emit("join-room", { roomId, username: user.username });
    }, [roomId, user]);

    useEffect(() => {
        const handleCodeUpdate = ({ fileId, code }) => {

            if (selectedFile && selectedFile._id === fileId) {
                setCode(code);console.log("incoming fileId:", fileId);
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

    useEffect(() => {
        socket.on("execution-result", (output) => {
            setOutput(output);
        });

        return () => {
            socket.off("execution-result");
        };
    }, []);

    const fetchFiles = async () => {
        try {

            const res = await api.get(`/files/${roomId}`);

            if (res.data.files && res.data.files.length > 0) {
                openFile(res.data.files[0]._id);
            }
        } catch (err) {
            console.log("fetchFiles error:", err);
        }
    };

    const openFile = async (fileId) => {
        try {
            const res = await api.get(`/files/single/${fileId}`);
            setSelectedFile(res.data.file);
            setCode(res.data.file.content || languageTemplates[interviewLanguage]);

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
            await api.put("/questions/select-question", {
                roomId,
                questionId
            });

            const fileRes = await api.post("/files/create", {
                roomId,
                name: `solution-${questionId}.js`,
                language: interviewLanguage,
                content: languageTemplates[interviewLanguage]
            });

            setSelectedFile(fileRes.data.file);
            setCode(fileRes.data.file.content);

            socket.emit("files-updated", roomId);
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

    const runCode = async () => {
        try {
            setRunning(true);
            setOutput("");

            let passedCount = 0;
            let failedCase = null;
            const results = [];

            for (let i = 0; i < question.visibleTestCases.length; i++) {
                const testCase = question.visibleTestCases[i];

                const res = await api.post("/code/run", {
                    source_code: code,
                    language: interviewLanguage,
                    stdin: testCase.input,
                });

                const actual = (res.data.output || "").trim();
                const expected = testCase.output.trim();

                const passed = actual === expected;

                if (passed) {
                    passedCount++;
                } else if (!failedCase) {
                    failedCase = {
                        index: i + 1,
                        input: testCase.input,
                        expected,
                        actual,
                    };
                }

                results.push(
                    `${passed ? "✓" : "✗"} Test Case ${i + 1}`
                );
            }

            let outputText = results.join("\n");

            if (failedCase) {
                outputText += `

                Failed Test Case: ${failedCase.index}

                Input: ${failedCase.input}

                Expected: ${failedCase.expected}

                Got: ${failedCase.actual}`;
            }

            outputText += `\n\nPassed ${passedCount}/${question.visibleTestCases.length}`;

            setOutput(outputText);

            socket.emit("execution-result", {
                roomId,
                output: outputText,
            });

        } catch (err) {
            setOutput(
                err.response?.data?.message ||
                "Execution failed"
            );
        } finally {
            setRunning(false);
        }
    };

    const submitCode = async () => {
        try {
            setRunning(true);
            setOutput("");

            const allTestCases = [
                ...(question.visibleTestCases || []),
                ...(question.hiddenTestCases || []),
            ];

            let passedCount = 0;

            for (const testCase of allTestCases) {
                const res = await api.post("/code/run", {
                    source_code: code,
                    language: interviewLanguage,
                    stdin: testCase.input,
                });

                const actual = (res.data.output || "").trim();
                const expected = (testCase.output || "").trim();

                if (actual === expected) {
                    passedCount++;
                }
            }

            
            if (passedCount === allTestCases.length) {
                const outputText =
                    `Accepted ✅\n\nPassed ${passedCount}/${allTestCases.length}`;

                setOutput(outputText);

                socket.emit("execution-result", {
                    roomId,
                    output: outputText,
                });
            } else {
                const outputText =
                    `Wrong Answer ❌\n\nPassed ${passedCount}/${allTestCases.length}`;

                setOutput(outputText);

                socket.emit("execution-result", {
                    roomId,
                    output: outputText,
                });
            }
        } catch (err) {
            setOutput(
                err.response?.data?.message ||
                "Execution failed"
            );
        } finally {
            setRunning(false);
        }
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

                            setCode(languageTemplates[language]);

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
                    <button onClick={runCode} disabled={running}>
                        {running ? "Running..." : "Run"}
                    </button>
                    <button onClick={submitCode} disabled={running}>
                        Submit
                    </button>
                </div>
                
                <div style={{ flex: 1, minHeight: 0 }}>
                    <Editor
                        height="100%"
                        language={interviewLanguage}
                        value={code}
                        onChange={handleCodeChange}
                        options={{
                            automaticLayout: true,
                        }}
                    />
                </div>

                <div
                    className="console-resize-handle"
                    onMouseDown={() => setIsConsoleResizing(true)}
                />

                <div className="console-header">
                    <button onClick={() => setShowConsole(!showConsole)}>
                        {showConsole ? "▼" : "▲"}
                    </button>
                </div>

                {showConsole && (
                    <div className="execution-panel" style={{ height: `${consoleHeight}px` }}>
                        <div>
                            <h4>Output</h4>
                            <pre>{output}</pre>
                        </div>
                    </div>
                )}
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