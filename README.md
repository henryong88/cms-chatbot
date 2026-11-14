# CMS website chatbot

The "Ask CMS" chat assistant for Channel Management Systems Pte Ltd (cmspl.biz).

## For the web developer

**Download the install package:** [downloads/CMS-Chatbot-v1.1.0-package.zip](downloads/CMS-Chatbot-v1.1.0-package.zip)

It contains:
- `1-WordPress/cms-chatbot.zip`: a WordPress plugin. Go to **Plugins → Add New Plugin → Upload Plugin**, then **Activate**.
- `2-Any-other-website/cms-chatbot-snippet.html`: the same chatbot as one `<script>` block, for any other platform.
- `CMS-Chatbot-Install-Guide.pdf`: step-by-step install, settings, checks and troubleshooting.

**Please do two things on the new site:**
1. Remove the old floating WhatsApp button ("Need Help? Chat with us"). The chatbot is the single chat button and already hands visitors to WhatsApp.
2. Keep the Join Our Team page at `/join-our-team/`, or tell CMS its new address.

## How it works

- **Approved answers.** The 62 approved FAQs are built in and answered instantly.
- **AI replies.** Anything else, or a job described in the visitor's own words, goes to Claude through CMS's Make scenario. Claude uses only the approved facts and never quotes prices.
- **Estimates.** These always come from the CMS rate card inside the script.
- **Leads.** These go to a Make webhook, which creates an item on the monday "Leads" board (Source: Chatbot) and emails sales.
- **Fallback.** If the AI is slow or down, the chatbot carries on with the approved answers.

## Repository layout (for CMS maintenance)

| Path | What it is |
|---|---|
| `src/` | Source: `main.js` (settings and rate card), `faq.js` (approved answers), `engine.js` (pricing), `ui.js` (widget), `style.css`, `logo.txt` |
| `build.py` | Builds `dist/cms-chatbot.js` and the snippet |
| `package.py` | Builds the developer package (plugin zip, snippet, PDF guide) and publishes `index.html`, `cms-chatbot-snippet.html` and `downloads/` |
| `package/` | WordPress plugin source and the install guide template |
| `ai/` | AI system prompt builder (`build_prompt.js`), output schema, evals |
| `test/` | `faq.js` (answer matching), `e2e.py` (widget and lead), `e2e_ai.py` (AI layer, with Make faked) |
| `pages/index.template.html` | GitHub Pages phone test page |
| `index.html` | The live test page (generated) |

© Channel Management Systems Pte Ltd. Proprietary.
