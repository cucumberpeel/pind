import { useEffect, useState } from 'react';
import Feed from '../content/Feed';
import SearchResults from '../content/SearchResults';
import axios from 'axios';

function Home() {
    const [ boards, setBoards ] = useState([]);
    const [ pins, setPins ] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/boards')
        .then(res => {
            console.log('/api/boards', res);
            setBoards(res?.data?.boards);
        })
        .catch(err => console.error(err))
    }, []);

    useEffect(() => {
        axios.get('http://localhost:8080/api/pins')
        .then(res => {
            console.log('/api/pins', res);
            setPins(res?.data?.pins);
        })
        .catch(err => console.error(err))
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        axios.get(`http://localhost:8080/api/search?tag=${searchQuery}`)
            .then(res => {
                setSearchResults(res?.data?.results || []);
                setSearchQuery('');
            })
            .catch(err => console.error('Search failed:', err));
    };

    return (
        <div id="home">
            <form onSubmit={handleSearch}>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e?.target?.value)} placeholder="Search Pint" />
                <button type="submit">Search</button>
            </form>
            {searchResults ? (
                <SearchResults pins={searchResults} />
            ) : (
                <Feed pins={pins} boards={boards} />
            )}
        </div>
    );
};

export default Home;