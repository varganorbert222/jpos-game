export type MailFolder = 'inbox' | 'unread' | 'deleted';

export type MailPriority = 'primary' | 'secondary' | 'report';

export interface MailMessage {
  id: string;
  folder: MailFolder;
  from: string;
  subject: string;
  body: string;
  tick: number;
  read: boolean;
  priority: MailPriority;
  deleted: boolean;
}
