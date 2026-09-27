const path = require('node:path');
const express = require('express');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const WEBSITE_URL = 'https://nexurtechpal-byte.github.io/Nexura-/';
const GITHUB_URL = 'https://github.com/NexoraSolutions-tech26';
const EMAIL = 'nexoratech.solutions@outlook.com';
const AUTH_DIRECTORY = path.resolve(
  process.env.BAILEYS_AUTH_DIR || path.join(__dirname, 'auth_info_baileys'),
);
const PHONE_NUMBER = (process.env.WHATSAPP_PHONE_NUMBER || '').replace(/\D/g, '');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/health', (_request, response) => {
  response.status(200).send('ok');
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Health server listening on 0.0.0.0:${port}`);
});

let activeSocket;
let reconnectTimer;
let reconnectAttempts = 0;
let shuttingDown = false;

function randomReplyDelay() {
  const minimum = Number(process.env.REPLY_DELAY_MIN_MS || 300);
  const maximum = Number(process.env.REPLY_DELAY_MAX_MS || 800);
  return minimum + Math.floor(Math.random() * Math.max(1, maximum - minimum + 1));
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeMessage(text) {
  return text.toLowerCase().trim();
}

function getReply(messageText) {
  const text = normalizeMessage(messageText);
  const containsProjectDetails =
    /\S+@\S+\.\S+/.test(text) &&
    /(صفحة|موقع|متجر|بيع|مشروع|تطبيق|ميزانية|غير محدد|\$|€|£)/i.test(text);

  if (/(hello|hi|hey|مرحبا|مرحباً|اهلا|أهلا|السلام عليكم|سلام)/i.test(text)) {
    return [
      'مرحبًا بك في Nexura Technologies!',
      'أهلًا وسهلًا. اكتب:',
      '- خدمات لمعرفة خدماتنا',
      '- سعر لطلب عرض سعر',
      '- روابط لمعرفة روابطنا الرسمية',
      '',
      'Welcome to Nexura Technologies! Type services, quote, or links.',
    ].join('\n');
  }

  if (/^(help|مساعدة|مساعده|خيارات|menu|القائمة)$/i.test(text)) {
    return [
      'كيف يمكنني مساعدتك؟',
      '1. خدمات - خدمات Nexura',
      '2. سعر - طلب عرض سعر',
      '3. مكالمة - التواصل مع الفريق',
      '4. روابط - الموقع وGitHub والبريد',
      '5. دعم - المساعدة والدعم',
      '',
      'Type help at any time to see this menu again.',
    ].join('\n');
  }

  if (/(من أنتم|من انتم|عن الشركة|شو بتقدموا|ماذا تقدمون|استفسر|استفسار|معلومات عن الشركة|معلومات أكثر|معلومات اكثر|about|company)/i.test(text)) {
    return [
      'Nexura Technologies شركة برمجيات تساعد الشركات على بناء حلول رقمية عملية.',
      'نقدم تطوير الويب Full-Stack، أتمتة سير العمل، واختبار الجودة QA.',
      `تعرف علينا أكثر: ${WEBSITE_URL}`,
    ].join('\n');
  }

  if (/(مين القائمين|مين القايمين|من القائمين|من يدير|الفريق|المؤسسين|المؤسسون|team|founders|management|owners)/i.test(text)) {
    return [
      'Nexura Technologies يديرها فريق متخصص في تطوير البرمجيات والحلول الرقمية.',
      'للحصول على معلومات الفريق أو ترتيب تواصل مباشر، أرسل سؤالك وتفاصيلك عبر البريد:',
      EMAIL,
      '',
      `Website: ${WEBSITE_URL}`,
    ].join('\n');
  }

  if (/(وين موقعكم|اين موقعكم|أين موقعكم|رابط الموقع|موقع الشركة|^الموقع$|^website$\vert{}^site$)/i.test(text)) {
    return `هذا هو موقع Nexura Technologies:\n${WEBSITE_URL}`;
  }

  if (/(services?|خدمات|web development|automation|qa)/i.test(text)) {
    return [
      'Nexura Technologies services / خدمات Nexura Technologies:',
      '- Full-Stack Web Development',
      '- Workflow Automation',
      '- QA Testing',
      '',
      `Website: ${WEBSITE_URL}`,
    ].join('\n');
  }

  if (containsProjectDetails) {
    return [
      'شكرًا لك، وصلتنا تفاصيل مشروعك وميزانيتك.',
      `- البريد: ${text.match(/\S+@\S+\.\S+/)?.[0] || 'غير مذكور'}`,
      '',
      'سيتم التواصل معك قريبًا من فريق Nexura Technologies لترتيب اجتماع ومناقشة تفاصيل المشروع.',
      `للاستفسارات: ${EMAIL}`,
      '',
      'Thank you. Our team will contact you soon to arrange a meeting and discuss your project.',
    ].join('\n');
  }

  if (/(quote|price|cost|سعر|عرض|تسعيرة|ميزانية)/i.test(text)) {
    return [
      'يسعدنا إعداد عرض سعر مناسب لمشروعك.',
      'يرجى تزويدنا بالتفاصيل التالية:',
      '1. نوع المشروع وفكرته',
      '2. المزايا والصفحات المطلوبة',
      '3. الموعد المتوقع للتسليم',
      '4. الميزانية التقريبية',
      '5. الاسم والبريد الإلكتروني أو رقم التواصل',
      '',
      'بعد استلاستلام التفاصيل، سيتواصل معك فريقنا لترتيب اجتماع ومناقشة المشروع.',
    ].join('\n');
  }

  if (/(اجتماع|إجتماع|موعد|حجز|مقابلة|meeting|appointment|schedule)/i.test(text)) {
    return [
      'يسعدنا ترتيب اجتماع معك لمناقشة مشروعك.',
      'أرسل من فضلك:',
      '1. اسمك واسم الشركة',
      '2. فكرة المشروع أو المشكلة التي تريد حلها',
      '3. الوقت والتاريخ المناسبان للاجتماع',
      '4. طريقة التواصل المفضلة',
      '',
      `Email: ${EMAIL}`,
    ].join('\n');
  }

  if (/(call|phone|مكالمة|مكالمه|اتصل|اتصال|مكالمة هاتفية)/i.test(text)) {
    return [
      'يسعدنا التواصل معك!',
      'يرجى تزويدنا بالبيانات التالية لترتيب المكالمة:',
      '1. الاسم واسم الشركة',
      '2. نبذة قصيرة عن المشروع',
      '3. رقم الهاتف أو البريد الإلكتروني',
      '4. الوقت المناسب للتواصل',
      '',
      'بعد استلام البيانات، سيتواصل معك فريق Nexura Technologies لترتيب اجتماع.',
      `للتواصل عبر البريد: ${EMAIL}`,
      '',
      'Please send your name, project details, contact information, and preferred call time. Our team will contact you to arrange a meeting.',
    ].join('\n');
  }

  if (/(support|مساعدة تقنية|دعم|مشكلة|خطأ|عطل|bug|لا يعمل|ما بيشتغل)/i.test(text)) {
    return [
      'نأسف لوجود مشكلة. أرسل وصف المشكلة بالتفصيل، صورة الخطأ إن وجدت، وطريقة التواصل المناسبة.',
      `للدعم المباشر: ${EMAIL}`,
      '',
      'For support, email us with the issue details and any error screenshot.',
    ].join('\n');
  }

  if (/(شكرا|شكرًا|thanks|thank you|ممتاز|رائع)/i.test(text)) {
    return 'على الرحب والسعة! يسعدنا مساعدتك في Nexura Technologies.';
  }

  if (/(باي|وداعا|وداعًا|مع السلامة|goodbye|bye)/i.test(text)) {
    return 'مع السلامة! نحن هنا عندما تحتاج إلى Nexura Technologies.';
  }

  if (/(ساعات العمل|متى تردون|مفتوح|متاح|working hours|available)/i.test(text)) {
    return [
      'يمكنك إرسال رسالتك في أي وقت، وسيراجعها فريق Nexura ويرد عليك بأقرب وقت ممكن.',
      `للتواصل عبر البريد: ${EMAIL}`,
    ].join('\n');
  }

  if (/(links?|contact|روابط|تواصل|اتصال|github|email|بريد)/i.test(text)) {
    return [
      'Official links / الروابط الرسمية:',
      `Website: ${WEBSITE_URL}`,
      `GitHub: ${GITHUB_URL}`,
      `Email: ${EMAIL}`,
    ].join('\n');
  }

  return [
    'لم أفهم طلبك بالكامل، لكن يمكنني مساعدتك بهذه الخيارات:',
    '- خدمات لمعرفة خدمات Nexura',
    '- سعر لطلب عرض سعر',
    '- مكالمة للتواصل مع الفريق',
    '- روابط لمعرفة روابطنا الرسمية',
    '',
    'Please type services, quote, call, or links.',
  ].join('\n');
}

function scheduleReconnect(reason) {
  if (shuttingDown || reconnectTimer) return;

  const waitMs = Math.min(1000 * (2 ** reconnectAttempts), 30000);
  reconnectAttempts += 1;
  console.warn(`WhatsApp reconnect scheduled in ${waitMs}ms: ${reason}`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = undefined;
    try {
      await startWhatsApp();
    } catch (error) {
      console.error('WhatsApp reconnect failed:', error);
      scheduleReconnect(error.message);
    }
  }, waitMs);
}

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIRECTORY);

  if (!state.creds.registered && !PHONE_NUMBER) {
    throw new Error('Set WHATSAPP_PHONE_NUMBER before first-time pairing.');
  }

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });
  activeSocket = socket;

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      reconnectAttempts = 0;
      console.log('WhatsApp connected; Nexura bot is ready.');
      return;
    }

    if (connection !== 'close') return;

    if (activeSocket !== socket) return;
    activeSocket = undefined;
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    if (statusCode === DisconnectReason.loggedOut) {
      console.error('WhatsApp logged out. Clear the auth state and pair again.');
      return;
    }

    scheduleReconnect(lastDisconnect?.error?.message || 'connection closed');
  });

  socket.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      const remoteJid = message.key.remoteJid;
      const messageContent = message.message;
      if (!remoteJid || remoteJid === 'status@broadcast' || message.key.fromMe || !messageContent) {
        continue;
      }

      const body = messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        messageContent.videoMessage?.caption;
      if (!body) continue;

      try {
        await delay(randomReplyDelay());
        await socket.sendMessage(remoteJid, { text: getReply(body) }, { quoted: message });
      } catch (error) {
        console.error('Failed to send WhatsApp reply:', error);
      }
    }
  });

  if (!socket.authState.creds.registered) {
    await delay(5000);

    if (shuttingDown || activeSocket !== socket || socket.authState.creds.registered) return;

    try {
      const pairingCode = await socket.requestPairingCode(PHONE_NUMBER);
      console.log('\n========== WHATSAPP PAIRING CODE ==========');
      console.log(pairingCode);
      console.log('Enter this code in WhatsApp > Linked devices.');
      console.log('===========================================\n');
    } catch (error) {
      console.error('Pairing-code request failed; reconnecting:', error);
      if (activeSocket === socket) {
        activeSocket = undefined;
        socket.end(error);
        scheduleReconnect(error.message);
      }
    }
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down.`);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  activeSocket?.end(undefined);
  server.close(() => process.exit(0));
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

startWhatsApp().catch((error) => {
  console.error('Failed to start WhatsApp bot:', error);
  server.close(() => process.exit(1));
});