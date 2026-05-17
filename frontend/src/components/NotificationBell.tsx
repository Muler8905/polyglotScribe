import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/app/notifications");
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/app/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/app/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/app/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      const notif = notifications.find(n => n._id === id);
      if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'error': return <XCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] overflow-hidden rounded-xl border bg-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-bottom p-4 bg-muted/30">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Check size={12} /> Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] divide-y">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id}
                  onClick={() => {
                    if (!n.read) markAsRead(n._id);
                    setSelectedNotif(n);
                  }}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          to={n.link as any}
                          className="mt-2 text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
                          onClick={() => setIsOpen(false)}
                        >
                          View details <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => deleteNotif(n._id, e)}
                    className="absolute right-2 bottom-2 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  {!n.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 text-center border-t bg-muted/10">
             <span className="text-[11px] text-muted-foreground">End of notifications</span>
          </div>
        </div>
      )}

      {selectedNotif && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedNotif(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "var(--card, #1e1e1e)",
              color: "var(--foreground, #fff)",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--border, #2d2d2d)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div style={{
                backgroundColor: selectedNotif.type === "success" ? "rgba(16, 185, 129, 0.1)" :
                                selectedNotif.type === "warning" ? "rgba(245, 158, 11, 0.1)" :
                                selectedNotif.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                color: selectedNotif.type === "success" ? "rgb(16, 185, 129)" :
                       selectedNotif.type === "warning" ? "rgb(245, 158, 11)" :
                       selectedNotif.type === "error" ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)",
                borderRadius: "50%",
                padding: "0.5rem",
                display: "inline-flex",
                flexShrink: 0,
              }}>
                {getIcon(selectedNotif.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, wordBreak: "break-word", color: "var(--foreground, #fff)" }}>
                  {selectedNotif.title}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground, #a3a3a3)" }}>
                  {formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true })}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted-foreground, #a3a3a3)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "inline-flex",
                  borderRadius: "50%",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "var(--muted-foreground, #d4d4d4)",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "250px",
              overflowY: "auto",
              paddingRight: "4px",
            }}>
              {selectedNotif.message}
            </div>

            {selectedNotif.link && (
              <Link
                to={selectedNotif.link as any}
                onClick={() => {
                  setSelectedNotif(null);
                  setIsOpen(false);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  backgroundColor: "var(--primary, #3b82f6)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}
              >
                View Details <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
