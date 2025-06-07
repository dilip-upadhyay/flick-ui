import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { UIConfig, UIComponent } from '../models/ui-config.interface';

export interface AiChatRequest {
  message: string;
  context?: {
    currentConfig?: UIConfig;
    selectedComponent?: UIComponent;
    userIntent?: string;
  };
}

export interface AiChatResponse {
  message: string;
  configChanges?: Partial<UIConfig>;
  suggestions?: string[];
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private readonly apiUrl = '/api/ai-chat'; // Replace with your actual API endpoint

  constructor(private http: HttpClient) {}

  /**
   * Send a chat message to the AI service
   */
  sendMessage(request: AiChatRequest): Observable<AiChatResponse> {
    // For demo purposes, we'll simulate AI responses
    // In a real implementation, this would call your AI service
    return this.simulateAiResponse(request);
  }

  /**
   * Simulate AI responses for demo purposes
   * Replace this with actual API calls to your AI service
   */
  private simulateAiResponse(request: AiChatRequest): Observable<AiChatResponse> {
    const message = request.message.toLowerCase();
    
    // Analyze the user's message and generate appropriate responses
    let response: AiChatResponse;

    if (message.includes('form') || message.includes('input')) {
      response = this.generateFormResponse(message, request.context?.currentConfig);
    } else if (message.includes('dashboard') || message.includes('chart')) {
      response = this.generateDashboardResponse(message, request.context?.currentConfig);
    } else if (message.includes('navigation') || message.includes('menu')) {
      response = this.generateNavigationResponse(message, request.context?.currentConfig);
    } else if (message.includes('layout') || message.includes('grid')) {
      response = this.generateLayoutResponse(message, request.context?.currentConfig);
    } else if (message.includes('button') || message.includes('action')) {
      response = this.generateButtonResponse(message, request.context?.currentConfig);
    } else if (message.includes('style') || message.includes('color') || message.includes('theme')) {
      response = this.generateStyleResponse(message, request.context?.currentConfig);
    } else {
      response = this.generateGeneralResponse(message);
    }

    // Simulate network delay
    return of(response).pipe(delay(1500 + Math.random() * 1000));
  }

  private generateFormResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const formConfig: Partial<UIConfig> = {
      components: [
        ...(currentConfig?.components || []),
        {
          id: `form-${Date.now()}`,
          type: 'form',
          props: {
            title: 'Contact Form',
            fields: [
              { name: 'name', type: 'text', label: 'Full Name', required: true },
              { name: 'email', type: 'email', label: 'Email Address', required: true },
              { name: 'message', type: 'textarea', label: 'Message', rows: 4 }
            ],
            submitText: 'Send Message'
          },
          style: {
            maxWidth: '500px',
            margin: '20px auto',
            padding: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }
        }
      ]
    };

    return {
      message: "I've created a contact form with name, email, and message fields. The form includes validation and is styled with a clean, modern design. You can customize the fields, styling, and validation rules as needed.",
      configChanges: formConfig,
      suggestions: [
        "Add more fields like phone number or company",
        "Change the form layout to horizontal",
        "Add form validation messages",
        "Style the form with different colors"
      ]
    };
  }

  private generateDashboardResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const dashboardConfig: Partial<UIConfig> = {
      layout: {
        type: 'grid',
        columns: 3,
        gap: '20px'
      },
      components: [
        ...(currentConfig?.components || []),
        {
          id: `dashboard-${Date.now()}`,
          type: 'dashboard',
          props: {
            title: 'Analytics Dashboard',
            widgets: [
              { type: 'metric', title: 'Total Users', value: '12,345', change: '+5.2%' },
              { type: 'metric', title: 'Revenue', value: '$45,678', change: '+12.1%' },
              { type: 'metric', title: 'Conversion Rate', value: '3.45%', change: '-2.1%' },
              { type: 'chart', title: 'Monthly Trends', chartType: 'line' },
              { type: 'chart', title: 'User Distribution', chartType: 'pie' },
              { type: 'table', title: 'Recent Activity', rows: 5 }
            ]
          },
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            padding: '20px'
          }
        }
      ]
    };

    return {
      message: "I've created an analytics dashboard with key metrics, charts, and a data table. The dashboard uses a responsive grid layout that adapts to different screen sizes. You can customize the widgets, metrics, and styling.",
      configChanges: dashboardConfig,
      suggestions: [
        "Add more chart types (bar, donut, area)",
        "Include date range filters",
        "Add real-time data updates",
        "Customize the color scheme"
      ]
    };
  }

  private generateNavigationResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const navConfig: Partial<UIConfig> = {
      components: [
        {
          id: `nav-${Date.now()}`,
          type: 'navigation',
          props: {
            brand: 'Your App',
            items: [
              { label: 'Home', href: '/', active: true },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Forms', href: '/forms' },
              { label: 'Components', href: '/components' },
              { label: 'Settings', href: '/settings' }
            ]
          },
          style: {
            backgroundColor: '#1976d2',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            color: 'white'
          }
        },
        ...(currentConfig?.components || [])
      ]
    };

    return {
      message: "I've added a horizontal navigation menu with your main application sections. The navigation includes a brand logo area and responsive menu items with hover effects.",
      configChanges: navConfig,
      suggestions: [
        "Add dropdown menus for sub-navigation",
        "Include user profile menu",
        "Add mobile hamburger menu",
        "Customize colors and typography"
      ]
    };
  }

  private generateLayoutResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const layoutConfig: Partial<UIConfig> = {
      layout: {
        type: 'grid',
        columns: message.includes('3') ? 3 : message.includes('2') ? 2 : 4,
        gap: '20px',
        padding: '20px'
      }
    };

    const columns = layoutConfig.layout?.columns || 3;

    return {
      message: `I've converted your layout to a ${columns}-column grid system with responsive behavior. The grid will automatically adjust on smaller screens and maintains consistent spacing between elements.`,
      configChanges: layoutConfig,
      suggestions: [
        "Add responsive breakpoints",
        "Adjust grid gap spacing",
        "Create nested grid layouts",
        "Add grid area templates"
      ]
    };
  }

  private generateButtonResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const buttonConfig: Partial<UIConfig> = {
      components: [
        ...(currentConfig?.components || []),
        {
          id: `button-row-${Date.now()}`,
          type: 'button-group',
          props: {
            buttons: [
              { label: 'Save', type: 'primary', action: 'save' },
              { label: 'Cancel', type: 'secondary', action: 'cancel' },
              { label: 'Delete', type: 'danger', action: 'delete' },
              { label: 'Export', type: 'outline', action: 'export' }
            ]
          },
          style: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
            marginTop: '20px'
          }
        }
      ]
    };

    return {
      message: "I've added a row of action buttons with different styles and purposes. The buttons are aligned to the right and include primary, secondary, danger, and outline variants.",
      configChanges: buttonConfig,
      suggestions: [
        "Add button loading states",
        "Include icon buttons",
        "Create floating action buttons",
        "Add button tooltips and confirmation dialogs"
      ]
    };
  }

  private generateStyleResponse(message: string, currentConfig?: UIConfig): AiChatResponse {
    const colorScheme = this.extractColorFromMessage(message);
    
    const styleConfig: Partial<UIConfig> = {
      theme: {
        primary: colorScheme.primary,
        secondary: colorScheme.secondary,
        background: colorScheme.background,
        surface: colorScheme.surface,
        borderRadius: '8px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }
    };

    return {
      message: `I've updated the design with a modern ${colorScheme.name} color scheme. The styling includes rounded corners, clean typography, and improved spacing for a more professional look.`,
      configChanges: styleConfig,
      suggestions: [
        "Adjust color saturation and brightness",
        "Add dark mode support",
        "Include custom animations",
        "Apply gradient backgrounds"
      ]
    };
  }

  private generateGeneralResponse(message: string): AiChatResponse {
    const responses = [
      "I can help you create and modify UI components. Try asking me to add forms, layouts, navigation, or styling changes.",
      "I'm here to assist with your UI design. You can ask me to create dashboards, forms, modify layouts, or style components.",
      "I can help you build better user interfaces. What would you like to add or modify in your design?",
      "Let me help you with your UI. I can create components, modify layouts, add styling, or suggest improvements."
    ];

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: [
        "Add a contact form",
        "Create a dashboard with charts",
        "Add navigation menu",
        "Style with modern colors",
        "Convert to grid layout",
        "Add action buttons"
      ]
    };
  }

  private extractColorFromMessage(message: string): any {
    const colorSchemes = {
      blue: { name: 'blue', primary: '#1976d2', secondary: '#42a5f5', background: '#f5f5f5', surface: '#ffffff' },
      green: { name: 'green', primary: '#388e3c', secondary: '#66bb6a', background: '#f1f8e9', surface: '#ffffff' },
      purple: { name: 'purple', primary: '#7b1fa2', secondary: '#ab47bc', background: '#f3e5f5', surface: '#ffffff' },
      orange: { name: 'orange', primary: '#f57c00', secondary: '#ffb74d', background: '#fff8e1', surface: '#ffffff' },
      red: { name: 'red', primary: '#d32f2f', secondary: '#ef5350', background: '#ffebee', surface: '#ffffff' }
    };

    for (const [color, scheme] of Object.entries(colorSchemes)) {
      if (message.includes(color)) {
        return scheme;
      }
    }

    return colorSchemes.blue; // default
  }

  /**
   * Generate suggestions based on current context
   */
  generateSuggestions(context: { currentConfig?: UIConfig; selectedComponent?: UIComponent }): string[] {
    const suggestions = [
      "Add a contact form with validation",
      "Create a dashboard with metrics and charts",
      "Add horizontal navigation menu",
      "Convert layout to responsive grid",
      "Style components with modern colors",
      "Add loading states and animations"
    ];

    if (context.selectedComponent) {
      suggestions.unshift(
        `Modify the selected ${context.selectedComponent.type} component`,
        `Change styling of ${context.selectedComponent.type}`,
        `Add properties to ${context.selectedComponent.type}`
      );
    }

    return suggestions;
  }

  /**
   * Validate and clean config changes before applying
   */
  validateConfigChanges(changes: Partial<UIConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate components
    if (changes.components) {
      changes.components.forEach((component, index) => {
        if (!component.id) {
          errors.push(`Component at index ${index} is missing an id`);
        }
        if (!component.type) {
          errors.push(`Component at index ${index} is missing a type`);
        }
      });
    }

    // Validate layout
    if (changes.layout) {
      if (changes.layout.columns && (changes.layout.columns < 1 || changes.layout.columns > 12)) {
        errors.push('Layout columns must be between 1 and 12');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
