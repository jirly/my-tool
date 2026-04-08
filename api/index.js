const crypto = require('crypto');

// 简单的内存存储（生产环境应使用数据库）
const orders = new Map();
const members = new Map();

module.exports = async (req, res) => {
    // 启用 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST' && req.url === '/api/create-order') {
        const { paymentMethod, amount } = req.body;
        const orderId = 'ORD' + Date.now() + crypto.randomBytes(4).toString('hex');

        const order = {
            orderId,
            paymentMethod,
            amount: amount || 99,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };

        orders.set(orderId, order);

        return res.status(200).json({
            success: true,
            orderId,
            qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('支付订单：' + orderId)}`,
            order
        });
    }

    if (req.method === 'GET' && req.url.startsWith('/api/query-order/')) {
        const orderId = req.url.split('/').pop();
        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: '订单不存在' });
        }

        // 检查是否过期
        if (order.status === 'pending' && new Date(order.expiresAt) < new Date()) {
            order.status = 'expired';
            orders.set(orderId, order);
        }

        return res.status(200).json({ success: true, order });
    }

    if (req.method === 'POST' && req.url.startsWith('/api/simulate-payment/')) {
        const orderId = req.url.split('/').pop();
        const order = orders.get(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: '订单不存在' });
        }

        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        orders.set(orderId, order);

        const memberId = 'MEM' + Date.now();
        const member = {
            id: memberId,
            orderId,
            paymentMethod: order.paymentMethod,
            amount: order.amount,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        members.set(memberId, member);

        return res.status(200).json({
            success: true,
            message: '支付成功',
            member
        });
    }

    if (req.method === 'GET' && req.url === '/api/admin/members') {
        return res.status(200).json({
            success: true,
            members: Array.from(members.values()),
            orders: Array.from(orders.values())
        });
    }

    return res.status(404).json({ success: false, message: 'Not Found' });
};
