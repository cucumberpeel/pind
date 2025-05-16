import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

axios.defaults.withCredentials = true;

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    }

    return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
            <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'white', flexGrow: 1 }}>
                Pind
            </Typography>

            {user ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button component={Link} to="/pin" color="inherit">Create Pin</Button>
                    <Button component={Link} to="/board" color="inherit">Create Board</Button>
                    <Button component={Link} to="/followstream" color="inherit">Create Follow Stream</Button>
                    <Button component={Link} to="/updates" color="inherit">Updates</Button>
                    <Button component={Link} to={`/user/${user.username}`} color="inherit">Profile</Button>
                    <Button onClick={handleLogout} color="inherit">Log out</Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button component={Link} to="/signup" color="inherit">Sign up</Button>
                    <Button component={Link} to="/login" color="inherit">Log in</Button>
                </Box>
            )}
        </Toolbar>
    </AppBar>
    );
};

export default Header;