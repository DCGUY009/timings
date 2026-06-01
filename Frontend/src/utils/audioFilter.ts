/**
 * DSP utilities for audio processing in the browser.
 * Applies highpass, lowpass, compressor, and noise gate filters to reduce background noise.
 */

const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

/**
 * Processes an AudioBuffer by applying filters (highpass, lowpass, compressor, and noise gate)
 * if noiseRemovalEnabled is true, and returns the result encoded as a WAV Blob.
 */
export async function processAudioBuffer(
  audioBuffer: AudioBuffer,
  noiseRemovalEnabled: boolean
): Promise<Blob> {
  let processedBuffer = audioBuffer;

  if (noiseRemovalEnabled && AudioContextClass) {
    const { numberOfChannels, sampleRate, length } = audioBuffer;

    // Create OfflineAudioContext to process the audio offline
    const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

    // 1. Create Buffer Source Node
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // 2. Create Highpass Filter (80Hz): Cuts out low-frequency hum/rumble without stripping vocal body
    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(80, offlineCtx.currentTime);
    highpass.Q.setValueAtTime(0.707, offlineCtx.currentTime);

    // 3. Create Lowpass Filter (12000Hz): Cuts out high-frequency hiss while preserving sibilance and clarity
    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(12000, offlineCtx.currentTime);
    lowpass.Q.setValueAtTime(0.707, offlineCtx.currentTime);

    // 4. Create Dynamics Compressor Node: evens out vocals gently without squashing
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, offlineCtx.currentTime); // dB
    compressor.knee.setValueAtTime(30, offlineCtx.currentTime); // dB
    compressor.ratio.setValueAtTime(3, offlineCtx.currentTime); // ratio
    compressor.attack.setValueAtTime(0.01, offlineCtx.currentTime); // seconds
    compressor.release.setValueAtTime(0.15, offlineCtx.currentTime); // seconds

    // Connect Node Graph: Source -> Highpass -> Lowpass -> Compressor -> Destination
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(offlineCtx.destination);

    // Render the filters
    source.start(0);
    processedBuffer = await offlineCtx.startRendering();

    // 5. Apply smooth Noise Gate to the final processed buffer to gently attenuate room noise in silent sections
    applyNoiseGate(processedBuffer, -48, -24);
  }

  // Encode the final audio buffer to WAV
  return bufferToWav(processedBuffer);
}

/**
 * Custom Noise Gate algorithm with smooth exponential attack and release coefficients.
 * Mutes or attenuates audio samples where the envelope level falls below the threshold.
 */
function applyNoiseGate(
  audioBuffer: AudioBuffer,
  thresholdDb: number = -42,
  reductionDb: number = -60
): void {
  const threshold = Math.pow(10, thresholdDb / 20); // convert dB to linear amplitude
  const reduction = Math.pow(10, reductionDb / 20); // convert reduction dB to linear multiplier

  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;

  // Process in 10ms windows to calculate signal envelope peaks
  const windowSize = Math.round(sampleRate * 0.01);

  for (let c = 0; c < numChannels; c++) {
    const data = audioBuffer.getChannelData(c);

    let currentGain = 1.0;
    // Smoother coefficients for gate opening/closing (attack/release)
    const attackTime = 0.015; // 15ms
    const releaseTime = 0.12;  // 120ms
    const attackCoef = Math.exp(-1 / (sampleRate * attackTime));
    const releaseCoef = Math.exp(-1 / (sampleRate * releaseTime));

    for (let i = 0; i < length; i += windowSize) {
      const end = Math.min(i + windowSize, length);

      // Find peak absolute amplitude in the current window
      let peak = 0;
      for (let j = i; j < end; j++) {
        const absVal = Math.abs(data[j]);
        if (absVal > peak) peak = absVal;
      }

      // Target gain: if signal is below threshold, apply attenuation; otherwise, let it pass (gain 1.0)
      const targetGain = peak < threshold ? reduction : 1.0;

      // Apply smoothed gain to prevent clicking artifacts
      for (let j = i; j < end; j++) {
        if (targetGain < currentGain) {
          // Release: closing the gate (attenuating noise)
          currentGain = targetGain + (currentGain - targetGain) * releaseCoef;
        } else {
          // Attack: opening the gate (passing signal)
          currentGain = targetGain + (currentGain - targetGain) * attackCoef;
        }
        data[j] *= currentGain;
      }
    }
  }
}

/**
 * Trims an AudioBuffer from startTime to endTime (in seconds) and returns a new AudioBuffer.
 */
export function trimAudioBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startTime * sampleRate));
  const endSample = Math.min(Math.floor(endTime * sampleRate), audioBuffer.length);
  const newLength = Math.max(0, endSample - startSample);

  if (!AudioContextClass) {
    return audioBuffer;
  }

  // Create a new buffer with the trimmed length (minimum length of 1 sample)
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    newLength > 0 ? newLength : 1,
    sampleRate
  );
  const trimmedBuffer = offlineCtx.createBuffer(
    audioBuffer.numberOfChannels,
    newLength > 0 ? newLength : 1,
    sampleRate
  );

  if (newLength > 0) {
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const sourceData = audioBuffer.getChannelData(c);
      const targetData = trimmedBuffer.getChannelData(c);
      // Slice and copy the data segment
      const segment = sourceData.subarray(startSample, endSample);
      targetData.set(segment);
    }
  }

  return trimmedBuffer;
}

/**
 * Encodes an AudioBuffer to standard WAV format (16-bit PCM).
 */
function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = 16-bit signed PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  const bufferLength = result.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLength, true);

  // Write the PCM audio samples
  floatTo16BitPCM(view, 44, result);

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
