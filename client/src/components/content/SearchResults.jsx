import PinFeed from "./PinFeed";

function SearchResults({ pins }) {    
    return (
        <div>
            <h2>Search Results</h2>
            <a href="/">Back to home</a>
            <PinFeed pins={pins} />
        </div>
    );
};

export default SearchResults;