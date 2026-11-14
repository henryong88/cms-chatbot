"""Builds the developer package: WordPress plugin zip + snippet + PDF install guide, all in one zip.
Run after build.py:  python3 package.py"""
import datetime, pathlib, re, shutil, subprocess, zipfile

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"
PKG = ROOT / "package"
VERSION = re.search(r"chatbot v([\d.]+)", (ROOT / "build.py").read_text()).group(1)
VERSION = VERSION if VERSION.count(".") == 2 else VERSION + ".0"
TODAY = (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=8)).strftime("%-d %B %Y")
NAME = f"CMS-Chatbot-v{VERSION}"

js = (DIST / "cms-chatbot.js").read_text()
snippet = (DIST / "cms-chatbot-snippet.html").read_text()
assert js.strip() in snippet, "snippet and js are out of step: run build.py"

out = DIST / "package"; shutil.rmtree(out, ignore_errors=True)
stage = out / NAME; (stage / "1-WordPress").mkdir(parents=True); (stage / "2-Any-other-website").mkdir()

# 1. WordPress plugin zip (folder cms-chatbot/ at the zip root, as WordPress expects)
plug = PKG / "wordpress-plugin" / "cms-chatbot"
with zipfile.ZipFile(stage / "1-WordPress" / "cms-chatbot.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in ("cms-chatbot.php", "readme.txt"):
        z.writestr(f"cms-chatbot/{f}", (plug / f).read_text().replace("__VERSION__", VERSION))
    z.writestr("cms-chatbot/assets/cms-chatbot.js", js)
    z.writestr("cms-chatbot/index.php", "<?php // Silence is golden.\n")
    z.writestr("cms-chatbot/assets/index.php", "<?php // Silence is golden.\n")

# 2. snippet for any other website
(stage / "2-Any-other-website" / "cms-chatbot-snippet.html").write_text(snippet)

# 3. install guide PDF
logo = (ROOT / "src" / "logo.txt").read_text().strip().strip("'")
html = (PKG / "guide.html").read_text().replace("__LOGO__", logo).replace("__VERSION__", VERSION).replace("__DATE__", TODAY)
tmp = out / "guide.html"; tmp.write_text(html)
pdf = stage / "CMS-Chatbot-Install-Guide.pdf"
subprocess.run(["python3", "-c", f"""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file://{tmp}'); pg.wait_for_timeout(300)
    pg.pdf(path='{pdf}', format='A4', print_background=True, prefer_css_page_size=True); b.close()
"""], check=True)

# 4. one zip for the developer
final = DIST / f"{NAME}-package.zip"
with zipfile.ZipFile(final, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(stage.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(out))
print("package:", final, final.stat().st_size, "bytes")

# 5. publish into the repo root: GitHub Pages test page, plain snippet, and the download
(ROOT / "index.html").write_text((ROOT / "pages" / "index.template.html").read_text().replace("__SNIPPET__", snippet.strip()))
(ROOT / "cms-chatbot-snippet.html").write_text(snippet)
dl = ROOT / "downloads"; dl.mkdir(exist_ok=True)
for old in dl.glob("CMS-Chatbot-v*-package.zip"):
    old.unlink()
shutil.copy(final, dl / final.name)
print("published: index.html, cms-chatbot-snippet.html, downloads/" + final.name)
