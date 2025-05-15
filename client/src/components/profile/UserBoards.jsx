import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function UserBoards() {
    const { username } = useParams();
    const [ boards, setBoards ] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/boards`)
        .then(res => setBoards(res?.data?.boards))
        .catch(err => console.error(err))
    }, [username, boards]);
}

export default UserBoards;