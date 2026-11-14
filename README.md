# CMS website chatbot

The "Ask CMS" chat assistant for Channel Management Systems Pte Ltd (cmspl.biz).

- **index.html**: test page with the chatbot running live. It is not linked from the website.
- **cms-chatbot-snippet.html**: the install file. It is one self-contained `<script>` block.

## Installing on the website (for the web developer)

1. Open `cms-chatbot-snippet.html` and copy everything in it.
2. Paste it once into a site-wide footer slot. On WordPress, use WPCode → Footer, or Elementor → Custom Code → `</body>` end. It must load on every page.
3. Nothing else is needed. There are no libraries, no build step and no server. It runs inside a Shadow DOM, so the theme's CSS can't break it.
4. **Remove the old floating WhatsApp button ("Need Help? Chat with us").** CMS has decided the chatbot is the single chat entry point in the bottom-right corner. It already hands visitors to WhatsApp and points job seekers to the Join Our Team page.
5. If the Join Our Team page moves to a new address on the new site, update `careersUrl` in the SETTINGS block at the top of the script.

## How it works

- **Approved answers.** The 62 FAQs approved by CMS are built in and answered instantly.
- **AI replies.** Anything else, or a job described in the visitor's own words, goes to Claude through a Make scenario. Claude replies only from the approved facts. It never states prices, and it hands over to WhatsApp or email when unsure.
- **Estimates.** These always come from the CMS rate card built into the script, never from the AI.
- **Fallback.** If the AI is slow or unavailable, the chatbot carries on with the approved FAQ.
- **Leads.** These go to a Make webhook, which creates an item on the monday "Leads" board and emails the sales team.

Settings such as the WhatsApp number, emails, webhooks and corner are at the top of the script, under `SETTINGS`.

Owner: Henry Ong, Channel Management Systems Pte Ltd.
