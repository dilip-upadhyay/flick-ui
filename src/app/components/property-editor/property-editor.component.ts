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
  description?: string;
  defaultValue?: any;
  category?: string;
  options?: { value: any; label: string }[];
}

@Component({
  selector: 'app-property-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],  templateUrl: './property-editor.component.html',
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
    this.subscribeToFormChanges();
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
          { key: 'position', label: 'Position', type: 'select', description: 'Navigation panel position',
            options: [
              { value: 'left', label: 'Left Side' },
              { value: 'right', label: 'Right Side' },
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' }
            ]
          },
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

      // Form Input Elements
      case 'text-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'placeholder', label: 'Placeholder', type: 'text', description: 'Placeholder text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Value', type: 'text', description: 'Default field value' }
        ];

      case 'email-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'placeholder', label: 'Placeholder', type: 'text', description: 'Placeholder text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Value', type: 'text', description: 'Default field value' }
        ];

      case 'password-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'placeholder', label: 'Placeholder', type: 'text', description: 'Placeholder text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' }
        ];

      case 'number-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'placeholder', label: 'Placeholder', type: 'text', description: 'Placeholder text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Value', type: 'number', description: 'Default field value' }
        ];

      case 'textarea':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'placeholder', label: 'Placeholder', type: 'text', description: 'Placeholder text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Value', type: 'text', description: 'Default field value' },
          { key: 'rows', label: 'Rows', type: 'number', description: 'Number of visible text lines', defaultValue: 4 }
        ];

      case 'checkbox':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Checked', type: 'boolean', description: 'Default checked state' }
        ];

      case 'radio':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'options', label: 'Options', type: 'array', description: 'Radio button options' }
        ];

      case 'date-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'defaultValue', label: 'Default Date', type: 'text', description: 'Default date value (YYYY-MM-DD format)' }
        ];

      case 'file-input':
        return [
          { key: 'label', label: 'Label', type: 'text', description: 'Field label text' },
          { key: 'required', label: 'Required', type: 'boolean', description: 'Mark field as required' },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the field' },
          { key: 'helpText', label: 'Help Text', type: 'text', description: 'Helper text below the field' },
          { key: 'multiple', label: 'Multiple Files', type: 'boolean', description: 'Allow multiple file selection' },
          { key: 'accept', label: 'Accepted File Types', type: 'text', description: 'File type restrictions (e.g., .jpg,.png,.pdf)' }
        ];

      case 'submit-button':
        return [
          { key: 'text', label: 'Button Text', type: 'text', description: 'Text displayed on the button', defaultValue: 'Submit' },
          { key: 'color', label: 'Color Theme', type: 'select',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'accent', label: 'Accent' },
              { value: 'warn', label: 'Warning' }
            ]
          },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the button' }
        ];

      case 'reset-button':
        return [
          { key: 'text', label: 'Button Text', type: 'text', description: 'Text displayed on the button', defaultValue: 'Reset' },
          { key: 'color', label: 'Color Theme', type: 'select',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'accent', label: 'Accent' },
              { value: 'warn', label: 'Warning' }
            ]
          },
          { key: 'disabled', label: 'Disabled', type: 'boolean', description: 'Disable the button' }
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
    this.subscribeToFormChanges();
  }

  private subscribeToFormChanges() {
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
      if (value !== null && value !== undefined && value !== '') {
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
            property: `props.${key}`,
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
      accordion: 'Accordion',
      // Form Elements
      'text-input': 'Text Input',
      'email-input': 'Email Input',
      'password-input': 'Password Input',
      'number-input': 'Number Input',
      'textarea': 'Textarea',
      'checkbox': 'Checkbox',
      'radio': 'Radio Button',
      'date-input': 'Date Input',
      'file-input': 'File Input',
      'submit-button': 'Submit Button',
      'reset-button': 'Reset Button'
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
      accordion: 'expand_more',
      // Form Elements
      'text-input': 'text_fields',
      'email-input': 'email',
      'password-input': 'lock',
      'number-input': 'numbers',
      'textarea': 'notes',
      'checkbox': 'check_box',
      'radio': 'radio_button_checked',
      'date-input': 'calendar_today',
      'file-input': 'upload_file',
      'submit-button': 'send',
      'reset-button': 'refresh'
    };
    return icons[componentType] || 'widgets';
  }

  // Form field helper methods for enhanced label editing
  isFormField(componentType: ComponentType): boolean {
    const formFieldTypes: ComponentType[] = [
      'text-input',
      'email-input', 
      'password-input',
      'number-input',
      'textarea',
      'checkbox',
      'radio',
      'date-input',
      'file-input'
    ];
    return formFieldTypes.includes(componentType);
  }

  updateLabel(event: any): void {
    const newLabel = event.target.value;
    if (this.selectedComponent) {
      this.propertyChanged.emit({
        component: this.selectedComponent,
        property: 'props.label',
        value: newLabel
      });
      
      // Update the form control if it exists
      const labelControl = this.specificForm.get('label');
      if (labelControl && labelControl.value !== newLabel) {
        labelControl.setValue(newLabel, { emitEvent: false });
      }
    }
  }

  clearLabel(): void {
    if (this.selectedComponent) {
      this.propertyChanged.emit({
        component: this.selectedComponent,
        property: 'props.label',
        value: ''
      });
      
      // Update the form control if it exists
      const labelControl = this.specificForm.get('label');
      if (labelControl) {
        labelControl.setValue('', { emitEvent: false });
      }
    }
  }
}
