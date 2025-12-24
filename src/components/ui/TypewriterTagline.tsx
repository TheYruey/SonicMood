import { useState, useEffect } from 'react';

interface TypewriterTaglineProps {
    phrases: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

/**
 * Componente de efecto de máquina de escribir para frases rotativas (Taglines).
 * Alterna entre una lista de frases con efectos de escritura y borrado.
 * 
 * @param phrases Lista de frases a mostrar
 * @param typingSpeed Velocidad de escritura (ms)
 * @param deletingSpeed Velocidad de borrado (ms)
 * @param pauseDuration Pausa antes de borrar (ms)
 */
export const TypewriterTagline = ({
    phrases,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 3000
}: TypewriterTaglineProps) => {
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
        <span className="text-emerald-400 font-medium whitespace-nowrap">
            {displayText}
            <span className="animate-pulse ml-0.5 text-white">|</span>
        </span>
    );
};
