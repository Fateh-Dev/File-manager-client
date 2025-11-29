export interface Folder {
    id: number;
    name: string;
    parentFolderId?: number;
    subFolders?: Folder[];
    files?: any[];
}
