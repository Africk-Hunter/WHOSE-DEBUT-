import React, { useEffect, useRef, useState } from 'react';
import { decodeAudioFile, computeWaveformPeaks, AudioProcessingError } from '../utilities/audio/trimAudioToWav';

interface AudioClipSelectorProps {
    file: File;
    clipSeconds: number;
    startSeconds: number;
    onStartSecondsChange: (seconds: number) => void;
    onError?: (message: string) => void;
    onDecoded?: (buffer: AudioBuffer) => void;
}

const NUM_BUCKETS = 400;

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function drawWaveform(canvas: HTMLCanvasElement, peaks: Float32Array, width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / peaks.length;
    const mid = height / 2;
    ctx.fillStyle = '#D8CFC4';
    for (let i = 0; i < peaks.length; i++) {
        const barHeight = Math.max(1, peaks[i] * height);
        ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    }
}

const AudioClipSelector: React.FC<AudioClipSelectorProps> = ({
    file,
    clipSeconds,
    startSeconds,
    onStartSecondsChange,
    onError,
    onDecoded,
}) => {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [duration, setDuration] = useState(0);
    const [peaks, setPeaks] = useState<Float32Array | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.3);

    const audioRef = useRef<HTMLAudioElement>(null);
    const waveformRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isPreviewingSelectionRef = useRef(false);
    const isDraggingRef = useRef(false);
    const lastVolumeRef = useRef(0.3);

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        setPeaks(null);

        decodeAudioFile(file)
            .then(decoded => {
                if (cancelled) return;
                setDuration(decoded.duration);
                setPeaks(computeWaveformPeaks(decoded, NUM_BUCKETS));
                setStatus('ready');
                onDecoded?.(decoded);
            })
            .catch(err => {
                if (cancelled) return;
                setStatus('error');
                const message = err instanceof AudioProcessingError ? err.message : 'Failed to process preview audio.';
                onError?.(message);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = lastVolumeRef.current;
    }, [objectUrl]);

    useEffect(() => {
        if (!peaks || !waveformRef.current || !canvasRef.current) return;
        const container = waveformRef.current;
        const canvas = canvasRef.current;

        const redraw = () => {
            const { width } = container.getBoundingClientRect();
            drawWaveform(canvas, peaks, width, 80);
        };

        redraw();
        const observer = new ResizeObserver(redraw);
        observer.observe(container);
        return () => observer.disconnect();
    }, [peaks]);

    const canSelect = status === 'ready' && duration > clipSeconds;
    const windowStartPct = duration > 0 ? (startSeconds / duration) * 100 : 0;
    const windowWidthPct = duration > 0 ? (clipSeconds / duration) * 100 : 100;

    const clampStart = (value: number) => Math.min(Math.max(0, value), Math.max(0, duration - clipSeconds));

    const setStartFromClientX = (clientX: number) => {
        const container = waveformRef.current;
        if (!container || duration <= 0) return;
        const rect = container.getBoundingClientRect();
        const ratio = (clientX - rect.left) / rect.width;
        const centerTime = ratio * duration;
        onStartSecondsChange(clampStart(centerTime - clipSeconds / 2));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!canSelect) return;
        isDraggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setStartFromClientX(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        setStartFromClientX(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!canSelect) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onStartSecondsChange(clampStart(startSeconds - 1));
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            onStartSecondsChange(clampStart(startSeconds + 1));
        }
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        isPreviewingSelectionRef.current = false;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        isPreviewingSelectionRef.current = false;
        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const previewSelection = () => {
        const audio = audioRef.current;
        if (!audio) return;
        isPreviewingSelectionRef.current = true;
        audio.currentTime = startSeconds;
        setCurrentTime(startSeconds);
        audio.play();
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const time = e.currentTarget.currentTime;
        setCurrentTime(time);
        if (isPreviewingSelectionRef.current && time >= startSeconds + clipSeconds) {
            e.currentTarget.pause();
            isPreviewingSelectionRef.current = false;
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const nextVolume = Number(e.target.value);
        if (nextVolume > 0) lastVolumeRef.current = nextVolume;
        audio.volume = nextVolume;
        setVolume(nextVolume);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const nextVolume = volume > 0 ? 0 : (lastVolumeRef.current || 1);
        audio.volume = nextVolume;
        setVolume(nextVolume);
    };

    return (
        <div className="audioClipSelector">
            {objectUrl && (
                <audio
                    ref={audioRef}
                    src={objectUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                />
            )}

            {status === 'loading' && <p className="formHint">Loading waveform&hellip;</p>}

            {status === 'ready' && peaks && (
                <>
                    <div
                        ref={waveformRef}
                        className={`audioClipSelectorWaveform ${canSelect ? 'audioClipSelectorWaveform--interactive' : ''}`}
                        onPointerDown={canSelect ? handlePointerDown : undefined}
                        onPointerMove={canSelect ? handlePointerMove : undefined}
                        onPointerUp={canSelect ? handlePointerUp : undefined}
                    >
                        <canvas ref={canvasRef} className="audioClipSelectorCanvas" />
                        <div
                            className="audioClipSelectorWindow"
                            style={{ left: `${windowStartPct}%`, width: `${windowWidthPct}%` }}
                            role={canSelect ? 'slider' : undefined}
                            tabIndex={canSelect ? 0 : undefined}
                            aria-label={canSelect ? 'Preview window start' : undefined}
                            aria-valuemin={0}
                            aria-valuemax={Math.max(0, duration - clipSeconds)}
                            aria-valuenow={startSeconds}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {canSelect ? (
                        <p className="formHint">
                            Selected: {formatTime(startSeconds)}&ndash;{formatTime(startSeconds + clipSeconds)} of {formatTime(duration)}
                        </p>
                    ) : (
                        <p className="formHint">Full clip ({formatTime(duration)}) will be used.</p>
                    )}

                    <div className="audioClipSelectorTransport">
                        <button
                            type="button"
                            className="audioPlayerToggle"
                            onClick={togglePlay}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="5" height="16" /><rect x="14" y="4" width="5" height="16" /></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z" /></svg>
                            )}
                        </button>
                        <input
                            type="range"
                            className="audioPlayerScrub"
                            min={0}
                            max={duration || 0}
                            step={0.01}
                            value={currentTime}
                            onChange={handleScrub}
                            aria-label="Seek track"
                        />
                        <span className="audioPlayerTime">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>

                    <div className="audioPlayerVolumeRow">
                        <button
                            type="button"
                            className="audioPlayerVolumeToggle"
                            onClick={toggleMute}
                            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 9v6h4l5 4V5L8 9H4z" />
                                {volume === 0 ? (
                                    <g className="audioPlayerVolumeMute">
                                        <line x1="16" y1="9" x2="21" y2="14" />
                                        <line x1="21" y1="9" x2="16" y2="14" />
                                    </g>
                                ) : (
                                    <path className="audioPlayerVolumeWave" d="M16.5 8.5a5 5 0 0 1 0 7" />
                                )}
                            </svg>
                        </button>
                        <input
                            type="range"
                            className="audioPlayerVolume"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={handleVolume}
                            aria-label="Volume"
                        />
                    </div>

                    {canSelect && (
                        <div className="audioClipSelectorSelectionRow">
                            <button type="button" className="adminButton" onClick={previewSelection}>
                                Preview Selection
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AudioClipSelector;
