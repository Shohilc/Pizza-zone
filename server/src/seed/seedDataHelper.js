import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { StoreSetting } from '../models/StoreSetting.js';
import { User } from '../models/User.js';

export const categoriesData = [
  {
    name: 'Pizzas',
    slug: 'pizza',
    icon: 'Pizza',
    description: 'Freshly baked thin-crust and pan pizzas with rich mozzarella',
    displayOrder: 1,
  },
  {
    name: 'Rolls & Wraps',
    slug: 'rolls',
    icon: 'Wrap',
    description: 'Crispy flaky paratha rolls loaded with fresh fillings and chutneys',
    displayOrder: 2,
  },
  {
    name: 'Burgers & Sliders',
    slug: 'burgers',
    icon: 'Burger',
    description: 'Toasted brioche buns with juicy patties, melted cheese and crunch',
    displayOrder: 3,
  },
  {
    name: 'Sandwiches',
    slug: 'sandwiches',
    icon: 'Sandwich',
    description: 'Grilled artisan breads stuffed with gourmet veggies and sauces',
    displayOrder: 4,
  },
  {
    name: 'Fries & Sides',
    slug: 'fries',
    icon: 'Fries',
    description: 'Golden crispy potato treats, peri-peri shakes, and loaded sides',
    displayOrder: 5,
  },
  {
    name: 'Beverages & Shakes',
    slug: 'beverages',
    icon: 'Drink',
    description: 'Thick creamy shakes, iced coolers, and fresh fizzy refreshers',
    displayOrder: 6,
  },
];

export async function seedInternal() {
  const existingCount = await MenuItem.countDocuments();
  if (existingCount > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Seeding menu categories and snack items...');
  await Category.deleteMany({});
  await MenuItem.deleteMany({});
  await StoreSetting.deleteMany({});

  const createdCategories = await Category.insertMany(categoriesData);
  const catMap = {};
  createdCategories.forEach((c) => {
    catMap[c.slug] = c._id;
  });

  const menuItemsData = [
    // Pizzas
    {
      name: 'Classic Margherita Supreme',
      category: catMap['pizza'],
      price: 199,
      description: 'San Marzano tomato sauce, fresh basil, double layer of stringy mozzarella & olive oil drizzle.',
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Bestseller',
      preparationTimeMinutes: 15,
      customizations: [
        {
          groupName: 'Crust & Cheese',
          allowMultiple: false,
          isRequired: false,
          options: [
            { name: 'Regular Pan Crust', price: 0 },
            { name: 'Cheese Burst Crust', price: 60 },
            { name: 'Thin Crust Crispy', price: 20 },
          ],
        },
        {
          groupName: 'Add-ons',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Mozzarella Cheese', price: 40 },
            { name: 'Jalapeño & Olives', price: 30 },
          ],
        },
      ],
    },
    {
      name: 'Spicy Paneer Tikka Pizza',
      category: catMap['pizza'],
      price: 249,
      description: 'Tandoori marinated paneer cubes, red onions, crisp capsicum, spicy tikka masala sauce.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: "Chef's Special",
      preparationTimeMinutes: 18,
      customizations: [
        {
          groupName: 'Cheese Options',
          allowMultiple: false,
          isRequired: false,
          options: [
            { name: 'Normal Cheese', price: 0 },
            { name: 'Double Cheese Burst', price: 65 },
          ],
        },
      ],
    },
    {
      name: 'Fiery Jalapeño & Sweet Corn Pizza',
      category: catMap['pizza'],
      price: 219,
      description: 'Golden sweet corn, spicy Mexican jalapeños, red paprika flakes, and zesty herb sauce.',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Popular',
      preparationTimeMinutes: 15,
      customizations: [
        {
          groupName: 'Add-ons',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Cheese', price: 40 },
            { name: 'Spicy Garlic Dip', price: 25 },
          ],
        },
      ],
    },

    // Rolls & Wraps
    {
      name: 'Kolkata Paneer Kathi Roll',
      category: catMap['rolls'],
      price: 139,
      description: 'Crispy flaky paratha layered with spicy grilled cottage cheese, onions, mint curd chutney & chaat masala.',
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Bestseller',
      preparationTimeMinutes: 10,
      customizations: [
        {
          groupName: 'Roll Extras',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Cheese Slice', price: 25 },
            { name: 'Double Paneer Filling', price: 45 },
            { name: 'Spicy Chutney Blast', price: 10 },
          ],
        },
      ],
    },
    {
      name: 'Crispy Corn & Cheese Wrap',
      category: catMap['rolls'],
      price: 129,
      description: 'Golden sweet corn and melted cheddar wrapped in a warm toasted tortilla with chipotle sauce.',
      image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Staff Pick',
      preparationTimeMinutes: 10,
      customizations: [
        {
          groupName: 'Sauce Choice',
          allowMultiple: false,
          isRequired: false,
          options: [
            { name: 'Creamy Chipotle', price: 0 },
            { name: 'Smoky Barbeque', price: 15 },
            { name: 'Garlic Mayo', price: 15 },
          ],
        },
      ],
    },

    // Burgers & Sliders
    {
      name: 'Crispy Herb Potato Burger',
      category: catMap['burgers'],
      price: 109,
      description: 'Golden crunchy potato & peas patty with crunchy lettuce, ripe tomato slice, and our secret burger spread.',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Must Try',
      preparationTimeMinutes: 12,
      customizations: [
        {
          groupName: 'Cheese & Patty',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Melted Cheddar Slice', price: 25 },
            { name: 'Extra Crunchy Patty', price: 40 },
          ],
        },
      ],
    },
    {
      name: 'Tandoori Paneer Smash Burger',
      category: catMap['burgers'],
      price: 159,
      description: 'Thick marinated tandoori paneer steak seared on high flame, pickled onions, and spicy mayo on a toasted brioche.',
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Bestseller',
      preparationTimeMinutes: 15,
      customizations: [
        {
          groupName: 'Burger Toppings',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Cheese Slice', price: 25 },
            { name: 'Grilled Jalapeños', price: 20 },
          ],
        },
      ],
    },

    // Sandwiches
    {
      name: 'Bombay Masala Grilled Sandwich',
      category: catMap['sandwiches'],
      price: 119,
      description: 'Triple-decker sandwich with spiced potato mash, beetroot, cucumber, tomatoes, house green chutney & melted cheese.',
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Bestseller',
      preparationTimeMinutes: 12,
      customizations: [
        {
          groupName: 'Bread & Butter',
          allowMultiple: false,
          isRequired: false,
          options: [
            { name: 'White Bread (Buttery Toasted)', price: 0 },
            { name: 'Multigrain Brown Bread', price: 15 },
          ],
        },
        {
          groupName: 'Extras',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Cheese Burst', price: 30 },
            { name: 'Sev Sprinkle on Top', price: 10 },
          ],
        },
      ],
    },
    {
      name: 'Cheese Corn & Jalapeño Grill',
      category: catMap['sandwiches'],
      price: 139,
      description: 'Loads of mozzarella, sharp cheddar, tender corn kernels, spicy jalapeños, and Italian herbs grilled golden brown.',
      image: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Crowd Favorite',
      preparationTimeMinutes: 10,
      customizations: [
        {
          groupName: 'Extras',
          allowMultiple: true,
          isRequired: false,
          options: [{ name: 'Extra Cheese', price: 30 }],
        },
      ],
    },

    // Fries & Sides
    {
      name: 'Peri-Peri Shaker Fries',
      category: catMap['fries'],
      price: 99,
      description: 'Skin-on golden French fries tossed in our signature hot African birds eye chili seasoning.',
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Bestseller',
      preparationTimeMinutes: 8,
      customizations: [
        {
          groupName: 'Dips',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Cheesy Garlic Mayo Dip', price: 25 },
            { name: 'Spicy Sriracha Dip', price: 25 },
            { name: 'Smoky BBQ Dip', price: 20 },
          ],
        },
      ],
    },
    {
      name: 'Loaded Cheesy Beast Fries',
      category: catMap['fries'],
      price: 149,
      description: 'Crispy fries smothered in hot liquid cheddar, diced jalapeños, salsa drizzle, and crispy fried onions.',
      image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Super Loaded',
      preparationTimeMinutes: 10,
      customizations: [
        {
          groupName: 'Add-ons',
          allowMultiple: true,
          isRequired: false,
          options: [{ name: 'Double Cheese Sauce', price: 35 }],
        },
      ],
    },

    // Beverages
    {
      name: 'Thick Belgian Chocolate Shake',
      category: catMap['beverages'],
      price: 129,
      description: 'Rich dark Belgian chocolate blended with creamy whole milk and dairy ice cream, crowned with chocolate drizzle.',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Favorite',
      preparationTimeMinutes: 5,
      customizations: [
        {
          groupName: 'Shake Extras',
          allowMultiple: true,
          isRequired: false,
          options: [
            { name: 'Extra Scoop of Vanilla Ice Cream', price: 30 },
            { name: 'Crushed Oreo Topping', price: 20 },
          ],
        },
      ],
    },
    {
      name: 'Fresh Mint Lime Cooler',
      category: catMap['beverages'],
      price: 69,
      description: 'Muddled fresh garden mint leaves, freshly squeezed key limes, and sparkling chilled soda.',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
      isVeg: true,
      badge: 'Refreshing',
      preparationTimeMinutes: 4,
      customizations: [],
    },
  ];

  await MenuItem.insertMany(menuItemsData);
  console.log(`[Seed] Seeded ${menuItemsData.length} menu items.`);

  await StoreSetting.create({
    storeName: 'SnackCraft Bites',
    storePhone: '+91 98765 43210',
    storeAddress: 'Shop 12, Food Street, Near City Park',
    isOpen: true,
    deliveryFee: 30,
    minOrderAmount: 99,
    estimatedDeliveryMinutes: 30,
    estimatedPickupMinutes: 15,
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@snackstore.local';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      firebaseUid: 'admin-seed-uid',
      email: adminEmail,
      name: 'Store Manager (Admin)',
      phone: '+91 98765 43210',
      role: 'admin',
    });
  }
  console.log('[Seed] Ready to take orders! ✨');
}

