// Dropbox Saver integration
// Uses the Dropbox Saver drop-in for saving files directly to user's Dropbox
// No server required - works entirely in the browser

declare global {
  interface Window {
    Dropbox?: {
      isBrowserSupported: () => boolean;
      save: (options: DropboxSaveOptions) => void;
    };
  }
}

interface DropboxSaveOptions {
  files: Array<{
    url: string;
    filename: string;
  }>;
  success?: () => void;
  progress?: (progress: number) => void;
  cancel?: () => void;
  error?: (errorMessage: string) => void;
}

const DROPBOX_SDK_URL = 'https://www.dropbox.com/static/api/2/dropins.js';

let sdkLoadPromise: Promise<void> | null = null;

/**
 * Load the Dropbox SDK script dynamically
 */
export function loadDropboxSdk(appKey: string): Promise<void> {
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Dropbox) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.getElementById('dropboxjs');
    if (existingScript) {
      // Update app key if different
      existingScript.setAttribute('data-app-key', appKey);
      if (window.Dropbox) {
        resolve();
        return;
      }
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Dropbox SDK')));
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.id = 'dropboxjs';
    script.src = DROPBOX_SDK_URL;
    script.setAttribute('data-app-key', appKey);
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('Failed to load Dropbox SDK'));
    };

    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

/**
 * Check if the browser supports Dropbox Saver
 */
export function isDropboxSupported(): boolean {
  return window.Dropbox?.isBrowserSupported() ?? false;
}

/**
 * Save data to Dropbox using the Saver drop-in
 * Returns a promise that resolves on success, rejects on error/cancel
 */
export function saveToDropbox(
  data: string,
  filename: string,
  appKey: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load SDK if not loaded
      await loadDropboxSdk(appKey);

      if (!window.Dropbox) {
        throw new Error('Dropbox SDK not available');
      }

      if (!window.Dropbox.isBrowserSupported()) {
        throw new Error('Browser not supported by Dropbox');
      }

      // Create a data URL from the JSON string
      const blob = new Blob([data], { type: 'application/json' });
      const dataUrl = URL.createObjectURL(blob);

      window.Dropbox.save({
        files: [
          {
            url: dataUrl,
            filename: filename,
          },
        ],
        success: () => {
          URL.revokeObjectURL(dataUrl);
          resolve();
        },
        cancel: () => {
          URL.revokeObjectURL(dataUrl);
          reject(new Error('cancelled'));
        },
        error: (errorMessage: string) => {
          URL.revokeObjectURL(dataUrl);
          reject(new Error(errorMessage));
        },
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a backup filename with current date
 */
export function generateBackupFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `asset-tracker-backup-${date}.json`;
}
