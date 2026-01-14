// Utility functions
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};