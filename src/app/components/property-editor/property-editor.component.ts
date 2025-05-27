import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { UIConfig, UIComponent, ComponentType } from '../../models/ui-config.interface';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

interface PropertyDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'array' | 'object';
  options?: any[];
  description?: string;
  defaultValue?: any;
  category?: string;
}

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="property-editor" *ngIf="selectedComponent; else noSelection">
      <!-- Component Info -->
      <div class="component-info">
        <div class="component-header">
          <mat-icon>{{ getComponentIcon(selectedComponent.type) }}</mat-icon>
          <div class="component-details">
            <h3>{{ getComponentLabel(selectedComponent.type) }}</h3>
            <span class="component-id">ID: {{ selectedComponent.id }}</span>
          </div>
        </div>
      </div>

      <!-- Property Categories -->
      <mat-accordion multi="true" class="property-accordion">
        <!-- Basic Properties -->
        <mat-expansion-panel 
          *ngIf="basicProperties.length > 0"
          [expanded]="true"
          class="property-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>settings</mat-icon>
              Basic Properties
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <form [formGroup]="propertyForm" class="property-form">
            <div *ngFor="let prop of basicProperties" class="property-field">
              <ng-container [ngSwitch]="prop.type">
                <!-- Text Input -->
                <mat-form-field *ngSwitchCase="'text'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <!-- Number Input -->
                <mat-form-field *ngSwitchCase="'number'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput type="number" [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <!-- Boolean Toggle -->
                <div *ngSwitchCase="'boolean'" class="boolean-field">
                  <mat-slide-toggle [formControlName]="prop.key">
                    {{ prop.label }}
                  </mat-slide-toggle>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </div>

                <!-- Select Dropdown -->
                <mat-form-field *ngSwitchCase="'select'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <mat-select [formControlName]="prop.key">
                    <mat-option *ngFor="let option of prop.options" [value]="option.value">
                      {{ option.label }}
                    </mat-option>
                  </mat-select>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <!-- Color Picker -->
                <mat-form-field *ngSwitchCase="'color'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput type="color" [formControlName]="prop.key">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>
              </ng-container>
            </div>
          </form>
        </mat-expansion-panel>

        <!-- Layout Properties -->
        <mat-expansion-panel 
          *ngIf="layoutProperties.length > 0"
          class="property-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>view_quilt</mat-icon>
              Layout & Spacing
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <form [formGroup]="layoutForm" class="property-form">
            <div *ngFor="let prop of layoutProperties" class="property-field">
              <ng-container [ngSwitch]="prop.type">
                <mat-form-field *ngSwitchCase="'text'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <mat-form-field *ngSwitchCase="'number'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput type="number" [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <mat-form-field *ngSwitchCase="'select'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <mat-select [formControlName]="prop.key">
                    <mat-option *ngFor="let option of prop.options" [value]="option.value">
                      {{ option.label }}
                    </mat-option>
                  </mat-select>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>
              </ng-container>
            </div>
          </form>
        </mat-expansion-panel>

        <!-- Style Properties -->
        <mat-expansion-panel 
          *ngIf="styleProperties.length > 0"
          class="property-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>palette</mat-icon>
              Styling & Appearance
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <form [formGroup]="styleForm" class="property-form">
            <div *ngFor="let prop of styleProperties" class="property-field">
              <ng-container [ngSwitch]="prop.type">
                <mat-form-field *ngSwitchCase="'color'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput type="color" [formControlName]="prop.key">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <mat-form-field *ngSwitchCase="'select'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <mat-select [formControlName]="prop.key">
                    <mat-option *ngFor="let option of prop.options" [value]="option.value">
                      {{ option.label }}
                    </mat-option>
                  </mat-select>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <mat-form-field *ngSwitchCase="'text'" appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>

                <div *ngSwitchCase="'boolean'" class="boolean-field">
                  <mat-slide-toggle [formControlName]="prop.key">
                    {{ prop.label }}
                  </mat-slide-toggle>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </div>
              </ng-container>
            </div>
          </form>
        </mat-expansion-panel>

        <!-- Component-Specific Properties -->
        <mat-expansion-panel 
          *ngIf="specificProperties.length > 0"
          class="property-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>tune</mat-icon>
              {{ getComponentLabel(selectedComponent.type) }} Settings
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <form [formGroup]="specificForm" class="property-form">
            <div *ngFor="let prop of specificProperties" class="property-field">
              <ng-container [ngSwitch]="prop.type">
                <!-- Array Properties (like form fields, navigation items) -->
                <div *ngSwitchCase="'array'" class="array-field">
                  <div class="array-header">
                    <mat-label>{{ prop.label }}</mat-label>
                    <button mat-icon-button type="button" (click)="addArrayItem(prop.key)">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  
                  <div formArrayName="{{ prop.key }}" class="array-items">
                    <div *ngFor="let item of getFormArray(prop.key).controls; let i = index" 
                         class="array-item">
                      <ng-container [formGroupName]="i">
                        <div class="array-item-fields">
                          <mat-form-field appearance="outline">
                            <mat-label>Label</mat-label>
                            <input matInput formControlName="label">
                          </mat-form-field>
                          
                          <mat-form-field appearance="outline" *ngIf="prop.key === 'items'">
                            <mat-label>Link/Action</mat-label>
                            <input matInput formControlName="href">
                          </mat-form-field>
                          
                          <mat-form-field appearance="outline" *ngIf="prop.key === 'fields'">
                            <mat-label>Type</mat-label>
                            <mat-select formControlName="type">
                              <mat-option value="text">Text</mat-option>
                              <mat-option value="email">Email</mat-option>
                              <mat-option value="number">Number</mat-option>
                              <mat-option value="password">Password</mat-option>
                              <mat-option value="tel">Phone</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>
                        
                        <button mat-icon-button type="button" 
                                (click)="removeArrayItem(prop.key, i)"
                                class="remove-item-btn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </ng-container>
                    </div>
                  </div>
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </div>

                <!-- Other property types -->
                <mat-form-field *ngSwitchDefault appearance="outline">
                  <mat-label>{{ prop.label }}</mat-label>
                  <input matInput [formControlName]="prop.key" [placeholder]="prop.description || ''">
                  <mat-hint *ngIf="prop.description">{{ prop.description }}</mat-hint>
                </mat-form-field>
              </ng-container>
            </div>
          </form>
        </mat-expansion-panel>

        <!-- Actions -->
        <mat-expansion-panel class="property-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>flash_on</mat-icon>
              Actions
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="duplicateComponent()">
              <mat-icon>content_copy</mat-icon>
              Duplicate
            </button>
            
            <button mat-raised-button color="accent" (click)="resetProperties()">
              <mat-icon>refresh</mat-icon>
              Reset
            </button>
            
            <button mat-raised-button color="warn" (click)="deleteComponent()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>

    <ng-template #noSelection>
      <div class="no-selection">
        <mat-icon>touch_app</mat-icon>
        <h3>No Component Selected</h3>
        <p>Click on a component in the canvas to edit its properties</p>
      </div>
    </ng-template>
  `,
  styleUrls: ['./property-editor.component.css']
})
export class PropertyEditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedComponent: UIComponent | null = null;
  @Input() config: UIConfig | null = null;

  @Output() propertyChanged = new EventEmitter<{component: UIComponent, property: string, value: any}>();

  private destroy$ = new Subject<void>();

  propertyForm: FormGroup;
  layoutForm: FormGroup;
  styleForm: FormGroup;
  specificForm: FormGroup;

  basicProperties: PropertyDefinition[] = [];
  layoutProperties: PropertyDefinition[] = [];
  styleProperties: PropertyDefinition[] = [];
  specificProperties: PropertyDefinition[] = [];

  constructor(private fb: FormBuilder) {
    this.propertyForm = this.fb.group({});
    this.layoutForm = this.fb.group({});
    this.styleForm = this.fb.group({});
    this.specificForm = this.fb.group({});
  }

  ngOnInit() {
    // Subscribe to form changes
    this.propertyForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => this.handleFormChange('basic', values));

    this.layoutForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => this.handleFormChange('layout', values));

    this.styleForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => this.handleFormChange('style', values));

    this.specificForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(values => this.handleFormChange('specific', values));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedComponent'] && this.selectedComponent) {
      this.initializePropertyDefinitions();
      this.buildForms();
    }
  }

  private initializePropertyDefinitions() {
    if (!this.selectedComponent) return;

    const componentType = this.selectedComponent.type;

    // Reset arrays
    this.basicProperties = [];
    this.layoutProperties = [];
    this.styleProperties = [];
    this.specificProperties = [];

    // Basic properties common to all components
    this.basicProperties = [
      { key: 'id', label: 'Component ID', type: 'text', description: 'Unique identifier for this component' },
    ];

    // Layout properties
    this.layoutProperties = [
      { key: 'width', label: 'Width', type: 'text', description: 'CSS width value (e.g., 100%, 300px, auto)' },
      { key: 'height', label: 'Height', type: 'text', description: 'CSS height value (e.g., 200px, auto)' },
      { key: 'margin', label: 'Margin', type: 'text', description: 'CSS margin value (e.g., 16px, 1rem)' },
      { key: 'padding', label: 'Padding', type: 'text', description: 'CSS padding value (e.g., 16px, 1rem)' },
    ];

    // Style properties
    this.styleProperties = [
      { key: 'backgroundColor', label: 'Background Color', type: 'color' },
      { key: 'textColor', label: 'Text Color', type: 'color' },
      { key: 'borderRadius', label: 'Border Radius', type: 'text', description: 'CSS border radius (e.g., 4px, 50%)' },
      { key: 'boxShadow', label: 'Box Shadow', type: 'text', description: 'CSS box shadow value' },
    ];

    // Component-specific properties
    this.specificProperties = this.getComponentSpecificProperties(componentType);
  }

  private getComponentSpecificProperties(componentType: ComponentType): PropertyDefinition[] {
    switch (componentType) {
      case 'text':
        return [
          { key: 'content', label: 'Content', type: 'text', description: 'Text content or HTML' },
          { key: 'fontSize', label: 'Font Size', type: 'text', description: 'CSS font size (e.g., 16px, 1.2rem)' },
          { key: 'fontWeight', label: 'Font Weight', type: 'select', 
            options: [
              { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
              { value: '300', label: 'Light' },
              { value: '500', label: 'Medium' },
              { value: '700', label: 'Bold' }
            ]
          },
          { key: 'textAlign', label: 'Text Alignment', type: 'select',
            options: [
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
              { value: 'justify', label: 'Justify' }
            ]
          }
        ];

      case 'button':
        return [
          { key: 'text', label: 'Button Text', type: 'text', description: 'Text displayed on the button' },
          { key: 'color', label: 'Color Theme', type: 'select',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'accent', label: 'Accent' },
              { value: 'warn', label: 'Warning' },
              { value: '', label: 'Default' }
            ]
          },
          { key: 'variant', label: 'Button Style', type: 'select',
            options: [
              { value: 'raised', label: 'Raised' },
              { value: 'flat', label: 'Flat' },
              { value: 'stroked', label: 'Outlined' },
              { value: 'fab', label: 'Floating Action' }
            ]
          },
          { key: 'disabled', label: 'Disabled', type: 'boolean' },
          { key: 'icon', label: 'Icon', type: 'text', description: 'Material icon name' }
        ];

      case 'container':
      case 'card':
        return [
          { key: 'title', label: 'Title', type: 'text', description: 'Container title' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', description: 'Container subtitle' },
        ];

      case 'grid':
        return [
          { key: 'columns', label: 'Columns', type: 'number', description: 'Number of grid columns', defaultValue: 2 },
          { key: 'gap', label: 'Gap', type: 'text', description: 'Space between grid items (e.g., 16px)', defaultValue: '16px' },
          { key: 'title', label: 'Grid Title', type: 'text', description: 'Optional grid title' }
        ];

      case 'form':
        return [
          { key: 'title', label: 'Form Title', type: 'text', description: 'Form title' },
          { key: 'submitText', label: 'Submit Button Text', type: 'text', description: 'Text for submit button', defaultValue: 'Submit' },
          { key: 'fields', label: 'Form Fields', type: 'array', description: 'Configure form fields' }
        ];

      case 'navigation':
        return [
          { key: 'brand', label: 'Brand Name', type: 'text', description: 'Brand/logo text' },
          { key: 'items', label: 'Navigation Items', type: 'array', description: 'Configure navigation links' },
          { key: 'color', label: 'Color Theme', type: 'select',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'accent', label: 'Accent' },
              { value: 'warn', label: 'Warning' }
            ]
          }
        ];

      case 'header':
        return [
          { key: 'title', label: 'Title', type: 'text', description: 'Header title' },
          { key: 'subtitle', label: 'Subtitle', type: 'text', description: 'Header subtitle' },
          { key: 'backgroundImage', label: 'Background Image', type: 'text', description: 'URL to background image' }
        ];

      case 'image':
        return [
          { key: 'src', label: 'Image URL', type: 'text', description: 'URL or path to image' },
          { key: 'alt', label: 'Alt Text', type: 'text', description: 'Alternative text for accessibility' },
          { key: 'caption', label: 'Caption', type: 'text', description: 'Image caption' }
        ];

      default:
        return [];
    }
  }

  private buildForms() {
    if (!this.selectedComponent) return;

    const properties = this.selectedComponent.props || {};

    // Build basic form
    const basicControls: any = {};
    this.basicProperties.forEach(prop => {
      basicControls[prop.key] = new FormControl(
        this.selectedComponent?.[prop.key as keyof UIComponent] || prop.defaultValue || ''
      );
    });
    this.propertyForm = this.fb.group(basicControls);

    // Build layout form
    const layoutControls: any = {};
    this.layoutProperties.forEach(prop => {
      layoutControls[prop.key] = new FormControl(properties[prop.key] || prop.defaultValue || '');
    });
    this.layoutForm = this.fb.group(layoutControls);

    // Build style form
    const styleControls: any = {};
    this.styleProperties.forEach(prop => {
      styleControls[prop.key] = new FormControl(properties[prop.key] || prop.defaultValue || '');
    });
    this.styleForm = this.fb.group(styleControls);

    // Build specific form
    const specificControls: any = {};
    this.specificProperties.forEach(prop => {
      if (prop.type === 'array') {
        const arrayValue = properties[prop.key] || [];
        const formArray = this.fb.array(
          arrayValue.map((item: any) => this.createArrayItemFormGroup(prop.key, item))
        );
        specificControls[prop.key] = formArray;
      } else {
        specificControls[prop.key] = new FormControl(properties[prop.key] || prop.defaultValue || '');
      }
    });
    this.specificForm = this.fb.group(specificControls);

    // Re-subscribe to value changes after rebuilding forms
    this.ngOnInit();
  }

  private createArrayItemFormGroup(arrayKey: string, item: any): FormGroup {
    if (arrayKey === 'fields') {
      return this.fb.group({
        label: [item.label || ''],
        type: [item.type || 'text'],
        placeholder: [item.placeholder || ''],
        required: [item.required || false]
      });
    } else if (arrayKey === 'items') {
      return this.fb.group({
        label: [item.label || ''],
        href: [item.href || '#'],
        icon: [item.icon || '']
      });
    }
    
    return this.fb.group({
      label: [item.label || ''],
      value: [item.value || '']
    });
  }

  private handleFormChange(formType: string, values: any) {
    if (!this.selectedComponent) return;

    Object.keys(values).forEach(key => {
      const value = values[key];
      if (value !== null && value !== undefined) {
        if (formType === 'basic') {
          // Update component root properties
          this.propertyChanged.emit({
            component: this.selectedComponent!,
            property: key,
            value: value
          });
        } else {
          // Update component properties
          this.propertyChanged.emit({
            component: this.selectedComponent!,
            property: `properties.${key}`,
            value: value
          });
        }
      }
    });
  }

  getFormArray(controlName: string): FormArray {
    return this.specificForm.get(controlName) as FormArray;
  }

  addArrayItem(arrayKey: string) {
    const formArray = this.getFormArray(arrayKey);
    const newItem = this.createArrayItemFormGroup(arrayKey, {});
    formArray.push(newItem);
  }

  removeArrayItem(arrayKey: string, index: number) {
    const formArray = this.getFormArray(arrayKey);
    formArray.removeAt(index);
  }

  duplicateComponent() {
    if (this.selectedComponent) {
      // Emit event to parent to handle duplication
      console.log('Duplicate component:', this.selectedComponent);
    }
  }

  resetProperties() {
    if (this.selectedComponent) {
      // Reset forms to default values
      this.buildForms();
    }
  }

  deleteComponent() {
    if (this.selectedComponent) {
      // Emit event to parent to handle deletion
      console.log('Delete component:', this.selectedComponent);
    }
  }

  getComponentLabel(componentType: ComponentType): string {
    const labels: Record<ComponentType, string> = {
      container: 'Container',
      grid: 'Grid Layout',
      header: 'Header',
      navigation: 'Navigation',
      text: 'Text',
      card: 'Card',
      image: 'Image',
      form: 'Form',
      button: 'Button',
      dashboard: 'Dashboard',
      chart: 'Chart',
      modal: 'Modal',
      tabs: 'Tabs',
      accordion: 'Accordion'
    };
    return labels[componentType] || componentType;
  }

  getComponentIcon(componentType: ComponentType): string {
    const icons: Record<ComponentType, string> = {
      container: 'crop_free',
      grid: 'grid_view',
      header: 'title',
      navigation: 'menu',
      text: 'text_fields',
      card: 'credit_card',
      image: 'image',
      form: 'assignment',
      button: 'smart_button',
      dashboard: 'dashboard',
      chart: 'bar_chart',
      modal: 'open_in_new',
      tabs: 'tab',
      accordion: 'expand_more'
    };
    return icons[componentType] || 'widgets';
  }
}
