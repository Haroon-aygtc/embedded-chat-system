import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import moderationService, {
  FlaggedContent,
} from "@/services/moderationService";
import chatService from "@/services/chatService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Paperclip,
} from "lucide-react";

export default function ModerationQueue() {
  const { user } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected"
  >("pending");
  const [loading, setLoading] = useState(true);
  const [contentDetails, setContentDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    loadFlaggedContent(activeTab);
  }, [activeTab]);

  const loadFlaggedContent = async (
    status: "pending" | "approved" | "rejected",
  ) => {
    setLoading(true);
    try {
      const content = await moderationService.getModerationQueue(status);
      setFlaggedContent(content);

      // Load content details for messages
      const messageIds = content
        .filter((item) => item.contentType === "message")
        .map((item) => item.contentId);

      if (messageIds.length > 0) {
        const details: Record<string, any> = {};

        for (const id of messageIds) {
          try {
            // This is a simplified approach - in a real app, you'd batch these requests
            const message = await chatService.getMessageById(id);
            if (message) {
              details[id] = message;
            }
          } catch (error) {
            console.error(`Error fetching message ${id}:`, error);
          }
        }

        setContentDetails((prev) => ({ ...prev, ...details }));
      }
    } catch (error) {
      console.error("Error loading moderation queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    if (!user) return;

    try {
      await moderationService.reviewContent(id, status, user.id);
      // Remove the reviewed item from the current list
      setFlaggedContent((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error reviewing content:", error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      case "attachment":
        return <Paperclip className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderContentPreview = (item: FlaggedContent) => {
    if (item.contentType === "message" && contentDetails[item.contentId]) {
      const message = contentDetails[item.contentId];
      return (
        <div className="mt-2 p-3 bg-gray-100 rounded-md">
          <p className="text-sm font-medium">Message Content:</p>
          <p className="text-sm mt-1">{message.message}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Content Moderation</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : flaggedContent.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No {status} content to display.
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-250px)]">
                {flaggedContent.map((item) => (
                  <Card key={item.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            {getContentTypeIcon(item.contentType)}
                            <CardTitle className="text-lg">
                              {item.contentType.charAt(0).toUpperCase() +
                                item.contentType.slice(1)}{" "}
                              Report
                            </CardTitle>
                            {getStatusBadge(item.status)}
                          </div>
                          <CardDescription className="mt-1">
                            Reported on{" "}
                            {new Date(item.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">
                            Reason for report:
                          </p>
                          <p className="text-sm mt-1">{item.reason}</p>
                        </div>
                        {renderContentPreview(item)}
                      </div>
                    </CardContent>
                    {item.status === "pending" && (
                      <CardFooter className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(item.id, "rejected")}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReview(item.id, "approved")}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </ScrollArea>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
