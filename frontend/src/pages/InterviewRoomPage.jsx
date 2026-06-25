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
    <div className="flex h-screen bg-[#0d0d0f] text-gray-100 overflow-hidden">
        <div
            className="flex flex-col h-full overflow-y-auto shrink-0 bg-[#111114] border-r border-white/[0.07]"
            style={{ width: `${sidebarWidth}px` }}
        >
            <div className="p-5 border-b border-white/[0.07]">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-sm font-semibold text-white leading-snug">
                        {question ? question.title : "No Question Selected"}
                    </h2>
                    {question?.difficulty && (
                        <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            question.difficulty === "Easy"   ? "bg-emerald-500/15 text-emerald-400" :
                            question.difficulty === "Medium" ? "bg-amber-500/15 text-amber-400" :
                                                               "bg-red-500/15 text-red-400"
                        }`}>
                            {question.difficulty}
                        </span>
                    )}
                </div>

                {question?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {question.tags.map((tag) => (
                            <span key={tag} className="text-[11px] bg-white/[0.06] text-gray-400 px-2 py-0.5 rounded-md">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => { fetchQuestions(); setShowQuestionLibrary(true); }}
                    className="w-full mt-1 text-xs font-medium bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white px-3 py-2 rounded-lg transition-all duration-150"
                >
                    Change Question
                </button>
            </div>
            <div className="p-5 border-b border-white/[0.07]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                    {question ? question.statement : "Select a question to get started."}
                </p>
            </div>

            <div className="p-5 border-b border-white/[0.07]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Constraints</p>
                {question?.constraints?.length ? (
                    <ul className="space-y-1.5">
                        {question.constraints.map((c, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                                {c}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500">No constraints listed.</p>
                )}
            </div>

            <div className="p-5 border-b border-white/[0.07]">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Examples</p>
                {question?.examples?.length ? (
                    <div className="space-y-4">
                        {question.examples.map((example, index) => (
                            <div key={example._id || index} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 space-y-2 text-xs">
                                <div>
                                    <span className="text-gray-500 uppercase tracking-wider text-[10px]">Input</span>
                                    <pre className="mt-1 font-mono text-gray-200 bg-black/30 px-2.5 py-1.5 rounded-md overflow-x-auto">{example.input}</pre>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase tracking-wider text-[10px]">Output</span>
                                    <pre className="mt-1 font-mono text-gray-200 bg-black/30 px-2.5 py-1.5 rounded-md overflow-x-auto">{example.output}</pre>
                                </div>
                                {example.explanation && (
                                    <div>
                                        <span className="text-gray-500 uppercase tracking-wider text-[10px]">Explanation</span>
                                        <p className="mt-1 text-gray-400 leading-relaxed">{example.explanation}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No examples available.</p>
                )}
            </div>

            <div className="p-5 mt-auto">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                    Online · {activeUsers.length}
                </p>
                <div className="space-y-2">
                    {activeUsers.map((u) => (
                        <div key={u.socketId} className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                            <span className="text-sm text-gray-300">{u.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div
            className="w-[3px] shrink-0 cursor-col-resize bg-transparent hover:bg-violet-500/40 active:bg-violet-500/60 transition-colors duration-150"
            onMouseDown={() => setIsResizing(true)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

            <div className="flex items-center gap-2 px-4 py-2 bg-[#111114] border-b border-white/[0.07] shrink-0">

                <select
                    value={interviewLanguage}
                    onChange={(e) => {
                        const language = e.target.value;
                        setInterviewLanguage(language);
                        setCode(languageTemplates[language]);
                        socket.emit("language-change", { roomId, language });
                    }}
                    className="text-xs bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-gray-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer transition-colors"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                </select>

                <div className="flex-1" />


                <button
                    onClick={runCode}
                    disabled={running}
                    className="flex items-center gap-1.5 text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed border border-white/[0.08] text-gray-200 px-4 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 2.5v11L13 8 3 2.5z" />
                    </svg>
                    {running ? "Running…" : "Run"}
                </button>


                <button
                    onClick={submitCode}
                    disabled={running}
                    className="flex items-center gap-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                >
                    Submit
                </button>

                <button
                    onClick={leaveRoom}
                    className="text-xs font-medium text-gray-400 hover:text-red-400 border border-white/[0.07] hover:border-red-500/30 bg-transparent px-3 py-1.5 rounded-lg transition-all"
                >
                    Leave
                </button>
            </div>

            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={interviewLanguage}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                        automaticLayout: true,
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbersMinChars: 3,
                        padding: { top: 12, bottom: 12 },
                        renderLineHighlight: "gutter",
                    }}
                />
            </div>

            <div
                className="h-[3px] w-full cursor-row-resize bg-transparent hover:bg-violet-500/40 active:bg-violet-500/60 shrink-0 transition-colors duration-150"
                onMouseDown={() => setIsConsoleResizing(true)}
            />

            <div
                className="shrink-0 bg-[#0d0d0f] border-t border-white/[0.07] flex flex-col"
                style={{ height: showConsole ? `${consoleHeight}px` : "36px" }}
            >
                <div className="flex items-center gap-3 px-4 h-9 border-b border-white/[0.07] shrink-0">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Output</span>
                    <div className="flex-1" />
                    {output && (
                        <span className={`text-[11px] font-medium ${
                            output.includes("Accepted") ? "text-emerald-400" :
                            output.includes("Wrong")    ? "text-red-400"     : "text-gray-400"
                        }`}>
                            {output.includes("Accepted") ? "✓ Accepted" :
                             output.includes("Wrong")    ? "✗ Wrong Answer" : ""}
                        </span>
                    )}
                    <button
                        onClick={() => setShowConsole(!showConsole)}
                        className="text-gray-500 hover:text-gray-300 transition-colors text-xs px-1"
                    >
                        {showConsole ? "▾" : "▴"}
                    </button>
                </div>

                {showConsole && (
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        <pre className="text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {output || <span className="text-gray-600">Run your code to see output here…</span>}
                        </pre>
                    </div>
                )}
            </div>
        </div>


        {showQuestionLibrary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-[#111114] border border-white/[0.08] rounded-2xl w-[480px] max-h-[70vh] flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                        <h2 className="text-sm font-semibold text-white">Question Library</h2>
                        <button
                            onClick={() => setShowQuestionLibrary(false)}
                            className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
                        >
                            ×
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-3 space-y-1">
                        {questions.map((q) => (
                            <div
                                key={q._id}
                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        q.difficulty === "Easy"   ? "bg-emerald-400" :
                                        q.difficulty === "Medium" ? "bg-amber-400"   : "bg-red-400"
                                    }`} />
                                    <span className="text-sm text-gray-200 truncate">{q.title}</span>
                                </div>
                                <button
                                    onClick={() => selectQuestion(q._id)}
                                    className="shrink-0 ml-3 text-xs font-medium text-violet-400 hover:text-white bg-violet-600/0 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 px-3 py-1 rounded-lg transition-all"
                                >
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
);
}

export default InterviewRoomPage;