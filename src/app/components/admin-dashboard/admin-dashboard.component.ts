import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { User } from '../../core/models/user.model';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DialogComponent],
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
    const currentLimitGB = user.storageLimit / (1024 * 1024 * 1024);
    const newLimitGB = prompt('Enter new storage limit in GB:', currentLimitGB.toString());

    if (newLimitGB !== null) {
      const limit = parseFloat(newLimitGB);
      if (!isNaN(limit) && limit >= 0) {
        const newLimitBytes = Math.floor(limit * 1024 * 1024 * 1024);
        this.adminService.updateStorageLimit(user.id, newLimitBytes).subscribe({
          next: () => {
            this.loadUsers();
            this.showDialog('Success', 'Storage limit updated successfully', 'success');
          },
          error: (err) => {
            this.showDialog('Error', 'Failed to update storage limit', 'error');
          },
        });
      } else {
        this.showDialog('Error', 'Invalid storage limit', 'error');
      }
    }
  }

  closeDialog() {
    this.dialogData.isOpen = false;
    this.pendingAction = { type: null, userId: null };
    this.cdr.detectChanges();
  }
}
