const puppeteer = require('puppeteer');
const axios = require('axios');

async function run() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('request', async (req) => {
        if (req.url().includes('mono.m3u8')) {
            console.log("Found link:", req.url());
            // Yahan apne Render wale site ka link daalo
            await axios.post('https://lo-extractor-1.onrender.com/update-link', { url: req.url() });
            process.exit(0); 
        }
    });

    await page.goto('https://stream-xhd.com/live1.php?stream=dsports');
    await new Promise(r => setTimeout(r, 15000));
    await browser.close();
}
run();