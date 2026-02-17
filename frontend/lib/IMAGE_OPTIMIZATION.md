# Image Optimization Implementation

## Overview
Image optimization has been implemented across the MealVista app to improve performance and reduce bandwidth usage.

## What Was Created

### `lib/imageOptimizer.ts`
A utility module that provides image optimization functions:

- **`optimizeImageUrl(url, width)`** - Optimizes images for a specific width
- **`optimizeImageWithDimensions(url, width, height)`** - Optimizes with both dimensions
- **`getThumbnailUrl(url)`** - Returns 400px thumbnails for list/preview views
- **`getFullSizeUrl(url)`** - Returns 1200px images for detail views

## CDN Support

### Cloudinary
Automatically detected when URL contains `cloudinary.com`:
```typescript
// Converts:
// https://res.cloudinary.com/demo/upload/image.jpg
// To:
// https://res.cloudinary.com/demo/upload/w_400,c_limit,q_auto/image.jpg
```

### Custom CDN
Falls back to query parameter format:
```typescript
// Adds: ?w=400&q=80
```

## Updated Components

The following components now use optimized images:

### ✅ `app/favorites.tsx`
- Uses `getThumbnailUrl()` for recipe thumbnails (400px width)

### ✅ `app/home.tsx`  
- Uses `getThumbnailUrl()` for meal cards (400px width)

### ✅ `app/search.tsx`
- Uses `getThumbnailUrl()` for recipe search results (400px width)

## Usage Examples

### For List/Preview Views (Thumbnails)
```tsx
import { getThumbnailUrl } from '../lib/imageOptimizer';

<Image 
  source={{ uri: getThumbnailUrl(recipe.image) }}
  style={styles.image}
/>
```

### For Detail Views (Full Size)
```tsx
import { getFullSizeUrl } from '../lib/imageOptimizer';

<Image 
  source={{ uri: getFullSizeUrl(recipe.image) }}
  style={styles.detailImage}
/>
```

### Custom Width
```tsx
import { optimizeImageUrl } from '../lib/imageOptimizer';

<Image 
  source={{ uri: optimizeImageUrl(recipe.image, 600) }}
  style={styles.image}
/>
```

### With Dimensions (Crop & Fit)
```tsx
import { optimizeImageWithDimensions } from '../lib/imageOptimizer';

<Image 
  source={{ uri: optimizeImageWithDimensions(recipe.image, 400, 300) }}
  style={styles.banner}
/>
```

## Performance Benefits

- ✅ **Reduced bandwidth** - Smaller images load faster
- ✅ **Better performance** - Less memory usage
- ✅ **Automatic compression** - Quality optimization with `q_auto`
- ✅ **Responsive sizing** - Images sized appropriately for their use case

## Future Improvements

Consider applying optimization to:
- `app/recipeDetails.tsx` (use `getFullSizeUrl()` for hero images)
- `app/categories.tsx` (use `getThumbnailUrl()` for category cards)
- `app/seeAllergens.tsx` (optimize meal images)
- `app/admin/**` components (inventory images)
