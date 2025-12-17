// Utility functions for ClinicPro

/**
 * Formats a Brazilian phone number to standard format
 * Examples:
 * - "11987654321" -> "(11) 98765-4321"
 * - "4398764321" -> "(43) 98764-3210"
 * - "43987654321" -> "(43) 98765-4321"
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return phone;

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Handle different lengths
  if (cleaned.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7
    )}`;
  } else if (cleaned.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
      6
    )}`;
  } else if (cleaned.length === 8) {
    // Short landline: XXXX-XXXX (assume São Paulo)
    return `(11) ${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  } else if (cleaned.length === 9) {
    // Short mobile: XXXXX-XXXX (assume São Paulo)
    return `(11) ${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }

  // If doesn't match any pattern, return as is but clean
  return cleaned;
};

/**
 * Formats currency values to Brazilian Real format
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
