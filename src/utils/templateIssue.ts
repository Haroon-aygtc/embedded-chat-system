export interface TemplateIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high";
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultTemplateIssue: TemplateIssue = {
  id: "",
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const createTemplateIssue = (
  data: Partial<TemplateIssue>,
): TemplateIssue => {
  return {
    ...defaultTemplateIssue,
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date(),
  };
};
