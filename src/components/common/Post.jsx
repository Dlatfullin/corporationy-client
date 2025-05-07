import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
    const [comment, setComment] = useState("");
    const { data: authUser, isLoading: authLoading } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();

    const { data: comments, isLoading: commentsLoading } = useQuery({
        queryKey: ["comments", post.id],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${post.id}/comments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to fetch comments");
            }

            return await res.json();
        },
        enabled: !!authUser, // Выполняется только после загрузки authUser
    });

    // Если authUser ещё загружается, показываем спиннер
    if (authLoading || !authUser) {
        return <LoadingSpinner size="md" />;
    }

    const [isLiked, setIsLiked] = useState(post.isLiked || false); // Локальное состояние для отслеживания лайка
    const isMyPost = authUser.username === post.author; // Сравниваем по имени автора
    const formattedDate = formatPostDate(post.createdAt);

    const { mutate: deletePost, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");
    
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${post.id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
    

                if (!res.ok) {
                    
                    const errorText = await res.text();
                    
                
                    try {
                        const errorJson = errorText ? JSON.parse(errorText) : null;
                        throw new Error(errorJson?.message || errorText || `HTTP error! status: ${res.status}`);
                    } catch {
                        throw new Error(errorText || `HTTP error! status: ${res.status}`);
                    }
                }
    

                try {
                    const text = await res.text();
                    return text ? JSON.parse(text) : { success: true };
                } catch {
                    return { success: true };
                }
            } catch (error) {
                console.error("Delete post error:", error);
                throw new Error(error.message || "Failed to delete post");
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            const previousPosts = queryClient.getQueryData(["posts"]) || [];
            

            queryClient.setQueryData(["posts"], (old) => 
                old ? old.filter((p) => p.id !== post.id) : []
            );
    
            return { previousPosts };
        },
        onError: (error, _, context) => {
            console.error("Deletion failed:", error);
            

            if (context?.previousPosts) {
                queryClient.setQueryData(["posts"], context.previousPosts);
            }
    

            const errorMessage = error.message.includes("404") 
                ? "Post was already deleted or doesn't exist"
                : error.message.includes("401")
                ? "You don't have permission to delete this post"
                : `Deletion failed: ${error.message}`;
    
            toast.error(errorMessage);
        },
        onSuccess: () => {
            toast.success("Post deleted successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const { mutate: likePost, isPending: isLiking } = useMutation({
        mutationFn: async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No authentication token found");
    
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${post.id}/like`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
    
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to like post");
                }
    
              
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return await res.json();
                }
                return {}; 
            } catch (error) {
                console.error("Like post error:", error.message);
                throw error;
            }
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            const previousPosts = queryClient.getQueryData(["posts"]);
    
            queryClient.setQueryData(["posts"], (oldData) => {
                if (!oldData) return [];
                return oldData.map((p) =>
                    p.id === post.id 
                        ? { 
                            ...p, 
                            likes: isLiked ? p.likes - 1 : p.likes + 1,
                            isLiked: !isLiked
                        } 
                        : p
                );
            });
    
            setIsLiked(!isLiked);
            return { previousPosts };
        },
        onError: (error, variables, context) => {
            queryClient.setQueryData(["posts"], context.previousPosts);
            setIsLiked(!isLiked);
            toast.error(error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ 
                queryKey: ["posts", post.id],
                exact: true
            });
        }
    });

    const { mutate: commentPost, isPending: isCommenting } = useMutation({
        mutationFn: async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No authentication token found");
    
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${post.id}/comments`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ postId: post.id, content: comment }),
                });
    
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to comment post");
                }
    
                return await res.json(); 
            } catch (error) {
                console.error("Comment post error:", error.message);
                throw error;
            }
        },
        onMutate: async () => {

            await queryClient.cancelQueries({ queryKey: ["comments", post.id] });
            await queryClient.cancelQueries({ queryKey: ["posts"] });

            const previousComments = queryClient.getQueryData(["comments", post.id]);
            const previousPosts = queryClient.getQueryData(["posts"]);
    

            const tempId = Date.now().toString();
    

            queryClient.setQueryData(["comments", post.id], (old) => [
                ...(old || []),
                {
                    id: tempId,
                    content: comment,
                    author: authUser.username,
                    createdAt: new Date().toISOString(),
                    isOptimistic: true, 
                },
            ]);
    
     
            queryClient.setQueryData(["posts"], (oldData) => {
                if (!oldData) return [];
                return oldData.map((p) =>
                    p.id === post.id
                        ? {
                            ...p,
                            comments: [...(p.comments || []), { id: tempId }],
                            commentsCount: (p.commentsCount || 0) + 1,
                        }
                        : p
                );
            });
    
            return { previousComments, previousPosts, tempId };
        },
        onError: (error, _, context) => {
            
            queryClient.setQueryData(["posts", post.id], (old) => ({
                ...old,
                likes: context.previousLikes,
                isLiked: context.previousIsLiked
            }));
            
            if (error.message !== "Cancelled") {
                toast.error(error.message);
            }
        },
        onSettled: () => {
            
            queryClient.invalidateQueries({ 
                queryKey: ["posts", post.id],
                exact: true
            });
        }
        
    });

    const handleDeletePost = () => {
        deletePost();
    };

    const handlePostComment = (e) => {
        e.preventDefault();
        if (isCommenting) return;
        commentPost();
    };

    const handleLikePost = () => {
        if (isLiking) return;
        likePost();
    };

    return (
        <div className="flex gap-2 items-start p-4 border-b border-gray-700">
            <div className="avatar">
                <Link to={`/profile/${post.author}`} className="w-8 rounded-full overflow-hidden">
                    <img src={post.profileImg || "/avatar-placeholder.png"} /> 
                </Link>
            </div>
            <div className="flex flex-col flex-1">
                <div className="flex gap-2 items-center">
                    <Link to={`/profile/${post.author}`} className="font-bold">
                        {post.author} 
                    </Link>
                    <span className="text-gray-700 flex gap-1 text-sm">
                        <Link to={`/profile/${post.author}`}>@{post.author}</Link>
                        <span>·</span>
                        <span>{formattedDate}</span>
                    </span>
                    {isMyPost && (
                        <span className="flex justify-end flex-1">
                            {!isDeleting && (
                                <FaTrash
                                    className="cursor-pointer hover:text-red-500"
                                    onClick={handleDeletePost}
                                />
                            )}
                            {isDeleting && <LoadingSpinner size="sm" />}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-3 overflow-hidden">
                    <span>{post.content}</span> 
                    {post.img && (
                        <img
                            src={post.img}
                            className="h-80 object-contain rounded-lg border border-gray-700"
                            alt=""
                        />
                    )}
                </div>
                <div className="flex justify-between mt-3">
                    <div className="flex gap-4 items-center w-2/3 justify-between">
                        <div
                            className="flex gap-1 items-center cursor-pointer group"
                            onClick={() => document.getElementById("comments_modal" + post.id).showModal()}
                        >
                            <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                            <span className="text-sm text-slate-500 group-hover:text-sky-400">
                                {commentsLoading ? "..." : comments?.length || 0}
                            </span>
                        </div>
                        <dialog id={`comments_modal${post.id}`} className="modal border-none outline-none">
                            <div className="modal-box rounded border border-gray-600">
                                <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                                <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                                    {commentsLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : !comments || comments.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No comments yet 🤔 Be the first one 😉
                                        </p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="flex gap-2 items-start">
                                                <div className="avatar">
                                                    <div className="w-8 rounded-full">
                                                        <img src="/avatar-placeholder.png" />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold">{comment.author}</span>
                                                        <span className="text-gray-700 text-sm">
                                                            @{comment.author}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm">{comment.content}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form
                                    className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                                    onSubmit={handlePostComment}
                                >
                                    <textarea
                                        className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                                        placeholder="Add a comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                                        {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                                    </button>
                                </form>
                            </div>
                            <form method="dialog" className="modal-backdrop">
                                <button className="outline-none">close</button>
                            </form>
                        </dialog>
                        <div className="flex gap-1 items-center group cursor-pointer">
                            <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
                            <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
                        </div>
                        <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
                            {isLiking && <LoadingSpinner size="sm" />}
                            {!isLiked && !isLiking && (
                                <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                            )}
                            {isLiked && !isLiking && (
                                <FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500" />
                            )}
                            
                            <span className={`text-sm group-hover:text-pink-500 ${isLiked ? "text-pink-500" : "text-slate-500"}`}>
    {isLiking ? post.likes : (isLiked ? post.likes + 1 : post.likes)}
</span>
                        </div>
                    </div>
                    <div className="flex w-1/3 justify-end gap-2 items-center">
                        <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Post;