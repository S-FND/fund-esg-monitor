import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminNotifications, AdminNotification } from '@/hooks/useAdminNotifications';
import { Bell, Building2, Send, Check, CheckCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'submission':
      return Send;
    default:
      return Building2;
  }
};

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onViewCompany,
}: {
  notification: AdminNotification;
  onMarkAsRead: () => void;
  onViewCompany: () => void;
}) => {
  const Icon = getNotificationIcon(notification.notification_type);
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const fullDate = format(new Date(notification.createdAt), 'PPP p');

  return (
    <Card className={cn(
      'transition-colors',
      !notification.isRead && 'border-primary/30 bg-primary/5'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            notification.notification_type === 'submission' ? 'bg-esg-environmental/10' : 'bg-primary/10'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              notification.notification_type === 'submission' ? 'text-esg-environmental' : 'text-primary'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    'text-sm',
                    !notification.isRead && 'font-semibold'
                  )}>
                    {notification.title}
                  </h4>
                  {!notification.isRead && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground" title={fullDate}>
                    {timeAgo}
                  </span>
                  {notification.metadata.quarter && notification.metadata.year && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {notification.metadata.quarter} {notification.metadata.year}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {notification.company_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewCompany}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                )}
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMarkAsRead}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useAdminNotifications();

  const handleViewCompany = (notification: AdminNotification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.company_id) {
      navigate(`/mis/portfolio/${notification.company_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
            <p className="text-muted-foreground text-sm">
              You'll receive notifications when companies submit their KPI data
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(notification => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={() => markAsRead(notification._id)}
              onViewCompany={() => handleViewCompany(notification)}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default Notifications;
