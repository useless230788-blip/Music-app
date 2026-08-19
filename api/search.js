export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=true&q=${encodeURIComponent(q)}`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
}
