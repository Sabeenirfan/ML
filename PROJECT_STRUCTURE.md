# Meal Vista – Project structure

Open this file in Cursor to see the full layout. To show the **Explorer** (file tree) in the sidebar: **Ctrl+Shift+E**.

---

```
meal_vista-main/
├── .vscode/
│   └── settings.json
├── .gitignore
│
├── backend/                    # Node.js API
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   ├── images/
│   │   └── README.md
│   ├── middleware/
│   │   ├── adminAuth.js
│   │   └── auth.js
│   ├── services/
│   │   ├── aiRecipeGenerator.js
│   │   ├── aiRecipeService.js
│   │   └── emailService.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── passport.js
│   │   ├── features/
│   │   │   ├── admin/routes.js
│   │   │   ├── ai-recipes/routes.js
│   │   │   ├── auth/
│   │   │   │   ├── google-routes.js
│   │   │   │   └── routes.js
│   │   │   ├── inventory/routes.js
│   │   │   ├── otp/routes.js
│   │   │   └── recipes/routes.js
│   │   ├── middleware/
│   │   │   ├── adminAuth.js
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── config.js
│   │   │   └── index.js
│   │   └── shared/
│   │       ├── aiRecipeGenerator.js
│   │       ├── aiRecipeService.js
│   │       ├── cartStore.js
│   │       ├── emailService.js
│   │       ├── groceryStore.js
│   │       ├── recipeImageService.js
│   │       └── (etc.)
│   ├── scripts/
│   │   ├── add-sample-images.js
│   │   ├── allow-port-5000.ps1
│   │   ├── auto-download-images.js
│   │   ├── check-categories.js
│   │   ├── check-env.js
│   │   ├── check-image-status.js
│   │   ├── create-admin.js
│   │   ├── download-placeholders.js
│   │   ├── list-image-names.js
│   │   ├── remove-ingredients-category.js
│   │   ├── seed-inventory.js
│   │   ├── test-connection.js
│   │   ├── test-google-auth.js
│   │   ├── test-grocerystore.js
│   │   ├── test-simple.js
│   │   ├── update-real-images.js
│   │   ├── update-with-pixabay.js
│   │   ├── update-with-unsplash.js
│   │   ├── upload-images.js
│   │   └── verify-admin.js
│   ├── package.json
│   ├── package-lock.json
│   ├── request.http
│   ├── server.js
│   └── test_query.json
│
├── frontend/                   # React Native / Expo app
│   ├── android/
│   │   ├── app/src/main/res/values/
│   │   ├── gradle/
│   │   ├── build.gradle
│   │   ├── gradle.properties
│   │   ├── gradlew
│   │   ├── gradlew.bat
│   │   └── settings.gradle
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── forgotPassword.tsx
│   │   │   ├── signIn.tsx
│   │   │   ├── signup.tsx
│   │   │   ├── verifyEmailOTP.tsx
│   │   │   └── verifyOTP.tsx
│   │   └── (tabs)/ ...
│   ├── components/
│   │   ├── recipes/
│   │   │   └── CuisineCategories.tsx
│   │   ├── ui/
│   │   │   ├── SkeletonLoader.tsx
│   │   │   └── themed-view.tsx
│   │   ├── CuisineCategories.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── SKELETON_LOADER.md
│   │   ├── themed-text.tsx
│   │   └── themed-view.tsx
│   ├── constants/
│   │   └── theme.ts
│   ├── hooks/
│   │   ├── network/useNetworkStatus.ts
│   │   ├── recipes/useRecipes.ts
│   │   └── theme/
│   ├── lib/
│   │   ├── features/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── cart/CartContext.tsx
│   │   │   ├── favorites/FavoritesContext.tsx
│   │   │   ├── inventory/
│   │   │   ├── onboarding/
│   │   │   └── shared/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── authStorage.ts
│   │   ├── errorHandler.ts
│   │   ├── googleAuth.ts
│   │   ├── imageOptimizer.ts
│   │   ├── index.ts
│   │   ├── onboardingStorage.ts
│   │   ├── queryClient.ts
│   │   ├── validators.ts
│   │   └── *.md
│   ├── scripts/
│   │   ├── patch-metro-runtime.js
│   │   └── reset-project.js
│   ├── app.json
│   ├── eslint.config.js
│   ├── metro.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── tsconfig.json
│
├── recipe-engine/              # Python recipe/AI engine
│   ├── src/
│   │   ├── api.py
│   │   ├── allergen_substitution.py
│   │   ├── frontend_examples.py
│   │   ├── gemini_generator.py
│   │   ├── groq_generator.py
│   │   ├── halal_filter.py
│   │   ├── mealvista_recipe_engine.py
│   │   ├── nutrition_assistant_rules.py
│   │   ├── nutrition_estimator.py
│   │   ├── recipe_database.py
│   │   ├── usda_client.py
│   │   └── __init__.py
│   ├── tests/
│   │   ├── test_agent_request.py
│   │   ├── test_engine.py
│   │   ├── test_gemini.py
│   │   ├── test_halal_compliance.py
│   │   ├── test_integration.py
│   │   ├── test_request.json
│   │   ├── test_generate.json
│   │   ├── test_diversity.json
│   │   └── test_search.py
│   ├── .env.example
│   ├── README.md
│   ├── requirements.txt
│   └── run.py
│
└── PROJECT_STRUCTURE.md        # this file
```

## Quick reference

| Part           | Tech              | Purpose                    |
|----------------|-------------------|----------------------------|
| **backend**    | Node.js, Express  | API, auth, recipes, admin  |
| **frontend**   | React Native/Expo | Mobile app (e.g. Android)  |
| **recipe-engine** | Python        | Recipe generation, nutrition, halal |

---

**To see the real file tree in Cursor:** press **Ctrl+Shift+E** to open the Explorer sidebar.
