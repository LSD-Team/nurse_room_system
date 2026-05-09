// src/email/dto/email-log.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class EmailLogDto {
  @ApiProperty({
    description: 'รหัส ID ของ log การส่งอีเมล',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ผู้รับอีเมล (To)',
    example: 'user@example.com,user2@example.com',
    type: String,
  })
  to_recipients: string;

  @ApiProperty({
    description: 'ผู้รับสำเนา (CC)',
    example: 'cc@example.com',
    type: String,
    nullable: true,
    required: false,
  })
  cc_recipients: string | null;

  @ApiProperty({
    description: 'หัวข้ออีเมล',
    example: 'ทดสอบการส่งอีเมล',
    type: String,
  })
  subject: string;

  @ApiProperty({
    description: 'เนื้อหาอีเมล (HTML)',
    example: '<p>นี่คือการทดสอบส่งอีเมล</p>',
    type: String,
  })
  body: string;

  @ApiProperty({
    description: 'ระบบที่ส่งอีเมล',
    example: 'CRM System',
    type: String,
  })
  sent_from_system: string;

  @ApiProperty({
    description: 'สถานะการส่งอีเมล',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED'],
    type: String,
  })
  status: string;

  @ApiProperty({
    description: 'ข้อความแสดงข้อผิดพลาด (กรณีส่งไม่สำเร็จ)',
    example: 'Connection refused',
    type: String,
    nullable: true,
    required: false,
  })
  error_message: string | null;

  @ApiProperty({
    description: 'เวลาที่ส่งอีเมล',
    example: '2025-04-09T09:30:00.000Z',
    type: Date,
  })
  sent_at: Date;
}
