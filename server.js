const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'members.json');

// 确保数据目录存在
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ members: [], orders: [] }, null, 2));
}

// 读取数据
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// 写入数据
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 生成订单号
function generateOrderId() {
    return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// API: 创建订单
app.post('/api/create-order', (req, res) => {
    const { paymentMethod, amount } = req.body;

    const orderId = generateOrderId();
    const order = {
        orderId,
        paymentMethod,
        amount: amount || 99,
        status: 'pending', // pending, paid, expired
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 分钟过期
    };

    const data = readData();
    data.orders.push(order);
    writeData(data);

    res.json({
        success: true,
        orderId,
        qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('支付订单：' + orderId)}`,
        order
    });
});

// API: 查询订单状态
app.get('/api/query-order/:orderId', (req, res) => {
    const { orderId } = req.params;
    const data = readData();
    const order = data.orders.find(o => o.orderId === orderId);

    if (!order) {
        return res.json({ success: false, message: '订单不存在' });
    }

    // 检查是否过期
    if (order.status === 'pending' && new Date(order.expiresAt) < new Date()) {
        order.status = 'expired';
        writeData(data);
    }

    res.json({ success: true, order });
});

// API: 模拟支付成功（演示用）
app.post('/api/simulate-payment/:orderId', (req, res) => {
    const { orderId } = req.params;
    const data = readData();
    const orderIndex = data.orders.findIndex(o => o.orderId === orderId);

    if (orderIndex === -1) {
        return res.json({ success: false, message: '订单不存在' });
    }

    const order = data.orders[orderIndex];
    order.status = 'paid';
    order.paidAt = new Date().toISOString();

    // 添加会员记录
    const member = {
        id: 'MEM' + Date.now(),
        orderId,
        paymentMethod: order.paymentMethod,
        amount: order.amount,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 年
        status: 'active'
    };
    data.members.push(member);
    writeData(data);

    res.json({
        success: true,
        message: '支付成功',
        member
    });
});

// API: 验证会员（通过支付标识）
app.post('/api/verify-member', (req, res) => {
    const { paymentId } = req.body; // 可以是微信 openid 或自定义标识

    const data = readData();
    const member = data.members.find(m =>
        m.paymentId === paymentId &&
        m.status === 'active' &&
        new Date(m.endDate) > new Date()
    );

    if (member) {
        res.json({ success: true, isMember: true, member });
    } else {
        res.json({ success: true, isMember: false });
    }
});

// API: 获取会员数据（管理用）
app.get('/api/admin/members', (req, res) => {
    const data = readData();
    res.json({ success: true, members: data.members, orders: data.orders });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📦 会员页面：http://localhost:${PORT}/membership.html`);
    console.log(`🏠 首页：http://localhost:${PORT}/index.html`);
    console.log(`📊 管理后台：http://localhost:${PORT}/admin.html`);
});
