import type { MusicEmbed } from "@/lib/music";

// The provider's own player in an iframe. Sits above the card's stretched
// link (relative z-10) so play/pause works without opening the post.
export default function MusicPlayer({ embed }: { embed: MusicEmbed }) {
  return (
    <iframe
      src={embed.src}
      title={`${embed.provider} player`}
      height={embed.height}
      loading="lazy"
      allow="autoplay *; clipboard-write; encrypted-media *; fullscreen; picture-in-picture"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      className="relative z-10 mt-2 w-full max-w-md rounded-xl border-0"
    />
  );
}
