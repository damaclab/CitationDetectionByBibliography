// const express = require('express');
// const router = express.Router();
// const csv = require('csv-parser');
// const fs = require('fs');
// const path = require('path');
// const puppeteer = require('puppeteer');

// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// async function calculateSelfCitations(publicationTitle) {
//     const link = `https://www.semanticscholar.org/search?q=${publicationTitle}`;
//     var authors = ["Kartick Chandra Mondal"];
//     if (!link) return 0;

//     let browser;
//     try {
//         console.log(`Scraping data from: ${link}`);

//         // Launch Puppeteer
//         browser = await puppeteer.launch({
//             headless: false,
//             args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended for Puppeteer on some environments
//         });
//         const page = await browser.newPage();

//         // Set a user agent and headers
//         await page.setUserAgent(
//             'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
//         );
//         await page.setExtraHTTPHeaders({
//             'Accept-Language': 'en-US,en;q=0.9',
//         });

//         await page.goto(link, {
//             waitUntil: 'networkidle2', // Wait for all network requests to finish
//             timeout: 60000,
//         });

//         // Wait for citing info to load
//         await page.waitForSelector('div[data-test-id="total-citations-stat"] a', {
//             visible: true,
//             timeout: 30000,
//         });

//         // Get citing link
//         const citingLink = await page.evaluate(() => {
//             const linkElement = document.querySelector(
//                 "div[data-test-id='total-citations-stat'] a"
//             );
//             return linkElement ? linkElement.href.trim() : null;
//         });

//         if (!citingLink) {
//             console.error('Citing link not found.');
//             return 0;
//         }

//         console.log(`Citing link found: ${citingLink}`);

//         // Navigate to the citing page
//         await page.goto(citingLink, {
//             waitUntil: 'networkidle2',
//             timeout: 600000,
//         });

//         // Wait for the citing authors section to load
//         await page.waitForSelector("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list'] a span", {
//             visible: true,
//             timeout: 300000,
//         });

//         // Extract citing authors
//         const citingAuthors = await page.evaluate(() => {
//             const authorsList = [];
//             document
//                 .querySelectorAll("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list']")
//                 .forEach((el) => {
//                     authorsList.push(el.innerText.trim());
//                 });
//             return authorsList;
//         });

//         console.log(`Citing authors extracted: ${citingAuthors}`);

//         // Count self-citations
//         // const selfCitationsCount = citingAuthors.filter((author) =>
//         //     authors.includes(author)
//         // ).length;

//         const normalizeName = (name) => {
//             return name
//                 .toLowerCase()
//                 .replace(/[^a-z\s]/g, '') // Remove special characters
//                 .split(/\s+/) // Split by spaces
//                 .map((part, index, arr) =>
//                     index === arr.length - 1 ? part : part.charAt(0) // Keep last name, use initials for others
//                 )
//                 .join(' ');
//         };

//         const normalizedAuthors = authors.map(normalizeName);
//         const normalizedCitingAuthors = citingAuthors.map(normalizeName);

//         const selfCitationsCount = normalizedCitingAuthors.filter((author) =>
//             normalizedAuthors.includes(author)
//         ).length;


//         console.log(`Self-citations found: ${selfCitationsCount}`);
//         return selfCitationsCount;
//     } catch (error) {
//         console.error(`Error fetching data from ${link}:`, error);
//         return 0;
//     } finally {
//         // Ensure the browser is closed
//         if (browser) await browser.close();
//     }
// }

// // API endpoint for publications
// router.get('/api/publications', (req, res) => {
//     const results = [];
//     console.log(__dirname, '../data/scopus.csv')
//     fs.createReadStream(path.join(__dirname, '../data/scopus.csv'))
//         .pipe(csv())
//         .on('data', (data) => results.push(data))
//         .on('end', async () => {
//             for (var result of results) {
//                 result['self-citation'] = await calculateSelfCitations(result['Title']);
//             }
//             res.json(results);
//         });
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const puppeteer = require('puppeteer');

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

async function calculateSelfCitations(publicationTitle) {
    const link = `https://www.semanticscholar.org/search?q=${publicationTitle}`;
    var authors = ["Kartick Chandra Mondal"];
    if (!link) return 0;

    let browser;
    try {
        console.log(`Scraping data from: ${link}`);
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
        );
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('div[data-test-id="total-citations-stat"] a', {
            visible: true,
            timeout: 30000,
        });

        const citingLink = await page.evaluate(() => {
            const linkElement = document.querySelector(
                "div[data-test-id='total-citations-stat'] a"
            );
            return linkElement ? linkElement.href.trim() : null;
        });

        if (!citingLink) {
            console.error('Citing link not found.');
            return 0;
        }

        console.log(`Citing link found: ${citingLink}`);
        await page.goto(citingLink, { waitUntil: 'networkidle2', timeout: 600000 });

        await page.waitForSelector("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list'] a span", {
            visible: true,
            timeout: 300000,
        });

        const citingAuthors = await page.evaluate(() => {
            const authorsList = [];
            document
                .querySelectorAll("div.paper-detail-content-card[data-test-id='cited-by'] span[data-test-id='author-list']")
                .forEach((el) => {
                    authorsList.push(el.innerText.trim());
                });
            return authorsList;
        });

        console.log(`Citing authors extracted: ${citingAuthors}`);

        const normalizeName = (name) => {
            return name
                .toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .map((part, index, arr) =>
                    index === arr.length - 1 ? part : part.charAt(0)
                )
                .join(' ');
        };

        const normalizedAuthors = authors.map(normalizeName);
        const normalizedCitingAuthors = citingAuthors.map(normalizeName);

        const selfCitationsCount = normalizedCitingAuthors.filter((author) =>
            normalizedAuthors.includes(author)
        ).length;

        console.log(`Self-citations found: ${selfCitationsCount}`);
        return selfCitationsCount;
    } catch (error) {
        console.error(`Error fetching data from ${link}:`, error);
        return 0;
    } finally {
        if (browser) await browser.close();
    }
}

// Handle CSV file upload and process data
router.get('/api/publications', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            for (let result of results) {
                result['self-citation'] = await calculateSelfCitations(result['Title']);
            }
            res.json(results);
            fs.unlinkSync(filePath); // Delete the uploaded file after processing
        });
});

module.exports = router;
