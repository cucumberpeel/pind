import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
// import RepinForm from './Repin';

function Feed({ pins, boards }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ userBoards, setUserBoards ] = useState([]);
    const [ dialogOpenId, setDialogOpenId ] = useState(null);
    const [ selectedBoard, setSelectedBoard ] = useState('');
    const [ view, setView ] = useState('boards');
    const [ commentsMap, setCommentsMap ] = useState({});
    const [ likesMap, setLikesMap ] = useState({});
    const [ commentInput, setCommentInput ] = useState('');

    // for mapping comments to pins
    useEffect(() => {
        pins?.forEach(p => {
            if (!commentsMap[p?.pin_id]) {
                axios.get(`http://localhost:8080/api/comments/${p?.pin_id}`)
                .then(res => {
                    setCommentsMap(prev => ({
                        ...prev,
                        [p?.pin_id]: res?.data
                    }));
                })
            }
        });
    }, [pins, commentsMap]);

    // for mapping likes to images
    useEffect(() => {
        pins?.forEach(p => {
            if (!likesMap[p?.img_id]) {
                axios.get(`http://localhost:8080/api/likes/${p?.img_id}`)
                .then(res => {
                    setLikesMap(prev => ({
                        ...prev,
                        [p?.img_id]: res?.data
                    }));
                })
            }
        });
    }, [pins, likesMap]);

    // for choosing boards to repin to
    useEffect(() => {
        if (user?.username) {
            axios.get(`http://localhost:8080/api/user/${user?.username}/boards`, { withCredentials: true })
            .then(res => setUserBoards(res?.data?.boards))
            .catch(err => {
                console.error(err);
                setUserBoards([]);
            })
        }
    }, [user?.username]);

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

    const toggleLike = async (img_id) => {
        if (!user?.username) {
            navigate('/login');
            return;
        }
        const liked = likesMap[img_id]?.liked_by_user;
      
        const endpoint = liked ? `http://localhost:8080/api/delete/like` : `http://localhost:8080/api/like`
        await axios.post(endpoint, { img_id: img_id }, { withCredentials: true })
          .then(() => {
            setLikesMap(prev => ({
              ...prev,
              [img_id]: {
                like_count: liked ? prev[img_id].like_count - 1 : prev[img_id].like_count + 1,
                liked_by_user: !liked
              }
            }));
          })
          .catch(err => {
            console.error(err);
          })
      };

    const handleComment = (e, pin_id) => {
        if (!user?.username) {
            navigate('/login');
            return;
        }
        e.preventDefault();
        axios.post(`http://localhost:8080/api/comment`, { pin_id: pin_id })
        .then(() => {
            setCommentInput('');
        })
        .catch(err => {
            console.error(err);
        })
    };

    return (
        <div className="feed-container">
            <ToggleButtonGroup color="primary" value={view} onChange={(e) => setView(e?.target?.value)}>
                <ToggleButton value="pins">Pins</ToggleButton>
                <ToggleButton value="boards">Boards</ToggleButton>
            </ToggleButtonGroup>
            {view === 'pins' ? ( <section>
                <h2>Pins</h2>
                <div className="display-pins">
                    {pins?.map(p => (
                        <div key={p?.pin_id}>
                            {p.origin_id && ( <p>Repin</p> )}

                            <button onClick={() => handleRepinButton(p?.pin_id)}>Repin</button>
                            {dialogOpenId === p?.pin_id && (
                                <div className="repin-modal">
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

                            {p?.img_url[0] === '/' ? (
                                <img src={`http://localhost:8080${p?.img_url}`} alt='' />
                            ) : (
                                <img src={p?.img_url} alt='' />
                            )}
                            {p?.page_url && (
                                <a href={p?.page_url} target="_blank" rel="noreferrer">View original</a>
                            )}
                            <p className="timestamp">{new Date(p?.created_at).toLocaleDateString()}</p>

                            <button key={p?.pin_id} onClick={() => toggleLike(p?.img_id)}>
                                {likesMap[p?.img_id]?.liked_by_user ? 'Unlike' : 'Like'}
                            </button>
                            <p>{likesMap[p?.img_id]?.likes || 0} likes</p>
                            
                            {commentsMap[p?.img_id]?.can_comment && (
                                <form onSubmit={(e) => handleComment(e, p?.pin_id)}>
                                    <input
                                        type="text"
                                        value={commentInput[p?.pin_id] || ''}
                                        onChange={(e) =>
                                            setCommentInput({
                                                ...commentInput,
                                                [p?.pin_id]: e?.target?.value,
                                            })
                                        }
                                        placeholder="Add a comment..."
                                    />
                                    <button type="submit">Post</button>
                                </form>
                            )}
                            <p>{commentsMap[p?.pin_id]?.comments?.length || 0} comments</p>
                        </div>
                    ))}
                </div>
            </section> ) : (
            <section>
                <div id="display-boards">
                    {boards?.map(board => (
                    <div key={board?.board_id}>
                        <h2>{board?.title}</h2>
                        <p>{board?.description}</p>
                        <p>{board?.username}</p>
                    </div>
                    ))}
                </div>
            </section> )}
        </div>
    );
};

export default Feed;