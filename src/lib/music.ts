// Spotify and Apple Music links → their official embed players.
// Only these two hosts are ever embedded; anything else stays a plain link.

export type MusicEmbed = {
  provider: "Spotify" | "Apple Music";
  src: string;
  height: number;
};

const SPOTIFY_RE =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/;
const APPLE_RE =
  /^https:\/\/music\.apple\.com\/([a-z]{2})\/(album|playlist|song|station)\/[^\s?#]+/;

export function musicEmbed(url: string): MusicEmbed | null {
  const spotify = url.match(SPOTIFY_RE);
  if (spotify) {
    const [, type, id] = spotify;
    // Single tracks/episodes get the compact player; collections the tall one.
    const compact = type === "track" || type === "episode";
    return {
      provider: "Spotify",
      src: `https://open.spotify.com/embed/${type}/${id}`,
      height: compact ? 152 : 352,
    };
  }

  const apple = url.match(APPLE_RE);
  if (apple) {
    const parsed = new URL(url);
    // ?i=<id> on an album link points at one song: compact player.
    const song = apple[2] === "song" || parsed.searchParams.has("i");
    const query = parsed.searchParams.has("i")
      ? `?i=${encodeURIComponent(parsed.searchParams.get("i")!)}`
      : "";
    return {
      provider: "Apple Music",
      src: `https://embed.music.apple.com${parsed.pathname}${query}`,
      height: song ? 175 : 450,
    };
  }

  return null;
}

// The first Spotify/Apple Music link in a post, if any.
export function firstMusicEmbed(text: string): MusicEmbed | null {
  for (const url of text.match(/https:\/\/[^\s<]+/g) ?? []) {
    const embed = musicEmbed(url);
    if (embed) return embed;
  }
  return null;
}
