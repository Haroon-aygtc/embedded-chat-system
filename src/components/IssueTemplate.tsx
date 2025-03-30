import React, { useState } from "react";
import { TemplateIssue, createTemplateIssue } from "@/utils/templateIssue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface IssueTemplateProps {
  onSave: (issue: TemplateIssue) => void;
  initialIssue?: Partial<TemplateIssue>;
}

const IssueTemplate: React.FC<IssueTemplateProps> = ({
  onSave,
  initialIssue = {},
}) => {
  const [issue, setIssue] = useState<Partial<TemplateIssue>>(initialIssue);

  const handleChange = (field: keyof TemplateIssue, value: any) => {
    setIssue((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIssue = createTemplateIssue(issue);
    onSave(newIssue);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {initialIssue.id ? "Edit Issue" : "Create New Issue"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={issue.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Issue title"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={issue.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the issue"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={issue.status || "open"}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select
                value={issue.priority || "medium"}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="assignee" className="text-sm font-medium">
              Assignee (optional)
            </label>
            <Input
              id="assignee"
              value={issue.assignee || ""}
              onChange={(e) => handleChange("assignee", e.target.value)}
              placeholder="Assignee name"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSave(createTemplateIssue({}))}
          >
            Cancel
          </Button>
          <Button type="submit">{initialIssue.id ? "Update" : "Create"}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default IssueTemplate;
