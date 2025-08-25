import { config } from 'dotenv';
import express from 'express';
import pgPromise from 'pg-promise';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcrypt';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import winston from 'winston';

config();

const app = express();
app.use(express.static('../client/build'));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: remove for production builds
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
const upload = multer({ storage: multer.memoryStorage() });
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const pgp = pgPromise();
const db = pgp(process.env.POSTGRES_URI);

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const result = await db.query(`select * from public."User" where username = $1`, [username]);
      if (result.length === 0) return done(null, false, { message: 'User not found' });
  
      const user = result[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return done(null, false, { message: 'Wrong password' });
  
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user, done) => {
    done(null, user.user_id)});
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await db.query(`select * from public."User" where user_id = ${id}`, id);
      done(null, result[0]);
    } catch (err) {
      done(err);
    }
  });

  const { combine, timestamp, json } = winston.format;
  const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'combined.log'
        })
    ],
  });

// START Signing Up, Creating Boards, and Pinning
// sign up
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    await db.query(`insert into public."User" (username, email, password_hash)
        values ($1, $2, $3)`, [username, email, password_hash])
    .then(() => {
        res.status(201).json({ message: 'Signup successful' });
        logger.info("Successful signup", [username, email]);
    })
    .catch(err => {
        res.status(400).json({ error: err });
        logger.error('Signup unsuccessful', [username, email, err]);
    })
});

// log in
app.post('/api/login', passport.authenticate('local'), async (req, res) => {
    res.json({ message: 'Login successful', user: req.user.username });
    logger.info("Login", [req?.user?.username]);
});

// log out
app.get('/api/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful' });
        logger.info("Successful logout");
    })
})

// check login status
app.get('/api/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    }
    else {
        res.status(401).json({ user: null });
    }
});

// go to profile
app.get('/api/user/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const result = await db.query(`select user_id, username, bio 
            from public."User" where username = $1`, [username]);
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }
        res.json({ user: result[0] });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error fetching user' });
        logger.error("Failed to fetch profile", [username, err]);
    }
});

// edit profile
app.put('/api/edit/:user_id', async (req, res) => {

});

// create board
app.post('/api/board', async (req, res) => {
    const user_id = req?.user?.user_id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, friends_only } = req?.body;
    try {
        const result = await db.query(
            `INSERT INTO public."Board" (title, description, allow_comments, user_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [
                title,
                description || null,
                friends_only ? 'friends' : 'public',
                user_id
            ]
        );

        res.status(201).json({ board: result[0] });
        logger.info("Created board", [user_id, title, description]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create board' });
        logger.error('Failed to create board', [user_id, err]);
    }
});

// upload an image
app.post('/api/pin/upload', upload.single("file"), async (req, res) => {
    const user_id = req?.user?.user_id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });

    const file = req?.file;
    if (!file) { return res.status(400).json({ error: 'No file uploaded' })};
    const { tags } = req?.body;

    const filename = `${Date.now()}-${file.originalname}`;
    const fullPath = path.join(__dirname, 'public', 'uploads', filename);
    const img_url = `/uploads/${filename}`;
    
    // save file
    // fs.writeFileSync(`./public${img_url}`, file?.buffer);
    fs.writeFileSync(fullPath, file?.buffer);

    try {
        await db.query('BEGIN');
        // upload to Image
        const imageResult = await db.query(`insert into public."Image" (img_url, user_id, img_blob)
            values ($1, $2, $3) returning img_id`, [img_url, user_id, file?.buffer]);
        const img_id = imageResult[0].img_id;
        // add Pin
        const pinResult = await db.query(`insert into public."Pin" (img_id, user_id)
            values ($1, $2) returning pin_id`, [img_id, user_id]);
        const pin_id = pinResult[0].pin_id;
        // add Tag and ImageTag
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim().toLowerCase());
            let tag_id;
            for (let tag of tagList) {
                const tagCheck = await db.query(`select tag_id from public."Tag"
                    where tag_name = $1`, [tag]);
                if (tagCheck.length === 0) {
                    // add new Tag if needed
                    const tagResult = await db.query(`insert into public."Tag" (tag_name)
                        values ($1) returning tag_id`, [tag]);
                    tag_id = tagResult[0].tag_id;
                }
                else {
                    tag_id = tagCheck[0].tag_id;
                }
                // add to ImageTag
                await db.query(`insert into public."ImageTag" (img_id, tag_id)
                    values ($1, $2)`, [img_id, tag_id]);
            }
        }
        await db.query('COMMIT');
        res.status(201).json({ message: 'Uploaded new image from file' });
        logger.info("Uploaded new image from file", [user_id, pin_id]);
    }
    catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Image upload from file failed' });
        logger.error('Failed to upload image from file', [user_id, err]);
    }
});

// save an image from the web
app.post('/api/pin/web', async (req, res) => {
    const user_id = req?.user?.user_id;
    if (!user_id) return res.status(401).json({ error: 'Unauthorized' });
    const { img_url, page_url, tags } = req?.body;
    if (!img_url || !page_url) { return res.status(400).json({ error: 'Missing URL' })};

    // download image
    let img_blob;
    try {
        const imageResponse = await axios.get(img_url, {
            responseType: 'arraybuffer',
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        img_blob = imageResponse?.data;
    }
    catch (err) {
        res.status(500).json({ error: 'Error downloading image' });
        logger.error('Failed to download image from URL', [user_id, err]);
        return;
    }

    try {
        await db.query('BEGIN');
        // upload to Image
        const imageResult = await db.query(`insert into public."Image" (img_url, user_id, page_url, img_blob)
            values ($1, $2, $3, $4) returning img_id`, [img_url, user_id, page_url, img_blob]);
            const img_id = imageResult[0].img_id;
        // add Pin
        const pinResult = await db.query(`insert into public."Pin" (img_id, user_id)
            values ($1, $2) returning pin_id`, [img_id, user_id]);
        const pin_id = pinResult[0].pin_id;
        // add Tag and ImageTag
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim().toLowerCase());
            let tag_id;
            for (let tag of tagList) {
                const tagCheck = await db.query(`select tag_id from public."Tag"
                    where tag_name = $1`, [tag]);
                if (tagCheck.length === 0) {
                    // add new Tag if needed
                    const tagResult = await db.query(`insert into public."Tag" (tag_name)
                        values ($1) returning tag_id`, [tag]);
                    tag_id = tagResult[0].tag_id;
                }
                else {
                    tag_id = tagCheck[0].tag_id;
                }
                // add to ImageTag
                await db.query(`insert into public."ImageTag" (img_id, tag_id)
                    values ($1, $2)`, [img_id, tag_id]);
            }
        }
        await db.query('COMMIT');
        res.status(201).json({ message: 'Uploaded new image from URL' });
        logger.info("Uploaded new image from URL", [user_id, pin_id]);
    }
    catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Image upload from URL failed' });
        logger.error('Failed to upload image from URL', [user_id, err]);
    }
})

// view all of a user's pins
app.get('/api/user/:username/pins', async (req, res) => {
    const { username } = req.params;

    try {
        const userResult = await db.query(
            `select user_id from public."User" where username = $1`,
            [username]
        );
        if (userResult.length === 0) { return res.status(404).json({ error: 'User not found' }); }
        const user_id = userResult[0].user_id;

        const pinsResult = await db.query(
            `select * from public."Pin" p join public."Image" i 
            on p.img_id = i.img_id where p.user_id = $1
             order by p.created_at desc`, [user_id]);
        res.json({ pins: pinsResult });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user pins' });
        logger.error('Failed to fetch user pins', [user_id, err]);
    }
});

// view all pins
app.get('/api/pins', async (req, res) => {
    try {
        const pinsResult = await db.query(
            `select * from public."Pin" p join public."Image" i 
            on p.img_id = i.img_id order by p.created_at desc`);
        res.json({ pins: pinsResult });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all pins' });
        logger.error('Failed to fetch all pins', [err]);
    }
});

// view all of a user's boards
app.get('/api/user/:username/boards', async (req, res) => {
    const { username } = req.params;

    try {
        const userResult = await db.query(
            `select user_id from public."User" where username = $1`,
            [username]
        );
        if (userResult.length === 0) { return res.status(404).json({ error: 'User not found' }); }
        const user_id = userResult[0].user_id;

        const boardsResult = await db.query(
            `select * from public."Board" where user_id = $1
             order by created_at desc`, [user_id]);

        const boardIds = boardsResult?.map(b => b.board_id);
        if (boardIds.length === 0) {
            return res.json({ boards: [] });
        };

        const boardPinsResult = await db.query(
            `select * from public."BoardPin" bp
             join public."Pin" p on bp.pin_id = p.pin_id
             join public."Image" i on p.img_id = i.img_id
             where bp.board_id = any($1::int[])`, [boardIds]);

        const pinsByBoard = {};
        boardPinsResult?.forEach(pin => {
            if (!pinsByBoard[pin.board_id]) {
                pinsByBoard[pin.board_id] = [];
            }
            pinsByBoard[pin.board_id].push(pin);
        });

        const boardsWithPins = boardsResult?.map(board => ({
            ...board,
            pins: pinsByBoard[board.board_id] || []
        }));

        res.json({ boards: boardsWithPins });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user boards' });
        logger.error('Failed to fetch user boards', [user_id, err]);
    }
});

// view all boards
app.get('/api/boards', async (req, res) => {
    try {
        const boardsResult = await db.query(`select b.*, u.username
            from public."Board" b join public."User" u
            on b.user_id = u.user_id
            order by created_at desc`);
        if (boardsResult.length === 0) {
            return res.json({ boards: [] });
        }
        const boardIds = boardsResult?.map(b => b?.board_id);

        const boardPinsResult = await db.query(
            `select * from public."BoardPin" bp
             join public."Pin" p on bp.pin_id = p.pin_id
             join public."Image" i on p.img_id = i.img_id
             where bp.board_id = any($1::int[])`, [boardIds]);

            const pinsByBoard = {};
            boardPinsResult?.forEach(pin => {
                if (!pinsByBoard[pin.board_id]) {
                    pinsByBoard[pin.board_id] = [];
                }
                pinsByBoard[pin.board_id].push(pin);
            });

            const boardsWithPins = boardsResult?.map(board => ({
                ...board,
                pins: pinsByBoard[board.board_id] || []
            }));

            res.json({ boards: boardsWithPins });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all boards' });
        logger.error('Failed to fetch all boards', [err]);
    }
});

// delete a pin
app.post('/api/delete/:pin_id', async (req, res) => {

});

// delete a board
app.post('/api/delete/:board_id', async (req, res) => {

});
// END Signing Up, Creating Boards, and Pinning

// START Friends
// send friend request
app.post('/api/friends/request', async (req, res) => {
    const { receiver_id } = req?.body;
    const sender_id = req?.user?.user_id;

    const existing = await db.query(`select * from public."Friendship"
        where (sender_id = $1 and receiver_id = $2)
        or (sender_id = $2 and receiver_id = $1)`, [sender_id, receiver_id])
    if (existing.some(r => r.status === 'accepted' || r.status === 'pending')) {
      return res.status(400).json({ error: 'Already friends or pending' });
    }
  
    await db.query(`insert into public."Friendship" (sender_id, receiver_id)
      values ($1, $2)`, [sender_id, receiver_id])
      .then(() => {
        res.status(201).json({ message: 'Friend request sent' });
        logger.info("Friend request sent", [sender_id, receiver_id]);
    })
      .catch(err => {
        res.status(500).json({ error: 'Friend request error' });
        logger.err("Friend request error", [sender_id, receiver_id]);
    })
  });

// accept friend request
app.post('/api/friends/accept', async (req, res) => {
    const { sender_id } = req?.body;
    const receiver_id = req?.user?.user_id;

    await db.query(`update public."Friendship" set status = 'accepted'
        where sender_id = $1 and receiver_id = $2 and status = 'pending'`, [sender_id, receiver_id])
        .then(() => {
            res.status(201).json({ message: 'Friend request accepted' });
            logger.info("Friend request accepted", [sender_id, receiver_id]);
})
        .catch(err => {
            res.status(500).json({ error: 'Error accepting friend request' });
            logger.err("Error accepting friend request", [sender_id, receiver_id, err]);
})
})

// decline friend request
app.post('/api/friends/decline', async (req, res) => {
    const { sender_id } = req?.body;
    const receiver_id = req?.user?.user_id;

    await db.query(`delete from public."Friendship"
        where sender_id = $1 and receiver_id = $2 and status = 'pending'`, [sender_id, receiver_id])
        .then(() => {
            res.status(201).json({ message: 'Friend request declined' });
            logger.info("Friend request declined", [sender_id, receiver_id]);
})
        .catch(err => {
            res.status(500).json({ error: 'Error declining friend request' });
            logger.err("Error declining friend request", [sender_id, receiver_id, err]);
    })
})

// check friendship status
app.get('/api/friends/status/:target_id', async (req, res) => {
    const user_id = req?.user?.user_id;
    const target_id = parseInt(req?.params?.target_id);
    if (!user_id || user_id === target_id) {
        return res.json({ status: null })
    }
    const result = await db.query(`select sender_id, receiver_id, status
        from public."Friendship"
        where (sender_id = $1 and receiver_id = $2)
        or (sender_id = $2 and receiver_id = $1)
    `, [user_id, target_id]);

    const friendship = result[0];
    if (!friendship) return res.json({ status: 'none' });
    if (friendship.status === 'accepted') return res.json({ status: 'friends' });
    if (friendship.status === 'pending') {
    return res.json({
        status: friendship.sender_id === user_id ? 'pending' : 'incoming'
    });
    }
    return res.json({ status: 'none' });
})
// END Friends

// START Repinning and Following
// repin a picture
app.post('/api/pin/:pin_id/repin', async (req, res) => {
    const user_id = req?.user?.user_id;
    const origin_id = req?.params?.pin_id;
    const img_id = req?.body?.img_id;
    const board_id = req?.body?.board_id;
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })};

    try {
        const pinResult = await db.query(`insert into public."Pin" (img_id, origin_id, user_id)
        values ($1, $2, $3) returning pin_id`, [img_id, origin_id, user_id]);
        const pin_id = pinResult[0].pin_id;

        if (board_id) {
            await db.query(`insert into public."BoardPin" (board_id, pin_id)
                values ($1, $2)`, [board_id, pin_id]);
        }
        res.status(201).json({ message: 'Repin success' });
        logger.info("Repin", [user_id, origin_id]);
    }
    catch (err) {
        res.status(500).json({ error: 'Repin failed' });
        logger.err("Repin failed", [user_id, origin_id, err]);
    }
});

// create a follow stream
app.post('/api/stream', async (req, res) => {
    const title = req?.body?.title;
    const user_id = req?.user?.user_id;
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })}

    await db.query(`insert into public."FollowStream" (stream_name, user_id)
        values ($1, $2)`, [title, user_id])
        .then(() => {
            res.status(201).json({ message: 'Stream created' });
            logger.info("Stream created", [user_id, title]);
    })
        .catch(err => {
            res.status(500).json({ error: 'Stream creation error' });
            logger.err("Stream creation error", [user_id, title, err]);
        })
});

// add board to a follow stream
app.post('/api/streamboard/:stream_id', async (req, res) => {

});

// get all follow streams of a user
app.get('/api/user/:username/streams', async (req, res) => {
    const { username } = req?.params;
    if (req?.user?.username != username) { return res.status(401).json({ error: 'Unauthorized' })}

    try {
        const streamResult = await db.query(`select * from public."FollowStream"
            where user_id = $1 order by created_at desc`, [req?.user?.user_id]);
        res.json({ streams: streamResult });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch follow streams' });
        logger.err("Failed to fetch follow streams", [username]);
    }
})

// END Repinning and Following

// START Liking and Commenting
// like an image
app.post('/api/like', async (req, res) => {
    const { img_id } = req?.body;
    const user_id = req?.user?.user_id;
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })};
    if (!img_id) { return res.status(400).json({ error: 'Missing image ID' })};

    await db.query(`insert into public."Like" (img_id, user_id)
        values ($1, $2) on conflict (img_id, user_id) do nothing`, [img_id, user_id])
        .then(() => {
            res.status(200).json({ message: 'Like success' });
            logger.info("Like", [user_id, img_id]);
    })
        .catch(err => {
            res.status(500).json({ error: 'Like failed' });
            logger.err("Like failed", [user_id, img_id, err]);
        })
});

// remove like from an image
app.post('/api/delete/like', async (req, res) => {
    const { img_id } = req?.body;
    const user_id = req?.user?.user_id;
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })};
    if (!img_id) { return res.status(400).json({ error: 'Missing image ID' })};

    await db.query(`delete from public."Like" where img_id = $1 and user_id = $2`, [img_id, user_id])
        .then(() => {
            res.status(200).json({ message: 'Unlike success' });
            logger.info("Unlike", [user_id, img_id]);
    })
        .catch(err => {
            res.status(500).json({ error: 'Unlike failed' });
            logger.err("Unlike failed", [user_id, img_id, err]);
        })
});

// get likes on an image
app.get('/api/likes/:img_id', async (req, res) => {
    const { img_id } = req?.params;
    const user_id = req?.user?.user_id;

    try {
        const likeResult = await db.query(`select count(*) from public."Like" 
            where img_id = $1`, [img_id]);
        
        let hasLiked = false;

        if (user_id) {
            const likeCheck = await db.query(
            'SELECT 1 FROM "Like" WHERE img_id = $1 AND user_id = $2',
            [img_id, user_id]
            );
            hasLiked = likeCheck.length > 0;
        }

        res.json({ img_id, likes: parseInt(likeResult[0].count), liked_by_user: hasLiked });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch likes' });
        logger.err("Failed to fetch likes", [img_id, err]);
    }
})

// comment on an image
app.post('/api/comment', async (req, res) => {
    const { pin_id, text } = req?.body;
    const user_id = req?.user?.user_id;
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })};
    if (!pin_id || !text) { return res.status(400).json({ error: 'Missing comment info' })};

    try {
        // check comment permissions
        const boardResult = await db.query(`select allow_comments, user_id as owner_id
            from public."BoardPin" bp join public."Board" b on bp.board_id = b.board_id
            where bp.pin_id = $1 `, [pin_id]);

        // check friendship
        if (boardResult.length > 0) {
            const { allow_comments, owner_id } = boardResult[0];
            if (allow_comments === 'friends' && user_id != owner_id) {
                const friendResult = await db.query(`select 1 from public."Friendship"
                    where (sender_id = $1 and receiver_id = $2) or (sender_id = $2 and receiver_id = $1) 
                    and status = 'accepted'`, [user_id, owner_id]);
                if (friendResult.length === 0) { return res.status(403).json({ error: 'No permission to comment' })}
            }
        }

        // insert comment
        await db.query(`insert into public."Comment" (pin_id, user_id, comment)
            values ($1, $2, $3)`, [pin_id, user_id, text])
            .then(() => {
                res.status(200).json({ message: 'Comment success' });
                logger.info("Comment", [user_id, pin_id, text]);
            })
            .catch(err => {
                res.status(500).json({ error: 'Comment failed' });
                logger.err("Comment failed", [user_id, pin_id, text, err]);
            })
    } catch (err) {
        res.status(500).json({ error: 'Comment failed' });
        logger.err("Comment failed", [user_id, pin_id, text, err]);
    }
});

// get comments on a pin
app.get('/api/comments/:pin_id', async (req, res) => {
    const { pin_id } = req?.params;

    try {
        const commentsResult = await db.query(`select comment, c.created_at, u.user_id, username
            from public."Comment" c join public."User" u on c.user_id = u.user_id
            where c.pin_id = $1 order by c.created_at desc`, [pin_id]);
        
        let can_comment = true;
        // check comment permissions
        const boardResult = await db.query(`select allow_comments, user_id as owner_id
            from public."BoardPin" bp join public."Board" b on bp.board_id = b.board_id
            where bp.pin_id = $1 `, [pin_id]);

        // check friendship
        if (boardResult.length > 0) {
            const { allow_comments, owner_id } = boardResult[0];
            if (allow_comments === 'friends' && user_id != owner_id) {
                const friendResult = await db.query(`select 1 from public."Friendship"
                    where (sender_id = $1 and receiver_id = $2) or (sender_id = $2 and receiver_id = $1) 
                    and status = 'accepted'`, [user_id, owner_id]);
                if (friendResult.length === 0) { can_comment = false; }
            }
        }

        res.json({ pin_id, comments: commentsResult, can_comment: can_comment });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch comments' });
        logger.err("Failed to fetch comments", [pin_id, err]);
    }
})
// END Liking and Commenting

// START Keyword Search
app.get('/api/search', async (req, res) => {
    const { tag } = req?.query;

    try {
        const searchResult = await db.query(`select i.*, p.*, tag_name from public."ImageTag" it
        join public."Tag" t on it.tag_id = t.tag_id
        join public."Image" i on it.img_id = i.img_id
        join public."Pin" p on i.img_id = p.img_id
        where t.tag_name like $1
        order by p.created_at desc`, [`%${tag}%`]);
        res.json({ results: searchResult });
        logger.info("Search", [tag]);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
        logger.err("Search failed", [tag, err]);
    }
});
// END Keyword Search

app.listen(process.env.PORT || 8080);