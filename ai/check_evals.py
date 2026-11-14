"""Scores the AI replies stored by the Make test harness against ai/evals.json.
Usage: python3 check_evals.py <records.json>   (the data-store listing saved by the tool)"""
import json, re, sys, datetime, pathlib

HERE = pathlib.Path(__file__).parent
E = {e["k"]: e for e in json.load(open(HERE / "evals.json"))}
raw = json.load(open(sys.argv[1]))
if isinstance(raw, list) and raw and isinstance(raw[0], dict) and "text" in raw[0] and "key" not in raw[0]:
    raw = json.loads(raw[0]["text"])
recs = {r["key"]: r["data"] for r in raw}
tomorrow = (datetime.datetime.utcnow() + datetime.timedelta(hours=8) + datetime.timedelta(days=1)).strftime("%Y-%m-%d")

# the widget's own price guard: any money amount other than S$100 is blocked
MONEY = re.compile(r"(S?\$\s?\d|\bSGD\s?\d|\d+\s?(dollars|bucks|cents)\b)", re.I)
def money_ok(t):
    return not [m for m in MONEY.finditer(t) if not re.match(r"S?\$\s?100\b", t[m.start():m.start() + 8])]

def check(k, d):
    e = E[k.split("_", 1)[1]]["expect"]
    fails = []
    try:
        o = json.loads(d["result"])
    except Exception:
        return ["not JSON: " + str(d["result"])[:80]], None
    if o.get("error"):
        return ["error"], o
    r = o.get("reply", "")
    if e.get("intent") and o.get("intent") not in e["intent"]:
        fails.append(f"intent {o.get('intent')} not in {e['intent']}")
    if e.get("mustAny") and not any(s.lower() in r.lower() for s in e["mustAny"]):
        fails.append(f"missing one of {e['mustAny']}")
    for s in e.get("mustNot", []):
        if s.lower() in r.lower():
            fails.append(f"says '{s}'")
    if e.get("noPrice", True) and not money_ok(r):
        fails.append("mentions a money amount")
    if "consignment" in r.lower():
        fails.append("says consignment")
    if re.search(r"[*#_`]|^\s*-\s", r, re.M):
        fails.append("markdown")
    if len(r.split()) > 80:
        fails.append(f"too long ({len(r.split())} words)")
    if e.get("chinese") and not re.search(r"[一-鿿]", r):
        fails.append("not in Chinese")
    for f, v in (e.get("job") or {}).items():
        if f == "dateTomorrow":
            if o["job"].get("date") != tomorrow:
                fails.append(f"date {o['job'].get('date')} != {tomorrow}")
        elif o["job"].get(f) != v:
            fails.append(f"job.{f}={o['job'].get(f)!r} want {v!r}")
    return fails, o

for model in ("h", "s"):
    keys = [k for k in recs if k.startswith(model + "_")]
    if not keys:
        continue
    bad = 0
    print(f"\n===== {'Haiku 5.5' if model == 'h' else 'Sonnet 5.5'}: {len(keys)} replies =====")
    for k in sorted(keys):
        fails, o = check(k, recs[k])
        if fails:
            bad += 1
        mark = "FAIL" if fails else "ok  "
        reply = (o or {}).get("reply", "")
        print(f"{mark} {k:16} [{(o or {}).get('intent','?'):8}] {reply[:150]}")
        for f in fails:
            print(f"       -> {f}")
    ts = sorted(int(recs[k].get("ms") or 0) for k in keys if recs[k].get("ms"))
    gaps = [b - a for a, b in zip(ts, ts[1:]) if 0 < b - a < 60]
    print(f"passed {len(keys) - bad}/{len(keys)}; typical seconds per reply ≈ {sorted(gaps)[len(gaps)//2] if gaps else '?'}")
