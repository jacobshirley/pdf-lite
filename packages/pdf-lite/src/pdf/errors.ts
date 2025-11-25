/**
 * Error thrown when attempting to access a compressed object
 * that requires decompression from an object stream.
 */
export class FoundCompressedObjectError extends Error {}
