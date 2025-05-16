import { useState } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PinFeed from './PinFeed';
import BoardFeed from './BoardFeed';
// import RepinForm from './Repin';

function Feed({ pins, boards }) {
    const [ view, setView ] = useState('boards');

    return (
        <div className="feed-container">
            <ToggleButtonGroup color="primary" value={view} onChange={(e) => setView(e?.target?.value)}>
                <ToggleButton value="pins">Pins</ToggleButton>
                <ToggleButton value="boards">Boards</ToggleButton>
            </ToggleButtonGroup>
            {view === 'pins' ? ( 
                <PinFeed pins={pins} />
             ) : (
                <BoardFeed boards={boards} />
             )}
        </div>
    );
};

export default Feed;