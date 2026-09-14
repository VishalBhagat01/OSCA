/**
 * Common formatting utility functions.
 */

/**
 * Format timestamp into localized date-time string.
 */
export const formatDate = (date) => {
  if (!date) return "--";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Convert snake_case or hyphenated node name into Title Case.
 */
export const formatNodeName = (node) => {
  if (!node) return "";
  return node
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Truncate a string with an ellipsis if it exceeds maxLength.
 */
export const truncateText = (text, maxLength = 80) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
