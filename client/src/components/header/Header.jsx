import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    }

    return (
    <header id="app-header">
        <a href="/">Pint</a>
        {user ? (
            <nav id="user-nav">
                <ul className="nav-list">
                    <li><a href="/pin">Create</a></li>
                    <li><a href="/updates">Updates</a></li>
                    <li><a href={`/user/${user?.username}`}>Profile</a></li>
                    <li><button onClick={handleLogout}>Log out</button></li>
                </ul>
            </nav>
        ) : (
            <nav id="guest-nav">
                <ul className="nav-list">
                    <li><a href="/signup">Sign up</a></li>
                    <li><a href="/login">Log in</a></li>
                </ul>
            </nav>
        )}
    </header>
    );
};

export default Header;