const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the 'player' directory
app.use(express.static(path.join(__dirname, 'player')));

// Route to serve your HTML player
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'player', 'index.html'));
});

let latestLink = "";

// Robust Scraper Function
async function startScraper() {
    console.log("🚀 Starting headless snatcher...");
    
    // Launch options configured for Render
    const launchOptions = {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    };

    // Automatically detect Render environment and set Chrome path
    if (process.env.RENDER) {
        launchOptions.executablePath = '/usr/bin/google-chrome';
    }
    
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    
    try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.url().includes('mono.m3u8')) {
                if (latestLink !== req.url()) {
                    latestLink = req.url();
                    console.log("🔥 SNATCHED: ", latestLink);
                }
            }
            req.continue();
        });

        await page.goto('https://stream-xhd.com/live1.php?stream=dsports', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        console.log("✅ Scraper active.");
    } catch (e) {
        console.error("❌ Scraper error:", e.message);
        await browser.close();
        setTimeout(startScraper, 5000); // Auto-restart on fail
    }
}

// Initial start
startScraper();

// API for the player to fetch the link
app.get('/get-live-link', (req, res) => {
    res.json({ url: latestLink });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server fully active on port ${PORT}`));