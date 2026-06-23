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
        <form onSubmit={handleSubmit}>
        <h1>Login</h1>

        <div>
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange}/>
        </div>

        <div>
            <label>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange}/>
        </div>

        <button type="submit">Login</button>
        </form>
    );
}