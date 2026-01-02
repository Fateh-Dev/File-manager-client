import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';
import { DialogComponent } from '../dialog/dialog.component';
import { QuotaDialogComponent } from '../quota-dialog/quota-dialog.component';
import { InputModalComponent } from '../input-modal/input-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DialogComponent, QuotaDialogComponent, InputModalComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  users: User[] = [];
  isLoading = false;

  dialogData = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning',
    buttonText: 'OK',
    showCancelButton: false,
    cancelText: 'Cancel',
  };

  quotaDialog = {
    isOpen: false,
    user: null as User | null,
  };

  passwordDialog = {
    isOpen: false,
    user: null as User | null,
  };

  pendingAction: { type: 'lock' | 'activate' | null; userId: number | null } = {
    type: null,
    userId: null,
  };

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  activateUser(id: number): void {
    this.pendingAction = { type: 'activate', userId: id };
    this.showDialog(
      'Confirm Activation',
      'Are you sure you want to activate this user?',
      'warning',
      true,
      'Activate'
    );
  }

  lockUser(id: number): void {
    const user = this.users.find((u) => u.id === id);
    if (user && user.role === 'Admin') {
      this.showDialog('Action Not Allowed', 'Cannot lock an Administrator account.', 'error');
      return;
    }

    this.pendingAction = { type: 'lock', userId: id };
    this.showDialog(
      'Confirm Lock',
      'Are you sure you want to lock this user?',
      'warning',
      true,
      'Lock'
    );
  }

  onDialogConfirm() {
    this.dialogData.isOpen = false; // Sync parent state with child
    if (this.pendingAction.type === 'activate' && this.pendingAction.userId) {
      this.executeActivateUser(this.pendingAction.userId);
    } else if (this.pendingAction.type === 'lock' && this.pendingAction.userId) {
      this.executeLockUser(this.pendingAction.userId);
    }
  }

  private executeActivateUser(id: number) {
    this.adminService.activateUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.showDialog('Success', 'User activated successfully', 'success');
      },
      error: (err) => {
        this.showDialog('Error', 'Failed to activate user', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  private executeLockUser(id: number) {
    this.adminService.lockUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.showDialog('Success', 'User locked successfully', 'success');
      },
      error: (err) => {
        this.showDialog(
          'Error',
          'Failed to lock user: ' + (err.error?.message || err.statusText),
          'error'
        );
        this.cdr.detectChanges();
      },
    });
  }

  showDialog(
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    showCancelButton = false,
    buttonText = 'OK'
  ) {
    this.dialogData = {
      isOpen: true,
      title,
      message,
      type,
      buttonText,
      showCancelButton,
      cancelText: 'Cancel',
    };
    this.cdr.detectChanges();
  }

  editStorageLimit(user: User): void {
    this.quotaDialog = {
      isOpen: true,
      user: user,
    };
    this.cdr.detectChanges();
  }

  onQuotaSubmit(newLimitBytes: number) {
    if (this.quotaDialog.user) {
      this.adminService.updateStorageLimit(this.quotaDialog.user.id, newLimitBytes).subscribe({
        next: () => {
          this.loadUsers();
          this.quotaDialog.isOpen = false;
          this.showDialog('Success', 'Storage limit updated successfully', 'success');
        },
        error: (err) => {
          this.showDialog('Error', 'Failed to update storage limit', 'error');
        },
      });
    }
  }

  onQuotaCancel() {
    this.quotaDialog.isOpen = false;
    this.cdr.detectChanges();
  }

  resetPassword(user: User): void {
    this.passwordDialog = {
      isOpen: true,
      user: user,
    };
    this.cdr.detectChanges();
  }

  onPasswordSubmit(newPassword: string) {
    if (this.passwordDialog.user) {
      this.adminService.resetUserPassword(this.passwordDialog.user.id, newPassword).subscribe({
        next: () => {
          this.passwordDialog.isOpen = false;
          this.showDialog('Succès', 'Mot de passe réinitialisé avec succès', 'success');
        },
        error: (err) => {
          this.showDialog(
            'Erreur',
            err.error || 'Échec de la réinitialisation du mot de passe',
            'error'
          );
        },
      });
    }
  }

  onPasswordCancel() {
    this.passwordDialog.isOpen = false;
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.dialogData.isOpen = false;
    this.pendingAction = { type: null, userId: null };
    this.cdr.detectChanges();
  }
}
