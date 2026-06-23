import type { Consultation } from '../models/consultation.model';
export interface FullPipelineResult {
    consultation: Consultation;
    latencyMs: number;
}
/**
 * Full pipeline orchestration
 */
export declare function runFullPipeline(audioBuffer: Buffer, mimeType: string, patientId: string, doctorId: string, requestId: string): Promise<FullPipelineResult>;
export declare function getConsultation(id: string): Consultation | undefined;
export declare function approveConsultation(id: string, doctorId: string): Consultation | null;
export declare function listConsultations(): Consultation[];
//# sourceMappingURL=consultation.service.d.ts.map