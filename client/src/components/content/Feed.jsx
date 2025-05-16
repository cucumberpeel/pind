import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RepinForm from './Repin';

function Feed({ pins, boards }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ userBoards, setUserBoards ] = useState([]);
    const [ dialogOpenId, setDialogOpenId ] = useState(null);
    const [ selectedBoard, setSelectedBoard ] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${user?.username}/boards`, { withCredentials: true })
        .then(res => setUserBoards(res?.data?.boards))
        .catch(err => console.error(err))
    }, [user?.username, userBoards]);

    const handleRepinButton = (pin_id) => {
        if (!user?.username) {
            navigate('/login');
            return;
        }
        setDialogOpenId(pin_id);
    }

    const handleCancel = () => {
        setSelectedBoard('');
        setDialogOpenId('');
    }

    const handleRepin = (pin) => {
        axios.post(`http://localhost:8080/api/pin/${pin?.pin_id}/repin`, { 
            pin_id: pin?.pin_id, img_id: pin?.img_id, board_id: selectedBoard || null })
        .then(() => {
            setSelectedBoard('');
            setDialogOpenId('');
        })
        .catch(err => {
            console.error(err);
        });
    };

    return (
        <section>
            <h2>Pins</h2>
            <div className="display-pins">
                {pins.length === 0 ? (
                    <p>Nothing here yet</p>
                ) : (
                    pins.map(p => (
                        <div key={p?.pin_id} className="pin-thumbnail">
                            {p.origin_id && ( <p>Repin</p> )}

                            <button onClick={() => handleRepinButton(p?.pin_id)}>Repin</button>
                            {dialogOpenId === p?.pin_id && (
                                <div className="modal">
                                    <select onChange={(e) => setSelectedBoard(e.target.value)} value={selectedBoard || ''}>
                                    <option value="">No board</option>
                                    {userBoards?.map(board => (
                                        <option key={board.board_id} value={board.board_id}>
                                            {board.title}
                                        </option>
                                    ))}
                                    </select>
                                    <button onClick={() => handleRepin(p)}>Add pin</button>
                                    <button onClick={() => handleCancel}>Cancel</button>
                                    </div>
                            )}
                            {p.img_url[0] === '/' ? (
                                <img src={`http://localhost:8080${p.img_url}`} alt='' />
                            ) : (
                                <img src={p.img_url} alt='' />
                            )}
                            {p.page_url && (
                                <a href={p.page_url} target="_blank" rel="noreferrer">View original</a>
                            )}
                            <p className="timestamp">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                    ))
                )}
            </div>
                <div id="boards-container">
                {boards?.map(board => (
                <div key={board?.board_id}>
                    <h2>{board?.title}</h2>
                    <p>{board?.description}</p>
                    <p>{board?.username}</p>
                </div>
                ))}
            </div>
        </section>
    );
};

export default Feed;