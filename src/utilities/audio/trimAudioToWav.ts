// decodeAudioData's promise-based signature is supported in all current evergreen
// browsers (Safari included, since 14.1) — no callback-based fallback needed.
// AudioContext only needs a user gesture to resume for *playback*; decoding works
// regardless of context state, so it's safe to call as soon as a file is selected.
export class AudioProcessingError extends Error {}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function floatTo16BitPCM(sample: number): number {
    const s = Math.max(-1, Math.min(1, sample));
    return s < 0 ? s * 0x8000 : s * 0x7fff;
}

function encodeWavPCM16(channels: Float32Array[], sampleRate: number): Blob {
    const numChannels = channels.length;
    const numFrames = channels[0]?.length ?? 0;
    const bytesPerSample = 2;
    const dataLength = numFrames * numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let frame = 0; frame < numFrames; frame++) {
        for (let c = 0; c < numChannels; c++) {
            view.setInt16(offset, floatTo16BitPCM(channels[c][frame]), true);
            offset += bytesPerSample;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
        throw new AudioProcessingError('This browser does not support audio preview processing.');
    }

    const ctx = new AudioContextClass();
    try {
        const arrayBuffer = await file.arrayBuffer();
        try {
            return await ctx.decodeAudioData(arrayBuffer);
        } catch {
            throw new AudioProcessingError('Could not read this audio file. Try MP3, WAV, or M4A.');
        }
    } finally {
        await ctx.close();
    }
}

// Downmixing to mono would roughly halve output size, but stereo 30s clips are
// already small (~5MB @44.1kHz) — not worth the extra state/UI for a first pass.
export function sliceAudioBufferToWav(decoded: AudioBuffer, startSeconds: number, maxSeconds: number): Blob {
    const totalSamples = decoded.length;
    const startSample = Math.min(Math.max(0, Math.round(startSeconds * decoded.sampleRate)), totalSamples);
    const clipSamples = Math.min(totalSamples - startSample, Math.floor(maxSeconds * decoded.sampleRate));

    const channels: Float32Array[] = [];
    for (let c = 0; c < decoded.numberOfChannels; c++) {
        channels.push(decoded.getChannelData(c).slice(startSample, startSample + clipSamples));
    }

    return encodeWavPCM16(channels, decoded.sampleRate);
}

// Downmixes to mono by averaging |sample| across channels, then buckets into
// `numBuckets` columns taking the max per bucket — a cheap O(n) waveform summary
// good enough for a visual scrub UI (not audio analysis).
export function computeWaveformPeaks(decoded: AudioBuffer, numBuckets: number): Float32Array {
    const { numberOfChannels, length } = decoded;
    const channelData: Float32Array[] = [];
    for (let c = 0; c < numberOfChannels; c++) {
        channelData.push(decoded.getChannelData(c));
    }

    const peaks = new Float32Array(numBuckets);
    const bucketSize = Math.max(1, Math.floor(length / numBuckets));

    for (let b = 0; b < numBuckets; b++) {
        const start = b * bucketSize;
        const end = b === numBuckets - 1 ? length : Math.min(length, start + bucketSize);
        let max = 0;
        for (let i = start; i < end; i++) {
            let sum = 0;
            for (let c = 0; c < numberOfChannels; c++) {
                sum += Math.abs(channelData[c][i]);
            }
            const avg = sum / numberOfChannels;
            if (avg > max) max = avg;
        }
        peaks[b] = max;
    }

    return peaks;
}

export async function trimAudioToWav(file: File, maxSeconds = 30, startSeconds = 0): Promise<Blob> {
    const decoded = await decodeAudioFile(file);
    return sliceAudioBufferToWav(decoded, startSeconds, maxSeconds);
}
