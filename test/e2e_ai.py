"""Browser test of the AI layer. Make is faked with replies recorded from the live Claude scenario."""
import json, re, subprocess, sys, time, urllib.parse, pathlib, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site_ai"; SITE.mkdir(exist_ok=True)
SHOTS = ROOT / "shots"; SHOTS.mkdir(exist_ok=True)
snippet = (ROOT.parent / "dist" / "cms-chatbot-snippet.html").read_text()
(SITE / "index.html").write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI test</title>'
  '<script>window.CMS_CHAT_SETTINGS={preview:false,endpoint:"http://localhost:8766/hook",aiEndpoint:"http://localhost:8766/ai",nudgeAfter:0};</script>'
  '</head><body style="font-family:Georgia;background:#fafafa"><h1>AI test page</h1>' + snippet + '</body></html>')
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8766", "--bind", "127.0.0.1"], cwd=SITE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)

today = (datetime.datetime.now(datetime.UTC).replace(tzinfo=None) + datetime.timedelta(hours=8)).date()
tomorrow = (today + datetime.timedelta(days=1)).isoformat()
E = lambda **k: dict({"dps":"","svc":"","date":"","days":"","kind":"","temp":"","drops":"","goods":"","perDay":"","colArea":"","delArea":"","lmDrops":"","vehicle":"","withVeh":"","hireUnit":""}, **k)
# recorded live replies (Sonnet 5.5), keyed by a phrase in the visitor's last message
CANNED = [
 ("20 cartons frozen meat", {"job": E(svc="reefer", date=tomorrow, kind="adhoc", temp="frozen", drops="1", goods="20 cartons frozen meat", colArea="FW", delArea="CA"), "reply": "Thanks, I'll take you through a few quick questions so I can work out an estimate for your frozen meat job from Tuas to Changi.", "intent": "estimate", "unanswered": False}),
 ("cold room", {"job": E(), "reply": "I don't have an approved answer on cold room storage, so I'd rather not guess. Our team can help with this: WhatsApp +65 8899 6423 or email enquiry@cmspl.biz.", "intent": "handoff", "unanswered": True}),
 ("work permit", {"job": E(), "reply": "We are always looking for good drivers, but all positions are open to Singapore Citizens and PRs only, and we have no openings for foreign workers at the moment. Independent contractors are welcome to apply on our Join Our Team page.", "intent": "answer", "unanswered": False}),
 ("garble", {"job": E(), "reply": "x", "intent": "answer", "unanswered": False}),
 ("ballpark", {"job": E(), "reply": "For a 10ft reefer it is usually about $150 per trip.", "intent": "answer", "unanswered": False}),
 ("during the trip", {"job": E(), "reply": "We check the temperature at each delivery point.", "intent": "answer", "unanswered": False}),
 ("2 drivers for my own vans", {"job": E(svc="outdrive", dps="2", withVeh="no", hireUnit="month"), "reply": "Yes, our OutDrive service can supply drivers for your own vehicles. I'll take you through a few quick questions for the estimate.", "intent": "estimate", "unanswered": False}),
 ("tell me a joke", {"job": E(), "reply": "Sorry, jokes are outside what I can help with here. I'd be happy to help with a delivery job or any questions about CMS services though.", "intent": "decline", "unanswered": False}),
 ("register me", {"job": E(), "reply": "Please don't share ID numbers here. Our team can help on WhatsApp +65 8899 6423.", "intent": "handoff", "unanswered": False}),
 ("goods worth", {"job": E(), "reply": "Our cover is up to S$100 per job, so goods worth $5000 would not be fully covered. For higher-value goods, we recommend arranging your own insurance.", "intent": "answer", "unanswered": False}),
]
calls = []; mode = {"fail": False}
def on_ai(route, request):
    body = urllib.parse.parse_qs(request.post_data or "").get("conv", [""])[0]
    calls.append(body)
    if mode["fail"]:
        return route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*"}, body='{"error":true}')
    last = body.strip().split("\n")[-1].lower()
    for key, resp in CANNED:
        if key.lower() in last:
            return route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, body=json.dumps(resp))
    route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*"}, body='{"error":true}')

results = []
def check(name, cond, info=""):
    results.append((name, bool(cond))); print(("PASS " if cond else "FAIL ") + name + ("" if cond else "  " + str(info)[:300]))
def send(p, t): p.locator("#cms-chatbot #cmsbot-in").fill(t); p.locator("#cms-chatbot .send").click()
def last_bot(p): return p.locator("#cms-chatbot .msgs .msg.bot").last.inner_text()
def chip(p, text):
    loc = p.locator("#cms-chatbot .live button", has_text=re.compile("^" + re.escape(text) + "$")); loc.first.wait_for(state="visible", timeout=8000); loc.first.click()
def idle(p, ms=1300): p.wait_for_timeout(ms)

with sync_playwright() as pw:
    br = pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = br.new_context(viewport={"width": 1366, "height": 860}); p = ctx.new_page()
    errs = []; p.on("pageerror", lambda e: errs.append(str(e)))
    p.route("**/ai", on_ai); p.route("**/hook", lambda r, q: r.fulfill(status=200, body="Accepted"))
    p.goto("http://localhost:8766/index.html"); p.locator("#cms-chatbot .launch").click(); idle(p, 900)
    check("footer says AI-assisted", "AI-assisted" in p.locator("#cms-chatbot .legal").inner_text())

    # 1. confident FAQ question never calls the AI
    send(p, "What temperatures can your reefer trucks hold?"); idle(p)
    check("approved FAQ answered without AI", len(calls) == 0 and "2 to 8" in last_bot(p), (len(calls), last_bot(p)))

    # 2. a job typed in one message becomes a pre-filled estimate
    send(p, "how much to send 20 cartons frozen meat from Tuas to Changi tomorrow?"); idle(p, 1800)
    check("job message sent to AI", len(calls) == 1)
    txt = p.locator("#cms-chatbot .msgs").inner_text()
    check("AI reply shown", "frozen meat job from Tuas to Changi" in txt)
    check("estimate skips what the visitor already said: asks vehicle next", "which vehicle" in last_bot(p).lower(), last_bot(p))
    chip(p, "Let CMS decide"); idle(p, 700)
    check("then asks window (date, areas, drops already known)", "time window" in last_bot(p).lower(), last_bot(p))
    chip(p, "Anytime 9am to 9pm (standard)"); chip(p, "Nothing special"); idle(p, 1800)
    card = p.locator("#cms-chatbot .msgs .est").last.inner_text()
    check("estimate card from rate card, not AI", "Reefer Truck · one-off" in card and "Tuas" in card and "Changi" in card and "Frozen" in card, card)
    st = p.evaluate("window.CMSChat._st.flow.J")
    check("captured job fields kept", st.get("colArea") == "FW" and st.get("delArea") == "CA" and st.get("date") == tomorrow and st.get("goods") == "20 cartons frozen meat", st)
    p.screenshot(path=str(SHOTS / "10-ai-estimate.png"))

    # 3a. the new approved halal answer comes straight from the FAQ
    n_before = len(calls)
    send(p, "are your reefer trucks halal certified?"); idle(p, 1300)
    check("halal answered from the approved FAQ, no AI call", len(calls) == n_before and "not halal certified" in last_bot(p), last_bot(p))
    # 3c. job seekers: approved FAQ answer with the careers button, no AI call
    n_before = len(calls)
    send(p, "are you hiring?"); idle(p, 1300)
    check("hiring answered from FAQ with Citizens/PR line", len(calls) == n_before and "Singapore Citizens and PRs only" in last_bot(p), last_bot(p))
    check("hiring answer links the Join Our Team page", p.locator("#cms-chatbot .msgs .msg.bot a[href*='join-our-team']").count() >= 1 and p.locator("#cms-chatbot .live button", has_text="Open Join Our Team page").count() == 1)
    send(p, "hi any opening for me? i am malaysian on work permit lah"); idle(p, 1500)
    check("AI hiring reply also offers the Join Our Team button", "foreign workers" in last_bot(p) and p.locator("#cms-chatbot .live button", has_text="Open Join Our Team page").count() == 1, last_bot(p))
    # 3b. question the FAQ doesn't cover -> AI handoff with WhatsApp card
    send(p, "can i rent a cold room from you?"); idle(p, 1500)
    check("AI handoff reply + WhatsApp card", "cold room" in last_bot(p) and p.locator("#cms-chatbot .live a.wa").count() == 1, last_bot(p))
    check("unanswered question noted for the team", any("[no approved answer]" in a for a in p.evaluate("window.CMSChat._st.asked")))

    # 4. AI trying to quote a price is replaced by the approved pricing answer
    send(p, "just give me a ballpark figure for a 10ft reefer"); idle(p, 1500)
    allt = p.locator("#cms-chatbot .msgs").inner_text()
    check("AI price blocked", "$150" not in allt and "Ask here in the chat for an estimate" in last_bot(p), last_bot(p))

    # 5. visitor's own amount may be repeated; S$100 allowed
    send(p, "my goods worth $5000, are they covered?"); idle(p, 1500)
    check("insurance reply allowed (S$100 and visitor's own figure)", "S$100" in last_bot(p), last_bot(p))

    # 6. personal ID numbers never leave the page
    send(p, "my NRIC is S1234567A please register me"); idle(p, 1500)
    check("NRIC masked before sending", "S1234567A" not in calls[-1] and "[ID number removed]" in calls[-1], calls[-1][-120:])

    # 6b. a garbled AI reply is never shown, and the AI stays on
    n_before = len(calls)
    send(p, "garble check, do you handle hotel deliveries?"); idle(p, 1500)
    allt = p.locator("#cms-chatbot .msgs").inner_text()
    check("garbled AI reply not shown", len(calls) == n_before + 1 and "\nx\n" not in "\n" + allt + "\n" and last_bot(p).strip() != "x", last_bot(p))
    check("AI not switched off by one garbled reply", not p.evaluate("window.CMSChat._st.aiOff"))

    # 7. mid-estimate question carries context and offers the way back
    chip(p, "Back to my estimate") if p.locator("#cms-chatbot .live button", has_text="Back to my estimate").count() else None
    p.locator("#cms-chatbot .reset").click(); idle(p, 900)
    p.locator("#cms-chatbot .live button.tile", has_text="Get an estimate").click(); idle(p, 900)
    p.locator("#cms-chatbot .live button.tile", has_text="Reefer Truck").click(); idle(p, 700)
    chip(p, "One-off (ad-hoc)"); chip(p, "Chilled (2–8 °C)"); chip(p, "Let CMS decide"); idle(p, 600)
    send(p, "wait, do you check the temperature during the trip?"); idle(p, 1500)
    check("mid-flow question sent with context", "[Context:" in calls[-1] and "Reefer Truck" in calls[-1], calls[-1][:200])
    check("answer then 'Back to my estimate'", p.locator("#cms-chatbot .live button", has_text="Back to my estimate").count() == 1)
    chip(p, "Back to my estimate"); idle(p)
    check("resumes at the date question", "which date" in last_bot(p).lower(), last_bot(p))

    # 8. OutDrive in one sentence
    p.locator("#cms-chatbot .reset").click(); idle(p, 900)
    send(p, "I need 2 drivers for my own vans for 3 months, Mon to Sat"); idle(p, 1600)
    st = p.evaluate("window.CMSChat._st.flow && window.CMSChat._st.flow.J")
    check("OutDrive fields captured", st and st.get("svc") == "outdrive" and st.get("withVeh") == "no" and st.get("hireUnit") == "month" and st.get("dps") == "2", st)
    check("asks start date next", "when should they start" in last_bot(p).lower(), last_bot(p))

    # 9. AI down: two failures switch the AI off and the FAQ bot carries on
    mode["fail"] = True; n0 = len(calls)
    p.locator("#cms-chatbot .reset").click(); idle(p, 900)
    send(p, "do you guys have a cold room to store stuff"); idle(p, 1500)
    check("AI failure falls back to FAQ chatbot", "won't guess" in last_bot(p) or "Did you mean" in last_bot(p), last_bot(p))
    send(p, "what about storing stuff in a warehouse long term"); idle(p, 1500)
    send(p, "and do you guys rent out cold rooms monthly"); idle(p, 1500)
    check("after 2 failures the AI is not called again", len(calls) - n0 == 2, len(calls) - n0)
    check("no JavaScript errors", not errs, errs)
    ctx.close()

    # 10. phone layout with an AI reply
    ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2); p = ctx.new_page()
    mode["fail"] = False; p.route("**/ai", on_ai); p.goto("http://localhost:8766/index.html"); p.locator("#cms-chatbot .launch").click(); idle(p, 900)
    send(p, "tell me a joke about lorries"); idle(p, 1500)
    check("phone: decline reply shown with options", "jokes" in last_bot(p) and p.locator("#cms-chatbot .live button", has_text="Get an estimate").count() == 1)
    check("phone: no sideways scroll", p.evaluate("document.documentElement.scrollWidth") <= 390)
    p.screenshot(path=str(SHOTS / "11-ai-phone.png"))
    ctx.close(); br.close()
srv.terminate()
bad = [r for r in results if not r[1]]
print(f"\n{len(results)-len(bad)}/{len(results)} checks passed")
sys.exit(1 if bad else 0)
