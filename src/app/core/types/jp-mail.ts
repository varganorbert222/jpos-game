export type MailFolder = 'inbox' | 'unread' | 'spam' | 'deleted';

export type MailPriority = 'primary' | 'secondary' | 'report' | 'junk';

export type MailSenderClass =
  | 'registry_trusted'
  | 'runtime_trusted'
  | 'malcolm'
  | 'spoof'
  | 'unknown';

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
  senderClass: MailSenderClass;
  /** Philosophy / flavor only — no infection. */
  philosophyOnly?: boolean;
}
