import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function FollowStream() {
    const { user } = useAuth();
    const [ fsError, setFsError ] = useState('');
    const [ title, setTitle ] = useState('');
    const navigate = useNavigate();

    const handleTitleChange = (e) => {
        setTitle(e?.target?.value);
        setFsError('');
    }

    const handleSubmit = async (e) => {
        if (!user.username) {
            navigate('/login');
            return;
        }
        e.preventDefault();
        await axios.post('/api/stream', { title }, { withCredentials: true })
        .then(() => {
            setTitle('');
            navigate(`/user/${user?.username}`);
        })
        .catch(err => {
            console.error(err);
            setFsError('There was an issue creating your stream. Please try again.');
        })
    }

    return (
        <div id="create-follow-stream-container">
            <h2>Create Follow Stream</h2>
            {fsError && (
                <div className="error">{fsError}</div>
            )}
            <form onSubmit={handleSubmit}>
                <label>Title
                    <input type="text" value={title} onChange={handleTitleChange} placeholder="All about veggies" required />
                </label>

                <button type="submit">Create Stream</button>
            </form>
        </div>
    )
}

export default FollowStream;