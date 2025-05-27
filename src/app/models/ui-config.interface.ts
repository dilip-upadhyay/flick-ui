export interface UIConfig {
  type: 'page' | 'layout';
  components: UIComponent[];
  layout?: LayoutConfig;
  metadata?: PageMetadata;
}

export interface UIComponent {
  id: string;
  type: ComponentType;
  props: any;
  children?: UIComponent[];
  conditions?: DisplayCondition[];
  styles?: ComponentStyles;
}

export type ComponentType = 
  | 'header'
  | 'navigation'
  | 'form'
  | 'dashboard'
  | 'card'
  | 'button'
  | 'text'
  | 'image'
  | 'container'
  | 'grid'
  | 'chart'
  | 'modal'
  | 'tabs'
  | 'accordion';

export interface LayoutConfig {
  type: 'grid' | 'flex' | 'stack';
  columns?: number;
  gap?: string;
  direction?: 'row' | 'column';
  justify?: string;
  align?: string;
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  favicon?: string;
}

export interface DisplayCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface ComponentStyles {
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  backgroundColor?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  [key: string]: any;
}

// Header specific interfaces
export interface HeaderConfig {
  title: string;
  logo?: string;
  subtitle?: string;
  actions?: ActionButton[];
  theme?: 'light' | 'dark' | 'primary';
}

export interface ActionButton {
  label: string;
  type: 'button' | 'link';
  action: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

// Navigation specific interfaces
export interface NavigationConfig {
  type: 'horizontal' | 'vertical' | 'sidebar' | 'breadcrumb';
  items: NavigationItem[];
  collapsible?: boolean;
  activeItem?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: string;
  children?: NavigationItem[];
  badge?: string;
  disabled?: boolean;
}

// Form specific interfaces
export interface FormConfig {
  title?: string;
  description?: string;
  fields: FormField[];
  actions: FormAction[];
  validation?: FormValidation;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[];
  validation?: FieldValidation | FieldValidation[];
  defaultValue?: any;
  helpText?: string;
  gridColumn?: string;
  // File input specific properties
  accept?: string;
  multiple?: boolean;
}

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'min' | 'max' | 'confirmField';
  value?: any;
  message: string;
  confirmField?: string; // For password confirmation
}

export interface FormAction {
  type: 'submit' | 'reset' | 'button';
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  action?: string;
  disabled?: boolean;
}

export interface FormValidation {
  showErrorsOnSubmit?: boolean;
  showErrorsOnBlur?: boolean;
  customValidators?: any[];
}

export interface DataSourceConfig {
  type: 'api' | 'static';
  url?: string;
  method?: 'GET' | 'POST';
  headers?: { [key: string]: string };
  params?: { [key: string]: any };
  transformResponse?: string;
}

// Dashboard specific interfaces
export interface DashboardConfig {
  title?: string;
  subtitle?: string;
  className?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval?: number;
  filters?: DashboardFilter[];
  actions?: ActionConfig[];
  dataSource?: DataSourceConfig;
  grid?: {
    columns?: number;
    gap?: string;
  };
  // New 5-part layout configuration
  layoutConfig?: {
    type: 'five-part' | 'grid';
    header?: DashboardSection;
    footer?: DashboardSection;
    leftPanel?: DashboardSection;
    rightPanel?: DashboardSection;
    body?: DashboardSection;
  };
}

export interface DashboardSection {
  enabled: boolean;
  widgets?: WidgetConfig[];
  height?: string;
  width?: string;
  className?: string;
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'text' | 'progress' | 'list';
  title: string;
  position: WidgetPosition;
  config: any;
  dataSource?: DataSourceConfig;
  actions?: ActionConfig[];
  metric?: {
    value: number;
    change: number;
    format?: string;
  };
}

export interface WidgetConfig {
  id: string;
  type: 'chart' | 'metric' | 'text' | 'progress' | 'list' | 'custom';
  title?: string;
  span?: number;
  rowSpan?: number;
  dataSource?: DataSourceConfig;
  actions?: ActionConfig[];
  
  // Widget-specific properties
  metric?: {
    value: number;
    label?: string;
    format?: string;
    change?: number;
  };
  chart?: {
    type: string;
    data: any;
    options?: any;
  };
  table?: {
    columns: { key: string; label: string; format?: string }[];
    data?: any[];
  };
  progress?: {
    label?: string;
    current: number;
    target: number;
    format?: string;
  };
  list?: {
    items: {
      primary: string;
      secondary?: string;
      value?: any;
      format?: string;
    }[];
  };
  text?: {
    content: string;
  };
  custom?: {
    component: string;
  };
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  type: 'grid' | 'masonry';
  columns: number;
  rowHeight?: number;
  gap?: number;
}

export interface DashboardFilter {
  id: string;
  type: 'select' | 'date' | 'text' | 'range';
  label: string;
  options?: SelectOption[];
  defaultValue?: any;
}

// Chart specific interfaces
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  title?: string;
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: any;
  scales?: any;
}

// Common action interface
export interface ActionConfig {
  type: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  action?: string;
  route?: string;
  disabled?: boolean;
  confirm?: {
    title: string;
    message: string;
  };
}
