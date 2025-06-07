import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { DesignerService } from '../../services/designer.service';
import { Subject, takeUntil } from 'rxjs';
import { UIConfig, UIComponent } from '../../models/ui-config.interface';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'code' | 'config';
  metadata?: any;
}

@Component({
  selector: 'app-ai-chat-embedded',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './ai-chat-embedded.component.html',
  styleUrls: ['./ai-chat-embedded.component.css']
})
export class AiChatEmbeddedComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly designerService = inject(DesignerService);

  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;
  currentConfig: UIConfig | null = null;
  selectedComponent: UIComponent | null = null;
  // Quick action suggestions
  quickActions = [
    { label: 'Set grid to 1 column', command: 'set grid to 1 column' },
    { label: 'Set grid to 3 columns', command: 'set grid to 3 columns' },
    { label: 'Add form with fields', command: 'add a form with name, email, and submit button' },
    { label: 'Add save button', command: 'add a save button' },
    { label: 'Create dashboard card', command: 'create a dashboard with cards' },
    { label: 'Add action buttons', command: 'add action buttons' }
  ];

  constructor() {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    // Subscribe to designer service updates
    this.designerService.getCurrentConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe((config: UIConfig) => {
        this.currentConfig = config;
      });

    this.designerService.getSelectedComponent()
      .pipe(takeUntil(this.destroy$))
      .subscribe((component: UIComponent | null) => {
        this.selectedComponent = component;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.chatForm.valid && !this.isLoading) {
      const messageText = this.chatForm.get('message')?.value?.trim();
      if (messageText) {
        this.sendMessage(messageText);
      }
    }
  }

  onEnterKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  sendMessage(content: string) {
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    this.messages.push(userMessage);
    this.chatForm.get('message')?.setValue('');
    this.isLoading = true;

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);

    // Simulate AI processing
    setTimeout(() => {
      this.processAIResponse(content);
    }, 1000);
  }  private processAIResponse(userMessage: string) {
    const message = userMessage.toLowerCase();
    let aiResponse = '';
    let actionPerformed = false;

    try {
      const result = this.executeCommand(message);
      actionPerformed = result.actionPerformed;
      aiResponse = result.response;
    } catch (error) {
      console.error('Error processing AI response:', error);
      aiResponse = "I encountered an error while processing your request. Please try again with a different command.";
    }
    
    const aiMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      metadata: { actionPerformed }
    };

    this.messages.push(aiMessage);
    this.isLoading = false;
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  private executeCommand(message: string): { actionPerformed: boolean; response: string } {
    if (message.includes('grid') && (message.includes('row') || message.includes('column'))) {
      return this.handleGridCommand(message);
    }
    
    if (message.includes('form')) {
      return this.handleFormCommand(message);
    }
    
    if (message.includes('button')) {
      return this.handleButtonCommand(message);
    }
    
    if (message.includes('card') || message.includes('dashboard')) {
      return this.handleDashboardCommand(message);
    }
    
    return this.getHelpResponse();
  }

  private handleGridCommand(message: string): { actionPerformed: boolean; response: string } {
    const actionPerformed = this.handleGridModification(message);
    if (actionPerformed) {
      return {
        actionPerformed: true,
        response: "✅ I've updated the grid layout as requested. The changes have been applied to your design."
      };
    }
    return {
      actionPerformed: false,
      response: "I understand you want to modify the grid layout. Could you specify the number of columns? For example: 'set grid to 3 columns' or 'make it 1 column'."
    };
  }

  private handleFormCommand(message: string): { actionPerformed: boolean; response: string } {
    const actionPerformed = this.handleFormCreation(message);
    if (actionPerformed) {
      return {
        actionPerformed: true,
        response: "✅ I've added a form component with the requested fields to your layout."
      };
    }
    return {
      actionPerformed: false,
      response: "I can help you create a form! Please specify what fields you'd like, for example: 'add a form with name, email, and submit button'."
    };
  }

  private handleButtonCommand(message: string): { actionPerformed: boolean; response: string } {
    const actionPerformed = this.handleButtonCreation(message);
    if (actionPerformed) {
      return {
        actionPerformed: true,
        response: "✅ I've added button components to your layout."
      };
    }
    return {
      actionPerformed: false,
      response: "I can add buttons to your layout. Please specify what type of buttons you'd like, for example: 'add a save button' or 'add action buttons'."
    };
  }

  private handleDashboardCommand(message: string): { actionPerformed: boolean; response: string } {
    const actionPerformed = this.handleDashboardCreation(message);
    if (actionPerformed) {
      return {
        actionPerformed: true,
        response: "✅ I've added dashboard components with cards to your layout."
      };
    }
    return {
      actionPerformed: false,
      response: "I can create dashboard components for you. Please specify what you'd like to include."
    };
  }

  private getHelpResponse(): { actionPerformed: boolean; response: string } {
    return {
      actionPerformed: false,
      response: "I can help you modify your UI layout! Here are some things I can do:\n\n" +
               "🔲 **Grid Layout**: 'set grid to 2 columns'\n" +
               "📝 **Forms**: 'add a form with name and email fields'\n" +
               "🔘 **Buttons**: 'add a save button' or 'add action buttons'\n" +
               "📊 **Dashboard**: 'create a dashboard with cards'\n\n" +
               "What would you like me to help you with?"
    };
  }private handleGridModification(message: string): boolean {
    console.log('AiChatEmbedded: handleGridModification called with message:', message);
    const colRegex = /(\d+)\s*column/;
    const colMatch = colRegex.exec(message);
    
    if (colMatch) {
      const currentConfig = this.currentConfig;
      console.log('AiChatEmbedded: Current config before update:', currentConfig);
      if (currentConfig) {
        const columns = parseInt(colMatch[1], 10);
        console.log('AiChatEmbedded: Parsed columns:', columns);
        
        const newGridConfig = {
          type: 'grid' as const,
          columns: columns,
          gap: '16px'
        };

        const updatedConfig = {
          ...currentConfig,
          layout: newGridConfig
        };

        console.log('AiChatEmbedded: Updated config to be sent:', updatedConfig);
        this.designerService.updateConfig(updatedConfig);
        console.log('AiChatEmbedded: updateConfig called successfully');
        return true;
      }
    }
    
    // Handle "1 row 1 column" case as 1 column
    if (message.includes('1 row') && message.includes('1 column')) {
      const currentConfig = this.currentConfig;
      console.log('AiChatEmbedded: Handling 1 row 1 column case, current config:', currentConfig);
      if (currentConfig) {
        const newGridConfig = {
          type: 'grid' as const,
          columns: 1,
          gap: '16px'
        };

        const updatedConfig = {
          ...currentConfig,
          layout: newGridConfig
        };

        console.log('AiChatEmbedded: Updated config for 1 column:', updatedConfig);
        this.designerService.updateConfig(updatedConfig);
        console.log('AiChatEmbedded: updateConfig called for 1 column');
        return true;
      }
    }
    
    console.log('AiChatEmbedded: No grid modification performed');
    return false;
  }
  private handleFormCreation(message: string): boolean {
    if (this.currentConfig) {
      const formComponent: UIComponent = {
        id: `form_${Date.now()}`,
        type: 'form',
        props: {
          title: 'New Form',
          fields: this.extractFormFields(message)
        }
      };

      const updatedConfig = {
        ...this.currentConfig,
        components: [...this.currentConfig.components, formComponent]
      };

      this.designerService.updateConfig(updatedConfig);
      return true;
    }
    return false;
  }

  private handleButtonCreation(message: string): boolean {
    if (this.currentConfig) {
      const buttonComponent: UIComponent = {
        id: `button_${Date.now()}`,
        type: 'button',
        props: {
          text: this.extractButtonText(message),
          variant: 'contained',
          color: 'primary'
        }
      };

      const updatedConfig = {
        ...this.currentConfig,
        components: [...this.currentConfig.components, buttonComponent]
      };

      this.designerService.updateConfig(updatedConfig);
      return true;
    }
    return false;
  }

  private handleDashboardCreation(message: string): boolean {
    if (this.currentConfig) {
      const cardComponent: UIComponent = {
        id: `card_${Date.now()}`,
        type: 'card',
        props: {
          title: 'Dashboard Card',
          content: 'Card content goes here'
        }
      };

      const updatedConfig = {
        ...this.currentConfig,
        components: [...this.currentConfig.components, cardComponent]
      };

      this.designerService.updateConfig(updatedConfig);
      return true;
    }
    return false;
  }

  private extractFormFields(message: string): any[] {
    const fields = [];
    if (message.includes('name')) {
      fields.push({ type: 'text', label: 'Name', required: true });
    }
    if (message.includes('email')) {
      fields.push({ type: 'email', label: 'Email', required: true });
    }
    if (message.includes('submit')) {
      fields.push({ type: 'submit', label: 'Submit' });
    }
    
    // Default fields if none specified
    if (fields.length === 0) {
      fields.push(
        { type: 'text', label: 'Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'submit', label: 'Submit' }
      );
    }
    
    return fields;
  }

  private extractButtonText(message: string): string {
    if (message.includes('save')) return 'Save';
    if (message.includes('submit')) return 'Submit';
    if (message.includes('cancel')) return 'Cancel';
    if (message.includes('delete')) return 'Delete';
    return 'Button';
  }

  useQuickAction(action: any) {
    console.log('AiChatEmbedded: useQuickAction called with:', action);
    this.chatForm.get('message')?.setValue(action.command);
    this.onSubmit();
  }

  // Test method to verify the pipeline works
  testGridChange() {
    console.log('AiChatEmbedded: testGridChange called');
    this.sendMessage('set grid to 1 column');
  }

  clearChat() {
    this.messages = [];
  }

  exportChat() {
    const chatData = {
      messages: this.messages,
      exportDate: new Date(),
      config: this.currentConfig
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-export-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
}
