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
        examples: "",
        visibleTestCases: "",
        hiddenTestCases: "",
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

                examples: JSON.parse(form.examples || "[]"),
                visibleTestCases: JSON.parse(form.visibleTestCases || "[]"),
                hiddenTestCases: JSON.parse(form.hiddenTestCases || "[]"),
            };
            console.log(payload);

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
                examples: "",
                visibleTestCases: "",
                hiddenTestCases: "",
            });

            setEditingId(null);
            fetchQuestions();
        } catch (err) {
            console.log(err.response?.data);
            console.log(err.response?.data?.message);
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
            examples: JSON.stringify(question.examples || [], null, 2),
            visibleTestCases: JSON.stringify(question.visibleTestCases || [], null, 2),
            hiddenTestCases: JSON.stringify(question.hiddenTestCases || [], null, 2),
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
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
    <div className="max-w-7xl mx-auto px-8 py-10">

      <div className="mb-10">
        <h1 className="text-4xl font-bold">Question Library</h1>
        <p className="mt-2 text-slate-400">
          Create, edit and manage coding interview questions.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-8 mb-10">

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Title
            </label>

            <input
              placeholder="Question Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Difficulty
            </label>

            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({
                  ...form,
                  difficulty: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Statement
            </label>

            <textarea
              rows={6}
              placeholder="Problem Statement"
              value={form.statement}
              onChange={(e) =>
                setForm({
                  ...form,
                  statement: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Constraints
            </label>

            <textarea
              rows={5}
              placeholder="One per line"
              value={form.constraints}
              onChange={(e) =>
                setForm({
                  ...form,
                  constraints: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Tags
            </label>

            <input
              placeholder="arrays, dp, graphs"
              value={form.tags}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Examples (JSON)
            </label>

            <textarea
              rows={7}
              value={form.examples}
              onChange={(e) =>
                setForm({
                  ...form,
                  examples: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Visible Test Cases (JSON)
            </label>

            <textarea
              rows={7}
              value={form.visibleTestCases}
              onChange={(e) =>
                setForm({
                  ...form,
                  visibleTestCases: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Hidden Test Cases (JSON)
            </label>

            <textarea
              rows={7}
              value={form.hiddenTestCases}
              onChange={(e) =>
                setForm({
                  ...form,
                  hiddenTestCases: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-mono text-sm text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        <button
          onClick={handleSubmit}
          className="mt-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition px-8 py-3 font-semibold shadow-lg shadow-indigo-600/30"
        >
          {editingId ? "Update Question" : "Add Question"}
        </button>

      </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-8">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">
            Questions
          </h2>

          <span className="rounded-full bg-indigo-600/20 px-4 py-2 text-sm text-indigo-300">
            {questions.length} Questions
          </span>
        </div>

        {questions.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">

            <div className="text-6xl mb-4">
              📚
            </div>

            <h3 className="text-2xl font-semibold">
              No Questions Yet
            </h3>

            <p className="mt-2 text-slate-400">
              Create your first coding interview question.
            </p>

          </div>

        ) : (

          <div className="grid gap-6 lg:grid-cols-2">

            {questions.map((question) => (

              <div
                key={question._id}
                className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 transition hover:border-indigo-500 hover:-translate-y-1"
              >

                <div className="flex items-start justify-between">

                  <div>

                    <h3 className="text-2xl font-semibold">
                      {question.title}
                    </h3>

                    <div className="mt-3 flex items-center gap-3">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          question.difficulty === "Easy"
                            ? "bg-green-500/20 text-green-300"
                            : question.difficulty === "Medium"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {question.difficulty}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="mt-6 flex gap-4">

                  <button
                    onClick={() => handleEdit(question)}
                    className="flex-1 rounded-xl bg-indigo-600 py-3 font-medium transition hover:bg-indigo-500"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(question._id)}
                    className="flex-1 rounded-xl bg-red-600 py-3 font-medium transition hover:bg-red-500"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  </div>
);
}