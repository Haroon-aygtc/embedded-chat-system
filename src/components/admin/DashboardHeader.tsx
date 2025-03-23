import React from "react";
import { Bell, Search, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import realtimeService from "@/services/realtimeService";

interface DashboardHeaderProps {
  title?: string;
}

const DashboardHeader = ({
  title = "Admin Dashboard",
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new notifications
    const unsubscribe = realtimeService.subscribeToNotifications(
      auth.user?.id || "",
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setNotificationCount((count) => count + 1);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [auth.user?.id]);

  const fetchNotifications = async () => {
    if (!auth.user?.id) return;

    try {
      setLoading(true);
      const notifications = await realtimeService.fetchNotifications(
        auth.user.id,
        5,
      );
      setNotifications(notifications);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!auth.user?.id || notifications.length === 0) return;

    try {
      const notificationIds = notifications.map((n) => n.id);
      const success =
        await realtimeService.markNotificationsAsRead(notificationIds);

      if (success) {
        setNotificationCount(0);
        fetchNotifications(); // Refresh the list
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/user/profile");
  };

  const handleSettingsClick = () => {
    navigate("/admin/settings");
  };

  return (
    <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between w-full h-20 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search..."
            className="pl-8 h-9 w-full bg-gray-50 focus:bg-white"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount > 0 && (
                <Badge
                  className={cn(
                    "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                  )}
                  variant="destructive"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {notificationCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markNotificationsAsRead}
                  className="text-xs h-7"
                >
                  Mark all as read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
          <Settings className="h-5 w-5 text-gray-600" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {auth.user?.name
                    ? auth.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm hidden md:inline-block">
                {auth.user?.name || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleProfileClick}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleSettingsClick}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
