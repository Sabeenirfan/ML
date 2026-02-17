const axios = require('axios');

/**
 * Recipe Generator Service (knowledge base only, no AI models)
 * Generates recipes from stored recipe templates only.
 */
class AIRecipeGenerator {
  constructor() {
    // No external AI models - knowledge base only
  }

  /**
   * Generate personalized recipe prompt based on user profile
   */
  generateRecipePrompt(userProfile, searchQuery) {
    const { dietaryPreferences = [], bmi, bmiCategory, healthGoal, allergens = [] } = userProfile;
    
    // Calculate calorie target based on BMI and health goal
    const calorieTarget = this.calculateCalorieTarget(bmi, bmiCategory, healthGoal);
    
    // Build dietary constraints
    let constraints = [];
    if (dietaryPreferences.includes('vegetarian')) constraints.push('vegetarian');
    if (dietaryPreferences.includes('vegan')) constraints.push('vegan');
    if (dietaryPreferences.includes('keto')) constraints.push('keto (low carb, high fat)');
    if (dietaryPreferences.includes('low-carb')) constraints.push('low-carb');
    if (dietaryPreferences.includes('high-protein')) constraints.push('high-protein');
    if (allergens.length > 0) {
      constraints.push(`allergen-free: no ${allergens.join(', ')}`);
    }
    
    // Build prompt
    let prompt = `Create a detailed recipe for "${searchQuery}" that is:\n`;
    prompt += `- Calorie target: ${calorieTarget.min}-${calorieTarget.max} calories per serving\n`;
    prompt += `- BMI category: ${bmiCategory || 'Normal'}\n`;
    prompt += `- Health goal: ${this.formatHealthGoal(healthGoal)}\n`;
    
    if (constraints.length > 0) {
      prompt += `- Dietary requirements: ${constraints.join(', ')}\n`;
    }
    
    prompt += `\nProvide:\n`;
    prompt += `1. Recipe name\n`;
    prompt += `2. Ingredients with exact quantities\n`;
    prompt += `3. Step-by-step cooking instructions\n`;
    prompt += `4. Estimated prep time and cook time\n`;
    prompt += `5. Nutritional information (calories, protein, carbs, fat, fiber)\n`;
    prompt += `6. Difficulty level\n`;
    prompt += `7. Number of servings\n`;
    
    return prompt;
  }

  /**
   * Calculate calorie target based on BMI and health goal
   */
  calculateCalorieTarget(bmi, bmiCategory, healthGoal) {
    let baseCalories = 500; // Default per meal
    
    // Adjust based on BMI category
    if (bmiCategory === 'Underweight' || (bmi && bmi < 18.5)) {
      baseCalories = 600;
    } else if (bmiCategory === 'Normal' || (bmi && bmi >= 18.5 && bmi < 25)) {
      baseCalories = 500;
    } else if (bmiCategory === 'Overweight' || (bmi && bmi >= 25 && bmi < 30)) {
      baseCalories = 400;
    } else if (bmiCategory === 'Obese' || (bmi && bmi >= 30)) {
      baseCalories = 350;
    }
    
    // Adjust based on health goal
    if (healthGoal === 'weight_loss') {
      baseCalories = Math.max(250, baseCalories - 100);
    } else if (healthGoal === 'weight_gain') {
      baseCalories = baseCalories + 150;
    }
    // maintenance: keep baseCalories as is
    
    return {
      min: Math.max(200, baseCalories - 100),
      max: Math.min(800, baseCalories + 150)
    };
  }

  /**
   * Format health goal for display
   */
  formatHealthGoal(goal) {
    const goals = {
      'weight_loss': 'Weight Loss',
      'weight_gain': 'Weight Gain',
      'maintenance': 'Weight Maintenance'
    };
    return goals[goal] || 'Weight Maintenance';
  }

  /**
   * Generate personalized recipe using knowledge base only (no AI models)
   * @param {Object} userProfile - User dietary profile
   * @param {string} searchQuery - Search term (e.g. "bean", "tomato")
   * @param {number} [variantIndex=0] - 0-4 to get different recipe variants
   */
  async generatePersonalizedRecipe(userProfile, searchQuery, variantIndex = 0) {
    try {
      console.log(`📚 Using knowledge-based recipe (variant ${variantIndex + 1}/5) for: "${searchQuery}"`);
      return this.generateWithKnowledgeBase(userProfile, searchQuery, variantIndex);
    } catch (error) {
      console.error('Knowledge-base generation error:', error.message);
      return this.generateWithKnowledgeBase(userProfile, searchQuery, variantIndex);
    }
  }

  /**
   * Enhance AI recipe if it's incomplete
   */
  enhanceAIRecipe(recipe, userProfile, searchQuery) {
    // Ensure all required fields are present
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      recipe.ingredients = this.generateIngredientsForQuery(searchQuery, userProfile.dietaryPreferences || [], userProfile.allergens || []);
    }
    if (!recipe.instructions || recipe.instructions.length === 0) {
      recipe.instructions = this.generateInstructionsForQuery(searchQuery, userProfile.dietaryPreferences || []);
    }
    if (!recipe.image || recipe.image.includes('placeholder')) {
      recipe.image = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchQuery)},food`;
    }
    return recipe;
  }

  /**
   * Generate recipe using knowledge base (stored recipe templates only)
   * @param {number} [variantIndex=0] - 0-4 for 5 different recipe variants (avoids duplicate "X Delight")
   */
  generateWithKnowledgeBase(userProfile, searchQuery, variantIndex = 0) {
    const { dietaryPreferences = [], healthGoal, allergens = [], bmi, bmiCategory } = userProfile;
    const calorieTarget = this.calculateCalorieTarget(bmi, bmiCategory, healthGoal);
    const queryLower = searchQuery.toLowerCase();
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const main = cap(searchQuery);
    
    let recipeName = '';
    let ingredients = [];
    let instructions = [];
    
    const vegan = dietaryPreferences.includes('vegan') || queryLower.includes('vegan');
    const vegetarian = vegan || dietaryPreferences.includes('vegetarian') || queryLower.includes('vegetarian');
    
    const cuisineRecipes = {
      italian: [
        { name: 'Tomato Basil Pasta', ings: ['300g spaghetti', '4 tomatoes', 'Fresh basil', '2 cloves garlic', 'Olive oil', 'Parmesan', 'Salt and pepper'], steps: ['Cook pasta al dente', 'Sauté garlic in olive oil', 'Add chopped tomatoes and basil', 'Toss with pasta and serve with Parmesan'] },
        { name: 'Mushroom Risotto', ings: ['300g arborio rice', '200g mushrooms', '1 onion', 'Vegetable broth', 'White wine', 'Parmesan', 'Butter'], steps: ['Sauté onion and mushrooms', 'Add rice, toast 2 mins', 'Add wine, then broth gradually', 'Stir until creamy, add Parmesan and butter'] },
        { name: 'Caprese Salad', ings: ['3 tomatoes', '200g mozzarella', 'Fresh basil', 'Olive oil', 'Balsamic glaze', 'Salt and pepper'], steps: ['Slice tomatoes and mozzarella', 'Arrange with basil leaves', 'Drizzle oil and balsamic', 'Season and serve'] },
        { name: 'Minestrone Soup', ings: ['1 onion', '2 carrots', '2 celery stalks', '400g tinned tomatoes', 'Pasta', 'Cannellini beans', 'Vegetable broth', 'Herbs'], steps: ['Sauté vegetables', 'Add tomatoes and broth', 'Simmer 20 mins', 'Add pasta and beans', 'Cook until pasta is done'] },
        { name: 'Garlic Bread with Herbs', ings: ['1 baguette', '4 cloves garlic', 'Butter', 'Parsley', 'Oregano', 'Salt'], steps: ['Mix butter, garlic, herbs', 'Slice baguette and spread', 'Bake at 200°C until golden', 'Serve warm'] },
      ],
      pakistani: [
        { name: 'Chana Masala', ings: ['400g chickpeas', '2 tomatoes', '1 onion', 'Garam masala', 'Turmeric', 'Cumin', 'Coriander', 'Ginger garlic paste'], steps: ['Sauté onion and spices', 'Add tomatoes and paste', 'Add chickpeas and simmer', 'Garnish with coriander'] },
        { name: 'Dal Tadka', ings: ['200g red lentils', '1 onion', 'Tomatoes', 'Cumin seeds', 'Garlic', 'Turmeric', 'Ghee', 'Coriander'], steps: ['Cook lentils until soft', 'Temper with cumin, garlic in ghee', 'Pour over dal', 'Serve with rice or roti'] },
        { name: 'Aloo Gobi', ings: ['3 potatoes', '1 cauliflower', 'Onion', 'Tomatoes', 'Turmeric', 'Cumin', 'Coriander powder', 'Fresh coriander'], steps: ['Sauté onion and spices', 'Add potatoes, cook 5 mins', 'Add cauliflower and tomatoes', 'Cover and cook until tender'] },
        { name: 'Vegetable Biryani', ings: ['2 cups basmati rice', 'Mixed vegetables', 'Biryani masala', 'Saffron', 'Yogurt', 'Onion', 'Mint', 'Coriander'], steps: ['Parboil rice', 'Layer spiced vegetables and rice', 'Add saffron and herbs', 'Dum cook 20 mins'] },
        { name: 'Lentil Kitchari', ings: ['150g mung dal', '150g rice', 'Turmeric', 'Cumin', 'Ginger', 'Ghee', 'Salt'], steps: ['Rinse rice and dal', 'Sauté spices in ghee', 'Add rice, dal and water', 'Cook until soft and creamy'] },
      ],
      mediterranean: [
        { name: 'Greek Salad', ings: ['Cucumber', 'Tomatoes', 'Red onion', 'Feta cheese', 'Olives', 'Olive oil', 'Oregano', 'Lemon'], steps: ['Chop vegetables', 'Add olives and cubed feta', 'Dress with oil and lemon', 'Season with oregano'] },
        { name: 'Hummus with Pita', ings: ['400g chickpeas', 'Tahini', 'Lemon juice', 'Garlic', 'Olive oil', 'Cumin', 'Paprika'], steps: ['Blend chickpeas, tahini, lemon, garlic', 'Add oil and cumin', 'Serve with pita and paprika'] },
        { name: 'Ratatouille', ings: ['Aubergine', 'Courgette', 'Peppers', 'Tomatoes', 'Onion', 'Garlic', 'Herbes de Provence', 'Olive oil'], steps: ['Sauté onion and garlic', 'Layer sliced vegetables', 'Add tomatoes and herbs', 'Bake until tender'] },
        { name: 'Falafel', ings: ['400g chickpeas', 'Onion', 'Garlic', 'Cumin', 'Coriander', 'Parsley', 'Breadcrumbs', 'Oil for frying'], steps: ['Blend chickpeas with aromatics', 'Form balls and coat in breadcrumbs', 'Fry until golden', 'Serve in pita with tahini'] },
        { name: 'Stuffed Peppers', ings: ['4 bell peppers', 'Rice', 'Tomatoes', 'Herbs', 'Pine nuts', 'Olive oil', 'Feta'], steps: ['Cook rice', 'Mix with tomatoes, herbs, nuts', 'Stuff peppers and top with feta', 'Bake 30 mins'] },
      ],
      mexican: [
        { name: 'Black Bean Tacos', ings: ['400g black beans', 'Tortillas', 'Avocado', 'Lime', 'Coriander', 'Onion', 'Cumin', 'Chili'], steps: ['Warm beans with cumin and chili', 'Warm tortillas', 'Fill with beans, avocado, onion', 'Top with lime and coriander'] },
        { name: 'Guacamole', ings: ['3 avocados', 'Lime', 'Tomato', 'Red onion', 'Coriander', 'Jalapeño', 'Salt'], steps: ['Mash avocados', 'Fold in diced tomato, onion', 'Add lime, coriander, jalapeño', 'Season and serve with chips'] },
        { name: 'Vegetable Fajitas', ings: ['Bell peppers', 'Onion', 'Courgette', 'Fajita seasoning', 'Tortillas', 'Lime', 'Sour cream'], steps: ['Slice vegetables', 'Sauté with fajita seasoning', 'Serve in warm tortillas', 'Add lime and cream'] },
        { name: 'Mexican Rice', ings: ['Rice', 'Tomatoes', 'Onion', 'Garlic', 'Cumin', 'Stock', 'Peas', 'Coriander'], steps: ['Toast rice with onion', 'Add tomatoes and stock', 'Simmer until cooked', 'Stir in peas and coriander'] },
        { name: 'Corn and Bean Salad', ings: ['Sweetcorn', 'Black beans', 'Red pepper', 'Lime', 'Coriander', 'Olive oil', 'Cumin'], steps: ['Combine corn, beans, pepper', 'Dress with lime, oil, cumin', 'Add coriander', 'Chill and serve'] },
      ],
      chinese: [
        { name: 'Stir-Fried Vegetables', ings: ['Broccoli', 'Bell peppers', 'Carrots', 'Soy sauce', 'Ginger', 'Garlic', 'Sesame oil', 'Spring onions'], steps: ['Heat wok with oil', 'Stir-fry ginger and garlic', 'Add vegetables and soy sauce', 'Toss and garnish with spring onion'] },
        { name: 'Egg Fried Rice', ings: ['Cooked rice', '2 eggs', 'Soy sauce', 'Peas', 'Carrots', 'Spring onion', 'Sesame oil'], steps: ['Scramble eggs, set aside', 'Stir-fry rice with vegetables', 'Add soy and sesame', 'Fold in egg and serve'] },
        { name: 'Tofu and Broccoli', ings: ['300g tofu', 'Broccoli', 'Soy sauce', 'Ginger', 'Garlic', 'Rice vinegar', 'Sesame seeds'], steps: ['Pan-fry tofu until golden', 'Blanch broccoli', 'Stir-fry with sauce and aromatics', 'Serve over rice'] },
        { name: 'Vegetable Dumplings', ings: ['Dumpling wrappers', 'Cabbage', 'Carrot', 'Spring onion', 'Ginger', 'Soy sauce', 'Sesame oil'], steps: ['Mix filling', 'Fill and seal wrappers', 'Steam or pan-fry', 'Serve with dipping sauce'] },
        { name: 'Hot and Sour Soup', ings: ['Mushrooms', 'Tofu', 'Bamboo shoots', 'Vinegar', 'White pepper', 'Soy sauce', 'Stock', 'Egg'], steps: ['Bring stock to boil', 'Add vegetables and tofu', 'Season with vinegar and pepper', 'Drizzle egg and serve'] },
      ],
      thai: [
        { name: 'Vegetable Pad Thai', ings: ['Rice noodles', 'Tofu', 'Bean sprouts', 'Peanuts', 'Tamarind', 'Fish sauce', 'Lime'], steps: ['Soak noodles', 'Stir-fry tofu and vegetables', 'Add noodles and sauce', 'Top with peanuts and lime'] },
        { name: 'Green Papaya Salad', ings: ['Green papaya', 'Carrots', 'Peanuts', 'Lime', 'Fish sauce', 'Chili', 'Tomatoes'], steps: ['Shred papaya and carrot', 'Pound with chili and garlic', 'Add lime and fish sauce', 'Toss with peanuts'] },
        { name: 'Thai Curry', ings: ['Curry paste', 'Coconut milk', 'Aubergine', 'Bamboo shoots', 'Basil', 'Lime leaves', 'Rice'], steps: ['Fry curry paste', 'Add coconut milk and vegetables', 'Simmer until tender', 'Serve with rice and basil'] },
        { name: 'Tom Yum Soup', ings: ['Mushrooms', 'Tomatoes', 'Lemongrass', 'Galangal', 'Lime leaves', 'Chili', 'Stock', 'Coriander'], steps: ['Simmer lemongrass, galangal, lime', 'Add mushrooms and tomatoes', 'Season with chili and lime juice', 'Garnish with coriander'] },
        { name: 'Mango Sticky Rice', ings: ['Sticky rice', 'Coconut milk', 'Mango', 'Sugar', 'Salt'], steps: ['Steam rice', 'Mix with coconut milk and sugar', 'Serve with sliced mango', 'Drizzle extra coconut cream'] },
      ],
    };
    
    let cuisine = null;
    if (queryLower.includes('italian')) cuisine = 'italian';
    else if (queryLower.includes('pakistani')) cuisine = 'pakistani';
    else if (queryLower.includes('mediterranean')) cuisine = 'mediterranean';
    else if (queryLower.includes('mexican')) cuisine = 'mexican';
    else if (queryLower.includes('chinese')) cuisine = 'chinese';
    else if (queryLower.includes('thai')) cuisine = 'thai';
    
    if (cuisine && cuisineRecipes[cuisine]) {
      const list = cuisineRecipes[cuisine];
      const v = list[variantIndex % list.length];
      recipeName = v.name;
      ingredients = (vegetarian || vegan) ? this.filterIngredients(v.ings, dietaryPreferences, allergens) : v.ings;
      if (ingredients.length === 0) ingredients = v.ings;
      instructions = v.steps;
    } else if (queryLower.includes('egg')) {
      recipeName = 'Perfect Scrambled Eggs';
      ingredients = [
        '4 large eggs',
        '2 tbsp butter',
        '2 tbsp milk or cream',
        'Salt and pepper to taste',
        'Fresh chives, chopped (optional)',
      ];
      instructions = [
        'Crack eggs into a bowl and whisk until yolks and whites are combined',
        'Add milk, salt, and pepper, and whisk again',
        'Heat butter in a non-stick pan over medium-low heat',
        'Pour in the egg mixture and let it sit for 30 seconds',
        'Gently push the eggs from the edges toward the center with a spatula',
        'Continue cooking, stirring occasionally, until eggs are creamy and just set (2-3 minutes)',
        'Remove from heat while still slightly runny (they will continue cooking)',
        'Garnish with chives and serve immediately',
      ];
    } else if (queryLower.includes('chicken')) {
      recipeName = 'Herb-Roasted Chicken';
      ingredients = [
        '1 whole chicken (1.5-2kg)',
        '2 tbsp olive oil',
        '1 lemon, halved',
        '4 cloves garlic, minced',
        '1 tsp dried rosemary',
        '1 tsp dried thyme',
        'Salt and pepper to taste',
        '1 onion, quartered',
      ];
      instructions = [
        'Preheat oven to 200°C (400°F)',
        'Pat chicken dry and place in a roasting pan',
        'Mix olive oil, garlic, rosemary, thyme, salt, and pepper',
        'Rub the mixture all over the chicken, including under the skin',
        'Place lemon halves and onion quarters inside the chicken cavity',
        'Roast for 60-75 minutes until internal temperature reaches 75°C (165°F)',
        'Let rest for 10 minutes before carving',
        'Serve with roasted vegetables',
      ];
    } else if (queryLower.includes('pasta')) {
      recipeName = 'Creamy Pasta';
      ingredients = [
        '300g pasta (penne or fettuccine)',
        '200ml heavy cream',
        '100g parmesan cheese, grated',
        '2 cloves garlic, minced',
        '2 tbsp butter',
        'Salt and pepper to taste',
        'Fresh basil leaves',
      ];
      instructions = [
        'Cook pasta according to package directions until al dente',
        'Meanwhile, heat butter in a large pan over medium heat',
        'Add garlic and cook for 1 minute until fragrant',
        'Pour in cream and bring to a gentle simmer',
        'Add grated parmesan and stir until melted and smooth',
        'Drain pasta, reserving 1/2 cup of pasta water',
        'Add pasta to the sauce and toss to combine',
        'Add pasta water if needed to thin the sauce',
        'Season with salt and pepper, garnish with basil, and serve',
      ];
    } else {
      // Check if search contains multiple ingredients (comma-separated)
      const hasMultipleIngredients = queryLower.includes(',');
      
      if (hasMultipleIngredients) {
        // Handle ingredient-based search (e.g. "oil,salt,pepper")
        const ingredients_list = searchQuery.split(',').map(i => i.trim()).filter(i => i.length > 0);
        const variants = [
          { name: `Simple Home Cooking`, ings: ingredients_list.concat(['1 onion, diced', '2 cloves garlic', '2 cups rice', 'Water']), steps: ['Combine all ingredients', 'Cook according to basic recipe', 'Season to taste', 'Serve hot'] },
          { name: `Quick Pantry Meal`, ings: ingredients_list.concat(['300g pasta', 'Fresh herbs', 'Parmesan cheese']), steps: ['cook pasta according to package', `Mix with ${ingredients_list.join(', ')}`, 'Add herbs and seasoning', 'Serve with cheese'] },
          { name: `Homemade Special`, ings: ingredients_list.concat(['2 eggs', '1 cup flour', 'Milk', 'Butter']), steps: ['Mix dry ingredients', 'Add wet ingredients', 'Cook until done', 'Season and serve'] },
          { name: `Classic Comfort Food`, ings: ingredients_list.concat(['4 potatoes', '2 tomatoes', 'Fresh basil']), steps: ['Prepare all ingredients', 'Combine in pot', 'Cook until tender', 'Serve warm'] },
          { name: `Easy Everyday Recipe`, ings: this.generateIngredientsForQuery(ingredients_list[0] || searchQuery, dietaryPreferences, allergens), steps: this.generateInstructionsForQuery(ingredients_list[0] || searchQuery, dietaryPreferences).map(x => (x && typeof x === 'object' && x.text) ? x.text : String(x)) },
        ];
        const v = variants[variantIndex % 5];
        recipeName = v.name;
        ingredients = v.ings;
        instructions = Array.isArray(v.steps) ? v.steps.map(s => typeof s === 'string' ? s : (s && s.text) || String(s)) : [];
      } else {
        // Five distinct variants with proper dish names (avoid raw ingredient as title only, e.g. "Mustard Delight")
        const variants = [
          { name: `Soup with ${main}`, ings: ['2 tbsp olive oil', '1 onion, diced', '2 cloves garlic', '400g ' + searchQuery, '1 litre vegetable broth', 'Salt and pepper', 'Fresh herbs'], steps: ['Sauté onion and garlic in oil until soft', `Add ${searchQuery} and broth`, 'Simmer 20 minutes', 'Blend until smooth (optional)', 'Season and serve with herbs'] },
          { name: `Salad with ${main}`, ings: ['300g ' + searchQuery, '1 cucumber, diced', '2 tomatoes', 'Red onion, sliced', 'Olive oil and lemon', 'Salt and pepper'], steps: ['Cook ' + searchQuery + ' until tender, then cool', 'Combine with cucumber, tomatoes, onion', 'Dress with oil and lemon', 'Season and serve chilled'] },
          { name: `${main} Stir-Fry`, ings: ['400g ' + searchQuery, '2 tbsp oil', 'Soy sauce', 'Ginger and garlic', 'Bell peppers', 'Spring onions'], steps: ['Heat oil in a wok', `Add ${searchQuery} and stir-fry 5 mins`, 'Add peppers and aromatics', 'Add soy sauce, toss, and serve with rice'] },
          { name: `${main} Bowl`, ings: ['350g ' + searchQuery, 'Cooked rice or quinoa', 'Avocado', 'Lime', 'Coriander', 'Salt'], steps: ['Prepare grain base', `Top with cooked ${searchQuery}`, 'Add avocado and lime', 'Garnish with coriander and serve'] },
          { name: `Savory ${main} Dish`, ings: this.generateIngredientsForQuery(searchQuery, dietaryPreferences, allergens), steps: this.generateInstructionsForQuery(searchQuery, dietaryPreferences).map(x => (x && typeof x === 'object' && x.text) ? x.text : String(x)) },
        ];
        const v = variants[variantIndex % 5];
        recipeName = v.name;
        ingredients = v.ings;
        instructions = Array.isArray(v.steps) ? v.steps.map(s => typeof s === 'string' ? s : (s && s.text) || String(s)) : [];
      }
    }
    
    // Apply dietary preferences and allergens
    ingredients = this.filterIngredients(ingredients, dietaryPreferences, allergens);
    
    // Calculate nutrition
    const nutrition = this.estimateNutrition(ingredients, calorieTarget);
    
    // Determine difficulty and time
    const difficulty = instructions.length < 5 ? 'Easy' : instructions.length < 10 ? 'Medium' : 'Hard';
    const prepTime = Math.max(10, Math.floor(instructions.length * 2));
    const cookTime = Math.max(15, Math.floor(instructions.length * 3));
    
    // Get image
    const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchQuery)},food`;
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.personalizeRecipeName(recipeName, userProfile),
      image: imageUrl,
      calories: nutrition.calories,
      prepTime: prepTime,
      cookTime: cookTime,
      difficulty: difficulty,
      rating: '4.5',
      macros: nutrition.macros,
      micros: nutrition.micros,
      ingredients: ingredients,
      instructions: instructions.map((text, idx) => ({
        id: idx + 1,
        text: typeof text === 'string' ? text : (text && text.text) || String(text),
      })),
      allergens: this.detectAllergens(ingredients),
      dietTypes: this.determineDietTypes(ingredients, dietaryPreferences),
      servings: this.calculateServings(calorieTarget, nutrition.calories),
      isAIGenerated: true,
      personalizedFor: {
        healthGoal: this.formatHealthGoal(healthGoal),
        bmiCategory: bmiCategory,
        dietaryPreferences: dietaryPreferences,
      }
    };
  }

  /**
   * Filter ingredients based on dietary preferences and allergens
   */
  filterIngredients(ingredients, dietaryPreferences, allergens) {
    return ingredients.filter(ing => {
      const ingLower = ing.toLowerCase();
      
      // Remove allergens
      for (const allergen of allergens) {
        if (ingLower.includes(allergen.toLowerCase())) {
          return false;
        }
      }
      
      // Apply dietary preferences
      if (dietaryPreferences.includes('vegetarian') || dietaryPreferences.includes('vegan')) {
        const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'meat', 'bacon'];
        if (meatKeywords.some(keyword => ingLower.includes(keyword))) {
          return false;
        }
      }
      
      if (dietaryPreferences.includes('vegan')) {
        const dairyKeywords = ['milk', 'cheese', 'butter', 'cream', 'yogurt'];
        if (dairyKeywords.some(keyword => ingLower.includes(keyword))) {
          // Replace with vegan alternatives
          if (ingLower.includes('milk')) return ing.replace(/milk/gi, 'almond milk');
          if (ingLower.includes('cheese')) return ing.replace(/cheese/gi, 'vegan cheese');
          if (ingLower.includes('butter')) return ing.replace(/butter/gi, 'vegan butter');
          if (ingLower.includes('cream')) return ing.replace(/cream/gi, 'coconut cream');
        }
      }
      
      return true;
    });
  }

  /**
   * Parse AI-generated text into structured recipe format
   */
  parseAIResponse(aiText, userProfile, searchQuery) {
    const { dietaryPreferences = [], healthGoal, allergens = [], bmi, bmiCategory } = userProfile;
    const calorieTarget = this.calculateCalorieTarget(bmi, bmiCategory, healthGoal);
    
    // Extract recipe name
    const nameMatch = aiText.match(/Recipe[:\s]+(.+?)(?:\n|Ingredients|$)/i) || 
                     aiText.match(/^(.+?)\s+Recipe/i) ||
                     [null, searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)];
    const recipeName = nameMatch[1]?.trim() || `${searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)} Recipe`;
    
    // Extract ingredients
    const ingredientsSection = aiText.match(/Ingredients?[:\s]+(.*?)(?:\n\n|Instructions|Method|Steps|$)/is);
    let ingredients = [];
    if (ingredientsSection) {
      const ingredientsText = ingredientsSection[1];
      ingredients = ingredientsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^[-•*]\s*$/))
        .map(line => line.replace(/^[-•*]\s*/, ''))
        .slice(0, 15);
    }
    
    // If no ingredients found, generate based on search query
    if (ingredients.length === 0) {
      ingredients = this.generateIngredientsForQuery(searchQuery, dietaryPreferences, allergens);
    }
    
    // Extract instructions
    const instructionsSection = aiText.match(/(?:Instructions?|Method|Steps?)[:\s]+(.*?)$/is);
    let instructions = [];
    if (instructionsSection) {
      const instructionsText = instructionsSection[1];
      instructions = instructionsText
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line && line.length > 10)
        .map((line, idx) => ({
          id: idx + 1,
          text: line.replace(/^\d+[.)]\s*/, '').trim(),
        }))
        .slice(0, 15);
    }
    
    // If no instructions found, generate based on search query
    if (instructions.length === 0) {
      instructions = this.generateInstructionsForQuery(searchQuery, dietaryPreferences);
    }
    
    // Calculate nutrition
    const nutrition = this.estimateNutrition(ingredients, calorieTarget);
    
    // Determine difficulty and time
    const difficulty = instructions.length < 5 ? 'Easy' : instructions.length < 10 ? 'Medium' : 'Hard';
    const prepTime = Math.max(10, Math.floor(instructions.length * 2));
    const cookTime = Math.max(15, Math.floor(instructions.length * 3));
    
    // Get image URL (try to find from TheMealDB or use placeholder)
    const imageUrl = this.getRecipeImage(searchQuery);
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.personalizeRecipeName(recipeName, userProfile),
      image: imageUrl,
      calories: nutrition.calories,
      prepTime: prepTime,
      cookTime: cookTime,
      difficulty: difficulty,
      rating: '4.5',
      macros: nutrition.macros,
      micros: nutrition.micros,
      ingredients: ingredients,
      instructions: instructions,
      allergens: this.detectAllergens(ingredients),
      dietTypes: this.determineDietTypes(ingredients, dietaryPreferences),
      servings: this.calculateServings(calorieTarget, nutrition.calories),
      isAIGenerated: true,
      personalizedFor: {
        healthGoal: this.formatHealthGoal(healthGoal),
        bmiCategory: bmiCategory,
        dietaryPreferences: dietaryPreferences,
      }
    };
  }

  /**
   * Get recipe image from TheMealDB or use placeholder
   */
  async getRecipeImage(searchQuery) {
    try {
      const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php', {
        params: { s: searchQuery },
        timeout: 3000,
      });
      
      if (response.data.meals && response.data.meals[0]?.strMealThumb) {
        return response.data.meals[0].strMealThumb;
      }
    } catch (error) {
      // Ignore errors
    }
    
    // Use a food image placeholder
    return `https://source.unsplash.com/400x300/?${encodeURIComponent(searchQuery)},food`;
  }

  /**
   * Generate ingredients based on search query
   */
  generateIngredientsForQuery(searchQuery, dietaryPreferences, allergens) {
    const queryLower = searchQuery.toLowerCase();
    const ingredients = [];
    
    // Base ingredients
    ingredients.push('2 tbsp olive oil');
    ingredients.push('1 onion, diced');
    ingredients.push('2 cloves garlic, minced');
    ingredients.push('Salt and pepper to taste');
    
    // Add main ingredient based on search
    if (queryLower.includes('egg')) {
      ingredients.push('4 large eggs');
      ingredients.push('2 tbsp butter');
      if (!dietaryPreferences.includes('vegan')) {
        ingredients.push('50g cheese, grated');
      }
    } else if (queryLower.includes('chicken')) {
      if (!dietaryPreferences.includes('vegetarian') && !dietaryPreferences.includes('vegan')) {
        ingredients.push('500g chicken breast, diced');
      }
    } else if (queryLower.includes('pasta')) {
      ingredients.push('300g pasta');
      ingredients.push('200ml cream');
      if (dietaryPreferences.includes('vegan')) {
        ingredients.push('200ml coconut cream (instead of dairy)');
      }
    } else {
      // Generic main ingredient
      ingredients.push(`500g ${searchQuery}`);
    }
    
    // Add based on dietary preferences
    if (dietaryPreferences.includes('high-protein')) {
      ingredients.push('200g protein source (chicken/tofu/tempeh)');
    }
    if (dietaryPreferences.includes('keto')) {
      ingredients.push('2 tbsp butter');
      ingredients.push('100g leafy greens');
      ingredients.push('50g nuts');
    }
    if (dietaryPreferences.includes('low-carb')) {
      ingredients.push('200g vegetables');
    }
    
    // Filter out allergens
    return ingredients.filter(ing => {
      const ingLower = ing.toLowerCase();
      return !allergens.some(allergen => ingLower.includes(allergen.toLowerCase()));
    });
  }

  /**
   * Generate instructions based on search query
   */
  generateInstructionsForQuery(searchQuery, dietaryPreferences) {
    const queryLower = searchQuery.toLowerCase();
    const instructions = [];
    
    if (queryLower.includes('egg')) {
      instructions.push('Heat butter in a non-stick pan over medium heat');
      instructions.push('Crack eggs into the pan, being careful not to break the yolks');
      instructions.push('Cook for 2-3 minutes until whites are set but yolks are still runny');
      instructions.push('Season with salt and pepper');
      instructions.push('Serve immediately with toast or vegetables');
    } else if (queryLower.includes('chicken')) {
      instructions.push('Cut chicken into bite-sized pieces');
      instructions.push('Season chicken with salt, pepper, and your favorite spices');
      instructions.push('Heat oil in a large pan over medium-high heat');
      instructions.push('Cook chicken for 6-8 minutes until golden and cooked through');
      instructions.push('Add vegetables and cook for another 3-4 minutes');
      instructions.push('Serve hot with rice or your preferred side');
    } else {
      instructions.push(`Prepare ${searchQuery} by cleaning and cutting as needed`);
      instructions.push('Heat oil in a pan over medium heat');
      instructions.push('Add onions and garlic, sauté until fragrant');
      instructions.push(`Add ${searchQuery} and cook until tender`);
      instructions.push('Season with salt, pepper, and herbs');
      instructions.push('Cook for 10-15 minutes until done');
      instructions.push('Serve hot and enjoy!');
    }
    
    return instructions.map((text, idx) => ({
      id: idx + 1,
      text: text,
    }));
  }

  /**
   * Get base recipe from TheMealDB
   */
  async getBaseRecipe(searchQuery) {
    try {
      const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php', {
        params: { s: searchQuery },
        timeout: 5000,
      });
      
      if (response.data.meals && response.data.meals.length > 0) {
        return response.data.meals[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Personalize recipe based on user profile
   */
  personalizeRecipe(baseRecipe, userProfile) {
    const { dietaryPreferences = [], healthGoal, allergens = [], bmi, bmiCategory } = userProfile;
    const calorieTarget = this.calculateCalorieTarget(bmi, bmiCategory, healthGoal);
    
    // Extract ingredients from base recipe
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = baseRecipe[`strIngredient${i}`];
      const measure = baseRecipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(`${measure || ''} ${ingredient}`.trim());
      }
    }
    
    // Filter ingredients based on dietary preferences and allergens
    let filteredIngredients = ingredients.filter(ing => {
      const ingLower = ing.toLowerCase();
      
      // Remove allergens
      for (const allergen of allergens) {
        if (ingLower.includes(allergen.toLowerCase())) {
          return false;
        }
      }
      
      // Apply dietary preferences
      if (dietaryPreferences.includes('vegetarian') || dietaryPreferences.includes('vegan')) {
        const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'meat', 'bacon'];
        if (meatKeywords.some(keyword => ingLower.includes(keyword))) {
          return false;
        }
      }
      
      if (dietaryPreferences.includes('vegan')) {
        const dairyKeywords = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg'];
        if (dairyKeywords.some(keyword => ingLower.includes(keyword))) {
          return false;
        }
      }
      
      return true;
    });
    
    // Adjust quantities for calorie target
    const adjustedIngredients = this.adjustIngredientsForCalories(
      filteredIngredients,
      calorieTarget,
      healthGoal
    );
    
    // Parse instructions
    const instructions = baseRecipe.strInstructions
      ? baseRecipe.strInstructions.split('\n').filter(step => step.trim())
      : [];
    
    // Calculate nutrition based on adjusted ingredients
    const nutrition = this.estimateNutrition(adjustedIngredients, calorieTarget);
    
    // Determine difficulty and time
    const difficulty = instructions.length < 5 ? 'Easy' : instructions.length < 10 ? 'Medium' : 'Hard';
    const prepTime = Math.max(10, Math.floor(instructions.length * 2));
    const cookTime = Math.max(15, Math.floor(instructions.length * 3));
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.personalizeRecipeName(baseRecipe.strMeal, userProfile),
      image: baseRecipe.strMealThumb || 'https://via.placeholder.com/400x300?text=Recipe',
      calories: nutrition.calories,
      prepTime: prepTime,
      cookTime: cookTime,
      difficulty: difficulty,
      rating: '4.5',
      macros: nutrition.macros,
      micros: nutrition.micros,
      ingredients: adjustedIngredients,
      instructions: instructions.map((step, idx) => ({
        id: idx + 1,
        text: step.trim(),
      })),
      allergens: this.detectAllergens(adjustedIngredients),
      dietTypes: this.determineDietTypes(adjustedIngredients, dietaryPreferences),
      servings: this.calculateServings(calorieTarget, nutrition.calories),
      isAIGenerated: true,
      personalizedFor: {
        healthGoal: this.formatHealthGoal(healthGoal),
        bmiCategory: bmiCategory,
        dietaryPreferences: dietaryPreferences,
      }
    };
  }

  /**
   * Generate recipe from scratch when no base recipe found
   */
  async generateFromScratch(userProfile, searchQuery) {
    const { dietaryPreferences = [], healthGoal, allergens = [], bmi, bmiCategory } = userProfile;
    const calorieTarget = this.calculateCalorieTarget(bmi, bmiCategory, healthGoal);
    
    // Generate basic recipe structure
    const nutrition = {
      calories: Math.round((calorieTarget.min + calorieTarget.max) / 2),
      macros: {
        protein: healthGoal === 'weight_gain' ? 30 : 25,
        carbs: dietaryPreferences.includes('keto') ? 15 : 40,
        fat: dietaryPreferences.includes('keto') ? 25 : 15,
        fiber: 5,
      },
      micros: {
        calcium: 100,
        iron: 5,
        vitaminA: 500,
        vitaminC: 30,
      }
    };
    
    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${searchQuery.charAt(0).toUpperCase() + searchQuery.slice(1)} (Personalized)`,
      image: 'https://via.placeholder.com/400x300?text=AI+Generated+Recipe',
      calories: nutrition.calories,
      prepTime: 20,
      cookTime: 30,
      difficulty: 'Medium',
      rating: '4.5',
      macros: nutrition.macros,
      micros: nutrition.micros,
      ingredients: this.generateIngredients(searchQuery, dietaryPreferences, allergens),
      instructions: this.generateInstructions(searchQuery, dietaryPreferences),
      allergens: [],
      dietTypes: dietaryPreferences.length > 0 ? dietaryPreferences : ['omnivore'],
      servings: 2,
      isAIGenerated: true,
      personalizedFor: {
        healthGoal: this.formatHealthGoal(healthGoal),
        bmiCategory: bmiCategory,
        dietaryPreferences: dietaryPreferences,
      }
    };
  }

  /**
   * Adjust ingredients for calorie target
   */
  adjustIngredientsForCalories(ingredients, calorieTarget, healthGoal) {
    // Simple adjustment: scale quantities based on calorie target
    const adjustmentFactor = healthGoal === 'weight_loss' ? 0.8 : healthGoal === 'weight_gain' ? 1.2 : 1.0;
    
    return ingredients.map(ing => {
      // Try to extract quantity and adjust
      const match = ing.match(/^(\d+(?:\.\d+)?)\s*(.*)/);
      if (match) {
        const quantity = parseFloat(match[1]);
        const rest = match[2];
        const adjustedQuantity = Math.round(quantity * adjustmentFactor * 10) / 10;
        return `${adjustedQuantity} ${rest}`;
      }
      return ing;
    });
  }

  /**
   * Estimate nutrition from ingredients
   */
  estimateNutrition(ingredients, calorieTarget) {
    // Simple estimation based on calorie target
    const targetCalories = Math.round((calorieTarget.min + calorieTarget.max) / 2);
    
    return {
      calories: targetCalories,
      macros: {
        protein: Math.round(targetCalories * 0.2 / 4), // 20% protein
        carbs: Math.round(targetCalories * 0.5 / 4), // 50% carbs
        fat: Math.round(targetCalories * 0.3 / 9), // 30% fat
        fiber: Math.round(targetCalories / 50),
      },
      micros: {
        calcium: 150,
        iron: 8,
        vitaminA: 600,
        vitaminC: 40,
      }
    };
  }

  /**
   * Personalize recipe name
   */
  personalizeRecipeName(baseName, userProfile) {
    const { healthGoal, dietaryPreferences = [] } = userProfile;
    let name = baseName;
    
    if (healthGoal === 'weight_loss') {
      name = `Light ${name}`;
    } else if (healthGoal === 'weight_gain') {
      name = `Nutritious ${name}`;
    }
    
    if (dietaryPreferences.includes('keto')) {
      name = `Keto ${name}`;
    } else if (dietaryPreferences.includes('high-protein')) {
      name = `High-Protein ${name}`;
    }
    
    return name;
  }

  /**
   * Detect allergens in ingredients
   */
  detectAllergens(ingredients) {
    const allergens = [];
    const ingredientStr = ingredients.join(' ').toLowerCase();
    
    if (ingredientStr.includes('milk') || ingredientStr.includes('cheese') || ingredientStr.includes('butter')) {
      allergens.push('dairy');
    }
    if (ingredientStr.includes('wheat') || ingredientStr.includes('flour')) {
      allergens.push('gluten');
    }
    if (ingredientStr.includes('egg')) {
      allergens.push('eggs');
    }
    if (ingredientStr.includes('peanut') || ingredientStr.includes('almond')) {
      allergens.push('nuts');
    }
    
    return allergens;
  }

  /**
   * Determine diet types
   */
  determineDietTypes(ingredients, dietaryPreferences) {
    const types = [];
    const ingredientStr = ingredients.join(' ').toLowerCase();
    
    const hasMeat = ['chicken', 'beef', 'pork', 'fish', 'meat'].some(meat => ingredientStr.includes(meat));
    const hasDairy = ['milk', 'cheese', 'butter', 'cream'].some(dairy => ingredientStr.includes(dairy));
    const hasEggs = ingredientStr.includes('egg');
    
    if (!hasMeat && !hasDairy && !hasEggs) {
      types.push('vegan');
    } else if (!hasMeat) {
      types.push('vegetarian');
    } else {
      types.push('omnivore');
    }
    
    // Add dietary preferences
    dietaryPreferences.forEach(pref => {
      if (!types.includes(pref)) {
        types.push(pref);
      }
    });
    
    return types;
  }

  /**
   * Calculate servings based on calorie target
   */
  calculateServings(calorieTarget, recipeCalories) {
    const targetCalories = (calorieTarget.min + calorieTarget.max) / 2;
    return Math.max(1, Math.round(recipeCalories / targetCalories));
  }

  /**
   * Generate ingredients for scratch recipe
   */
  generateIngredients(searchQuery, dietaryPreferences, allergens) {
    const baseIngredients = [
      '2 tbsp olive oil',
      '1 onion, diced',
      '2 cloves garlic, minced',
      'Salt and pepper to taste',
    ];
    
    // Add main ingredient
    baseIngredients.push(`500g ${searchQuery}`);
    
    // Add based on dietary preferences
    if (dietaryPreferences.includes('high-protein')) {
      baseIngredients.push('200g protein source (chicken/tofu)');
    }
    if (dietaryPreferences.includes('keto')) {
      baseIngredients.push('2 tbsp butter');
      baseIngredients.push('100g leafy greens');
    }
    
    return baseIngredients;
  }

  /**
   * Generate instructions for scratch recipe
   */
  generateInstructions(searchQuery, dietaryPreferences) {
    return [
      `Prepare ${searchQuery} by cleaning and cutting as needed`,
      'Heat oil in a pan over medium heat',
      'Add onions and garlic, sauté until fragrant',
      `Add ${searchQuery} and cook until done`,
      'Season with salt and pepper',
      'Serve hot and enjoy!',
    ];
  }

  /**
   * Get AI-generated allergen alternatives for a recipe's ingredients.
   * @param {string} recipeTitle - Recipe name
   * @param {string[]} ingredients - List of ingredient names
   * @param {string[]} [userAllergens] - Optional user allergen types for prioritization
   * @returns {Promise<{allergens: Array<{ingredient: string, allergenType: string}>, alternatives: Array<{original: string, alternative: string, allergen: string}>}|null>}
   */
  async getAllergenAlternatives(recipeTitle, ingredients, userAllergens = []) {
    const ingList = Array.isArray(ingredients) ? ingredients : [];
    if (ingList.length === 0) {
      return { allergens: [], alternatives: [] };
    }
    // Static allergen alternatives (no AI models)
    const staticMap = [
      { original: 'milk', alternative: 'Oat milk or almond milk', allergen: 'Dairy' },
      { original: 'cream', alternative: 'Coconut cream or oat cream', allergen: 'Dairy' },
      { original: 'butter', alternative: 'Vegan butter or olive oil', allergen: 'Dairy' },
      { original: 'cheese', alternative: 'Vegan cheese or nutritional yeast', allergen: 'Dairy' },
      { original: 'egg', alternative: 'Flax egg or chia egg', allergen: 'Eggs' },
      { original: 'eggs', alternative: 'Flax egg or chia egg', allergen: 'Eggs' },
      { original: 'peanut', alternative: 'Sunflower seed butter', allergen: 'Nuts' },
      { original: 'almond', alternative: 'Sunflower seeds or pumpkin seeds', allergen: 'Nuts' },
      { original: 'wheat', alternative: 'Oat flour or rice flour', allergen: 'Gluten' },
      { original: 'flour', alternative: 'Gluten-free flour blend', allergen: 'Gluten' },
      { original: 'soy sauce', alternative: 'Coconut aminos', allergen: 'Soy' },
    ];
    const alternatives = [];
    const allergenSet = new Map();
    const ingStr = ingList.join(' ').toLowerCase();
    for (const { original, alternative, allergen } of staticMap) {
      if (ingStr.includes(original)) {
        alternatives.push({ original: original.charAt(0).toUpperCase() + original.slice(1), alternative, allergen });
        if (!allergenSet.has(original)) allergenSet.set(original, allergen);
      }
    }
    const allergens = Array.from(allergenSet.entries()).map(([ingredient, allergenType]) => ({
      ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
      allergenType
    }));
    return { allergens, alternatives };
  }
}

module.exports = new AIRecipeGenerator();

