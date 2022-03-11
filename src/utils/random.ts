import { v4 } from 'uuid'

// Avoid `crypto.randomUUID` due to HTTPS limitation
// Avoid number prefix to use as DOM ID
export const generateUuid: () => string = () => `b-${v4()}`
