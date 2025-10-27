import express from "express";
import cors from "cors";
import PayHero from "payhero-wrapper";

const app = express();
app.use(express.json());

// ✅ Allow only your frontends
const allowedOrigins = [
  "https://swiftpaystack.onrender.com",
  "https://swiftduty.onrender.com",
  "https://test-0hcn.onrender.com" // your test frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// ✅ PayHero Config
const PayHeroConfig = {
  Authorization: process.env.PAYHERO_AUTH_TOKEN,
};

const payhero = new PayHero(PayHeroConfig);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ PayHero backend is running");
});

// ✅ STK Push route
app.post("/pay", async (req, res) => {
  try {
    const { phone_number, amount } = req.body;

    if (!phone_number || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone number and amount are required",
      });
    }

    // Hardcoded backend URL & Channel ID
    const paymentDetails = {
      amount,
      phone_number,
      channel_id: 2942,
      provider: "m-pesa",
      external_reference: `INV-${Date.now()}`,
      callback_url: "https://backend-p166.onrender.com/callback",
    };

    const response = await payhero.makeStkPush(paymentDetails);
    res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error("STK Push Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send STK Push",
      error: error.message,
    });
  }
});

// ✅ Pesapal callback (optional)
app.post("/callback", (req, res) => {
  console.log("Callback received:", req.body);
  res.status(200).json({ success: true });
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
