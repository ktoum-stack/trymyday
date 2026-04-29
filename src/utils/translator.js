/**
 * Simple translation helper for dynamic content (products)
 * Performs translation using a public proxy to avoid Google Translate widget artifacts.
 */

const CACHE = new Map();

export const translateText = async (text, targetLang) => {
    if (!text || targetLang.toLowerCase() === 'fr') return text;
    
    const cacheKey = `${text}_${targetLang}`;
    if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

    try {
        // Using a public Lingva (LibreTranslate) instance as a free proxy
        // This avoids the Google Translate top bar/iframe issues.
        const response = await authFetch(`https://lingva.ml/api/v1/fr/${targetLang.toLowerCase()}/${encodeURIComponent(text)}`);
        const data = await response.json();
        
        if (data && data.translation) {
            CACHE.set(cacheKey, data.translation);
            return data.translation;
        }
    } catch (error) {
        console.error('Translation error:', error);
    }
    
    return text; // Fallback to original text
};


// Auto-Injected fetch wrapper for JWT
const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token && url.includes('/api/')) {
        options.headers = {
            ...options.headers,
            'Authorization': 'Bearer ' + token,
        };
    }
    return fetch(url, options);
};
