import { useState, useEffect } from 'react';

interface TypewriterTextProps {
    phrases?: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

const defaultPhrases = [
    "driven by your atmosphere.",
    "tuned to local weather.",
    "curated for right now.",
    "vibe check: active."
];

/**
 * Componente similar a TypewriterTagline pero con estilos base diferentes.
 * Utilizado para el texto principal o subtítulos dinámicos.
 */
export const TypewriterText = ({
    phrases = defaultPhrases,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 3000
}: TypewriterTextProps) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentPhrase = phrases[currentPhraseIndex];

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                if (displayText.length < currentPhrase.length) {
                    setDisplayText(currentPhrase.slice(0, displayText.length + 1));
                } else {
                    // Finished typing, wait before deleting
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                // Deleting
                if (displayText.length > 0) {
                    setDisplayText(currentPhrase.slice(0, displayText.length - 1));
                } else {
                    // Finished deleting, move to next phrase
                    setIsDeleting(false);
                    setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
                }
            }
        };

        const timer = setTimeout(
            handleTyping,
            isDeleting ? deletingSpeed : typingSpeed
        );

        return () => clearTimeout(timer);
    }, [displayText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

    return (
        <p className="text-lg md:text-xl font-light text-white/70 tracking-wide">
            Music discovery <span className="text-cyan-400 font-medium whitespace-nowrap">
                {displayText}
                <span className="animate-pulse ml-0.5 text-cyan-400">|</span>
            </span>
        </p>
    );
};
