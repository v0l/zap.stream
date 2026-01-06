export { };
declare global {
    interface Window { dataLayer?: Array<unknown>; }
}

function gtag(...args: unknown[]) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
}

gtag('js', new Date());
gtag('config', 'AW-17854661671');
console.debug("GTM setup: ", window.dataLayer);