import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Suggestions from './Suggestions';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ChatInput - Centered AI prompt box that animates to bottom after first message
 * Updated with unified dark glass color and mic button
 */
const ChatInput = ({
    onSend,
    isAtBottom = false,
    // Speech recognition props
    speechTranscript = '',
    speechIsListening = false,
    speechError = null,
    onStartListening = null,
    onStopListening = null,
    onResetTranscript = null,
    speechSupported = false
}) => {
    const [message, setMessage] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const inputRef = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
            setShowSuggestions(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setMessage(suggestion);
        setShowSuggestions(false);
        setTimeout(() => {
            onSend(suggestion);
            setMessage('');
        }, 100);
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (e.target.value.length > 0) {
            setShowSuggestions(false);
        }
    };

    // Update message when speech transcript changes
    useEffect(() => {
        if (speechTranscript && speechIsListening) {
            setMessage(speechTranscript);
        }
    }, [speechTranscript, speechIsListening]);

    const handleMicClick = () => {
        if (!speechSupported) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (speechIsListening) {
            onStopListening?.();
        } else {
            onResetTranscript?.();
            setMessage('');
            onStartListening?.();
        }
    };

    const containerVariants = {
        centered: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            width: '90%',
            maxWidth: '700px',
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        bottom: {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            x: '-50%',
            y: 0,
            top: 'auto',
            width: '90%',
            maxWidth: '700px',
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            animate={isAtBottom ? 'bottom' : 'centered'}
            style={styles.container}
        >
            <div style={styles.inputWrapper}>
                <div style={styles.inputContainer}>
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={t('chatPlaceholder')}
                        style={styles.textarea}
                        rows={1}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                    <div style={styles.actions}>
                        {/* Mic button */}
                        <motion.button
                            style={{
                                ...styles.micButton,
                                ...(speechIsListening ? styles.micButtonActive : {}),
                                opacity: speechSupported ? 1 : 0.5
                            }}
                            onClick={handleMicClick}
                            aria-label={speechIsListening ? "Stop voice input" : "Start voice input"}
                            title={!speechSupported ? "Speech recognition not supported" : (speechIsListening ? "Stop listening" : "Start voice input")}
                            whileHover={{ scale: speechSupported ? 1.05 : 1 }}
                            whileTap={{ scale: speechSupported ? 0.95 : 1 }}
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </motion.button>

                        {/* Send button */}
                        <motion.button
                            onClick={handleSend}
                            style={{
                                ...styles.sendButton,
                                opacity: message.trim() ? 1 : 0.5,
                                cursor: message.trim() ? 'pointer' : 'not-allowed'
                            }}
                            disabled={!message.trim()}
                            aria-label={t('send')}
                            whileHover={message.trim() ? { scale: 1.05 } : {}}
                            whileTap={message.trim() ? { scale: 0.95 } : {}}
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            {!isAtBottom && (
                <Suggestions
                    visible={showSuggestions && !message}
                    onSuggestionClick={handleSuggestionClick}
                />
            )}
        </motion.div>
    );
};

const styles = {
    container: {
        zIndex: 100
    },
    inputWrapper: {
        width: '100%'
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        padding: '16px 20px',
        background: 'rgba(0, 0, 0, 0.35)', // Unified dark glass color
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s'
    },
    textarea: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '15px',
        fontFamily: 'inherit',
        resize: 'none',
        minHeight: '24px',
        maxHeight: '120px',
        lineHeight: '24px',
        padding: '0'
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    micButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: 'rgba(0, 0, 0, 0.35)', // Unified dark glass color
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: 'rgba(255, 255, 255, 0.9)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    micButtonActive: {
        background: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 0.7)',
        animation: 'pulse 1.5s infinite'
    },
    sendButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    }
};

export default ChatInput;
