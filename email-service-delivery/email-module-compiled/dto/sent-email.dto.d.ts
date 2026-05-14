export declare class SendEmailDto {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    sent_from_system: string;
}
