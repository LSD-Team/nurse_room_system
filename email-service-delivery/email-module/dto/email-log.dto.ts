export class EmailLogDto {
  id: number;
  to_recipients: string;
  cc_recipients: string | null;
  subject: string;
  body: string;
  sent_from_system: string;
  status: 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  sent_at: Date;
}
