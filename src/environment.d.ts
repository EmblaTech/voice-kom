// This file tells TypeScript about the custom environment variables
// that Webpack will inject.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Add your custom variable here with its type
      VOICEKOM_API_BASE_URL: string;
    }
  }
}

// This export statement is needed to make the file a module
export {};