import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Component that automatically translates its content using the Lingva API
 * when the language is not French.
 */
const TranslatedText = ({ children, className = "", style = {} }) => {
    const { language, translate } = useLanguage();
    const [translatedContent, setTranslatedContent] = useState(children);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const performTranslation = async () => {
            if (!children) return;
            
            // If language is French, just show the original
            if (language?.toLowerCase() === 'fr') {
                setTranslatedContent(children);
                return;
            }

            setLoading(true);
            try {
                const result = await translate(children);
                if (isMounted) {
                    setTranslatedContent(result);
                }
            } catch (err) {
                console.error("Translation component error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        performTranslation();

        return () => { isMounted = false; };
    }, [children, language, translate]);

    return (
        <span 
            className={`${className} ${loading ? 'opacity-50' : ''}`} 
            style={{ ...style, transition: 'opacity 0.3s ease' }}
            dir="auto"
        >
            {translatedContent}
        </span>
    );
};

export default TranslatedText;
