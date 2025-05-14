import { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
    const [ boards, setBoards ] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/boards')
        .then(res => {
            console.log(res);
            setBoards(res?.data?.boards);
        })
        .catch(err => console.error(err))
    }, []);

    return (
    <div id="boards-container">
        {boards?.map(board => (
        <div key={board?.board_id}>
            <h2>{board?.title}</h2>
            <p>{board?.description}</p>
            <p>{board?.username}</p>
        </div>
        ))}
    </div>
    );
};

export default Home;