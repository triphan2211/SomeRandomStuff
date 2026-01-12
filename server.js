const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit'); // 👈 Import thư viện chống spam
require('dotenv').config();

const app = express();

// Cấu hình Trust Proxy (Bắt buộc khi chạy trên Render/Vercel/Heroku để Rate Limit hoạt động đúng)
app.set('trust proxy', 1);

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// 🛡️ CẤU HÌNH RATE LIMIT (CHỐNG SPAM)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests mỗi IP trong vòng 15 phút
  standardHeaders: true, 
  legacyHeaders: false,
  message: { error: "⛔ Bạn gửi quá nhiều request! Vui lòng thử lại sau 15 phút." }
});

// Áp dụng chống spam cho tất cả các đường dẫn bắt đầu bằng /api/
app.use('/api/', apiLimiter);

// ================= ROUTES =================

// 1. API Đổi Token (Login lần đầu)
app.post('/api/exchange-token', async (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Thiếu mã code' });

  try {
    console.log('🔄 Đang đổi Authorization Code lấy Token...');
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    console.log('✅ Đổi Token thành công!');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Lỗi Exchange:', error.response?.data || error.message);
    res.status(500).json({ error: 'Lỗi khi đổi token với Strava', details: error.response?.data });
  }
});

// 2. API Gia hạn Token (Refresh Token - CÁI MỚI THÊM VÀO) 🆕
app.post('/api/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) return res.status(400).json({ error: 'Thiếu refresh_token' });

  try {
    console.log('🔄 Đang gia hạn (Refresh) Token...');
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token', // 👈 Quan trọng: Báo Strava là tao muốn gia hạn
      refresh_token: refresh_token
    });

    console.log('✅ Gia hạn thành công!');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Lỗi Refresh:', error.response?.data || error.message);
    // Trả về JSON lỗi rõ ràng để App React Native không bị crash
    res.status(500).json({ error: 'Lỗi khi gia hạn token', details: error.response?.data });
  }
});

// Route kiểm tra Server sống hay chết
app.get('/', (req, res) => res.send('🚀 Strava Proxy Server is Running with Rate Limit!'));

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
