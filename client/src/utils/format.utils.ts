// src/utils/format.utils.ts
// ====================================================
// Utility functions for formatting dates, numbers, and currencies
// Used throughout the application, especially in BorrowMedicines.vue
// ====================================================

/**
 * Format date string to Thai locale format
 * @param dateString ISO 8601 date string (e.g., "2024-04-09")
 * @returns Formatted date in Thai format (e.g., "09 เมษายน 2567")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Format date and time to Thai locale format
 * @param dateString ISO 8601 datetime string
 * @returns Formatted date and time (e.g., "09 เม.ย. 24 14:30")
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return dateString;
  }
}

/**
 * Format number with Thai locale formatting (comma separators, 2 decimal places)
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "1,234.50")
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value == null) return '0'.padEnd(decimals + 1, '0');

  try {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(value);
  }
}

/**
 * Format number as currency with Baht symbol
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "฿1,234.50")
 */
export function formatCurrency(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value == null) return '฿0'.padEnd(decimals + 2, '0');

  try {
    const formatted = new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      currency: 'THB'
    }).format(value);

    return `฿${formatted}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `฿${value}`;
  }
}

/**
 * Format item display with code and name (Thai)
 * @param itemCode Item code
 * @param itemNameTh Item name in Thai
 * @returns Formatted display string
 */
export function formatItemDisplay(itemCode: string, itemNameTh: string): string {
  return `${itemCode} - ${itemNameTh}`;
}

/**
 * Format item display with both Thai and English names
 * @param itemCode Item code
 * @param itemNameTh Item name in Thai
 * @param itemNameEn Item name in English
 * @returns Formatted display string
 */
export function formatItemDisplayFull(
  itemCode: string,
  itemNameTh: string,
  itemNameEn: string
): string {
  return `${itemCode} - ${itemNameTh} (${itemNameEn})`;
}

/**
 * Format quantity with unit name
 * @param quantity Quantity value
 * @param unitName Unit name (Thai)
 * @returns Formatted string (e.g., "10 เม็ด")
 */
export function formatQuantity(quantity: number, unitName: string): string {
  return `${formatNumber(quantity, 0)} ${unitName}`;
}

/**
 * Format phone number in Thai format
 * Assumes format: 0XXXXXXXXX (10 digits)
 * @param phone Phone number string
 * @returns Formatted phone (e.g., "08-1234-5678")
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
}

/**
 * Format status text to human-readable Thai text
 * @param status Status code (e.g., "PENDING_APPROVAL")
 * @returns Formatted status text in Thai
 */
export function formatStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'ร่าง',
    PENDING_APPROVAL: 'รอการอนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    APPROVED_L1: 'อนุมัติ L1',
    APPROVED_L2: 'อนุมัติ L2',
    RECEIVED: 'รับสินค้าแล้ว',
    SETTLED: 'จ่ายชำระแล้ว',
    CANCELLED: 'ยกเลิก',
    SUBMITTED: 'ส่งแล้ว',
  };
  return statusMap[status] || status;
}

/**
 * Format action description for approval logs
 * @param action Action type (SUBMIT, APPROVE, REJECT, REWORK)
 * @returns Formatted action text in Thai
 */
export function formatActionText(action: string): string {
  const actionMap: Record<string, string> = {
    SUBMIT: 'ส่งอนุมัติ',
    APPROVE: 'อนุมัติ',
    REJECT: 'ปฏิเสธ',
    REWORK: 'ส่งกลับแก้ไข',
  };
  return actionMap[action] || action;
}

/**
 * Format percentage value
 * @param value Decimal value (0-1)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage (e.g., "25.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value == null) return '0%';
  try {
    return `${(value * 100).toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return String(value);
  }
}

/**
 * Truncate long text for display
 * @param text Text to truncate
 * @param maxLength Maximum length (default: 50)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
