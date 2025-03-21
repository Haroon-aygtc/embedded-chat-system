import React, { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  isLoading?: boolean;
  loadingHeight?: string;
  error?: string | null;
  onRetry?: () => void;
}

const AdminCard = ({
  title,
  description,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  children,
  footer,
  isLoading = false,
  loadingHeight = "12rem",
  error = null,
  onRetry,
}: AdminCardProps) => {
  return (
    <Card className={cn("shadow-sm", className)}>
      {(title || description) && (
        <CardHeader className={headerClassName}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("pt-6", contentClassName)}>
        {isLoading ? (
          <div
            className="flex items-center justify-center"
            style={{ height: loadingHeight }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
      {footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
    </Card>
  );
};

export default AdminCard;
