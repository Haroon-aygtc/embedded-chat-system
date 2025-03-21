import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Laptop, Smartphone, LogOut, Shield, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet" | "unknown";
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrentSession: boolean;
}

interface UserSessionManagerProps {
  userId?: string;
  onSessionTerminated?: (sessionId: string) => Promise<void>;
  onAllSessionsTerminated?: () => Promise<void>;
}

const UserSessionManager = ({
  userId,
  onSessionTerminated,
  onAllSessionsTerminated,
}: UserSessionManagerProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from your API
      // Simulating API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockSessions: Session[] = [
        {
          id: "1",
          deviceName: "MacBook Pro",
          deviceType: "desktop",
          browser: "Chrome 98.0.4758.102",
          location: "San Francisco, CA, USA",
          ipAddress: "192.168.1.1",
          lastActive: new Date(),
          isCurrentSession: true,
        },
        {
          id: "2",
          deviceName: "iPhone 13",
          deviceType: "mobile",
          browser: "Safari 15.4",
          location: "San Francisco, CA, USA",
          ipAddress: "192.168.1.2",
          lastActive: new Date(Date.now() - 3600000), // 1 hour ago
          isCurrentSession: false,
        },
        {
          id: "3",
          deviceName: "Windows PC",
          deviceType: "desktop",
          browser: "Firefox 97.0",
          location: "New York, NY, USA",
          ipAddress: "192.168.1.3",
          lastActive: new Date(Date.now() - 86400000), // 1 day ago
          isCurrentSession: false,
        },
      ];

      setSessions(mockSessions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sessions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      if (onSessionTerminated) {
        await onSessionTerminated(sessionId);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Update local state
      setSessions(sessions.filter((session) => session.id !== sessionId));

      toast({
        title: "Session terminated",
        description: "The session has been successfully terminated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to terminate session. Please try again.",
      });
    }
  };

  const handleTerminateAllSessions = async () => {
    setIsTerminatingAll(true);
    try {
      if (onAllSessionsTerminated) {
        await onAllSessionsTerminated();
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Update local state - keep only current session
      setSessions(sessions.filter((session) => session.isCurrentSession));

      toast({
        title: "All sessions terminated",
        description: "All other sessions have been successfully terminated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to terminate all sessions. Please try again.",
      });
    } finally {
      setIsTerminatingAll(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "desktop":
      case "tablet":
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions across different devices
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw
              className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={
                  sessions.filter((s) => !s.isCurrentSession).length === 0 ||
                  isTerminatingAll
                }
                className="flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Sign Out All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out All Other Devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will terminate all sessions except your current one. You
                  will be signed out from all other devices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleTerminateAllSessions}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isTerminatingAll ? "Processing..." : "Sign Out All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.deviceType)}
                        <div>
                          <div className="font-medium">
                            {session.deviceName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.browser}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{session.location}</div>
                      <div className="text-xs text-muted-foreground">
                        {session.ipAddress}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(session.lastActive, "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      {session.isCurrentSession ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Current Session
                        </Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {session.isCurrentSession ? (
                        <Button variant="ghost" size="sm" disabled>
                          Current
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              Terminate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Terminate Session?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will sign you out from this device. You
                                will need to sign in again on that device.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleTerminateSession(session.id)
                                }
                                className="bg-destructive text-destructive-foreground"
                              >
                                Terminate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserSessionManager;
