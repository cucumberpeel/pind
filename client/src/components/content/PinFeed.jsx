import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
  } from '@mui/material';

function PinFeed({ pins }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ userBoards, setUserBoards ] = useState([]);
    const [ dialogOpenId, setDialogOpenId ] = useState(null);
    const [ selectedBoard, setSelectedBoard ] = useState('');
    const [ commentsMap, setCommentsMap ] = useState({});
    const [ likesMap, setLikesMap ] = useState({});
    const [ commentInput, setCommentInput ] = useState('');

    // for mapping comments to pins
    useEffect(() => {
        pins.length > 0 && pins?.forEach(p => {
            if (!commentsMap[p?.pin_id]) {
                axios.get(`/api/comments/${p?.pin_id}`)
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
        pins.length > 0 && pins?.forEach(p => {
            if (!likesMap[p?.img_id]) {
                axios.get(`/api/likes/${p?.img_id}`)
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
            axios.get(`/api/user/${user?.username}/boards`, { withCredentials: true })
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
        axios.post(`/api/pin/${pin?.pin_id}/repin`, { 
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
      
        const endpoint = liked ? `/api/delete/like` : `/api/like`
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
        axios.post(`/api/comment`, { pin_id: pin_id })
        .then(() => {
            setCommentInput('');
        })
        .catch(err => {
            console.error(err);
        })
    };

    return (
    <div className="display-pins">
        <h2>Pins</h2>
        {pins.length > 0 ? (pins?.map(p => (
            <Card key={p?.pin_id} sx={{ maxWidth: 345, m: 2 }}>
                {p.origin_id && (
                <Typography variant="subtitle2" color="text.secondary" sx={{ p: 1 }}>
                    Repin
                </Typography>
                )}
                <CardMedia
                    component="img"
                    height="194"
                    image={
                        p?.img_url[0] === '/'
                        ? `http://localhost:8080${p?.img_url}`
                        : p?.img_url
                    }
                    alt="Pin"
                />
                <CardContent>
                    {p?.page_url && (
                        <Typography variant="body2" color="text.secondary">
                        <a href={p.page_url} target="_blank" rel="noreferrer">
                            View original
                        </a>
                        </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                        {new Date(p?.created_at).toLocaleDateString()}
                    </Typography>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={() => handleRepinButton(p?.pin_id)}>
                        Repin
                    </Button>

                    <Button size="small" onClick={() => toggleLike(p?.img_id)}>
                        {likesMap[p?.img_id]?.liked_by_user ? 'Unlike' : 'Like'}
                    </Button>
                    <Typography variant="caption">
                        {likesMap[p?.img_id]?.likes || 0} likes
                    </Typography>
                </CardActions>
                {commentsMap[p?.img_id]?.can_comment && (
          <CardContent>
            <form onSubmit={(e) => handleComment(e, p?.pin_id)}>
                <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Add a comment..."
                    value={commentInput[p?.pin_id] || ''}
                    onChange={(e) =>
                    setCommentInput({
                        ...commentInput,
                        [p?.pin_id]: e.target.value,
                    })
                    }
                    />
                    <Button type="submit" size="small" sx={{ mt: 1 }}>
                        Post
                    </Button>
                    </form>
                    <Typography variant="caption">
                    {commentsMap[p?.pin_id]?.comments?.length || 0} comments
                    </Typography>
                </CardContent>
                )}

            <Dialog open={dialogOpenId === p?.pin_id} onClose={handleCancel}>
                <DialogTitle>Select a Board</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Board</InputLabel>
                    <Select
                        value={selectedBoard || ''}
                        onChange={(e) => setSelectedBoard(e.target.value)}
                        label="Board"
                    >
                        <MenuItem value="">No board</MenuItem>
                        {userBoards?.map((board) => (
                        <MenuItem key={board.board_id} value={board.board_id}>
                            {board.title}
                        </MenuItem>
                        ))}
                    </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button onClick={() => handleRepin(p)}>Add pin</Button>
                </DialogActions>
            </Dialog>
        </Card>
        ))) : (
            <div className="empty">
                <Typography variant="body1">Oops. Nothing to see here.</Typography>
            </div>
        )}
    </div>
    );
};

export default PinFeed;