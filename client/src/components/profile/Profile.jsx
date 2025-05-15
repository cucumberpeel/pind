import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function Profile() {
    const { username } = useParams();
    const { user } = useAuth();
    const [ profile, setProfile ] = useState(null);
    const isSelf = user?.username === username;
    const [ friendStatus, setFriendStatus ] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/user/${username}`)
        .then(res => setProfile(res?.data?.user))
        .catch(() => setProfile('User Not Found'))
    }, [username]);

    useEffect(() => {
        if (!isSelf && user && profile) {
            console.log(profile?.user_id);
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

    // let friendButton;
    // switch(friendStatus) {
    //     case 'pending':
    //         friendButton = "Pending";
    //         break;
    //     case 'friends':
    //         friendButton = "Friends";
    //         break;
    //     case 'none':
    //         friendButton = "Add Friend";
    //         break;
    //     default:
    //         friendButton = null;
    // };

    return (
        <div className="user-profile">
            <h1>{profile?.username}</h1>
            <p>{profile?.bio}</p>
            {user && !isSelf && (
                <>
                {friendStatus === 'pending' && (
                    <button disabled>Pending</button>
                )}
                {friendStatus === 'none' && (
                    <button onClick={handleFriendRequest}>Add Friend</button>
                )}
                </>
            )}
            <section>
                <h2>Pins</h2>
            </section>
            <section>
                <h2>Boards</h2>
            </section>
            {isSelf && (
                <section>
                    <h2>My Follow Streams</h2>
                </section>
            )}
        </div>
    )
};

export default Profile;