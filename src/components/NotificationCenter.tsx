import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'expense' | 'inventory' | 'member' | 'menu' | 'general';
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      generateNotifications();
      setupRealtimeUpdates();
    }
  }, [user]);

  const generateNotifications = () => {
    // Generate sample notifications based on real data patterns
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'Low Stock Alert',
        message: 'Rice is running low (2 kg remaining). Consider restocking soon.',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        category: 'inventory'
      },
      {
        id: '2',
        title: 'New Expense Added',
        message: 'Monthly groceries expense of ₹5,200 has been recorded.',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        category: 'expense'
      },
      {
        id: '3',
        title: 'Payment Received',
        message: 'Member payment of ₹3,000 received from John Doe.',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        read: true,
        category: 'member'
      },
      {
        id: '4',
        title: 'Menu Updated',
        message: 'This week\'s menu has been updated with new items.',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        read: true,
        category: 'menu'
      },
      {
        id: '5',
        title: 'Critical Stock Alert',
        message: 'Onions are out of stock! Please restock immediately.',
        type: 'error',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        read: false,
        category: 'inventory'
      }
    ];

    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  };

  const setupRealtimeUpdates = () => {
    // Set up real-time listeners for different tables
    const expenseChannel = supabase
      .channel('expense-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          addNotification({
            title: 'New Expense Added',
            message: `Expense of ₹${payload.new.amount} has been recorded.`,
            type: 'info',
            category: 'expense'
          });
        }
      )
      .subscribe();

    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_items'
        },
        (payload) => {
          const item = payload.new;
          if (item.current_stock <= item.minimum_stock) {
            addNotification({
              title: 'Low Stock Alert',
              message: `${item.name} is running low (${item.current_stock} ${item.unit} remaining).`,
              type: 'warning',
              category: 'inventory'
            });
          }
        }
      )
      .subscribe();

    const paymentChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'member_payments'
        },
        (payload) => {
          addNotification({
            title: 'Payment Received',
            message: `Member payment of ₹${payload.new.amount} received.`,
            type: 'success',
            category: 'member'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(expenseChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(paymentChannel);
    };
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const getIcon = (category: string, type: string) => {
    switch (category) {
      case 'expense': return <DollarSign className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      case 'menu': return <Calendar className="h-4 w-4" />;
      default:
        switch (type) {
          case 'warning': return <AlertTriangle className="h-4 w-4" />;
          case 'success': return <CheckCircle className="h-4 w-4" />;
          case 'error': return <AlertTriangle className="h-4 w-4" />;
          default: return <Info className="h-4 w-4" />;
        }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 z-50 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notification.read ? 'bg-muted/30' : ''
                        } ${getTypeColor(notification.type)}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getIcon(notification.category, notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}