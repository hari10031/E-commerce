import { ApiError } from './api';

export function quotaUserMessage(err: unknown, isAdmin: boolean): string | null {
  const message = err instanceof Error ? err.message : '';
  const isQuota =
    (err instanceof ApiError && err.status === 429) || /quota exhausted/i.test(message);

  if (!isQuota) return null;

  return isAdmin
    ? 'Quota exhausted. Open AI Quota in the sidebar to request more from the platform admin.'
    : 'Quota exhausted. Contact your store admin for more AI quota.';
}
