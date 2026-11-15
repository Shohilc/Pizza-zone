import { MenuItem } from '../models/MenuItem.js';
import { StoreSetting } from '../models/StoreSetting.js';
import { Order } from '../models/Order.js';

/**
 * Validates cart items against the database and calculates all prices server-side.
 * Never trusts client-submitted prices or totals.
 *
 * @param {Array} rawItems - Array of { menuItemId, quantity, selectedCustomizations }
 * @param {string} orderType - 'DELIVERY' | 'TAKEAWAY'
 * @returns {Promise<Object>} Calculated order financial breakdown and populated items
 */
export async function calculateOrderBreakdown(rawItems, orderType) {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Order items list cannot be empty');
  }

  // Fetch store settings for delivery fee and min order rules
  let storeSetting = await StoreSetting.findOne();
  if (!storeSetting) {
    storeSetting = await StoreSetting.create({});
  }

  if (!storeSetting.isOpen) {
    throw new Error(storeSetting.closedNotice || 'Store is currently closed and not accepting new orders');
  }

  // Fetch all menu items referenced in the order in a single query
  const itemIds = rawItems.map((i) => i.menuItemId);
  const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });
  const itemMap = new Map(dbMenuItems.map((item) => [item._id.toString(), item]));

  const calculatedItems = [];
  let subtotal = 0;

  for (const clientItem of rawItems) {
    const dbItem = itemMap.get(clientItem.menuItemId);

    if (!dbItem) {
      throw new Error(`Menu item not found (ID: ${clientItem.menuItemId})`);
    }

    if (!dbItem.isAvailable) {
      throw new Error(`Item "${dbItem.name}" is currently sold out / out of stock`);
    }

    const quantity = Math.max(1, parseInt(clientItem.quantity, 10) || 1);
    let basePrice = Number(dbItem.price) || 0;
    let customizationTotalPerUnit = 0;
    const validatedCustomizations = [];

    // Validate and recalculate selected customizations against DB options
    if (clientItem.selectedCustomizations && Array.isArray(clientItem.selectedCustomizations)) {
      for (const clientCust of clientItem.selectedCustomizations) {
        // Find group in dbItem
        const dbGroup = dbItem.customizations?.find(
          (g) => g.groupName.toLowerCase() === clientCust.groupName?.toLowerCase()
        );

        if (dbGroup) {
          const dbOption = dbGroup.options.find(
            (opt) => opt.name.toLowerCase() === clientCust.name?.toLowerCase()
          );

          if (dbOption) {
            const optPrice = Math.max(0, Number(dbOption.price) || 0);
            customizationTotalPerUnit += optPrice;
            validatedCustomizations.push({
              groupName: dbGroup.groupName,
              name: dbOption.name,
              price: optPrice,
            });
          }
        }
      }
    }

    const unitPrice = basePrice + customizationTotalPerUnit;
    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;

    calculatedItems.push({
      menuItemId: dbItem._id,
      name: dbItem.name,
      image: dbItem.image,
      unitPrice,
      quantity,
      selectedCustomizations: validatedCustomizations,
      itemTotal,
    });
  }

  // Check store minimum order requirement
  if (storeSetting.minOrderAmount && subtotal < storeSetting.minOrderAmount) {
    throw new Error(
      `Minimum order subtotal is ₹${storeSetting.minOrderAmount}. Current subtotal is ₹${subtotal}. Please add more items.`
    );
  }

  // Determine delivery fee strictly based on order type
  let deliveryFee = 0;
  if (orderType === 'DELIVERY') {
    deliveryFee = Math.max(0, Number(storeSetting.deliveryFee) || 0);
  }

  const totalAmount = subtotal + deliveryFee;

  // Generate unique order number
  const orderNumber = await generateOrderNumber();

  return {
    calculatedItems,
    subtotal,
    deliveryFee,
    totalAmount,
    orderNumber,
    storeSetting,
  };
}

/**
 * Generates human readable short order number, e.g. SNK-1042
 */
async function generateOrderNumber() {
  const count = await Order.countDocuments();
  const nextNum = 1000 + count + 1;
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `SNK-${nextNum}-${randomSuffix}`;
}

