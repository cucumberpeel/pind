import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Feed from '../content/Feed';
import axios from 'axios';

function UserPins() {
    const { username } = useParams();
    const [ pins, setPins ] = useState([]);
    const [ boards, setBoards ] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/pins`)
        .then(res => setPins(res?.data?.pins))
        .catch(err => console.error(err))
    }, [username, pins]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/boards`)
        .then(res => setBoards(res?.data?.boards))
        .catch(err => console.error(err))
    }, [username, boards]);

    return (
        <div>
            <h2>Pins</h2>
            <Feed pins={pins} boards={boards} />
        </div>
    )
}

export default UserPins;