import { useState } from 'react';
import { uploadFileResumable } from '../services/firebase/storageService';

/**
 * Uploads a file to Firebase Storage and exposes progress state.
 * @returns Upload function plus loading, progress, error, and download URL state.
 * @sideEffects Writes files to Firebase Storage through storageService.
 */
export function useFileUpload() {
  const [state, setState] = useState({ loading: false, progress: 0, error: null, url: '' });

  async function upload(path, file) {
    setState({ loading: true, progress: 0, error: null, url: '' });
    try {
      const url = await uploadFileResumable(path, file, (progress) => {
        setState((current) => ({ ...current, progress }));
      });
      setState({ loading: false, progress: 100, error: null, url });
      return url;
    } catch (error) {
      setState({ loading: false, progress: 0, error, url: '' });
      throw error;
    }
  }

  return { ...state, upload };
}
