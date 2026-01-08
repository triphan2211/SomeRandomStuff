const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors()); // Cho phép App của bạn gọi vào

const PORT = process.env.PORT || 3000;

// API đổi Token (App sẽ gọi cái này)
app.post('/api/exchange-token', async (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Thiếu mã code' });

  try {
    console.log('Đang đổi code lấy token...');
    // Server thay mặt App gọi sang Strava, kèm theo Secret bí mật
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    console.log('Thành công!');
    res.json(response.data);
  } catch (error) {
    console.error('Lỗi Strava:', error.response?.data || error.message);
    res.status(500).json({ error: 'Không đổi được token' });
  }
});

app.get('/', (req, res) => res.send('Strava Proxy Server is Live! 🚀'));

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));