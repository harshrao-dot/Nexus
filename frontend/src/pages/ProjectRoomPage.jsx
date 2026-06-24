import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Editor from "@monaco-editor/react";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./roompage.css";



function ProjectRoomPage() {
    const [showExplorer, setShowExplorer] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [showCreateFile, setShowCreateFile] = useState(false);
    const [fileName, setFileName] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isResizing, setIsResizing] = useState(false);
    const [code, setCode] = useState("");
    const [activeUsers, setActiveUsers] = useState([]);
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stdin, setStdin] = useState("");
    const [output, setOutput] = useState("");
    const [running, setRunning] = useState(false);
    const [showBottomPanel, setShowBottomPanel] = useState(true);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(180);
    const [isBottomPanelResizing, setIsBottomPanelResizing] = useState(false);


    useEffect(() => {
        fetchFiles();
    }, [roomId]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const newWidth = Math.min(
                Math.max(e.clientX, 200),
                500
            );

            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {

        if (isBottomPanelResizing) {
            document.body.style.userSelect = "none";
        } else {
            document.body.style.userSelect = "";
        }

        const handleMouseMove = (e) => {
            if (!isBottomPanelResizing) return;
            const newHeight = window.innerHeight - e.clientY - 40;
            setBottomPanelHeight(Math.min(Math.max(newHeight, 100), 400));
        };

        const handleMouseUp = () => setIsBottomPanelResizing(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isBottomPanelResizing]);

    useEffect(() => {
        socket.on("active-users", (users) => {
            setActiveUsers(users);
        });

        return () => {
            socket.off("active-users");
        };
    }, []);

    useEffect(() => {
        const handleFilesUpdated = () => {
            fetchFiles();
        };

        socket.on("files-updated", handleFilesUpdated);

        return () => {
            socket.off("files-updated", handleFilesUpdated);
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        socket.emit("join-room", {
            roomId,
            username: user.username
        });
    }, [roomId, user]);

    useEffect(() => {
        const handleCodeUpdate = ({ fileId, code }) => {

            if (
                selectedFile &&
                selectedFile._id === fileId
            ) {
                setCode(code);
            }

        };

        socket.on("code-update", handleCodeUpdate);

        return () => {
            socket.off("code-update", handleCodeUpdate);
        };
    }, [selectedFile]);

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/files/${roomId}`);

            setFiles(res.data.files);

            if (res.data.files.length > 0) {
                openFile(res.data.files[0]._id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createFile = async () => {
        try {
            let finalName = fileName;

            if (!fileName.includes(".")) {
                const extensions = {
                    javascript: "js",
                    cpp: "cpp",
                    java: "java",
                    python: "py",
                    css: "css",
                    html: "html",
                };

                finalName = `${fileName}.${extensions[language]}`;
            }

            const res = await api.post("/files/create", {roomId, name: finalName, language,});

            fetchFiles();
            socket.emit("files-updated", roomId);
            setShowCreateFile(false);
            setFileName("");
            setLanguage("javascript");

        } catch (err) {
            console.error(err);
        }
    };

    const renameFile = async (file) => {
        let newName = prompt("Enter new file name");

        if (!newName) return;

        if (!newName.includes(".")) {
            const extensions = {
                javascript: "js",
                cpp: "cpp",
                java: "java",
                python: "py",
                css: "css",
                html: "html",
            };

            newName = `${newName}.${extensions[file.language]}`;
        }

        try {
            await api.put(`/files/rename/${file._id}`, {
                name: newName,
            });

            fetchFiles();
            socket.emit("files-updated", roomId);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteFile = async (fileId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this file?"
        );

        if (!confirmDelete) return;

        try {
            await api.delete(`/files/${fileId}`);

            fetchFiles();

            socket.emit("files-updated", roomId);

            if (selectedFile?._id === fileId) {
                setSelectedFile(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const saveFile = async () => {
        if (!selectedFile) return;

        try {
            await api.put(
                `/files/content/${selectedFile._id}`,
                {
                    content: code,
                }
            );

            setSelectedFile({
                ...selectedFile,
                content: code,
            });

            fetchFiles();
        } catch (err) {
            console.error(err);
        }
    };

    const openFile = async (fileId) => {
        try {
            const res = await api.get(
                `/files/single/${fileId}`
            );

            setSelectedFile(res.data.file);
            setCode(res.data.file.content);

            socket.emit(
                "get-file-state",
                fileId,
                (latestCode) => {

                    if (latestCode !== null) {
                        setCode(latestCode);
                    }

                }
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleCodeChange = (value) => {
        const newCode = value || "";

        setCode(newCode);

        if (!selectedFile) return;

        socket.emit("code-change", {
            roomId,
            fileId: selectedFile._id,
            code: newCode
        });
    };

    const leaveRoom = () => {
        socket.emit("leave-room", roomId);
        navigate("/dashboard");
    };

    const runCode = async () => {
        try {
            setRunning(true);
            setOutput("");

            const res = await api.post("/code/run", {
                source_code: code,
                language: language,
                stdin,
            });

            setOutput(res.data.output);
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

            {showExplorer && (
                <div
                    className="file-explorer"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div className="files-header">
                        <h3>Files</h3>

                        <button onClick={() => setShowCreateFile(true)}>
                            +
                        </button>
                    </div>

                    {showCreateFile && (
                        <div>
                            <input
                                type="text"
                                placeholder="File Name"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                            />

                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                            </select>

                            <button onClick={createFile}>
                                Create
                            </button>
                        </div>
                    )}

                    {files.map((file) => (
                        <div
                            key={file._id}
                            className={
                                selectedFile?._id === file._id
                                    ? "file-item active"
                                    : "file-item"
                            }
                        >
                            <span onClick={() => openFile(file._id)}>
                                {file.name}
                            </span>

                            <button onClick={() => renameFile(file)}>
                                ✏️
                            </button>

                            <button onClick={() => deleteFile(file._id)}>
                                🗑️
                            </button>
                        </div>
                    ))}

                    <div className="members-section">
                        <h4>Active Users ({activeUsers.length})</h4>

                        {activeUsers.map((user) => (
                            <div key={user.socketId}>
                                {user.username}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showExplorer && (
                <div
                    className="resize-handle"
                    onMouseDown={() => setIsResizing(true)}
                />
            )}

            <div className="editor-section">
                <button onClick={leaveRoom}>
                    Leave Room
                </button>

                <button onClick={() => setShowExplorer(!showExplorer)}>
                    {showExplorer ? "←" : "→"}
                </button>

                {selectedFile ? (
                    <>
                        <div className="editor-header">
                            <button onClick={saveFile}>
                                Save
                            </button>
                            <button onClick={runCode} disabled={running}>
                                {running ? "Running..." : "Run"}
                            </button>
                        </div>

                        <div style={{ flex: 1, minHeight: 0 }}>
                            <Editor
                                height="100%"
                                language={selectedFile.language}
                                value={code}
                                onChange={handleCodeChange}
                                options={{ automaticLayout: true }}
                            />
                        </div>

                        <div
                            className="console-resize-handle"
                            onMouseDown={() => setIsBottomPanelResizing(true)}
                        />

                        <div className="console-header">
                            <button onClick={() => setShowBottomPanel(!showBottomPanel)}>
                                {showBottomPanel ? "▼" : "▲"}
                            </button>
                        </div>

                        {showBottomPanel && (
                            <div className="execution-panel" style={{ height: `${bottomPanelHeight}px` }}>
                                <div>
                                    <h4>Input</h4>
                                    <textarea
                                        value={stdin}
                                        onChange={(e) => setStdin(e.target.value)}
                                        placeholder="Enter input..."
                                        rows={5}
                                    />
                                </div>

                                <div>
                                    <h4>Output</h4>
                                    <pre>{output}</pre>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <h2>Select a file</h2>
                )}
            </div>
        </div>
    );
}

export default ProjectRoomPage;