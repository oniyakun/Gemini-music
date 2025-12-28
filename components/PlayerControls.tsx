import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, MessageSquareQuote, Bug } from 'lucide-react';
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
    <div className="h-[90px] bg-[#1c1c1e]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-6 absolute bottom-0 w-full z-50 transition-all duration-300">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-[30%] min-w-[200px]">
        {currentTrack ? (
          <>
            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-800 shadow-lg relative group border border-white/10">
              <img src={currentTrack.coverUrl} alt="Album Art" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[14px] font-semibold text-white truncate leading-tight mb-0.5">{currentTrack.title}</span>
              <span className="text-[12px] text-gray-400 truncate hover:text-white transition-colors cursor-pointer">{currentTrack.artist}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-white/5 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-3 bg-white/5 rounded animate-pulse"></div>
              <div className="w-16 h-2 bg-white/5 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Progress */}
      <div className="flex flex-col items-center w-[40%] gap-2 max-w-[600px]">
        <div className="flex items-center gap-8">
          <button className="text-gray-400 hover:text-white transition-colors active:scale-95">
            <SkipBack size={24} fill="currentColor" />
          </button>
          <button 
            onClick={onPlayPause}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform active:scale-95 shadow-md"
          >
            {isPlaying ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button className="text-gray-400 hover:text-white transition-colors active:scale-95">
            <SkipForward size={24} fill="currentColor" />
          </button>
        </div>
        
        <div className="w-full flex items-center gap-3 text-[10px] text-gray-500 font-medium font-mono mt-1 group">
          <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1 bg-white/10 rounded-full cursor-pointer overflow-visible">
             <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
             />
             <div 
                className="absolute top-0 left-0 h-full bg-white/30 rounded-full group-hover:bg-rose-500/80 transition-colors"
                style={{ width: `${progress}%` }}
             ></div>
             {/* Scrubber Knob - Apple Style */}
             <div 
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{ left: `${progress}%`, marginLeft: '-6px' }}
             ></div>
          </div>
          <span className="w-8 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Toggles */}
      <div className="flex items-center justify-end gap-3 w-[30%] min-w-[200px]">
        <button 
            onClick={toggleLyrics}
            className={`p-2 rounded-lg transition-all active:scale-95 ${showLyrics ? 'bg-white/20 text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Lyrics"
        >
          <MessageSquareQuote size={20} />
        </button>

        <button 
            onClick={toggleDebug}
            className={`p-2 rounded-lg transition-all active:scale-95 ${showDebug ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:text-red-400 hover:bg-white/10'}`}
            title="Debug Timestamps"
        >
          <Bug size={18} />
        </button>
        
        <div className="flex items-center gap-2 group w-24 pl-2">
           <Volume2 size={18} className="text-gray-400" />
           <div className="relative flex-1 h-1 bg-white/10 rounded-full cursor-pointer">
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