const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'player')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'player', 'index.html')));

let latestLink = "";

// GitHub Action yahan se link post karega
app.post('/update-link', (req, res) => {
    latestLink = req.body.url;
    console.log("🔥 Received new link: ", latestLink);
    res.status(200).send("Link updated successfully");
});

// Proxy route for CORS bypass
app.get('/proxy-stream', (req, res) => {
    if (!latestLink) return res.status(404).send("No stream found");

    https.get(latestLink, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    }).on('error', (e) => res.status(500).send(e.message));
});

// For your player to fetch the link
app.get('/get-live-link', (req, res) => res.json({ url: latestLink }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));