import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';
import { Monitor, Loader2, StopCircle, Video } from 'lucide-react';

interface VideoExporterProps {
  track: Track;
  onClose: () => void;
  onRecordingStart: () => void;
  onRecordingEnd: () => void;
  onTimeUpdate: (time: number) => void; // New prop to sync UI
}

const VideoExporter: React.FC<VideoExporterProps> = ({ 
  track, 
  onClose,
  onRecordingStart,
  onRecordingEnd,
  onTimeUpdate
}) => {
  const [status, setStatus] = useState<'idle' | 'waiting_for_user' | 'recording' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Refs to manage streams and recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount (e.g. user clicked cancel)
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.ontimeupdate = null; // Remove listener
        audioElRef.current.src = "";
    }
  };

  const handleStartProcess = async () => {
    setStatus('waiting_for_user');
    setError(null);

    try {
        // 1. Ask user to select the screen to share
        // IMPORTANT: We need video from screen, but AUDIO from Web Audio API (for high quality), 
        // effectively ignoring system audio from getDisplayMedia to avoid notification sounds.
        const captureStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: "browser", // Prefer tab
                frameRate: 60,
            },
            audio: false, // We will mix internal audio separately
            preferCurrentTab: true, // Experimental support in Chrome
        } as any);

        screenStreamRef.current = captureStream;

        // 2. Prepare High Quality Audio Output
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        
        // Create an audio element just for recording (hidden)
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = track.audioUrl;
        
        // CRITICAL FIX: Sync the time back to the UI so lyrics scroll during recording
        audio.ontimeupdate = () => {
            onTimeUpdate(audio.currentTime);
        };

        audioElRef.current = audio;

        // Connect Audio Element -> MediaStreamDestination
        const source = audioCtx.createMediaElementSource(audio);
        const dest = audioCtx.createMediaStreamDestination();
        
        // Also connect to destination for user to hear (optional, but good for confirmation)
        // If we connect to audioCtx.destination, the user hears it.
        // But if they are recording 'System Audio' via getDisplayMedia, they might get echo.
        // Since we disabled audio in getDisplayMedia, we can safely let user hear it.
        source.connect(audioCtx.destination);
        source.connect(dest);

        // 3. Combine Screen Video + Clean Audio
        const videoTrack = captureStream.getVideoTracks()[0];
        const audioTrack = dest.stream.getAudioTracks()[0];
        const combinedStream = new MediaStream([videoTrack, audioTrack]);

        // 4. Configure Recorder
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 8000000 // 8 Mbps High Quality
        });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            handleSave();
        };

        mediaRecorderRef.current = recorder;

        // 5. Start EVERYTHING
        // First, trigger UI to hide controls
        onRecordingStart(); 
        setStatus('recording');

        // Small delay to allow React to re-render clean UI
        setTimeout(async () => {
            recorder.start();
            try {
                await audio.play();
            } catch (e) {
                console.error("Audio play failed", e);
                setError("Autoplay failed. Please interact with the document.");
            }
        }, 800);

        // 6. Stop when audio ends
        audio.onended = () => {
            if (recorder.state !== 'inactive') {
                recorder.stop();
            }
        };

        // Also stop if user clicks "Stop Sharing" on the browser UI
        videoTrack.onended = () => {
            if (recorder.state !== 'inactive') {
                recorder.stop();
            }
            // If stopped manually by user, we might be mid-song
            audio.pause();
        };

    } catch (err: any) {
        console.error(err);
        setStatus('idle');
        setError(err.message || "Failed to start screen capture.");
    }
  };

  const handleSave = () => {
    setStatus('saving');
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.artist} - ${track.title}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    cleanup();
    onRecordingEnd(); // Restore UI
    onClose();
  };

  // While recording, we return NULL so this modal doesn't show up in the video!
  if (status === 'recording') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1c1e] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center shadow-2xl">
        
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video size={32} className="text-rose-500" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Export to Video</h2>
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            To generate an exact copy of the lyrics visualization, we need to record your screen.
        </p>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6 text-left text-sm">
            <h3 className="font-bold text-rose-400 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Click <b>Start Recording</b> below.</li>
                <li>Select the <b>"This Tab"</b> (or Chrome Tab) option.</li>
                <li>Select the current tab <b>(Gemini Music)</b>.</li>
                <li>Click <b>Share</b>.</li>
            </ol>
        </div>

        {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-500/10 p-3 rounded">
                {error}
            </div>
        )}

        <div className="flex gap-3">
            <button 
                onClick={onClose}
                disabled={status === 'waiting_for_user'}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors text-white"
            >
                Cancel
            </button>
            <button 
                onClick={handleStartProcess}
                disabled={status === 'waiting_for_user'}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl font-bold transition-colors text-white flex items-center justify-center gap-2"
            >
                {status === 'waiting_for_user' ? (
                    <>
                        <Loader2 className="animate-spin" size={18} /> Waiting...
                    </>
                ) : (
                    <>
                        <Monitor size={18} /> Start Recording
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default VideoExporter;