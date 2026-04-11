type PhotoCallback = (uris: string[]) => void;

let _callback: PhotoCallback | null = null;

export const galleryState = {
  /**
   * Panggil ini di parent screen SEBELUM membuka GalleryScreen.
   * Callback akan dipanggil saat user mengkonfirmasi pilihan foto.
   */
  setCallback: (fn: PhotoCallback) => {
    _callback = fn;
  },

  /**
   * Dipanggil dari GalleryScreen saat user tekan tombol konfirmasi.
   */
  resolve: (uris: string[]) => {
    _callback?.(uris);
    _callback = null; // reset setelah dipakai
  },
};
