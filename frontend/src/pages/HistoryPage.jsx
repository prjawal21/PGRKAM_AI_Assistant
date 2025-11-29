import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MdDelete } from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/api';
import Dock from '../components/Dock';
import SettingsModal from '../components/SettingsModal';
import '../styles/dock.css';

/**
 * HistoryPage - Modern chat history with session cards
 */
const HistoryPage = () => {
    const { token, logout } = useContext(AuthContext);
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { sessionId, title }

    // Fetch sessions on page load
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/chat/sessions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Backend returns { success: true, sessions: [...] }
            if (res.data.success && res.data.sessions) {
                setSessions(res.data.sessions);
            } else {
                setSessions([]);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (session) => {
        navigate(`/chat?session=${session.session_id}`);
    };


    const handleLogout = () => {
        if (logout) {
            logout();
        }
        navigate('/login');
    };

    const handleDeleteSession = async (sessionId, sessionTitle, e) => {
        // Prevent card click when clicking delete button
        e.stopPropagation();

        console.log('Delete button clicked for session:', sessionId);

        // Show custom confirmation modal
        setConfirmDelete({ sessionId, title: sessionTitle });
    };

    const confirmDeleteSession = async () => {
        const sessionId = confirmDelete.sessionId;
        setConfirmDelete(null); // Close modal

        console.log('User confirmed deletion: true');

        try {
            setDeletingId(sessionId);
            console.log('Sending delete request to:', `/api/chat/session/${sessionId}`);

            const res = await api.delete(`/api/chat/session/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Delete response:', res.status, res.data);

            if (res.status === 200) {
                // Remove from UI immediately
                setSessions(prev => prev.filter(s => s.session_id !== sessionId));
                console.log('Session removed from UI');
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
            console.error('Error details:', err.response?.data);
            alert('Failed to delete conversation. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const cancelDelete = () => {
        console.log('User cancelled deletion');
        setConfirmDelete(null);
    };

    const formatRelativeTime = (dateString, language) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('justNow');
        if (diffMins < 60) return `${diffMins} ${diffMins > 1 ? t('minutesAgo') : t('minuteAgo')}`;
        if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('hoursAgo') : t('hourAgo')}`;
        if (diffDays < 7) return `${diffDays} ${diffDays > 1 ? t('daysAgo') : t('dayAgo')}`;
        return date.toLocaleDateString();
    };

    const dockItems = [
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            ),
            label: t('newChat'),
            onClick: () => navigate('/chat')
        },
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            label: t('history'),
            onClick: () => { }
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
            <div style={styles.gradientBg} />

            <div className="app-header">
                <img src="/logo.png" alt="PGRKAM Logo" className="app-logo" />
                <h1 className="app-title">{t('appTitle')}</h1>
            </div>

            <Dock items={dockItems} panelHeight={68} baseItemSize={50} magnification={70} />

            <button className="logout-button" onClick={handleLogout}>
                {t('logout')}
            </button>

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Watermark Logo */}
            <div style={styles.watermarkLogo}>
                <img src="/logo.png" alt="" style={styles.watermarkImage} />
            </div>

            <div style={styles.content}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={styles.header}
                >
                    <h1 style={styles.title}>{t('chatHistory')}</h1>
                    <p style={styles.subtitle}>{t('resumeConversations')}</p>
                </motion.div>

                {loading ? (
                    <div style={styles.loading}>{t('loading')}</div>
                ) : sessions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={styles.emptyState}
                    >
                        <div style={styles.emptyIcon}>💬</div>
                        <h3 style={styles.emptyTitle}>{t('noConversations')}</h3>
                        <p style={styles.emptyText}>{t('startNewChatPrompt')}</p>
                        <button style={styles.newChatButton} onClick={() => navigate('/chat')}>
                            {t('startNewChat')}
                        </button>
                    </motion.div>
                ) : (
                    <div style={styles.grid}>
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.session_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={styles.card}
                                onClick={() => handleCardClick(session)}
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.5)'
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div style={styles.cardHeader}>
                                    <div style={styles.cardIcon}>💬</div>
                                    <div style={styles.cardHeaderRight}>
                                        <div style={styles.cardDate}>
                                            {formatRelativeTime(session.updated_at)}
                                        </div>
                                        <button
                                            style={{
                                                ...styles.deleteButton,
                                                opacity: deletingId === session.session_id ? 0.5 : 1,
                                                cursor: deletingId === session.session_id ? 'not-allowed' : 'pointer',
                                                background: deletingId === session.session_id
                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.15)'
                                            }}
                                            onClick={(e) => handleDeleteSession(session.session_id, session.title, e)}
                                            disabled={deletingId === session.session_id}
                                            title="Delete conversation"
                                            onMouseEnter={(e) => {
                                                if (deletingId !== session.session_id) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div style={styles.cardContent}>
                                    <div style={styles.cardTitle}>{session.title}</div>
                                    {session.preview && (
                                        <div style={styles.cardPreview}>
                                            {session.preview}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            {confirmDelete && (
                <div style={styles.modalOverlay} onClick={cancelDelete}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={styles.confirmModal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <MdDelete size={32} style={{ color: '#ff3b30' }} />
                        </div>
                        <h3 style={styles.modalTitle}>{t('deleteConversation')}</h3>
                        <p style={styles.modalText}>
                            {t('deleteConversationConfirm')} <strong>"{confirmDelete.title}"</strong>?
                            <br />
                            {t('cannotBeUndone')}
                        </p>
                        <div style={styles.modalButtons}>
                            <button style={styles.cancelButton} onClick={cancelDelete}>
                                {t('cancel')}
                            </button>
                            <button style={styles.deleteButtonModal} onClick={confirmDeleteSession}>
                                {t('delete')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        position: 'relative',
        minHeight: '100vh',
        overflow: 'auto'
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
    content: {
        padding: '140px 20px 40px',  // Increased from 120px to prevent dock label overlap
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        textAlign: 'center',
        marginBottom: '40px'
    },
    title: {
        fontSize: '36px',
        fontWeight: '700',
        color: 'white',
        margin: '0 0 8px 0',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.9)',
        margin: 0
    },
    loading: {
        textAlign: 'center',
        color: 'white',
        fontSize: '18px',
        marginTop: '60px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        color: 'white'
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px'
    },
    emptyTitle: {
        fontSize: '24px',
        margin: '0 0 8px 0'
    },
    emptyText: {
        fontSize: '16px',
        opacity: 0.8,
        margin: '0 0 24px 0'
    },
    newChatButton: {
        padding: '12px 32px',
        fontSize: '16px',
        fontWeight: '600',
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    cardHeaderRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    cardIcon: {
        fontSize: '24px'
    },
    cardDate: {
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500'
    },
    deleteButton: {
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        padding: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.9)',
        minWidth: '34px',
        minHeight: '34px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    cardContent: {
        color: 'white'
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '8px',
        color: 'white'
    },
    cardPreview: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.4',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
    },
    // Confirmation Modal Styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    confirmModal: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    modalTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#333',
        margin: '0 0 12px 0',
        textAlign: 'center'
    },
    modalText: {
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.6',
        margin: '0 0 24px 0',
        textAlign: 'center'
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
    },
    cancelButton: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        background: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        color: '#333',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flex: 1
    },
    deleteButtonModal: {
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        background: '#ff3b30',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flex: 1
    }
};

export default HistoryPage;
