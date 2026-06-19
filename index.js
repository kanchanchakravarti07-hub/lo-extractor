const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'player')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'player', 'index.html')));

let latestLink = "";

async function startScraper() {
    console.log("🚀 Starting scraper...");
    
    // We let Puppeteer find the browser automatically
    const launchOptions = {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    };
    
    try {
        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

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

        await page.goto('https://stream-xhd.com/live1.php?stream=dsports', { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log("✅ Scraper cycle finished.");
    } catch (e) {
        console.error("❌ Scraper error:", e.message);
        setTimeout(startScraper, 5000);
    }
}

startScraper();

app.get('/get-live-link', (req, res) => res.json({ url: latestLink }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));