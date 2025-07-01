const express = require("express");
const multer = require("multer");
const cors = require("cors");
const csv = require("csv-parser");
const fs = require("fs");
const puppeteer = require("puppeteer");

const app = express();
const port = 5000;

app.use(cors()); // Allow frontend to communicate with backend
const upload = multer({ dest: "uploads/" });

let csvData = []; // Stores parsed CSV data

// Self-Citation Calculation
async function calculateSelfCitations(publicationTitle) {
    console.log(`🔍 Checking self-citations for: ${publicationTitle}`);
    if (!publicationTitle) return 0;

    const link = `https://www.semanticscholar.org/search?q=${publicationTitle}`;
    const authors = ["Kartick Chandra Mondal"];
    let browser;

    try {
        browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('div[data-test-id="total-citations-stat"] a', { visible: true, timeout: 30000 });
        const citingLink = await page.evaluate(() => {
            const linkElement = document.querySelector("div[data-test-id='total-citations-stat'] a");
            return linkElement ? linkElement.href.trim() : null;
        });

        if (!citingLink) {
            console.log("No citing link found.");
            return 0;
        }

        await page.goto(citingLink, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list'] a span", {
            visible: true,
            timeout: 60000,
        });

        const citingAuthors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list'] a span"))
                .map(el => el.innerText.trim());
        });

        console.log(`Citing Authors: ${citingAuthors}`);

        const normalizeName = (name) => name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).map((part, index, arr) => index === arr.length - 1 ? part : part.charAt(0)).join(' ');
        const normalizedAuthors = authors.map(normalizeName);
        const normalizedCitingAuthors = citingAuthors.map(normalizeName);

        const selfCitationsCount = normalizedCitingAuthors.filter(author => normalizedAuthors.includes(author)).length;
        console.log(`Self-citations found: ${selfCitationsCount}`);

        return [citingAuthors, selfCitationsCount];
    } catch (error) {
        console.error(`Error fetching self-citations:`, error);
        return 0;
    } finally {
        if (browser) await browser.close();
    }
}

// File Upload Route
app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    csvData = []; // Reset previous data
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
            csvData.push(data)
        })
        .on("end", async () => {
            console.log(`File parsed. Processing self-citations for ${csvData.length} entries...`);
            for (let item of csvData) {
                var x = await calculateSelfCitations(item['Title']);
                console.log(item['Title'])
                item['citing-authors'] = x[0]
                item['self-citation'] = x[1]
            }
            console.log(csvData)

            fs.unlinkSync(filePath); // Delete file after processing
            res.json({ message: "File uploaded and processed successfully", csvData });
        })
        .on("error", (err) => res.status(500).json({ error: err.message }));
});

// Serve Data with Self-Citations
app.get("/api/publications", (req, res) => {
    console.log("Sending processed data...");
    res.json(csvData);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
