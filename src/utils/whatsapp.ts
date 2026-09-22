import { Product } from '../types';

export function sanitizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }

  return digits || '917204919857';
}

export interface WhatsAppMessageParams {
  product: Product;
  selectedColour?: string;
  selectedSize?: string;
  currentUrl: string;
  whatsappNumber: string;
  isPriceHidden?: boolean;
  isOutOfStock?: boolean;
}

export function generateWhatsAppUrl({
  product,
  selectedColour,
  selectedSize,
  currentUrl,
  whatsappNumber,
}: WhatsAppMessageParams): string {
  const cleanPhone = sanitizePhoneNumber(whatsappNumber);

  const message =
    `Hi Modern Dresses 👋\n` +
    `I’m interested in this product and would like to know the price and availability.\n\n` +
    `*Product:* ${product.name}\n` +
    `*Colour:* ${selectedColour || "Not selected"}\n` +
    `*Size:* ${selectedSize || "Not selected"}\n\n` +
    `Please share the details. Thank you! 😊\n\n` +
    `*🔗 Product Link :*\n` +
    `${currentUrl}`;

  const encodedMessage = encodeURIComponent(message);

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}

export function generateGeneralInquiryWhatsAppUrl(
  whatsappNumber: string,
  storeName: string = "Modern Dresses"
): string {
  const cleanPhone = sanitizePhoneNumber(whatsappNumber);

  const message = `Hi ${storeName}, I would like to enquire about your latest fashion collections.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}