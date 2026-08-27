import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-zinc-200/80 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};

export const TrackRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/70 border border-zinc-100/80 gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1 max-w-[200px]">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="h-3 w-10 rounded-md" />
      </div>
    </div>
  );
};

export const ArtistCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-zinc-50/60 border border-zinc-100 flex flex-col items-center text-center space-y-3">
      <Skeleton className="w-24 h-24 rounded-full" />
      <Skeleton className="h-4 w-24 rounded-md" />
      <Skeleton className="h-3 w-16 rounded-md" />
    </div>
  );
};

export const PlaylistCardSkeleton: React.FC = () => {
  return (
    <div className="p-3 rounded-2xl bg-zinc-50/60 border border-zinc-100 space-y-3">
      <Skeleton className="w-full aspect-square rounded-xl" />
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-3 w-1/2 rounded-md" />
    </div>
  );
};
