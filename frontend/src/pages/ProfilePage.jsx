import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/api';
import Dock from '../components/Dock';
import SettingsModal from '../components/SettingsModal';
import '../styles/dock.css';

/**
 * ProfilePage - Modern personalized dashboard
 */
const ProfilePage = () => {
    const { token, logout } = useContext(AuthContext);
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        district: '',
        education: '',
        skills: '',
        careerSummary: ''
    });

    // Mock statistics - will be replaced with real data later
    const [stats] = useState({
        totalChats: 12,
        lastActive: new Date().toLocaleDateString(),
        mostDiscussedTopic: 'Job Search',
        preferredCategory: 'IT & Software'
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Fetched profile:', res.data);
            setProfile(res.data);
            setEditForm({
                name: res.data.name || '',
                email: res.data.email || '',
                district: res.data.profile?.district || '',
                education: res.data.profile?.education || '',
                skills: res.data.profile?.skills?.join(', ') || '',
                careerSummary: res.data.profile?.careerSummary || ''
            });
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const requestData = {
                name: editForm.name,
                profile: {
                    district: editForm.district,
                    education: editForm.education,
                    careerSummary: editForm.careerSummary,
                    skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean)
                }
            };

            console.log('Saving profile with data:', requestData);

            const response = await api.put(
                '/api/profile',
                requestData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('Save response:', response.data);

            // Close modal
            setShowEditModal(false);

            // Fetch fresh profile data
            await fetchProfile();

            // Show success toast
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);

        } catch (err) {
            console.error('Failed to update profile - Full error:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            alert(`Failed to update profile. Error: ${err.response?.data?.detail || err.message}`);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }
        try {
            await api.post(
                '/api/auth/change-password',
                {
                    current_password: passwordForm.currentPassword,
                    new_password: passwordForm.newPassword
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setShowPasswordModal(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (err) {
            console.error('Password change failed:', err);
            alert(`Failed to change password: ${err.response?.data?.detail || err.message}`);
        }
    };

    const handleLogout = () => {
        if (logout) logout();
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm(t('deleteAccountConfirm'))) {
            try {
                await api.delete('/api/account');

                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Call logout if available
                if (logout) logout();

                // Redirect to login
                navigate('/login');
            } catch (err) {
                console.error('Delete account error:', err);
                alert(t('deleteAccountError') || 'Failed to delete account. Please try again.');
            }
        }
    };

    const dockItems = [
        {
            icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            label: t('home'),
            onClick: () => navigate('/chat')
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
            onClick: () => { }
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

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Watermark Logo */}
            <div style={styles.watermarkLogo}>
                <img src="/logo.png" alt="" style={styles.watermarkImage} />
            </div>

            <div style={styles.content}>
                {loading ? (
                    <div style={styles.loading}>{t('loading')}</div>
                ) : (
                    <div style={styles.dashboard}>
                        {/* User Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            style={styles.card}
                        >
                            <div style={styles.cardHeader}>
                                <div style={styles.avatar}>
                                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <h2 style={styles.userName}>{profile?.name || 'User'}</h2>
                                <p style={styles.userEmail}>{profile?.email || ''}</p>
                            </div>
                            <div style={styles.infoGrid}>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoLabel}>{t('district')}</span>
                                    <span style={styles.infoValue}>{profile?.profile?.district || t('notProvided')}</span>
                                </div>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoLabel}>{t('education')}</span>
                                    <span style={styles.infoValue}>{profile?.profile?.education || t('notProvided')}</span>
                                </div>
                            </div>
                            <button style={styles.editButton} onClick={() => setShowEditModal(true)}>
                                ✏️ {t('editProfile')}
                            </button>
                        </motion.div>

                        {/* Skill Badges */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            style={styles.card}
                        >
                            <h3 style={styles.sectionTitle}>{t('skills')}</h3>
                            <div style={styles.skillsContainer}>
                                {profile?.profile?.skills && profile.profile.skills.length > 0 ? (
                                    profile.profile.skills.map((skill, index) => (
                                        <motion.span
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + index * 0.05 }}
                                            whileHover={{ scale: 1.05 }}
                                            style={styles.skillBadge}
                                        >
                                            {skill}
                                        </motion.span>
                                    ))
                                ) : (
                                    <p style={styles.emptyText}>{t('noSkillsAdded')}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Career Summary */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={styles.card}
                        >
                            <div style={styles.sectionHeader}>
                                <h3 style={styles.sectionTitle}>{t('careerSummary')}</h3>
                                <button
                                    style={styles.editIconButton}
                                    onClick={() => setShowEditModal(true)}
                                    title="Edit career summary"
                                >
                                    ✏️
                                </button>
                            </div>
                            <p style={profile?.profile?.careerSummary ? styles.summaryText : styles.placeholderText}>
                                {profile?.profile?.careerSummary || t('careerSummaryPlaceholder')}
                            </p>
                        </motion.div>

                        {/* Activity Statistics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            style={styles.card}
                        >
                            <h3 style={styles.sectionTitle}>{t('activityStatistics')}</h3>
                            <div style={styles.statsGrid}>
                                <div style={styles.statItem}>
                                    <div style={styles.statValue}>{stats.totalChats}</div>
                                    <div style={styles.statLabel}>{t('totalChats')}</div>
                                </div>
                                <div style={styles.statItem}>
                                    <div style={styles.statValue}>{stats.lastActive}</div>
                                    <div style={styles.statLabel}>{t('lastActive')}</div>
                                </div>
                                <div style={styles.statItem}>
                                    <div style={styles.statValue}>{stats.mostDiscussedTopic}</div>
                                    <div style={styles.statLabel}>{t('mostDiscussed')}</div>
                                </div>
                                <div style={styles.statItem}>
                                    <div style={styles.statValue}>{stats.preferredCategory}</div>
                                    <div style={styles.statLabel}>{t('preferredCategory')}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Account Settings */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={styles.card}
                        >
                            <h3 style={styles.sectionTitle}>{t('accountSettings')}</h3>
                            <div style={styles.settingsButtons}>
                                <button style={styles.settingButton} onClick={() => setShowPasswordModal(true)}>
                                    🔒 {t('changePassword')}
                                </button>
                                <button style={styles.settingButton} onClick={handleLogout}>
                                    🚪 {t('logout')}
                                </button>
                                <button style={{ ...styles.settingButton, ...styles.dangerButton }} onClick={handleDeleteAccount}>
                                    🗑️ {t('deleteAccount')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        className="settings-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            className="settings-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>{t('editProfile')}</h2>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('name')}</label>
                                <input
                                    style={styles.input}
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('district')}</label>
                                <input
                                    style={styles.input}
                                    value={editForm.district}
                                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('education')}</label>
                                <input
                                    style={styles.input}
                                    value={editForm.education}
                                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                                    placeholder={t('educationPlaceholder')}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('skills')}</label>
                                <input
                                    style={styles.input}
                                    value={editForm.skills}
                                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                    placeholder={t('skillsPlaceholder')}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('careerSummary')}</label>
                                <textarea
                                    style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                                    value={editForm.careerSummary}
                                    onChange={(e) => setEditForm({ ...editForm, careerSummary: e.target.value })}
                                    placeholder={t('careerSummaryInputPlaceholder')}
                                />
                            </div>

                            <div style={styles.modalButtons}>
                                <button className="settings-close" onClick={() => setShowEditModal(false)}>
                                    {t('cancel')}
                                </button>
                                <button style={styles.saveButton} onClick={handleSave}>
                                    {t('saveChanges')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        className="settings-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowPasswordModal(false)}
                    >
                        <motion.div
                            className="settings-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2>{t('changePassword')}</h2>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('currentPassword')}</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('newPassword')}</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder={t('passwordMinLength')}
                                />
                            </div>

                            <div style={styles.formField}>
                                <label style={styles.formLabel}>{t('confirmPassword')}</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div style={styles.modalButtons}>
                                <button className="settings-close" onClick={() => setShowPasswordModal(false)}>
                                    {t('cancel')}
                                </button>
                                <button style={styles.saveButton} onClick={handlePasswordChange}>
                                    {t('changePassword')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={styles.successToast}
                    >
                        ✅ {t('profileUpdated')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const styles = {
    page: {
        position: 'relative',
        minHeight: '100vh',
        padding: '140px 20px 40px',
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
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        zIndex: 10
    },
    loading: {
        textAlign: 'center',
        color: 'white',
        fontSize: '18px'
    },
    dashboard: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
    },
    card: {
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.2s'
    },
    cardHeader: {
        textAlign: 'center',
        marginBottom: '24px'
    },
    avatar: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
        margin: '0 auto 16px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
    },
    userName: {
        fontSize: '24px',
        fontWeight: '700',
        color: 'white',
        margin: '0 0 4px 0'
    },
    userEmail: {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.7)',
        margin: 0
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    infoLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    infoValue: {
        fontSize: '14px',
        color: 'white',
        padding: '10px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    editButton: {
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'white',
        margin: 0
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    editIconButton: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '6px 10px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: 'white'
    },
    skillsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
    },
    skillBadge: {
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.2s'
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '14px',
        fontStyle: 'italic',
        margin: 0
    },
    placeholderText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '14px',
        lineHeight: '1.6',
        margin: 0,
        fontStyle: 'italic'
    },
    summaryText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '14px',
        lineHeight: '1.6',
        margin: 0
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
    },
    statItem: {
        textAlign: 'center',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    statValue: {
        fontSize: '20px',
        fontWeight: '700',
        color: 'white',
        marginBottom: '6px'
    },
    statLabel: {
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    settingsButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    settingButton: {
        padding: '14px 20px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left'
    },
    dangerButton: {
        background: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        color: '#ff6b6b'
    },
    formField: {
        marginBottom: '20px'
    },
    formLabel: {
        display: 'block',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500'
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s'
    },
    modalButtons: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px'
    },
    saveButton: {
        flex: 1,
        padding: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600'
    },
    successToast: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        fontSize: '14px',
        fontWeight: '600',
        zIndex: 2000
    }
};

export default ProfilePage;
