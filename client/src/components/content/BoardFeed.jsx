import axios from 'axios';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardHeader,
    Grid,
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

function BoardFeed({ boards }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleFollow = () => {

    };

    return (
        <section>
            <div id="display-boards">
                {boards?.map(board => (
                    <Card key={board?.board_id} sx={{ maxWidth: 500, marginBottom: 3 }}>
                        <CardHeader title={board.title} subheader={new Date(board.created_at).toLocaleDateString()} />
                        <CardContent>
                            {board.description && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {board.description}
                                </Typography>
                            )}

                            <Grid container spacing={2}>
                                {board.pins?.map(pin => (
                                    <Grid item key={pin.pin_id} xs={4}>
                                        <img
                                            src={pin.img_url.startsWith('/') ? `http://localhost:8080${pin.img_url}` : pin.img_url}
                                            alt=""
                                            style={{ width: '100%', borderRadius: 4 }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>

                        <CardActions>
                            {(
                                <Button size="small" variant="outlined" onClick={handleFollow}>
                                    Follow
                                </Button>
                            )}
                        </CardActions>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default BoardFeed;