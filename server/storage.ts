// Since we're using Firebase for authentication and data storage,
// we don't need a local storage implementation for users.
// This file is kept for potential future backend-specific operations.

export interface IStorage {
  // Future backend operations can be defined here
  healthCheck(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize any future storage needs here
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export const storage = new MemStorage();
