export interface SarvamTranscriptionResult {
    transcript: string;
    language_code: string;
    confidence: number;
    durationSeconds: number;
    words?: {
        word: string;
        start: number;
        end: number;
        confidence: number;
    }[];
}
/**
 * Sarvam AI Speech-to-Text-Translate
 * Primary STT for Hindi-English code-switched (Hinglish) audio.
 * Falls back to OpenAI Whisper for pure English if configured.
 *
 * Docs: https://docs.sarvam.ai/api-reference-docs/speech-to-text-translate
 */
export declare function transcribeWithSarvam(audioBuffer: Buffer, mimeType: string, requestId: string): Promise<SarvamTranscriptionResult>;
/**
 * Whisper fallback for pure-English consults
 * Uses OpenAI Whisper API when Sarvam is unavailable or for English-only audio.
 */
export declare function transcribeWithWhisper(audioBuffer: Buffer, mimeType: string, requestId: string): Promise<SarvamTranscriptionResult>;
//# sourceMappingURL=sarvam.service.d.ts.map