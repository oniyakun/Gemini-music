import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Loader2, FileAudio, FileImage, FileText, AlertTriangle } from 'lucide-react';
import { processLyricsWithGemini } from '../services/geminiService';
import { Track, LyricLine } from '../types';
import { getDominantColor, fileToBase64 } from '../utils';

interface UploadModalProps {
  onClose: () => void;
  onTrackCreated: (track: Track) => void;
}

const MAX_FILE_SIZE_MB = 18; // Safe limit for browser-based base64 payload

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onTrackCreated }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing'>('upload');
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [lyricsText, setLyricsText] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        const file = e.target.files[0];
        
        // Check file size immediately
        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb > MAX_FILE_SIZE_MB) {
            setError(`File is too large (${sizeInMb.toFixed(1)}MB). Max size is ${MAX_FILE_SIZE_MB}MB for AI sync.`);
            setAudioFile(null);
            return;
        }

        setError(null);
        setAudioFile(file);
        // Extract basic metadata filename
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleProcess = async () => {
    if (!audioFile) return;
    setLoading(true);
    setStep('processing');
    setError(null);

    try {
        setProcessingStatus('Analyzing Audio Duration...');
        const audioUrl = URL.createObjectURL(audioFile);
        
        // Get Duration
        const duration = await new Promise<number>((resolve) => {
            audioRef.current.src = audioUrl;
            audioRef.current.onloadedmetadata = () => {
                resolve(audioRef.current.duration);
            };
        });

        // Handle Cover
        setProcessingStatus('Processing Artwork...');
        let coverUrl = 'https://picsum.photos/400/400';
        let dominantColor = '#333333';
        
        if (coverFile) {
            coverUrl = URL.createObjectURL(coverFile);
            dominantColor = await getDominantColor(coverUrl);
        }

        // Handle Lyrics with Gemini
        setProcessingStatus('Gemini is listening (this may take a moment)...');
        let processedLyrics: LyricLine[] = [];
        
        if (lyricsText.trim()) {
            // We enforce the size limit at selection, so we can safely convert here.
            const audioBase64 = await fileToBase64(audioFile);
            
            try {
                processedLyrics = await processLyricsWithGemini(lyricsText, duration, audioBase64, audioFile.type);
            } catch (err: any) {
                console.error("Gemini Error:", err);
                throw new Error("AI Sync failed. " + (err.message || "Unknown error"));
            }
        }

        const newTrack: Track = {
            id: crypto.randomUUID(),
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist',
            audioUrl,
            coverUrl,
            duration,
            lyrics: processedLyrics,
            dominantColor
        };

        onTrackCreated(newTrack);
        onClose();

    } catch (error: any) {
        console.error(error);
        setError(error.message || 'Error occurred during processing.');
        setStep('upload');
        setLoading(false);
    }
  };

  if (step === 'processing') {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-[#1c1c1e] p-8 rounded-2xl flex flex-col items-center max-w-sm w-full border border-white/10">
                  <div className="relative">
                    <Sparkles className="text-rose-500 animate-pulse" size={48} />
                    <div className="absolute inset-0 bg-rose-500 blur-xl opacity-20"></div>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-white">Gemini Magic</h3>
                  <p className="mt-2 text-gray-400 text-center text-sm">{processingStatus}</p>
                  <Loader2 className="mt-6 animate-spin text-gray-500" />
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#2c2c2e]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-rose-500" />
            Upload Track
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
            
            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm">
                    <AlertTriangle size={18} />
                    {error}
                </div>
            )}

            {/* Metadata Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#2c2c2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500 transition-colors"
                        placeholder="Song Title"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Artist</label>
                    <input 
                        type="text" 
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className="w-full bg-[#2c2c2e] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-rose-500 transition-colors"
                        placeholder="Artist Name"
                    />
                </div>
            </div>

            {/* File Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Audio Upload */}
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${audioFile ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 hover:border-white/30'}`}>
                    <FileAudio size={32} className={audioFile ? "text-rose-500" : "text-gray-400"} />
                    <span className="mt-2 text-sm text-gray-300 font-medium truncate max-w-full px-2">
                        {audioFile ? audioFile.name : "Select Audio File"}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">Max 18MB</span>
                    <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={handleAudioChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        style={{ height: '0', position: 'relative' }} 
                    />
                     <label className="mt-2 text-xs text-rose-400 cursor-pointer hover:underline">
                        Choose File
                        <input type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
                    </label>
                </div>

                {/* Cover Upload */}
                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${coverFile ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 hover:border-white/30'}`}>
                    {coverFile ? (
                        <img src={URL.createObjectURL(coverFile)} className="w-16 h-16 object-cover rounded shadow mb-2" alt="Preview"/>
                    ) : (
                        <FileImage size={32} className="text-gray-400" />
                    )}
                    <span className="mt-2 text-sm text-gray-300 font-medium truncate max-w-full px-2">
                        {coverFile ? "Change Artwork" : "Select Artwork"}
                    </span>
                    <label className="mt-2 text-xs text-rose-400 cursor-pointer hover:underline">
                        Choose File
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                    </label>
                </div>
            </div>

            {/* Lyrics Input */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-gray-400">Raw Lyrics</label>
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                        <Sparkles size={12} /> Gemini will listen & sync
                    </span>
                </div>
                <textarea 
                    value={lyricsText}
                    onChange={(e) => setLyricsText(e.target.value)}
                    className="w-full h-32 bg-[#2c2c2e] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors text-sm font-mono"
                    placeholder="Paste your lyrics here..."
                ></textarea>
            </div>

            {/* Action */}
            <button 
                onClick={handleProcess}
                disabled={!audioFile || !!error}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                    ${(audioFile && !error) ? 'bg-gradient-to-r from-rose-500 to-orange-500 hover:scale-[1.01] shadow-lg shadow-rose-900/20 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                `}
            >
                <Sparkles size={20} />
                <span>Process & Add to Library</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;