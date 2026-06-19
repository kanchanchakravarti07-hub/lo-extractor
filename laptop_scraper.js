// Purane 'require' ki jagah hum 'import' use karenge
async function run() {
    // Dynamic import for Puppeteer
    const puppeteer = await import('puppeteer');
    const axios = (await import('axios')).default;
    
    const browser = await puppeteer.launch({ 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    page.on('request', async (req) => {
        if (req.url().includes('mono.m3u8')) {
            console.log("Found link:", req.url());
            try {
                await axios.post('https://lo-extractor-1.onrender.com/update-link', { url: req.url() });
                process.exit(0); 
            } catch (err) {
                console.log("Error sending link:", err.message);
            }
        }
    });

    await page.goto('https://stream-xhd.com/live1.php?stream=dsports');
    await new Promise(r => setTimeout(r, 15000));
    await browser.close();
}
run();