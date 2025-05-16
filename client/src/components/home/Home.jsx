import { useEffect, useState } from 'react';
import Feed from '../content/Feed';
import axios from 'axios';

function Home() {
    const [ boards, setBoards ] = useState([]);
    const [ pins, setPins ] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/boards')
        .then(res => {
            console.log(res);
            setBoards(res?.data?.boards);
        })
        .catch(err => console.error(err))
    }, [boards]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/pins')
        .then(res => {
            console.log(res);
            setPins(res?.data?.pins);
        })
        .catch(err => console.error(err))
    }, [pins]);

    return (
        <div>
            <Feed pins={pins} boards={boards} />
        </div>
    );
};

export default Home;