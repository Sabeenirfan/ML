# Error Handler Utility

## Overview
Comprehensive error handling utility for consistent error management across the MealVista app.

## Features

- ✅ **Automatic error parsing** - Extracts meaningful messages from different error types
- ✅ **Error categorization** - Network, Authentication, Validation, Server, Unknown
- ✅ **Status code handling** - Specific messages for common HTTP status codes
- ✅ **Flexible handling** - Alerts, callbacks, or silent handling
- ✅ **Helper utilities** - Success, warning, and confirmation dialogs
- ✅ **Safe execution wrapper** - Try-catch wrapper for async operations

## Basic Usage

### Simple Error Handling with Alert

```tsx
import { handleError } from '../lib/errorHandler';
import api from '../lib/api';

try {
  const response = await api.post('/api/auth/login', credentials);
  // Handle success
} catch (error) {
  handleError(error, 'Login');
}
```

### Error Handling with Custom Callback

```tsx
import { handleErrorWithCallback } from '../lib/errorHandler';

try {
  await api.post('/api/recipes', data);
} catch (error) {
  handleErrorWithCallback(error, 'Create Recipe', (errorInfo) => {
    if (errorInfo.type === ErrorType.AUTHENTICATION) {
      // Redirect to login
      router.push('/signIn');
    }
  });
}
```

### Safe Execute Wrapper

```tsx
import { safeExecute } from '../lib/errorHandler';

const fetchRecipes = async () => {
  const recipes = await safeExecute(
    () => api.get('/api/recipes'),
    'Fetch Recipes',
    {
      onError: (errorInfo) => {
        setRecipes([]);
        setLoading(false);
      }
    }
  );
  
  if (recipes) {
    setRecipes(recipes.data.recipes);
  }
};
```

## API Reference

### `handleError(error, context?)`
Shows an alert dialog with the error message.

**Parameters:**
- `error` - The error object
- `context` - Optional context string for logging (e.g., "Login", "Fetch Recipes")

**Returns:** `ErrorInfo` object

**Example:**
```tsx
handleError(error, 'Login');
```

### `parseError(error, context?)`
Parses error and returns error information without showing alert.

**Parameters:**
- `error` - The error object
- `context` - Optional context for logging

**Returns:** `ErrorInfo` object with:
- `type: ErrorType`
- `message: string`
- `statusCode?: number`
- `originalError?: any`

**Example:**
```tsx
const errorInfo = parseError(error, 'Fetch Data');
console.log(errorInfo.message);
```

### `handleErrorWithCallback(error, context, callback)`
Handles error with custom callback instead of alert.

**Parameters:**
- `error` - The error object
- `context` - Optional context
- `callback` - Function called with `ErrorInfo`

**Example:**
```tsx
handleErrorWithCallback(error, 'Delete Item', (errorInfo) => {
  if (errorInfo.type === ErrorType.NETWORK) {
    setOfflineMode(true);
  }
});
```

### `safeExecute(operation, context, options?)`
Safely executes async operations with automatic error handling.

**Parameters:**
- `operation` - Async function to execute
- `context` - Context string
- `options` - Optional configuration:
  - `onError?: (errorInfo) => void` - Error callback
  - `showAlert?: boolean` - Show alert dialog (default: true)

**Returns:** Result of operation or `null` on error

**Example:**
```tsx
const data = await safeExecute(
  () => fetchData(),
  'Fetch Data',
  { showAlert: false }
);
```

### `showSuccess(message, title?)`
Shows success alert dialog.

```tsx
showSuccess('Recipe saved successfully!');
```

### `showWarning(message, title?)`
Shows warning alert dialog.

```tsx
showWarning('This action cannot be undone');
```

### `showConfirmation(message, onConfirm, onCancel?, title?)`
Shows confirmation dialog with Confirm/Cancel buttons.

```tsx
showConfirmation(
  'Are you sure you want to delete this recipe?',
  () => deleteRecipe(),
  () => console.log('Cancelled'),
  'Delete Recipe'
);
```

## Error Types

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',           // Network/connection errors
  AUTHENTICATION = 'AUTHENTICATION', // 401, 403 errors
  VALIDATION = 'VALIDATION',     // 400, 422 validation errors
  SERVER = 'SERVER',             // 500, 502, 503 server errors
  UNKNOWN = 'UNKNOWN'            // Other errors
}
```

## HTTP Status Code Handling

| Status Code | Type | Default Message |
|------------|------|-----------------|
| 400 | VALIDATION | "Invalid request. Please check your input." |
| 401 | AUTHENTICATION | "Your session has expired. Please login again." |
| 403 | AUTHENTICATION | "You do not have permission to perform this action." |
| 404 | SERVER | "The requested resource was not found." |
| 422 | VALIDATION | "Validation failed. Please check your input." |
| 500/502/503 | SERVER | "Server error. Please try again later." |
| Network Error | NETWORK | "No internet connection. Please check your network and try again." |
| Timeout | NETWORK | "Request timeout. Please try again." |

## Complete Example

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { handleError, showSuccess, showConfirmation } from '../lib/errorHandler';
import api from '../lib/api';

export default function RecipeScreen() {
  const [loading, setLoading] = useState(false);

  const deleteRecipe = async (id: string) => {
    showConfirmation(
      'Delete this recipe?',
      async () => {
        try {
          setLoading(true);
          await api.delete(`/api/recipes/${id}`);
          showSuccess('Recipe deleted successfully!');
        } catch (error) {
          handleError(error, 'Delete Recipe');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const saveRecipe = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/api/recipes', data);
      showSuccess('Recipe saved!');
    } catch (error) {
      handleError(error, 'Save Recipe');
    } finally {
      setLoading(false);
    }
  };

  return <View>{/* UI */}</View>;
}
```

## Best Practices

1. **Always provide context** - Makes debugging easier
2. **Use appropriate handlers** - Alert for user-facing, callback for custom logic
3. **Handle auth errors specially** - Redirect to login on 401
4. **Use safeExecute for non-critical operations** - Prevents app crashes
5. **Combine with loading states** - Always set loading to false in finally block
