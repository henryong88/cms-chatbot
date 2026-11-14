import json, re, subprocess, sys, time, urllib.parse, pathlib
from playwright.sync_api import sync_playwright, expect

ROOT = pathlib.Path(__file__).parent
SHOTS = ROOT / "shots"; SHOTS.mkdir(exist_ok=True)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=ROOT / "site", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
URL = "http://localhost:8765/index.html"
BOARD_SERVICE = {"Reefer truck delivery","OutDrive","Van / truck delivery","Vehicle hire with driver","Baggage delivery","Courier","Last-mile / e-commerce"}
BOARD_TEMP = {"Chilled (2–8 °C)","Ambient","Frozen (−18 °C)","Mixed chilled and frozen"}
results = []
def check(name, cond, info=""):
    results.append((name, bool(cond), info)); print(("PASS " if cond else "FAIL ") + name + ("" if cond else "  " + str(info)))

posts = []
def on_hook(route, request):
    if request.method == "POST":
        posts.append(request.post_data or "")
    route.fulfill(status=200, body="Accepted")

def chip(page, text, exact=True):
    loc = page.locator("#cms-chatbot .live button", has_text=re.compile("^" + re.escape(text) + "$" if exact else re.escape(text)))
    loc.first.wait_for(state="visible", timeout=8000)
    loc.first.click()

def tile(page, text):
    loc = page.locator("#cms-chatbot .live button.tile", has_text=text)
    loc.first.wait_for(state="visible", timeout=8000); loc.first.click()

def last_bot(page):
    return page.locator("#cms-chatbot .msgs .msg.bot").last.inner_text()

def send(page, text):
    page.locator("#cms-chatbot #cmsbot-in").fill(text)
    page.locator("#cms-chatbot .send").click()

def wait_idle(page, ms=1100):
    page.wait_for_timeout(ms)

with sync_playwright() as p:
    br = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    errors = []
    ctx = br.new_context(viewport={"width": 1366, "height": 860})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" and "Failed to load resource" not in m.text else None)
    page.route("**/hook", on_hook)
    page.goto(URL)

    # ---- launcher, nudge, isolation from theme
    launch = page.locator("#cms-chatbot .launch")
    expect(launch).to_be_visible()
    check("launcher visible", launch.is_visible())
    bg = launch.evaluate("e=>getComputedStyle(e).backgroundColor")
    check("theme CSS does not leak into chatbot (button not yellow)", bg == "rgb(15, 42, 82)", bg)
    page.wait_for_timeout(2600)
    check("nudge appears after delay", page.locator("#cms-chatbot .nudge").is_visible())
    page.screenshot(path=str(SHOTS / "01-desktop-closed.png"))
    launch.click(); wait_idle(page, 900)
    check("nudge hides when opened", not page.locator("#cms-chatbot .nudge").is_visible())
    check("greeting shown", "CMS assistant" in last_bot(page))
    check("three home tiles", page.locator("#cms-chatbot .live .tile").count() == 3)
    page.screenshot(path=str(SHOTS / "02-desktop-home.png"))

    # ---- FAQ by topic
    tile(page, "Ask a question"); chip(page, "Cold chain"); chip(page, "What temperatures can your reefer trucks hold?"); wait_idle(page)
    check("topic answer is the approved text", last_bot(page) == "Chilled at 2 to 8 °C and frozen at -18 °C.", last_bot(page))
    # ---- free text, banned goods, unknown, person
    send(page, "can you deliver cooked food?"); wait_idle(page, 1300)
    check("cooked food -> items not carried", "We do not carry dangerous goods" in last_bot(page), last_bot(page))
    send(page, "what is the weather tomorrow"); wait_idle(page, 1300)
    check("off-topic -> no guess, hand-off offered", "won't guess" in last_bot(page) and page.locator("#cms-chatbot .live a.wa").count() == 1, last_bot(page))
    wa = page.locator("#cms-chatbot .live a.wa").get_attribute("href")
    check("WhatsApp link carries the question", "wa.me/6588996423" in wa and "weather" in urllib.parse.unquote(wa), wa)
    send(page, "How do I reach you?"); wait_idle(page, 1300)
    links = page.locator("#cms-chatbot .msgs .msg.bot").last.locator("a")
    check("contact answer links WhatsApp and email", links.count() == 2, links.count())
    send(page, "i want to talk to a real person"); wait_idle(page, 1300)
    check("talk to a person -> hand-off card", page.locator("#cms-chatbot .live a.ml").count() == 1)
    mail = page.locator("#cms-chatbot .live a.ml").get_attribute("href")
    check("email hand-off goes to enquiry@", mail.startswith("mailto:enquiry@cmspl.biz"), mail)

    # ---- estimate: one-off reefer, chilled, Central -> East (Quote Desk: base 110 x same day 1.25 = 137.50 + GST)
    chip(page, "Main menu"); wait_idle(page, 700)
    tile(page, "Get an estimate"); tile(page, "Reefer Truck")
    chip(page, "One-off (ad-hoc)"); chip(page, "Chilled (2–8 °C)"); chip(page, "Let CMS decide")
    chip(page, "Tomorrow"); chip(page, "1 drop-off point"); chip(page, "Central / CBD")
    # ask a question mid-flow and come back
    send(page, "do you deliver on sundays?"); wait_idle(page, 1300)
    check("question mid-flow answered", "Surcharges may apply" in last_bot(page), last_bot(page))
    chip(page, "Back to my estimate"); wait_idle(page)
    check("resumes at the same step", "where does it go" in last_bot(page).lower(), last_bot(page))
    chip(page, "East"); chip(page, "Anytime 9am to 9pm (standard)"); chip(page, "Nothing special")
    wait_idle(page, 600)
    send(page, "30 cartons of chilled yoghurt, about 250 kg"); wait_idle(page, 1500)
    card = page.locator("#cms-chatbot .msgs .est").last
    card.wait_for(timeout=6000)
    big = card.locator(".big").inner_text()
    # tomorrow = 9 Nov 2026, the Deepavali public holiday: 110 x 1.25 + 36 = 173.50 + GST = 189.12; range 151.29 to 226.94
    check("public holiday spotted and explained", "public holiday" in page.locator("#cms-chatbot .msgs").inner_text().lower())
    check("reefer estimate shows ±20% range of $189.12", "$151" in big and "$227" in big, big)
    check("estimate labelled, not a quotation", "not a quotation" in card.inner_text())
    page.screenshot(path=str(SHOTS / "03-desktop-estimate.png"))

    # ---- form validation then submit
    chip(page, "Request a formal quotation or booking"); wait_idle(page, 900)
    page.locator("#cms-chatbot .dform button[type=submit]").click()
    err = page.locator("#cms-chatbot .dform .err").inner_text()
    check("form validation names missing fields", "your name" in err and "mobile" in err and "email" in err, err)
    f = page.locator("#cms-chatbot .dform")
    f.locator("[name=name]").fill("Tan Mei Ling"); f.locator("[name=company]").fill("Fresh Dairy Pte Ltd")
    f.locator("[name=phone]").fill("9123 4567"); f.locator("[name=email]").fill("meiling@freshdairy.sg")
    f.locator("[name=pickup]").fill("10 Raffles Place, #01-01, Singapore 048616"); f.locator("[name=dropoff]").fill("1 Changi Business Park, Singapore 486025")
    page.screenshot(path=str(SHOTS / "04-desktop-form.png"))
    f.locator("button[type=submit]").click(); wait_idle(page, 1800)
    check("one request posted", len(posts) == 1, len(posts))
    q = urllib.parse.parse_qs(posts[0]) if posts else {}
    g = lambda k: (q.get(k) or [""])[0]
    check("source field = Chatbot", g("source") == "Chatbot", g("source"))
    check("stage = formal", g("stage") == "formal")
    ref = g("ref")
    check("reference format CB-ddmmyy-XXXX", re.match(r"^CB-\d{6}-[A-Z0-9]{4}$", ref), ref)
    cv = json.loads(g("columnValues") or "{}")
    check("monday Source label Chatbot", cv.get("color_mm8w7r5g", {}).get("label") == "Chatbot")
    check("monday Service label exists on board", cv.get("color_mm8d11pg", {}).get("label") in BOARD_SERVICE, cv.get("color_mm8d11pg"))
    check("monday Temperature label exists on board", cv.get("color_mm8dw06e", {}).get("label") in BOARD_TEMP, cv.get("color_mm8dw06e"))
    check("monday Status New, Frequency Ad-hoc", cv.get("color_mm8drmn4", {}).get("label") == "New" and cv.get("color_mm8dfzk", {}).get("label") == "Ad-hoc")
    check("phone formatted +65", cv.get("phone_mm8dwrm1", {}).get("phone") == "+6591234567", cv.get("phone_mm8dwrm1"))
    check("est total stored 189.12", cv.get("numeric_mm8dzwyb") == "189.12", cv.get("numeric_mm8dzwyb"))
    fd = cv.get("long_text_mm8dtknz", {}).get("text", "")
    check("Form data fits monday's 2000 limit", 0 < len(fd) <= 2000, len(fd))
    F = json.loads(fd)
    check("Form data in Quote Desk shape", F.get("svc") == "van" and F["job"]["temp"] == "chilled" and F["job"]["from"] == "Central / CBD" and F["job"]["to"] == "East" and F["est"]["rate"] == 173.5 and F["tier"] == "range" and F["job"]["sunph"] in ("Public holiday", "Sunday", ""), F)
    check("addresses captured", "Raffles Place" in cv.get("long_text_mm8dvs1n", {}).get("text", ""))
    check("chat questions passed to notes", "sundays" in cv.get("long_text_mm8ddf96", {}).get("text", ""))
    check("email subject names chatbot and ref", g("subject").startswith("Chatbot enquiry " + ref), g("subject"))
    check("confirmation shows reference", ref in page.locator("#cms-chatbot .msgs").inner_text())
    page.screenshot(path=str(SHOTS / "05-desktop-sent.png"))

    # ---- regular reefer, 11-20 drops a day: floor must apply silently
    chip(page, "New estimate"); tile(page, "Reefer Truck"); chip(page, "Regular (scheduled)"); chip(page, "Chilled (2–8 °C)"); chip(page, "Let CMS decide")
    chip(page, "Not sure yet"); chip(page, "Mon – Sat"); chip(page, "No"); chip(page, "21 to 30"); chip(page, "North")
    chip(page, "Anytime 9am to 9pm (standard)"); chip(page, "Nothing special"); wait_idle(page, 500)
    send(page, "chilled dairy, 25 outlets"); wait_idle(page, 1500)
    txt = page.locator("#cms-chatbot .msgs .est").last.inner_text()
    check("regular reefer priced at floor: per drop range $20.00 – $30.00", "$20.00 – $30.00" in txt, txt)
    alltext = page.locator("#cms-chatbot .panel").inner_text().lower()
    check("never mentions floor/minimum charge to visitor", "floor" not in alltext and "minimum charge" not in alltext.replace("is there a minimum order or minimum charge?", ""))
    check("never says 'consignment' or '24/7 support'", "consignment" not in alltext and "24/7 support" not in alltext)

    # ---- back button and change answer
    chip(page, "Change an answer"); wait_idle(page)
    check("change an answer re-asks last step", "what are you sending" in last_bot(page).lower(), last_bot(page))
    chip(page, "‹ Back"); wait_idle(page)
    check("back goes one more step", "special about the load" in last_bot(page).lower(), last_bot(page))

    # ---- OutDrive driver only -> tailored
    page.locator("#cms-chatbot .reset").click(); wait_idle(page, 900)
    tile(page, "Get an estimate"); tile(page, "OutDrive"); chip(page, "Driver only, for your vehicle"); chip(page, "By the month"); chip(page, "2")
    chip(page, "Not sure yet"); wait_idle(page, 500); send(page, "Mon to Sat, 8am to 6pm, 40 drops a day"); wait_idle(page, 1500)
    txt = page.locator("#cms-chatbot .msgs .est").last.inner_text()
    check("driver-only OutDrive -> tailored proposal", "Tailored proposal" in txt, txt)
    check("tailored button wording", page.locator("#cms-chatbot .live button", has_text="Send details for a tailored proposal").count() == 1)

    # ---- banned goods inside the estimate
    page.locator("#cms-chatbot .reset").click(); wait_idle(page, 900)
    tile(page, "Get an estimate"); tile(page, "Van or truck"); chip(page, "One-off (ad-hoc)"); chip(page, "Van"); chip(page, "Not sure yet")
    chip(page, "2 to 5"); chip(page, "West"); chip(page, "Same day"); chip(page, "9am to 6pm"); chip(page, "Fragile"); wait_idle(page, 500)
    send(page, "hot food catering trays"); wait_idle(page, 1300)
    check("banned goods caught in flow", "do not carry" in last_bot(page), last_bot(page))
    chip(page, "Change what I'm sending"); wait_idle(page, 700); send(page, "office printer and 3 boxes"); wait_idle(page, 1500)
    txt = page.locator("#cms-chatbot .msgs .est").last.inner_text()
    # van, W, 4 drops (2-5) multi -> 25 km: 40 + 10*1.2 + 3*10 = 82 transport; x1.25 = 102.5; +fragile 10 = 112.5; GST 122.63
    check("ambient one-off van exact price $122.63", "$122.63" in txt, txt)

    # ---- network failure -> fallback
    page.unroute("**/hook"); page.route("**/hook", lambda r, req: r.abort())
    chip(page, "Request a formal quotation or booking"); wait_idle(page, 900)
    f = page.locator("#cms-chatbot .dform")
    check("form remembers contact details", f.locator("[name=email]").input_value() == "meiling@freshdairy.sg")
    f.locator("button[type=submit]").click(); wait_idle(page, 1800)
    check("network failure -> honest message + WhatsApp/email", "didn't go through" in last_bot(page) and page.locator("#cms-chatbot .live a.wa").count() == 1, last_bot(page))
    page.unroute("**/hook"); page.route("**/hook", on_hook)

    # ---- reload keeps the conversation
    page.locator("#cms-chatbot .reset").click(); wait_idle(page, 900)
    tile(page, "Get an estimate"); tile(page, "Last-mile"); chip(page, "One-off (ad-hoc)"); chip(page, "Chilled (2–8 °C)")
    page.reload(); page.route("**/hook", on_hook); wait_idle(page, 800)
    if not page.locator("#cms-chatbot .panel").is_visible(): page.locator("#cms-chatbot .launch").click()
    wait_idle(page, 600)
    check("reload restores transcript", "Last-mile" in page.locator("#cms-chatbot .msgs").inner_text())
    check("reload restores current step", page.locator("#cms-chatbot .live button", has_text="Tomorrow").count() == 1)
    chip(page, "Tomorrow"); wait_idle(page, 600); send(page, "120"); chip(page, "Anytime 9am to 9pm (standard)"); chip(page, "1 to 5 kg"); wait_idle(page, 500)
    send(page, "120 chilled meal kits"); wait_idle(page, 1500)
    txt = page.locator("#cms-chatbot .msgs .est").last.inner_text()
    # last-mile chilled 11 x same day 1.25 = 13.75 x 120 = 1650 + GST = 1798.50 -> range 1438.80 – 2158.20
    check("last-mile range for 120 chilled drops", "$1,439" in txt and "$2,158" in txt, txt)

    check("no JavaScript errors on desktop", not errors, errors)
    ctx.close()

    # ---- phone
    ctx = br.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    page = ctx.new_page(); perr = []
    page.on("pageerror", lambda e: perr.append(str(e)))
    page.route("**/hook", on_hook); page.goto(URL); page.wait_for_timeout(500)
    l = page.locator("#cms-chatbot .launch")
    box = l.bounding_box()
    check("phone launcher is a round icon", box and abs(box["width"] - 58) < 2, box)
    page.screenshot(path=str(SHOTS / "06-phone-closed.png"))
    l.click(); page.wait_for_timeout(900)
    pb = page.locator("#cms-chatbot .panel").bounding_box()
    check("phone panel is full screen", pb and pb["width"] >= 389 and pb["height"] >= 840, pb)
    check("launcher hidden while open on phone", not l.is_visible())
    fs = page.locator("#cms-chatbot #cmsbot-in").evaluate("e=>getComputedStyle(e).fontSize")
    check("input 16px (no iPhone zoom)", fs == "16px", fs)
    page.screenshot(path=str(SHOTS / "07-phone-home.png"))
    tile(page, "Get an estimate"); tile(page, "Courier"); chip(page, "One-off (ad-hoc)"); chip(page, "Motorcycle"); chip(page, "Not sure yet")
    chip(page, "1 drop-off point"); chip(page, "Central / CBD"); chip(page, "North"); chip(page, "Within 2 hours"); chip(page, "Anytime 9am to 9pm (standard)"); chip(page, "4 to 5")
    wait_idle(page, 500); send(page, "5 envelopes of documents"); wait_idle(page, 1500)
    txt = page.locator("#cms-chatbot .msgs .est").last.inner_text()
    # moto C->N 20 km: 12 + 10*0.8 = 20; x2 = 40; 5 pieces: +2*2 = 4 -> 44 + GST = 47.96
    check("courier 2-hour exact $47.96", "$47.96" in txt, txt)
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("no sideways scroll on phone", sw <= 390, sw)
    page.screenshot(path=str(SHOTS / "08-phone-estimate.png"))
    chip(page, "Request a formal quotation or booking"); page.wait_for_timeout(900)
    page.screenshot(path=str(SHOTS / "09-phone-form.png"))
    page.locator("#cms-chatbot .close").click(); page.wait_for_timeout(300)
    check("closing restores page scrolling", page.evaluate("document.documentElement.style.overflow") in ("", None))
    check("no JavaScript errors on phone", not perr, perr)
    ctx.close(); br.close()
srv.terminate()
bad = [r for r in results if not r[1]]
print(f"\n{len(results)-len(bad)}/{len(results)} checks passed")
sys.exit(1 if bad else 0)
