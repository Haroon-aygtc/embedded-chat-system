import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, RotateCcw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  versions: any[];
  onRestore: (version: number) => Promise<void>;
  title: string;
  type: "contextRule" | "promptTemplate" | "systemSettings";
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  onClose,
  versions,
  onRestore,
  title,
  type,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVersion(null);
      setError(null);
    }
  }, [isOpen]);

  const handleRestore = async () => {
    if (selectedVersion === null) return;

    try {
      setIsRestoring(true);
      setError(null);
      await onRestore(selectedVersion);
      onClose();
    } catch (err) {
      setError(
        `Failed to restore version ${selectedVersion}. Please try again.`,
      );
      console.error("Error restoring version", err);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const getVersionLabel = (version: any) => {
    if (type === "contextRule") {
      return `Version ${version.version}: ${version.data?.name || "Unknown"}`;
    } else if (type === "promptTemplate") {
      return `Version ${version.version}: ${version.data?.name || "Unknown"}`;
    } else {
      return `Version ${version.id}: ${formatDate(version.created_at)}`;
    }
  };

  const getVersionDetails = (version: any) => {
    if (type === "contextRule") {
      return (
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Name:</span> {version.data?.name}
          </div>
          <div>
            <span className="font-semibold">Description:</span>{" "}
            {version.data?.description || "No description"}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <Badge variant={version.data?.is_active ? "default" : "outline"}>
              {version.data?.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <span className="font-semibold">Keywords:</span>{" "}
            {version.data?.keywords?.join(", ") || "None"}
          </div>
          <div>
            <span className="font-semibold">Created:</span>{" "}
            {formatDate(version.data?.created_at)}
          </div>
        </div>
      );
    } else if (type === "promptTemplate") {
      return (
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Name:</span> {version.data?.name}
          </div>
          <div>
            <span className="font-semibold">Description:</span>{" "}
            {version.data?.description || "No description"}
          </div>
          <div>
            <span className="font-semibold">Category:</span>{" "}
            <Badge>{version.data?.category || "general"}</Badge>
          </div>
          <div>
            <span className="font-semibold">Variables:</span>{" "}
            {version.data?.variables?.join(", ") || "None"}
          </div>
          <div className="mt-2">
            <span className="font-semibold">Template:</span>
            <div className="mt-1 p-2 bg-muted rounded-md text-sm">
              {version.data?.template || "No template"}
            </div>
          </div>
          <div>
            <span className="font-semibold">Created:</span>{" "}
            {formatDate(version.data?.created_at)}
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Created:</span>{" "}
            {formatDate(version.created_at)}
          </div>
          <div className="mt-2">
            <span className="font-semibold">Settings:</span>
            <pre className="mt-1 p-2 bg-muted rounded-md text-sm overflow-auto">
              {JSON.stringify(version.settings, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title} Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this{" "}
            {type.replace(/([A-Z])/g, " $1").toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-1">
                {versions.map((version) => (
                  <Button
                    key={version.id}
                    variant={
                      selectedVersion === version.version ? "default" : "ghost"
                    }
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setSelectedVersion(version.version)}
                  >
                    <div className="truncate">{getVersionLabel(version)}</div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="w-2/3 pl-4">
            <ScrollArea className="h-[50vh]">
              {selectedVersion !== null ? (
                <div className="space-y-4">
                  {getVersionDetails(
                    versions.find((v) => v.version === selectedVersion),
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a version to view details
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            disabled={selectedVersion === null || isRestoring}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isRestoring ? "Restoring..." : "Restore Selected Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistory;
