const fs = require('fs');
let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

// Replace state
let t1 = `  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);`;
let r1 = `  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [waveTracks, setWaveTracks] = useState<(Track & { growth: number })[]>([]);`;
code = code.replace(t1, r1);

// Replace load
let t2 = `      const [allTracks, allArtists, allPlaylists] = await Promise.all([
        api.getTracks(),
        api.getArtists(),
        api.getPublicPlaylists(),
      ]);
      setTracks(allTracks);
      setArtists(allArtists);
      setPlaylists(allPlaylists);`;
let r2 = `      const [allTracks, allArtists, allPlaylists, wave] = await Promise.all([
        api.getTracks(),
        api.getArtists(),
        api.getPublicPlaylists(),
        api.getWaveTracks(),
      ]);
      setTracks(allTracks);
      setArtists(allArtists);
      setPlaylists(allPlaylists);
      setWaveTracks(wave);`;
code = code.replace(t2, r2);

fs.writeFileSync('src/views/HomeView.tsx', code);
