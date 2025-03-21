export interface WidgetConfig {
  id: string;
  user_id: string;
  settings: WidgetSettings;
  created_at: string;
  updated_at: string;
}

export interface WidgetSettings {
  // Appearance
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: number;
  chatIconSize: number;

  // Behavior
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialState: "minimized" | "expanded";
  autoOpen: boolean;
  autoOpenDelay: number;
  showNotifications: boolean;

  // Content
  chatTitle: string;
  welcomeMessage: string;
  placeholderText: string;

  // Embedding
  embedMethod: "iframe" | "web-component";
  zIndex: number;
}
