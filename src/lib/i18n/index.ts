// Export all i18n modules
export * from './common';
export * from './homepage';

// Re-export the main i18n functions
export { t, getLang, setLang, subscribeLang, formatPostedAgo } from './i18n';
export type { Lang } from './i18n';
