import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const Posts = ({ feedType, username, userId }) => {
    const getPostEndpoint = () => {
                return `${import.meta.env.VITE_API_URL}/api/v1/posts`;
    };

    const POST_ENDPOINT = getPostEndpoint();

    // Запрос для получения постов
    const { data: posts, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["posts", feedType, username, userId],
        queryFn: async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
      throw new Error("No authentication token found");
    }

                const res = await fetch(`${POST_ENDPOINT}?page=0&size=20`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(errorText || "Failed to fetch posts");
                }

                const data = await res.json();
                console.log("Posts data:", data);
                return data;
            } catch (error) {
                console.error("Fetch posts error:", error.message);
                toast.error(error.message);
                throw error;
            }
        },
        retry: false,
    });

    // Запросы для получения списка imageId для каждого поста
    const imageListQueries = useQueries({
        queries: (posts || []).map((post) => ({
            queryKey: ["imageList", post.id],
            queryFn: async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        throw new Error("No authentication token found");
                    }

                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/${post.id}/images`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(errorText || "Failed to fetch image list");
                    }

                    const data = await res.json();
                    console.log(`Image list for post ${post.id}:`, data);
                    return data; // Массив объектов с imageId
                } catch (error) {
                    console.error(`Fetch image list for post ${post.id} error:`, error.message);
                    return []; // Возвращаем пустой массив в случае ошибки
                }
            },
            enabled: !!posts,
        })),
    });

    // Извлекаем все imageId из результатов
    const imageIds = imageListQueries
        .map((query) => query.data || [])
        .flat()
        .map((image) => image.imageId)
        .filter(Boolean);

    // Запросы для получения самих изображений по imageId
    const imageQueries = useQueries({
        queries: imageIds.map((imageId) => ({
            queryKey: ["image", imageId],
            queryFn: async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) {
                        throw new Error("No authentication token found");
                    }

                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/posts/image/${imageId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(errorText || "Failed to fetch image");
                    }

                    const blob = await res.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    console.log(`Image URL for imageId ${imageId}:`, imageUrl);
                    return { imageId, imageUrl };
                } catch (error) {
                    console.error(`Fetch image ${imageId} error:`, error.message);
                    return null;
                }
            },
            enabled: !!imageIds.length,
        })),
    });

    // Объединяем посты с их изображениями
    const postsWithImages = (posts || []).map((post, index) => {
        const imageList = imageListQueries[index]?.data || [];
        const imageUrls = imageList
            .map((image) => {
                const imageQuery = imageQueries.find(
                    (query) => query.data?.imageId === image.imageId
                );
                return imageQuery?.data?.imageUrl || null;
            })
            .filter(Boolean);

        return {
            ...post,
            img: imageUrls.length > 0 ? imageUrls[0] : null, // Первое изображение
            images: imageUrls, // Все изображения (если нужно отображать несколько)
        };
    });

    useEffect(() => {
        refetch();
    }, [feedType, username, userId, refetch]);

    return (
        <>
            {(isLoading || isRefetching) && (
                <div className="flex flex-col justify-center">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}
            {!isLoading && !isRefetching && posts?.length === 0 && (
                <p className="text-center my-4">No posts in this tab. Switch 👻</p>
            )}
            {!isLoading && !isRefetching && posts && (
                <div>
                    {postsWithImages.map((post) => (
                        <Post key={post.id} post={post} />
                    ))}
                </div>
            )}
        </>
    );
};

export default Posts;