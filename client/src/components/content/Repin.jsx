// import { useState } from 'react';
// import Button from '@mui/material/Button';
// import RadioGroup from '@mui/material/RadioGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import FormControl from '@mui/material/FormControl';
// import FormLabel from '@mui/material/FormLabel';
// import Dialog from '@mui/material/Dialog';
// import DialogTitle from '@mui/material/DialogTitle';
// import axios from 'axios';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// function RepinForm({ pin }) {
//     const [ dialogOpen, setDialogOpen ] = useState(false);
//     const [ selectedBoard, setSelectedBoard ] = useState('');
//     const { user, username } = useAuth();
//     const navigate = useNavigate();

//     const handleRepinButton = () => {
//         if (!user) {
//             navigate('/login');
//             return;
//         }
//         setDialogOpen(true);
//     };

//     const handleRepin = () => {
//         axios.post(`http://localhost:8080/api/pin/${pin_id}/repin`, { pin_id: pin_id, img_id: img_id, board_id: board_id })
//         .then(() => {
//             setSelectedBoard(null);
//             setDialogOpen(false);
//         })
//         .catch(err => {
//             console.error(err);
//         });
//     };

//     const handleCancel = () => {
//         setSelectedBoard(null);
//         setDialogOpen(false);
//     };

//     return (
//         <div className="modal">
//             <Button onClick={handleRepinButton} variant="outlined">Repin</Button>
//             {/* <Dialog key={pin_id} open={dialogOpen}>
//                 <DialogTitle>Select board</DialogTitle>
//                 <Button onClick={handleRepin(selectedBoard)}>Repin</Button>
//                 <Button onClick={handleCancel}>Cancel</Button>
//             </Dialog> */}
//         </div>
//     )

// };

// export default RepinForm;