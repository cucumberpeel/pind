import { useEffect, useState } from 'react';
import Feed from '../content/Feed';
import SearchResults from '../content/SearchResults';
import axios from 'axios';

function Home() {
    const [ boards, setBoards ] = useState([]);
    const [ pins, setPins ] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [ searched, setSearched ] = useState(false);

    useEffect(() => {
        axios.get('/api/boards')
        .then(res => {
            console.log('/api/boards', res);
            setBoards(res?.data?.boards);
        })
        .catch(err => console.error(err))
    }, []);

    useEffect(() => {
        axios.get('/api/pins')
        .then(res => {
            console.log('/api/pins', res);
            setPins(res?.data?.pins);
        })
        .catch(err => console.error(err))
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        await axios.get(`/api/search?tag=${searchQuery}`)
            .then(res => {
                setSearchResults(res?.data?.results || []);
                setSearched(true);
            })
            .catch(err => console.error('Search failed:', err));
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e?.target?.value);
        setSearched(false);
    }

    return (
        <div id="home">
            <form onSubmit={handleSearch}>
                <input type="text" value={searchQuery} onChange={handleSearchChange} placeholder="Search Pint" />
                <button type="submit">Search</button>
            </form>
            {searched ? (
                <SearchResults pins={searchResults} />
            ) : (
                <Feed pins={pins} boards={boards} />
            )}
        </div>
    );
};

export default Home;