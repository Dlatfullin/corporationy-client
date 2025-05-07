import { useState } from "react";
import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
    const [feedType, setFeedType] = useState("forYou");

    return (
        <>
            <div className='flex-[4_4_0] mr-auto border-r border-pink-400 min-h-screen bg-pink-200'>
                {/* Header */}
                <div className='flex w-full border-b border-pink-400'>
                    <div
                        className={
                            "flex justify-center flex-1 p-3 hover:bg-pink-300 transition duration-300 cursor-pointer relative text-pink-900"
                        }
                        onClick={() => setFeedType("forYou")}
                    >
                        For you
                        {feedType === "forYou" && (
                            <div className='absolute bottom-0 w-10 h-1 rounded-full bg-pink-500'></div>
                        )}
                    </div>
                    <div
                        className='flex justify-center flex-1 p-3 hover:bg-pink-300 transition duration-300 cursor-pointer relative text-pink-900'
                        onClick={() => setFeedType("following")}
                    >
                        Following
                        {feedType === "following" && (
                            <div className='absolute bottom-0 w-10 h-1 rounded-full bg-pink-500'></div>
                        )}
                    </div>
                </div>

                {/* CREATE POST INPUT */}
                <CreatePost />

                {/* POSTS */}
                <Posts feedType={feedType} />
            </div>
        </>
    );
};
export default HomePage;