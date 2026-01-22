import { Bell, Check, CheckCheck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const { notifications, isLoading, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(notificationId);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">الإشعارات</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={notification.order_id ? "/supplier/orders" : "#"}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.is_read)
                  }
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      notification.type === "order"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد إشعارات</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
