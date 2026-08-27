export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    // Using the NEW webapi.get endpoint for searching
    const url = `https://www.jiosaavn.com/api.php?__call=webapi.get&_format=json&_marker=0&context=android&token=${encodeURIComponent(q)}&type=song&p=1&n=20`;

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
        
        // Extract the songs array from the new format
        let songs = data?.songs?.results || [];
        
        // Safely parse more_info if JioSaavn returned it as a string
        songs.forEach(song => {
            if (song.more_info && typeof song.more_info === 'string') {
                try { song.more_info = JSON.parse(song.more_info); } catch(e) {}
            }
        });
        
        res.status(200).json({ results: songs });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to fetch songs" });
    }
}
