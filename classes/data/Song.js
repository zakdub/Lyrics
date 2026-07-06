// Shown whenever no real album art can be found from either CoverArtArchive or Last.fm
const DEFAULT_ALBUM_COVER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#333333"/>
            <circle cx="50" cy="50" r="30" fill="#1a1a1a" stroke="#555555" stroke-width="2"/>
            <circle cx="50" cy="50" r="6" fill="#555555"/>
        </svg>
    `);

class Song {
    /**
     * @param {object} songInfo
     * @param {object} lyrics
     */
    constructor(songInfo, lyrics = null) {
        /** @type {string} */
        this.name = songInfo.name;

        /** @type {number} */
        this.durationMs = songInfo.duration ? Number(songInfo.duration) : 0;

        /** @type {Artist[]} */
        this.artists = songInfo.artist ? [new Artist({ name: songInfo.artist.name })] : [];

        /** @type {string} MusicBrainz release id, used to fetch real cover art from CoverArtArchive */
        this.albumMbid = songInfo.album?.mbid || null;

        /** @type {string} Last.fm's own album art url, used as a fallback if CoverArtArchive has nothing */
        this.lastfmCoverUrl = songInfo.album?.image?.[2]?.['#text'] || songInfo.album?.image?.[1]?.['#text'] || songInfo.album?.image?.[0]?.['#text'] || null;

        /** @type {string} */
        this.albumCoverUrl = this.lastfmCoverUrl || DEFAULT_ALBUM_COVER;

        /** @type {bool} */
        this.hasSyncedLyrics = lyrics?.syncedLyrics ? true : false;

        /** @type {Lyric[]} */
        this.lyrics = (lyrics?.syncedLyrics ?? lyrics?.plainLyrics)
            ?.replace(/\n+/g, '\n')
            ?.split('\n')
            ?.map(lyric => new Lyric(lyric));
    }

    /**
     * Tries to replace the placeholder/Last.fm cover with a real one from
     * CoverArtArchive (Last.fm's own album art is often missing or blank).
     * Falls back to whatever was already set if nothing better is found.
     *
     * @param {DataFetcher} fetcher
     */
    async resolveAlbumCover(fetcher) {
        if (!this.albumMbid) return;

        const coverArt = await fetcher.getAlbumCoverArt(this.albumMbid);
        if (coverArt) {
            this.albumCoverUrl = coverArt;
        }
    }

    /**
     * Loads lyrics parameters by scraping them from an API lyrics object
     * @param {object} lyrics
     */
    loadLyrics(lyrics) {
        this.hasSyncedLyrics = lyrics?.syncedLyrics ? true : false;
        this.lyrics = (lyrics?.syncedLyrics ?? lyrics?.plainLyrics)
            ?.replace(/\n+/g, '\n')
            ?.split('\n')
            ?.map(lyric => new Lyric(lyric))
            ?.filter(lyric => lyric.text !== '');
    }
}