import type { RAGContext, RAGChunk } from '../models/consultation.model';

/**
 * Formats retrieved RAG chunks into a structured string
 * ready to be injected into the Claude Sonnet synthesis prompt.
 */
export function buildRAGContextString(context: RAGContext): string {
  const sections: string[] = [];

  if (context.icmrChunks.length > 0) {
    sections.push('--- ICMR CLINICAL GUIDELINES ---');
    context.icmrChunks.forEach((chunk, i) => {
      sections.push(formatChunk(chunk, i + 1));
    });
  } else {
    sections.push('--- ICMR CLINICAL GUIDELINES ---\nNo relevant guidelines retrieved for the symptoms presented.');
  }

  if (context.drugInteractionChunks.length > 0) {
    sections.push('\n--- DRUG INTERACTION DATABASE ---');
    context.drugInteractionChunks.forEach((chunk, i) => {
      sections.push(formatChunk(chunk, i + 1));
    });
  } else {
    sections.push('\n--- DRUG INTERACTION DATABASE ---\nNo significant interactions found in retrieved database for the medications mentioned.');
  }

  if (context.clinicalRuleChunks.length > 0) {
    sections.push('\n--- CLINICAL RED FLAG RULES ---');
    context.clinicalRuleChunks.forEach((chunk, i) => {
      sections.push(formatChunk(chunk, i + 1));
    });
  } else {
    sections.push('\n--- CLINICAL RED FLAG RULES ---\nNo specific red flag rules retrieved for this presentation.');
  }

  return sections.join('\n');
}

function formatChunk(chunk: RAGChunk, index: number): string {
  const meta = chunk.metadata;
  let header = `[${index}] (score: ${chunk.score.toFixed(3)})`;

  if (meta['title']) header += ` ${meta['title']}`;
  if (meta['source']) header += ` | Source: ${meta['source']}`;
  if (meta['severity']) header += ` | Severity: ${meta['severity']}`;
  if (meta['drug_a'] && meta['drug_b']) {
    header += ` | Interaction: ${meta['drug_a']} × ${meta['drug_b']}`;
  }

  return `${header}\n${chunk.content}`;
}
