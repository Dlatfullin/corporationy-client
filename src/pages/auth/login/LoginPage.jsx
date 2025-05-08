import { useState } from "react";
import { Link } from "react-router-dom";
import XSvg from "../../../components/svgs/X";
import { MdOutlineMail } from "react-icons/md";
import { MdPassword } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const queryClient = useQueryClient();

    const { mutate: loginMutation, isPending } = useMutation({
        mutationFn: async ({ username, password }) => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, { 
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to login");
                }

                const data = await res.json();
                console.log("Login response:", data);
                if (data.token) {
                    localStorage.setItem("token", data.token); 
                }
                return data;
            } catch (error) {
                console.error("Login error:", error);
                throw error;
            }
        },
        onSuccess: () => {
            toast.success("User logged in successfully");
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        loginMutation(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-screen-xl mx-auto flex h-screen bg-pink-200">
            <div className="flex-1 hidden lg:flex items-center justify-center">
                <XSvg className="lg:w-2/3 fill-pink-900" />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
                <form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
                    <XSvg className="w-24 lg:hidden fill-pink-900" />
                    <h1 className="text-4xl font-extrabold text-pink-900">Let's go.</h1>
                    <label className="input input-bordered rounded flex items-center gap-2 border-pink-400 bg-pink-100">
                        <MdOutlineMail className="text-pink-900" />
                        <input
                            type="text"
                            className="grow text-pink-900 placeholder-pink-700"
                            placeholder="Username"
                            name="username"
                            onChange={handleInputChange}
                            value={formData.username}
                            required
                        />
                    </label>
                    <label className="input input-bordered rounded flex items-center gap-2 border-pink-400 bg-pink-100">
                        <MdPassword className="text-pink-900" />
                        <input
                            type="password"
                            className="grow text-pink-900 placeholder-pink-700"
                            placeholder="Password"
                            name="password"
                            onChange={handleInputChange}
                            value={formData.password}
                            required
                        />
                    </label>
                    <button className="btn rounded-full bg-pink-500 text-white hover:bg-pink-600">
                        {isPending ? "Loading..." : "Login"}
                    </button>
                </form>
                <div className="flex flex-col gap-2 mt-4">
                    <p className="text-pink-900 text-lg">Don't have an account?</p>
                    <Link to="/signup">
                        <button className="btn rounded-full bg-pink-500 text-white hover:bg-pink-600 btn-outline w-full">
                            Sign up
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
