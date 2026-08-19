export default async function handler(req, res) {
    const { url: encryptedUrl } = req.query;
    if (!encryptedUrl) return res.status(400).json({ error: "URL is required" });

    const url = `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&_format=json&_marker=0&cc=in&url=${encodeURIComponent(encryptedUrl)}`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Token error:", error);
        res.status(500).json({ error: "Failed to get auth token" });
    }
}
