import React from 'react';
import { X, AlertCircle, Plus, Minus, Sparkles, Loader2, Video } from 'lucide-react';
import { Track } from '../types';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  globalOffset: number;
  onGlobalOffsetChange: (offset: number) => void;
  onLyricUpdate: (trackId: string, lineIndex: number, newTime: number) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onExportVideo: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
    isOpen, 
    onClose, 
    track, 
    currentTime, 
    globalOffset,
    onGlobalOffsetChange,
    onLyricUpdate,
    onRegenerate,
    isRegenerating,
    onExportVideo
}) => {
  if (!isOpen) return null;

  const effectiveTime = currentTime + globalOffset;

  // Find current active index for debugging
  const activeIndex = track?.lyrics.findIndex((line, index) => {
    const nextLine = track.lyrics[index + 1];
    return effectiveTime >= line.time && (!nextLine || effectiveTime < nextLine.time);
  });

  return (
    <div className="fixed top-20 right-8 z-[60] w-[450px] bg-[#121212]/95 border border-white/10 shadow-2xl rounded-xl backdrop-blur-xl flex flex-col max-h-[85vh] font-mono text-xs">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-xl">
        <h3 className="font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} />
            Timing Studio
        </h3>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
        
        {/* Actions Area */}
        <div className="bg-black/40 p-3 rounded border border-white/10 mb-2 space-y-2">
            <button
                onClick={onRegenerate}
                disabled={isRegenerating || !track}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition-all
                    ${isRegenerating 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20'}
                `}
            >
                {isRegenerating ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Gemini is listening...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={14} />
                        <span>Regenerate Lyrics (AI)</span>
                    </>
                )}
            </button>
            
            <button
                onClick={onExportVideo}
                disabled={!track}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
            >
                <Video size={14} />
                <span>Export to Video (MP4/WebM)</span>
            </button>
            <p className="text-[10px] text-gray-500 text-center">
                Generates a clean video file of the lyric visualization.
            </p>
        </div>

        {/* Global Controls */}
        <div className="bg-black/40 p-3 rounded border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Global Offset</span>
                <span className={`text-sm font-bold ${globalOffset !== 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                    {globalOffset > 0 ? '+' : ''}{globalOffset.toFixed(1)}s
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onGlobalOffsetChange(Number((globalOffset - 0.5).toFixed(1)))}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded flex-1 text-white transition-colors"
                >
                    <Minus size={14} className="mx-auto" />
                </button>
                <button 
                    onClick={() => onGlobalOffsetChange(0)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    title="Reset Global Offset"
                >
                    Reset
                </button>
                <button 
                    onClick={() => onGlobalOffsetChange(Number((globalOffset + 0.5).toFixed(1)))}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded flex-1 text-white transition-colors"
                >
                    <Plus size={14} className="mx-auto" />
                </button>
            </div>
            <div className="mt-2 text-[10px] text-gray-500 text-center">
                Applies to entire song playback
            </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/40 p-3 rounded border border-white/10">
                <div className="text-gray-500 mb-1">Current Time</div>
                <div className="text-lg text-white font-bold">{currentTime.toFixed(3)}s</div>
            </div>
            <div className="bg-black/40 p-3 rounded border border-white/10">
                <div className="text-gray-500 mb-1">Effective Time</div>
                <div className="text-lg text-rose-400 font-bold">{effectiveTime.toFixed(3)}s</div>
            </div>
        </div>

        {/* Lyrics Table Editor */}
        <div className="border border-white/10 rounded overflow-hidden flex flex-col">
            <div className="bg-white/5 px-2 py-2 text-gray-400 font-bold border-b border-white/10 flex items-center">
                <span className="w-8 text-center">#</span>
                <span className="w-24 text-center">Start Time</span>
                <span className="flex-1 pl-2">Lyric Line</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-white/5">
                        {track?.lyrics.map((line, idx) => {
                            const isActive = idx === activeIndex;
                            
                            return (
                                <tr 
                                    key={idx} 
                                    className={`group transition-colors ${isActive ? 'bg-rose-500/10' : 'hover:bg-white/5'}`}
                                >
                                    <td className={`p-2 w-8 text-center text-[10px] ${isActive ? 'text-rose-400' : 'text-gray-600'}`}>{idx}</td>
                                    <td className="p-2 w-24">
                                        <div className="flex items-center gap-1 justify-center">
                                            <button 
                                                onClick={() => track && onLyricUpdate(track.id, idx, Number((line.time - 0.1).toFixed(2)))}
                                                className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white"
                                            >
                                                -
                                            </button>
                                            <span className={`font-mono font-bold w-10 text-center ${isActive ? 'text-rose-400' : 'text-gray-300'}`}>
                                                {line.time.toFixed(1)}
                                            </span>
                                            <button 
                                                onClick={() => track && onLyricUpdate(track.id, idx, Number((line.time + 0.1).toFixed(2)))}
                                                className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-2 relative">
                                        <p className={`truncate max-w-[200px] ${isActive ? 'text-white font-medium' : 'text-gray-400'}`} title={line.text}>
                                            {line.text}
                                        </p>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="text-[10px] text-gray-500 text-center">
             Edits are saved automatically for this session.
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;