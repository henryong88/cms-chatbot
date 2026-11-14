/* ---------- pricing: same rules as CMS Quote Desk and the website estimator ---------- */
function CFG(){
  var o={},k,W=window.CMS_QF_CONFIG;
  for(k in RATES)o[k]=RATES[k];
  if(W&&typeof W==="object")["gst","variancePct","tailored","vehicles","speeds","surch","lastmile","tiers","daysPerMonth","sundaysPerMonth","phPerMonth","publicHolidays","zones","km","multiDropKm"].forEach(function(x){if(W[x]!=null)o[x]=W[x]});
  if(W&&W.hire&&W.hire.weekDays)o.hire={weekDays:W.hire.weekDays};
  return o;
}
var num=function(v){var n=parseFloat(v);return isFinite(n)?n:0};
var r2=function(n){return Math.round(n*100)/100};
var SERVICES={
  reefer:{ui:"Reefer Truck",sub:"Chilled or frozen goods",label:"Reefer truck delivery",est:"van",model:"trip"},
  van:{ui:"Van or truck",sub:"Ambient goods, any size",label:"Van / truck delivery",est:"van",model:"trip"},
  courier:{ui:"Courier",sub:"Documents and parcels",label:"Courier",est:"courier",model:"trip"},
  lastmile:{ui:"Last-mile",sub:"Many drops to homes or stores",label:"Last-mile / e-commerce",est:"lastmile",model:"perdrop"},
  outdrive:{ui:"OutDrive",sub:"Delivery personnel by day, week or month",label:"OutDrive",est:"hire",model:"hire"}
};
var TEMPS=[["ambient","Ambient"],["chilled","Chilled (2–8 °C)"],["frozen","Frozen (−18 °C)"],["mixed","Mixed chilled and frozen"]];
var WINDOWS=[["9-9","Anytime 9 am – 9 pm (standard)"],["9-6","Anytime 9 am – 6 pm"],["9-10","Anytime 9 am – 10 pm"],["4h","Within a 4-hour window"],["appt","Fixed appointment time"]];
var DAYS=[["monfri","Mon – Fri"],["monsat","Mon – Sat"],["monsun","Mon – Sun"]];
var ADDROPS=[["1","1 drop-off point",1],["2-5","2 to 5",4],["6-10","6 to 10",8],["11-20","11 to 20",15],["21-30","21 to 30",25],[">30","More than 30",40]];
var PERDAY=[["1","1",1],["2-10","2 to 10",6],["11-20","11 to 20",15],["21-30","21 to 30",25],["31-50","31 to 50",40],["51-100","51 to 100",75],["101-200","101 to 200",150],[">200","More than 200",250]];
var PIECES=[["1","1",1],["2-3","2 to 3",3],["4-5","4 to 5",5],["6-10","6 to 10",8],["11-30","11 to 30",20]];
var WEIGHT_PCL=[["<1","Under 1 kg",0.8],["1-5","1 to 5 kg",3],["5-10","5 to 10 kg",7.5],["10-20","10 to 20 kg",15],["20-50","20 to 50 kg",35]];
var pick=function(list,v,exact){if(exact!=null&&String(exact).trim()!=="")return num(exact);var x=list.filter(function(i){return i[0]===v})[0];return x?x[2]:0};
var labelOf=function(list,v){var x=list.filter(function(i){return i[0]===v})[0];return x?x[1]:""};
function zoneName(id){var z=CFG().zones.filter(function(x){return x[0]===id})[0];return z?z[1]:""}
function zoneKm(a,b){var K=CFG().km;if(!a||!b)return null;var v=(K[a]&&K[a][b]);if(v==null)v=(K[b]&&K[b][a]);return v==null?null:v}
function speedOf(id){var S=CFG().speeds;return S.filter(function(s){return s.id===id})[0]||S.filter(function(s){return s.id==="standard"})[0]||S[0]}
function defSpeed(J){return J.speed||(J.svc==="courier"?"sameday":"standard")}
function isCold(J){return !!J.temp&&J.temp!=="ambient"}
function dayInfo(iso){if(!iso)return {sun:false,ph:false};var d=new Date(iso+"T00:00:00");return {sun:d.getDay()===0,ph:CFG().publicHolidays.indexOf(iso)>=0}}
function fiso(iso){if(!iso)return "";var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],p=iso.split("-").map(Number);return p[2]+" "+M[p[1]-1]+" "+p[0]}
function rateOf(J){
  var C=CFG(),cold=isCold(J),BASIS={courier:"moto",van:"van",reefer:"l10",lastmile:"van",outdrive:"van"};
  var id=J.vehicle,auto=!id;if(auto)id=cold?"l10":(BASIS[J.svc]||"van");
  var v=C.vehicles.filter(function(x){return x.id===id})[0]||C.vehicles[0];
  if(cold&&!v.rf)v=C.vehicles.filter(function(x){return x.rf})[0]||v;
  var r=Object.assign({},v);if(cold&&v.rf){Object.assign(r,v.rf);r.name=v.name+" (reefer)"}
  r.label=auto?"Vehicle to be assigned by CMS":r.name;return r;
}
function modelOf(J){return SERVICES[J.svc]?SERVICES[J.svc].model:"trip"}
function kindOf(J){return J.svc==="outdrive"?(J.hireUnit==="month"?"regular":"adhoc"):J.kind}
function dropsOf(J){return J.kind==="regular"?Math.max(1,pick(PERDAY,J.perDay,J.perDayExact)||1):Math.max(1,pick(ADDROPS,J.drops)||1)}
function tripKm(J){
  var C=CFG(),d=dropsOf(J);
  if(d>1)return {km:num(C.multiDropKm),known:true,multi:true};
  var k=zoneKm(J.colArea,J.delArea);
  return k==null?{km:num(C.multiDropKm),known:false,multi:false}:{km:k,known:true,multi:false};
}
function tripCost(J,v,km,drops,mult){
  var S=CFG().surch,transport=num(v.base)+Math.max(0,km-num(v.inclKm))*num(v.perKm)+Math.max(0,drops-1)*num(v.drop);
  var c=transport*mult;
  if(J.temp==="frozen"||J.temp==="mixed")c+=transport*num(S.frozenPct)/100;
  var pcs=pick(PIECES,J.pieces);
  if(J.vehicle==="moto"&&pcs>num(S.motoPieces))c+=(pcs-num(S.motoPieces))*num(S.extraPiece);
  if(J.handling==="bulky")c+=num(S.bulky);
  if(J.handling==="fragile")c+=num(S.fragile);
  if(J.handling==="helper")c+=num(S.helper);
  return c;
}
function calc(J){
  var C=CFG(),S=C.surch,m=modelOf(J),kind=kindOf(J),o={rate:0,unit:"",qty:1,monthly:false,specs:[],extras:[],floor:false,unknownArea:false};
  var sp=isCold(J)?speedOf("sameday"):speedOf(defSpeed(J));
  var tempTxt=J.temp&&J.temp!=="ambient"?" · "+labelOf(TEMPS,J.temp):"";
  var dpm=num(C.daysPerMonth[J.days])||22,sunDays=J.days==="monsun"?num(C.sundaysPerMonth):0,phDays=J.ph==="yes"?num(C.phPerMonth):0;
  var di=dayInfo(J.date),sunph=kind==="adhoc"&&(di.sun||di.ph);
  var winTxt=labelOf(WINDOWS,J.window||"9-9");
  var tierDisc=function(q){return C.tiers.reduce(function(a,t){return q>=num(t.min)?Math.max(a,num(t.pct)):a},0)};
  var daysTxt=function(){return labelOf(DAYS,J.days)+(J.ph==="yes"?", including public holidays":", excluding public holidays")};
  if(m==="trip"){
    var v=rateOf(J),K=tripKm(J);o.unknownArea=!K.known;
    if(kind==="adhoc"){
      var drops=dropsOf(J),routes=Math.ceil(drops/30),perRoute=Math.ceil(drops/routes);
      var total=routes*(tripCost(J,v,K.km,perRoute,sp.mult)+(sunph?num(S.sunph):0));
      o.rate=total/drops;o.unit="per drop";o.qty=drops;o.fixedAmount=total;
      o.specs.push(v.label+" · "+sp.name+tempTxt);
      o.specs.push((J.date?fiso(J.date)+" · ":"")+winTxt+(sunph?" · "+(di.ph?"Public holiday":"Sunday")+" rate":""));
      o.specs.push("Collection: "+(zoneName(J.colArea)||"to be confirmed")+" → "+(drops>1?drops+" drops":(zoneName(J.delArea)||"to be confirmed"))+(drops===1&&K.known&&K.km?" (approx. "+K.km+" km)":""));
      if(routes>1)o.specs.push("Uses "+routes+" vehicles (up to 30 drops each)");
    }else{
      var pd=dropsOf(J);
      if(J.svc==="courier"){o.rate=tripCost(J,v,K.km,1,sp.mult)}
      else{var rt=Math.ceil(pd/30);o.rate=rt*tripCost(J,v,K.km,Math.ceil(pd/rt),sp.mult)/pd}
      o.unit=J.svc==="courier"?"per job":"per drop";o.qty=Math.round(pd*(dpm+phDays));o.monthly=true;
      var disc=tierDisc(o.qty);if(disc){o.rate*=1-disc/100;o.specs.push("Includes "+disc+"% volume discount")}
      /* Quote Desk floor: new regular chilled/frozen routes average at least reeferFloor a drop (never shown to visitors) */
      var fl=num(C.reeferFloor);
      if(fl>0&&isCold(J)&&J.svc!=="courier"&&o.rate<fl){o.rate=fl;o.floor=true}
      o.specs.unshift(v.label+" · "+sp.name+tempTxt);
      o.specs.splice(1,0,daysTxt()+" · "+winTxt);
      o.specs.splice(2,0,"About "+pd+" "+(J.svc==="courier"?"job":"drop")+(pd===1?"":"s")+" per day ("+o.qty+" per month)");
      if(pd>1){if(J.colArea)o.specs.push("Collection from "+zoneName(J.colArea)+"; delivery points across Singapore")}
      else if(J.colArea||J.delArea)o.specs.push("From "+(zoneName(J.colArea)||"—")+" to "+(zoneName(J.delArea)||"—")+(K.known&&K.km?" (approx. "+K.km+" km)":""));
      if(sunDays+phDays)o.extras.push(["Sunday / public holiday surcharge",(sunDays+phDays)*pd*num(S.sunph)]);
    }
  }else if(m==="perdrop"){
    var base=num(C.lastmile[J.temp==="mixed"?"frozen":(J.temp||"ambient")]),w=pick(WEIGHT_PCL,J.pWeight);
    o.rate=base+(w>num(C.lastmile.maxKg)?(w-num(C.lastmile.maxKg))*num(C.lastmile.overKg):0)+base*(sp.mult-1);
    o.unit="per drop";
    o.specs.push(sp.name+tempTxt+" · "+winTxt);
    if(kind==="adhoc"){o.qty=Math.max(1,Math.round(num(J.lmDrops))||1);o.specs.push((J.date?fiso(J.date)+" · ":"")+o.qty+" drops"+(sunph?" · "+(di.ph?"public holiday":"Sunday"):""))}
    else{var lpd=dropsOf(J);o.qty=Math.round(lpd*(dpm+phDays));o.monthly=true;
      o.specs.push(daysTxt()+" · about "+lpd+" drops per day ("+o.qty+" per month)");
      var d2=tierDisc(o.qty);if(d2){o.rate*=1-d2/100;o.specs.push("Includes "+d2+"% volume discount")}}
    o.specs.push("Up to "+C.lastmile.maxKg+" kg per parcel; one delivery attempt per drop");
  }else{
    var hv=rateOf(J),u=J.hireUnit||"day",wd=num(C.hire&&C.hire.weekDays)||6,dur=kind==="regular"?1:Math.max(1,Math.round(num(J.duration))||1),veh=Math.max(1,Math.round(num(J.dps))||1),noVeh=J.withVeh==="no";
    var unitRate=u==="week"?num(hv.day)*wd:num(hv[u]),per=unitRate*dur;
    o.specs.push(noVeh?"Delivery personnel (DP) only; vehicle provided by you":"Delivery personnel (DP) with vehicle: "+hv.label+tempTxt);
    if(kind==="adhoc"){o.rate=per+(sunph&&u==="day"?num(S.sunph):0);o.unit="per DP";o.qty=veh;
      o.specs.push((J.date?"Starting "+fiso(J.date)+" · ":"")+dur+" "+u+(dur>1?"s":"")+(u==="week"?" ("+wd+" working days each)":"")+(sunph&&u==="day"?" · "+(di.ph?"Public holiday":"Sunday")+" rate":""))}
    else{o.rate=per;o.unit="per DP per month";o.qty=veh;o.monthly=true;o.specs.push("Monthly hire"+(J.date?", starting "+fiso(J.date):""))}
    o.specs.push(veh+" delivery personnel");
  }
  if(String(J.goods||"").trim())o.specs.push("Goods / details: "+String(J.goods).trim());
  o.rate=r2(o.rate);
  o.amount=r2((o.fixedAmount!=null?o.fixedAmount:o.rate*o.qty)+o.extras.reduce(function(a,x){return a+x[1]},0));
  o.extras=o.extras.map(function(x){return [x[0],r2(x[1])]});
  o.sub=o.amount;o.gst=r2(o.sub*num(C.gst)/100);o.total=r2(o.sub+o.gst);
  o.tier=tierOf(J,o);
  return o;
}
function tierOf(J,o){
  var C=CFG(),T=C.tailored||{},m=modelOf(J),kind=kindOf(J),pd=kind==="regular"&&m!=="hire"?dropsOf(J):0;
  if((T.vehicles||[]).indexOf(J.vehicle)>=0)return "tailored";
  if(m==="trip"&&kind==="adhoc"&&(o.qty>num(T.maxAdhocDrops)||J.drops===">30"))return "tailored";
  if(m==="trip"&&kind==="regular"&&J.svc!=="courier"&&pd>num(T.maxDropsPerDay))return "tailored";
  if(m==="perdrop"&&(kind==="adhoc"?o.qty:pd)>num(T.maxLastmileDrops))return "tailored";
  if(m==="hire"&&(num(J.dps)>num(T.maxHireVehicles)||J.withVeh==="no"))return "tailored";
  if(kind==="regular"||isCold(J)||m==="perdrop"||o.unknownArea)return "range";
  return "exact";
}
