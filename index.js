const PORT = process.env.PORT || 8000
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

// ✅ Debugging: Log Environment Variable (Removed for production)
// console.log("Server is running. ENV KEY:", process.env.RAPIDAPI_KEY || "NOT SET");

// ✅ Debugging: Log incoming request headers (Removed for production)
// app.use((req, res, next) => {
//     console.log("Incoming request headers:", req.headers);
//     next();
// });

const newspapers = [
    { name: 'cityam', address: 'https://www.cityam.com/london-must-become-a-world-leader-on-climate-change-action/', base: 'https://www.cityam.com' },
    { name: 'thetimes', address: 'https://www.thetimes.co.uk/environment/climate-change', base: 'https://www.thetimes.co.uk' },
    { name: 'guardian', address: 'https://www.theguardian.com/environment/climate-crisis', base: 'https://www.theguardian.com' },
    { name: 'telegraph', address: 'https://www.telegraph.co.uk/climate-change', base: 'https://www.telegraph.co.uk' },
    { name: 'nyt', address: 'https://www.nytimes.com/international/section/climate', base: 'https://www.nytimes.com' },
    { name: 'latimes', address: 'https://www.latimes.com/environment', base: 'https://www.latimes.com' },
    { name: 'smh', address: 'https://www.smh.com.au/environment/climate-change', base: 'https://www.smh.com.au' },
    //{ name: 'un', address: 'https://www.un.org/climatechange', base: 'https://www.un.org' },
    //{ name: 'bbc', address: 'https://www.bbc.co.uk/news/science_and_environment', base: 'https://www.bbc.co.uk' },
    { name: 'es', address: 'https://www.standard.co.uk/topic/climate-change', base: 'https://www.standard.co.uk' },
    { name: 'sun', address: 'https://www.thesun.co.uk/topic/climate-change-environment/', base: 'https://www.thesun.co.uk' },
    { name: 'dm', address: 'https://www.dailymail.co.uk/news/climate_change_global_warming/index.html', base: 'https://www.dailymail.co.uk' },
    { name: 'nyp', address: 'https://nypost.com/tag/climate-change/', base: 'https://nypost.com' }
];

app.use((req, res, next) => {
    const apiKey = req.headers['x-rapidapi-proxy-secret']; // Get API key from request header
    // ✅ Debugging: Log received API key (Removed for production)
    // console.log("Received API Key:", apiKey);
    // console.log("Expected API Key:", process.env.RAPIDAPI_KEY || "NOT SET");

    if (!apiKey || apiKey !== process.env.RAPIDAPI_KEY) {
        return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
    next();
});


app.get('/', (req, res) => {
    res.json('Welcome to Climate Change News Scraper API');
});

// Fetch all news from all sources
app.get('/news', async (req, res) => {
    const articles = await fetchAllNews();
    res.json(articles);
});

// Fetch news from a specific source
app.get('/news/:newspaperId', async (req, res) => {
    const newspaperId = req.params.newspaperId.toLowerCase();
    const newspaper = newspapers.find(n => n.name === newspaperId);

    if (!newspaper) {
        return res.status(404).json({ error: 'Newspaper not found' });
    }

    const articles = await fetchNewsFromSource(newspaper);
    res.json(articles);
});

// Function to fetch all news from all sources
async function fetchAllNews() {
    const articles = [];

    await Promise.all(
        newspapers.map(async (newspaper) => {
            const news = await fetchNewsFromSource(newspaper);
            articles.push(...news);
        })
    );

    return articles;
}

// Function to scrape news from a single source
async function fetchNewsFromSource(newspaper) {
    try {
        const response = await axios.get(newspaper.address);
        const html = response.data;
        const $ = cheerio.load(html);
        const articles = [];

        $('a').each(function () {
            let url = $(this).attr('href');

            if (url && url.includes('climate')) {
                const title = $(this).attr('aria-label') || $(this).text().trim() || "Title not available";

                // Ensure URL is absolute
                if (!url.startsWith('http')) {
                    url = newspaper.base + url;
                }

                articles.push({ source: newspaper.name, title, url });
            }
        });

        return articles;
    } catch (error) {
        console.error(`Error scraping ${newspaper.name}:`, error.message);
        return [];
    }
}

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
