import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthHeaders() {
  const token = localStorage.getItem("unbound_token");
  if (token) {
    return { Authorization: `Bearer ${token}` } as Record<string, string>;
  }
  return {} as Record<string, string>;
}
