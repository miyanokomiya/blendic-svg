import { nanoid } from 'nanoid'

// Avoid `crypto.randomUUID` due to HTTPS limitation
// Avoid number prefix for DOM ID
export const generateUuid: () => string = () => `b${nanoid(12)}`
