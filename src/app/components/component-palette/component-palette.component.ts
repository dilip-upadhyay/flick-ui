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
  template: `
    <div class="component-palette">
      <!-- Search Bar -->
      <div class="palette-search">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search components</mat-label>
          <input matInput [(ngModel)]="searchTerm" (input)="filterComponents()" placeholder="Type to search...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- Categories -->
      <div class="palette-categories">
        <mat-accordion>
          @for (category of filteredCategories; track category.name) {
            <mat-expansion-panel [expanded]="category.name === 'Layout'" class="category-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>{{ category.icon }}</mat-icon>
                  <span>{{ category.name }}</span>
                  <mat-chip class="component-count">{{ category.components.length }}</mat-chip>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="components-grid">
                @for (component of category.components; track component.type) {
                  <div 
                    class="component-item"
                    draggable="true"
                    (dragstart)="onDragStart($event, component)"
                    (click)="onComponentClick(component)"
                    matTooltip="{{ component.description }}"
                    matTooltipPosition="right">
                    
                    <div class="component-icon">
                      <mat-icon>{{ component.icon }}</mat-icon>
                    </div>
                    
                    <div class="component-info">
                      <div class="component-name">{{ component.name }}</div>
                      <div class="component-description">{{ component.description }}</div>
                    </div>
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredCategories.length === 0">
        <mat-icon>search_off</mat-icon>
        <p>No components found</p>
        <small>Try adjusting your search terms</small>
      </div>
    </div>
  `,
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
          name: 'Form',
          icon: 'assignment',
          description: 'Dynamic form with validation',
          category: 'Forms'
        },
        {
          type: 'button',
          name: 'Button',
          icon: 'smart_button',
          description: 'Interactive button component',
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
