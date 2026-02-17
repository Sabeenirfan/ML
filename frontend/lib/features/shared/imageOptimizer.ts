export const optimizeImageUrl = (url: string, width = 800) => {
    if (!url) return url;
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto/`);
    }
    return `${url}?w=${width}&q=80`;
};

export const optimizeImageWithDimensions = (url: string, width: number, height: number) => {
    if (!url) return url;
    if (url.includes('cloudinary.com')) {
        return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
    }
    return `${url}?w=${width}&h=${height}&q=80&fit=cover`;
};

export const getThumbnailUrl = (url: string) => optimizeImageUrl(url, 400);

export const getFullSizeUrl = (url: string) => optimizeImageUrl(url, 1200);

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

const RECIPE_FOOD_IMAGES = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
    'https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=400',
    'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=400',
    'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
];

function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

export const getRecipeImageUrl = (recipeTitle: string, fallback?: string): string => {
    const title = (recipeTitle || '').trim();
    if (!title) return fallback || DEFAULT_FOOD_IMAGE;
    const index = hashString(title) % RECIPE_FOOD_IMAGES.length;
    return RECIPE_FOOD_IMAGES[index];
};
