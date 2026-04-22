import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, Menu, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentNotifications, type NotificationItem } from '../../api/repos';

const getScoreGrade = (score: number) => {
  if (score >= 90) return { label: 'A+', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', icon: CheckCircle };
  if (score >= 80) return { label: 'A', color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.20)', icon: CheckCircle };
  if (score >= 60) return { label: 'B', color: '#facc15', bg: 'rgba(250,204,21,0.10)', border: 'rgba(250,204,21,0.20)', icon: AlertTriangle };
  if (score >= 40) return { label: 'C', color: '#fb923c', bg: 'rgba(251,146,60,0.10)', border: 'rgba(251,146,60,0.20)', icon: AlertTriangle };
  return { label: 'F', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)', icon: XCircle };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: fetchRecentNotifications,
    refetchInterval: 30000,
  });

  const lastSeen = localStorage.getItem('notifications_last_seen') || '0';
  const unreadCount = (notifications || []).filter(
    n => new Date(n.createdAt).getTime() > parseInt(lastSeen)
  ).length;

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    localStorage.setItem('notifications_last_seen', Date.now().toString());
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('code_review_token');
    localStorage.removeItem('notifications_last_seen');
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-surface-color border-b border-border-color sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center flex-1">
        <button className="md:hidden text-gray-400 hover:text-white mr-4">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={handleBellClick}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-bg-color transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-primary-500 rounded-full px-1 border-2 border-surface-color">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div
              className="absolute right-0 top-12 w-[380px] max-h-[520px] rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16162a 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.15)' }}>
                    <Bell className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <p className="text-[11px] text-gray-500">{(notifications || []).length} recent analyses</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-primary-300" style={{ background: 'rgba(20,184,166,0.15)' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>

              {/* Notification Items */}
              <div className="overflow-y-auto max-h-[430px] custom-scrollbar py-1.5">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <Bell className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500">No analyses yet</p>
                    <p className="text-xs text-gray-600 mt-1">Results will appear here after you analyze a repository</p>
                  </div>
                ) : (
                  notifications.map((n, idx) => {
                    const grade = getScoreGrade(n.score);
                    const GradeIcon = grade.icon;
                    const isNew = new Date(n.createdAt).getTime() > parseInt(lastSeen);

                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          setShowNotifications(false);
                          const [o, r] = n.repoFullName.split('/');
                          navigate(`/repo/${o}/${r}/analysis/${n.commitSha}`);
                        }}
                        className="w-full text-left px-4 py-3 transition-all duration-150 group relative"
                        style={{
                          ...(idx < (notifications.length - 1) ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}),
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Unread indicator */}
                        {isNew && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-400" />
                        )}

                        <div className="flex items-start gap-3 pl-2">
                          {/* Score Circle */}
                          <div
                            className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: grade.bg,
                              border: `1px solid ${grade.border}`,
                            }}
                          >
                            <span className="text-sm font-bold leading-none" style={{ color: grade.color }}>
                              {n.score}
                            </span>
                            <span className="text-[8px] font-medium uppercase tracking-wider mt-0.5" style={{ color: grade.color, opacity: 0.7 }}>
                              {grade.label}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-semibold text-white truncate">{n.repoName}</span>
                              <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{n.summary}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <code className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#8b8fa3' }}>
                                {n.commitSha.substring(0, 7)}
                              </code>
                              <div className="flex items-center gap-1 text-[10px] text-gray-600">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(n.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border-color" />

        <button
          onClick={handleLogout}
          className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
};
