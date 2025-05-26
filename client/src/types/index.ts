export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

export interface ProgressMetrics {
  current: number;
  goal: number;
  percentage: number;
  remaining: number;
  isComplete: boolean;
}

export interface SupervisionTypeCount {
  individual: number;
  dyadic: number;
  group: number;
  none: number;
}

export interface TimeBasedSummary {
  totalHours: number;
  averageHours: number;
  sessionCount: number;
  supervisionHours: number;
}

export interface MilestoneStatus {
  cch_25: boolean;
  cch_100: boolean;
  cch_500: boolean;
  cch_1000: boolean;
  goal_completion: boolean;
}

export interface FilterOptions {
  type: "all" | "direct" | "indirect";
  supervision: "all" | "none" | "individual" | "dyadic" | "group";
  dateRange: {
    from?: Date;
    to?: Date;
  };
  search: string;
}

export interface SortOptions {
  field: "dateOfContact" | "clientContactHours" | "supervisionHours";
  direction: "asc" | "desc";
}

export interface ExportOptions {
  format: "csv" | "json" | "pdf";
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeNotes: boolean;
  includeSupervision: boolean;
}

export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "destructive" | "success" | "warning";
  duration?: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface FormValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// AI-related types
export interface AiPrompt {
  system: string;
  user: string;
  context?: Record<string, any>;
}

export interface AiResponse {
  content: string;
  confidence?: number;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// Feature flag types
export interface FeatureFlags {
  aiAnalysis: boolean;
  webSummarization: boolean;
  advancedAnalytics: boolean;
  excelImport: boolean;
  darkMode: boolean;
  mobilePush: boolean;
}

// Responsive design types
export type BreakpointSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  "data-testid"?: string;
}

export interface AsyncComponentProps extends BaseComponentProps {
  loading?: boolean;
  error?: string | null;
  retry?: () => void;
}

// State management types
export interface AppState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  theme: {
    mode: "light" | "dark";
    colors: ThemeColors;
  };
  navigation: {
    sidebarOpen: boolean;
    focusMode: boolean;
    currentPath: string;
  };
  notifications: {
    toasts: ToastMessage[];
    unreadCount: number;
  };
}

export type AppAction =
  | { type: "AUTH_LOGIN"; payload: User }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_LOADING"; payload: boolean }
  | { type: "THEME_TOGGLE" }
  | { type: "THEME_SET"; payload: "light" | "dark" }
  | { type: "NAVIGATION_TOGGLE_SIDEBAR" }
  | { type: "NAVIGATION_SET_FOCUS_MODE"; payload: boolean }
  | { type: "NAVIGATION_SET_PATH"; payload: string }
  | { type: "NOTIFICATIONS_ADD_TOAST"; payload: ToastMessage }
  | { type: "NOTIFICATIONS_REMOVE_TOAST"; payload: string };
