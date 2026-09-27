# Nexura Technologies WhatsApp Bot

This bot uses Baileys with multi-file authentication and an Express health endpoint. It does not launch a browser or print QR codes.

## 1. Local setup

Install Node.js 20 or newer, set `WHATSAPP_PHONE_NUMBER` to the WhatsApp number in international format using digits only, then run:

```bash
npm install
npm start
```

On the first run, copy the 8-character pairing code from the console. On the phone, open WhatsApp Business and choose **Settings > Linked devices > Link a device > Link with phone number instead**, then enter the code. Keep the process running until `WhatsApp connected` appears. Credentials are stored as multiple files in `auth_info_baileys/`, which is intentionally ignored by Git. Treat the pairing code and auth directory as secrets.

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

Never commit `auth_info_baileys/`, phone numbers, pairing codes, or credentials.

## 4. Cloud deployment

Baileys connects over WhatsApp's multi-device WebSocket protocol and does not require Chromium. A cloud service needs a long-running Node.js process and persistent storage for the multi-file auth directory if the session should survive redeploys.

### Render

1. Create a **Web Service** from the GitHub repository, or create the service from the included `render.yaml` Blueprint.
2. The Blueprint uses the lightweight Node.js `Dockerfile` and configures the service's `/health` check. The Express server binds to `0.0.0.0` and Render's `PORT`.
3. Set `WHATSAPP_PHONE_NUMBER` to the WhatsApp number in international format using digits only (country code plus number, without `+`). On first startup, retrieve the 8-character pairing code from the service logs and enter it on the phone under **Linked devices > Link a device > Link with phone number instead**. Keep the code private.
4. Attach persistent storage at `/app/auth_info_baileys` if the plan supports it. Without persistent storage, a restart or redeploy can require pairing again.

Baileys uses substantially less memory than running WhatsApp Web in Chromium, but no free hosting plan guarantees continuous availability. Verify current plan limits before relying on it in production.

Existing `whatsapp-web.js` LocalAuth sessions cannot be reused by Baileys; pair the Baileys client once to create its own auth state.

Render free services are not a guaranteed 24/7 option and may sleep or have resource limits. Verify the current plan rules before relying on it for production.

### Railway

1. Create a Railway project from the GitHub repository.
2. Set the start command to `npm start` if Railway does not detect it automatically.
3. Set `BAILEYS_AUTH_DIR` to `/app/auth_info_baileys` (use the service's actual working directory if different) and set `WHATSAPP_PHONE_NUMBER` for first-time pairing.
4. Deploy, open logs, and enter the pairing code in WhatsApp Business.
5. Attach a persistent volume mounted at `/app/auth_info_baileys`. Without a volume, redeploys can require pairing again.

Railway currently uses usage-based billing/credits rather than promising an unlimited free, always-on worker. Check its current pricing and set a spending limit before deployment.

## 5. Operational and account safety

- Baileys is an unofficial WhatsApp Web client library. WhatsApp can change its protocol or restrict accounts using automation. Use a dedicated business number, obtain customer consent, keep replies low-volume, and follow WhatsApp's terms and messaging rules.
- The randomized 1.5-2.5 second delay is not a guarantee against spam detection.
- Free hosting is not a guarantee of continuous availability. For dependable production uptime, use an always-on paid worker or WhatsApp's official Business Platform/API.
- Treat `auth_info_baileys/` as a credential: anyone who obtains it may control the linked WhatsApp session.