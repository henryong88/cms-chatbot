/* ---------- helpers ---------- */
var OVR=window.CMS_CHAT_SETTINGS;if(OVR&&typeof OVR==="object")Object.assign(SETTINGS,OVR);
var PREVIEW=SETTINGS.preview===true||(SETTINGS.preview==="auto"&&/(^|\.)claude|claudeusercontent|anthropic/.test(location.hostname));
var KEY="cmsbot.v1";
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var money=function(n){return "$"+num(n).toLocaleString("en-SG",{minimumFractionDigits:2,maximumFractionDigits:2})};
var moneyR=function(n){n=num(n);return n<100?money(n):"$"+Math.round(n).toLocaleString("en-SG")};
var pad=function(n){return (n<10?"0":"")+n};
var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var wait=function(ms){return new Promise(function(r){setTimeout(r,reduce?0:ms)})};
function sgNow(){
  var p={};try{new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Singapore",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",weekday:"short",hour12:false}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value})}catch(e){var d=new Date();p={year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),hour:d.getHours(),weekday:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}}
  return {y:+p.year,m:+p.month,d:+p.day,h:(+p.hour)%24,wd:p.weekday};
}
function isoAdd(days){var n=sgNow(),d=new Date(Date.UTC(n.y,n.m-1,n.d+days));return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
function teamStatus(){
  var n=sgNow(),open=n.wd!=="Sun"&&n.h>=9&&n.h<21;
  if(open)return {open:true,txt:"Our team is online now"};
  var next=(n.wd==="Sun")?"today":(n.h<9?"today":(n.wd==="Sat"?"Monday":"tomorrow"));
  if(n.wd==="Sun")next="Monday";
  return {open:false,txt:"Team replies from 9 am "+next};
}
function linkify(t){
  var h=esc(t);
  h=h.replace(/\+65 8899 6423/g,'<a href="https://wa.me/'+SETTINGS.whatsapp+'" target="_blank" rel="noopener">+65 8899 6423</a>');
  h=h.replace(/([a-z]+@cmspl\.biz)/g,'<a href="mailto:$1">$1</a>');
  if(SETTINGS.careersUrl)h=h.replace(/Join Our Team page/g,'<a href="'+esc(SETTINGS.careersUrl)+'" target="_blank" rel="noopener">Join Our Team page</a>');
  return h;
}
var ICON={
  chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/></svg>',
  calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
  q:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17h.01"/></svg>',
  person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 9.5c.3 2 2 4 4.5 4.8l1.2-1.2 2 .8"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  snow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></svg>'
};

/* ---------- FAQ matching (answers only from the approved FAQ) ---------- */
var STOP={};"a an the is are am was were be been being do does did can could would should will shall may might must i you we they he she it my your our their me us them to of in on at for from with by about and or if as that this these those there here what which who whom how when where why any some its im pls please hi hello hey u ur also just get got need want like know tell much many have has had deliver delivers delivered delivery deliveries send sending sent possible shipment shipments order orders receive received stuff thing things serve address addresses guys u2 able let okay".split(" ").forEach(function(w){STOP[w]=1});
function norm(s){return String(s||"").toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9°±%&/+\- ]+/g," ").replace(/\s+/g," ").trim()}
function stem(w){
  if(w.length>5&&/ing$/.test(w))w=w.slice(0,-3);
  else if(w.length>4&&/ies$/.test(w))w=w.slice(0,-3)+"y";
  else if(w.length>4&&/ied$/.test(w))w=w.slice(0,-3)+"y";
  else if(w.length>4&&/ed$/.test(w))w=w.slice(0,-2);
  else if(w.length>3&&/s$/.test(w)&&!/ss$/.test(w))w=w.slice(0,-1);
  if(w.length>4&&/e$/.test(w))w=w.slice(0,-1);
  return w;
}
function toks(s){return norm(s).split(/[\s/]+/).map(function(x){return x.replace(/^[-+]+|[-+]+$/g,"")}).filter(function(w){return w&&!STOP[w]}).map(stem)}
var FAQX=FAQ.map(function(f,i){
  var seen={},K=[];
  f.k.split(",").forEach(function(k){var strong=k.trim().charAt(0)==="!";k=k.replace("!","");var n=norm(k),t=toks(k),key=t.length?t.slice().sort().join(" "):"="+n;
    if(!n||seen[key])return;seen[key]=1;K.push({n:n,t:t,w:(strong?5:2)+(t.length>1?(t.length-1)*1.5:0)})});
  return {i:i,f:f,q:toks(f.q),k:K};
});
function score(text){
  var n=" "+norm(text)+" ",T=toks(text),set={};T.forEach(function(w){set[w]=1});
  return FAQX.map(function(x){
    var s=0,used={};
    x.k.forEach(function(k){
      var hit=k.t.length?k.t.every(function(w){return set[w]}):n.indexOf(" "+k.n+" ")>=0;
      if(hit){s+=k.w;k.t.forEach(function(w){used[w]=1})}
    });
    x.q.forEach(function(w){if(set[w]&&!used[w]){s+=1;used[w]=1}});
    return {x:x,s:s};
  }).sort(function(a,b){return b.s-a.s});
}
var VOCAB={};FAQX.forEach(function(x){x.q.forEach(function(w){VOCAB[w]=1});x.k.forEach(function(k){k.t.forEach(function(w){VOCAB[w]=1})})});
function unknown(text){return toks(text).filter(function(w){return !VOCAB[w]&&!/^\d+$/.test(w)}).length}
function confident(R,text){var b=R[0].s,c=R[1].s;if(text&&b<3&&unknown(text))return false;return b>=3||(b>=2&&c<=b/2)}
function fq(q){for(var i=0;i<FAQ.length;i++)if(FAQ[i].q===q)return i;return 0}
var I_NOCARRY=fq("Are there items you will not carry?"),I_COST=fq("How much does a delivery cost?");
var BANNED=/\b(cooked|hot food|catering|bento|dangerous goods?|hazardous|flammable|explosives?|gas cylinders?|live animals?|livestock|pets?|cash)\b/i;

/* ---------- state ---------- */
var ST={open:false,log:[],live:null,flow:null,lead:null,asked:[],nudged:false,contact:null,ai:0,aiOff:false};
function save(){try{sessionStorage.setItem(KEY,JSON.stringify({log:ST.log.slice(-70),live:ST.live,flow:ST.flow,lead:ST.lead,asked:ST.asked.slice(-12),nudged:ST.nudged,contact:ST.contact,open:ST.open,ai:ST.ai,aiOff:ST.aiOff}))}catch(e){}}
function load(){try{var v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&Array.isArray(v.log))Object.assign(ST,v)}catch(e){}}

/* ---------- DOM ---------- */
var host,root,el={},busy=false;
var CSS='__CSS__';
function build(){
  if(!document.querySelector('link[data-cmsbot-font]')){var l=document.createElement("link");l.rel="stylesheet";l.setAttribute("data-cmsbot-font","");l.href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap";document.head.appendChild(l)}
  host=document.createElement("div");host.id="cms-chatbot";host.style.cssText="all:initial";
  document.body.appendChild(host);
  root=host.attachShadow?host.attachShadow({mode:"open"}):host;
  var side=SETTINGS.side==="left"?"left":"right";
  root.innerHTML='<style>'+CSS+'</style>'+
  '<div class="wrap side-'+side+'" style="--lift:'+num(SETTINGS.lift)+'px">'+
    '<button class="launch" type="button" aria-expanded="false" aria-controls="cmsbot-panel"><span class="dot" aria-hidden="true"></span>'+ICON.chat+'<span class="lbl">Ask CMS</span></button>'+
    '<div class="nudge" hidden><button class="nx" type="button" aria-label="Dismiss">'+ICON.x+'</button><button class="nb" type="button">Need a price? I can estimate a delivery in about a minute.</button></div>'+
    '<section class="panel" id="cmsbot-panel" role="dialog" aria-label="Ask CMS" hidden>'+
      '<header class="hd"><span class="mark" aria-hidden="true">__LOGO__</span><div class="t"><b>Ask CMS</b><small><i class="st"></i><span class="stx"></span></small></div>'+
        '<button class="ic reset" type="button" aria-label="Start over" title="Start over">'+ICON.reset+'</button><button class="ic close" type="button" aria-label="Close chat" title="Close">'+ICON.x+'</button></header>'+
      '<div class="log" role="log" aria-live="polite"><div class="msgs"></div><div class="live"></div></div>'+
      '<form class="ft" autocomplete="off"><label class="sr" for="cmsbot-in">Your message</label><input id="cmsbot-in" enterkeyhint="send" placeholder="Type your question…" maxlength="400"><button class="send" type="submit" aria-label="Send">'+ICON.send+'</button></form>'+
      '<p class="legal">AI-assisted, using CMS\'s approved information. Estimates are not quotations.</p>'+
    '</section></div>';
  el.wrap=root.querySelector(".wrap");el.launch=root.querySelector(".launch");el.panel=root.querySelector(".panel");el.log=root.querySelector(".log");
  el.msgs=root.querySelector(".msgs");el.live=root.querySelector(".live");el.form=root.querySelector(".ft");el.input=root.querySelector("#cmsbot-in");
  el.nudge=root.querySelector(".nudge");
  el.launch.addEventListener("click",function(){toggle()});
  root.querySelector(".close").addEventListener("click",function(){toggle(false)});
  root.querySelector(".reset").addEventListener("click",restart);
  el.form.addEventListener("submit",function(e){e.preventDefault();var v=el.input.value.trim();if(!v)return;el.input.value="";whenFree(function(){onText(v)})});
  el.panel.addEventListener("keydown",function(e){if(e.key==="Escape")toggle(false)});
  root.querySelector(".nb").addEventListener("click",function(){hideNudge();var fresh=!ST.log.length;toggle(true,fresh);if(fresh||!(ST.flow&&ST.flow.step))startFlow()});
  root.querySelector(".nx").addEventListener("click",hideNudge);
  /* the homepage preview's older "Ask CMS" button is replaced by this one */
  var ob=document.getElementById("askBtn"),oc=document.getElementById("chat");
  if(ob&&/askbtn/.test(ob.className)){ob.style.display="none";if(oc&&/chat/.test(oc.className))oc.style.display="none"}
}
function status(){var s=teamStatus();root.querySelector(".stx").textContent=s.txt;root.querySelector(".st").className="st"+(s.open?" on":"")}
function toggle(force,skipHome){
  var open=force==null?el.panel.hidden:force;
  el.panel.hidden=!open;ST.open=open;el.launch.setAttribute("aria-expanded",String(open));el.wrap.classList.toggle("is-open",open);
  if(open){hideNudge();status();if(!el.msgs.childNodes.length){if(ST.log.length)restore();else if(!skipHome)home(true)}
    var small=window.innerWidth<=560;if(small){ST.htmlOv=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden"}
    setTimeout(function(){if(!small)el.input.focus();scroll()},60)}
  else{if(ST.htmlOv!=null){document.documentElement.style.overflow=ST.htmlOv;ST.htmlOv=null}el.launch.focus()}
  save();
}
function hideNudge(){el.nudge.hidden=true;ST.nudged=true;save()}
function scroll(){
  /* keep the newest reply in view: its top edge if it and its options are taller than the panel */
  var a=el.msgs.lastElementChild,max=el.log.scrollHeight-el.log.clientHeight;
  if(!a||/\b(me|typing)\b/.test(a.className))return el.log.scrollTop=max;
  el.log.scrollTop=Math.min(max,a.offsetTop-12);
}
function render(m){
  var d=document.createElement("div");
  d.className=m.w==="u"?"msg me":m.w==="c"?"card-wrap":"msg bot";
  d.innerHTML=m.h;el.msgs.appendChild(d);
}
function push(w,h){var m={w:w,h:h};ST.log.push(m);render(m);scroll();save()}
function me(t){push("u",esc(t))}
async function bot(h,ms){
  var t=document.createElement("div");t.className="msg bot typing";t.innerHTML="<i></i><i></i><i></i>";el.msgs.appendChild(t);scroll();
  await wait(ms==null?Math.min(900,280+h.length*2):ms);t.remove();push("b",h);
}
function setLive(name,arg){ST.live={n:name,a:arg};save();drawLive()}
function clearLive(){el.live.innerHTML="";ST.live=null}
function drawLive(){
  el.live.innerHTML="";var L=ST.live;if(!L)return;
  var f=LIVE[L.n];if(f)f(L.a);
  el.input.placeholder=ST.live&&ST.live.n==="step"&&curStep()&&curStep().type==="text"?(curStep().hint||"Type your answer…"):(ST.live&&ST.live.n==="step"&&curStep()&&curStep().type==="num"?"Type a number, or tap one":"Type your question…");
  scroll();
}
function chips(list,cls){
  var w=document.createElement("div");w.className="chips"+(cls?" "+cls:"");
  list.forEach(function(c){var b=document.createElement("button");b.type="button";b.className="chip"+(c.cls?" "+c.cls:"");b.innerHTML=c.html||esc(c.label);if(c.title)b.title=c.title;
    b.addEventListener("click",function(){if(busy)return;c.go()});w.appendChild(b)});
  el.live.appendChild(w);return w;
}
function restore(){
  ST.log.forEach(render);scroll();
  if(ST.live)return drawLive();
  /* the page was reloaded while a reply was being typed: pick up where it stopped */
  if(ST.flow&&ST.flow.step){var F=ST.flow,id=F.J[F.step]===undefined?F.step:nextStepId(F.J,F.step);
    run(function(){if(id)return ask(id);F.step=null;F.done=true;return showEstimate()})}
  else if(ST.flow&&ST.flow.done)setLive("estimate");
  else home(false);
}
function restart(){
  if(busy)return;
  ST.log=[];ST.flow=null;ST.live=null;ST.lead=null;ST.asked=[];el.msgs.innerHTML="";el.live.innerHTML="";save();home(true);
}
function whenFree(cb){if(!busy)return cb();var t=setInterval(function(){if(!busy){clearInterval(t);cb()}},80)}
async function run(fn){if(busy)return;busy=true;try{await fn()}finally{busy=false}}

/* ---------- home, topics, answers, hand-off ---------- */
function home(first){run(async function(){
  clearLive();
  await bot(first?"Hi! I'm the CMS assistant. I can answer your questions, give you a delivery estimate, or pass you to our team.":"What would you like to do next?",first?500:350);
  setLive("home");
})}
var POPULAR=["What services do you offer?","What temperatures can your reefer trucks hold?","How do I book a delivery?","Do you deliver on weekends and public holidays?"].map(fq);
var LIVE={};
LIVE.home=function(){
  var t=document.createElement("div");t.className="tiles";
  [["estimate",ICON.calc,"Get an estimate","Price a delivery in about a minute"],["topics",ICON.q,"Ask a question","Services, cold chain, booking, payment"],["person",ICON.person,"Talk to a person","WhatsApp or email our team"]].forEach(function(x){
    var b=document.createElement("button");b.type="button";b.className="tile t-"+x[0];b.innerHTML='<span class="ti">'+x[1]+'</span><span><b>'+x[2]+'</b><small>'+x[3]+'</small></span><span class="chev">'+ICON.chev+'</span>';
    b.addEventListener("click",function(){if(busy)return;me(x[2]);act(x[0])});t.appendChild(b)});
  el.live.appendChild(t);
  var p=document.createElement("p");p.className="lbl2";p.textContent="Popular questions";el.live.appendChild(p);
  chips(POPULAR.map(function(i){return {label:FAQ[i].q,go:function(){me(FAQ[i].q);answer(i)}}}),"qlist");
};
function act(a){
  if(a==="estimate")return startFlow();
  if(a==="topics")return topics();
  if(a==="person")return handoff();
  if(a==="email")return handoff("email");
  if(a==="home")return home(false);
}
function topics(){run(async function(){clearLive();await bot("Pick a topic:",300);setLive("topics")})}
LIVE.topics=function(){
  chips(TOPICS.map(function(t){return {label:t[1],go:function(){me(t[1]);topic(t[0])}}}));
  if(ST.flow&&ST.flow.step)chips([{label:"Back to my estimate",cls:"pri",go:function(){resumeFlow()}}]);
};
function topic(id){run(async function(){clearLive();var n=TOPICS.filter(function(t){return t[0]===id})[0][1];await bot(n+": tap a question.",300);setLive("topic",id)})}
LIVE.topic=function(id){
  var list=[];FAQ.forEach(function(f,i){if(f.t===id)list.push({label:f.q,go:function(){me(f.q);answer(i)}})});
  chips(list,"qlist");chips([{label:"‹ All topics",cls:"back",go:function(){topics()}}]);
};
function answer(i,extra){run(async function(){
  clearLive();var f=FAQ[i];
  await bot(linkify(f.a));
  setLive("after",{i:i,rel:extra||null});
})}
LIVE.after=function(a){
  var f=FAQ[a.i],L=[];
  (f.act||[]).forEach(function(x){
    if(x==="estimate"&&!(ST.flow&&ST.flow.step))L.push({label:"Get an estimate",cls:"pri",go:function(){me("Get an estimate");startFlow()}});
    if(x==="person")L.push({label:"Talk to a person",go:function(){me("Talk to a person");handoff()}});
    if(x==="join"&&SETTINGS.careersUrl)L.push({label:"Open Join Our Team page",cls:"pri",go:function(){window.open(SETTINGS.careersUrl,"_blank","noopener")}});
    if(x==="email")L.push({label:"Email "+SETTINGS.email,go:function(){me("Email "+SETTINGS.email);handoff("email")}});
  });
  if(a.rel!=null)L.push({label:"Related: "+FAQ[a.rel].q,go:function(){me(FAQ[a.rel].q);answer(a.rel)}});
  if(ST.flow&&ST.flow.step)L.unshift({label:"Back to my estimate",cls:"pri",go:function(){resumeFlow()}});
  L.push({label:"Another question",go:function(){me("Another question");topics()}});
  if(!(ST.flow&&ST.flow.step))L.push({label:"Main menu",cls:"back",go:function(){home(false)}});
  chips(L);
};
function summaryText(){
  var F=ST.flow;if(!F||!F.J||!F.J.svc)return "";
  var J=F.J,o=calc(J),S=SERVICES[J.svc],lines=[(S.ui)+", "+(kindOf(J)==="adhoc"?"one-off":"regular")];
  o.specs.slice(0,4).forEach(function(s){lines.push("- "+s)});
  if(F.done)lines.push(o.tier==="tailored"?"Estimate: tailored proposal needed":"Estimate shown: "+priceLine(o));
  return lines.join("\n");
}
function handoff(mode){run(function(){return handoffBody(mode)})}
async function handoffBody(mode){
  clearLive();
  await bot(mode==="email"?"Email us any time at "+linkify(SETTINGS.email)+". Our customer service team answers personally.":"Our customer service team answers personally on WhatsApp and email.<br><span class=\"muted\">Customer service: 9am to 9pm, Monday to Saturday.</span>");
  setLive("handoff");
}
LIVE.handoff=function(){
  var last=ST.asked.length?ST.asked[ST.asked.length-1]:"",sum=summaryText(),ref=ST.lead&&ST.lead.ref;
  var text="Hi CMS, "+(ref?"following up on my chatbot enquiry "+ref+".":sum?"I'd like help with a delivery:\n"+sum:last?"I was asking on your website: "+last:"I have an enquiry.");
  var d=document.createElement("div");d.className="hand";
  d.innerHTML='<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/'+SETTINGS.whatsapp+'?text='+encodeURIComponent(text.slice(0,900))+'">'+ICON.phone+'<span>WhatsApp '+esc(SETTINGS.whatsappShow)+'</span></a>'+
    '<a class="btn ml" href="mailto:'+SETTINGS.email+'?subject='+encodeURIComponent(ref?"Chatbot enquiry "+ref:"Enquiry from cmspl.biz")+'&body='+encodeURIComponent(text.slice(0,1500))+'">'+ICON.mail+'<span>Email '+esc(SETTINGS.email)+'</span></a>';
  el.live.appendChild(d);
  var L=[];if(ST.flow&&ST.flow.step)L.push({label:"Back to my estimate",cls:"pri",go:function(){resumeFlow()}});
  L.push({label:"Main menu",cls:"back",go:function(){home(false)}});chips(L);
};


/* ---------- AI layer (Claude via Make). Prices always come from the rate-card engine, never from the AI. ---------- */
function aiReady(){return !!SETTINGS.aiEndpoint&&!PREVIEW&&!ST.aiOff&&ST.ai<num(SETTINGS.aiMaxPerVisit||15)&&typeof fetch==="function"}
function looksLikeJob(t){
  var n=norm(t);
  if(n.split(" ").length<4)return false;
  return /\d+\s*(cartons?|ctns?|pallets?|boxes|box|drops?|outlets?|stores?|shops?|pcs|pieces|kg|deliveries|parcels|packages|drivers?|vans?|trucks?|lorr(y|ies)|bags?|trips?)\b/.test(n)
    ||/\bfrom\b.+\bto\b/.test(n)
    ||/\b(today|tomorrow|tmr|tmrw|next (mon|tues?|wed|thur?s?|fri|sat|sun)\w*|this (mon|tues?|wed|thur?s?|fri|sat|sun)\w*)\b/.test(n)&&/\b(deliver|send|move|collect|pick ?up|transport|need)\b/.test(n);
}
function plain(h){var d=document.createElement("div");d.innerHTML=h;return (d.textContent||"").replace(/\s+/g," ").trim()}
function transcript(latest){
  var L=[],m;
  for(var i=Math.max(0,ST.log.length-14);i<ST.log.length;i++){m=ST.log[i];if(m.w==="c")continue;var t=plain(m.h).replace(/^Step \d+ of \d+/,"").slice(0,500);if(t)L.push((m.w==="u"?"Visitor: ":"Assistant: ")+t)}
  /* the latest visitor message is already the last line of the log */
  if(!L.length||L[L.length-1]!=="Visitor: "+latest.slice(0,500))L.push("Visitor: "+latest.slice(0,500));
  var ctx="";
  if(ST.flow&&ST.flow.J&&ST.flow.J.svc){var s=curStep();ctx="[Context: the visitor is in the middle of an estimate for "+SERVICES[ST.flow.J.svc].ui+(s?"; the current question is \""+plain(s.q(ST.flow.J))+"\"":"")+".]\n"}
  /* personal identifiers never leave the page */
  return ("Website chat transcript (latest message last).\n"+ctx+L.slice(-12).join("\n"))
    .replace(/\b[STFGM]\d{7}[A-Z]\b/gi,"[ID number removed]").replace(/\b(?:\d[ -]?){13,19}\b/g,"[card number removed]");
}
var MONEY=/(S?\$\s?\d[\d,.]*|\bSGD\s?\d|\d+\s?(dollars|bucks|cents)\b)/gi;
function amounts(t){return (String(t||"").match(/\d[\d,]*(\.\d+)?/g)||[]).map(function(x){return x.replace(/,/g,"").replace(/\.0+$/,"")})}
function safeReply(r,visitor){
  r=String(r||"").replace(/[*_#`]+/g,"").replace(/\bconsignments?\b/gi,"jobs").trim();
  var own=amounts(visitor);
  var bad=(r.match(MONEY)||[]).filter(function(x){var a=amounts(x)[0];return !/^S?\$\s?100(\.00)?$/.test(x.replace(/\s/g,""))&&own.indexOf(a)<0});
  if(bad.length||/minimum (charge|fee|order)/i.test(r)&&!/priced on its own/i.test(r))return null;
  if(r.split(/\s+/).length>110)r=r.split(/\s+/).slice(0,100).join(" ")+"…";
  return r;
}
async function askAI(t){
  var typing=document.createElement("div");typing.className="msg bot typing";typing.innerHTML="<i></i><i></i><i></i>";el.msgs.appendChild(typing);scroll();
  var o=null;
  try{
    var ctl=typeof AbortController==="function"?new AbortController():null,timer=setTimeout(function(){if(ctl)ctl.abort()},num(SETTINGS.aiTimeout||25)*1000);
    var body=new URLSearchParams();body.set("conv",transcript(t));
    var res=await fetch(SETTINGS.aiEndpoint,{method:"POST",body:body,signal:ctl?ctl.signal:undefined});
    clearTimeout(timer);
    var txt=await res.text();o=JSON.parse(txt);
    if(!o||o.error||typeof o.reply!=="string")o=null;
  }catch(e){o=null}
  typing.remove();
  /* a garbled or near-empty reply (rare) is not shown: the approved FAQ answers instead */
  if(o&&!(o.reply.trim().length>=12||/[\u3000-\u9fff\uac00-\ud7af]{4}/.test(o.reply)))return false;
  if(!o){ST.aiFails=(ST.aiFails||0)+1;if(ST.aiFails>=2)ST.aiOff=true;save();return false}
  ST.ai++;ST.aiFails=0;if(o.unanswered)ST.asked.push("[no approved answer] "+t);save();
  var reply=safeReply(o.reply,t);
  var job=o.intent==="estimate"||o.intent==="quote"?cleanJob(o.job||{}):null;
  if(!reply){
    /* the AI tried to talk money: use the approved pricing answer instead */
    await bot(linkify(FAQ[I_COST].a),200);
    if(job&&job.svc){await startFlowWith(job);return true}
    setLive("after",{i:I_COST});return true;
  }
  await bot(linkify(esc(reply)).replace(/&amp;/g,"&"),150);
  if(job&&job.svc){await startFlowWith(job);return true}
  if(o.intent==="estimate"||o.intent==="quote"){
    if(ST.flow&&ST.flow.step){setLive("resume");return true}
    if(ST.flow&&ST.flow.done&&o.intent==="quote"){setLive("estimate");return true}
    clearLive();ST.flow={J:{},step:null,hist:[],done:false};ST.lead=null;save();await ask("svc");return true;
  }
  if(o.intent==="handoff"){setLive("handoff");return true}
  setLive("aiafter",{join:/Join Our Team/i.test(reply)});return true;
}
LIVE.aiafter=function(a){
  var L=[];
  if(a&&a.join&&SETTINGS.careersUrl&&!(ST.flow&&ST.flow.step)){
    chips([{label:"Open Join Our Team page",cls:"pri",go:function(){window.open(SETTINGS.careersUrl,"_blank","noopener")}},{label:"Main menu",cls:"back",go:function(){home(false)}}]);return;
  }
  if(ST.flow&&ST.flow.step)L.push({label:"Back to my estimate",cls:"pri",go:function(){resumeFlow()}});
  else L.push({label:"Get an estimate",cls:"pri",go:function(){me("Get an estimate");startFlow()}});
  L.push({label:"Talk to a person",go:function(){me("Talk to a person");handoff()}});
  if(!(ST.flow&&ST.flow.step))L.push({label:"Main menu",cls:"back",go:function(){home(false)}});
  chips(L);
};
/* keep only answers the estimate's own questions would accept */
function cleanJob(j){
  var J={},ok=function(list,v){return list.some(function(x){return x[0]===v})};
  var v=function(k){return typeof j[k]==="string"?j[k].trim():""};
  if(SERVICES[v("svc")])J.svc=v("svc");else return J;
  var probe=function(id,val){var s=stepById(id);if(!s||val==="")return;var T=Object.assign({},J);if(s.when&&!s.when(T))return;
    if(s.type==="num"){var n=parseInt(val,10);if(n>0&&n<100000)J[id]=String(n);return}
    if(s.type==="date"){if(/^\d{4}-\d{2}-\d{2}$/.test(val)&&val>=isoAdd(0)&&val<=isoAdd(365))J[id]=val;return}
    if(s.type==="text"){if(!BANNED.test(val))J[id]=val.slice(0,160);return}
    if(s.opts&&ok(s.opts(J),val))J[id]=val};
  ["kind","withVeh","hireUnit","dps","temp","vehicle","date","days","perDay","drops","lmDrops","colArea","delArea","goods"].forEach(function(k){probe(k,v(k))});
  return J;
}
async function startFlowWith(J){
  clearLive();
  /* a job already under way for the same service keeps its answers; the AI only fills gaps */
  if(ST.flow&&ST.flow.J&&ST.flow.J.svc===J.svc&&!ST.flow.done){var K=ST.flow.J;Object.keys(J).forEach(function(k){if(K[k]===undefined)K[k]=J[k]});J=K}
  ST.flow={J:J,step:null,hist:[],done:false};ST.lead=null;save();
  var nx=nextStepId(J,null);
  if(nx)return ask(nx);
  ST.flow.done=true;save();return showEstimate();
}

/* ---------- free text ---------- */
function onText(t){
  var s=curStep();
  if(ST.live&&ST.live.n==="step"&&s){
    if(s.type==="text"&&!/\?\s*$/.test(t))return answerStep(s,t,t);
    if(s.type==="num"){var n=parseInt(t.replace(/[^\d]/g,""),10);if(/^\s*[\d,\s]+\s*(drops?|days?|weeks?|months?|people|pax|persons?|deliveries)?\s*$/i.test(t)&&n>0)return answerStep(s,String(n),t)}
    if(s.type==="date"){var dt=parseDate(t);if(dt)return answerStep(s,dt,t)}
    var opts=stepOpts(s),nt=norm(t),hits=opts.filter(function(o){var l=norm(o[1]);return l===nt||(nt.length>2&&(" "+l+" ").indexOf(" "+nt+" ")>=0)});
    if(hits.length===1)return answerStep(s,hits[0][0],t);
  }
  question(t);
}
function parseDate(t){
  var n=norm(t);if(/^today$/.test(n))return isoAdd(0);if(/^tomorrow$/.test(n))return isoAdd(1);
  var m=n.match(/^(\d{1,2})[ /\-.](\d{1,2})[ /\-.](\d{2,4})$/);if(m){var y=+m[3];if(y<100)y+=2000;return y+"-"+pad(+m[2])+"-"+pad(+m[1])}
  return null;
}
function question(t){run(async function(){
  me(t);ST.asked.push(t);save();clearLive();
  var n=norm(t);
  if(/^(hi|hello|hey|hai|yo|good (morning|afternoon|evening)|morning)( there)?[!. ]*$/.test(n)){await bot("Hello! How can I help?",300);return setLive(ST.flow&&ST.flow.step?"resume":"home")}
  if(/^(ok|okay|thanks?|thank you|thx|ty|great|cool|noted|alright)\b/.test(n)&&n.length<30){await bot("You're welcome. Anything else I can help with?",300);return setLive(ST.flow&&ST.flow.step?"resume":"home")}
  var R=score(t),b=R[0],c=R[1];
  if(/\b(human|real person|real people|agent|someone|somebody|staff|speak to|talk to|call me|live chat|representative)\b/.test(n)&&!/\b(hours?|open)\b/.test(n)&&b.s<6)return handoffBody();
  /* job descriptions and anything the approved FAQ can't match go to the AI, when it's available */
  /* with the AI on, the FAQ answers directly only when every word of the question is in its vocabulary
     ("are your reefer trucks halal certified?" must not get the fleet answer) */
  if(aiReady()&&(looksLikeJob(t)||!confident(R,t)||unknown(t)>0)){if(await askAI(t))return}
  if(confident(R,t)){
    var rel=(c&&c.s>=3&&c.s>=b.s*0.8)?c.x.i:null;
    await bot(linkify(b.x.f.a));
    if(BANNED.test(t)&&b.x.f.t!=="goods"){await bot(linkify(FAQ[I_NOCARRY].a),300)}
    return setLive("after",{i:b.x.i,rel:rel});
  }
  if(BANNED.test(t)){await bot(linkify(FAQ[I_NOCARRY].a));return setLive("after",{i:I_NOCARRY})}
  if(b.s>=1.5){await bot("I want to get this right. Did you mean one of these?",350);return setLive("maybe",R.slice(0,3).filter(function(r){return r.s>=1}).map(function(r){return r.x.i}))}
  if(/\b(quote|quotation|estimate|price|cost|how much|rate|book|booking)\b/.test(n)){await bot(linkify(FAQ[I_COST].a));return setLive("after",{i:I_COST})}
  await bot("I don't have an approved answer for that, so I won't guess. Our team can answer it personally.",400);
  setLive("handoff");
})}
LIVE.maybe=function(ids){
  chips(ids.map(function(i){return {label:FAQ[i].q,go:function(){me(FAQ[i].q);answer(i)}}}),"qlist");
  chips([{label:"None of these, talk to a person",go:function(){me("Talk to a person");handoff()}}]);
};
LIVE.resume=function(){chips([{label:"Back to my estimate",cls:"pri",go:function(){resumeFlow()}},{label:"Main menu",cls:"back",go:function(){ST.flow=null;home(false)}}])};

/* ---------- estimate / booking flow ---------- */
var ZONECHIPS=function(){return CFG().zones.map(function(z){return [z[0],z[1]]}).concat([["?","Not sure"]])};
var STEPS=[
  {id:"svc",type:"tiles",q:function(){return "What would you like us to deliver?"},opts:function(){return Object.keys(SERVICES).map(function(k){return [k,SERVICES[k].ui,SERVICES[k].sub]})}},
  {id:"kind",when:function(J){return J.svc!=="outdrive"},q:function(){return "Is this a one-off job or a regular arrangement?"},opts:function(){return [["adhoc","One-off (ad-hoc)"],["regular","Regular (scheduled)"]]}},
  {id:"withVeh",when:function(J){return J.svc==="outdrive"},q:function(){return "Do you need our vehicle too, or only the driver?"},opts:function(){return [["yes","Driver with our vehicle"],["no","Driver only, for your vehicle"]]}},
  {id:"hireUnit",when:function(J){return J.svc==="outdrive"},q:function(){return "How would you like to hire?"},opts:function(){return [["day","By the day"],["week","By the week"],["month","By the month"]]}},
  {id:"duration",type:"num",when:function(J){return J.svc==="outdrive"&&J.hireUnit!=="month"},q:function(J){return "For how many "+J.hireUnit+"s?"},opts:function(J){return J.hireUnit==="week"?[["1","1"],["2","2"],["3","3"],["4","4"]]:[["1","1"],["2","2"],["3","3"],["5","5"]]}},
  {id:"dps",when:function(J){return J.svc==="outdrive"},q:function(){return "How many delivery personnel do you need?"},opts:function(){return [["1","1"],["2","2"],["3","3"],["4","More than 3"]]}},
  {id:"temp",when:function(J){return J.svc==="reefer"||J.svc==="lastmile"||(J.svc==="outdrive"&&J.withVeh==="yes")},q:function(J){return J.svc==="reefer"?"Chilled or frozen?":J.svc==="lastmile"?"What temperature are the goods?":"What will they carry?"},
    opts:function(J){return J.svc==="reefer"?[["chilled","Chilled (2–8 °C)"],["frozen","Frozen (−18 °C)"],["mixed","Both chilled and frozen"]]:[["ambient","Normal (ambient)"],["chilled","Chilled (2–8 °C)"],["frozen","Frozen (−18 °C)"]]}},
  {id:"vehicle",when:function(J){return J.svc==="reefer"||J.svc==="van"||J.svc==="courier"||(J.svc==="outdrive"&&J.withVeh==="yes")},q:function(){return "Which vehicle?"},
    opts:function(J){var cold=isCold(J);if(J.svc==="courier")return [["moto","Motorcycle"],["van","Van"]];
      if(cold)return [["","Let CMS decide"],["l10","10 ft reefer truck"],["l14","14 ft reefer truck"]];
      return [["","Let CMS decide"],["van","Van"],["l10","10 ft truck"],["l14","14 ft truck"],["t24","24 ft truck"]]}},
  {id:"date",type:"date",q:function(J){return J.svc==="outdrive"?"When should they start?":J.kind==="regular"?"When would you like to start?":"Which date is the job?"}},
  {id:"days",when:function(J){return J.svc!=="outdrive"&&J.kind==="regular"},q:function(){return "Which days do you need us?"},opts:function(){return DAYS}},
  {id:"ph",when:function(J){return J.svc!=="outdrive"&&J.kind==="regular"},q:function(){return "Including public holidays?"},opts:function(){return [["no","No"],["yes","Yes"]]}},
  {id:"perDay",when:function(J){return J.svc!=="outdrive"&&J.kind==="regular"},q:function(J){return J.svc==="courier"?"About how many jobs a day?":"About how many drops a day?"},opts:function(){return PERDAY.map(function(p){return [p[0],p[1]]})}},
  {id:"drops",when:function(J){return J.kind==="adhoc"&&modelOf(J)==="trip"},q:function(){return "How many drop-off points?"},opts:function(){return ADDROPS.map(function(p){return [p[0],p[1]]})}},
  {id:"lmDrops",type:"num",when:function(J){return J.kind==="adhoc"&&J.svc==="lastmile"},q:function(){return "How many drops (deliveries) in total?"},opts:function(){return [["20","20"],["50","50"],["100","100"],["200","200"]]}},
  {id:"colArea",when:function(J){return modelOf(J)==="trip"},q:function(){return "Where do we collect from?"},opts:ZONECHIPS},
  {id:"delArea",when:function(J){return modelOf(J)==="trip"&&dropsOf(J)===1},q:function(){return "And where does it go?"},opts:ZONECHIPS},
  {id:"speed",when:function(J){return modelOf(J)==="trip"&&J.kind==="adhoc"&&!isCold(J)},q:function(){return "How soon should it arrive?"},opts:function(){return [["standard","Next working day"],["sameday","Same day"],["express4","Within 4 hours"],["express2","Within 2 hours"],["economy","2 to 3 working days"]]}},
  {id:"window",when:function(J){return J.svc!=="outdrive"},q:function(){return "Any delivery time window?"},opts:function(){return [["9-9","Anytime 9am to 9pm (standard)"],["9-6","9am to 6pm"],["9-10","9am to 10pm"],["4h","A 4-hour window"],["appt","A fixed appointment time"]]}},
  {id:"pieces",when:function(J){return J.svc==="courier"},q:function(){return "How many pieces?"},opts:function(){return PIECES.map(function(p){return [p[0],p[1]]})}},
  {id:"pWeight",when:function(J){return J.svc==="lastmile"},q:function(){return "Typical weight per parcel?"},opts:function(){return WEIGHT_PCL.map(function(p){return [p[0],p[1]]})}},
  {id:"handling",when:function(J){return J.svc==="reefer"||J.svc==="van"},q:function(){return "Anything special about the load?"},opts:function(){return [["none","Nothing special"],["bulky","Bulky or odd-sized"],["fragile","Fragile"],["helper","Needs an extra helper"]]}},
  {id:"goods",type:"text",q:function(J){return J.svc==="outdrive"?"Briefly, what will they do? For example your working hours, drops a day and type of goods.":"What are you sending, and roughly how much?"},
    hintf:function(J){return J.svc==="outdrive"?"e.g. Mon to Sat, 8am to 5pm, about 40 drops a day":J.svc==="courier"?"e.g. 2 envelopes of documents":"e.g. 20 cartons of frozen meat, about 300 kg"}}
];
function stepById(id){return STEPS.filter(function(s){return s.id===id})[0]}
function curStep(){return ST.flow&&ST.flow.step?stepById(ST.flow.step):null}
function stepOpts(s){return s.opts?s.opts(ST.flow.J):[]}
function activeSteps(J){return STEPS.filter(function(s){return !s.when||s.when(J)})}
function nextStepId(J,after){var A=activeSteps(J),seen=after==null;for(var i=0;i<A.length;i++){if(seen&&J[A[i].id]===undefined)return A[i].id;if(A[i].id===after)seen=true}
  for(var j=0;j<A.length;j++)if(J[A[j].id]===undefined)return A[j].id;return null}
function startFlow(){run(async function(){
  clearLive();ST.flow={J:{},step:null,hist:[],done:false};ST.lead=null;save();
  await bot("Let's work out an estimate. A few quick taps, and you can ask me a question at any point.",380);
  await ask("svc");
})}
async function ask(id){
  var F=ST.flow;F.step=id;var s=stepById(id),A=activeSteps(F.J),n=A.indexOf(s)+1;
  await bot('<span class="stepn">Step '+n+' of '+A.length+'</span>'+esc(s.q(F.J)),300);
  setLive("step");
}
function resumeFlow(){run(async function(){me("Back to my estimate");clearLive();var s=curStep();if(!s)return;await bot("Sure. "+esc(s.q(ST.flow.J)),300);setLive("step")})}
LIVE.step=function(){
  var F=ST.flow,s=curStep();if(!s)return;
  var opts=stepOpts(s),back=F.hist.length?[{label:"‹ Back",cls:"back",go:function(){goBack()}}]:[];
  if(s.type==="tiles"){
    var t=document.createElement("div");t.className="tiles svc";
    opts.forEach(function(o){var b=document.createElement("button");b.type="button";b.className="tile t-"+o[0];
      b.innerHTML='<span class="ti">'+(o[0]==="reefer"?ICON.snow:o[0]==="outdrive"?ICON.person:ICON.calc)+'</span><span><b>'+esc(o[1])+'</b><small>'+esc(o[2])+'</small></span><span class="chev">'+ICON.chev+'</span>';
      b.addEventListener("click",function(){if(!busy)answerStep(s,o[0],o[1])});t.appendChild(b)});
    el.live.appendChild(t);chips([{label:"Main menu",cls:"back",go:function(){ST.flow=null;save();home(false)}}]);return;
  }
  if(s.type==="date"){
    chips([{label:"Today",go:function(){answerStep(s,isoAdd(0),"Today")}},{label:"Tomorrow",go:function(){answerStep(s,isoAdd(1),"Tomorrow")}},{label:"Not sure yet",go:function(){answerStep(s,"","Not sure yet")}}]);
    var d=document.createElement("form");d.className="datepick";d.innerHTML='<label><span>Or pick a date</span><input type="date" min="'+isoAdd(0)+'" required></label><button type="submit" class="btn sm">OK</button>';
    d.addEventListener("submit",function(e){e.preventDefault();var v=d.querySelector("input").value;if(v&&!busy)answerStep(s,v,fiso(v))});
    el.live.appendChild(d);if(back.length)chips(back);return;
  }
  if(s.type==="text"){
    var g=document.createElement("p");g.className="hint";g.textContent="Type it below. "+(s.hintf?s.hintf(F.J):"");el.live.appendChild(g);
    s.hint=s.hintf?s.hintf(F.J):"";if(back.length)chips(back);
    setTimeout(function(){el.input.focus()},50);return;
  }
  chips(opts.map(function(o){return {label:o[1],go:function(){answerStep(s,o[0],o[1])}}}),opts.length>5?"grid":"");
  if(back.length)chips(back);
};
function answerStep(s,val,label){run(async function(){
  var F=ST.flow;me(label);clearLive();
  if(s.id==="goods"&&BANNED.test(val)&&!F.bannedOk){
    F.pendingGoods=val;save();
    await bot("Just to check: "+linkify(FAQ[I_NOCARRY].a).replace(/^Yes\. /,""),400);
    return setLive("banned");
  }
  F.hist.push({step:s.id,J:JSON.parse(JSON.stringify(F.J))});
  F.J[s.id]=val;
  /* answers that no longer apply are cleared when an earlier answer changes */
  Object.keys(F.J).forEach(function(k){var st=stepById(k);if(st&&st.when&&!st.when(F.J))delete F.J[k]});
  if(s.id==="temp"||s.id==="svc")delete F.J.vehicle,delete F.J.speed;
  save();
  if(s.id==="date"&&val&&kindOf(F.J)==="adhoc"){var di=dayInfo(val);if(di.sun||di.ph)await bot("Noted: that's a "+(di.ph?"public holiday":"Sunday")+". We deliver on weekends and public holidays; surcharges may apply.",350)}
  var nx=nextStepId(F.J,s.id);
  if(nx)return ask(nx);
  F.step=null;F.done=true;save();
  await showEstimate();
})}
LIVE.banned=function(){
  chips([{label:"Change what I'm sending",go:function(){run(async function(){me("Change what I'm sending");clearLive();await bot(esc(stepById("goods").q(ST.flow.J)),250);setLive("step")})}},
    {label:"It's none of these, continue",go:function(){var F=ST.flow;F.bannedOk=true;answerStep(stepById("goods"),F.pendingGoods,"It's none of these, continue")}}]);
};
function goBack(){run(async function(){
  var F=ST.flow,h=F.hist.pop();if(!h)return;me("Back");clearLive();
  F.J=h.J;F.step=h.step;F.done=false;save();
  var s=stepById(h.step),A=activeSteps(F.J);
  await bot('<span class="stepn">Step '+(A.indexOf(s)+1)+' of '+A.length+'</span>'+esc(s.q(F.J)),250);setLive("step");
})}
function priceLine(o){
  var C=CFG(),v=num(C.variancePct)/100,per=o.monthly?" a month":"";
  if(o.tier==="range")return moneyR(Math.floor(o.total*(1-v)*100)/100)+" – "+moneyR(Math.ceil(o.total*(1+v)*100)/100)+per+" incl. GST";
  return money(o.total)+per+" incl. GST";
}
async function showEstimate(){
  var J=ST.flow.J,o=calc(J),C=CFG(),v=num(C.variancePct)/100,S=SERVICES[J.svc],h;
  var unitTxt=o.unit.replace(/^per /,"");
  var badge=o.tier==="exact"?"Estimate":o.tier==="range"?"Estimate · range":"Tailored proposal";
  if(o.tier==="tailored"){
    h='<div class="big">Tailored proposal<small>Because of its size or the vehicles involved, our team prices this job personally.</small></div>';
  }else if(o.tier==="range"){
    var lo=Math.floor(o.total*(1-v)*100)/100,hi=Math.ceil(o.total*(1+v)*100)/100,rl=Math.floor(o.rate*(1-v)*100)/100,rh=Math.ceil(o.rate*(1+v)*100)/100;
    h='<div class="big">'+moneyR(lo)+' – '+moneyR(hi)+'<small>'+(o.monthly?"a month, ":"")+'incl. GST'+(o.qty>1||o.monthly?' · about '+money(rl)+' – '+money(rh)+' '+esc(o.unit)+' before GST':'')+'</small></div>';
  }else{
    h='<div class="big">'+money(o.total)+'<small>incl. GST · '+money(o.sub)+' before GST'+(o.qty>1?' · '+o.qty+' '+(unitTxt==="DP"?"personnel":unitTxt+"s")+' at '+money(o.rate)+' each':'')+'</small></div>';
  }
  var notes=[];
  if(o.tier==="range")notes.push("Shown as a range of about ±"+num(C.variancePct)+"% until we confirm details such as access, waiting time and load.");
  if(J.speed==="express2"||J.speed==="express4"||J.speed==="sameday")notes.push("Urgent and same-day jobs depend on availability; we'll confirm quickly.");
  notes.push("This is an estimate, not a quotation. Our team sends a formal quotation from "+SETTINGS.quoteEmail+" within one working day.");
  var card='<div class="est"><div class="eh"><b>'+esc(S.ui)+' · '+(kindOf(J)==="adhoc"?"one-off":"regular")+'</b><span>'+badge+'</span></div>'+h+
    '<ul>'+o.specs.slice(0,6).map(function(s){return "<li>"+esc(s)+"</li>"}).join("")+'</ul><p class="note">'+notes.map(esc).join("<br>")+'</p></div>';
  await bot(o.tier==="tailored"?"Thanks. Here's where this one lands:":"Here's your estimate:",450);
  push("c",card);
  setLive("estimate");
}
LIVE.estimate=function(){
  var o=calc(ST.flow.J);
  chips([{label:o.tier==="tailored"?"Send details for a tailored proposal":"Request a formal quotation or booking",cls:"pri",go:function(){me(o.tier==="tailored"?"Send details for a tailored proposal":"Request a formal quotation or booking");details()}},
    {label:"Change an answer",go:function(){ST.flow.done=false;goBack()}},
    {label:"Talk to a person",go:function(){me("Talk to a person");handoff()}},
    {label:"New estimate",cls:"back",go:function(){me("New estimate");startFlow()}}]);
};
function details(){run(async function(){clearLive();await bot("Great. Where should our team send it? Fields marked * are needed.",350);setLive("form")})}
LIVE.form=function(){
  var c=ST.contact||{},f=document.createElement("form");f.className="dform";f.noValidate=true;
  var fld=function(n,l,type,req,ph,ac){return '<label><span>'+l+(req?' <i>*</i>':'')+'</span>'+(type==="area"?'<textarea name="'+n+'" rows="2" placeholder="'+esc(ph||"")+'">'+esc(c[n]||"")+'</textarea>':'<input name="'+n+'" type="'+type+'" value="'+esc(c[n]||"")+'" placeholder="'+esc(ph||"")+'"'+(ac?' autocomplete="'+ac+'"':'')+(type==="tel"?' inputmode="tel"':'')+'>')+'</label>'};
  var J=ST.flow.J,trip=modelOf(J)!=="hire";
  f.innerHTML=fld("name","Your name","text",1,"","name")+fld("company","Company (if any)","text",0,"","organization")+
    '<div class="two">'+fld("phone","Mobile","tel",1,"8 digits","tel")+fld("email","Email","email",1,"","email")+'</div>'+
    (trip?fld("pickup","Pickup address","area",0,"Street, unit, postal code")+fld("dropoff",J.svc==="lastmile"||dropsOf(J)>1?"Drop-off addresses (or say you'll send a list)":"Drop-off address","area",0,""):fld("pickup","Work location","area",0,"Where the personnel report"))+
    fld("notes","Anything else we should know?","area",0,"Access, timing, special handling")+
    '<input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">'+
    '<p class="err" hidden></p><p class="fine">We use these details only to reply to this enquiry.</p>'+
    '<div class="row"><button type="submit" class="btn pri">Send to CMS</button><button type="button" class="btn ghost cancel">Cancel</button></div>';
  f.addEventListener("submit",function(e){e.preventDefault();if(!busy)submit(f)});
  f.querySelector(".cancel").addEventListener("click",function(){if(busy)return;run(async function(){me("Cancel");clearLive();await bot("No problem. Your estimate is still above.",250);setLive("estimate")})});
  el.live.appendChild(f);
};
function readForm(f){var o={};["name","company","phone","email","pickup","dropoff","notes","website"].forEach(function(n){var x=f.querySelector('[name="'+n+'"]');o[n]=x?x.value.trim():""});return o}
function submit(f){run(async function(){
  var c=readForm(f),err=f.querySelector(".err"),miss=[];
  var ph=c.phone.replace(/[^\d+]/g,"");
  if(c.name.length<2)miss.push("your name");
  if(ph.replace(/\D/g,"").length<8)miss.push("a mobile number");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(c.email))miss.push("a valid email");
  if(miss.length){err.hidden=false;err.textContent="Please add "+miss.join(", ")+".";return}
  err.hidden=true;
  ST.contact={name:c.name,company:c.company,phone:c.phone,email:c.email};save();
  if(c.website){clearLive();me("Sent");await bot("Thank you. We'll be in touch.");return}
  var btn=f.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Sending…";
  var L=buildLead(c),ok=true;
  if(!PREVIEW&&SETTINGS.endpoint){try{await post(L)}catch(e){ok=false}}
  clearLive();me("Sent my details");
  if(!ok){
    await bot("Sorry, that didn't go through from this page. Please send it to us directly, quoting "+esc(L.ref)+"; your details are filled in.",400);
    ST.lead={ref:L.ref,failed:true};save();return setLive("handoff");
  }
  ST.lead={ref:L.ref,tier:L.tier};save();
  await bot("Thank you, "+esc(c.name.split(" ")[0])+". Your reference is <b>"+esc(L.ref)+"</b>."+(PREVIEW?' <span class="muted">(Preview: not sent.)</span>':''),400);
  await bot(L.tier==="tailored"?"Our team will contact you about a tailored proposal.":"Our team will send your formal quotation from "+linkify(SETTINGS.quoteEmail)+" within one working day.",450);
  setLive("sent");
})}
LIVE.sent=function(){
  var ref=ST.lead&&ST.lead.ref,txt="Hi CMS, following up on my chatbot enquiry "+ref+".";
  var d=document.createElement("div");d.className="hand";
  d.innerHTML='<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/'+SETTINGS.whatsapp+'?text='+encodeURIComponent(txt)+'">'+ICON.phone+'<span>Prefer WhatsApp? Message us</span></a>';
  el.live.appendChild(d);
  chips([{label:"Ask a question",go:function(){me("Ask a question");topics()}},{label:"New estimate",go:function(){me("New estimate");startFlow()}}]);
};

/* ---------- lead hand-off (same format as the website estimator, so Quote Desk can prepare the quotation) ---------- */
function newRef(){var n=sgNow(),A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r="";for(var i=0;i<4;i++)r+=A[Math.floor(Math.random()*A.length)];return "CB-"+pad(n.d)+pad(n.m)+String(n.y).slice(2)+"-"+r}
function fitJSON(F){var t=JSON.stringify(F);if(t.length<=1900)return t;var G=JSON.parse(t);G.est.description=[];t=JSON.stringify(G);if(t.length<=1900)return t;G.goods=String(G.goods||"").slice(0,200);return JSON.stringify(G).slice(0,1990)}
function buildLead(c){
  var C=CFG(),J=ST.flow.J,o=calc(J),S=SERVICES[J.svc],m=modelOf(J),kind=kindOf(J),type=kind==="adhoc"?"Ad-hoc":"Regular",di=dayInfo(J.date),ref=newRef();
  var temp=J.temp||"ambient",tempL=labelOf(TEMPS,temp);
  var vehL=J.svc==="outdrive"&&J.withVeh==="no"?"None (delivery personnel only)":(J.vehicle?rateOf(J).name:"Let CMS decide");
  var K=m==="trip"?tripKm(J):{km:"",known:false},pd=kind==="regular"&&m!=="hire"?dropsOf(J):0;
  var sunph=kind==="adhoc"?(di.ph?"Public holiday":di.sun?"Sunday":""):"";
  var speedL=m==="hire"?"":(isCold(J)?"Same day":speedOf(defSpeed(J)).name);
  var winL=J.svc==="outdrive"?"":labelOf(WINDOWS,J.window||"9-9");
  var shown=o.tier==="tailored"?"No price shown (tailored proposal needed)":o.tier==="range"?"Range shown: "+priceLine(o)+" (±"+num(C.variancePct)+"%)":"Single price shown: "+priceLine(o);
  var extras=[];if(J.handling&&J.handling!=="none")extras.push(J.handling);if(J.window==="appt")extras.push("eta");
  var formData={v:1,kind:kind,svc:S.est,tier:o.tier,variancePct:o.tier==="range"?num(C.variancePct):0,
    contact:{company:c.company,name:c.name,title:"",email:c.email,phone:c.phone,address:""},
    job:{temp:temp,speed:isCold(J)?"sameday":(m==="hire"?"":defSpeed(J)),vehicle:J.vehicle||"",
      from:zoneName(J.colArea),to:(m==="trip"&&dropsOf(J)===1)?zoneName(J.delArea):"",km:K.known?K.km:"",
      drops:m==="trip"?(kind==="adhoc"?o.qty:pd):0,perDay:pd,weightKg:m==="perdrop"?(pick(WEIGHT_PCL,J.pWeight)||""):"",pieces:J.svc==="courier"?(pick(PIECES,J.pieces)||""):"",
      handling:(J.handling==="bulky"||J.handling==="fragile")?J.handling:"none",helpers:J.handling==="helper"?1:0,
      hireUnit:m==="hire"?J.hireUnit:"",withVeh:m==="hire"?J.withVeh:"",duration:m==="hire"?(kind==="regular"?1:num(J.duration)||1):"",vehicles:m==="hire"?num(J.dps):"",bags:"",
      date:J.date||"",sunph:sunph},
    goods:J.goods||"",extras:extras,profile:m==="hire"?{clientVeh:"",lines:[]}:null,
    est:{rate:o.tier==="tailored"?0:o.rate,unit:o.unit,qty:o.qty,monthly:o.monthly,description:o.specs}};
  var details=["Stage: formal quotation requested (website chatbot)",shown,"Service: "+S.label+" ("+type+")","Temperature: "+tempL,"Vehicle: "+vehL].concat(o.specs,[
    "Calculated: "+money(o.rate)+" "+o.unit+(o.qty!==1?" × "+o.qty:"")+(o.extras.length?" + "+o.extras.map(function(x){return x[0]+" "+money(x[1])}).join(", "):"")+" = "+money(o.sub)+" + GST = "+money(o.total)+(o.monthly?" per month":""),
    o.floor?"Priced at the reefer floor (S$"+num(C.reeferFloor)+" a drop on average)":"",o.unknownArea?"Area not given: priced on a typical "+num(C.multiDropKm)+" km route":""]).filter(Boolean).join("\n");
  var addr=[c.pickup?(m==="hire"?"Work location: ":"Collection: ")+c.pickup:"",c.dropoff?"Delivery: "+c.dropoff:""].filter(Boolean).join("\n");
  var notes=[c.notes,ST.asked.length?"Questions asked in the chat: "+ST.asked.slice(-8).join(" | "):""].filter(Boolean).join("\n\n");
  var phone=c.phone.replace(/[^\d+]/g,"");if(/^\d{8}$/.test(phone))phone="+65"+phone;if(/^65\d{8}$/.test(phone))phone="+"+phone;
  var cv={color_mm8drmn4:{label:"New"},color_mm8dfzk:{label:type},color_mm8d11pg:{label:S.label},color_mm8dw06e:{label:tempL},color_mm8w7r5g:{label:"Chatbot"},
    text_mm8d5rjq:ref,text_mm8dahtk:c.company,text_mm8dza4g:c.name,email_mm8dex6m:{email:c.email,text:c.email},
    text_mm8d60xs:kind==="regular"&&m!=="hire"?labelOf(DAYS,J.days)+", PH "+(J.ph==="yes"?"included":"excluded"):sunph,
    text_mm8d2p4v:[speedL,winL].filter(Boolean).join(" · "),
    numeric_mm8d3xj0:o.tier==="tailored"?"":String(o.rate),numeric_mm8dzwyb:o.tier==="tailored"?"":String(o.total),numeric_mm8xmw84:o.tier==="tailored"?"":String(o.sub),
    text_mm8xy1ta:pd?String(pd):"",text_mm8w6ez7:"Reply within 15 minutes, then quote in Quote Desk",
    long_text_mm8da67x:{text:details},long_text_mm8dvs1n:{text:addr},long_text_mm8ddf96:{text:notes},long_text_mm8dtknz:{text:fitJSON(formData)}};
  if(/^\+\d{8,15}$/.test(phone))cv.phone_mm8dwrm1={phone:phone,countryShortName:phone.indexOf("+65")===0?"SG":(phone.indexOf("+60")===0?"MY":"SG")};
  if(J.date)cv.date_mm8dxqmq={date:J.date};
  var row=function(k,v){return v?'<tr><td style="padding:4px 12px 4px 0;color:#5b6475;vertical-align:top">'+esc(k)+'</td><td style="padding:4px 0">'+esc(v).replace(/\n/g,"<br>")+'</td></tr>':""};
  var html='<div style="font-family:Arial,sans-serif;font-size:14px;color:#17202e"><h2 style="color:#16386b;margin:0 0 8px">Chatbot enquiry · '+esc(type)+' '+esc(ref)+'</h2><p style="margin:0 0 8px;color:#5b6475">Sent from the website chatbot. The visitor asked for a '+(o.tier==="tailored"?"tailored proposal":"formal quotation")+'.</p><table>'+row("Company",c.company)+row("Contact",c.name)+row("Email",c.email)+row("Phone",c.phone)+row("Service",S.label)+row("Details",details)+row("Addresses",addr)+row("Notes",notes)+'</table></div>';
  var name=((c.company||c.name)+" · "+S.label+" ("+type+")").slice(0,250);
  return {ref:ref,tier:o.tier,stage:"formal",type:type,service:S.label,company:c.company||c.name,itemName:name,columnValues:JSON.stringify(cv),
    columnValuesUpdate:JSON.stringify(Object.assign({name:name},cv)),subject:"Chatbot enquiry "+ref+" – "+(c.company||c.name)+" ("+S.label+", "+type+")",emailHtml:html,
    payload:{source:"chatbot",stage:"formal",ref:ref,submitted:new Date().toISOString(),type:type,service:S.label,contact:{company:c.company,name:c.name,email:c.email,phone:c.phone},
      job:J,addresses:addr,notes:notes,estimate:{shown:o.tier,variancePct:o.tier==="range"?num(C.variancePct):0,rate:o.rate,unit:o.unit,qty:o.qty,monthly:o.monthly,extras:o.extras,subtotal:o.sub,gst:o.gst,total:o.total,description:o.specs},page:location.href}};
}
function post(L){
  var f=new URLSearchParams();
  f.set("source","Chatbot");f.set("stage",L.stage);f.set("type",L.type);f.set("ref",L.ref);f.set("company",L.company);f.set("service",L.service);
  f.set("itemName",L.itemName);f.set("columnValues",L.columnValues);f.set("columnValuesUpdate",L.columnValuesUpdate);
  f.set("subject",L.subject);f.set("emailHtml",L.emailHtml);f.set("photos","[]");f.set("payload",JSON.stringify(L.payload));
  return fetch(SETTINGS.endpoint,{method:"POST",mode:"no-cors",body:f});
}

/* ---------- start ---------- */
function init(){
  if(document.getElementById("cms-chatbot"))return;
  load();build();
  if(ST.open&&window.innerWidth>560)toggle(true);
  var sec=num(SETTINGS.nudgeAfter);
  if(sec>0&&!ST.nudged&&!ST.log.length)setTimeout(function(){if(el.panel.hidden&&!ST.nudged){el.nudge.hidden=false}},sec*1000);
  window.CMSChat={open:function(){toggle(true)},close:function(){toggle(false)},estimate:function(){var fresh=!ST.log.length;toggle(true,fresh);if(fresh||!(ST.flow&&ST.flow.step))startFlow()},_calc:calc,_score:score,_faq:FAQ,_build:function(c){return buildLead(c)},_st:ST};
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
