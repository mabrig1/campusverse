export const PRINT_CONFIG = {
  maxFileBytes: 25 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['pdf', 'docx'],
  pricing: {
    bwPerPage: 30,
    colorPerPage: 100,
    formattingPerPage: 50,
    spiralBinding: 1000,
    hardBinding: 3500
  },
  statuses: [
    'UPLOADED',
    'AWAITING_REVIEW',
    'FORMATTING',
    'READY_FOR_APPROVAL',
    'APPROVED',
    'PRINTING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED'
  ],
  formattingStyles: ['NONE', 'APA_7', 'MLA', 'HARVARD', 'THESIS_PROJECT', 'CUSTOM'],
  bindingTypes: ['NONE', 'SPIRAL', 'HARD'],
  colorModes: ['BW', 'COLOR'],
  sides: ['SINGLE', 'DUPLEX']
};

export function calculatePrintQuote({ pages, copies = 1, colorMode = 'BW', formatting = false, binding = 'NONE' }) {
  const safePages = Math.max(1, Number(pages) || 1);
  const safeCopies = Math.max(1, Number(copies) || 1);
  const pageRate = colorMode === 'COLOR' ? PRINT_CONFIG.pricing.colorPerPage : PRINT_CONFIG.pricing.bwPerPage;
  const printCost = safePages * safeCopies * pageRate;
  const formattingCost = formatting ? safePages * PRINT_CONFIG.pricing.formattingPerPage : 0;
  const bindingCost = binding === 'SPIRAL'
    ? PRINT_CONFIG.pricing.spiralBinding * safeCopies
    : binding === 'HARD'
      ? PRINT_CONFIG.pricing.hardBinding * safeCopies
      : 0;

  return {
    pages: safePages,
    copies: safeCopies,
    printCost,
    formattingCost,
    bindingCost,
    total: printCost + formattingCost + bindingCost
  };
}
