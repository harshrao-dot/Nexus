import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
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
                "/auth/signup",
                formData
            );

            login(response.data.token);

            navigate("/dashboard");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
            </div>

            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Join Nexus and start collaborating
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username || ""}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.99]"
                    >
                        Create Account
                    </button>

                    <p className="text-center text-sm text-slate-400">
                        Already have an account?{" "}
                        <span className="font-medium text-indigo-400 hover:text-indigo-300">
                            Login
                        </span>
                    </p>
                </div>
            </form>
        </div>
    );
}