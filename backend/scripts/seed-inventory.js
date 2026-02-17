const mongoose = require('mongoose');
const Inventory = require('../src/models/Inventory');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/authDB';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Comprehensive inventory data with 1000+ items
const inventoryData = [
  // Pakistani Masalas & Spices
  ...generatePakistaniMasalas(),
  // Indian Spices
  ...generateIndianSpices(),
  // International Spices
  ...generateInternationalSpices(),
  // Vegetables
  ...generateVegetables(),
  // Meat & Protein
  ...generateMeatProtein(),
  // Grains & Pulses
  ...generateGrainsPulses(),
  // Dairy Products
  ...generateDairy(),
  // Oils & Fats
  ...generateOilsFats(),
  // Herbs & Seasonings
  ...generateHerbsSeasonings(),
  // Condiments & Sauces
  ...generateCondimentsSauces(),
  // Additional items to reach 1000+
  ...generateAdditionalSpices(),
  ...generateNutsSeeds(),
  ...generateBeverages(),
  ...generateFrozenFoods(),
  ...generateCannedFoods(),
  ...generateBakeryItems(),
  ...generateSnacks(),
  ...generateFruits(),
  ...generateRiceVarieties(),
  ...generateLentilsVarieties(),
  ...generateMoreSpices(),
  ...generateMorePakistaniItems(),
  ...generateMoreInternationalItems(),
  ...generateFinalItems(),
];

function generatePakistaniMasalas() {
  const masalas = [
    'Garam Masala', 'Chana Masala', 'Biryani Masala', 'Tandoori Masala', 'Karahi Masala',
    'Haleem Masala', 'Nihari Masala', 'Korma Masala', 'Kofta Masala', 'Qeema Masala',
    'Chicken Tikka Masala', 'Fish Masala', 'Pulao Masala', 'Sabzi Masala', 'Dal Masala',
    'Rasam Masala', 'Sambar Masala', 'Chaat Masala', 'Pani Puri Masala', 'Dahi Puri Masala',
    'Gosht Masala', 'Aloo Masala', 'Bhindi Masala', 'Baingan Masala', 'Kadai Masala',
    'Dhaniya Masala', 'Jeera Masala', 'Haldi Masala', 'Lal Mirch Masala', 'Kali Mirch Masala',
    'Ajwain Masala', 'Saunf Masala', 'Elaichi Masala', 'Dalchini Masala', 'Tej Patta Masala',
    'Laung Masala', 'Javitri Masala', 'Jaiphal Masala', 'Kesar Masala', 'Zafran Masala'
  ];
  
  return masalas.map(name => ({
    name,
    category: 'Pakistani Masalas',
    subcategory: 'Spice Mixes',
    unit: 'packet',
    stock: Math.floor(Math.random() * 500) + 50,
    minStock: 20,
    maxStock: 1000,
    price: Math.floor(Math.random() * 200) + 50,
    origin: 'Pakistani',
    description: `Authentic Pakistani ${name} spice blend`
  }));
}

function generateIndianSpices() {
  const spices = [
    'Turmeric Powder', 'Red Chili Powder', 'Coriander Powder', 'Cumin Powder', 'Fennel Powder',
    'Fenugreek Powder', 'Mustard Powder', 'Asafoetida', 'Cardamom Green', 'Cardamom Black',
    'Cinnamon Sticks', 'Cloves', 'Bay Leaves', 'Star Anise', 'Mace', 'Nutmeg',
    'Black Pepper', 'White Pepper', 'Saffron', 'Kashmiri Red Chili', 'Amchur Powder',
    'Tamarind', 'Jaggery', 'Palm Sugar', 'Jaggery Powder', 'Rock Salt', 'Black Salt'
  ];
  
  return spices.map(name => ({
    name,
    category: 'Indian Spices',
    subcategory: 'Whole & Ground',
    unit: 'kg',
    stock: Math.floor(Math.random() * 300) + 20,
    minStock: 10,
    maxStock: 500,
    price: Math.floor(Math.random() * 1500) + 100,
    origin: 'Indian',
    description: `Premium quality ${name}`
  }));
}

function generateInternationalSpices() {
  const spices = [
    'Paprika', 'Cayenne Pepper', 'Oregano', 'Basil', 'Thyme', 'Rosemary', 'Sage',
    'Parsley', 'Dill', 'Tarragon', 'Marjoram', 'Cumin Seeds', 'Fennel Seeds',
    'Coriander Seeds', 'Mustard Seeds', 'Fenugreek Seeds', 'Nigella Seeds', 'Carom Seeds',
    'Poppy Seeds', 'Sesame Seeds', 'Sunflower Seeds', 'Pumpkin Seeds', 'Chia Seeds',
    'Flax Seeds', 'Sumac', 'Za\'atar', 'Ras el Hanout', 'Baharat', 'Berbere',
    'Harissa', 'Curry Powder', 'Garam Masala', 'Five Spice Powder', 'Seven Spice',
    'Chinese Five Spice', 'Japanese Seven Spice', 'Cajun Seasoning', 'Old Bay Seasoning'
  ];
  
  return spices.map(name => ({
    name,
    category: 'International Spices',
    subcategory: 'Global',
    unit: 'kg',
    stock: Math.floor(Math.random() * 200) + 15,
    minStock: 10,
    maxStock: 300,
    price: Math.floor(Math.random() * 2000) + 150,
    origin: 'Various',
    description: `International ${name}`
  }));
}

function generateVegetables() {
  const vegetables = [
    'Onion', 'Garlic', 'Ginger', 'Tomato', 'Potato', 'Carrot', 'Capsicum',
    'Cauliflower', 'Cabbage', 'Spinach', 'Fenugreek Leaves', 'Coriander Leaves',
    'Mint Leaves', 'Curry Leaves', 'Lemon', 'Lime', 'Green Chili', 'Red Chili',
    'Bell Pepper Red', 'Bell Pepper Yellow', 'Bell Pepper Green', 'Eggplant',
    'Okra', 'Bitter Gourd', 'Bottle Gourd', 'Ridge Gourd', 'Snake Gourd',
    'Pumpkin', 'Zucchini', 'Cucumber', 'Radish', 'Turnip', 'Beetroot',
    'Sweet Potato', 'Yam', 'Taro', 'Lotus Root', 'Bamboo Shoots', 'Water Chestnut',
    'Mushrooms', 'Button Mushrooms', 'Oyster Mushrooms', 'Shiitake Mushrooms', 'Portobello',
    'Broccoli', 'Asparagus', 'Artichoke', 'Brussels Sprouts', 'Kale', 'Lettuce',
    'Arugula', 'Swiss Chard', 'Collard Greens', 'Mustard Greens', 'Bok Choy', 'Napa Cabbage',
    'Celery', 'Fennel', 'Leeks', 'Shallots', 'Scallions', 'Spring Onions',
    'Green Beans', 'Wax Beans', 'Snap Peas', 'Snow Peas', 'Edamame', 'Lima Beans',
    'Corn', 'Baby Corn', 'Peas', 'Sugar Snap Peas', 'Bell Peppers Mixed', 'Chili Peppers Mixed'
  ];
  
  return vegetables.map(name => ({
    name,
    category: 'Vegetables',
    subcategory: 'Fresh',
    unit: 'kg',
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: 5,
    maxStock: 200,
    price: Math.floor(Math.random() * 300) + 50,
    origin: 'Local',
    description: `Fresh ${name}`
  }));
}

function generateMeatProtein() {
  const proteins = [
    'Chicken Breast', 'Chicken Thigh', 'Chicken Whole', 'Chicken Mince', 'Chicken Liver',
    'Beef Mince', 'Beef Steak', 'Beef Cubes', 'Beef Ribs', 'Lamb Mince', 'Lamb Chops',
    'Lamb Leg', 'Goat Meat', 'Fish Tilapia', 'Fish Salmon', 'Fish Pomfret', 'Fish Rohu',
    'Prawns', 'Shrimp', 'Crab', 'Lobster', 'Eggs', 'Quail Eggs', 'Duck Eggs',
    'Chicken Sausage', 'Beef Sausage', 'Chicken Nuggets', 'Chicken Wings'
  ];
  
  return proteins.map(name => ({
    name,
    category: 'Meat & Protein',
    subcategory: 'Fresh',
    unit: 'kg',
    stock: Math.floor(Math.random() * 50) + 5,
    minStock: 3,
    maxStock: 100,
    price: Math.floor(Math.random() * 2000) + 300,
    origin: 'Local',
    description: `Fresh ${name}`
  }));
}

function generateGrainsPulses() {
  const grains = [
    'Basmati Rice', 'Jasmine Rice', 'Brown Rice', 'White Rice', 'Wild Rice',
    'Wheat Flour', 'All Purpose Flour', 'Corn Flour', 'Rice Flour', 'Gram Flour',
    'Semolina', 'Oats', 'Barley', 'Quinoa', 'Millet', 'Buckwheat',
    'Chickpeas', 'Black Gram', 'Red Lentils', 'Yellow Lentils', 'Green Lentils',
    'Black Lentils', 'Kidney Beans', 'Black Beans', 'White Beans', 'Mung Beans',
    'Split Peas', 'Pigeon Peas', 'Fava Beans', 'Soybeans', 'Black Eyed Peas'
  ];
  
  return grains.map(name => ({
    name,
    category: 'Grains & Pulses',
    subcategory: 'Dry',
    unit: 'kg',
    stock: Math.floor(Math.random() * 200) + 20,
    minStock: 10,
    maxStock: 500,
    price: Math.floor(Math.random() * 500) + 100,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateDairy() {
  const dairy = [
    'Whole Milk', 'Skimmed Milk', 'Full Cream Milk', 'Buttermilk', 'Yogurt',
    'Greek Yogurt', 'Cream', 'Heavy Cream', 'Sour Cream', 'Butter', 'Ghee',
    'Paneer', 'Cheddar Cheese', 'Mozzarella Cheese', 'Cottage Cheese', 'Cream Cheese',
    'Mascarpone', 'Ricotta', 'Feta Cheese', 'Goat Cheese', 'Condensed Milk',
    'Evaporated Milk', 'Powdered Milk', 'Ice Cream Vanilla', 'Ice Cream Chocolate'
  ];
  
  return dairy.map(name => ({
    name,
    category: 'Dairy Products',
    subcategory: 'Fresh',
    unit: name.includes('Cheese') || name.includes('Butter') || name.includes('Ghee') ? 'kg' : 'liter',
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: 5,
    maxStock: 200,
    price: Math.floor(Math.random() * 800) + 100,
    origin: 'Local',
    description: `Fresh ${name}`
  }));
}

function generateOilsFats() {
  const oils = [
    'Cooking Oil', 'Sunflower Oil', 'Canola Oil', 'Olive Oil', 'Extra Virgin Olive Oil',
    'Coconut Oil', 'Mustard Oil', 'Sesame Oil', 'Peanut Oil', 'Corn Oil',
    'Soybean Oil', 'Palm Oil', 'Ghee', 'Clarified Butter', 'Butter', 'Margarine',
    'Shortening', 'Lard', 'Duck Fat', 'Chicken Fat'
  ];
  
  return oils.map(name => ({
    name,
    category: 'Oils & Fats',
    subcategory: 'Cooking',
    unit: 'liter',
    stock: Math.floor(Math.random() * 150) + 20,
    minStock: 10,
    maxStock: 300,
    price: Math.floor(Math.random() * 1500) + 200,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateHerbsSeasonings() {
  const herbs = [
    'Fresh Basil', 'Fresh Cilantro', 'Fresh Parsley', 'Fresh Mint', 'Fresh Dill',
    'Fresh Thyme', 'Fresh Rosemary', 'Fresh Sage', 'Fresh Oregano', 'Fresh Chives',
    'Dried Basil', 'Dried Oregano', 'Dried Thyme', 'Dried Rosemary', 'Dried Sage',
    'Bay Leaves', 'Curry Leaves', 'Kaffir Lime Leaves', 'Lemon Grass', 'Galangal',
    'Vanilla Extract', 'Vanilla Beans', 'Vanilla Essence', 'Almond Extract', 'Rose Water',
    'Orange Blossom Water', 'Pandan Extract', 'Coconut Extract'
  ];
  
  return herbs.map(name => ({
    name,
    category: 'Herbs & Seasonings',
    subcategory: name.includes('Fresh') ? 'Fresh' : 'Dried',
    unit: name.includes('Fresh') ? 'bunch' : 'packet',
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: 5,
    maxStock: 200,
    price: Math.floor(Math.random() * 500) + 50,
    origin: 'Various',
    description: `Quality ${name}`
  }));
}

function generateCondimentsSauces() {
  const condiments = [
    'Tomato Ketchup', 'Chili Sauce', 'Soy Sauce', 'Worcestershire Sauce', 'Hot Sauce',
    'BBQ Sauce', 'Mayonnaise', 'Mustard', 'Horseradish', 'Wasabi',
    'Tahini', 'Hummus', 'Pesto', 'Chimichurri', 'Salsa', 'Guacamole',
    'Pickles', 'Olives', 'Capers', 'Anchovies', 'Tuna', 'Sardines',
    'Vinegar White', 'Vinegar Apple Cider', 'Balsamic Vinegar', 'Rice Vinegar',
    'Lemon Juice', 'Lime Juice', 'Orange Juice', 'Tamarind Paste', 'Date Paste',
    'Honey', 'Maple Syrup', 'Molasses', 'Agave Syrup', 'Golden Syrup'
  ];
  
  return condiments.map(name => ({
    name,
    category: 'Condiments & Sauces',
    subcategory: 'Processed',
    unit: name.includes('Juice') ? 'liter' : 'bottle',
    stock: Math.floor(Math.random() * 200) + 20,
    minStock: 10,
    maxStock: 400,
    price: Math.floor(Math.random() * 800) + 100,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateAdditionalSpices() {
  const spices = [];
  const spiceNames = ['Whole', 'Ground', 'Powder', 'Seeds', 'Leaves', 'Sticks', 'Pods', 'Flakes', 'Granules'];
  const baseSpices = ['Cinnamon', 'Cardamom', 'Clove', 'Pepper', 'Cumin', 'Coriander', 'Turmeric', 'Chili', 'Ginger', 'Garlic', 'Onion', 'Fennel', 'Fenugreek', 'Mustard', 'Nigella', 'Carom', 'Poppy', 'Sesame', 'Star Anise', 'Bay Leaf', 'Mace', 'Nutmeg', 'Saffron', 'Asafoetida'];
  
  baseSpices.forEach(base => {
    spiceNames.forEach(type => {
      if (!(base === 'Cinnamon' && type === 'Seeds') && 
          !(base === 'Clove' && type === 'Seeds') &&
          !(base === 'Star Anise' && (type === 'Seeds' || type === 'Powder')) &&
          !(base === 'Bay Leaf' && (type === 'Seeds' || type === 'Powder' || type === 'Sticks'))) {
        spices.push(`${base} ${type}`);
      }
    });
  });
  
  // Add more specific spice variations
  const specificSpices = [
    'Kashmiri Red Chili Powder', 'Degi Mirch Powder', 'Paprika Sweet', 'Paprika Hot',
    'Smoked Paprika', 'Chipotle Powder', 'Cayenne Pepper', 'Black Pepper Whole',
    'White Pepper Whole', 'Pink Peppercorns', 'Green Peppercorns', 'Szechuan Peppercorns',
    'Tellicherry Black Pepper', 'Malabar Black Pepper', 'Kampot Black Pepper'
  ];
  
  spices.push(...specificSpices);
  
  return spices.map(name => ({
    name,
    category: 'Indian Spices',
    subcategory: 'Whole & Ground',
    unit: 'kg',
    stock: Math.floor(Math.random() * 250) + 15,
    minStock: 10,
    maxStock: 400,
    price: Math.floor(Math.random() * 1200) + 80,
    origin: 'Indian',
    description: `Premium ${name}`
  }));
}

function generateNutsSeeds() {
  const nuts = [
    'Almonds', 'Cashews', 'Walnuts', 'Pistachios', 'Hazelnuts', 'Pecans', 'Macadamia', 'Brazil Nuts',
    'Peanuts', 'Pine Nuts', 'Sunflower Seeds', 'Pumpkin Seeds', 'Chia Seeds', 'Flax Seeds',
    'Hemp Seeds', 'Sesame Seeds', 'Poppy Seeds', 'Nigella Seeds', 'Fennel Seeds', 'Carom Seeds',
    'Watermelon Seeds', 'Cantaloupe Seeds', 'Apricot Kernels', 'Almond Flour', 'Coconut Flour'
  ];
  
  return nuts.map(name => ({
    name,
    category: 'Nuts & Seeds',
    subcategory: 'Dry',
    unit: 'kg',
    stock: Math.floor(Math.random() * 150) + 10,
    minStock: 5,
    maxStock: 300,
    price: Math.floor(Math.random() * 2000) + 200,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateBeverages() {
  const beverages = [
    'Green Tea', 'Black Tea', 'White Tea', 'Oolong Tea', 'Herbal Tea', 'Chai Tea',
    'Coffee Beans', 'Ground Coffee', 'Instant Coffee', 'Espresso', 'Cappuccino',
    'Orange Juice', 'Apple Juice', 'Grape Juice', 'Cranberry Juice', 'Pomegranate Juice',
    'Coconut Water', 'Lemonade', 'Iced Tea', 'Soft Drinks', 'Energy Drinks',
    'Milk', 'Almond Milk', 'Soy Milk', 'Oat Milk', 'Coconut Milk'
  ];
  
  return beverages.map(name => ({
    name,
    category: 'Beverages',
    subcategory: 'Drinks',
    unit: name.includes('Tea') || name.includes('Coffee') ? 'packet' : 'liter',
    stock: Math.floor(Math.random() * 200) + 20,
    minStock: 10,
    maxStock: 400,
    price: Math.floor(Math.random() * 1000) + 100,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateFrozenFoods() {
  const frozen = [
    'Frozen Peas', 'Frozen Corn', 'Frozen Broccoli', 'Frozen Cauliflower', 'Frozen Spinach',
    'Frozen Mixed Vegetables', 'Frozen French Fries', 'Frozen Onion Rings', 'Frozen Chicken Nuggets',
    'Frozen Fish Fillets', 'Frozen Shrimp', 'Frozen Prawns', 'Frozen Chicken', 'Frozen Beef',
    'Frozen Lamb', 'Frozen Bread', 'Frozen Paratha', 'Frozen Roti', 'Ice Cream'
  ];
  
  return frozen.map(name => ({
    name,
    category: 'Frozen Foods',
    subcategory: 'Frozen',
    unit: 'pack',
    stock: Math.floor(Math.random() * 100) + 10,
    minStock: 5,
    maxStock: 200,
    price: Math.floor(Math.random() * 1500) + 150,
    origin: 'Various',
    description: `Frozen ${name}`
  }));
}

function generateCannedFoods() {
  const canned = [
    'Canned Tomatoes', 'Canned Beans', 'Canned Corn', 'Canned Peas', 'Canned Mushrooms',
    'Canned Tuna', 'Canned Salmon', 'Canned Sardines', 'Canned Chicken', 'Canned Beef',
    'Canned Soup', 'Canned Vegetables', 'Canned Fruits', 'Canned Coconut Milk', 'Canned Evaporated Milk'
  ];
  
  return canned.map(name => ({
    name,
    category: 'Canned Foods',
    subcategory: 'Preserved',
    unit: 'can',
    stock: Math.floor(Math.random() * 300) + 30,
    minStock: 15,
    maxStock: 500,
    price: Math.floor(Math.random() * 500) + 50,
    origin: 'Various',
    description: `Canned ${name}`
  }));
}

function generateBakeryItems() {
  const bakery = [
    'White Bread', 'Brown Bread', 'Whole Wheat Bread', 'Multigrain Bread', 'Sourdough Bread',
    'Naan', 'Roti', 'Paratha', 'Chapati', 'Tortilla', 'Pita Bread', 'Bagels',
    'Croissants', 'Muffins', 'Donuts', 'Cookies', 'Biscuits', 'Crackers',
    'Cake Mix', 'Bread Flour', 'Cake Flour', 'Pastry Flour', 'Yeast', 'Baking Powder',
    'Baking Soda', 'Vanilla Extract', 'Cocoa Powder', 'Chocolate Chips'
  ];
  
  return bakery.map(name => ({
    name,
    category: 'Bakery Items',
    subcategory: 'Baked Goods',
    unit: name.includes('Flour') || name.includes('Powder') || name.includes('Yeast') ? 'kg' : 'pack',
    stock: Math.floor(Math.random() * 150) + 15,
    minStock: 10,
    maxStock: 300,
    price: Math.floor(Math.random() * 800) + 50,
    origin: 'Local',
    description: `Fresh ${name}`
  }));
}

function generateSnacks() {
  const snacks = [
    'Potato Chips', 'Corn Chips', 'Tortilla Chips', 'Pretzels', 'Popcorn',
    'Nuts Mix', 'Trail Mix', 'Granola Bars', 'Energy Bars', 'Protein Bars',
    'Cookies', 'Biscuits', 'Crackers', 'Rice Cakes', 'Crackers',
    'Dried Fruits', 'Raisins', 'Dates', 'Apricots', 'Prunes', 'Figs'
  ];
  
  return snacks.map(name => ({
    name,
    category: 'Snacks',
    subcategory: 'Packaged',
    unit: 'pack',
    stock: Math.floor(Math.random() * 200) + 20,
    minStock: 10,
    maxStock: 400,
    price: Math.floor(Math.random() * 600) + 50,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateFruits() {
  const fruits = [
    'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Strawberry', 'Blueberry', 'Raspberry',
    'Blackberry', 'Cherry', 'Peach', 'Pear', 'Plum', 'Apricot', 'Kiwi', 'Pineapple',
    'Watermelon', 'Cantaloupe', 'Honeydew', 'Papaya', 'Guava', 'Pomegranate', 'Dragon Fruit',
    'Lychee', 'Rambutan', 'Longan', 'Jackfruit', 'Durian', 'Star Fruit', 'Passion Fruit',
    'Coconut', 'Avocado', 'Lemon', 'Lime', 'Grapefruit', 'Tangerine', 'Clementine', 'Mandarin'
  ];
  
  return fruits.map(name => ({
    name,
    category: 'Fruits',
    subcategory: 'Fresh',
    unit: 'kg',
    stock: Math.floor(Math.random() * 80) + 10,
    minStock: 5,
    maxStock: 150,
    price: Math.floor(Math.random() * 500) + 100,
    origin: 'Various',
    description: `Fresh ${name}`
  }));
}

function generateRiceVarieties() {
  const rice = [
    'Basmati Rice Premium', 'Basmati Rice Super', 'Basmati Rice Extra Long', 'Jasmine Rice',
    'Brown Basmati Rice', 'Red Rice', 'Black Rice', 'Wild Rice', 'Arborio Rice', 'Sushi Rice',
    'Sticky Rice', 'Short Grain Rice', 'Medium Grain Rice', 'Long Grain Rice', 'Parboiled Rice',
    'White Rice', 'Brown Rice', 'Red Rice', 'Black Rice', 'Forbidden Rice', 'Japonica Rice',
    'Indica Rice', 'Glutinous Rice', 'Bomba Rice', 'Carnaroli Rice', 'Valencia Rice'
  ];
  
  return rice.map(name => ({
    name,
    category: 'Grains & Pulses',
    subcategory: 'Rice',
    unit: 'kg',
    stock: Math.floor(Math.random() * 300) + 30,
    minStock: 15,
    maxStock: 600,
    price: Math.floor(Math.random() * 800) + 150,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateLentilsVarieties() {
  const lentils = [
    'Red Lentils Whole', 'Red Lentils Split', 'Yellow Lentils Whole', 'Yellow Lentils Split',
    'Green Lentils Whole', 'Green Lentils Split', 'Brown Lentils', 'Black Lentils', 'French Lentils',
    'Puy Lentils', 'Beluga Lentils', 'Masoor Dal', 'Toor Dal', 'Moong Dal', 'Chana Dal',
    'Urad Dal', 'Arhar Dal', 'Moth Dal', 'Matki Dal', 'Kulthi Dal', 'Rajma', 'Chole',
    'White Beans', 'Black Beans', 'Kidney Beans Red', 'Kidney Beans White', 'Lima Beans',
    'Navy Beans', 'Pinto Beans', 'Cannellini Beans', 'Fava Beans', 'Black Eyed Peas'
  ];
  
  return lentils.map(name => ({
    name,
    category: 'Grains & Pulses',
    subcategory: 'Lentils & Beans',
    unit: 'kg',
    stock: Math.floor(Math.random() * 250) + 25,
    minStock: 10,
    maxStock: 500,
    price: Math.floor(Math.random() * 600) + 80,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateMoreSpices() {
  const moreSpices = [
    // Regional spice blends
    'Baharat', 'Ras el Hanout', 'Za\'atar', 'Dukkah', 'Berbere', 'Harissa', 'Shawarma Spice',
    'Taco Seasoning', 'Fajita Seasoning', 'Cajun Seasoning', 'Old Bay Seasoning', 'Jerk Seasoning',
    'Chinese Five Spice', 'Japanese Seven Spice', 'Korean Gochujang', 'Thai Curry Paste Red',
    'Thai Curry Paste Green', 'Thai Curry Paste Yellow', 'Massaman Curry Paste', 'Panang Curry Paste',
    // More individual spices
    'Sumac', 'Aleppo Pepper', 'Urfa Biber', 'Marash Pepper', 'Piment d\'Esplette',
    'Grains of Paradise', 'Cubeb Pepper', 'Long Pepper', 'Tasmanian Pepper', 'Timut Pepper',
    'Sichuan Peppercorns', 'Pink Peppercorns', 'Green Peppercorns', 'White Peppercorns',
    // Specialty salts
    'Himalayan Pink Salt', 'Sea Salt', 'Kosher Salt', 'Fleur de Sel', 'Smoked Salt',
    'Black Salt', 'Red Salt', 'Hawaiian Salt', 'Celtic Salt', 'Flaky Sea Salt',
    // Specialty items
    'Truffle Oil', 'Truffle Salt', 'Vanilla Beans Madagascar', 'Vanilla Beans Tahitian',
    'Vanilla Beans Mexican', 'Saffron Spanish', 'Saffron Iranian', 'Saffron Kashmiri'
  ];
  
  return moreSpices.map(name => ({
    name,
    category: name.includes('Salt') ? 'Condiments & Sauces' : name.includes('Curry') || name.includes('Seasoning') ? 'International Spices' : 'International Spices',
    subcategory: 'Specialty',
    unit: name.includes('Oil') ? 'bottle' : name.includes('Salt') ? 'kg' : 'packet',
    stock: Math.floor(Math.random() * 150) + 10,
    minStock: 5,
    maxStock: 300,
    price: Math.floor(Math.random() * 3000) + 200,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateMorePakistaniItems() {
  const items = [];
  // More Pakistani masala variations
  const masalaTypes = ['Premium', 'Extra', 'Special', 'Deluxe', 'Classic', 'Traditional'];
  const baseMasalas = ['Garam', 'Biryani', 'Tandoori', 'Karahi', 'Haleem', 'Nihari'];
  
  baseMasalas.forEach(base => {
    masalaTypes.forEach(type => {
      items.push(`${type} ${base} Masala`);
    });
  });
  
  // More regional items
  const regional = [
    'Pakistani Basmati Rice', 'Pakistani Red Rice', 'Pakistani Brown Rice',
    'Pakistani Ghee', 'Pakistani Butter', 'Pakistani Yogurt', 'Pakistani Paneer',
    'Pakistani Pickles Mixed', 'Pakistani Achar', 'Pakistani Chutney', 'Pakistani Raita'
  ];
  
  items.push(...regional);
  
  return items.map(name => ({
    name,
    category: name.includes('Masala') ? 'Pakistani Masalas' : name.includes('Rice') ? 'Grains & Pulses' : name.includes('Ghee') || name.includes('Butter') || name.includes('Yogurt') || name.includes('Paneer') ? 'Dairy Products' : 'Condiments & Sauces',
    subcategory: 'Pakistani',
    unit: name.includes('Rice') ? 'kg' : name.includes('Ghee') || name.includes('Butter') ? 'kg' : name.includes('Yogurt') || name.includes('Paneer') ? 'kg' : name.includes('Masala') ? 'packet' : 'bottle',
    stock: Math.floor(Math.random() * 200) + 20,
    minStock: 10,
    maxStock: 400,
    price: Math.floor(Math.random() * 1000) + 100,
    origin: 'Pakistani',
    description: `Authentic Pakistani ${name}`
  }));
}

function generateMoreInternationalItems() {
  const items = [];
  
  // More international spices by country
  const countries = ['Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese', 'Indonesian', 'Malaysian', 'Filipino', 'Middle Eastern', 'Mediterranean', 'Mexican', 'Italian', 'French', 'Spanish', 'Moroccan', 'Ethiopian', 'Turkish', 'Lebanese'];
  const spiceTypes = ['Spice Blend', 'Seasoning', 'Curry Powder', 'Spice Mix'];
  
  countries.forEach(country => {
    spiceTypes.forEach(type => {
      items.push(`${country} ${type}`);
    });
  });
  
  // More specialty items
  const specialty = [
    'Miso Paste', 'Gochujang', 'Doenjang', 'Kimchi', 'Fish Sauce', 'Oyster Sauce',
    'Hoisin Sauce', 'Teriyaki Sauce', 'Ponzu Sauce', 'Sriracha', 'Sambal Oelek',
    'Coconut Cream', 'Coconut Milk', 'Palm Sugar', 'Palm Syrup', 'Rice Paper',
    'Rice Noodles', 'Udon Noodles', 'Soba Noodles', 'Ramen Noodles', 'Vermicelli'
  ];
  
  items.push(...specialty);
  
  return items.map(name => ({
    name,
    category: name.includes('Sauce') || name.includes('Paste') || name.includes('Kimchi') ? 'Condiments & Sauces' : name.includes('Noodles') || name.includes('Paper') ? 'Grains & Pulses' : name.includes('Sugar') || name.includes('Syrup') ? 'Condiments & Sauces' : 'International Spices',
    subcategory: 'International',
    unit: name.includes('Noodles') || name.includes('Paper') ? 'pack' : name.includes('Sauce') || name.includes('Paste') || name.includes('Kimchi') ? 'bottle' : name.includes('Sugar') || name.includes('Syrup') ? 'kg' : 'packet',
    stock: Math.floor(Math.random() * 180) + 15,
    minStock: 8,
    maxStock: 350,
    price: Math.floor(Math.random() * 1200) + 150,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

function generateFinalItems() {
  // Final items to cross 1000
  const final = [
    'Sugar White', 'Sugar Brown', 'Sugar Powdered', 'Sugar Raw', 'Sugar Demerara',
    'Salt Table', 'Salt Iodized', 'Salt Rock', 'Salt Coarse', 'Salt Fine',
    'Baking Soda', 'Baking Powder', 'Cream of Tartar', 'Yeast Active Dry', 'Yeast Instant',
    'Cornstarch', 'Arrowroot Powder', 'Tapioca Starch', 'Potato Starch', 'Wheat Starch',
    'Gelatin', 'Agar Agar', 'Pectin', 'Xanthan Gum', 'Guar Gum',
    'Food Coloring Red', 'Food Coloring Blue', 'Food Coloring Green', 'Food Coloring Yellow',
    'Vanilla Essence', 'Almond Essence', 'Rose Essence', 'Orange Essence', 'Lemon Essence',
    'Coconut Essence', 'Pineapple Essence', 'Strawberry Essence', 'Chocolate Essence'
  ];
  
  return final.map(name => ({
    name,
    category: name.includes('Sugar') || name.includes('Salt') ? 'Condiments & Sauces' : name.includes('Baking') || name.includes('Yeast') || name.includes('Starch') || name.includes('Gum') || name.includes('Gelatin') || name.includes('Agar') || name.includes('Pectin') ? 'Bakery Items' : 'Condiments & Sauces',
    subcategory: 'Essentials',
    unit: name.includes('Essence') || name.includes('Coloring') ? 'bottle' : 'kg',
    stock: Math.floor(Math.random() * 250) + 25,
    minStock: 15,
    maxStock: 500,
    price: Math.floor(Math.random() * 500) + 50,
    origin: 'Various',
    description: `Premium ${name}`
  }));
}

async function seedInventory() {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing inventory...');
    await Inventory.deleteMany({});
    console.log('✅ Inventory cleared\n');

    console.log(`📦 Seeding ${inventoryData.length} inventory items...`);
    await Inventory.insertMany(inventoryData);
    console.log('✅ Inventory seeded successfully!\n');

    const categories = await Inventory.distinct('category');
    console.log(`📊 Categories created: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat}`);
    });

    const totalItems = await Inventory.countDocuments();
    console.log(`\n✅ Total items in inventory: ${totalItems}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
    process.exit(1);
  }
}

seedInventory();

