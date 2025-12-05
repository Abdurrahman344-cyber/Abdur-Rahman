export enum AppMode {
  Chat = 'CHAT',
  Live = 'LIVE',
  Veo = 'VEO'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  image?: string; // Base64 or URL
  videoUrl?: string; // For Veo results
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p'; // 1080p only for fast-generate-preview if supported, else 720p
}

export interface UserSettings {
  useDeepThinking: boolean;
}

// Window extension for Veo API Key selection
declare global {
  // Augment the global AIStudio interface to include the methods we need.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // The 'aistudio' property is already defined on Window with type 'AIStudio' in the global scope.
    // We augment 'AIStudio' above to ensure it has the methods we need.
    
    // Helper for audio context
    webkitAudioContext: typeof AudioContext;
  }
}