# Skeleton Loader Component

## Overview
A comprehensive skeleton loader component with shimmer animation for better loading states and user experience.

## Components

### `<Skeleton />`
Basic skeleton component with customizable dimensions and shimmer animation.

**Props:**
- `width` - Width of skeleton (number or percentage string)
- `height` - Height of skeleton (default: 20)
- `borderRadius` - Border radius (default: 4)
- `style` - Additional styles

**Example:**
```tsx
<Skeleton width="100%" height={20} borderRadius={8} />
```

### `<RecipeCardSkeleton />`
Skeleton for vertical recipe cards in list views.

```tsx
<RecipeCardSkeleton />
```

### `<RecipeGridSkeleton />`
Skeleton for recipe cards in grid layout.

```tsx
<RecipeGridSkeleton />
```

### `<ListItemSkeleton />`
Skeleton for horizontal list items (e.g., favorites).

```tsx
<ListItemSkeleton />
```

### `<DetailHeaderSkeleton />`
Skeleton for recipe detail page header.

```tsx
<DetailHeaderSkeleton />
```

### `<CategoryPillSkeleton />`
Skeleton for category filter pills.

```tsx
<CategoryPillSkeleton />
```

### `<SkeletonList />`
Render multiple skeletons at once.

**Props:**
- `count` - Number of skeletons to render (default: 3)
- `type` - Type of skeleton: 'card' | 'grid' | 'list' | 'category'

**Example:**
```tsx
<SkeletonList count={5} type="card" />
```

## Usage Examples

### In a Loading State

```tsx
import { RecipeCardSkeleton, SkeletonList } from '../components/SkeletonLoader';

export default function RecipeList() {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);

  return (
    <View>
      {loading ? (
        <SkeletonList count={6} type="card" />
      ) : (
        recipes.map(recipe => <RecipeCard recipe={recipe} />)
      )}
    </View>
  );
}
```

### Custom Skeleton Layout

```tsx
import { Skeleton } from '../components/SkeletonLoader';

const CustomSkeleton = () => (
  <View style={styles.container}>
    <Skeleton width={100} height={100} borderRadius={50} />
    <Skeleton width="80%" height={20} style={{ marginTop: 12 }} />
    <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
  </View>
);
```

### Grid Layout

```tsx
import { SkeletonList } from '../components/SkeletonLoader';

<View style={styles.gridContainer}>
  <SkeletonList count={4} type="grid" />
</View>
```

## Features

- ✨ **Smooth shimmer animation** - Animated gradient effect
- 🎨 **Multiple variants** - Pre-built skeletons for common UI patterns
- 🔧 **Customizable** - Basic Skeleton component for custom layouts
- ⚡ **Performance optimized** - Uses native driver for smooth animations
- 📱 **Responsive** - Adapts to screen width automatically

## Animation Details

The shimmer animation uses React Native's `Animated` API with native driver for optimal performance:

- Duration: 1500ms per direction (3s total loop)
- Effect: Translating white overlay from left to right
- Loop: Continuous animation while component is mounted

## Recommended Usage

Apply skeleton loaders to screens that:
- Fetch data from API
- Load images
- Have variable loading times
- Display lists or grids of content

Screens to update:
- `app/home.tsx` - Recipe grid loading
- `app/search.tsx` - Search results loading
- `app/favorites.tsx` - Favorites list loading
- `app/categories.tsx` - Category recipes loading
- `app/recipeDetails.tsx` - Detail page loading
