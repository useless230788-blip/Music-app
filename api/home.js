export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const categories = [
        { name: "Trending Now", q: "Top Hits 2024" },
        { name: "Romantic", q: "Romantic Songs" },
        { name: "Bollywood", q: "Bollywood Hits" },
        { name: "Workout", q: "Workout Music" },
        { name: "Party", q: "Party Hits" }
    ];

    try {
        const promises = categories.map(async (cat) => {
            // Using the autocomplete endpoint
            const url = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&query=${encodeURIComponent(cat.q)}`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://www.jiosaavn.com/'
                }
            });
            const data = await response.json();
            let songs = data?.songs?.data || [];
            
            return { name: cat.name, songs: songs.slice(0, 10) };
        });
        
        const results = await Promise.all(promises);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch home data" });
    }
}
