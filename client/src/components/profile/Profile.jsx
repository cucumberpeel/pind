import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Feed from '../content/Feed';

function Profile() {
    const { username } = useParams();
    const { user } = useAuth();
    const [ profile, setProfile ] = useState(null);
    const isSelf = user?.username === username;
    const [ friendStatus, setFriendStatus ] = useState(null);
    const [ pins, setPins ] = useState([]);
    const [ boards, setBoards ] = useState([]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}`)
        .then(res => setProfile(res?.data?.user))
        .catch(() => setProfile('User Not Found'))
    }, [username]);

    useEffect(() => {
        if (!isSelf && user && profile) {
            axios.get(`http://localhost:8080/api/friends/status/${profile?.user_id}`, { withCredentials: true })
            .then(res => setFriendStatus(res?.data?.status))
            .catch(err => console.error(err))
        }
    }, [user, profile, isSelf]);

    const handleFriendRequest = () => {
        axios.post(`http://localhost:8080/api/friends/request`, { receiver_id: profile?.user_id }, { withCredentials: true })
        .then(() => setFriendStatus('pending'))
        .catch(err => {
            console.error(err)
            setFriendStatus(null)
        })
    };

    const handleAccept = () => {
        axios.post(`http://localhost:8080/api/friends/accept`, { sender_id: profile?.user_id }, { withCredentials: true })
        .then(() => setFriendStatus('friends'))
        .catch(err => console.error(err))
    };

    const handleDecline = () => {
        axios.post(`http://localhost:8080/api/friends/decline`, { sender_id: profile?.user_id }, { withCredentials: true })
        .then(() => setFriendStatus('none'))
        .catch(err => console.error(err))
    };

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/boards`)
        .then(res => setBoards(res?.data?.boards))
        .catch(err => console.error(err))
    }, [username, boards]);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}/pins`)
        .then(res => setPins(res?.data?.pins))
        .catch(err => console.error(err))
    }, [username, pins]);

    return (
        <div className="user-profile">
            <h1>{profile?.username}</h1>
            <p>{profile?.bio}</p>
            {user && !isSelf && (
                <>
                {friendStatus === 'incoming' && (
                    <div>
                        <p>{profile?.username} wants to be friends</p>
                        <button onClick={handleAccept}>Accept</button>
                        <button onClick={handleDecline}>Decline</button>
                    </div>
                )}
                {friendStatus === 'pending' && (
                    <button disabled>Pending</button>
                )}
                {friendStatus === 'none' && (
                    <button onClick={handleFriendRequest}>Add Friend</button>
                )}
                </>
            )}
            <Feed pins={pins} boards={boards} />
            {isSelf && (
                <section>
                    <h2>My Follow Streams</h2>
                </section>
            )}
        </div>
    )
};

export default Profile;