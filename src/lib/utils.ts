import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function generateCardNumber(): string {
  return `SC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const BOOKING_TYPES = [
  { value: 'meet-greet', label: 'In-Person Meet & Greet', priceKey: 'meetPrice' as const },
  { value: 'virtual', label: 'Virtual Video Call', priceKey: 'virtualPrice' as const },
  { value: 'signing', label: 'Autograph Signing', priceKey: 'signingPrice' as const },
]

export const FAN_CARD_TIERS = [
  { value: 'bronze', label: 'Bronze', color: '#cd7f32', multiplier: 1, perks: ['Digital fan card', 'Profile badge', 'Monthly newsletter'] },
  { value: 'silver', label: 'Silver', color: '#c0c0c0', multiplier: 2, perks: ['Everything in Bronze', 'Priority booking', 'Exclusive content', '10% booking discount'] },
  { value: 'gold', label: 'Gold', color: '#FFD700', multiplier: 3.5, perks: ['Everything in Silver', 'Birthday message', '15% booking discount', 'Fan community access'] },
  { value: 'platinum', label: 'Platinum', color: '#E5E4E2', multiplier: 6, perks: ['Everything in Gold', 'Annual video call', '25% booking discount', 'VIP events access', 'Personal fan number'] },
]

export const CATEGORIES = [
  'Music', 'Film & TV', 'Sports', 'Social Media', 'Business & Tech',
  'Comedy', 'Fashion', 'Gaming', 'Science & Academia', 'Royalty & Public Figures',
]
