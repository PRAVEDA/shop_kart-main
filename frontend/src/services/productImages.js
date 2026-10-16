const FALLBACK_PRODUCT_IMAGE =
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";

export const getProductImageSource = (image) => {
    if (typeof image !== "string" || !image.trim()) return FALLBACK_PRODUCT_IMAGE;

    try {
        if (new URL(image).hostname === "placehold.co") return FALLBACK_PRODUCT_IMAGE;
    } catch {
        return FALLBACK_PRODUCT_IMAGE;
    }

    return image.trim();
};

export const handleProductImageError = (event) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied) return;

    image.dataset.fallbackApplied = "true";
    image.src = FALLBACK_PRODUCT_IMAGE;
};