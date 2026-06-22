import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Editor from "@monaco-editor/react";
import "./roompage.css";



function RoomPage() {
    const [showExplorer, setShowExplorer] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [showCreateFile, setShowCreateFile] = useState(false);
    const [fileName, setFileName] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [isResizing, setIsResizing] = useState(false);
    const [code, setCode] = useState("");
    const { roomId } = useParams();


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

    const fetchFiles = async () => {
        try {
            const res = await api.get(`/files/${roomId}`);

            setFiles(res.data.files);
        } catch (err) {
            console.log(err);
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
        } catch (err) {
            console.log(err);
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

            if (selectedFile?._id === fileId) {
                setSelectedFile(null);
            }
        } catch (err) {
            console.log(err);
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
            console.log(err);
        }
    };

    const openFile = async (fileId) => {
        try {
            const res = await api.get(
                `/files/single/${fileId}`
            );

            setSelectedFile(res.data.file);
            setCode(res.data.file.content);
        } catch (err) {
            console.log(err);
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
                        <span
                            onClick={() => openFile(file._id)}
                        >
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
                    <h4>Members</h4>

                    <div>Harsh</div>
                    <div>User2</div>
                </div>
            </div>)}

            {showExplorer && (
                <div
                    className="resize-handle"
                    onMouseDown={() => setIsResizing(true)}
                />
            )}
            

           <div className="editor-section">
                <button onClick={() => setShowExplorer(!showExplorer)}>
                    {showExplorer ? "←" : "→"}
                </button>

                {selectedFile ? (
                    <>
                        <button onClick={saveFile}>
                            Save
                        </button>
                        <Editor
                            height="90vh"
                            language={selectedFile.language}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                        />
                    </>
                ) : (
                    <h2>Select a file</h2>
                )}
            </div>

        </div>
    );
}

export default RoomPage;