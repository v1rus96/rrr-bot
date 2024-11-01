const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const User = require("./models/User"); // Import the User model
const connectDB = require("./config/db"); // Connect to MongoDB
const Message = require("./models/Message"); // Import the Message model
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = "@abdurahmoncrypto";
const MINI_APP_URL = "https://t.me/rrrlearning_bot/crypto";
const VIDEO_DURATION_MS = 60000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
connectDB();

// Define the admin chat ID to restrict access
const ADMIN_CHAT_ID = 140251378; // Replace with the actual admin chat ID

// Handle messages from the admin for drafting
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  // Only allow the admin to draft broadcast messages
  if (chatId !== ADMIN_CHAT_ID) {
    // bot.sendMessage(
    //   chatId,
    //   "You are not authorized to send broadcast messages."
    // );
    return;
  }

  try {
    // Delete any existing draft message
    await Message.deleteMany();

    // Save the new draft message
    const newDraft = new Message({
      text: msg.caption || msg.text || null,
      mediaId: msg.photo
        ? msg.photo[msg.photo.length - 1].file_id
        : msg.video
        ? msg.video.file_id
        : null,
      mediaType: msg.photo ? "photo" : msg.video ? "video" : null,
    });

    await newDraft.save();

    // Send draft confirmation to the admin with "Broadcast" button
    bot.sendMessage(
      chatId,
      "Message draft saved. Press 'Broadcast' to send it to all users.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Broadcast", callback_data: "broadcast_message" }],
          ],
        },
      }
    );
  } catch (error) {
    console.error("Error saving draft message:", error);
    bot.sendMessage(
      chatId,
      "An error occurred while saving the draft message. Please try again."
    );
  }
});

// Handle "Broadcast" button press to send the message to all users
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;

  if (callbackQuery.data === "broadcast_message" && chatId === ADMIN_CHAT_ID) {
    try {
      // Retrieve the draft message
      const draft = await Message.findOne();
      if (!draft) {
        bot.sendMessage(chatId, "No message draft found.");
        return;
      }

      // Retrieve all users from the User model
      const users = await User.find({});

      if (users.length === 0) {
        bot.sendMessage(chatId, "No users found to broadcast the message.");
        return;
      }

      // Send the draft message to each user
      const broadcastPromises = users.map(async (user) => {
        try {
          if (draft.mediaType === "photo") {
            await bot.sendPhoto(user.userId, draft.mediaId, {
              caption: draft.text,
            });
          } else if (draft.mediaType === "video") {
            await bot.sendVideo(user.userId, draft.mediaId, {
              caption: draft.text,
            });
          } else {
            await bot.sendMessage(user.userId, draft.text);
          }
        } catch (error) {
          console.error(
            `Failed to send message to ${user.userId}:`,
            error.message
          );
        }
      });

      await Promise.all(broadcastPromises);

      bot.sendMessage(chatId, "Broadcast message sent to all users.");
      await Message.deleteMany(); // Clear the draft after broadcasting
    } catch (error) {
      console.error("Error broadcasting message:", error);
      bot.sendMessage(
        chatId,
        "An error occurred while broadcasting the message."
      );
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Start the onboarding process and save all user information
const startOnboarding = async (chatId, userInfo) => {
  // Extract information from userInfo (msg.from object)
  const {
    id: userId,
    username,
    first_name: firstName,
    last_name: lastName,
    language_code: languageCode,
  } = userInfo;

  // Check if user already exists; if not, create a new user record
  let user = await User.findOne({ userId: userId });
  if (!user) {
    user = new User({
      userId,
      username,
      firstName,
      lastName,
      languageCode,
      onboarding: false,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await user.save();
  }

  // Start onboarding video
  bot.sendVideo(chatId, "dars.mp4", {
    caption: `
🎯 *Tabriklaymiz!* Sizni "Professional Crypto" darslarini o'rganishni boshlashdan bir necha daqiqa ajratib turibdi.

🤔 O'ylaymizki, bu darslar orqali cryptovalyutalar va blockchain haqida to'liq bilim olishingiz mumkin.

🙄 Iltimos, yuqoridagi videoni batafsil ko'rib chiqing. Darslar mohiyatini tushunmaslik, cryptoni o'rgana olmasligingizga va imkoniyatingizni boy berishingizga olib kelishi mumkin. 👆

🤑 Videoni ko'rib bo'lganingizdan so'ng, bu yerda 👇 telegram sahifasiga obuna bo'lish uchun tugma paydo bo'ladi. 

Obuna bo'lishingiz shart, chunki professional crypto darslarning bir qismi bo'lgan jonli darslar aynan shu kanalda tashkil etiladi. Obuna bo'ling va shu sahifaga qaytib, darslarni davom ettiring. 🤝
  `,
    parse_mode: "Markdown",
  });

  setTimeout(() => {
    bot.sendMessage(
      chatId,
      `🎬 Kirish darsini oxirigacha ko'rgan bo'lsangiz bosing👇`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Ko'rdim", callback_data: "video_watched" }],
          ],
        },
      }
    );
  }, VIDEO_DURATION_MS);
};

// Handle video watched confirmation
bot.on("callback_query", async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;
  const user = await User.findOne({ userId: userId });

  if (!user) {
    bot.sendMessage(
      chatId,
      "Iltimos, onboarding jarayonini boshlash uchun /start buyrug'ini bosing."
    );
    return;
  }

  if (callbackQuery.data === "video_watched") {
    bot.sendMessage(chatId, "Jonli darslar shu yerda bo'ladi", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Obuna bo'lish",
              url: `https://t.me/${CHANNEL_USERNAME.slice(1)}`,
            },
          ],
          [
            {
              text: "Obuna bo'ldim",
              callback_data: "joined_channel",
            },
          ],
        ],
      },
    });
  } else if (callbackQuery.data === "joined_channel") {
    const memberStatus = await bot.getChatMember(CHANNEL_USERNAME, userId);
    if (["member", "administrator", "creator"].includes(memberStatus.status)) {
      user.onboarding = true; // Set onboarding as completed
      await user.save();

      bot.sendMessage(
        chatId,
        `${MINI_APP_URL}`
      );
    } else {
      bot.sendMessage(chatId, "Aval kanalga obuna bo'ling.");
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Mini app access command
bot.onText(/\/miniapp/, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  const user = await User.findOne({ userId: userId });

  if (user && user.onboarding) {
    bot.sendMessage(chatId, `${MINI_APP_URL}`);
  } else {
    bot.sendMessage(
      chatId,
      "Iltimos, dastur bilan tanishishdan oldin onboarding jarayonini tugating."
    );
  }
});

// Start command to initiate onboarding
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userInfo = msg.from; // Contains all user information from Telegram

  const user = await User.findOne({ userId: userInfo.id });
  if (!user || !user.onboarding) {
    await startOnboarding(chatId, userInfo);
  } else {
    bot.sendMessage(
      chatId,
      "Siz allaqachon onboarding jarayonini tugatgansiz. Dasturni boshlash uchun /miniapp buyrug'ini bosing."
    );
  }
});
