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
  <div className="flex h-screen bg-[#0d1117] text-gray-200 font-mono overflow-hidden">
    {showExplorer && (
      <div
        className="flex flex-col bg-[#161b22] border-r border-[#30363d] shrink-0 overflow-hidden"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Explorer
          </span>
          <button
            onClick={() => setShowCreateFile(true)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#30363d] transition-colors text-lg leading-none"
            title="New file"
          >
            +
          </button>
        </div>
        {showCreateFile && (
          <div className="px-3 py-3 bg-[#0d1117] border-b border-[#30363d] space-y-2">
            <input
              type="text"
              placeholder="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#388bfd] transition-colors"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#388bfd] transition-colors"
            >
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
            </select>
            <button
              onClick={createFile}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold py-1.5 rounded transition-colors"
            >
              Create
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-1">
          {files.map((file) => (
            <div
              key={file._id}
              className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${
                selectedFile?._id === file._id
                  ? "bg-[#1f2937] border-l-2 border-[#388bfd] text-white"
                  : "text-gray-400 hover:bg-[#1a2030] hover:text-gray-200 border-l-2 border-transparent"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>

              <span
                onClick={() => openFile(file._id)}
                className="flex-1 text-xs truncate"
              >
                {file.name}
              </span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => renameFile(file)}
                  className="p-0.5 rounded hover:bg-[#30363d] text-gray-500 hover:text-gray-300 transition-colors text-xs"
                  title="Rename"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteFile(file._id)}
                  className="p-0.5 rounded hover:bg-[#30363d] text-gray-500 hover:text-red-400 transition-colors text-xs"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#30363d] px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Online · {activeUsers.length}
          </p>
          <div className="flex flex-col gap-1.5">
            {activeUsers.map((u) => (
              <div key={u.socketId} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#388bfd] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {u.username?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="text-xs text-gray-400 truncate">{u.username}</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    {showExplorer && (
      <div
        className="w-1 cursor-col-resize bg-[#30363d] hover:bg-[#388bfd] transition-colors shrink-0"
        onMouseDown={() => setIsResizing(true)}
      />
    )}
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <button
          onClick={() => setShowExplorer(!showExplorer)}
          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#30363d] transition-colors text-xs"
          title={showExplorer ? "Hide sidebar" : "Show sidebar"}
        >
          {showExplorer ? "◀" : "▶"}
        </button>

        {selectedFile && (
          <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded px-3 py-1">
            <svg className="w-3 h-3 text-[#388bfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-gray-300">{selectedFile.name}</span>
          </div>
        )}

        <div className="flex-1" />
        {selectedFile && (
          <>
            <button
              onClick={saveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-gray-300 border border-[#30363d] hover:border-[#388bfd] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </button>

            <button
              onClick={runCode}
              disabled={running}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                running
                  ? "bg-[#238636]/50 text-gray-400 cursor-not-allowed"
                  : "bg-[#238636] hover:bg-[#2ea043] text-white"
              }`}
            >
              {running ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Running…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                  Run
                </>
              )}
            </button>
          </>
        )}
        <button
          onClick={leaveRoom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors ml-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Leave
        </button>
      </div>
      {selectedFile ? (
        <>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={selectedFile.language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                automaticLayout: true,
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>
          <div
            className="h-1 cursor-row-resize bg-[#30363d] hover:bg-[#388bfd] transition-colors shrink-0 flex items-center justify-center"
            onMouseDown={() => setIsBottomPanelResizing(true)}
          >
            <div className="w-8 h-0.5 rounded-full bg-[#555]" />
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Terminal
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setShowBottomPanel(!showBottomPanel)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-[#30363d] transition-colors text-xs"
              title={showBottomPanel ? "Collapse" : "Expand"}
            >
              {showBottomPanel ? "▼" : "▲"}
            </button>
          </div>
          {showBottomPanel && (
            <div
              className="flex gap-0 bg-[#0d1117] border-t border-[#30363d] shrink-0 overflow-hidden"
              style={{ height: `${bottomPanelHeight}px` }}
            >
              <div className="flex flex-col w-2/5 border-r border-[#30363d]">
                <div className="px-3 py-1.5 border-b border-[#30363d]">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">stdin</span>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input…"
                  className="flex-1 bg-transparent resize-none px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col flex-1">
                <div className="px-3 py-1.5 border-b border-[#30363d] flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">output</span>
                  {output && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </div>
                <pre className="flex-1 overflow-auto px-3 py-2 text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                  {output || (
                    <span className="text-gray-600 italic">No output yet…</span>
                  )}
                </pre>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-semibold">No file open</p>
            <p className="text-xs text-gray-600 mt-1">Select a file from the explorer to start editing</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default ProjectRoomPage;