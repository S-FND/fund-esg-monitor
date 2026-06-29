import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { http } from '@/utils/httpInterceptor';

// export interface AdminNotification {
//   id: string;
//   notification_type: string;
//   title: string;
//   message: string;
//   company_id: string | null;
//   company_name: string | null;
//   quarter: string | null;
//   year: number | null;
//   is_read: boolean;
//   read_at: string | null;
//   created_at: string;
// }

interface NotificationUser {
  id: string;
  name: string;
}

export interface AdminNotification {
  _id?: string;
  notificationId?: string;
  sendFrom?: NotificationUser;
  sendTo?: NotificationUser;
  company_id?: string;
  company_name?: string;
  notification_type: string;
  title?: string;
  message: string;
  description?: string;
  isRead: boolean;
  readAt?: Date | string;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // const { data, error } = await supabase
      //   .from('admin_notifications')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      //   .limit(50);

      const data = await http.get("mis/admin-notifications");

      if (data.error) throw data.error;

      setNotifications(data.data || []);
      setUnreadCount((data.data || []).filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // const { error } = await supabase
      //   .from('admin_notifications')
      //   .update({ is_read: true, read_at: new Date().toISOString() })
      //   .eq('id', notificationId);

      const dataUpdate = await http.post("mis/admin-notifications", {
        notificationId
      })

      if (dataUpdate.error) throw dataUpdate.error;

      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // const { error } = await supabase
      //   .from('admin_notifications')
      //   .update({ is_read: true, read_at: new Date().toISOString() })
      //   .eq('is_read', false);

      const dataUpdate = await http.post("mis/admin-notifications", {
        update:'all'
      })

      if (dataUpdate.error) throw dataUpdate.error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    // const channel = supabase
    //   .channel('admin_notifications_changes')
    //   .on(
    //     'postgres_changes',
    //     {
    //       event: 'INSERT',
    //       schema: 'public',
    //       table: 'admin_notifications',
    //     },
    //     (payload) => {
    //       const newNotification = payload.new as AdminNotification;
    //       setNotifications(prev => [newNotification, ...prev]);
    //       if (!newNotification.isRead) {
    //         setUnreadCount(prev => prev + 1);
    //       }
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

// Helper function to create a submission notification
// export const createSubmissionNotification = async (
//   companyId: string,
//   companyName: string,
//   quarter: string,
//   year: number,
//   kpiCount: number
// ) => {
//   try {
//     const { error } = await supabase
//       .from('admin_notifications')
//       .insert({
//         notification_type: 'submission',
//         title: `${companyName} submitted KPI data`,
//         message: `${companyName} has submitted ${kpiCount} KPIs for ${quarter} ${year}`,
//         company_id: companyId,
//         company_name: companyName,
//         quarter,
//         year,
//       });

//     if (error) throw error;
//   } catch (error) {
//     console.error('Error creating notification:', error);
//   }
// };
