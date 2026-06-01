/**
 * Generates a globally unique identifier with a given prefix,
 * utilizing the current timestamp and a cryptographically secure random value.
 */
export const generateUniqueId = (prefix: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 11);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`;
};
