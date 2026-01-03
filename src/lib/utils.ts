import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 💰 Formatação Monetária (BRL)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// 📅 Formatação de Data Padrão (DD/MM/AAAA)
export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

// 📅 Formatação de Data e Hora (DD/MM/AAAA HH:mm)
export const formatDateTime = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

// 📱 Formatação de Telefone (Máscara Flexível)
export const formatPhone = (phone: string | null | undefined) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
};

// 🔢 Formatação de CPF (999.999.999-99)
export const formatCPF = (cpf: string | null | undefined) => {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
};
