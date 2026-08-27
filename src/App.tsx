import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { RouteState, Track } from './types';
import { Navbar } from './components/Navbar';
import { AudioPlayer } from './components/AudioPlayer';
import { PlaylistModal } from './components/PlaylistModal';
import { EditTrackModal } from './components/EditTrackModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ShareToast } from './components/ShareToast';
import { AuthModal } from './views/AuthModal';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { TrackView } from './views/TrackView';
import { ArtistView } from './views/ArtistView';
import { ProfileView } from './views/ProfileView';
import { BecomeArtistView } from './views/BecomeArtistView';
import { UploadTrackView } from './views/UploadTrackView';
import { PlaylistView } from './views/PlaylistView';
import { AdminView } from './views/admin/AdminView';
import { api } from './lib/api';

import { usePlayer } from './context/PlayerContext';

function MainApp() {
  const [route, setRoute] = useState<RouteState>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#admin' || window.location.pathname.startsWith('/admin')) {
        return { view: 'admin' };
      }
    }
    return { view: 'home' };
  });
  const { currentTrack } = usePlayer();

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setRoute({ view: 'admin' });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modal states
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);

  const [shareToastOpen, setShareToastOpen] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState('Ссылка скопирована');

  // Navigation handlers
  const handleNavigate = (newRoute: RouteState) => {
    setRoute(newRoute);
    if (newRoute.view === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTrack = (id: string) => {
    handleNavigate({ view: 'track', id });
  };

  const handleOpenArtist = (id: string) => {
    handleNavigate({ view: 'artist', id });
  };

  const handleOpenPlaylist = (id: string) => {
    handleNavigate({ view: 'playlist', id });
  };

  // Action modals
  const handleAddToPlaylist = (track: Track) => {
    setPlaylistTrack(track);
    setIsPlaylistModalOpen(true);
  };

  const handleShare = (track: Track) => {
    const url = `${window.location.origin}/?track=${track.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setShareToastMessage('Ссылка скопирована');
    setShareToastOpen(true);
    setTimeout(() => setShareToastOpen(false), 2000);
  };

  const handleEditTrack = (track: Track) => {
    setEditTrack(track);
    setIsEditModalOpen(true);
  };

  const handleDeleteTrack = (track: Track) => {
    setTrackToDelete(track);
  };

  const confirmDeleteTrack = async () => {
    if (!trackToDelete) return;
    setIsDeletingTrack(true);
    try {
      await api.deleteTrack(trackToDelete.id);
      setTrackToDelete(null);
      // If we are on the track page of deleted track, go home
      if (route.view === 'track' && route.id === trackToDelete.id) {
        handleNavigate({ view: 'home' });
      } else {
        // Trigger re-render
        setRoute({ ...route });
      }
      setShareToastMessage('Трек удален');
      setShareToastOpen(true);
      setTimeout(() => setShareToastOpen(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingTrack(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar currentRoute={route} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6 transition-all ${
          currentTrack
            ? 'pb-40 sm:pb-32 md:pb-28'
            : 'pb-24 sm:pb-16 md:pb-12'
        }`}
      >
        {route.view === 'home' && (
          <HomeView
            onOpenTrack={handleOpenTrack}
            onOpenArtist={handleOpenArtist}
            onOpenPlaylist={handleOpenPlaylist}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
          />
        )}

        {route.view === 'search' && (
          <SearchView
            initialQuery={route.query}
            onOpenTrack={handleOpenTrack}
            onOpenArtist={handleOpenArtist}
            onOpenPlaylist={handleOpenPlaylist}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
          />
        )}

        {route.view === 'track' && route.id && (
          <TrackView
            trackId={route.id}
            onOpenTrack={handleOpenTrack}
            onOpenArtist={handleOpenArtist}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
            onEditTrack={handleEditTrack}
            onDeleteTrack={handleDeleteTrack}
          />
        )}

        {route.view === 'artist' && route.id && (
          <ArtistView
            artistId={route.id}
            onOpenTrack={handleOpenTrack}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
          />
        )}

        {route.view === 'profile' && (
          <ProfileView
            onOpenTrack={handleOpenTrack}
            onOpenArtist={handleOpenArtist}
            onOpenPlaylist={handleOpenPlaylist}
            onBecomeArtist={() => handleNavigate({ view: 'become_artist' })}
            onUploadTrack={() => handleNavigate({ view: 'upload_track' })}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
            onEditTrack={handleEditTrack}
            onDeleteTrack={handleDeleteTrack}
            onOpenAdmin={() => handleNavigate({ view: 'admin' })}
          />
        )}

        {route.view === 'admin' && (
          <AdminView
            onNavigateHome={() => handleNavigate({ view: 'home' })}
            onOpenArtistProfile={handleOpenArtist}
          />
        )}

        {route.view === 'become_artist' && (
          <BecomeArtistView
            onSuccess={() => handleNavigate({ view: 'profile' })}
            onNavigateHome={() => handleNavigate({ view: 'home' })}
          />
        )}

        {route.view === 'upload_track' && (
          <UploadTrackView
            onSuccess={(newTrack) => handleNavigate({ view: 'track', id: newTrack.id })}
            onNavigateHome={() => handleNavigate({ view: 'home' })}
          />
        )}

        {route.view === 'playlist' && route.id && (
          <PlaylistView
            playlistId={route.id}
            onOpenTrack={handleOpenTrack}
            onOpenArtist={handleOpenArtist}
            onAddToPlaylist={handleAddToPlaylist}
            onShare={handleShare}
            onNavigateHome={() => handleNavigate({ view: 'home' })}
          />
        )}
      </main>

      {/* Persistent Audio Player at Bottom */}
      <AudioPlayer
        onOpenTrack={handleOpenTrack}
        onOpenArtist={handleOpenArtist}
        onAddToPlaylist={handleAddToPlaylist}
        onShare={handleShare}
      />

      {/* Modals */}
      <AuthModal />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        track={playlistTrack}
        onClose={() => setIsPlaylistModalOpen(false)}
        onAdded={(title) => {
          setShareToastMessage(`Добавлено в «${title}»`);
          setShareToastOpen(true);
          setTimeout(() => setShareToastOpen(false), 2000);
        }}
      />

      <EditTrackModal
        isOpen={isEditModalOpen}
        track={editTrack}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => {
          setShareToastMessage('Изменения сохранены');
          setShareToastOpen(true);
          setTimeout(() => setShareToastOpen(false), 2000);
          setRoute({ ...route });
        }}
      />

      <DeleteConfirmModal
        isOpen={!!trackToDelete}
        title="Удалить трек?"
        description={`Вы действительно хотите безвозвратно удалить композицию «${trackToDelete?.title}»?`}
        confirmText="Удалить"
        cancelText="Отмена"
        isLoading={isDeletingTrack}
        onConfirm={confirmDeleteTrack}
        onCancel={() => setTrackToDelete(null)}
      />

      <ShareToast isOpen={shareToastOpen} message={shareToastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <MainApp />
      </PlayerProvider>
    </AuthProvider>
  );
}
