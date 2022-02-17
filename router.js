import express from 'express';
export const router = express.Router();

router.get('/', (req, res) => {
    res.send('new server 2 is up and running');
});