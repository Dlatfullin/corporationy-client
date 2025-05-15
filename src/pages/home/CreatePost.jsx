import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const CreatePost = () => {
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [img, setImg] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef(null);

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();

    const { mutate: createPost, isPending: isCreating } = useMutation({
        mutationFn: async ({ title, text }) => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Please login to create a post");

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/create`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title, content: text }),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || `Request failed with status ${res.status}`);
                }

                return await res.json();
            } catch (error) {
                console.error("Post creation failed:", error);
                throw new Error(error.message || "Network error. Please check your connection.");
            }
        },
        onSuccess: (newPost) => {
            if (img) {
                addImageToPost({ postId: newPost.id, img });
            } else {
                setTitle("");
                setText("");
                setImg(null);
                toast.success("Post created successfully");
                queryClient.invalidateQueries({ queryKey: ["posts"] });
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const { mutate: addImageToPost, isPending: isAddingImage } = useMutation({
        mutationFn: async ({ postId, img }) => {
            try {
                setIsUploading(true);
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Please login to upload an image");

                const formData = new FormData();
                const blob = await fetch(img).then((r) => r.blob());
                formData.append("file", blob, "post-image.jpg");

                for (let [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${postId}/add`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                console.log("Image upload status:", res.status);
                const responseText = await res.text();
                console.log("Image upload response text:", responseText);

                if (!res.ok) {
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        throw new Error(responseText || `Request failed with status ${res.status}`);
                    }
                    throw new Error(
                        errorData.message ||
                        errorData.error ||
                        `Request failed with status ${res.status}`
                    );
                }

                try {
                    return JSON.parse(responseText);
                } catch (e) {
                    console.warn("Response is not JSON, assuming success:", responseText);
                    return { success: true };
                }
            } catch (error) {
                console.error("Image upload failed:", error);
                throw new Error(error.message || "Failed to upload image.");
            } finally {
                setIsUploading(false);
            }
        },
        onSuccess: () => {
            setTitle("");
            setText("");
            setImg(null);
            toast.success("Post with image created successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            return toast.error("Title is required");
        }
        if (!text.trim() && !img) {
            return toast.error("Post content cannot be empty");
        }
        createPost({ title, text });
    };

    const handleImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }
            if (!file.type.match("image.*")) {
                toast.error("Please select an image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setImg(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex p-4 items-start gap-4 border-b border-pink-400 bg-pink-200">
            <div className="avatar">
                <div className="w-8 rounded-full">
                    <img
                        src={authUser?.profileImg || "/avatar-placeholder.png"}
                        alt="User avatar"
                    />
                </div>
            </div>
            <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="input w-full p-0 text-lg border-none focus:outline-none bg-pink-200 text-pink-900 font-semibold"
                    placeholder="Post title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isCreating || isAddingImage || isUploading}
                />
                <textarea
                    className="textarea w-full p-0 text-lg resize-none border-none focus:outline-none bg-pink-200 text-pink-900 placeholder-pink-700 font-semibold rounded-none"
                    placeholder="What is happening?!"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isCreating || isAddingImage || isUploading}
                />
                {img && (
                    <div className="relative w-72 mx-auto">
                        <IoCloseSharp
                            className="absolute top-0 right-0 text-white bg-pink-900 rounded-full w-5 h-5 cursor-pointer "
                            onClick={() => {
                                setImg(null);
                                imgRef.current.value = null;
                            }}
                        />
                        <img
                            src={img}
                            className="w-full mx-auto h-72 object-contain rounded"
                            alt="Post preview"
                        />
                    </div>
                )}
                <div className="flex justify-between border-t py-2 border-t-pink-400">
                    <div className="flex gap-1 items-center">
                        <CiImageOn
                            className="fill-pink-500 w-6 h-6 cursor-pointer"
                            onClick={() => imgRef.current.click()}
                            title="Add image"
                        />
                        <BsEmojiSmileFill
                            className="fill-pink-500 w-5 h-5 cursor-pointer"
                            title="Add emoji"
                        />
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={imgRef}
                        onChange={handleImgChange}
                        disabled={isCreating || isAddingImage || isUploading}
                    />
                    <button
                        className="btn rounded-full bg-pink-500 text-white hover:bg-pink-600 btn-sm px-4 border-none"
                        type="submit"
                        disabled={(!title.trim() || (!text.trim() && !img)) || isCreating || isAddingImage || isUploading}
                    >
                        {isCreating || isAddingImage || isUploading ? "Posting..." : "Post"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;