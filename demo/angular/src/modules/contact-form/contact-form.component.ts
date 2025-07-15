import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent {
  showSuccessMessage = false;
  
  formData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  
  errors = {
    name: false,
    email: false,
    subject: false,
    message: false
  };

  validateField(fieldName: string): void {
    switch (fieldName) {
      case 'name':
        this.errors.name = !this.formData.name.trim();
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.errors.email = !this.formData.email.trim() || !emailRegex.test(this.formData.email.trim());
        break;
      case 'subject':
        this.errors.subject = !this.formData.subject.trim();
        break;
      case 'message':
        this.errors.message = !this.formData.message.trim();
        break;
    }
  }

  validateForm(): boolean {
    this.validateField('name');
    this.validateField('email');
    this.validateField('subject');
    this.validateField('message');
    
    return !this.errors.name && !this.errors.email && !this.errors.subject && !this.errors.message;
  }

  autoFillFields(fieldName: string): void {
    switch(fieldName) {
      case 'name':
        if (this.formData.name.toLowerCase().includes('john')) {
          this.formData.email = 'john@example.com';
          this.formData.phone = '123-456-7890';
        }
        break;
      case 'email':
        if (this.formData.email.includes('john')) {
          this.formData.name = 'John Doe';
          this.formData.phone = '123-456-7890';
        }
        break;
      case 'phone':
        if (this.formData.phone.includes('123')) {
          this.formData.name = 'John Doe';
          this.formData.email = 'john@example.com';
        }
        break;
    }
  }
  
  onSubmit(form: NgForm): void {
    if (this.validateForm()) {
      // Here you would typically send the data to a service
      console.log('Form submitted:', this.formData);
      
      // Show success message
      this.showSuccessMessage = true;
      
      // Reset form
      this.resetForm(form);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    }
  }

  private resetForm(form: NgForm): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
    
    this.errors = {
      name: false,
      email: false,
      subject: false,
      message: false
    };
    
    form.resetForm();
  }
}