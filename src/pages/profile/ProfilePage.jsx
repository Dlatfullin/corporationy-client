import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import Posts from "../../components/common/Posts";
import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { formatMemberSinceDate } from "../../utils/date";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useSubscribe = () => {
  const queryClient = useQueryClient();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: async (userId) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please login");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/${userId}/subscribe`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        // Debug response
        const contentLength = res.headers.get("content-length");
        const contentType = res.headers.get("content-type");
        console.log("Subscribe response:", {
          status: res.status,
          contentType,
          contentLength,
        });

        // Handle empty response (e.g., 204 No Content)
        if (res.status === 204 || contentLength === "0" || !contentType) {
          return { success: true };
        }

        // Handle JSON or text response
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          data = { message: await res.text() || "No response body" };
        }

        if (!res.ok) {
          throw new Error(data.error || data.message || `Failed to ${data.subscribed ? "subscribe" : "unsubscribe"} (Status: ${res.status})`);
        }

        return data;
      } catch (error) {
        console.error("Subscribe failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.subscribed ? "Subscribed successfully" : "Unsubscribed successfully");
      queryClient.invalidateQueries(["authUser"]);
      queryClient.invalidateQueries(["userProfile"]);
      queryClient.invalidateQueries(["isSubscribed"]);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { subscribe, isPending };
};

const ProfilePage = () => {
  const { username } = useParams();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const { subscribe, isPending: isSubscribing } = useSubscribe();

  const isMyProfile = authUser?.username === username;

  const { data: user, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please login");

        // Find userId by username
        const usersRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const usersData = await usersRes.json();
        console.log("Users response:", usersData); // Debug

        if (!usersRes.ok) throw new Error(usersData.error || "Failed to fetch users");

        // Handle nested data (e.g., { data: [...] })
        const usersArray = Array.isArray(usersData) ? usersData : usersData.data || [];
        const targetUser = usersArray.find(u => u.username === username);
        if (!targetUser) throw new Error("User not found");

        // Fetch user data
        const userRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${targetUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || "Failed to fetch user");

        // Fetch subscribers (followers)
        const subscribersRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${userData.id}/subscribers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const subscribersData = await subscribersRes.json();
        if (!subscribersRes.ok) throw new Error(subscribersData.error || "Failed to fetch subscribers");

        // Fetch subscriptions (following)
        const subscriptionsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/users/${userData.id}/subscriptions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const subscriptionsData = await subscriptionsRes.json();
        if (!subscriptionsRes.ok) throw new Error(subscriptionsData.error || "Failed to fetch subscriptions");

        return {
          ...userData,
          followers: subscribersData,
          following: subscriptionsData,
          bio: "",
          link: "",
          coverImg: "",
          profileImg: "",
        };
      } catch (error) {
        console.error(error);
        toast.error(error.message);
        throw error;
      }
    },
    enabled: !!authUser,
  });

  const { data: isSubscribed } = useQuery({
    queryKey: ["isSubscribed", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/${user.id}/subscribed`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check subscription status");

      return data.subscribed !== undefined ? data.subscribed : data; // Handle boolean or { subscribed: boolean }
    },
    enabled: !!user && !isMyProfile,
  });

  useEffect(() => {
    refetch();
  }, [username, refetch]);

  // Debug userId for posts
  useEffect(() => {
    if (user?.id) {
      console.log("Fetching posts for userId:", user.id);
    }
  }, [user?.id]);

  return (
    <div className="flex-[4_4_0] border-r border-pink-400 min-h-screen bg-pink-100">
      {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
      {!isLoading && !isRefetching && !user && (
        <p className="text-center text-lg mt-4 text-pink-900">User not found</p>
      )}
      <div className="flex flex-col">
        {!isLoading && !isRefetching && user && (
          <>
            <div className="flex gap-10 px-4 py-2 items-center bg-pink-200">
              <Link to="/">
                <FaArrowLeft className="w-4 h-4 text-pink-900" />
              </Link>
              <div className="flex flex-col">
                <p className="font-bold text-lg text-pink-900">{user.fullName}</p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/cover.jpg"
                className="h-52 w-full object-cover"
                alt="Cover image"
              />
              <div className="avatar absolute left-1/2 -bottom-16 transform -translate-x-1/2">
                <div className="w-32 rounded-full">
                  <img src={isMyProfile ? "/avatars/boy1.png" : "/avatars/girl1.png"} alt="Avatar" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-20 px-4">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-pink-900">{user.fullName}</span>
                <span className="text-sm text-pink-700">@{user.username}</span>
              </div>
              {!isMyProfile && (
                <button
                  className="btn rounded-full bg-pink-500 text-white hover:bg-pink-600 btn-sm px-4"
                  onClick={() => subscribe(user.id)}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? "Processing..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
                </button>
              )}
              <div className="flex gap-2 items-center">
                <IoCalendarOutline className="w-4 h-4 text-pink-700" />
                <span className="text-sm text-pink-700">{formatMemberSinceDate(user.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex gap-1 items-center">
                  <span className="font-bold text-xs text-pink-900">{user.following.length}</span>
                  <span className="text-pink-700 text-xs">Following</span>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="font-bold text-xs text-pink-900">{user.followers.length}</span>
                  <span className="text-pink-700 text-xs">Followers</span>
                </div>
              </div>
            </div>
            <div className="flex w-full border-b border-pink-400 mt-4">
              <div className="flex justify-center flex-1 p-3 bg-pink-200 text-pink-900 font-semibold">
                Posts
              </div>
            </div>
            <Posts userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;