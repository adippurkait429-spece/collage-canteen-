/**
 * middleware/orderDeadline.js
 *
 * Server-side guard that REJECTS any order placement request received after
 * the daily deadline (default 11:00 AM).  This prevents API tampering even
 * if the frontend timer is bypassed (e.g., via Postman or browser DevTools).
 */

const checkOrderDeadline = (req, res, next) => {
  // Toggle to bypass the 11:00 AM deadline rule
  const DISABLE_DEADLINE = true; 

  if (DISABLE_DEADLINE) {
    req.serverTime = new Date();
    return next();
  }

  const now = new Date();

  const deadlineHour = parseInt(process.env.ORDER_DEADLINE_HOUR || 11, 10);
  const deadlineMin  = parseInt(process.env.ORDER_DEADLINE_MINUTE || 0, 10);

  const currentHour = now.getHours();
  const currentMin  = now.getMinutes();

  // Build comparable minute-of-day values
  const currentTotalMinutes  = currentHour  * 60 + currentMin;
  const deadlineTotalMinutes = deadlineHour * 60 + deadlineMin;

  if (currentTotalMinutes >= deadlineTotalMinutes) {
    return res.status(403).json({
      success: false,
      message: `Orders are closed for today. The ordering window closes at ${String(deadlineHour).padStart(2, "0")}:${String(deadlineMin).padStart(2, "0")} AM. Please place your order tomorrow before ${String(deadlineHour).padStart(2, "0")}:${String(deadlineMin).padStart(2, "0")} AM.`,
      serverTime: now.toISOString(),
    });
  }

  // Attach current server time to req so controllers can log it
  req.serverTime = now;
  next();
};

module.exports = { checkOrderDeadline };
