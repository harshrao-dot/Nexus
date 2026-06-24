import { useEffect, useState } from "react";
import api from "../services/api";

export default function QuestionLibrary() {
    const [questions, setQuestions] = useState([]);

    const [form, setForm] = useState({
        title: "",
        statement: "",
        difficulty: "Easy",
        constraints: "",
        tags: "",
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await api.get("/questions");
            setQuestions(res.data.questions);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                title: form.title,
                statement: form.statement,
                difficulty: form.difficulty,
                constraints: form.constraints
                    .split("\n")
                    .filter(Boolean),
                tags: form.tags
                    .split(",")
                    .map((t) => t.trim()),
            };

            if (editingId) {
                await api.put(`/questions/${editingId}`, payload);
            } else {
                await api.post("/questions/create", payload);
            }

            setForm({
                title: "",
                statement: "",
                difficulty: "Easy",
                constraints: "",
                tags: "",
            });

            setEditingId(null);
            fetchQuestions();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (question) => {
        setEditingId(question._id);

        setForm({
            title: question.title,
            statement: question.statement,
            difficulty: question.difficulty,
            constraints: question.constraints?.join("\n") || "",
            tags: question.tags?.join(",") || "",
        });
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/questions/${id}`);
            fetchQuestions();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>Question Library</h1>

            <input
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                }
            />

            <br /><br />

            <textarea
                placeholder="Statement"
                value={form.statement}
                onChange={(e) =>
                    setForm({ ...form, statement: e.target.value })
                }
            />

            <br /><br />

            <select
                value={form.difficulty}
                onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value })
                }
            >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
            </select>

            <br /><br />

            <textarea
                placeholder="Constraints (one per line)"
                value={form.constraints}
                onChange={(e) =>
                    setForm({ ...form, constraints: e.target.value })
                }
            />

            <br /><br />

            <input
                placeholder="tags comma separated"
                value={form.tags}
                onChange={(e) =>
                    setForm({ ...form, tags: e.target.value })
                }
            />

            <br /><br />

            <button onClick={handleSubmit}>
                {editingId ? "Update" : "Add Question"}
            </button>

            <hr />

            {questions.map((question) => (
                <div key={question._id}>
                    <h3>{question.title}</h3>

                    <p>{question.difficulty}</p>

                    <button
                        onClick={() => handleEdit(question)}
                    >
                        Edit
                    </button>

                    <button
                        onClick={() =>
                            handleDelete(question._id)
                        }
                    >
                        Delete
                    </button>

                    <hr />
                </div>
            ))}
        </div>
    );
}