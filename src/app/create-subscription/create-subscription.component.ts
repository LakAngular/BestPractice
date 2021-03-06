import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirmation-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { StateService } from '../shared/state.service';
import { ISubscriptionDetails } from '../shared/state.service';
import { map, filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { EventEmitter } from 'protractor';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-subscription',
  templateUrl: './create-subscription.component.html',
  styleUrls: ['./create-subscription.component.css']
})
export class CreateSubscriptionComponent implements OnInit {

 subscriptionFormGroup: FormGroup;
  // private passwordPattern = '^(?=.*?[A-Za-z])(?=.*?[#?!@$%^&*-]).{8,8}$';
  private passwordPattern = '^(?=.*[A-Za-z])(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$';
  private emailPattern =  '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  subscriptionTypes: ISubscriptionType[] = [
    { value: 'basic', name: 'Basic' },
    { value: 'advanced', name: 'Advanced' },
    { value: 'pro', name: 'Pro' }
  ];

  messages: IMessage[] = new Array<IMessage>();
  timeout: number;
  userStopped = false;
  formWarning = false;
  errorMessage: string;

  constructor(private fb: FormBuilder,
              public dialog: MatDialog,
              private stateService: StateService,
              private router: Router) { }

  ngOnInit() {
    this.prepareForm();
    console.log('ngOnInit');
  }

  prepareForm() {
    console.log('PrepareForm');
    this.subscriptionFormGroup = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      subscription: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]]
    });

    this.subscriptionFormGroup.get('subscription').patchValue('advanced');
    this.subscriptionFormGroup.statusChanges
    .pipe(debounceTime(2000),
      distinctUntilChanged()
    ).subscribe(
      (e) => {
        this.formWarning = (e === 'INVALID');
        console.log('e' + e);
         // this.getEmailErrorMessage();
      }
    );

  }

  onClear(formDir: NgForm): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '300px' });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        this.messages = new Array<IMessage>();
        formDir.resetForm();
        this.subscriptionFormGroup.reset({ subscription: 'advanced' });
      }
    });
  }

  getAllErrorMessages() {
    this.messages = [];
    if (this.email.errors) {
      this.messages.push({ field: 'Email', message: this.getEmailErrorMessage() });
    }
    if (this.password.errors) {
      this.messages.push({ field: 'Password', message: this.getPasswordErrorMessage() });
    }
    console.log(this.messages);
  }

  onSubmit() {
    console.log(this.subscriptionFormGroup);
    if (this.subscriptionFormGroup.invalid) {
      this.getAllErrorMessages();
      return;
    }

    const subscriptionDetails: ISubscriptionDetails = {
      ...
      this.subscriptionFormGroup.value
    };

    this.stateService.setSubscription(subscriptionDetails);
    this.router.navigate(['list-subscription']);
  }

  getEmailErrorMessage(): string {
    return this.email.hasError('required') ? 'Email is required' :
           this.email.hasError('pattern') ? 'Enter a valid email' : '';
  }

  getPasswordErrorMessage(): string {
    return this.password.hasError('required') ? 'Password is required' :
    this.password.hasError('pattern') ? 'Enter password with  8 character long, at least one character and one special character' : '';
  }

  get email(): AbstractControl { return this.subscriptionFormGroup.get('email'); }
  get password(): AbstractControl { return this.subscriptionFormGroup.get('password'); }
  get stopped(): boolean { return this.userStopped; }

}

export interface ISubscriptionType {
  name: string;
  value: string;
}

export interface IMessage {
  field: string;
  message: string;
}
