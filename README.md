# Nexura Technologies WhatsApp Bot

This bot uses `whatsapp-web.js`, `LocalAuth`, Puppeteer, and `qrcode-terminal`.

## 1. Local setup

Install Node.js 20 or newer, then run:

```bash
npm install
npm start
```

The first run prints a QR code. On the phone, open WhatsApp Business, go to **Settings > Linked devices > Link a device**, unlock the phone, and scan the terminal QR code. Keep the process running until `WhatsApp client is ready` appears. The login is stored in `.wwebjs_auth`, which is intentionally ignored by Git.

Test from another WhatsApp account with `hello`, `مرحبا`, `help`, `مساعدة`, `services`, `خدمات`, `الموقع`, `quote`, `سعر`, `عرض سعر`, `اجتماع`, `مكالمة`, `الفريق`, `support`, `دعم`, `links`, `روابط`, `شكرا`, or `باي`.

## 2. Automatic replies

All response rules are in the `getReply()` function in `index.js`. The bot currently handles greetings, a help menu, company information, services, website requests, quote requests, meetings, calls, team questions, support issues, official links, thanks, goodbyes, and availability questions. Unknown messages receive a menu instead of being ignored.

This is keyword-based automation, not a self-learning AI model. It does not store conversations or learn from customer messages. A real AI assistant would require an AI service/API, additional privacy controls, and usually an ongoing cost.

## 3. GitHub

Create a private GitHub repository, then from this directory run:

```bash
git init
git add index.js package.json .gitignore README.md
git commit -m "Add Nexura WhatsApp bot"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Never commit `.wwebjs_auth`, `.wwebjs_cache`, QR images, phone numbers, or credentials.

## 4. Cloud deployment

`whatsapp-web.js` drives WhatsApp Web in Chromium. A cloud service therefore needs a long-running worker, enough memory for Chromium, and persistent storage for the `LocalAuth` directory.

### Render

1. Create a **Background Worker** from the GitHub repository.
2. The included `render.yaml` uses `npm ci` and `npm start`, and sets Node.js 20 plus the `LocalAuth` data path.
3. Use a Node 20 runtime. Render may use its default Node version; an `engines` entry is included in `package.json`.
4. Deploy and open the worker logs. Scan the printed QR code once from WhatsApp Business.
5. Add a persistent disk mounted at `/opt/render/project/src/.wwebjs_auth` if the plan supports it. Without persistent storage, a restart or redeploy requires scanning a new QR code.

Render free services are not a guaranteed 24/7 option and may sleep or have resource limits. Verify the current plan rules before relying on it for production.

### Railway

1. Create a Railway project from the GitHub repository.
2. Set the start command to `npm start` if Railway does not detect it automatically.
3. Set `WWEBJS_DATA_PATH` to `/app/.wwebjs_auth` (use the service's actual working directory if different).
4. Deploy, open logs, and scan the printed QR code.
5. Attach a persistent volume mounted at `/app/.wwebjs_auth`. Without a volume, redeploys can require QR re-authentication.

Railway currently uses usage-based billing/credits rather than promising an unlimited free, always-on worker. Check its current pricing and set a spending limit before deployment.

### Chromium notes

The `puppeteer` dependency downloads a compatible Chromium during `npm install`. The script already supplies the common Linux flags for restricted containers. If the provider supplies Chromium instead, set `PUPPETEER_EXECUTABLE_PATH` to its executable path. If Chromium fails to start, inspect the provider logs for missing system libraries or memory exhaustion; use a worker/container runtime rather than a serverless function.

## 5. Operational and account safety

- `whatsapp-web.js` is an unofficial WhatsApp Web automation library. WhatsApp can change its Web protocol or restrict an account using automation. Use a dedicated business number, obtain customer consent, keep replies low-volume, and follow WhatsApp's terms and messaging rules.
- The randomized 1.5-2.5 second delay is not a guarantee against spam detection.
- Free hosting is not a guarantee of continuous availability. For dependable production uptime, use an always-on paid worker or WhatsApp's official Business Platform/API.
- Treat the auth directory as a credential: anyone who obtains it may control the linked WhatsApp session.