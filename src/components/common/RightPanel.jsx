import { Link } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { USERS_FOR_RIGHT_PANEL } from "../../utils/db/dummy";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const RightPanel = () => {
    // Use the dummy data directly
    const suggestedUsers = USERS_FOR_RIGHT_PANEL;
    const isLoading = false; // Since we're using local data

    const { follow, isPending } = useFollow();

    if (suggestedUsers?.length === 0) return <div className="md:w-64 w-0"></div>

    return (
        <div className='hidden lg:block my-4 mx-2 bg-pink-200'>
        </div>
    );
};
export default RightPanel;
