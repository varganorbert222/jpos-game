export type JpFileKind = 'text' | 'image' | 'video';

export interface JpFileEntry {
  path: string;
  name: string;
  kind: JpFileKind;
  /** Text body or asset URL under /jp-data/ */
  content: string;
  readonly?: boolean;
}

export interface JpFolderEntry {
  path: string;
  name: string;
  children: string[];
}
