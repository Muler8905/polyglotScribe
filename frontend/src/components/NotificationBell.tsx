import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
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
                  onClick={() => !n.read && markAsRead(n._id)}
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
    </div>
  );
}
