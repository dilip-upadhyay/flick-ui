import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { ComponentType } from '../../models/ui-config.interface';

export interface ComponentCategory {
  name: string;
  icon: string;
  components: ComponentDefinition[];
}

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  icon: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-component-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './component-palette.component.html',
  styleUrls: ['./component-palette.component.css']
})
export class ComponentPaletteComponent {
  @Output() componentSelected = new EventEmitter<ComponentType>();

  searchTerm = '';
  categories: ComponentCategory[] = [
    {
      name: 'Layout',
      icon: 'view_module',
      components: [
        {
          type: 'container',
          name: 'Container',
          icon: 'crop_free',
          description: 'A wrapper container for other components',
          category: 'Layout'
        },
        {
          type: 'grid',
          name: 'Grid',
          icon: 'grid_view',
          description: 'Responsive grid layout system',
          category: 'Layout'
        }
      ]
    },
    {
      name: 'Navigation',
      icon: 'menu',
      components: [
        {
          type: 'header',
          name: 'Header',
          icon: 'web_asset',
          description: 'Page header with title and actions',
          category: 'Navigation'
        },
        {
          type: 'navigation',
          name: 'Navigation',
          icon: 'menu',
          description: 'Navigation menu with links',
          category: 'Navigation'
        }
      ]
    },
    {
      name: 'Content',
      icon: 'article',
      components: [
        {
          type: 'text',
          name: 'Text',
          icon: 'text_fields',
          description: 'Text content with various typography styles',
          category: 'Content'
        },
        {
          type: 'card',
          name: 'Card',
          icon: 'crop_portrait',
          description: 'Card container with header and content',
          category: 'Content'
        },
        {
          type: 'image',
          name: 'Image',
          icon: 'image',
          description: 'Image component with responsive sizing',
          category: 'Content'
        }
      ]
    },
    {
      name: 'Forms',
      icon: 'assignment',
      components: [
        {
          type: 'form',
          name: 'Form Container',
          icon: 'assignment',
          description: 'Complete form with validation and model binding',
          category: 'Forms'
        },
        {
          type: 'text-input',
          name: 'Text Input',
          icon: 'text_fields',
          description: 'Single line text input field',
          category: 'Forms'
        },
        {
          type: 'email-input',
          name: 'Email Input',
          icon: 'email',
          description: 'Email input field with validation',
          category: 'Forms'
        },
        {
          type: 'password-input',
          name: 'Password Input',
          icon: 'lock',
          description: 'Password input field with masking',
          category: 'Forms'
        },
        {
          type: 'number-input',
          name: 'Number Input',
          icon: 'pin',
          description: 'Numeric input field',
          category: 'Forms'
        },
        {
          type: 'textarea',
          name: 'Text Area',
          icon: 'notes',
          description: 'Multi-line text input',
          category: 'Forms'
        },
        {
          type: 'checkbox',
          name: 'Checkbox',
          icon: 'check_box',
          description: 'Checkbox for boolean values',
          category: 'Forms'
        },
        {
          type: 'radio',
          name: 'Radio Button',
          icon: 'radio_button_checked',
          description: 'Radio button for single selection',
          category: 'Forms'
        },
        {
          type: 'date-input',
          name: 'Date Picker',
          icon: 'calendar_today',
          description: 'Date selection input',
          category: 'Forms'
        },
        {
          type: 'file-input',
          name: 'File Upload',
          icon: 'upload_file',
          description: 'File upload input',
          category: 'Forms'
        },
        {
          type: 'submit-button',
          name: 'Submit Button',
          icon: 'send',
          description: 'Form submission button',
          category: 'Forms'
        },
        {
          type: 'reset-button',
          name: 'Reset Button',
          icon: 'refresh',
          description: 'Form reset button',
          category: 'Forms'
        },
        {
          type: 'button',
          name: 'Button',
          icon: 'smart_button',
          description: 'Generic interactive button',
          category: 'Forms'
        }
      ]
    },
    {
      name: 'Data Display',
      icon: 'bar_chart',
      components: [
        {
          type: 'dashboard',
          name: 'Dashboard',
          icon: 'dashboard',
          description: 'Widget-based dashboard layout',
          category: 'Data Display'
        },
        {
          type: 'chart',
          name: 'Chart',
          icon: 'bar_chart',
          description: 'Various chart types for data visualization',
          category: 'Data Display'
        }
      ]
    },
    {
      name: 'Interface',
      icon: 'widgets',
      components: [
        {
          type: 'modal',
          name: 'Modal',
          icon: 'open_in_new',
          description: 'Modal dialog overlay',
          category: 'Interface'
        },
        {
          type: 'tabs',
          name: 'Tabs',
          icon: 'tab',
          description: 'Tabbed content container',
          category: 'Interface'
        },
        {
          type: 'accordion',
          name: 'Accordion',
          icon: 'expand_more',
          description: 'Collapsible content sections',
          category: 'Interface'
        }
      ]
    },
    {
      name: 'Data Table',
      icon: 'table_chart',
      components: [
        {
          type: 'table-grid',
          name: 'Table Grid',
          icon: 'table_chart',
          description: 'Highly customizable data table with pagination, selection, and cell customization',
          category: 'Data Table'
        }
      ]
    }
  ];

  filteredCategories: ComponentCategory[] = [...this.categories];

  filterComponents() {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredCategories = this.categories
      .map(category => ({
        ...category,
        components: category.components.filter(component =>
          component.name.toLowerCase().includes(term) ||
          component.description.toLowerCase().includes(term) ||
          component.type.toLowerCase().includes(term)
        )
      }))
      .filter(category => category.components.length > 0);
  }

  onDragStart(event: DragEvent, component: ComponentDefinition) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', component.type);
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.componentSelected.emit(component.type);
  }

  onComponentClick(component: ComponentDefinition) {
    this.componentSelected.emit(component.type);
  }
}
