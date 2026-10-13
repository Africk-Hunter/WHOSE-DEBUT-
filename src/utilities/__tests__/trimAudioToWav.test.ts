import { describe, expect, it } from 'vitest';
import { computeWaveformPeaks, sliceAudioBufferToWav } from '../audio/trimAudioToWav';

function fakeBuffer(channels: number[][], sampleRate = 4): AudioBuffer {
    const data = channels.map(c => Float32Array.from(c));
    return {
        length: data[0].length,
        sampleRate,
        numberOfChannels: data.length,
        getChannelData: (i: number) => data[i],
    } as unknown as AudioBuffer;
}

describe('sliceAudioBufferToWav', () => {
    it('writes a valid PCM16 WAV header and clamps to the requested window', async () => {
        const buf = fakeBuffer([[0, 0.5, -0.5, 1, 0, 0, 0, 0]]);
        const blob = sliceAudioBufferToWav(buf, 0, 1); // 1s at 4Hz = 4 samples
        expect(blob.type).toBe('audio/wav');
        const view = new DataView(await blob.arrayBuffer());
        const tag = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map(i => view.getUint8(o + i)));
        expect(tag(0)).toBe('RIFF');
        expect(tag(8)).toBe('WAVE');
        expect(view.getUint32(24, true)).toBe(4);
        expect(view.getUint32(40, true)).toBe(8);
        expect(view.getInt16(46, true)).toBe(Math.trunc(0.5 * 0x7fff));
        expect(view.getInt16(50, true)).toBe(0x7fff);
    });
    it('does not overrun when the start is near the end', () => {
        const blob = sliceAudioBufferToWav(fakeBuffer([[0, 0, 0, 0]]), 0.75, 30);
        expect(blob.size).toBe(44 + 2);
    });
});

describe('computeWaveformPeaks', () => {
    it('takes the max averaged amplitude per bucket', () => {
        const buf = fakeBuffer([[0.1, 0.4, 0.2, -0.8], [0.1, 0.4, 0.2, -0.8]]);
        const peaks = computeWaveformPeaks(buf, 2);
        expect(peaks[0]).toBeCloseTo(0.4);
        expect(peaks[1]).toBeCloseTo(0.8);
    });
});
