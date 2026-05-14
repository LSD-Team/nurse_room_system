// dto/send-email.dto.ts
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class SendEmailDto {
  @IsEmail({}, { each: true })
  to: string | string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string | string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string | string[];

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsNotEmpty()
  @IsString()
  sent_from_system: string;
}

export default SendEmailDto;
