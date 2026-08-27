import React from 'react';
import { Artist } from '../types';

interface ArtistCardProps {
  artist: Artist;
  onOpenArtist: (id: string) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onOpenArtist }) => {
  return (
    <div
      onClick={() => onOpenArtist(artist.id)}
      className="group flex flex-col items-center text-center p-3 rounded-2xl bg-zinc-50/50 hover:bg-zinc-100/80 transition-all duration-200 cursor-pointer border border-transparent hover:border-zinc-200"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden bg-zinc-200 mb-3 shadow-xs max-w-[130px] border border-zinc-200/80">
        <img
          src={artist.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
          alt={artist.pseudonym}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </div>

      <h4 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-950 transition-colors truncate max-w-full">
        {artist.pseudonym}
      </h4>
      <p className="text-xs text-zinc-500 mt-0.5">
        Артист
      </p>
    </div>
  );
};
