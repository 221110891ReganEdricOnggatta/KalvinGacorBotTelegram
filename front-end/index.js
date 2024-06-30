const TelegramBot = require("node-telegram-bot-api");
const token = "7115254526:AAE0BkLA_oMa4nCQZf_KYPMzJJMG-0dOYJc";
const bot = new TelegramBot(token, { polling: true });

const apiBaseUrl = "http://localhost:3000";

// Fucntion untuk show kata kunci khusus
function showMainMenu(chatId) {
  bot.sendMessage(chatId, "Silakan pilih salah satu opsi:", {
    reply_markup: {
      keyboard: [
        [{ text: "/menus" }],
        [{ text: "/order" }],
        [{ text: "/myorder" }],
        [{ text: "/history" }],
        [{ text: "/selesaipesan" }],
        [{ text: "/maubayar" }],
        [{ text: "/exit" }],
      ],
      resize_keyboard: true,
    },
  });
}

// connect API menu dari express
async function fetchMenu() {
  const response = await fetch(`${apiBaseUrl}/menus`);
  const menu = await response.json();
  return menu;
}

// Untuk buat menu di dalam card
async function showMenuAsCards(chatId) {
  const menu = await fetchMenu();
  menu.forEach((item) => {
    bot.sendPhoto(chatId, item.image_url, {
      caption: `${item.name} - Rp ${item.price}`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Pesan",
              callback_data: `order_${item.name}`,
            },
          ],
        ],
      },
    });
  });
}

//  /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  showMainMenu(chatId);
});

// untuk /menus
bot.onText(/\/menus/, (msg) => {
  const chatId = msg.chat.id;
  showMenuAsCards(chatId);
});

// Function untuk pesan dari card secara langsung
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("order_")) {
    const orderName = data.split("order_")[1];
    bot.sendMessage(
      chatId,
      `Anda memilih ${orderName}. Silakan kirim jumlah pesanan (contoh: 2 untuk memesan 2 porsi ${orderName}).`
    );

    bot.once("message", async (msg) => {
      const orderQuantity = parseInt(msg.text);
      if (!isNaN(orderQuantity) && orderQuantity > 0) {
        const response = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: chatId,
            username: msg.from.username || "Anonymous",
            orderName,
            orderQuantity,
          }),
        });

        const result = await response.json();
        bot.sendMessage(chatId, result.message);
      } else {
        bot.sendMessage(
          chatId,
          "Jumlah pesanan tidak valid. Silakan coba lagi."
        );
      }
    });
  }
});

// Function untuk menjelaskan cara order
bot.onText(/\/order/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Silakan kirimkan pesanan Anda dengan format seperti ini : \ncontoh: /pesan Nasi Goreng 2 untuk memesan 2 porsi Nasi Goreng."
  );
});

// Function untuk memesan menu
bot.onText(/\/pesan (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderArgs = match[1].split(" ");
  const orderName = orderArgs.slice(0, -1).join(" ");
  const orderQuantity = parseInt(orderArgs.slice(-1)[0]);

  const response = await fetch(`${apiBaseUrl}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: chatId,
      username: msg.from.username || "Anonymous",
      orderName,
      orderQuantity,
    }),
  });

  const result = await response.json();
  bot.sendMessage(chatId, result.message);
});

// Function untuk menyelesaikan pesanan dan generate qrcode
bot.onText(/\/selesaipesan/, async (msg) => {
  const chatId = msg.chat.id;

  const response = await fetch(`${apiBaseUrl}/completeorder`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: chatId }),
  });

  const result = await response.json();
  if (result.success) {
    const qrCodeDataUrl = result.qrCodeData;

    // Convert Data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Send buffer as photo
    bot.sendMessage(chatId, result.message);
    bot.sendPhoto(chatId, buffer, {
      caption: `Scan kode QR ini untuk menyelesaikan pembayaran: ${result.orderCode}`,
    });
  } else {
    bot.sendMessage(chatId, result.message);
  }
});

// Function untuk payment
bot.onText(/\/maubayar/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Silakan masukkan kode pembayaran:");

  bot.once("message", async (msg) => {
    const orderCode = msg.text.trim();

    const response = await fetch(`${apiBaseUrl}/payorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: chatId, orderCode }),
    });

    const result = await response.json();
    bot.sendMessage(chatId, result.message);
  });
});

// Function untuk melihat order saya sekarang (sebelum bayar)
bot.onText(/\/myorder/, async (msg) => {
  const chatId = msg.chat.id;

  const response = await fetch(`${apiBaseUrl}/myorder/${chatId}`);
  const result = await response.json();

  if (result.success) {
    const orders = result.orders.join("\n");
    bot.sendMessage(chatId, `Pesanan Anda saat ini:\n${orders}`);
  } else {
    bot.sendMessage(chatId, result.message);
  }
});

// Function untuk melihat history transaksi saya
bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;

  const response = await fetch(`${apiBaseUrl}/history/${chatId}`);
  const result = await response.json();

  if (result.success) {
    const userName = result.userName;
    const totalPoints = result.totalPoints;
    const history = result.history;

    bot.sendMessage(chatId, `${userName} - ${totalPoints} poin\n${history}`);
  } else {
    bot.sendMessage(chatId, result.message);
  }
});

// Function untuk keluar dari program
bot.onText(/\/exit/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Terima kasih telah menggunakan layanan kami!", {
    reply_markup: {
      remove_keyboard: true,
    },
  });
});
