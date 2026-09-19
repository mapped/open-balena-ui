export const requestSignal = (params: unknown): AbortSignal | undefined => {
  if (typeof params !== 'object' || params === null) {
    return undefined;
  }
  const { signal, meta } = params as { signal?: AbortSignal; meta?: unknown };
  if (signal) {
    return signal;
  }
  return typeof meta === 'object' && meta !== null && 'signal' in meta
    ? (meta as { signal?: AbortSignal }).signal
    : undefined;
};
