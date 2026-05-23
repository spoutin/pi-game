const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SCORES_FILE = path.join(__dirname, 'data', 'scores.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/scores', (req, res) => {
    if (!fs.existsSync(SCORES_FILE)) {
        return res.json([]);
    }
    const scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    res.json(scores);
});

app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    
    let scores = [];
    if (fs.existsSync(SCORES_FILE)) {
        scores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
    }
    
    scores.push({ name: name.substring(0, 20), score });
    scores.sort((a, b) => a.score - b.score);
    scores = scores.slice(0, 10); // Keep top 10
    
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
    res.json(scores);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
