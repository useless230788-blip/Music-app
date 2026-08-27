export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { url: encryptedUrl, song_id } = req.query;
    
    let finalEncryptedUrl = encryptedUrl;

    try {
        if (!finalEncryptedUrl && song_id) {
            let token = song_id;
            if (token.includes('/')) {
                token = token.split('/').pop();
            }
            
            // Use the NEW webapi.get endpoint
            const detailsUrl = `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${encodeURIComponent(token)}&type=song&_format=json&_marker=0`;
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
                
                // Extract URL from the new webapi response format
                if (detailsData.songs && detailsData.songs.length > 0) {
                    finalEncryptedUrl = detailsData.songs[0].more_info?.encrypted_media_url || detailsData.songs[0].encrypted_media_url;
                } else {
                    finalEncryptedUrl = detailsData.encrypted_media_url || detailsData.media_url || detailsData.more_info?.encrypted_media_url;
                }
                
                if (!finalEncryptedUrl) {
                    return res.status(500).json({ error: "WebAPI returned no URL. Raw: " + detailsText.substring(0, 150) });
                }
            } catch(e) {
                return res.status(500).json({ error: "Details Parse Error: " + detailsText.substring(0, 100) });
            }
        }

        if (!finalEncryptedUrl) {
            return res.status(400).json({ error: "No playable URL found for this song" });
        }

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
