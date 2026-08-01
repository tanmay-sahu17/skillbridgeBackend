// ── Document Validation Rules ──
// Saare document types, sizes, aur rules ek hi jagah defined hain
// Agar koi rule change karna ho, sirf yahan karo

export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENT: ['application/pdf'],
};

export const MAX_FILE_SIZES = {
  COLLEGE_LOGO: 2 * 1024 * 1024, // 2MB
  CERTIFICATE: 5 * 1024 * 1024, // 5MB
  BROCHURE: 10 * 1024 * 1024, // 10MB
  DEFAULT: 5 * 1024 * 1024, // 5MB
};

/**
 * Config for each document field in college onboarding.
 * 'required' means the document is mandatory for onboarding.
 */
export const DOCUMENT_CONFIG = {
  collegeLogo: {
    required: true,
    allowedTypes: ALLOWED_FILE_TYPES.IMAGE,
    maxSize: MAX_FILE_SIZES.COLLEGE_LOGO,
    label: 'College Logo',
  },
  affiliationCert: {
    required: true,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'AICTE / UGC / Affiliation Certificate',
  },
  authorizationLetter: {
    required: true,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'Authorization / Appointment Letter',
  },
  naacCertificate: {
    required: false,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'NAAC Certificate',
  },
  nirfCertificate: {
    required: false,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'NIRF Certificate',
  },
  collegeBrochure: {
    required: false,
    allowedTypes: ALLOWED_FILE_TYPES.DOCUMENT,
    maxSize: MAX_FILE_SIZES.BROCHURE,
    label: 'College Brochure',
  },
  gstCertificate: {
    required: false,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'GST Certificate',
  },
  otherCertificates: {
    required: false,
    allowedTypes: [
      ...ALLOWED_FILE_TYPES.IMAGE,
      ...ALLOWED_FILE_TYPES.DOCUMENT,
    ],
    maxSize: MAX_FILE_SIZES.CERTIFICATE,
    label: 'Other Recognition Certificates',
    multiple: true,
  },
};

/**
 * Validate a single uploaded file against its config
 * @param {Object} file - Multer file object
 * @param {Object} config - Document config from DOCUMENT_CONFIG
 * @returns {string[]} Array of error messages (empty if valid)
 */
export const validateFile = (file, config) => {
  const errors = [];

  if (!file && config.required) {
    errors.push(`${config.label} is required.`);
    return errors;
  }

  if (!file) return errors;

  const allowedTypes = Array.isArray(config.allowedTypes[0])
    ? config.allowedTypes.flat()
    : config.allowedTypes;

  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(
      `${config.label}: File type '${file.mimetype}' is not allowed.`
    );
  }

  if (file.size > config.maxSize) {
    const maxMB = (config.maxSize / (1024 * 1024)).toFixed(0);
    errors.push(`${config.label}: File size exceeds ${maxMB}MB limit.`);
  }

  return errors;
};
