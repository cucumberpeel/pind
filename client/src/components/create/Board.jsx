import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

function Board() {
    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ friendsOnly, setFriendsOnly ] = useState(false);
    const [ boardError, setBoardError ] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleTitleChange = (e) => {
        setTitle(e?.target?.value);
        setBoardError('');
    }

    const handleDescriptionChange = (e) => {
        setDescription(e?.target?.value);
        setBoardError('');
    }

    const handleFriendsOnlyChange = (e) => {
        setFriendsOnly(e?.target?.checked);
        setBoardError('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:8080/api/board', { title, description, friendsOnly }, { withCredentials: true })
        .then(() => {
            setTitle('');
            setDescription('');
            setFriendsOnly(false);
            navigate(`/user/${user?.username}`);
        })
        .catch(err => {
            console.error(err);
            setBoardError('There was an issue creating your board. Please try again.');
        })
    }

    return (
        <div id="create-board-container">
            <h2>Create Board</h2>
            { boardError && (
                <div className="error">{boardError}</div>
            )}
            <form onSubmit={handleSubmit}>
                <label>Title
                    <input type="text" value={title} onChange={handleTitleChange} placeholder="My favorite veggies" required />
                </label>
                <label>Description
                    <input type="textbox" value={description} onChange={handleDescriptionChange} placeholder="Tell us more" />
                </label>
                <label>
                    <input type="checkbox" checked={friendsOnly} onChange={handleFriendsOnlyChange} />
                    Comments from friends only
                </label>

                <button type="submit">Create Board</button>
            </form>
        </div>
    )
};

export default Board;