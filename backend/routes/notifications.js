const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const path = require('path');
const { getFileData, saveFileData } = require('../supabaseDb');

const NOTIFICATIONS_FILE = 'notifications.json';

// Helper function to read notifications
async function getNotifications() {
    try {
        const data = await getFileData(NOTIFICATIONS_FILE, '{"notifications":[]}');
        return JSON.parse(data).notifications;
    } catch (error) {
        return [];
    }
}

// Helper function to save notifications
async function saveNotifications(notifications) {
    await saveFileData(NOTIFICATIONS_FILE, JSON.stringify({ notifications }, null, 2));
}

// PUT /api/notifications/user/:userId/read-all - Mark all unread notifications as read for a user
router.put('/user/:userId/read-all', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await getNotifications();
        
        let changed = false;
        const updatedNotifs = notifications.map(n => {
            if (n.userId === userId && !n.isRead) {
                changed = true;
                return { ...n, isRead: true };
            }
            return n;
        });

        if (changed) {
            await saveNotifications(updatedNotifs);
        }

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/notifications/:userId - Get unread notifications for a user
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await getNotifications();
        
        // Filter by userId and unread status (as per user request "disparaître après avoir lu")
        const userNotifs = notifications.filter(n => n.userId === userId && !n.isRead);
        
        res.json({
            success: true,
            notifications: userNotifs.sort((a, b) => new Date(b.date) - new Date(a.date))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/notifications/:id/read - Mark a notification as read (which makes it "disappear")
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const notifications = await getNotifications();
        const index = notifications.findIndex(n => n.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notifications[index].isRead = true;
        await saveNotifications(notifications);

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/notifications/:id - Permanently delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        let notifications = await getNotifications();
        notifications = notifications.filter(n => n.id !== id);
        await saveNotifications(notifications);

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
