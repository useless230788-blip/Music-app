<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Saavnify Music Player</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: #121212; color: #ffffff; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        header { padding: 20px; background-color: #181818; display: flex; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        header h1 { color: #1DB954; margin-right: 30px; font-size: 1.5rem; }
        .search-box { flex: 1; display: flex; gap: 10px; }
        .search-box input { flex: 1; padding: 12px 15px; border: none; border-radius: 30px; background-color: #282828; color: #fff; font-size: 1rem; outline: none; }
        .search-box button { padding: 12px 25px; border: none; border-radius: 30px; background-color: #1DB954; color: #000; font-weight: bold; cursor: pointer; }

        main { flex: 1; overflow-y: auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
        .card { background-color: #181818; padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.2s; text-align: center; }
        .card:hover { background-color: #282828; }
        .card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .card h3 { font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .card p { font-size: 0.8rem; color: #b3b3b3; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .loading { text-align: center; padding: 40px; color: #b3b3b3; }

        .player { background-color: #000000; padding: 15px 30px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #282828; height: 90px; }
        .now-playing { display: flex; align-items: center; gap: 15px; width: 25%; }
        .now-playing img { width: 56px; height: 56px; border-radius: 4px; object-fit: cover; }
        .track-info h4 { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-info p { font-size: 0.75rem; color: #b3b3b3; }
        
        .controls { display: flex; flex-direction: column; align-items: center; width: 50%; gap: 5px; }
        .buttons { display: flex; gap: 20px; align-items: center; }
        .buttons button { background: none; border: none; color: #b3b3b3; font-size: 1.2rem; cursor: pointer; }
        .buttons .play-btn { color: #fff; font-size: 1.5rem; }
        .progress-container { display: flex; align-items: center; gap: 10px; width: 100%; }
        .progress-bar { flex: 1; height: 4px; background-color: #404040; border-radius: 2px; cursor: pointer; position: relative; }
        .progress-bar:hover .progress-filled { background-color: #1DB954; }
        .progress-filled { height: 100%; background-color: #b3b3b3; border-radius: 2px; width: 0%; transition: width 0.1s linear; }
        .time { font-size: 0.75rem; color: #b3b3b3; }

        .volume-container { width: 25%; display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
    </style>
</head>
<body>

    <header>
        <h1>🎵 Saavnify</h1>
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search songs..." value="Top Hits">
            <button onclick="searchSongs()">Search</button>
        </div>
    </header>

    <main>
        <div id="results" class="grid"></div>
    </main>

    <footer class="player">
        <div class="now-playing">
            <img id="currentImg" src="https://via.placeholder.com/56" alt="">
            <div class="track-info">
                <h4 id="currentTitle">Select a Song</h4>
                <p id="currentArtist">-</p>
            </div>
        </div>
        <div class="controls">
            <div class="buttons">
                <button> 🔀 </button>
                <button class="play-btn" onclick="togglePlay()">▶️</button>
                <button> 🔁 </button>
            </div>
            <div class="progress-container">
                <span class="time" id="currentTime">0:00</span>
                <div class="progress-bar" id="progressBar" onclick="seek(event)">
                    <div class="progress-filled" id="progressFilled"></div>
                </div>
                <span class="time" id="duration">0:00</span>
            </div>
        </div>
        <div class="volume-container">
            <span>🔊</span>
        </div>
    </footer>

    <audio id="audioPlayer"></audio>

    <script>
        const audioPlayer = document.getElementById('audioPlayer');
        const playBtn = document.querySelector('.play-btn');
        let currentQueue = [];
        let currentIndex = 0;

        function formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' + sec : sec}`;
        }

        async function searchSongs() {
            const query = document.getElementById('searchInput').value;
            if(!query) return;
            
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<div class="loading">Loading...</div>';

            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error("Failed to fetch search results");
                
                const data = await res.json();
                const songs = data.results || [];
                
                if(songs.length === 0) {
                    resultsDiv.innerHTML = '<div class="loading">No songs found.</div>';
                    return;
                }

                currentQueue = songs;
                resultsDiv.innerHTML = '';
                
                songs.forEach((song, index) => {
                    const title = song.title ? song.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown';
                    const artist = song.primary_artists ? song.primary_artists.replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown Artist';
                    
                    let img = song.image || ''; 
                    if (img && img.includes('150x150')) img = img.replace('150x150', '500x500');

                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <img src="${img}" alt="${title}" onerror="this.src='https://via.placeholder.com/150'">
                        <h3>${title}</h3>
                        <p>${artist}</p>
                    `;
                    card.onclick = () => playSong(index);
                    resultsDiv.appendChild(card);
                });
            } catch (error) {
                console.error("Error:", error);
                resultsDiv.innerHTML = '<div class="loading">Error loading songs.</div>';
            }
        }

        async function playSong(index) {
            currentIndex = index;
            const song = currentQueue[index];
            
            document.getElementById('currentTitle').innerText = song.title ? song.title.replace(/&quot;/g, '"') : 'Unknown';
            document.getElementById('currentArtist').innerText = song.primary_artists ? song.primary_artists.replace(/&quot;/g, '"') : 'Unknown';
            
            let img = song.image || '';
            if (img && img.includes('150x150')) img = img.replace('150x150', '500x500');
            document.getElementById('currentImg').src = img;

            playBtn.innerText = '⏳';

            try {
                // Try to get the URL from the search results, OR use the song ID as a fallback
                const encryptedUrl = song?.more_info?.encrypted_media_url || song?.encrypted_media_url;
                const songId = song?.id;
                
                if (!encryptedUrl && !songId) {
                    alert("Error: Cannot find data to play this song.");
                    playBtn.innerText = '▶️';
                    return;
                }

                // Build the fetch URL
                let fetchUrl = '/api/song?';
                if (encryptedUrl) {
                    fetchUrl += `url=${encodeURIComponent(encryptedUrl)}`;
                } else if (songId) {
                    fetchUrl += `song_id=${encodeURIComponent(songId)}`;
                }

                const res = await fetch(fetchUrl);
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    alert("Server Error: " + (errorData.error || "Failed"));
                    playBtn.innerText = '▶️';
                    return;
                }

                const data = await res.json();
                
                if(data.auth_url) {
                    audioPlayer.src = data.auth_url;
                    audioPlayer.play().catch(e => alert("Press the Play button manually."));
                    playBtn.innerText = '⏸️';
                } else {
                    alert("Error: API did not return a valid auth_url.");
                    playBtn.innerText = '▶️';
                }
            } catch (error) {
                alert("Error playing song: " + error.message);
                playBtn.innerText = '▶️';
            }
        }

        function togglePlay() {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playBtn.innerText = '⏸️';
            } else {
                audioPlayer.pause();
                playBtn.innerText = '▶️';
            }
        }

        audioPlayer.addEventListener('timeupdate', () => {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
            document.getElementById('progressFilled').style.width = percent + '%';
            document.getElementById('currentTime').innerText = formatTime(audioPlayer.currentTime);
            document.getElementById('duration').innerText = formatTime(audioPlayer.duration);
        });

        function seek(e) {
            const progressBar = document.getElementById('progressBar');
            const clickX = (e.offsetX / progressBar.offsetWidth);
            audioPlayer.currentTime = clickX * audioPlayer.duration;
        }

        audioPlayer.addEventListener('ended', () => {
            if (currentIndex < currentQueue.length - 1) {
                playSong(currentIndex + 1);
            }
        });

        window.onload = searchSongs;
    </script>
</body>
</html>
