import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

axios.defaults.withCredentials = true;

function Login() {
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ loginError, setLoginError ] = useState('');
    const navigate = useNavigate();
    const { fetchUser } = useAuth();
    // const [ searchParams ] = useSearchParams();

    const handleLogin = async () => {
        if (!username || !password) {
            setLoginError('All fields required');
        }
        else {
            await axios.post('/api/login', { username, password })
            .then(async () => {
                await fetchUser();
                // const next = searchParams.get('next') || `/user/${username}`;
                // navigate(next, { replace: true });
                navigate(`/user/${username}`);
            })
            .catch(err => {
                console.error(err);
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