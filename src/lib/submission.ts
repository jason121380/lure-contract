import { SUBMISSION_ENDPOINT_URL } from '../config';
import type { SubmittedPayload } from '../types';

export async function submitSignedContract(payload: SubmittedPayload): Promise<void> {
  if (!SUBMISSION_ENDPOINT_URL) {
    throw new Error('尚未設定 SUBMISSION_ENDPOINT_URL，請先部署 Apps Script 並更新 src/config.ts');
  }

  // Apps Script web apps don't return CORS headers, so we POST as text/plain
  // and don't read the response. Apps Script parses JSON from e.postData.contents.
  await fetch(SUBMISSION_ENDPOINT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
}
