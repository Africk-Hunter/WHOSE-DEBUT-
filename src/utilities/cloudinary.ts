// Inserts Cloudinary auto-format/auto-quality/resize params so images are served
// as compressed, appropriately-sized (never upscaled) assets instead of full-res originals.
function optimizeCloudinaryUrl(url: string, width: number): string {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

export { optimizeCloudinaryUrl };
