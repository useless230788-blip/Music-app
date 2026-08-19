export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url: encryptedUrl } = req.query;
    
    if (!encryptedUrl) return res.status(400).json({ error: "URL is required" });

    // Decode HTML entities that JioSaavn sometimes returns in the URL
    const cleanUrl = decodeURIComponent(encryptedUrl).replace(/&amp;/g, '&');
    
    const apiUrl = `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&_format=json&_marker=0&cc=in&url=${encodeURIComponent(cleanUrl)}`;

    try {
        const response = await fetch(apiUrl, {
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
        console.error("Token error:", error);
        res.status(500).json({ error: "Failed to get auth token" });
    }
}
