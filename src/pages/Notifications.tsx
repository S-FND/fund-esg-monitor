import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from "@/utils/httpInterceptor";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCheck, Clock, User, Bell, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
    _id: string;
    sendFrom: string;          // API returns string ID, not object
    sendTo: string;
    message: string;
    description: string;
    isRead: boolean;
    redirectUrl: string;
    createdAt: string;
    updatedAt: string;
    userDetails: { _id: string; name: string }[];
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response: any = await http.get('notification');
            if (response?.data?.status === true) {
                setNotifications(response.data.data || []);
            } else {
                toast.error('Failed to load notifications');
            }
        } catch (error) {
            toast.error('Error loading notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await http.put('notification', { _id: id, isRead: true });
            setNotifications(prev =>
                prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
            await Promise.all(
                unreadIds.map(id => http.put('notification', { _id: id, isRead: true }))
            );
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.redirectUrl) {
            navigate(notification.redirectUrl);
        }
    };

    // ✅ SORT: unread first, then by createdAt descending (newest on top)
    const sortedNotifications = [...notifications].sort((a, b) => {
        // Unread (isRead = false) should come BEFORE read (isRead = true)
        if (a.isRead !== b.isRead) {
            return a.isRead ? 1 : -1; // false (0) < true (1), so unread first
        }
        // Same read status → newest createdAt first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Helper to get sender name from userDetails array
    const getSenderName = (n: Notification) => {
        return n.userDetails?.[0]?.name || 'Unknown';
    };

    return (
        <div className="mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate("/esg-dd/cap")}
                        className="hover:bg-[#10b77f]/10 hover:text-[#10b77f] hover:border-[#10b77f]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500">
                                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                </div>

                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 hover:bg-[#10b77f]/10 hover:text-[#10b77f] hover:border-[#10b77f]"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-8 w-8 text-[#10b77f]" />
                </div>
            ) : sortedNotifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedNotifications.map((notif) => (
                        <Card
                            key={notif._id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                                !notif.isRead
                                    ? "border-l-4 border-l-[#10b77f] bg-[#10b77f]/10"
                                    : "bg-white"
                            }`}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm line-clamp-2">
                                                {notif.message}
                                            </span>

                                            {!notif.isRead && (
                                                <Badge variant="default" className="bg-[#10b77f] text-white text-xs">
                                                    New
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="mt-1 text-left text-sm text-gray-600 line-clamp-3 break-words">
                                            {notif.description}
                                        </p>

                                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>{getSenderName(notif)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {formatDistanceToNow(new Date(notif.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {!notif.isRead && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#10b77f] hover:bg-[#10b77f]/10 hover:text-[#10b77f]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notif._id);
                                            }}
                                        >
                                            Mark read
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;