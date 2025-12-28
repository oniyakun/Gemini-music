import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PlayerControls from './components/PlayerControls';
import LyricsDisplay from './components/LyricsDisplay';
import UploadModal from './components/UploadModal';
import DebugPanel from './components/DebugPanel';
import VideoExporter from './components/VideoExporter';
import { Track } from './types';
import { processLyricsWithGemini } from './services/geminiService';
import { blobToBase64 } from './utils';

const App: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // Default volume 100%
  const [showLyrics, setShowLyrics] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoExport, setShowVideoExport] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // New state for clean recording mode
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lyricOffset, setLyricOffset] = useState(0); // Global offset in seconds
  const [isRegenerating, setIsRegenerating] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Initialize audio listeners
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  const handleTrackSelect = (track: Track) => {
    if (currentTrack?.id === track.id) {
        // Toggle play/pause
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    } else {
        // New track
        setCurrentTrack(track);
        // Reset offset when changing tracks (optional, but usually safer)
        setLyricOffset(0);
        
        audioRef.current.src = track.audioUrl;
        audioRef.current.volume = volume; // Ensure volume is set
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleTrackCreated = (track: Track) => {
    setTracks(prev => [...prev, track]);
    handleTrackSelect(track);
  };

  const handleVideoExportStart = () => {
     if (currentTrack) {
        // Pause playback before starting export setup
        audioRef.current.pause();
        setIsPlaying(false);
        setShowVideoExport(true);
        setShowDebug(false); // Close debug panel
     }
  };

  // Function to update a specific lyric line timestamp
  const handleLyricUpdate = (trackId: string, lineIndex: number, newTime: number) => {
    // 1. Update in the main tracks list
    setTracks(prevTracks => prevTracks.map(t => {
        if (t.id !== trackId) return t;
        const newLyrics = [...t.lyrics];
        if (newLyrics[lineIndex]) {
            newLyrics[lineIndex] = { ...newLyrics[lineIndex], time: Math.max(0, newTime) };
        }
        return { ...t, lyrics: newLyrics };
    }));

    // 2. Update current track if it's the one being edited
    if (currentTrack?.id === trackId) {
        setCurrentTrack(prev => {
            if (!prev) return null;
            const newLyrics = [...prev.lyrics];
            if (newLyrics[lineIndex]) {
                newLyrics[lineIndex] = { ...newLyrics[lineIndex], time: Math.max(0, newTime) };
            }
            return { ...prev, lyrics: newLyrics };
        });
    }
  };

  // Regenerate lyrics using Gemini
  const handleRegenerateLyrics = async () => {
    if (!currentTrack) return;
    setIsRegenerating(true);

    try {
        // 1. Reconstruct raw text from current lyrics
        const rawText = currentTrack.lyrics.map(l => l.text).join('\n');
        
        // 2. Fetch the audio blob from the blob URL
        const audioResponse = await fetch(currentTrack.audioUrl);
        const audioBlob = await audioResponse.blob();
        const base64Audio = await blobToBase64(audioBlob);

        // 3. Call Gemini
        const newLyrics = await processLyricsWithGemini(
            rawText, 
            currentTrack.duration, 
            base64Audio, 
            audioBlob.type
        );

        // 4. Update state
        setTracks(prevTracks => prevTracks.map(t => {
            if (t.id !== currentTrack.id) return t;
            return { ...t, lyrics: newLyrics };
        }));

        setCurrentTrack(prev => {
            if (!prev) return null;
            return { ...prev, lyrics: newLyrics };
        });

    } catch (error) {
        console.error("Failed to regenerate lyrics:", error);
        alert("Failed to regenerate lyrics. Please check console for details.");
    } finally {
        setIsRegenerating(false);
    }
  };

  // If no track, default to a deep purple/rose combo
  const primaryColor = currentTrack?.dominantColor || '#4c1d95'; 
  
  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Dynamic Fluid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black transition-colors duration-1000">
         {/* Blob 1: Top Left */}
         <div 
            className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full filter blur-[120px] opacity-70 animate-blob-1 transition-colors duration-1000"
            style={{ backgroundColor: primaryColor }}
         ></div>
         {/* Blob 2: Bottom Right */}
         <div 
            className="absolute top-[20%] -right-[10%] w-[90%] h-[90%] rounded-full filter blur-[120px] opacity-60 animate-blob-2 transition-colors duration-1000"
            style={{ backgroundColor: primaryColor }}
         ></div>
         {/* Blob 3: Center/Moving (Adds variation) */}
         <div 
            className="absolute top-[30%] left-[20%] w-[60%] h-[60%] rounded-full filter blur-[100px] opacity-50 animate-blob-3 transition-colors duration-1000"
            style={{ backgroundColor: currentTrack ? primaryColor : '#be123c' }} // Slightly different color for variation
         ></div>
         
         {/* Subtle overlay to barely darken, but keep colors vibrant */}
         <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* 
          CONDITIONAL RENDERING:
          Hide Sidebar if we are recording to make the view clean.
      */}
      {!isRecording && (
        <Sidebar onUploadClick={() => setShowUploadModal(true)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Header - Hide during recording */}
        {!isRecording && (
          <div className="h-16 flex items-center justify-between px-8 bg-transparent">
               <div className="text-sm text-gray-400 font-medium">Welcome Back</div>
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 border border-white/20"></div>
          </div>
        )}

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-8 pb-32 no-scrollbar">
            {!currentTrack && tracks.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-[60vh] text-center z-20 relative">
                    <h2 className="text-4xl font-bold mb-4 drop-shadow-md">Your Library is Empty</h2>
                    <p className="text-gray-300 mb-8 max-w-md drop-shadow-sm">Upload your favorite tracks, add cover art, and let Gemini sync the lyrics automatically.</p>
                    <button 
                        onClick={() => setShowUploadModal(true)}
                        className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
                    >
                        Get Started
                    </button>
                 </div>
            )}

            {tracks.length > 0 && (
                <div>
                    {!isRecording && <h2 className="text-2xl font-bold mb-6 drop-shadow-md">Recently Added</h2>}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {tracks.map(track => (
                            <div 
                                key={track.id}
                                onClick={() => handleTrackSelect(track)}
                                className="group cursor-pointer p-3 rounded-xl bg-black/20 hover:bg-white/10 backdrop-blur-sm border border-white/5 hover:border-white/20 transition-all"
                            >
                                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-2xl transition-all">
                                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                                    {/* Play Overlay */}
                                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${currentTrack?.id === track.id && isPlaying ? 'opacity-100' : ''}`}>
                                        {currentTrack?.id === track.id && isPlaying ? (
                                            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                                 <div className="w-3 h-3 bg-white rounded-sm"></div>
                                                 <div className="w-3 h-3 bg-white rounded-sm ml-1"></div>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                                                <svg className="w-6 h-6 text-white fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-rose-400' : 'text-white'}`}>{track.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Lyrics Overlay - ALWAYS SHOW if recording, or if manually toggled */}
      {currentTrack && (
        <LyricsDisplay 
            lyrics={currentTrack.lyrics}
            currentTime={currentTime}
            track={currentTrack}
            isVisible={showLyrics || isRecording} // Force visible during recording
            backgroundColor={currentTrack.dominantColor || '#1c1c1e'}
            offset={lyricOffset}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal 
            onClose={() => setShowUploadModal(false)}
            onTrackCreated={handleTrackCreated}
        />
      )}

      {/* Video Export Modal */}
      {showVideoExport && currentTrack && (
        <VideoExporter 
            track={currentTrack}
            onClose={() => setShowVideoExport(false)}
            onRecordingStart={() => setIsRecording(true)}
            onRecordingEnd={() => setIsRecording(false)}
            onTimeUpdate={(time) => setCurrentTime(time)} // Sync for lyrics
        />
      )}

      {/* Debug Panel - Hide during recording */}
      {!isRecording && (
        <DebugPanel 
           isOpen={showDebug}
           onClose={() => setShowDebug(false)}
           track={currentTrack}
           currentTime={currentTime}
           globalOffset={lyricOffset}
           onGlobalOffsetChange={setLyricOffset}
           onLyricUpdate={handleLyricUpdate}
           onRegenerate={handleRegenerateLyrics}
           isRegenerating={isRegenerating}
           onExportVideo={handleVideoExportStart}
        />
      )}

      {/* Bottom Player - Hide during recording to remove "Info Bar" */}
      {!isRecording && (
        <PlayerControls 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          toggleLyrics={() => setShowLyrics(!showLyrics)}
          showLyrics={showLyrics}
          toggleDebug={() => setShowDebug(!showDebug)}
          showDebug={showDebug}
        />
      )}
    </div>
  );
};

export default App;