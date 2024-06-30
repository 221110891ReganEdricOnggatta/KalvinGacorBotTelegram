const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// List Menu
const menus = [
  {
    name: "Nasi Goreng",
    price: 25000,
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZnJpZWQlMjByaWNlfGVufDB8fDB8fHww",
  },
  {
    name: "Burger Spesial",
    price: 22000,
    image_url:
      "https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/M6HASPARCZHYNN4XTUYT7H6PTE.jpg&w=1440",
  },
  {
    name: "Ayam Goreng",
    price: 55000,
    image_url:
      "https://images.unsplash.com/photo-1586793783658-261cddf883ef?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZnJpZWQlMjBjaGlja2VufGVufDB8fDB8fHww",
  },
  {
    name: "Nasi Lemak",
    price: 15000,
    image_url:
      "https://media.istockphoto.com/id/1182202881/photo/malaysian-nasi-lemak.webp?b=1&s=170667a&w=0&k=20&c=QkJsjVyLLGwKZVDcyKLjAcAIHnMij0RyEBUhv6C9gU4=",
  },
  {
    name: "Nasi Ayam",
    price: 25000,
    image_url:
      "https://media.istockphoto.com/id/2153597404/photo/nasi-hainan-or-hainan-chicken-serving-on-wooden-table-with-tofu-soup-tomato-letuce-and.webp?b=1&s=170667a&w=0&k=20&c=aktq0RJMGW1PiVyWP717jmWWpLoELxrMoyifj_AxvOA=",
  },
  {
    name: "Es Teh",
    price: 5000,
    image_url:
      "https://images.unsplash.com/photo-1601390395693-364c0e22031a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aWNlJTIwdGVhfGVufDB8fDB8fHww",
  },
  {
    name: "Air Mineral",
    price: 5000,
    image_url:
      "https://media.istockphoto.com/id/1032678242/photo/water-in-plastic-bottle-on-isolated-white-background.webp?b=1&s=170667a&w=0&k=20&c=ZdbN3Pi9tQMLOo1lbUaJaK8e3vn_DMq0POoVto58Jvo=",
  },
  {
    name: "Kopi",
    price: 10000,
    image_url:
      "https://media.istockphoto.com/id/1862460349/photo/a-cup-of-latte-and-matcha-latte-on-white-table.webp?b=1&s=170667a&w=0&k=20&c=cVHpQaOglu6ku26A0mphPJsH61Y4ibFqqwpzKFNKgus=",
  },
  {
    name: "Puding Telur",
    price: 8000,
    image_url:
      "https://media.istockphoto.com/id/1437269357/photo/hard-boiled-eggs-in-a-clear-glass-eat-with-hot-tea-in-the-morning-placed-on-a-stainless-steel.webp?b=1&s=170667a&w=0&k=20&c=tBvv-h7gvC1Nzu6HT-UXEKBaG3gG0PYN696iZK0PHrY=",
  },
  {
    name: "Roti Bakar",
    price: 12000,
    image_url:
      "https://images.unsplash.com/photo-1604467707321-70d5ac45adda?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG9hc3RlZCUyMHNhbmR3aWNofGVufDB8fDB8fHww",
  },
];

// Variabel pendukung
const userOrders = {};
const userHistory = {};
const userInfo = {};
const orderCodes = {};

// Function untuk menghitung poin
function calculatePoints(price) {
  return Math.floor(price / 1000);
}

// Function untuk melihat menu
app.get("/menus", (req, res) => {
  res.json(menus);
});

// Function untuk pesan
app.post("/order", (req, res) => {
  const { userId, username, orderName, orderQuantity } = req.body;

  const menuItem = menus.find(
    (item) => item.name.toLowerCase() === orderName.toLowerCase()
  );

  if (menuItem && !isNaN(orderQuantity) && orderQuantity > 0) {
    if (!userOrders[userId]) {
      userOrders[userId] = {};
    }

    if (!userOrders[userId][orderName]) {
      userOrders[userId][orderName] = 0;
    }
    userOrders[userId][orderName] += orderQuantity;

    userInfo[userId] = username;

    res.json({
      success: true,
      message: `Pesanan Anda adalah ${
        menuItem.name
      } sebanyak ${orderQuantity} porsi. Total: Rp ${
        menuItem.price * orderQuantity
      }`,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Menu tidak ditemukan atau jumlah pesanan tidak valid.",
    });
  }
});

// Function untuk minta qrcode
app.post("/completeorder", async (req, res) => {
  const { userId } = req.body;
  const userOrder = userOrders[userId];

  if (!userOrder) {
    return res.json({
      success: false,
      message: "Tidak ada pesanan yang ditemukan.",
    });
  }

  // Generate a unique order code
  const orderCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  orderCodes[userId] = orderCode;

  // Generate a QR code
  try {
    const qrCodeData = await QRCode.toDataURL(orderCode);

    res.json({
      success: true,
      message:
        "Pesanan Anda berhasil diselesaikan. Berikut adalah kode QR untuk pembayaran.",
      qrCodeData: qrCodeData,
      orderCode: orderCode,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal menghasilkan kode QR.",
    });
  }
});

// Function untuk bayar
app.post("/payorder", (req, res) => {
  const { userId, orderCode } = req.body;

  if (orderCodes[userId] && orderCodes[userId] === orderCode) {
    const userOrder = userOrders[userId];

    if (!userHistory[userId]) {
      userHistory[userId] = [];
    }

    const totalPoints = Object.keys(userOrder).reduce((sum, orderName) => {
      const menuItem = menus.find(
        (item) => item.name.toLowerCase() === orderName.toLowerCase()
      );
      if (menuItem) {
        const orderQuantity = userOrder[orderName];
        const points = calculatePoints(menuItem.price * orderQuantity);
        userHistory[userId].push({
          name: orderName,
          quantity: orderQuantity,
          points: points,
        });
        return sum + points;
      }
      return sum;
    }, 0);

    delete userOrders[userId];
    delete orderCodes[userId];

    res.json({
      success: true,
      message: `Pembayaran berhasil. Anda telah menerima total ${totalPoints} poin.`,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Kode pembayaran tidak valid.",
    });
  }
});

// Function untuk melihat orderan sekarang
app.get("/myorder/:userId", (req, res) => {
  const { userId } = req.params;
  const userOrder = userOrders[userId];

  if (userOrder) {
    const orders = Object.keys(userOrder).map(
      (orderName) => `${orderName}: ${userOrder[orderName]} porsi`
    );
    res.json({
      success: true,
      orders: orders,
    });
  } else {
    res.json({
      success: false,
      message: "Anda belum memiliki pesanan.",
    });
  }
});

// Function untuk melihat history transaksi
app.get("/history/:userId", (req, res) => {
  const { userId } = req.params;
  const userHist = userHistory[userId];
  const userName = userInfo[userId] || "Anonymous";

  if (userHist) {
    const historySummary = userHist.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { quantity: 0, points: 0 };
      }
      acc[item.name].quantity += item.quantity;
      acc[item.name].points += item.points;
      return acc;
    }, {});

    const totalPoints = Object.values(historySummary).reduce(
      (sum, item) => sum + item.points,
      0
    );

    const historyFormatted = Object.entries(historySummary)
      .map(
        ([name, { quantity, points }]) =>
          `${name} x ${quantity} - ${points} poin`
      )
      .join("\n");

    res.json({
      success: true,
      userName: userName,
      history: historyFormatted,
      totalPoints: totalPoints,
    });
  } else {
    res.json({
      success: false,
      message: "Anda belum memiliki riwayat pesanan.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
