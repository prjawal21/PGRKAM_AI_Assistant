import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Dock from '../components/Dock';
import ChatInput from '../components/ChatInput/ChatInput';
import SettingsModal from '../components/SettingsModal';
import ThinkingBubble from '../components/ThinkingBubble';
import { api } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import '../styles/dock.css';

/**
 * ChatPage - Modern chat interface with session support
 * Uses ORIGINAL API format with session management added
 */
const ChatPage = () => {
    const { token, logout } = useContext(AuthContext);
    const { language, t } = useLanguage();
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isInputAtBottom, setIsInputAtBottom] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef(null);

    // Speech Recognition with language support
    const {
        transcript,
        isListening,
        error: speechError,
        startListening,
        stopListening,
        resetTranscript,
        supported: speechSupported
    } = useSpeechRecognition(language, true);  // Use language from context

    // Fetch user profile on mount
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Load session if sessionId is provided (from path or query param)
    useEffect(() => {
        const sessionFromPath = sessionId;
        const sessionFromQuery = searchParams.get('session');
        const targetSessionId = sessionFromPath || sessionFromQuery;

        if (targetSessionId) {
            loadSession(targetSessionId);
        }
    }, [sessionId, searchParams]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserProfile(res.data.profile || {});
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            const res = await api.get(`/api/chat/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const loadedMessages = res.data.messages.map((msg, idx) => ({
                id: `${sessionId}-${idx}`,
                role: msg.role,
                text: msg.content,
                content: msg.content,
                timestamp: new Date(msg.timestamp)
            }));

            setMessages(loadedMessages);
            setCurrentSessionId(sessionId);

            if (loadedMessages.length > 0) {
                setIsInputAtBottom(true);
            }
        } catch (err) {
            console.error('Failed to load session:', err);
        }
    };

    const handleSendMessage = async (message) => {
        if (loading) return;

        // Add user message
        const userMsg = {
            id: Date.now(),
            role: 'user',
            text: message,
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);

        // Move input to bottom after first message
        if (!isInputAtBottom) {
            setIsInputAtBottom(true);
        }

        setLoading(true);

        try {
            // Build history from current messages (ORIGINAL API FORMAT)
            const history = messages.map(msg => ({
                role: msg.role,
                content: msg.content || msg.text
            }));

            // Call ORIGINAL /api/chat endpoint with session_id and language added
            const res = await api.post(
                '/api/chat',
                {
                    message: message,
                    history: history,
                    session_id: currentSessionId, // Added for session tracking
                    user_profile: userProfile,
                    language: language  // Add language for multilingual support
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Update session ID if it was created
            const responseSessionId = res.data.session_id;
            if (!currentSessionId && responseSessionId) {
                setCurrentSessionId(responseSessionId);
                navigate(`/chat/${responseSessionId}`, { replace: true });
            }

            // Add AI response to messages
            const aiMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                text: res.data.response,
                content: res.data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Chat error:', err);
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                text: err.response?.data?.detail || 'Error: Unable to get response.',
                content: err.response?.data?.detail || 'Error: Unable to get response.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (logout) {
            logout();
        }
        navigate('/login');
    };

    // Handle new chat creation
    const handleNewChat = () => {
        // Clear all state
        setMessages([]);
        setCurrentSessionId(null);
        // Navigate to chat page (will create new session on first message)
        navigate('/chat');
    };

    // Dock items configuration
    const dockItems = [
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            label: t('newChat'),
            onClick: handleNewChat
        },
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            label: t('history'),
            onClick: () => navigate('/history')
        },
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            label: t('profile'),
            onClick: () => navigate('/profile')
        },
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: t('settings'),
            onClick: () => setShowSettings(true)
        }
    ];

    return (
        <div style={styles.page}>
            {/* Gradient Background */}
            <div style={styles.gradientBg} />

            {/* Logo and Title */}
            <div className="app-header">
                <img src="/logo.png" alt="PGRKAM Logo" className="app-logo" />
                <h1 className="app-title">{t('appTitle')}</h1>
            </div>

            {/* Dock Navigation */}
            <Dock
                items={dockItems}
                panelHeight={68}
                baseItemSize={50}
                magnification={70}
            />

            {/* Logout Button */}
            <button className="logout-button" onClick={handleLogout}>
                {t('logout')}
            </button>

            {/* Settings Modal */}
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Watermark Logo - Always visible */}
            <div style={styles.watermarkLogo}>
                <img src="/logo.png" alt="" style={styles.watermarkImage} />
            </div>

            {/* Chat Messages */}
            {isInputAtBottom && messages.length > 0 && (
                <div style={styles.messagesContainer}>
                    <div style={styles.messagesList}>
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    style={{
                                        ...styles.message,
                                        ...(msg.role === 'user' ? styles.userMessage : styles.aiMessage)
                                    }}
                                >
                                    <div style={styles.messageContent}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p style={styles.markdownParagraph} {...props} />,
                                                ul: ({ node, ...props }) => <ul style={styles.markdownList} {...props} />,
                                                ol: ({ node, ...props }) => <ol style={styles.markdownList} {...props} />,
                                                li: ({ node, ...props }) => <li style={styles.markdownListItem} {...props} />,
                                                strong: ({ node, ...props }) => <strong style={styles.markdownBold} {...props} />,
                                                em: ({ node, ...props }) => <em style={styles.markdownItalic} {...props} />,
                                                h1: ({ node, ...props }) => <h1 style={styles.markdownH1} {...props} />,
                                                h2: ({ node, ...props }) => <h2 style={styles.markdownH2} {...props} />,
                                                h3: ({ node, ...props }) => <h3 style={styles.markdownH3} {...props} />,
                                                a: ({ node, ...props }) => <a style={styles.markdownLink} {...props} target="_blank" rel="noopener noreferrer" />,
                                                code: ({ node, inline, ...props }) =>
                                                    inline ?
                                                        <code style={styles.markdownInlineCode} {...props} /> :
                                                        <code style={styles.markdownCodeBlock} {...props} />
                                            }}
                                        >
                                            {(() => {
                                                let content = msg.text || msg.content;
                                                // Aggressively remove all multiple newlines
                                                content = content.replace(/\n\n+/g, '\n');
                                                // Fix numbered lists
                                                content = content.replace(/^(\d+\.?)\s*\n\s*/gm, '$1 ');
                                                return content;
                                            })()}
                                        </ReactMarkdown>
                                    </div>
                                    <div style={styles.messageTime}>
                                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={styles.loadingBubble}
                                >
                                    <ThinkingBubble />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <ChatInput
                onSend={handleSendMessage}
                isAtBottom={isInputAtBottom}
                speechTranscript={transcript}
                speechIsListening={isListening}
                speechError={speechError}
                onStartListening={startListening}
                onStopListening={stopListening}
                onResetTranscript={resetTranscript}
                speechSupported={speechSupported}
            />
        </div>
    );
};

const styles = {
    page: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
    },
    gradientBg: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        zIndex: -1
    },
    watermarkLogo: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 1
    },
    watermarkImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: 0.08,
        filter: 'grayscale(100%)'
    },
    messagesContainer: {
        position: 'fixed',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '700px',
        height: 'calc(100vh - 220px)',
        overflowY: 'auto',
        paddingBottom: '20px',
        zIndex: 50
    },
    messagesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '0 10px'
    },
    message: {
        maxWidth: '80%',
        padding: '12px 16px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    userMessage: {
        alignSelf: 'flex-end',
        background: 'rgba(102, 126, 234, 0.9)',
        color: 'white',
        marginLeft: 'auto'
    },
    aiMessage: {
        alignSelf: 'flex-start',
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#1a1a1a'
    },
    messageContent: {
        fontSize: '15px',
        lineHeight: '1.6',
        marginBottom: '4px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
    },
    messageTime: {
        fontSize: '11px',
        opacity: 0.7
    },
    loadingBubble: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 18px',
        borderRadius: '18px',
        background: 'rgba(255, 255, 255, 0.95)',
        alignSelf: 'flex-start',
        maxWidth: '70%'
    },
    // Markdown Styles
    markdownParagraph: {
        margin: '0.1em 0',
        lineHeight: '1.4',
        fontSize: '15px'
    },
    markdownList: {
        margin: '0.1em 0',
        paddingLeft: '20px',
        lineHeight: '1.3'
    },
    markdownListItem: {
        margin: '0.05em 0',
        color: 'inherit',
        lineHeight: '1.3'
    },
    markdownBold: {
        fontWeight: '700',
        color: 'inherit'
    },
    markdownItalic: {
        fontStyle: 'italic',
        color: 'inherit'
    },
    markdownH1: {
        fontSize: '20px',
        fontWeight: '700',
        margin: '0.3em 0 0.2em 0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    markdownH2: {
        fontSize: '18px',
        fontWeight: '700',
        margin: '0.3em 0 0.15em 0',
        color: '#667eea'
    },
    markdownH3: {
        fontSize: '17px',
        fontWeight: '600',
        margin: '0.25em 0 0.1em 0',
        color: '#764ba2'
    },
    markdownLink: {
        color: '#667eea',
        textDecoration: 'underline',
        cursor: 'pointer',
        transition: 'color 0.2s'
    },
    markdownInlineCode: {
        background: 'rgba(0, 0, 0, 0.08)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px'
    },
    markdownCodeBlock: {
        display: 'block',
        background: 'rgba(0, 0, 0, 0.08)',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        overflowX: 'auto',
        margin: '8px 0'
    }
};

export default ChatPage;
