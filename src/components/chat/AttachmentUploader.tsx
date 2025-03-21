import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Image, File, FileText, Film } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import chatService from "@/services/chatService";

interface AttachmentUploaderProps {
  sessionId: string;
  userId: string;
  onAttachmentUploaded: (attachment: {
    type: "image" | "file" | "audio" | "video";
    url: string;
    filename: string;
    filesize: number;
  }) => void;
}

export default function AttachmentUploader({
  sessionId,
  userId,
  onAttachmentUploaded,
}: AttachmentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await uploadFile(file);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Determine file type
      let fileType: "image" | "file" | "audio" | "video" = "file";
      if (file.type.startsWith("image/")) {
        fileType = "image";
      } else if (file.type.startsWith("audio/")) {
        fileType = "audio";
      } else if (file.type.startsWith("video/")) {
        fileType = "video";
      }

      // Upload the file
      const result = await chatService.uploadAttachment(
        file,
        sessionId,
        userId,
      );

      clearInterval(progressInterval);

      if (result) {
        setUploadProgress(100);

        // Notify parent component
        onAttachmentUploaded({
          type: fileType,
          url: result.url,
          filename: result.filename,
          filesize: result.filesize,
        });

        // Reset after a short delay to show 100% completion
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        setIsUploading(false);
        setUploadProgress(0);
        // Handle error - could show a toast notification here
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
      setUploadProgress(0);
      // Handle error - could show a toast notification here
    }
  };

  const getFileTypeIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return <Image className="h-4 w-4" />;
    } else if (["mp3", "wav", "ogg"].includes(extension || "")) {
      return <File className="h-4 w-4" />;
    } else if (["mp4", "webm", "mov"].includes(extension || "")) {
      return <Film className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,audio/*,video/*,application/pdf,text/plain"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="h-8 w-8"
        type="button"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {isUploading && (
        <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 p-3 shadow-lg rounded-t-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getFileTypeIcon(fileInputRef.current?.files?.[0]?.name || "")}
              <span className="text-sm truncate max-w-[150px]">
                {fileInputRef.current?.files?.[0]?.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsUploading(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-right mt-1">
            {Math.round(uploadProgress)}%
          </p>
        </div>
      )}
    </div>
  );
}
