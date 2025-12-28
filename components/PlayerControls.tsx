import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, MessageSquareQuote, ListMusic, Bug } from 'lucide-react';
import { Track } from '../types';
import { formatTime } from '../utils';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  toggleLyrics: () => void;
  showLyrics: boolean;
  toggleDebug: () => void;
  showDebug: boolean;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  onVolumeChange,
  onPlayPause,
  onSeek,
  toggleLyrics,
  showLyrics,
  toggleDebug,
  showDebug
}) => {
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-[90px] bg-[#1c1c1e]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-6 absolute bottom-0 w-full z-50">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        {currentTrack ? (
          <>
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-800 shadow-lg relative group">
              <img src={currentTrack.coverUrl} alt="Album Art" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{currentTrack.title}</span>
              <span className="text-xs text-gray-400 truncate">{currentTrack.artist}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-gray-800 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-gray-800 rounded animate-pulse"></div>
              <div className="w-16 h-2 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Progress */}
      <div className="flex flex-col items-center w-1/3 gap-1">
        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={onPlayPause}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>
        
        <div className="w-full max-w-md flex items-center gap-3 text-xs text-gray-400 font-mono mt-1">
          <span className="w-8 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1 bg-gray-700 rounded-full group cursor-pointer">
             <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
             />
             <div 
                className="absolute top-0 left-0 h-full bg-gray-500 rounded-full group-hover:bg-rose-500 transition-colors"
                style={{ width: `${progress}%` }}
             ></div>
             {/* Scrubber Knob */}
             <div 
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progress}%` }}
             ></div>
          </div>
          <span className="w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Toggles */}
      <div className="flex items-center justify-end gap-4 w-1/3">
        <button 
            onClick={toggleDebug}
            className={`p-2 rounded-lg transition-all ${showDebug ? 'bg-red-500/20 text-red-500' : 'text-gray-600 hover:text-red-400'}`}
            title="Debug Timestamps"
        >
          <Bug size={18} />
        </button>

        <button 
            onClick={toggleLyrics}
            className={`p-2 rounded-lg transition-all ${showLyrics ? 'bg-gray-700 text-rose-500' : 'text-gray-400 hover:text-white'}`}
            title="Lyrics"
        >
          <MessageSquareQuote size={20} />
        </button>
        
        <div className="flex items-center gap-2 group w-28">
           <Volume2 size={18} className="text-gray-400" />
           <div className="relative flex-1 h-1 bg-gray-700 rounded-full cursor-pointer">
             <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
             />
             <div 
               className="absolute top-0 left-0 h-full bg-gray-400 group-hover:bg-white transition-colors rounded-full"
               style={{ width: `${volume * 100}%` }}
             ></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;