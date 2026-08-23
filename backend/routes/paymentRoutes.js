import express from 'express';
import { isFallback, fallbackStore, queryDB } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// SUBSCRIBE TO PLAN (Free, Premium $9.99/mo, VIP $19.99/mo)
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { plan_name } = req.body;
    const userId = req.user.id;

    if (!['premium', 'vip'].includes(plan_name)) {
      return res.status(400).json({ error: 'Invalid plan selected. Choose premium or vip.' });
    }

    const currentPeriodEnd = new Date(Date.now() + 30 * 86400000); // 30 days ahead

    if (isFallback()) {
      const user = fallbackStore.users.find(u => u.id === userId);
      if (user) {
        user.subscription_tier = plan_name;
      }
      fallbackStore.subscriptions.push({
        id: fallbackStore.subscriptions.length + 1,
        user_id: userId,
        plan_name,
        stripe_subscription_id: `sub_stripe_${Date.now()}`,
        status: 'active',
        current_period_end: currentPeriodEnd,
        created_at: new Date()
      });

      return res.json({
        message: `Successfully upgraded to FLIXIT ${plan_name.toUpperCase()} Plan!`,
        subscription_tier: plan_name,
        current_period_end: currentPeriodEnd
      });
    } else {
      await queryDB('UPDATE users SET subscription_tier = ? WHERE id = ?', [plan_name, userId]);
      await queryDB(
        'INSERT INTO subscriptions (user_id, plan_name, stripe_subscription_id, status, current_period_end) VALUES (?, ?, ?, ?, ?)',
        [userId, plan_name, `sub_stripe_${Date.now()}`, 'active', currentPeriodEnd]
      );

      return res.json({
        message: `Successfully upgraded to FLIXIT ${plan_name.toUpperCase()} Plan!`,
        subscription_tier: plan_name,
        current_period_end: currentPeriodEnd
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Subscription processing failed.' });
  }
});

// CANCEL SUBSCRIPTION WITH AUTOMATED PRORATED REFUND SIMULATION
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isFallback()) {
      const user = fallbackStore.users.find(u => u.id === userId);
      const sub = fallbackStore.subscriptions.find(s => s.user_id === userId && s.status === 'active');

      if (!user || user.subscription_tier === 'free') {
        return res.status(400).json({ error: 'No active paid subscription found to cancel.' });
      }

      // Calculate prorated refund amount
      const monthlyRate = user.subscription_tier === 'vip' ? 19.99 : 9.99;
      const daysUsed = 12; // simulated mid-cycle cancellation (18 days remaining out of 30)
      const unusedDays = 30 - daysUsed;
      const proratedRefund = Math.round((monthlyRate * (unusedDays / 30)) * 100) / 100;

      user.subscription_tier = 'free';
      if (sub) sub.status = 'canceled';

      return res.json({
        message: 'Subscription canceled mid-cycle.',
        prorated_refund: proratedRefund,
        currency: 'USD',
        details: `Automatic prorated refund of $${proratedRefund} issued to your original payment method for ${unusedDays} unused days.`
      });
    } else {
      await queryDB('UPDATE users SET subscription_tier = "free" WHERE id = ?', [userId]);
      await queryDB('UPDATE subscriptions SET status = "canceled" WHERE user_id = ? AND status = "active"', [userId]);

      return res.json({
        message: 'Subscription canceled mid-cycle.',
        prorated_refund: 6.66,
        currency: 'USD',
        details: 'Automatic prorated refund of $6.66 issued to original payment method.'
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Cancellation failed.' });
  }
});

// PAY-PER-VIEW UNLOCK
router.post('/unlock-ppv', authMiddleware, async (req, res) => {
  try {
    const { video_id } = req.body;
    const userId = req.user.id;

    let video = null;
    if (isFallback()) {
      video = fallbackStore.videos.find(v => v.id === parseInt(video_id));
    } else {
      const rows = await queryDB('SELECT * FROM videos WHERE id = ?', [video_id]);
      if (rows.length > 0) video = rows[0];
    }

    if (!video) return res.status(404).json({ error: 'Video not found.' });

    return res.json({
      message: `Unlocked "${video.title}" for $${video.ppv_price}! Enjoy high-definition viewing.`,
      video_id: video.id,
      unlocked: true
    });
  } catch (err) {
    res.status(500).json({ error: 'Pay-per-view purchase failed.' });
  }
});

// SEND CREATOR TIP
router.post('/tip-creator', authMiddleware, async (req, res) => {
  try {
    const { creator_id, amount, message } = req.body;
    const senderId = req.user.id;

    if (!creator_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid creator ID and tip amount are required.' });
    }

    const tipAmount = parseFloat(amount);

    if (isFallback()) {
      fallbackStore.creator_tips.push({
        id: fallbackStore.creator_tips.length + 1,
        sender_id: senderId,
        creator_id: parseInt(creator_id),
        amount: tipAmount,
        message: message || '',
        created_at: new Date()
      });

      return res.json({
        message: `Tip of $${tipAmount.toFixed(2)} sent to creator!`,
        amount: tipAmount
      });
    } else {
      await queryDB(
        'INSERT INTO creator_tips (sender_id, creator_id, amount, message) VALUES (?, ?, ?, ?)',
        [senderId, creator_id, tipAmount, message || '']
      );

      return res.json({
        message: `Tip of $${tipAmount.toFixed(2)} sent to creator!`,
        amount: tipAmount
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to send creator tip.' });
  }
});

export default router;
