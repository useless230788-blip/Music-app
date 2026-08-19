export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url: encryptedUrl, song_id } = req.query;
    
    let finalEncryptedUrl = encryptedUrl;

    try {
        // 1. If we don't have the URL, try fetching it using song ID
        if (!finalEncryptedUrl && song_id) {
            const detailsUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&p=${encodeURIComponent(song_id)}&_format=json&_marker=0`;
            const detailsRes = await fetch(detailsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://www.jiosaavn.com/'
                }
            });
            
            const detailsText = await detailsRes.text();
            if (!detailsRes.ok) {
                return res.status(500).json({ error: `Details Network Error: ${detailsText.substring(0, 100)}` });
            }

            try {
                const detailsData = JSON.parse(detailsText);
                finalEncryptedUrl = detailsData.encrypted_media_url || detailsData.more_info?.encrypted_media_url;
            } catch(e) {
                return res.status(500).json({ error: "Details Parse Error: " + detailsText.substring(0, 100) });
            }
        }

        // 2. If we STILL don't have it, return an error
        if (!finalEncryptedUrl) {
            return res.status(400).json({ error: "No playable URL found for this song" });
        }

        // 3. Generate the Auth Token
        const cleanUrl = decodeURIComponent(finalEncryptedUrl).replace(/&amp;/g, '&');
        const apiUrl = `https://www.jiosaavn.com/api.php?__call=song.generateAuthToken&_format=json&_marker=0&cc=in&url=${encodeURIComponent(cleanUrl)}`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.jiosaavn.com/'
            }
        });

        const text = await response.text();
        if (!response.ok) {
            return res.status(500).json({ error: `Auth Network Error: ${text.substring(0, 100)}` });
        }

        try {
            const data = JSON.parse(text);
            if (data.auth_url) {
                res.status(200).json(data);
            } else {
                res.status(500).json({ error: "Auth response missing auth_url: " + text.substring(0, 100) });
            }
        } catch (e) {
            res.status(500).json({ error: "Auth response was not JSON: " + text.substring(0, 100) });
        }
    } catch (error) {
        res.status(500).json({ error: "Server Catch Error: " + error.message });
    }
}
