import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post(
                "/auth/login",
                formData
            );

            login(
                response.data.token,
                response.data.user
            );

            navigate("/dashboard");
        } catch (err) {
            console.error(err);
        }
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center px-6 overflow-hidden">

        <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -top-10 -left-20" />
        <div className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl bottom-0 right-0" />

        <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6"
        >

            <div className="text-center">
                <h1 className="text-4xl font-bold text-white">
                    Nexus
                </h1>

                <p className="mt-2 text-slate-400">
                    Collaborative Coding Platform
                </p>
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                    Email
                </label>

                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="youremail@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
            </div>

            <div>
                <label className="block mb-2 text-sm font-medium text-slate-300">
                    Password
                </label>

                <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
            </div>

            <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 transition py-3 font-semibold text-white shadow-lg shadow-indigo-600/30"
            >
                Login
            </button>
        </form>
    </div>
);
}