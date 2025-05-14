import { config } from 'dotenv';
import express from 'express';
import pgPromise from 'pg-promise';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());

const pgp = pgPromise();
const db = pgp(process.env.POSTGRES_URI);

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