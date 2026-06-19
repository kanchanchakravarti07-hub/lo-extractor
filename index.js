const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'player')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'player', 'index.html')));

let latestLink = "";

async function startScraper() {
    console.log("🚀 Starting aggressive snatcher...");
    
    const launchOptions = {
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    };

    if (process.env.RENDER) {
        if (fs.existsSync('/usr/bin/google-chrome')) {
            launchOptions.executablePath = '/usr/bin/google-chrome';
        }
    }
    
    try {
        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        
        // Anti-bot headers
        await page.setExtraHTTPHeaders({
            'Referer': 'https://www.google.com/',
            'Accept-Language': 'en-US,en;q=0.9',
            'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.url().includes('mono.m3u8')) {
                latestLink = req.url();
                console.log("🔥 SNATCHED: ", latestLink);
            }
            req.continue();
        });

        console.log("Navigating to target...");
        await page.goto('https://stream-xhd.com/live1.php?stream=dsports', { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for potential video element
        await page.waitForSelector('video', { timeout: 30000 }).catch(() => console.log("No video element found"));
        
        console.log("✅ Scraper cycle finished. Holding connection...");
    } catch (e) {
        console.error("❌ Scraper error:", e.message);
        setTimeout(startScraper, 5000);
    }
}

startScraper();

app.get('/get-live-link', (req, res) => res.json({ url: latestLink }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));