export function quotaUserMessage(err, isAdmin) {
  const status = err?.status;
  const msg = err?.message || '';
  const isQuota = status === 429 || /quota exhausted/i.test(msg);
  if (!isQuota) return null;
  return isAdmin
    ? 'AI quota exhausted. Open More → AI Quota to request more from the platform admin.'
    : 'AI quota exhausted. Contact your store admin for more AI quota.';
}
