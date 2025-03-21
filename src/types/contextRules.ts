export type FilterType = "keyword" | "regex" | "semantic";
export type FilterAction = "block" | "flag" | "modify";

export interface ResponseFilter {
  type: FilterType;
  value: string;
  action: FilterAction;
}

export interface ContextRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  contextType: "business" | "general";
  keywords: string[];
  excludedTopics: string[];
  promptTemplate: string;
  responseFilters: ResponseFilter[];
  createdAt: string;
  updatedAt: string;
}
