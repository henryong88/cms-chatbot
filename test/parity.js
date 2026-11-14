/* Runs the website estimator's own calc() and the chatbot's calc() on the same jobs and compares. */
const fs=require("fs"),path=require("path");
const EST=process.argv[2];
const html=fs.readFileSync(EST,"utf8");
const a=html.indexOf("window.CMS_QF_CONFIG = {"),b=html.indexOf("/* ---------- step 1 ---------- */");
let src=html.slice(a,b);
const stubRoot={querySelector:()=>null,querySelectorAll:()=>[]};
const estFactory=new Function("window","document",`
  ${src.replace('const C=window.CMS_QF_CONFIG, root=document.getElementById("cms-qf");','const C=window.CMS_QF_CONFIG, root=document.getElementById("cms-qf");')}
  return {calc,set:(s,k,j)=>{svc=s;kind=k;J=j},newJob:()=>newJob()};
`.replace('(function(){\n"use strict";',''));
/* the slice starts inside an IIFE; strip the IIFE opener so the body runs in our function */
const win={},doc={getElementById:()=>stubRoot};
let est;
try{est=estFactory(win,doc)}catch(e){console.error("estimator load failed",e);process.exit(1)}

/* chatbot engine */
const S=path.join(__dirname,"..","src");
const botSrc=["main.js","faq.js","engine.js"].map(f=>fs.readFileSync(path.join(S,f),"utf8")).join("\n");
const bot=new Function("window",botSrc+"\nreturn {calc,CFG,SERVICES,dropsOf};")({});

const Z=["C","E","NE","N","W","FW","CA","S"];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
let fails=0,n=0,floorHits=0,tiers={};
function cmp(label,cb,eb,o,e,expRate){
  n++;
  const close=(x,y)=>Math.abs(x-y)<0.011;
  const expAmt=expRate===e.rate?e.amount:Math.round((expRate*e.qty+e.extras.reduce((a,x)=>a+x[1],0))*100)/100;
  const ok=close(o.rate,expRate)&&o.qty===e.qty&&o.tier===e.tier&&o.monthly===e.monthly&&close(o.amount,expAmt)&&close(o.total,Math.round(expAmt*1.09*100)/100);
  tiers[o.tier]=(tiers[o.tier]||0)+1;
  if(!ok){fails++;if(fails<15)console.log("MISMATCH",label,JSON.stringify(cb),"\n bot",o.rate,o.qty,o.tier,o.total,"\n est",e.rate,e.qty,e.tier,e.total,"exp",expRate)}
}
for(let i=0;i<6000;i++){
  const type=rnd(["reefer","van","courier","lastmile","outdrive"]);
  const kind=rnd(["adhoc","regular"]);
  const date=rnd(["","2026-11-10","2026-11-15","2026-12-25","2026-11-12"]);
  if(type==="reefer"||type==="van"||type==="courier"){
    const temp=type==="reefer"?rnd(["chilled","frozen","mixed"]):"ambient";
    const vehicle=type==="courier"?rnd(["moto","van"]):(temp!=="ambient"?rnd(["","l10","l14"]):rnd(["","van","l10","l14","t24"]));
    const col=rnd(Z),del=rnd(Z);
    const handling=type==="courier"?"none":rnd(["none","bulky","fragile","helper"]);
    const pieces=type==="courier"?rnd(["1","2-3","4-5","6-10","11-30"]):"";
    const speed=rnd(["standard","sameday","express4","express2","economy"]);
    const window_=rnd(["9-9","9-6","appt"]);
    const cb={svc:type,kind,temp,vehicle,colArea:col,handling,pieces,speed,window:window_,goods:"x"};
    const esvc=type==="courier"?"courier":"van";est.set(esvc,kind,{});
    const J=est.newJob();est.set(esvc,kind,J);
    Object.assign(J,{temp,vehicle,speed,window:window_,goods:"x",pieces:"",piecesExact:"",extras:{}});
    if(pieces)J.pieces=pieces==="1"?"1":pieces;
    if(handling==="bulky")J.extras.bulky=true;if(handling==="fragile")J.extras.fragile=true;if(handling==="helper"){J.extras.helper=true;J.helpers=1}
    if(kind==="adhoc"){
      const drops=rnd(["1","2-5","6-10","11-20","21-30",">30"]);cb.drops=drops;cb.date=date;
      if(drops==="1")cb.delArea=del;
      J.date=date;J.colArea=col;J.adDrops={"1":"1","2-5":"2-5","6-10":"6-10","11-20":"11-20","21-30":"21-30",">30":"31-50"}[drops];
      J.drops=[{name:"",addr:"",area:drops==="1"?del:""}];
    }else{
      const pd=rnd(["1","2-10","11-20","21-30","31-50","51-100"]);const days=rnd(["monfri","monsat","monsun"]),ph=rnd(["yes","no"]);
      Object.assign(cb,{perDay:pd,days,ph});if(pd==="1")cb.delArea=del;
      Object.assign(J,{perDay:pd,days,ph,colAreaR:col,delArea:pd==="1"?del:""});
    }
    if(type!=="courier"&&!(temp!=="ambient"))J.speed=speed;
    if(kind==="regular"){J.speed=type==="courier"?"sameday":"standard";delete cb.speed}
    if(temp!=="ambient")delete cb.speed;
    const e=est.calc();const o=bot.calc(cb);
    let exp=e.rate;
    if(kind==="regular"&&temp!=="ambient"&&type!=="courier"&&exp<25){exp=25;floorHits++}
    /* the estimator maps 31-50 drops to 40 and calls it tailored; the chatbot's "More than 30" does the same */
    cmp(type+"/"+kind,cb,J,o,e,exp);
  }else if(type==="lastmile"){
    const temp=rnd(["ambient","chilled","frozen"]),w=rnd(["<1","1-5","5-10","10-20","20-50"]);
    est.set("lastmile",kind,{});const J=est.newJob();est.set("lastmile",kind,J);Object.assign(J,{temp,weight:w,weightExact:"",date,window:"9-9"});
    const cb={svc:"lastmile",kind,temp,pWeight:w,date,window:"9-9",goods:"x"};
    if(kind==="adhoc"){const q=rnd([5,20,50,120,301]);J.lmDrops=q;cb.lmDrops=q}
    else{const pd=rnd(["2-10","11-20","51-100","101-200",">200"]);const days=rnd(["monfri","monsat","monsun"]),ph=rnd(["yes","no"]);Object.assign(J,{perDay:pd,days,ph});Object.assign(cb,{perDay:pd,days,ph})}
    const e=est.calc(),o=bot.calc(cb);cmp("lastmile/"+kind,cb,J,o,e,e.rate);
  }else{
    const withVeh=rnd(["yes","no"]),unit=rnd(["day","week","month"]),dps=rnd(["1","2","3","4"]),temp=withVeh==="yes"?rnd(["ambient","chilled","frozen"]):"ambient";
    const vehicle=withVeh==="yes"?(temp==="ambient"?rnd(["","van","l10","l14","t24"]):rnd(["","l10","l14"])):"";
    const dur=unit==="month"?1:rnd([1,2,3,5]);
    const k=unit==="month"?"regular":"adhoc";
    est.set("hire",k,{});const J=est.newJob();est.set("hire",k,J);Object.assign(J,{withVeh,hireUnit:unit,vehicles:dps,temp,vehicle,duration:dur,date,days:"monfri",ph:"no",helpers:0});
    const cb={svc:"outdrive",withVeh,hireUnit:unit,dps,temp,vehicle,duration:String(dur),date,goods:"x"};
    const e=est.calc(),o=bot.calc(cb);
    cmp("outdrive/"+unit,cb,J,o,e,e.rate);
  }
}
console.log(`compared ${n} jobs · mismatches ${fails} · floor applied ${floorHits} · tiers ${JSON.stringify(tiers)}`);
process.exit(fails?1:0);
