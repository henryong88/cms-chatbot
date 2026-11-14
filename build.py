import json, pathlib, re, subprocess
S = pathlib.Path(__file__).parent / "src"
logo = (S / "logo.txt").read_text().strip().strip("'")
assert "'" not in logo and "\n" not in logo
css = (S / "style.css").read_text()
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
css = "\n".join(l.strip() for l in css.splitlines() if l.strip())
ui = (S / "ui.js").read_text().replace("'__CSS__'", json.dumps(css)).replace("__LOGO__", logo)
body = "\n".join([(S / "main.js").read_text(), (S / "faq.js").read_text(), (S / "engine.js").read_text(), ui])
js = '(function(){\n"use strict";\nif(window.__cmsChatLoaded)return;window.__cmsChatLoaded=true;\n' + body + "\n})();"
out = pathlib.Path(__file__).parent / "dist"
out.mkdir(exist_ok=True)
(out / "cms-chatbot.js").write_text(js)
snippet = ("<!-- CMS website chatbot v1.1 (AI-assisted) · Channel Management Systems Pte Ltd · built 14 Nov 2026\n"
           "     Paste this whole block once, so it loads on every page (see the install guide). -->\n"
           '<script id="cms-chatbot-script">\n' + js + "\n</script>\n")
(out / "cms-chatbot-snippet.html").write_text(snippet)
subprocess.run(["node", "--check", str(out / "cms-chatbot.js")], check=True)
print("built", len(snippet), "bytes")
