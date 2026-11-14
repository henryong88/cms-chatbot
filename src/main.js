/* ============================ SETTINGS ============================
   The only part that may ever need changing. Everything else runs by itself. */
var SETTINGS={
  /* Where requests are sent. Today: the Make webhook that writes the monday "Leads" board and
     emails sales@ and Henry. Later, point this at CMS Systems instead; nothing else changes. */
  endpoint:"https://hook.eu1.make.com/clwhr1mcefqmgp49shpi3epel8qylndg",
  whatsapp:"6588996423",            /* digits only, with country code */
  whatsappShow:"+65 8899 6423",
  email:"enquiry@cmspl.biz",         /* shown to visitors for general and chatbot enquiries */
  quoteEmail:"sales@cmspl.biz",      /* formal quotations come from here */
  careersUrl:"https://cmspl.biz/join-our-team/", /* "Join Our Team" page for job seekers */
  side:"right",                      /* "right" or "left" corner */
  lift:0,                            /* raise the button by this many pixels if it covers something */
  nudgeAfter:25,                     /* seconds before the small "Need a price?" hint; 0 turns it off */
  preview:"auto",                    /* "auto" = never sends from claude.ai previews; false = always send */
  /* AI replies (Claude via Make). Leave aiEndpoint "" to run on the approved FAQ only. */
  aiEndpoint:"https://hook.eu1.make.com/apfnve9vb4pjos77n2x7gceh714c9bnq",
  aiMaxPerVisit:15,                  /* AI replies per visitor per visit; after that the FAQ chatbot carries on */
  aiTimeout:25                       /* seconds to wait for an AI reply before falling back */
};
/* Rate card: a copy of the CMS Quote Desk rate card (8 Nov 2026). When the website estimator is on the
   same page, its rates (window.CMS_QF_CONFIG) are used instead, so the website keeps one copy. */
var RATES={
  gst:9, variancePct:20, reeferFloor:25, multiDropKm:25,
  tailored:{vehicles:["t24"],maxAdhocDrops:30,maxDropsPerDay:60,maxLastmileDrops:300,maxHireVehicles:3},
  vehicles:[
    {id:"moto",name:"Motorcycle",base:12,inclKm:10,perKm:0.8,drop:6,hour:25,day:180,month:3200,rf:null},
    {id:"van",name:"Van",base:40,inclKm:15,perKm:1.2,drop:10,hour:46,day:360,month:5800,rf:null},
    {id:"l10",name:"10 ft truck",base:70,inclKm:20,perKm:1.5,drop:12,hour:60,day:480,month:7200,rf:{base:110,inclKm:20,perKm:1.9,drop:15,hour:80,day:640,month:9800}},
    {id:"l14",name:"14 ft truck",base:95,inclKm:20,perKm:1.8,drop:15,hour:75,day:600,month:8800,rf:{base:140,inclKm:20,perKm:2.2,drop:18,hour:95,day:760,month:11800}},
    {id:"t24",name:"24 ft truck",base:180,inclKm:20,perKm:2.8,drop:25,hour:120,day:950,month:14500,rf:null}
  ],
  speeds:[{id:"express2",name:"Urgent (within 2 hours)",mult:2},{id:"express4",name:"Express (within 4 hours)",mult:1.5},{id:"sameday",name:"Same day",mult:1.25},{id:"standard",name:"Next working day",mult:1},{id:"economy",name:"2–3 working days",mult:0.9}],
  surch:{afterHours:26,sunph:36,expressFlat:26,helper:30,helperHr:20,helperMonth:2400,bulky:15,fragile:10,frozenPct:10,extraPiece:2,motoPieces:3},
  lastmile:{ambient:8,chilled:11,frozen:13,maxKg:10,overKg:0.5},
  hire:{weekDays:6},
  tiers:[{min:100,pct:5},{min:300,pct:8},{min:1000,pct:12}],
  daysPerMonth:{monfri:22,monsat:26,monsun:30}, sundaysPerMonth:4.3, phPerMonth:0.9,
  publicHolidays:["2026-01-01","2026-02-17","2026-02-18","2026-03-21","2026-04-03","2026-05-01","2026-05-27","2026-05-31","2026-06-01","2026-08-09","2026-08-10","2026-11-08","2026-11-09","2026-12-25",
                  "2027-01-01","2027-02-06","2027-02-07","2027-02-08","2027-03-10","2027-03-26","2027-05-01","2027-05-17","2027-05-20","2027-08-09","2027-10-28","2027-12-25"],
  zones:[["C","Central / CBD"],["E","East"],["NE","North-East"],["N","North"],["W","West"],["FW","Tuas / Far West"],["CA","Changi Airport / Loyang"],["S","Sentosa"]],
  km:{C:{C:6,E:15,NE:14,N:20,W:15,FW:28,CA:20,S:8},E:{E:6,NE:12,N:22,W:28,FW:40,CA:8,S:20},NE:{NE:6,N:15,W:24,FW:35,CA:16,S:20},N:{N:6,W:20,FW:28,CA:25,S:26},W:{W:6,FW:14,CA:33,S:16},FW:{FW:6,CA:45,S:28},CA:{CA:5,S:26},S:{S:3}}
};
/* =================================================================== */
