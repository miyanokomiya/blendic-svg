import { v4 } from 'uuid'

// Avoid `crypto.randomUUID` due to HTTPS limitation
export const generateUuid: () => string = v4
