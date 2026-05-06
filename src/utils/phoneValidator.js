// Bangladeshi phone number validation
export const isValidBangladeshiPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/\s/g, '').replace(/-/g, '');

  // Pattern 1: +8801XXXXXXXXX (13 digits total)
  const pattern1 = /^\+8801[3-9]\d{8}$/;

  // Pattern 2: 8801XXXXXXXXX (12 digits)
  const pattern2 = /^8801[3-9]\d{8}$/;

  // Pattern 3: 01XXXXXXXXX (11 digits)
  const pattern3 = /^01[3-9]\d{8}$/;

  return pattern1.test(cleaned) || pattern2.test(cleaned) || pattern3.test(cleaned);
};

// Format phone number to standard format: +8801XXXXXXXXX
export const formatBangladeshiPhone = (phone) => {
  if (!isValidBangladeshiPhone(phone)) {
    return null;
  }

  let cleaned = phone.replace(/\s/g, '').replace(/-/g, '');

  // Convert to +880 format
  if (cleaned.startsWith('+880')) {
    return cleaned;
  }

  if (cleaned.startsWith('880')) {
    return '+' + cleaned;
  }

  if (cleaned.startsWith('01')) {
    return '+880' + cleaned.substring(1);
  }

  return null;
};
