/**
 * Telegram Bot Notification Service
 * Sends instant alerts to the store owner whenever a new order is placed or status changes.
 *
 * NOTE: As per project rules, notification failures MUST NEVER make an order fail.
 */
export async function sendTelegramOrderAlert(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      '[Telegram Warning] Bot token or Owner Chat ID is not configured in .env. Skipping Telegram alert.'
    );
    return false;
  }

  try {
    const isDelivery = order.orderType === 'DELIVERY';
    const itemsText = order.items
      .map((item, idx) => {
        const customizations = item.selectedCustomizations?.length
          ? ` (${item.selectedCustomizations.map((c) => c.name).join(', ')})`
          : '';
        return `  ${idx + 1}. *${item.name}* x ${item.quantity}${customizations} - ₹${item.itemTotal}`;
      })
      .join('\n');

    const addressSection = isDelivery
      ? `📍 *Delivery Address:*\n${order.customer.address}${order.customer.landmark ? ` (Near: ${order.customer.landmark})` : ''}\n`
      : `🛍️ *Order Type:* Takeaway / Store Pickup\n`;

    const message = `
🔔 *NEW ORDER RECEIVED!*
━━━━━━━━━━━━━━━━━━━━
🆔 *Order #:* \`${order.orderNumber}\`
⏳ *Status:* ${order.status}
💵 *Total Amount:* *₹${order.totalAmount}* (${order.paymentMethod.replace(/_/g, ' ')})

👤 *Customer Details:*
• Name: *${order.customer.name}*
• Phone: \`${order.customer.phone}\`
${addressSection}
🍽️ *Items (${order.items.length}):*
${itemsText}

💰 *Financials:*
• Subtotal: ₹${order.subtotal}
• Delivery: ₹${order.deliveryFee}
• *Total Due: ₹${order.totalAmount}*

${order.customerNotes ? `📝 *Note from customer:* "${order.customerNotes}"\n` : ''}
⚠️ *OWNER ACTION REQUIRED:*
Call customer at \`${order.customer.phone}\` to confirm before the kitchen starts preparation!
━━━━━━━━━━━━━━━━━━━━
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn(`[Telegram Warning] Telegram API returned error:`, result.description);
      return false;
    }

    console.log(`[Telegram] Alert sent successfully for order ${order.orderNumber}`);
    return true;
  } catch (error) {
    // Crucial rule: Notification failure must NEVER make an order fail
    console.error('[Telegram Notification Error] Failed to send Telegram alert:', error.message);
    return false;
  }
}

/**
 * Send order status update alert to Telegram
 */
export async function sendTelegramStatusAlert(order, oldStatus) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || !chatId) return false;

  try {
    const cancelInfo = order.status === 'CANCELLED'
      ? `\n❌ *Reason:* ${order.cancelReason}\n${order.cancelNote ? `Note: "${order.cancelNote}"` : ''}`
      : '';

    const text = `
📢 *Order Status Updated*
━━━━━━━━━━━━━━━━━━━━
🆔 *Order:* \`${order.orderNumber}\`
👤 *Customer:* ${order.customer.name} (\`${order.customer.phone}\`)
🔄 *Status:* ${oldStatus} ➔ *${order.status}*${cancelInfo}
━━━━━━━━━━━━━━━━━━━━
    `.trim();

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    return true;
  } catch (error) {
    console.error('[Telegram Notification Error]:', error.message);
    return false;
  }
}

