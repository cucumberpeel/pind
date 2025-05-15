import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [ user, setUser ] = useState(null);

    const fetchUser = () => {
        axios.get('http://localhost:8080/api/me', { withCredentials: true })
        .then(res => setUser(res?.data?.user))
        .catch(() => setUser(null))
    };

    const logout = async () => {
        try {
            await axios.get('http://localhost:8080/api/logout', { withCredentials: true });
            setUser(null);
        }
        catch (err) {
            console.error('Logout failed', err);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, fetchUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);