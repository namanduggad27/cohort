import type { ExtractedEntities, SOAPNote } from '../models/consultation.model';
export interface AnthropicUsage {
    inputTokens: number;
    outputTokens: number;
}
export declare function extractEntitiesWithHaiku(transcript: string, requestId: string): Promise<{
    entities: ExtractedEntities;
    usage: AnthropicUsage;
}>;
export declare function generateSOAPWithSonnet(params: {
    consultationId: string;
    transcript: string;
    durationSeconds: number;
    language: string;
    transcriptionConfidence: number;
    extractedEntities: ExtractedEntities;
    ragContext: string;
    requestId: string;
}): Promise<{
    soapNote: SOAPNote;
    usage: AnthropicUsage;
}>;
//# sourceMappingURL=anthropic.service.d.ts.map