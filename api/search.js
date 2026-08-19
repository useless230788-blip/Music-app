export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ error: "Query is required" });

    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=true&q=${encodeURIComponent(q)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.jiosaavn.com/'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `JioSaavn API error: ${response.statusText}` });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
}
