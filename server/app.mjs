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

config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
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

// START Signing Up, Creating Boards, and Pinning
// sign up
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    await db.query(`insert into public."User" (username, email, password_hash)
        values ($1, $2, $3)`, [username, email, password_hash])
    .then(() => {
        res.status(201).json({ message: 'Signup successful' });
    })
    .catch(err => {
        console.log(err);
        res.status(400).json({ error: err })
    })
});

// log in
app.post('/api/login', passport.authenticate('local'), async (req, res) => {
    res.json({ message: 'Login successful', user: req.user.username });
});

// log out
app.get('/api/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful' });
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
        res.status(500).json({ error: 'Server error fetching user' })
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create board' });
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
    }
    catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Image upload from file failed' });
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
        console.error(err);
        res.status(500).json({ error: 'Error downloading image' });
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
    }
    catch (err) {
        await db.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Image upload from URL failed' });
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
            `select pin_id, origin_id, i.img_id, img_url, page_url, p.created_at from public."Pin" p join public."Image" i 
            on p.img_id = i.img_id where p.user_id = $1
             order by p.created_at desc`, [user_id]);
        res.json({ pins: pinsResult });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user pins' });
    }
});

// view all of a user's boards

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
      .then(() => res.status(201).json({ message: 'Friend request sent' }))
      .catch(err => res.status(500).json({ error: 'Friend request error' }))
  });

// accept friend request
app.post('/api/friends/accept', async (req, res) => {
    const { sender_id } = req?.body;
    const receiver_id = req?.user?.user_id;
    console.log(sender_id, receiver_id)

    await db.query(`update public."Friendship" set status = 'accepted'
        where sender_id = $1 and receiver_id = $2 and status = 'pending'`, [sender_id, receiver_id])
        .then(() => res.status(201).json({ message: 'Friend request accepted' }))
        .catch(err => res.status(500).json({ error: 'Error accepting friend request' }))
})

// decline friend request
app.post('/api/friends/decline', async (req, res) => {
    const { sender_id } = req?.body;
    const receiver_id = req?.user?.user_id;

    await db.query(`delete from public."Friendship"
        where sender_id = $1 and receiver_id = $2 and status = 'pending'`, [sender_id, receiver_id])
        .then(() => res.status(201).json({ message: 'Friend request declined' }))
        .catch(err => res.status(500).json({ error: 'Error declining friend request' }))
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
    if (!user_id) { return res.status(401).json({ error: 'Unauthorized' })};

    await db.query(`insert into public."Pin" (img_id, origin_id, user_id)
        values ($1, $2, $3)`, [img_id, origin_id, user_id])
        .then(() => {
            res.status(201).json({ message: 'Repin success' });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Repin failed' });
        });
});

// create a follow stream
app.post('/api/stream', async (req, res) => {

});

// add board to a follow stream
app.put('/api/addtostream/:stream_id', async (req, res) => {

});

// display follow stream
app.get('/api/:stream_id', async (req, res) => {

});
// END Repinning and Following

// START Liking and Commenting
// END Liking and Commenting

// START Keyword Search

// END Keyword Search

// HOME PAGE
app.get('/api/boards', async (req, res) => {
    await db.query(`select b.*, u.username
        from public."Board" b join public."User" u
        on b.user_id = u.user_id
        order by created_at desc`)
    .then((data) => {
        res.json({ boards: data });
    })
    .catch((error) => {
        res.status(500).send({ message: error });
    });
});

app.listen(process.env.SERVER_PORT || 8080);