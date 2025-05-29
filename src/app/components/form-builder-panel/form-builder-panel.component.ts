import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { UIComponent, ComponentType, FormModel } from '../../models/ui-config.interface';
import { FormBuilderService, FormBuilderState } from '../../services/form-builder.service';
import { DesignerService } from '../../services/designer.service';

@Component({
  selector: 'app-form-builder-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, DragDropModule],
  template: `
    <div class="form-builder-panel" *ngIf="formBuilderState.activeForm">
      <mat-card class="form-builder-card">
        <mat-card-header>
          <div mat-card-avatar class="form-icon">
            <mat-icon>assignment</mat-icon>
          </div>
          <mat-card-title>Form Builder</mat-card-title>
          <mat-card-subtitle>{{ formBuilderState.activeForm.props.title || 'Untitled Form' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Form Elements Section -->
          <mat-expansion-panel [expanded]="true" class="builder-section">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>add_circle</mat-icon>
                Add Form Elements
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="form-elements-grid">
              <button 
                *ngFor="let elementType of formElementTypes" 
                mat-raised-button 
                class="element-button"
                (click)="addFormElement(elementType.type)"
                [attr.title]="elementType.description">
                <mat-icon>{{ elementType.icon }}</mat-icon>
                <span>{{ elementType.name }}</span>
              </button>
            </div>
          </mat-expansion-panel>

          <!-- Current Form Elements -->
          <mat-expansion-panel [expanded]="true" class="builder-section">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>reorder</mat-icon>
                Form Elements ({{ formBuilderState.formElements.length }})
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="form-elements-list">
              <div 
                cdkDropList 
                (cdkDropListDropped)="onElementReorder($event)"
                class="elements-drop-list">
                
                <div 
                  *ngFor="let element of formBuilderState.formElements; let i = index"
                  cdkDrag
                  class="form-element-item"
                  [class.selected]="selectedElement?.id === element.id"
                  (click)="selectElement(element)">
                  
                  <div class="element-header">
                    <div class="element-info">
                      <mat-icon class="drag-handle" cdkDragHandle>drag_indicator</mat-icon>
                      <mat-icon class="element-type-icon">{{ getElementIcon(element.type) }}</mat-icon>
                      <span class="element-label">{{ element.props.label || element.type }}</span>
                    </div>
                    
                    <div class="element-actions">
                      <button mat-icon-button 
                              (click)="editElement(element); $event.stopPropagation()"
                              matTooltip="Edit Element">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn"
                              (click)="removeElement(element.id); $event.stopPropagation()"
                              matTooltip="Remove Element">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>

                  <!-- Element Details -->
                  <div class="element-details" *ngIf="selectedElement?.id === element.id">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Label</mat-label>
                      <input matInput 
                             [value]="element.props.label"
                             (input)="updateElementProperty(element.id, 'label', $event)">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width" *ngIf="element.type !== 'checkbox' && element.type !== 'radio'">
                      <mat-label>Placeholder</mat-label>
                      <input matInput 
                             [value]="element.props.placeholder"
                             (input)="updateElementProperty(element.id, 'placeholder', $event)">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Model Field</mat-label>
                      <input matInput 
                             [value]="element.props.modelField"
                             (input)="updateElementProperty(element.id, 'modelField', $event)"
                             placeholder="Backend field name">
                    </mat-form-field>

                    <mat-checkbox 
                      [checked]="element.props.required"
                      (change)="updateElementProperty(element.id, 'required', $event.checked)">
                      Required Field
                    </mat-checkbox>
                  </div>
                </div>

                <!-- Empty State -->
                <div class="empty-elements-state" *ngIf="formBuilderState.formElements.length === 0">
                  <mat-icon>add</mat-icon>
                  <p>No form elements yet</p>
                  <small>Add elements using the buttons above</small>
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Model Binding Section -->
          <mat-expansion-panel class="builder-section">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>cloud_sync</mat-icon>
                Model & API Binding
              </mat-panel-title>
            </mat-expansion-panel-header>

            <form [formGroup]="modelForm" class="model-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Model Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., UserRegistration">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>API Endpoint</mat-label>
                <input matInput formControlName="apiEndpoint" placeholder="e.g., /api/users">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>HTTP Method</mat-label>
                <mat-select formControlName="method">
                  <mat-option value="POST">POST</mat-option>
                  <mat-option value="PUT">PUT</mat-option>
                  <mat-option value="PATCH">PATCH</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button 
                        color="primary" 
                        (click)="saveModelBinding()"
                        [disabled]="modelForm.invalid">
                  <mat-icon>save</mat-icon>
                  Save Model Binding
                </button>

                <button mat-button 
                        (click)="generateModelMapping()"
                        matTooltip="Auto-generate field mapping">
                  <mat-icon>auto_fix_high</mat-icon>
                  Auto-Map Fields
                </button>
              </div>
            </form>
          </mat-expansion-panel>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- No Active Form State -->
    <div class="no-form-state" *ngIf="!formBuilderState.activeForm">
      <mat-card class="empty-state-card">
        <mat-card-content>
          <div class="empty-state">
            <mat-icon>assignment_add</mat-icon>
            <h3>No Form Selected</h3>
            <p>Select a form component to start building</p>
            <button mat-raised-button color="primary" (click)="createNewForm()">
              <mat-icon>add</mat-icon>
              Create New Form
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-builder-panel {
      padding: 16px;
      height: 100%;
      overflow-y: auto;
    }

    .form-builder-card, .empty-state-card {
      height: fit-content;
    }

    .form-icon {
      background: #2196f3;
      color: white;
    }

    .builder-section {
      margin-bottom: 16px;
    }

    .form-elements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .element-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      min-height: 80px;
      text-align: center;
    }

    .element-button mat-icon {
      margin-bottom: 8px;
    }

    .element-button span {
      font-size: 12px;
      line-height: 1.2;
    }

    .form-elements-list {
      margin-top: 16px;
    }

    .elements-drop-list {
      min-height: 200px;
      border: 2px dashed #e0e0e0;
      border-radius: 4px;
      padding: 16px;
    }

    .form-element-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-bottom: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .form-element-item:hover {
      border-color: #2196f3;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-element-item.selected {
      border-color: #2196f3;
      background: #f3f9ff;
    }

    .element-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
    }

    .element-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .drag-handle {
      cursor: grab;
      color: #999;
    }

    .element-type-icon {
      color: #2196f3;
    }

    .element-label {
      font-weight: 500;
    }

    .element-actions {
      display: flex;
      gap: 4px;
    }

    .element-details {
      padding: 0 12px 12px;
      border-top: 1px solid #f0f0f0;
    }

    .model-form {
      margin-top: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .empty-elements-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      color: #666;
    }

    .empty-elements-state mat-icon, .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }

    .no-form-state {
      padding: 16px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .elements-drop-list.cdk-drop-list-dragging .form-element-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class FormBuilderPanelComponent implements OnInit, OnDestroy {
  @Input() selectedComponent: UIComponent | null = null;
  @Output() componentSelected = new EventEmitter<UIComponent>();

  formBuilderState: FormBuilderState = {
    activeForm: null,
    formElements: [],
    modelBinding: null
  };

  selectedElement: UIComponent | null = null;
  modelForm: FormGroup;

  formElementTypes: { type: ComponentType; name: string; icon: string; description: string }[] = [
    { type: 'text-input', name: 'Text Input', icon: 'text_fields', description: 'Single line text input' },
    { type: 'email-input', name: 'Email', icon: 'email', description: 'Email input with validation' },
    { type: 'password-input', name: 'Password', icon: 'lock', description: 'Password input field' },
    { type: 'number-input', name: 'Number', icon: 'pin', description: 'Numeric input field' },
    { type: 'textarea', name: 'Text Area', icon: 'notes', description: 'Multi-line text input' },
    { type: 'select', name: 'Select', icon: 'arrow_drop_down', description: 'Dropdown selection' },
    { type: 'checkbox', name: 'Checkbox', icon: 'check_box', description: 'Checkbox field' },
    { type: 'radio', name: 'Radio', icon: 'radio_button_checked', description: 'Radio button group' },
    { type: 'date-input', name: 'Date', icon: 'calendar_today', description: 'Date picker' },
    { type: 'file-input', name: 'File Upload', icon: 'upload_file', description: 'File upload field' },
    { type: 'submit-button', name: 'Submit', icon: 'send', description: 'Submit button' },
    { type: 'reset-button', name: 'Reset', icon: 'refresh', description: 'Reset button' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilderService: FormBuilderService,
    private designerService: DesignerService,
    private fb: FormBuilder
  ) {
    this.modelForm = this.fb.group({
      name: ['', Validators.required],
      apiEndpoint: ['', Validators.required],
      method: ['POST', Validators.required]
    });
  }

  ngOnInit() {
    // Subscribe to form builder state changes
    this.formBuilderService.getFormBuilderState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.formBuilderState = state;
        
        // Update model form when active form changes
        if (state.modelBinding) {
          this.modelForm.patchValue({
            name: state.modelBinding.name,
            apiEndpoint: state.modelBinding.apiEndpoint,
            method: state.modelBinding.method
          });
        }
      });

    // Check if current selected component is a form
    if (this.selectedComponent?.type === 'form') {
      this.formBuilderService.setActiveForm(this.selectedComponent);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addFormElement(elementType: ComponentType) {
    const newElement = this.formBuilderService.addFormElement(elementType);
    if (newElement) {
      this.selectElement(newElement);
    }
  }

  removeElement(elementId: string) {
    if (this.selectedElement?.id === elementId) {
      this.selectedElement = null;
    }
    this.formBuilderService.removeFormElement(elementId);
  }

  selectElement(element: UIComponent) {
    this.selectedElement = this.selectedElement?.id === element.id ? null : element;
  }

  editElement(element: UIComponent) {
    this.selectedElement = element;
    this.componentSelected.emit(element);
  }

  onElementReorder(event: CdkDragDrop<UIComponent[]>) {
    this.formBuilderService.reorderFormElements(event.previousIndex, event.currentIndex);
  }

  updateElementProperty(elementId: string, property: string, event: any) {
    const value = event.target ? event.target.value : event;
    this.formBuilderService.updateFormElement(elementId, { [property]: value });
  }

  saveModelBinding() {
    if (this.modelForm.valid) {
      const modelData = this.modelForm.value;
      
      const formModel: FormModel = {
        name: modelData.name,
        apiEndpoint: modelData.apiEndpoint,
        method: modelData.method,
        fields: this.formBuilderService.generateModelFieldMapping()
      };

      this.formBuilderService.setFormModel(formModel);
    }
  }

  generateModelMapping() {
    const mapping = this.formBuilderService.generateModelFieldMapping();
    console.log('Generated model mapping:', mapping);
    
    // Auto-populate model form if empty
    if (!this.modelForm.get('name')?.value) {
      this.modelForm.patchValue({
        name: 'FormModel',
        apiEndpoint: '/api/form-submit',
        method: 'POST'
      });
    }
  }

  createNewForm() {
    const newForm = this.formBuilderService.createFormWithModel('New Form', {
      name: 'NewFormModel',
      apiEndpoint: '/api/form-submit',
      method: 'POST'
    });

    this.designerService.addComponent(newForm);
    this.formBuilderService.setActiveForm(newForm);
  }

  getElementIcon(elementType: ComponentType): string {
    const iconMap: { [key: string]: string } = {
      'text-input': 'text_fields',
      'email-input': 'email',
      'password-input': 'lock',
      'number-input': 'pin',
      'textarea': 'notes',
      'select': 'arrow_drop_down',
      'checkbox': 'check_box',
      'radio': 'radio_button_checked',
      'date-input': 'calendar_today',
      'file-input': 'upload_file',
      'submit-button': 'send',
      'reset-button': 'refresh',
      'button': 'smart_button'
    };
    return iconMap[elementType] || 'help';
  }
}
