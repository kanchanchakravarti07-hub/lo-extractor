const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');
const fs = require('fs'); // Added this to check file existence

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'player')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'player', 'index.html'));
});

let latestLink = "";

async function startScraper() {
    console.log("🚀 Starting headless snatcher...");
    
    const launchOptions = {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    };

    // Fail-safe path detection
    if (process.env.RENDER) {
        const chromePath = '/usr/bin/google-chrome';
        if (fs.existsSync(chromePath)) {
            launchOptions.executablePath = chromePath;
            console.log("✅ Using Chrome at:", chromePath);
        } else {
            console.log("⚠️ Chrome not found at /usr/bin/google-chrome. Trying default...");
        }
    }
    
    try {
        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        
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
        
        // Add this line before page.goto:
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
        await page.goto('https://stream-xhd.com/live1.php?stream=dsports', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        // Add this line after the page.goto
const content = await page.content();
console.log("DEBUG: Page content length is:", content.length);
// If this length is very small (like < 500), they are serving you a "Blocked" or "Access Denied" page!
        
        console.log("✅ Scraper active.");
    } catch (e) {
        console.error("❌ Scraper error:", e.message);
        setTimeout(startScraper, 5000);
    }
}

startScraper();

app.get('/get-live-link', (req, res) => {
    res.json({ url: latestLink });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));