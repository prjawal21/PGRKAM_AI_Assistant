import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * ThinkingBubble - Dynamic AI thinking animation with rotating messages
 * Messages rotate every 2.5 seconds with smooth fade transitions
 * Now supports multilingual messages
 */
const ThinkingBubble = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const { t } = useLanguage();

    const thinkingMessages = [
        t('thinkingMsg1'),
        t('thinkingMsg2'),
        t('thinkingMsg3'),
        t('thinkingMsg4'),
        t('thinkingMsg5')
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
        }, 2500); // Rotate every 2.5 seconds

        return () => clearInterval(interval); // Cleanup on unmount
    }, [thinkingMessages.length]);

    return (
        <div style={styles.container}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    style={styles.message}
                >
                    {thinkingMessages[currentMessageIndex]}
                </motion.div>
            </AnimatePresence>

            {/* Typing dots animation */}
            <div style={styles.dotsContainer}>
                <span style={{ ...styles.dot, animationDelay: '0s' }}></span>
                <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
                <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minHeight: '24px' // Fixed height to prevent jumping
    },
    message: {
        fontSize: '14px',
        color: '#1a1a1a', // Dark text for white background
        fontStyle: 'italic',
        whiteSpace: 'nowrap'
    },
    dotsContainer: {
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
    },
    dot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#667eea', // Purple to match theme
        animation: 'bounce 1.4s infinite ease-in-out'
    }
};

// Add keyframes for dot animation
if (typeof document !== 'undefined') {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
        @keyframes bounce {
            0%, 80%, 100% { 
                transform: translateY(0);
                opacity: 0.7;
            }
            40% { 
                transform: translateY(-8px);
                opacity: 1;
            }
        }
    `;

    try {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
        // Keyframes might already exist
    }
}

export default ThinkingBubble;
