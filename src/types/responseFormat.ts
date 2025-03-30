export interface ResponseFormat {
  id: string;
  name: string;
  description: string;
  formatType: "json" | "markdown" | "html" | "text";
  template: string;
  isActive: boolean;
  brandingEnabled?: boolean;
  brandName?: string;
  brandColor?: string;
  brandLogo?: string;
  structuredData?: boolean;
  dataSchema?: string;
  variables: string[];
  contextRuleId?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface ApplyFormatParams {
  formatId: string;
  variables: Record<string, string>;
  sampleContent?: string;
}

export interface CreateFormatParams {
  name: string;
  description: string;
  formatType: "json" | "markdown" | "html" | "text";
  template: string;
  isActive: boolean;
  brandingEnabled?: boolean;
  brandName?: string;
  brandColor?: string;
  brandLogo?: string;
  structuredData?: boolean;
  dataSchema?: string;
  variables: string[];
  contextRuleId?: string;
}

export interface UpdateFormatParams extends Partial<CreateFormatParams> {}
