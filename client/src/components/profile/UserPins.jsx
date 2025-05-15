import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function UserPins() {
    const { username } = useParams();
    const [ pins, setPins ] = useState([]);
    const [ repinned, setRepinned ] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/pins`)
        .then(res => setPins(res?.data?.pins))
        .catch(err => console.error(err))
    }, [username, pins]);

    const handleRepin = ({pin_id, img_id}) => {
        axios.post(`http://localhost:8080/api/pin/${pin_id}/repin`, { pin_id: pin_id, img_id: img_id })
        .then(() => setRepinned('Repinned!'))
        .catch(err => {
            console.error(err);
        });
    };

    return (
        <section>
            <h2>Pins</h2>
            <div className="display-pins">
                {pins.length === 0 ? (
                    <p>Nothing here yet</p>
                ) : (
                    pins.map(p => (
                        <div key={p?.pin_id} className="pin-thumbnail">
                            {p.origin_id && ( <p>Repinned</p> )}
                            <button onClick={() => handleRepin({ pin_id: p?.pin_id, img_id: p?.img_id })}>Repin</button>
                            {p.img_url[0] === '/' ? (
                                <img src={`http://localhost:8080${p.img_url}`} alt='' />
                            ) : (
                                <img src={p.img_url} alt='' />
                            )}
                            {p.page_url && (
                                <a href={p.page_url} target="_blank" rel="noreferrer">View original</a>
                            )}
                            <p className="timestamp">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}

export default UserPins;