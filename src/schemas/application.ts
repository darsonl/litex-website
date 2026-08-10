import { z } from 'astro/zod';
import type { ReferenceFn } from './product';

export function applicationSchema(_reference: ReferenceFn) {
  return z.object({
    name: z.string(),
    summary: z.string().max(160),
    /**
     * Where LiTex itself claims this application. Required: publishing an
     * unevidenced end-use fails exactly the diligence a serious buyer applies.
     */
    evidence: z.string().min(1),
    needsDetail: z.boolean().default(false),
  });
}
