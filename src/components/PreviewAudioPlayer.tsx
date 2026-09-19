import React, { useEffect, useRef, useState } from 'react';

interface PreviewAudioPlayerProps {
    src: string;
}

function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PreviewAudioPlayer: React.FC<PreviewAudioPlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastVolumeRef = useRef(0.3);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.3);

    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        if (audioRef.current) audioRef.current.volume = lastVolumeRef.current;
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
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
        <div className="audioPlayer">
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
            <div className="audioPlayerRow">
                <button
                    type="button"
                    className="audioPlayerToggle"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
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
                    aria-label="Seek preview"
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
        </div>
    );
};

export default PreviewAudioPlayer;
