const fs = require('node:fs');
const path = require('node:path');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const chromium = require('@sparticuz/chromium').default;
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/health', (_request, response) => {
  response.status(200).send('ok');
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Health server listening on 0.0.0.0:${port}`);
});

function failStartup(message, error) {
  console.error(message, error);
  server.close(() => process.exit(1));
}

async function main() {
  const configuredExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const puppeteerPath = puppeteer.executablePath();
  const executablePath = configuredExecutablePath && fs.existsSync(configuredExecutablePath)
    ? configuredExecutablePath
    : fs.existsSync(puppeteerPath)
      ? puppeteerPath
      : await chromium.executablePath();
  const authDataPath = path.resolve(
    process.env.WWEBJS_DATA_PATH || path.join(__dirname, '.wwebjs_auth'),
  );

const WEBSITE_URL = 'https://nexurtechpal-byte.github.io/Nexura-/';
const GITHUB_URL = 'https://github.com/NexoraSolutions-tech26';
const EMAIL = 'nexoratech.solutions@outlook.com';
const pairingPhoneNumber = (process.env.WHATSAPP_PHONE_NUMBER || '').replace(/\D/g, '');

const client = new Client({
  pairWithPhoneNumber: {
    phoneNumber: pairingPhoneNumber,
  },
  authStrategy: new LocalAuth({
    clientId: 'nexura-technologies',
    dataPath: authDataPath,
  }),
  puppeteer: {
    headless: true,
    executablePath,
    dumpio: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--no-first-run',
      '--no-zygote',
      '--disable-sync',
      '--disable-gpu',
      '--mute-audio',
      '--disk-cache-size=33554432',
      '--media-cache-size=1',
    ],
  },
});

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

client.once('ready', () => {
  console.log('Nexura Technologies WhatsApp bot is ready.');
});

client.on('code', (code) => {
  console.log('WhatsApp pairing code (enter it in Linked devices):', code);
});

client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp Business:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('WhatsApp authentication succeeded.');
});

client.on('auth_failure', (message) => {
  console.error('WhatsApp authentication failed:', message);
});

client.on('disconnected', (reason) => {
  console.warn('WhatsApp client disconnected:', reason);
});

client.on('message', async (message) => {
  console.log(`Incoming message from ${message.from}: ${message.body}`);

  if (message.fromMe) return;

  const reply = getReply(message.body);
  if (!reply) return;

  try {
    await delay(randomReplyDelay());
    await message.reply(reply);
  } catch (error) {
    console.error('Failed to send reply:', error);
  }
});

process.on('SIGINT', async () => {
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await client.destroy();
  process.exit(0);
});

client.initialize().catch((error) => {
  failStartup('Failed to initialize WhatsApp client:', error);
});
}

main().catch((error) => {
  failStartup('Failed to prepare Chromium:', error);
});