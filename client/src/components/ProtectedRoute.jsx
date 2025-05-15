import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;

function ProtectedRoute() {
    const { user } = useAuth();
    const location = useLocation();

    return user ? (
        <Outlet />
    ) : (
        <Navigate to="/login" />
        // <Navigate to={`/login?next=${location.pathname}`} />
    );
};
export default ProtectedRoute;