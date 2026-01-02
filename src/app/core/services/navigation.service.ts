import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private sidebarActionSource = new Subject<string>();
  private searchSource = new Subject<string>();
  private createFolderSource = new Subject<void>();
  private showCreateFolderSource = new Subject<boolean>();
  private hasNewSharedItemsSubject = new BehaviorSubject<boolean>(false);

  sidebarAction$ = this.sidebarActionSource.asObservable();
  search$ = this.searchSource.asObservable();
  createFolder$ = this.createFolderSource.asObservable();
  showCreateFolder$ = this.showCreateFolderSource.asObservable();
  hasNewSharedItems$ = this.hasNewSharedItemsSubject.asObservable();

  emitSidebarAction(action: string) {
    this.sidebarActionSource.next(action);
  }

  emitSearch(query: string) {
    this.searchSource.next(query);
  }

  emitCreateFolder() {
    this.createFolderSource.next();
  }

  setShowCreateFolder(show: boolean) {
    this.showCreateFolderSource.next(show);
  }

  setHasNewSharedItems(hasNew: boolean) {
    this.hasNewSharedItemsSubject.next(hasNew);
  }
}
