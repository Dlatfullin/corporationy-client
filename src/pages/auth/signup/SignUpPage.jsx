import { Link } from "react-router-dom";
import { useState } from "react";
import XSvg from "../../../components/svgs/X";
import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const SignUpPage = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        username: "",
        fullName: "",
        password: "",
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async ({ username, fullName, password }) => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, fullName, password }),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to create account");
                }

                const data = await res.json();
                console.log("Registration response:", data);
                return data;
            } catch (error) {
                console.error("Registration error:", error);
                throw error;
            }
        },
        onSuccess: (data) => {
            toast.success("Account created successfully");
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(formData);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-screen-xl mx-auto flex h-screen px-10 bg-pink-200">
            <div className="flex-1 hidden lg:flex items-center justify-center">
                <XSvg className="lg:w-2/3 fill-pink-900" />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center">
                <form className="lg:w-2/3 mx-auto md:mx-20 flex gap-4 flex-col" onSubmit={handleSubmit}>
                    <XSvg className="w-24 lg:hidden fill-pink-900" />
                    <h1 className="text-4xl font-extrabold text-pink-900">Join today.</h1>
                    <div className="flex gap-4 flex-wrap">
                        <label className="input input-bordered rounded flex items-center gap-2 flex-1 border-pink-400 bg-pink-100">
                            <FaUser className="text-pink-900" />
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
                        <label className="input input-bordered rounded flex items-center gap-2 flex-1 border-pink-400 bg-pink-100">
                            <MdDriveFileRenameOutline className="text-pink-900" />
                            <input
                                type="text"
                                className="grow text-pink-900 placeholder-pink-700"
                                placeholder="Full Name"
                                name="fullName"
                                onChange={handleInputChange}
                                value={formData.fullName}
                                required
                            />
                        </label>
                    </div>
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
                        {isPending ? "Loading..." : "Sign up"}
                    </button>
                </form>
                <div className="flex flex-col lg:w-2/3 gap-2 mt-4">
                    <p className="text-pink-900 text-lg">Already have an account?</p>
                    <Link to="/login">
                        <button className="btn rounded-full bg-pink-500 text-white hover:bg-pink-600 btn-outline w-full">
                            Sign in
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;