import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";


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
    <div className="flex items-center justify-center min-h-screen px-6 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">

        <div className="absolute rounded-full w-96 h-96 bg-indigo-600/20 blur-3xl -top-10 -left-20" />
        <div className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-cyan-500/20 blur-3xl" />

        <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md p-8 space-y-6 border shadow-2xl bg-slate-900/80 backdrop-blur-xl border-slate-800 rounded-3xl"
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
                    className="w-full px-4 py-3 text-white transition border outline-none rounded-xl border-slate-700 bg-slate-800 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
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
                    className="w-full px-4 py-3 text-white transition border outline-none rounded-xl border-slate-700 bg-slate-800 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                />
            </div>

            <button
                type="submit"
                className="w-full py-3 font-semibold text-white transition bg-indigo-600 shadow-lg rounded-xl hover:bg-indigo-500 shadow-indigo-600/30"
            >
                Login
            </button>
            <p className="mt-4 text-center text-gray-400">
                Don't have an account?{" "}
                <Link
                    to="/signup"
                    className="text-violet-500 hover:underline"
                >
                    Sign Up
                </Link>
            </p>
        </form>
    </div>
);
}