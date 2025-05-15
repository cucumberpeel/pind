import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

axios.defaults.withCredentials = true;

function Login() {
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ loginError, setLoginError ] = useState('');
    const navigate = useNavigate();
    const { fetchUser } = useAuth();

    const handleLogin = () => {
        if (!username || !password) {
            setLoginError('All fields required');
        }
        else {
            axios.post('http://localhost:8080/api/login', { username, password })
            .then(res => {
                fetchUser();
                navigate('/');
            })
            .catch(() => {
                setLoginError('Invalid username or password. Please try again.');
                setUsername('');
                setPassword('');
            })
        }
    };

    const handleUsernameChange = (e) => {
        setUsername(e?.target?.value);
        if (loginError) setLoginError('');
    }

    const handlePasswordChange = (e) => {
        setPassword(e?.target?.value);
        if (loginError) setLoginError('');
    }

    return (
        <div className="auth-form">
            <h2>Welcome Back</h2>
            { loginError && (
                <div className="error">{loginError}</div>
            )}
            <input value={username} placeholder="Username" onChange={handleUsernameChange} />
            <input type="password" value={password} placeholder="Password" onChange={handlePasswordChange} />
            <button onClick={handleLogin}>Log in</button>
        </div>
    )
}

export default Login;