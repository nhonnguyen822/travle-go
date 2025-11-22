import {Navigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";



const ProtectedRoute = ({children, role}) => {
    const {user, loading, isAuthenticated} = useAuth();

    if (loading) {
        return <div>Đang tải...</div>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace/>;
    }

    if (role && user.role !== role) {
        return <Navigate to="/" replace/>; // không đủ quyền
    }

    return children;
};

export default ProtectedRoute;
