import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { UIComponent, ComponentType, FormModel } from '../../models/ui-config.interface';
import { FormBuilderService, FormBuilderState } from '../../services/form-builder.service';
import { DesignerService } from '../../services/designer.service';
import { FormGridLayoutComponent, FormFieldWithPosition } from '../form-grid-layout/form-grid-layout.component';

@Component({
  selector: 'app-form-builder-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, DragDropModule, FormGridLayoutComponent],
  templateUrl: './form-builder-panel.component.html',
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
