import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

const AdminPageHeader = ({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;
