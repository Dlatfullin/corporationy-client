import XSvg from "../svgs/X";
import { MdHomeFilled } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            document.cookie.split(";").forEach(cookie => {
                const [name] = cookie.trim().split("=");
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            });
            return Promise.resolve();
        },
        onSuccess: () => {
            queryClient.clear();
            queryClient.setQueryData(["authUser"], null);
            toast.success("Logged out successfully");
            navigate("/login", { replace: true });
        },
        onError: () => {
            toast.error("Logout failed");
        }
    });

    const { data: authUser } = useQuery({ queryKey: ["authUser"] });

    return (
        <div className='md:flex-[2_2_0] w-18 max-w-52'>
            <div className='sticky top-0 left-0 h-screen flex flex-col border-r border-pink-400 w-20 md:w-full bg-pink-200'>
                <Link to='/' className='flex justify-center md:justify-start'>
                    <XSvg className='px-2 w-12 h-12 rounded-full fill-pink-900 hover:bg-pink-300' />
                </Link>
                <ul className='flex flex-col gap-3 mt-4'>
                    <li className='flex justify-center md:justify-start'>
                        <Link
                            to='/'
                            className='flex gap-3 items-center hover:bg-pink-300 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer text-pink-900'
                        >
                            <MdHomeFilled className='w-8 h-8' />
                            <span className='text-lg hidden md:block'>Home</span>
                        </Link>
                    </li>
                    <li className='flex justify-center md:justify-start'>
                        <Link
                            to='/notifications'
                            className='flex gap-3 items-center hover:bg-pink-300 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer text-pink-900'
                        >
                            <IoNotifications className='w-6 h-6' />
                            <span className='text-lg hidden md:block'>Notifications</span>
                        </Link>
                    </li>
                    <li className='flex justify-center md:justify-start'>
                        <Link
                            to={`/profile/${authUser?.username}`}
                            className='flex gap-3 items-center hover:bg-pink-300 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer text-pink-900'
                        >
                            <FaUser className='w-6 h-6' />
                            <span className='text-lg hidden md:block'>Profile</span>
                        </Link>
                    </li>
                </ul>
                {authUser && (
                    <div className='mt-auto mb-10 flex gap-2 items-start transition-all duration-300 hover:bg-pink-300 py-2 px-4 rounded-full'>
                        <div className='avatar hidden md:inline-flex'>
                            <div className='w-8 rounded-full'>
                                <img 
                                    src={authUser?.profileImg || "/avatar-placeholder.png"} 
                                    alt={`${authUser.username}'s profile`}
                                />
                            </div>
                        </div>
                        <div className='flex justify-between flex-1'>
                            <div className='hidden md:block'>
                                <p className='text-pink-900 font-bold text-sm w-20 truncate'>
                                    {authUser?.fullName}
                                </p>
                                <p className='text-pink-700 text-sm'>
                                    @{authUser?.username}
                                </p>
                            </div>
                            <BiLogOut 
                                className='w-5 h-5 cursor-pointer text-pink-900'
                                onClick={() => logout()}
                                title="Logout"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;