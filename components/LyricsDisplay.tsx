import React, { useEffect, useRef } from 'react';
import { LyricLine, Track } from '../types';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  track: Track;
  isVisible: boolean;
  backgroundColor: string;
  offset: number; // Global offset passed down
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ 
  lyrics, 
  currentTime, 
  track, 
  isVisible,
  backgroundColor,
  offset,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineIndex = useRef<number>(0);

  // Apply global offset to current time to shift lyrics relative to audio
  const effectiveTime = currentTime + offset;

  // Find active line
  const currentLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return effectiveTime >= line.time && (!nextLine || effectiveTime < nextLine.time);
  });

  useEffect(() => {
    if (currentLineIndex !== -1 && scrollRef.current) {
        const lineElement = document.getElementById(`lyric-line-${currentLineIndex}`);
        if (lineElement) {
            // Scroll to center
            lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        activeLineIndex.current = currentLineIndex;
    }
  }, [currentLineIndex, isVisible]);

  if (!isVisible) return null;

  return (
    <div 
        className="absolute inset-0 z-40 overflow-hidden flex flex-row group/container bg-black/30 backdrop-blur-2xl"
    >
        {/* Dynamic Background Override - lighter radial gradient to let blobs show through */}
        <div 
            className="absolute inset-0 opacity-30 z-0 transition-colors duration-1000"
            style={{
                background: `radial-gradient(circle at 50% 50%, ${backgroundColor} 0%, transparent 60%)`
            }}
        ></div>

        {/* Left Side: Album Art (Desktop) */}
        <div className="hidden md:flex flex-col justify-center items-center w-5/12 h-full p-12 relative z-10">
            <div className="w-[350px] h-[350px] shadow-2xl rounded-lg overflow-hidden relative transform transition-transform duration-700 hover:scale-105 border border-white/10">
                <img src={track.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            </div>
            <div className="mt-8 text-center max-w-[400px]">
                <h1 className="text-3xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{track.title}</h1>
                <p className="text-xl text-white/70 font-medium drop-shadow-md">{track.artist}</p>
            </div>
        </div>

        {/* Right Side: Lyrics */}
        <div className="w-full md:w-7/12 h-full relative z-10">
            <div 
                ref={scrollRef}
                className="h-full overflow-y-auto px-8 md:px-24 py-[50vh] no-scrollbar space-y-10"
                style={{ 
                    scrollBehavior: 'smooth',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
                }}
            >
                {lyrics.length > 0 ? lyrics.map((line, index) => {
                    const isActive = index === currentLineIndex;
                    const distance = Math.abs(index - currentLineIndex);
                    
                    // Blur logic
                    let blurAmount = 0;
                    let scale = 1;
                    let opacity = 1;

                    if (!isActive) {
                        blurAmount = Math.min(distance * 1.5, 8); 
                        scale = Math.max(1 - (distance * 0.05), 0.85);
                        opacity = Math.max(0.6 - (distance * 0.15), 0.1);
                    } else {
                        scale = 1.1; // Active line pops out
                    }

                    return (
                        <div 
                            key={index} 
                            id={`lyric-line-${index}`}
                            className="lyric-line origin-left cursor-pointer transform-gpu"
                            style={{
                                filter: `blur(${blurAmount}px)`,
                                transform: `scale(${scale})`,
                                opacity: opacity
                            }}
                            onClick={() => {
                                // Keep generic click handler if needed later
                            }}
                        >
                            <p className={`font-bold leading-tight drop-shadow-md ${isActive ? 'text-white text-4xl md:text-5xl' : 'text-white text-3xl md:text-4xl'}`}>
                                {line.text}
                            </p>
                            {line.translation && isActive && (
                                <p className="text-xl md:text-2xl text-rose-300 mt-3 font-medium opacity-90 drop-shadow-sm">
                                    {line.translation}
                                </p>
                            )}
                        </div>
                    );
                }) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-white/30 text-2xl font-bold">Instrumental / No Lyrics</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default LyricsDisplay;