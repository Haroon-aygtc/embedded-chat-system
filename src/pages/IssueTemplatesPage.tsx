import React, { useState, useEffect } from "react";
import { TemplateIssue, createTemplateIssue } from "@/utils/templateIssue";
import IssueTemplate from "@/components/IssueTemplate";
import IssueList from "@/components/IssueList";
import { Button } from "@/components/ui/button";

const IssueTemplatesPage: React.FC = () => {
  const [issues, setIssues] = useState<TemplateIssue[]>([]);
  const [editingIssue, setEditingIssue] = useState<TemplateIssue | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load issues from localStorage on component mount
  useEffect(() => {
    const savedIssues = localStorage.getItem("issueTemplates");
    if (savedIssues) {
      try {
        const parsedIssues = JSON.parse(savedIssues);
        // Convert string dates back to Date objects
        const processedIssues = parsedIssues.map((issue: any) => ({
          ...issue,
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(issue.updatedAt),
        }));
        setIssues(processedIssues);
      } catch (error) {
        console.error("Error parsing saved issues:", error);
      }
    }
  }, []);

  // Save issues to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("issueTemplates", JSON.stringify(issues));
  }, [issues]);

  const handleSaveIssue = (issue: TemplateIssue) => {
    if (editingIssue) {
      // Update existing issue
      setIssues((prevIssues) =>
        prevIssues.map((i) => (i.id === issue.id ? issue : i)),
      );
    } else if (issue.title) {
      // Only add if it has a title (to handle cancel action)
      // Add new issue
      setIssues((prevIssues) => [...prevIssues, issue]);
    }

    setEditingIssue(null);
    setIsCreating(false);
  };

  const handleEditIssue = (issue: TemplateIssue) => {
    setEditingIssue(issue);
    setIsCreating(true);
  };

  const handleDeleteIssue = (issueId: string) => {
    if (confirm("Are you sure you want to delete this issue template?")) {
      setIssues((prevIssues) =>
        prevIssues.filter((issue) => issue.id !== issueId),
      );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issue Templates</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            Create New Template
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="mb-8">
          <IssueTemplate
            onSave={handleSaveIssue}
            initialIssue={editingIssue || {}}
          />
        </div>
      ) : (
        <IssueList
          issues={issues}
          onEdit={handleEditIssue}
          onDelete={handleDeleteIssue}
        />
      )}
    </div>
  );
};

export default IssueTemplatesPage;
