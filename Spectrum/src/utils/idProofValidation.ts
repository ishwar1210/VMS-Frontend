// ID Proof validation utilities

export interface IdProofValidation {
  isValid: boolean;
  errorMessage: string;
}

export const validateIdProof = (
  idProofType: string,
  idProofNumber: string
): IdProofValidation => {
  const trimmedNumber = idProofNumber.trim().toUpperCase();

  switch (idProofType) {
    case "Aadhar":
      // Aadhar: 12 digits
      if (!/^\d{12}$/.test(trimmedNumber)) {
        return {
          isValid: false,
          errorMessage: "Aadhar number must be exactly 12 digits",
        };
      }
      return { isValid: true, errorMessage: "" };

    case "PAN":
      // PAN: 10 characters - Format: ABCDE1234F (5 letters, 4 digits, 1 letter)
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmedNumber)) {
        return {
          isValid: false,
          errorMessage:
            "PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)",
        };
      }
      return { isValid: true, errorMessage: "" };

    case "Driving License":
      // Driving License: varies by state, typically 13-16 alphanumeric characters
      // Format: State code (2 letters) + Year (2 digits) + 7-11 alphanumeric
      if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{7,11}$/.test(trimmedNumber)) {
        return {
          isValid: false,
          errorMessage:
            "Driving License must be 13-16 characters (e.g., MH1420110012345)",
        };
      }
      return { isValid: true, errorMessage: "" };

    case "Passport":
      // Passport: 8 alphanumeric characters
      // Format: 1 letter + 7 digits
      if (!/^[A-Z][0-9]{7}$/.test(trimmedNumber)) {
        return {
          isValid: false,
          errorMessage:
            "Passport must be 8 characters (1 letter + 7 digits, e.g., A1234567)",
        };
      }
      return { isValid: true, errorMessage: "" };

    case "Voter ID":
      // Voter ID: 10 characters - Format: ABC1234567 (3 letters + 7 digits)
      if (!/^[A-Z]{3}[0-9]{7}$/.test(trimmedNumber)) {
        return {
          isValid: false,
          errorMessage:
            "Voter ID must be 10 characters (3 letters + 7 digits, e.g., ABC1234567)",
        };
      }
      return { isValid: true, errorMessage: "" };

    default:
      // If no specific type selected or unknown type, allow any non-empty value
      if (!trimmedNumber) {
        return {
          isValid: false,
          errorMessage: "ID proof number is required",
        };
      }
      return { isValid: true, errorMessage: "" };
  }
};

export const formatIdProofNumber = (
  idProofType: string,
  value: string
): string => {
  // Remove all spaces and convert to uppercase
  let formatted = value.replace(/\s/g, "").toUpperCase();

  switch (idProofType) {
    case "Aadhar":
      // Allow only digits, max 12
      formatted = formatted.replace(/\D/g, "").slice(0, 12);
      break;

    case "PAN":
      // Allow letters and digits, max 10
      formatted = formatted.replace(/[^A-Z0-9]/g, "").slice(0, 10);
      break;

    case "Driving License":
      // Allow letters and digits, max 16
      formatted = formatted.replace(/[^A-Z0-9]/g, "").slice(0, 16);
      break;

    case "Passport":
      // Allow letters and digits, max 8
      formatted = formatted.replace(/[^A-Z0-9]/g, "").slice(0, 8);
      break;

    case "Voter ID":
      // Allow letters and digits, max 10
      formatted = formatted.replace(/[^A-Z0-9]/g, "").slice(0, 10);
      break;

    default:
      // For unknown types, just trim and uppercase
      formatted = formatted.slice(0, 50); // reasonable max length
      break;
  }

  return formatted;
};
