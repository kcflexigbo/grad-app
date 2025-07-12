(async () => {
  try {
    // Replicates the API URL logic from `src/api/config.ts` for consistency.
    // In development, this will correctly use the '/api' proxy.
    // In production, VITE_API_URL will be injected by the build process.
    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    const response = await fetch(`${apiUrl}/media?sort_by=newest&limit=1`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data || data.length === 0 || !data[0].media_url) return;

    const lcpImageUrl = data[0].media_url;
    const processCommands = "image/resize,w_{w}/format,webp/quality,q_80";

    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';

    // Use setAttribute for robustness, as 'imagesrcset' and 'imagesizes' are not standard properties on HTMLLinkElement.
    preloadLink.setAttribute('imagesrcset', [400, 600, 800, 1200, 1600]
      .map(w => `${lcpImageUrl}?x-oss-process=${processCommands.replace('{w}', String(w))} ${w}w`)
      .join(', '));
    preloadLink.setAttribute('imagesizes', '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw');

    document.head.appendChild(preloadLink);
  } catch (e) {
    console.error('LCP preload failed:', e);
  }
})();