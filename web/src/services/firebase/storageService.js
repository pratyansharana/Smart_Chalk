import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export function uploadFileResumable(path, file, onProgress) {
  if (!storage || !file) return Promise.resolve('');

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file);
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(progress);
      },
      reject,
      async () => resolve(getDownloadURL(task.snapshot.ref)),
    );
  });
}
