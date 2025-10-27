// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import PayHero from 'payhero-wrapper';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// ============================
// ALLOW ONLY SPECIFIC ORIGINS
// ============================
const allowedOrigins = [
  'https://stktest-0hcn.onrender.com',
  'https://swiftduty.onrender.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    }
  })
);

// ============================
// PAYHERO CONFIGURATION
// ============================
const PayHeroConfig = {
  Authorization: process.env.PAYHERO_AUTH_TOKEN
};

const payHero = new PayHero(PayHeroConfig);

// ============================
// ROUTES
// ============================

// Root route
app.get('/', (req, res) => {
  res.send('✅ PayHero API Server is running');
});

// ---- STK PUSH PAYMENT ----
app.post('/stk-push', async (req, res) => {
  try {
    const paymentDetails = {
      amount: req.body.amount,
      phone_number: req.body.phone_number,
      channel_id: 2942, // ✅ hardcoded channel ID
      provider: 'm-pesa',
      external_reference: req.body.external_reference || `INV-${Date.now()}`,
      callback_url: 'https://backend-p166.onrender.com/stk-callback' // ✅ hardcoded backend URL
    };

    const response = await payHero.makeStkPush(paymentDetails);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('❌ STK Push Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- STK CALLBACK (from PayHero/M-Pesa) ----
app.post('/stk-callback', (req, res) => {
  console.log('📲 STK Callback received:', req.body);
  res.json({ success: true });
});

// ---- GET WALLET BALANCE ----
app.get('/wallet/balance', async (req, res) => {
  try {
    const balance = await payHero.serviceWalletBalance();
    res.json({ success: true, balance });
  } catch (error) {
    console.error('❌ Wallet Balance Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- TRANSACTION STATUS ----
app.get('/transaction/:id', async (req, res) => {
  try {
    const status = await payHero.transactionStatus(req.params.id);
    res.json({ success: true, status });
  } catch (error) {
    console.error('❌ Transaction Status Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 PayHero Server running on port ${PORT}`));
