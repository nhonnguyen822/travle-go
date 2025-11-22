
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import Preloader from "../component/ui/Preloader";
import {useAuth} from "../context/AuthContext";


const OAuth2Success = () => {
    const { fetchUser, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            await fetchUser(); // load lại customer từ cookie HttpOnly
            if (user?.role?.name === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/");
            }
        };
        init();
    }, []);

    return <Preloader />;
};

export default OAuth2Success;