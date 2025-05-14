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

app.get('/api/test', (req, res) => {
    res.json({ message: 'hello world' });
});

app.listen(process.env.SERVER_PORT);