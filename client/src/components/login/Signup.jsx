import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true;

function Signup() {
    const [ username, setUsername ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ signupError, setSignupError ] = useState('');
    const navigate = useNavigate();

    const handleSignup = () => {
        if (!username || !email || !password) {
            setSignupError('All fields required');
        }
        else {
            axios.post('/api/signup', { username, email, password })
            .then(() => {
                navigate('/');
            })
            .catch(err => {
                console.log(err);
                setSignupError('Username or email exists. Please try again.');
            });
        }
    }

    const handleUsernameChange = (e) => {
        setUsername(e?.target?.value);
        if (signupError) setSignupError('');
    }

    const handleEmailChange = (e) => {
        setEmail(e?.target?.value);
        if (signupError) setSignupError('');
    }

    const handlePasswordChange = (e) => {
        setPassword(e?.target?.value);
        if (signupError) setSignupError('');
    }

    return (
        <div className="auth-form">
            <h2>Join Pint</h2>
            {signupError && (
                <div className="error">{signupError}</div>
            )}
            <input value={username} placeholder="Username" onChange={handleUsernameChange} />
            <input type="email" value={email} placeholder="Email address" onChange={handleEmailChange} />
            <input type="password" value={password} placeholder="Password" onChange={handlePasswordChange} />
            <button onClick={handleSignup}>Sign up</button>
        </div>
    )
};

export default Signup;