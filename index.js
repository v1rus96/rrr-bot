const TelegramBot = require('node-telegram-bot-api');


const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// In-memory tracking for simplicity; use a database in production
const userSteps = {};

// Start the onboarding process
const startOnboarding = (chatId, userId) => {
  userSteps[userId] = { step: 1, videoWatched: false, joinedChannel: false };

  bot.sendVideo(chatId, 'rec.mov', {
    caption: "Watch this video to continue."
  });

  setTimeout(() => {
    bot.sendMessage(chatId, "If you've finished watching the video, click 'Continue' to proceed.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Continue", callback_data: 'video_watched' }]
        ]
      }
    });
  }, VIDEO_DURATION_MS);
};

// Handle video watched confirmation
bot.on('callback_query', async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;

  if (callbackQuery.data === 'video_watched' && userSteps[userId].step === 1) {
    userSteps[userId].videoWatched = true;
    userSteps[userId].step = 2;

    bot.sendMessage(chatId, "Great! Now, please join our channel to proceed.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Join Channel', url: `https://t.me/${CHANNEL_USERNAME.slice(1)}` }],
          [{ text: "I've joined the channel", callback_data: 'joined_channel' }]
        ]
      }
    });
  } else if (callbackQuery.data === 'joined_channel' && userSteps[userId].step === 2) {
    const memberStatus = await bot.getChatMember(CHANNEL_USERNAME, userId);
    if (['member', 'administrator', 'creator'].includes(memberStatus.status)) {
      userSteps[userId].joinedChannel = true;
      userSteps[userId].step = 3;
      bot.sendMessage(chatId, `Access granted! Here is the mini app: ${MINI_APP_URL}`);
    } else {
      bot.sendMessage(chatId, "Please join the channel first.");
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Mini app access command
bot.onText(/\/miniapp/, (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  if (userSteps[userId] && userSteps[userId].step === 3) {
    bot.sendMessage(chatId, `Here is the mini app: ${MINI_APP_URL}`);
  } else {
    bot.sendMessage(chatId, "Please complete the onboarding process before accessing the mini app.");
  }
});

// Start command to initiate onboarding
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!userSteps[userId] || userSteps[userId].step === 3) {
    startOnboarding(chatId, userId);
  } else {
    bot.sendMessage(chatId, "You're already in the onboarding process. Please follow the instructions.");
  }
});



const connectDB = require('./config/db');
const firstBot = require('./bots/firstBot');
const adminBot = require('./bots/adminBot');
const api = require('./api');

// Initialize Express server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Mount the API and start both bots
app.use('/api', api);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
