function BoardFeed({boards}) {
    return (
        <section>
            <div id="display-boards">
                {boards?.map(board => (
                <div key={board?.board_id}>
                    <h2>{board?.title}</h2>
                    <p>{board?.description}</p>
                    <p>{board?.username}</p>
                </div>
                ))}
            </div>
        </section>
    );
};

export default BoardFeed;