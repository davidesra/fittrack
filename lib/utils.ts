import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d");
}

export function roundTo(value: number, decimals = 1): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

export function macroPercent(macro: number, calories: number): number {
  if (calories === 0) return 0;
  return Math.round((macro / calories) * 100);
}

export function kgToLbs(kg: number): number {
  return roundTo(kg * 2.20462, 1);
}

export function lbsToKg(lbs: number): number {
  return roundTo(lbs / 2.20462, 2);
}
