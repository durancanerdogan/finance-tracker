import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
 
var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var uid = function() { return Math.random().toString(36).slice(2,9); };
var fmt = function(n) { return (Number(n)||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"; };
var fmtShort = function(n) { var v=Number(n)||0; if(Math.abs(v)>=1000) return (v/1000).toFixed(1)+"k €"; return v.toFixed(0)+" €"; };
var todayStr = function() { var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
 
var P = {
  bg:"#F0F2F5", card:"#FFFFFF", accent:"#0D9488", accentDk:"#0F766E", accentLt:"#CCFBF1",
  brown:"#1E293B", brownMid:"#475569", brownLt:"#E2E8F0",
  green:"#0D9488", greenLt:"#CCFBF1", red:"#E85D5D", redLt:"#FEE2E2",
  blue:"#3B82F6", blueLt:"#DBEAFE", orange:"#F97316", orangeLt:"#FFF7ED",
  teal:"#0D9488", tealLt:"#CCFBF1", plum:"#E86565", plumLt:"#FFF1F1",
  coral:"#E86565", coralLt:"#FFF1F1",
  text:"#1E293B", sub:"#64748B", muted:"#94A3B8", border:"#E2E8F0",
  cardSh:"0 1px 4px rgba(30,41,59,0.05), 0 4px 20px rgba(30,41,59,0.04)",
};
var font="'Outfit',sans-serif";
var fontSerif="'Outfit',sans-serif";
 
var SK="teacher-fin-v9";
async function loadAll(){try{var r=localStorage.getItem(SK);return r?JSON.parse(r):null;}catch(e){return null;}}
async function saveAll(d){try{localStorage.setItem(SK,JSON.stringify(d));}catch(e){console.error(e);}}
 
var blankState=function(){return{balance:null,months:{},goals:[],lent:[],badges:[],streakDays:0,lastLogDate:""};};
var blankMonth=function(){return{salary:0,lessons:[],expenses:[]};};
 
var PREFILL_DATA=function(){
  return {
    balance:5680.40, goals:[], lent:[], badges:["first_log","lesson_legend"], streakDays:12, lastLogDate:"2026-03-23",
    months:{"2026-03":{salary:1736,lessons:[{id:uid(),name:"GoStudent Online Tutoring",amount:1044.50}],expenses:[
      {id:uid(),name:"GTT Transport Pass",amount:38.00,date:"2026-03-01",category:"needs"},
      {id:uid(),name:"Lidl (Groceries)",amount:21.34,date:"2026-03-02",category:"needs"},
      {id:uid(),name:"Tabacchi",amount:5.50,date:"2026-03-03",category:"wants"},
      {id:uid(),name:"BKNO Restaurant",amount:9.00,date:"2026-03-05",category:"wants"},
      {id:uid(),name:"Lidl (Groceries)",amount:2.99,date:"2026-03-05",category:"needs"},
      {id:uid(),name:"Tabacchi",amount:5.50,date:"2026-03-06",category:"wants"},
      {id:uid(),name:"Lidl (Groceries)",amount:21.54,date:"2026-03-06",category:"needs"},
      {id:uid(),name:"Signor Panino",amount:16.00,date:"2026-03-06",category:"wants"},
      {id:uid(),name:"Planet (Night Out)",amount:15.00,date:"2026-03-07",category:"wants"},
      {id:uid(),name:"Bank Commission",amount:1.00,date:"2026-03-08",category:"needs"},
      {id:uid(),name:"Rent",amount:500.00,date:"2026-03-08",category:"needs"},
      {id:uid(),name:"McDonald's",amount:9.58,date:"2026-03-08",category:"wants"},
      {id:uid(),name:"Carrefour Express",amount:10.47,date:"2026-03-08",category:"needs"},
      {id:uid(),name:"Carrefour Express",amount:6.54,date:"2026-03-10",category:"needs"},
      {id:uid(),name:"Tabacchi (Procino Lucia)",amount:5.50,date:"2026-03-10",category:"wants"},
      {id:uid(),name:"McDonald's",amount:8.90,date:"2026-03-11",category:"wants"},
      {id:uid(),name:"Lidl (Groceries)",amount:29.71,date:"2026-03-12",category:"needs"},
      {id:uid(),name:"Apple Store",amount:0.39,date:"2026-03-12",category:"wants"},
      {id:uid(),name:"Tabacchi",amount:5.50,date:"2026-03-13",category:"wants"},
      {id:uid(),name:"Claude AI Subscription",amount:21.96,date:"2026-03-15",category:"wants"},
      {id:uid(),name:"BKNO Restaurant",amount:7.55,date:"2026-03-15",category:"wants"},
      {id:uid(),name:"Lidl (Groceries)",amount:12.82,date:"2026-03-17",category:"needs"},
      {id:uid(),name:"Tabacchi",amount:5.50,date:"2026-03-17",category:"wants"},
      {id:uid(),name:"Bank Commission",amount:1.00,date:"2026-03-18",category:"needs"},
      {id:uid(),name:"Bank Transfer",amount:10.00,date:"2026-03-18",category:"needs"},
      {id:uid(),name:"Iliad Phone Plan",amount:9.99,date:"2026-03-19",category:"needs"},
      {id:uid(),name:"Efeso Bistrot Cafe",amount:28.50,date:"2026-03-19",category:"wants"},
      {id:uid(),name:"Tabacchi",amount:5.50,date:"2026-03-21",category:"wants"},
      {id:uid(),name:"Tabacchi (Di Feo)",amount:5.50,date:"2026-03-23",category:"wants"},
    ]}}
  };
};
 
var GOAL_PRESETS=[
  {emoji:"📱",label:"Phone"},{emoji:"💻",label:"Laptop"},{emoji:"✈️",label:"Trip"},
  {emoji:"🚗",label:"Car"},{emoji:"🏠",label:"Furniture"},{emoji:"👟",label:"Shoes"},
  {emoji:"📚",label:"Course"},{emoji:"🎮",label:"Console"},{emoji:"⌚",label:"Watch"},
  {emoji:"🎸",label:"Hobby"},{emoji:"🎁",label:"Gift"},{emoji:"💡",label:"Other"},
];
 
var BADGE_DEFS = {
  first_log:{emoji:"✏️",name:"First Log",desc:"Logged your very first expense"},
  streak_7:{emoji:"🔥",name:"Week Warrior",desc:"7-day logging streak"},
  streak_30:{emoji:"⚡",name:"Iron Habit",desc:"30-day logging streak"},
  no_tabacchi:{emoji:"🚭",name:"Smoke Break",desc:"7 days without tabacchi spending"},
  home_chef:{emoji:"🍳",name:"Home Chef",desc:"5 days with no dining out"},
  zero_day:{emoji:"🧘",name:"Zero Day",desc:"A full day with zero spending"},
  grocery_guru:{emoji:"🥦",name:"Grocery Guru",desc:"Kept groceries under 80€ this month"},
  lesson_legend:{emoji:"📚",name:"Lesson Legend",desc:"Earned 1000€+ from lessons in a month"},
  budget_zen:{emoji:"☯️",name:"Budget Zen",desc:"Stayed within 50/30/20 for a full month"},
  savings_milestone:{emoji:"💰",name:"Savings Milestone",desc:"Net savings exceeded 500€ in a month"},
};
 
var AI_CHIPS=["How am I doing?","Can I reach my goals?","Where do I overspend?","How many extra lessons?","Who owes me money?","50/30/20 check"];
 
function classifyExpense(name) {
  var n = name.toLowerCase();
  if(n.indexOf("lidl")>=0||n.indexOf("carrefour")>=0||n.indexOf("grocer")>=0) return {cat:"Groceries",color:P.green};
  if(n.indexOf("rent")>=0) return {cat:"Rent",color:P.red};
  if(n.indexOf("mcdonald")>=0||n.indexOf("signor panino")>=0||n.indexOf("bkno")>=0||n.indexOf("efeso")>=0||n.indexOf("bistrot")>=0||n.indexOf("cafe")>=0) return {cat:"Dining Out",color:P.orange};
  if(n.indexOf("tabacchi")>=0||n.indexOf("procino")>=0||n.indexOf("di feo")>=0) return {cat:"Tabacchi",color:"#8B7355"};
  if(n.indexOf("gtt")>=0||n.indexOf("transport")>=0) return {cat:"Transport",color:P.blue};
  if(n.indexOf("iliad")>=0||n.indexOf("phone")>=0) return {cat:"Phone",color:P.plum};
  if(n.indexOf("claude")>=0||n.indexOf("apple")>=0||n.indexOf("subscription")>=0) return {cat:"Subscriptions",color:"#6366F1"};
  if(n.indexOf("planet")>=0||n.indexOf("night")>=0) return {cat:"Going Out",color:P.accent};
  if(n.indexOf("bank")>=0||n.indexOf("commission")>=0||n.indexOf("transfer")>=0) return {cat:"Bank Fees",color:P.muted};
  return {cat:"Other",color:"#94A3B8"};
}
 
function detectRecurring(state) {
  var allExp = [];
  Object.keys(state.months).forEach(function(mk) {
    (state.months[mk].expenses || []).forEach(function(e) { allExp.push(Object.assign({}, e, {mk: mk})); });
  });
  var nameCount = {};
  allExp.forEach(function(e) {
    var key = e.name.toLowerCase().replace(/[^a-z0-9]/g,"");
    if (!nameCount[key]) nameCount[key] = {name: e.name, total: 0, count: 0, category: e.category, lastAmount: e.amount};
    nameCount[key].count++; nameCount[key].total += e.amount; nameCount[key].lastAmount = e.amount;
  });
  var recurring = [];
  Object.keys(nameCount).forEach(function(key) {
    var item = nameCount[key];
    if (item.count >= 2) recurring.push({name: item.name, avgAmount: item.total / item.count, count: item.count, category: item.category, lastAmount: item.lastAmount});
  });
  recurring.sort(function(a,b) { return b.avgAmount - a.avgAmount; });
  return recurring;
}
 
function buildForecast(state) {
  var keys = Object.keys(state.months).sort();
  if (!keys.length) return [];
  var totalInc = 0, totalExp = 0, count = keys.length;
  keys.forEach(function(k) {
    var d = state.months[k];
    totalInc += (d.salary || 0) + (d.lessons || []).reduce(function(s,l){return s+l.amount;},0);
    totalExp += (d.expenses || []).reduce(function(s,e){return s+e.amount;},0);
  });
  var avgNet = (totalInc - totalExp) / count;
  var bal = state.balance || 0;
  var now = new Date();
  var forecast = [{month: MONTHS_SHORT[now.getMonth()], balance: bal, type: "actual"}];
  for (var i = 1; i <= 5; i++) {
    var fm = new Date(now.getFullYear(), now.getMonth() + i, 1);
    bal += avgNet;
    forecast.push({month: MONTHS_SHORT[fm.getMonth()], balance: Math.round(bal * 100) / 100, type: "forecast"});
  }
  return forecast;
}
 
function weeklyRecap(md) {
  var now = new Date();
  var dayOfWeek = now.getDay() || 7;
  var weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek + 1);
  var lastWeekStart = new Date(weekStart); lastWeekStart.setDate(weekStart.getDate() - 7);
  var lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(weekStart.getDate() - 1);
  var thisWeek = 0, lastWeek = 0, thisWeekCount = 0;
  (md.expenses || []).forEach(function(e) {
    if (!e.date) return; var d = new Date(e.date);
    if (d >= weekStart && d <= now) { thisWeek += e.amount; thisWeekCount++; }
    if (d >= lastWeekStart && d <= lastWeekEnd) { lastWeek += e.amount; }
  });
  var change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100) : 0;
  return {thisWeek: thisWeek, lastWeek: lastWeek, change: change, thisWeekCount: thisWeekCount, daysSoFar: dayOfWeek};
}
 
function checkBadges(state) {
  var b = state.badges || []; var nb = [];
  var totalExp = 0;
  Object.keys(state.months).forEach(function(k) { totalExp += (state.months[k].expenses||[]).length; });
  if (totalExp >= 1 && b.indexOf("first_log") < 0) nb.push("first_log");
  if ((state.streakDays||0) >= 7 && b.indexOf("streak_7") < 0) nb.push("streak_7");
  if ((state.streakDays||0) >= 30 && b.indexOf("streak_30") < 0) nb.push("streak_30");
  Object.keys(state.months).forEach(function(k) {
    var d = state.months[k];
    var lt = (d.lessons||[]).reduce(function(s,l){return s+l.amount;},0);
    var inc = (d.salary||0) + lt;
    var et = d.expenses.reduce(function(s,e){return s+e.amount;},0);
    var needs = d.expenses.filter(function(e){return e.category==="needs";}).reduce(function(s,e){return s+e.amount;},0);
    var wants = d.expenses.filter(function(e){return e.category==="wants";}).reduce(function(s,e){return s+e.amount;},0);
    if (lt >= 1000 && b.indexOf("lesson_legend") < 0 && nb.indexOf("lesson_legend") < 0) nb.push("lesson_legend");
    if (inc > 0 && needs <= inc*0.5 && wants <= inc*0.3 && b.indexOf("budget_zen") < 0 && nb.indexOf("budget_zen") < 0) nb.push("budget_zen");
    if (inc > 0 && (inc-et) >= 500 && b.indexOf("savings_milestone") < 0 && nb.indexOf("savings_milestone") < 0) nb.push("savings_milestone");
    // no_tabacchi
    var tabDates = {};
    d.expenses.forEach(function(e) { if (e.name.toLowerCase().indexOf("tabacchi") >= 0 && e.date) tabDates[e.date] = true; });
    var dIM = new Date(parseInt(k.split("-")[0]), parseInt(k.split("-")[1]), 0).getDate();
    var streak = 0;
    for (var day = 1; day <= dIM; day++) {
      var ds = k + "-" + String(day).padStart(2, "0");
      if (!tabDates[ds]) { streak++; if (streak >= 7 && b.indexOf("no_tabacchi") < 0 && nb.indexOf("no_tabacchi") < 0) nb.push("no_tabacchi"); } else streak = 0;
    }
    // home_chef
    var dineDates = {};
    d.expenses.forEach(function(e) { var n=e.name.toLowerCase(); if ((n.indexOf("mcdonald")>=0||n.indexOf("signor panino")>=0||n.indexOf("bkno")>=0||n.indexOf("efeso")>=0||n.indexOf("cafe")>=0) && e.date) dineDates[e.date] = true; });
    streak = 0;
    for (var day2 = 1; day2 <= dIM; day2++) {
      var ds2 = k + "-" + String(day2).padStart(2, "0");
      if (!dineDates[ds2]) { streak++; if (streak >= 5 && b.indexOf("home_chef") < 0 && nb.indexOf("home_chef") < 0) nb.push("home_chef"); } else streak = 0;
    }
    // zero_day
    var dateTotals = {};
    d.expenses.forEach(function(e) { if (e.date) { if (!dateTotals[e.date]) dateTotals[e.date] = 0; dateTotals[e.date] += e.amount; }});
    var dates = Object.keys(dateTotals).sort();
    if (dates.length >= 2) {
      var first = new Date(dates[0]), last = new Date(dates[dates.length-1]);
      for (var dd = new Date(first); dd <= last; dd.setDate(dd.getDate()+1)) {
        var dds = dd.getFullYear()+"-"+String(dd.getMonth()+1).padStart(2,"0")+"-"+String(dd.getDate()).padStart(2,"0");
        if (!dateTotals[dds] && b.indexOf("zero_day") < 0 && nb.indexOf("zero_day") < 0) nb.push("zero_day");
      }
    }
    // grocery_guru
    var grocTotal = d.expenses.filter(function(e) { var n=e.name.toLowerCase(); return n.indexOf("lidl")>=0||n.indexOf("carrefour")>=0; }).reduce(function(s,e){return s+e.amount;},0);
    if (grocTotal > 0 && grocTotal <= 80 && b.indexOf("grocery_guru") < 0 && nb.indexOf("grocery_guru") < 0) nb.push("grocery_guru");
  });
  return nb;
}
 
function buildCtx(state,mk){
  var b=state.balance,months=state.months,goals=state.goals,lent=state.lent||[];
  var c="=== TEACHER FINANCE DATA ===\nBalance: "+(b!=null?"€"+b:"not set")+"\nViewing: "+mk+"\nStreak: "+(state.streakDays||0)+" days\nBadges: "+(state.badges||[]).join(", ")+"\n\n";
  Object.keys(months).sort().forEach(function(k){
    var d=months[k],parts=k.split("-");
    var lt=(d.lessons||[]).reduce(function(s,l){return s+l.amount;},0);
    var et=(d.expenses||[]).reduce(function(s,e){return s+e.amount;},0);
    var inc=(d.salary||0)+lt;
    c+="-- "+MONTHS[parseInt(parts[1])-1]+" "+parts[0]+" --\nIncome: €"+inc+" (Salary €"+(d.salary||0)+", Lessons €"+lt+")\nSpent: €"+et+", Net: €"+(inc-et).toFixed(2)+"\n";
    d.expenses.forEach(function(e){c+="  "+e.name+": €"+e.amount+" ("+( e.category||"?")+") "+(e.date||"")+"\n";});
    c+="\n";
  });
  if(goals.length){c+="GOALS:\n";goals.forEach(function(g){c+=g.emoji+" "+g.name+": €"+g.target+(g.purchased?" [BOUGHT]":"")+"\n";});}
  if(lent.length){c+="\nLENT:\n";lent.forEach(function(l){c+=l.name+": €"+l.amount+(l.returned?" [RETURNED]":" [PENDING]")+"\n";});}
  return c;
}
 
async function askAI(state,mk,userMsg,history){
  var sys="You are a warm financial advisor for a maths teacher in Turin. They earn salary + private tutoring.\n\nYou see ALL data. Be specific with numbers. Keep replies 2-3 paragraphs. Use €.\n\nRules: 50/30/20 budget, flag recurring costs, calculate goal recovery, suggest extra lessons, celebrate streaks/badges.\n\n"+buildCtx(state,mk);
  var msgs=history.map(function(m){return{role:m.role,content:m.text};});
  msgs.push({role:"user",content:userMsg});
  var res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:msgs}),
  });
  var data=await res.json();
  if(data.content)return data.content.map(function(b){return b.text||"";}).join("\n");
  return "Connection issue — try again.";
}
 
function calcAvgNet(state){
  var keys=Object.keys(state.months);if(!keys.length)return 0;
  var total=0;
  keys.forEach(function(k){var d=state.months[k];
    var inc=(d.salary||0)+(d.lessons||[]).reduce(function(s,l){return s+l.amount;},0);
    total+=inc-(d.expenses||[]).reduce(function(s,e){return s+e.amount;},0);});
  return total/keys.length;
}
 
function AnimNum({value, suffix}) {
  var [display, setDisplay] = useState(0); var ref = useRef(null);
  useEffect(function() {
    var start = display; var end = Number(value) || 0; var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var p = Math.min((ts - startTime) / 700, 1); p = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (end - start) * p);
      if (p < 1) ref.current = requestAnimationFrame(step);
    }
    ref.current = requestAnimationFrame(step);
    return function() { if(ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);
  return React.createElement("span", null, display.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2}) + (suffix||" €"));
}
 
function Card({children, style, delay, onClick}){
  return React.createElement("div",{onClick:onClick, style:Object.assign({
    background:P.card, borderRadius:18, padding:"18px 20px", boxShadow:P.cardSh,
    border:"1px solid "+P.border, marginBottom:14,
    animation:"fadeUp 0.45s ease both", animationDelay:(delay||0)+"ms",
    cursor: onClick ? "pointer" : "default", transition:"transform 0.15s",
  },style||{})},children);
}
function SecHead({icon, label, color, right}){
  return React.createElement("div",{style:{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"1.2px",color:color||P.sub,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}},
    React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},icon," ",label), right||null);
}
function Btn({onClick, bg, color, full, style, children, disabled}){
  return React.createElement("button",{onClick:onClick, disabled:disabled, style:Object.assign({
    background:bg||P.accent, color:color||"#fff", border:"none", borderRadius:12,
    padding:"11px 20px", fontSize:13, fontWeight:600, fontFamily:font, cursor:disabled?"default":"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
    width:full?"100%":"auto", transition:"all 0.15s", opacity:disabled?0.5:1,
  },style||{})},children);
}
 
function NavIcon({type, active}){
  var c=active?P.accent:P.muted;
  var icons={
    home:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},React.createElement("path",{d:"M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"})),
    add:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:2.5,strokeLinecap:"round"},React.createElement("line",{x1:12,y1:7,x2:12,y2:17}),React.createElement("line",{x1:7,y1:12,x2:17,y2:12})),
    income:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},React.createElement("rect",{x:2,y:6,width:20,height:14,rx:2}),React.createElement("path",{d:"M2 10h20"})),
    stats:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},React.createElement("path",{d:"M18 20V10"}),React.createElement("path",{d:"M12 20V4"}),React.createElement("path",{d:"M6 20v-6"})),
    goals:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},React.createElement("circle",{cx:12,cy:12,r:10}),React.createElement("circle",{cx:12,cy:12,r:6}),React.createElement("circle",{cx:12,cy:12,r:2,fill:c})),
    lent:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},React.createElement("path",{d:"M17 1l4 4-4 4"}),React.createElement("path",{d:"M3 11V9a4 4 0 014-4h14"}),React.createElement("path",{d:"M7 23l-4-4 4-4"}),React.createElement("path",{d:"M21 13v2a4 4 0 01-4 4H3"})),
    ai:React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round"},React.createElement("path",{d:"M12 2l2 5.5L20 8l-4.5 4L17 18l-5-3.5L7 18l1.5-6L4 8l6-.5z"})),
  };
  return icons[type]||null;
}
 
var inputSt={border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:font,outline:"none",background:"#F8FAFC",boxSizing:"border-box",transition:"border-color 0.2s",color:P.text};
 
export default function App(){
  var now=new Date();
  var [mo,setMo]=useState(now.getMonth()); var [yr,setYr]=useState(now.getFullYear());
  var [state,setState]=useState(blankState()); var [ready,setReady]=useState(false); var [tab,setTab]=useState("home");
  var [chat,setChat]=useState([]); var [aiMsg,setAiMsg]=useState(""); var [aiThink,setAiThink]=useState(false); var chatRef=useRef(null);
  var [qName,setQName]=useState(""); var [qAmt,setQAmt]=useState(""); var [qCat,setQCat]=useState("needs"); var [qDate,setQDate]=useState(todayStr()); var [qSaved,setQSaved]=useState(false);
  var [goalOpen,setGoalOpen]=useState(false); var [goalEmoji,setGoalEmoji]=useState("📱"); var [goalName,setGoalName]=useState(""); var [goalTarget,setGoalTarget]=useState("");
  var [lentName,setLentName]=useState(""); var [lentAmt,setLentAmt]=useState(""); var [lentDate,setLentDate]=useState("");
  var [lessonName,setLessonName]=useState(""); var [lessonAmt,setLessonAmt]=useState("");
  var [editingBalance,setEditingBalance]=useState(false); var [balanceInput,setBalanceInput]=useState(""); var [confirmGoalId,setConfirmGoalId]=useState(null);
  var [selectedPieCat,setSelectedPieCat]=useState(null);
  var [showRecurring,setShowRecurring]=useState(false); var [showBadges,setShowBadges]=useState(false);
  var [newBadgePopup,setNewBadgePopup]=useState(null);
  var [csvText,setCsvText]=useState(""); var [csvParsed,setCsvParsed]=useState(null);
 
  var mk=yr+"-"+String(mo+1).padStart(2,"0");
  var md=state.months[mk]||blankMonth();
 
  var persist=useCallback(function(fn){
    setState(function(prev){var next=JSON.parse(JSON.stringify(prev));fn(next);saveAll(next);return next;});
  },[]);
  var upMonth=useCallback(function(fn){
    persist(function(s){if(!s.months[mk])s.months[mk]=blankMonth();fn(s.months[mk]);});
  },[persist,mk]);
 
  useEffect(function(){loadAll().then(function(d){
    if(d){if(!d.badges)d.badges=[];if(!d.streakDays)d.streakDays=0;setState(d);}
    else setState(PREFILL_DATA()); setReady(true);
  });},[]);
  useEffect(function(){if(chatRef.current)chatRef.current.scrollIntoView({behavior:"smooth"});},[chat,aiThink]);
  useEffect(function(){
    if(!ready)return; var nb=checkBadges(state);
    if(nb.length>0){
      persist(function(s){if(!s.badges)s.badges=[];nb.forEach(function(b){if(s.badges.indexOf(b)<0)s.badges.push(b);});});
      setNewBadgePopup(nb[0]); setTimeout(function(){setNewBadgePopup(null);},3500);
    }
  },[ready, state.months, state.goals]);
 
  var prevMo=function(){if(mo===0){setMo(11);setYr(function(y){return y-1});}else setMo(function(m){return m-1;});};
  var nextMo=function(){if(mo===11){setMo(0);setYr(function(y){return y+1});}else setMo(function(m){return m+1;});};
 
  var lessonT=md.lessons.reduce(function(s,l){return s+l.amount;},0);
  var incomeT=(md.salary||0)+lessonT; var expenseT=md.expenses.reduce(function(s,e){return s+e.amount;},0); var net=incomeT-expenseT;
  var needs50=incomeT*0.5, wants30=incomeT*0.3, save20=incomeT*0.2;
  var spentNeeds=md.expenses.filter(function(e){return e.category==="needs";}).reduce(function(s,e){return s+e.amount;},0);
  var spentWants=md.expenses.filter(function(e){return e.category==="wants";}).reduce(function(s,e){return s+e.amount;},0);
  var totalLentOut=(state.lent||[]).filter(function(l){return!l.returned;}).reduce(function(s,l){return s+l.amount;},0);
  var overdueLent=(state.lent||[]).filter(function(l){return!l.returned&&l.expectedDate&&l.expectedDate<todayStr();});
 
  var recurring=useMemo(function(){return detectRecurring(state);},[state.months]);
  var forecast=useMemo(function(){return buildForecast(state);},[state.months,state.balance]);
  var recap=useMemo(function(){return weeklyRecap(md);},[md]);
 
  var getCatData=function(){
    var groups={},colorMap={};
    md.expenses.forEach(function(e){var c=classifyExpense(e.name);if(!groups[c.cat])groups[c.cat]=0;groups[c.cat]+=e.amount;colorMap[c.cat]=c.color;});
    return Object.keys(groups).sort(function(a,b){return groups[b]-groups[a];}).map(function(cat){return{name:cat,value:Math.round(groups[cat]*100)/100,color:colorMap[cat]};});
  };
  var catExpenses=selectedPieCat?md.expenses.filter(function(e){return classifyExpense(e.name).cat===selectedPieCat;}):[];
 
  var addLesson=function(){var a=parseFloat(lessonAmt);if(!lessonName.trim()||!a)return;
    upMonth(function(m){m.lessons.push({id:uid(),name:lessonName.trim(),amount:a});});
    persist(function(s){if(s.balance!=null)s.balance+=a;});setLessonName("");setLessonAmt("");};
 
  var quickAdd=function(){var a=parseFloat(qAmt);if(!qName.trim()||!a)return;
    var expDate=qDate||todayStr(); var parts=expDate.split("-"); var targetMk=parts[0]+"-"+parts[1];
    persist(function(s){if(!s.months[targetMk])s.months[targetMk]=blankMonth();
      s.months[targetMk].expenses.push({id:uid(),name:qName.trim(),amount:a,date:expDate,category:qCat});
      if(s.balance!=null)s.balance=Math.max(0,s.balance-a);
      var today=todayStr();
      if(s.lastLogDate!==today){var y=new Date();y.setDate(y.getDate()-1);
        var ys=y.getFullYear()+"-"+String(y.getMonth()+1).padStart(2,"0")+"-"+String(y.getDate()).padStart(2,"0");
        s.streakDays=(s.lastLogDate===ys||!s.lastLogDate)?(s.streakDays||0)+1:1; s.lastLogDate=today;}
    });
    setQName("");setQAmt("");setQDate(todayStr());setQSaved(true);setTimeout(function(){setQSaved(false);},1800);};
 
  var addGoal=function(){var t=parseFloat(goalTarget);if(!goalName.trim()||!t)return;
    persist(function(s){s.goals.push({id:uid(),emoji:goalEmoji,name:goalName.trim(),target:t,purchased:false});});
    setGoalOpen(false);setGoalName("");setGoalTarget("");setGoalEmoji("📱");};
  var buyGoal=function(gid){persist(function(s){var g=s.goals.find(function(x){return x.id===gid;});
    if(g&&!g.purchased){g.purchased=true;g.purchaseDate=todayStr();if(s.balance!=null)s.balance=Math.max(0,s.balance-g.target);
      var nowMk=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
      if(!s.months[nowMk])s.months[nowMk]=blankMonth();
      s.months[nowMk].expenses.push({id:uid(),name:g.emoji+" "+g.name,amount:g.target,date:todayStr(),category:"wants"});}});};
  var addLent=function(){var a=parseFloat(lentAmt);if(!lentName.trim()||!a)return;
    persist(function(s){if(!s.lent)s.lent=[];s.lent.push({id:uid(),name:lentName.trim(),amount:a,date:todayStr(),expectedDate:lentDate||"",returned:false});
      if(s.balance!=null)s.balance=Math.max(0,s.balance-a);});setLentName("");setLentAmt("");setLentDate("");};
  var markReturned=function(lid){persist(function(s){var l=(s.lent||[]).find(function(x){return x.id===lid;});
    if(l&&!l.returned){l.returned=true;l.returnDate=todayStr();if(s.balance!=null)s.balance+=l.amount;}});};
 
  var parseCSV=function(){if(!csvText.trim())return;
    var lines=csvText.trim().split("\n"); var parsed=[];
    lines.forEach(function(line){
      var sep=line.indexOf(";")>=0?";":line.indexOf("\t")>=0?"\t":",";
      var parts=line.split(sep).map(function(s){return s.trim().replace(/^"|"$/g,"");});
      if(parts.length>=2){var amt=null,name="",date="";
        for(var i=0;i<parts.length;i++){
          var num=parseFloat(parts[i].replace(",",".").replace(/[^0-9.\-]/g,""));
          if(!isNaN(num)&&Math.abs(num)>0&&!amt){amt=Math.abs(num);}
          else if(parts[i].match(/^\d{4}-\d{2}-\d{2}$/)){date=parts[i];}
          else if(parts[i].match(/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/)){var dp=parts[i].split(/[\/\-]/);date=dp[2]+"-"+dp[1]+"-"+dp[0];}
          else if(parts[i].length>1&&!name){name=parts[i];}
        }
        if(name&&amt)parsed.push({name:name,amount:amt,date:date||todayStr(),category:"needs"});
      }
    });
    setCsvParsed(parsed);};
  var importCSV=function(){if(!csvParsed||!csvParsed.length)return;
    persist(function(s){csvParsed.forEach(function(e){
      var parts=e.date.split("-"); var tmk=parts[0]+"-"+parts[1];
      if(!s.months[tmk])s.months[tmk]=blankMonth();
      s.months[tmk].expenses.push({id:uid(),name:e.name,amount:e.amount,date:e.date,category:e.category});
      if(s.balance!=null)s.balance=Math.max(0,s.balance-e.amount);});});
    setCsvText("");setCsvParsed(null);};
 
  var sendAI=async function(text){var m=text||aiMsg.trim();if(!m||aiThink)return;setAiMsg("");
    var nc=chat.concat([{role:"user",text:m}]);setChat(nc);setAiThink(true);
    try{var r=await askAI(state,mk,m,chat);setChat(nc.concat([{role:"assistant",text:r}]));}
    catch(e){setChat(nc.concat([{role:"assistant",text:"Connection error."}]));}setAiThink(false);};
 
  var FL=React.createElement("link",{href:"https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap",rel:"stylesheet"});
  if(!ready)return React.createElement("div",{style:{fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:P.bg,color:P.muted}},FL,React.createElement("div",{className:"loadSpin",style:{width:36,height:36,border:"3px solid "+P.border,borderTopColor:P.accent,borderRadius:"50%"}}));
 
  if(state.balance===null){return(
    <div style={{fontFamily:font,background:P.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      {FL}<div style={{fontSize:48,marginBottom:16,animation:"bounceIn 0.6s ease"}}>👋</div>
      <div style={{fontSize:22,fontWeight:800,color:P.text,marginBottom:6,animation:"fadeUp 0.5s ease both",animationDelay:"100ms"}}>Welcome</div>
      <div style={{fontSize:14,color:P.sub,textAlign:"center",lineHeight:1.6,marginBottom:28,maxWidth:300,animation:"fadeUp 0.5s ease both",animationDelay:"200ms"}}>How much money do you have right now?<br/>All accounts, wallet, everything.</div>
      <input type="number" min="0" step="0.01" placeholder="€ Total balance" value={state._onboard||""} onChange={function(e){setState(function(p){return Object.assign({},p,{_onboard:parseFloat(e.target.value)||0});});}}
        style={{width:"100%",maxWidth:280,border:"2px solid "+P.border,borderRadius:14,padding:16,fontSize:22,fontWeight:800,outline:"none",background:"#fff",textAlign:"center",boxSizing:"border-box",marginBottom:20,color:P.text,animation:"fadeUp 0.5s ease both",animationDelay:"300ms"}}/>
      <Btn full onClick={function(){persist(function(s){s.balance=s._onboard||0;delete s._onboard;});}} style={{maxWidth:280,padding:14,fontSize:14,borderRadius:14,animation:"fadeUp 0.5s ease both",animationDelay:"400ms"}}>Start Tracking →</Btn>
      <style>{animCSS}</style></div>);}
 
  var BudgetBar=function({label,budget,spent,color,delay}){
    var pct=budget>0?Math.min(100,Math.round((spent/budget)*100)):0; var over=spent>budget;
    return <div style={{marginBottom:12,animation:"fadeUp 0.4s ease both",animationDelay:(delay||0)+"ms"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:600,color:color}}>{label}</span>
        <span style={{fontSize:11,color:over?P.red:P.sub,fontWeight:600}}>{fmt(spent)} / {fmt(budget)}</span></div>
      <div style={{background:P.brownLt,borderRadius:20,height:8,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:20,width:pct+"%",background:over?P.red:color,transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)"}}/></div>
      {over&&<div style={{fontSize:10,color:P.red,fontWeight:600,marginTop:3}}>⚠ Over by {fmt(spent-budget)}</div>}</div>;};
 
  return(
    <div style={{fontFamily:font,background:P.bg,minHeight:"100vh",color:P.text,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",paddingBottom:78}}>
      {FL}
      {newBadgePopup&&BADGE_DEFS[newBadgePopup]&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,background:P.accentLt,border:"2px solid "+P.accent,borderRadius:18,padding:"12px 22px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 30px rgba(13,148,136,0.2)",animation:"badgePop 0.5s ease both"}}>
          <span style={{fontSize:28}}>{BADGE_DEFS[newBadgePopup].emoji}</span>
          <div><div style={{fontSize:10,fontWeight:700,color:P.accent,textTransform:"uppercase",letterSpacing:"1px"}}>New Badge!</div>
          <div style={{fontSize:13,fontWeight:700,color:P.text}}>{BADGE_DEFS[newBadgePopup].name}</div></div></div>)}
 
      {/* HOME */}
      {tab==="home"&&(<div style={{flex:1,overflowY:"auto"}}>
        <div style={{background:"linear-gradient(145deg, #0F172A, #1E293B, #134E4A)",color:"#fff",padding:"26px 22px 22px",borderRadius:"0 0 28px 28px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"rgba(13,148,136,0.15)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
            <div><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",opacity:0.5,marginBottom:4}}>Current Balance</div>
              <div style={{fontSize:30,fontWeight:800,letterSpacing:"-0.5px"}}><AnimNum value={state.balance}/></div></div>
            <div onClick={function(){setTab("stats");setShowBadges(true);}} style={{background:"rgba(13,148,136,0.2)",borderRadius:12,padding:"7px 12px",cursor:"pointer",textAlign:"center",border:"1px solid rgba(13,148,136,0.3)"}}>
              <div style={{fontSize:16}}>🔥</div><div style={{fontSize:13,fontWeight:700}}>{state.streakDays||0}</div>
              <div style={{fontSize:7,fontWeight:700,textTransform:"uppercase",opacity:0.6}}>streak</div></div></div>
          {totalLentOut>0&&<div style={{fontSize:11,opacity:0.6,marginTop:4}}>💸 {fmtShort(totalLentOut)} lent out{overdueLent.length>0?" · "+overdueLent.length+" overdue":""}</div>}
          {!editingBalance
            ?<button onClick={function(){setEditingBalance(true);setBalanceInput(String(state.balance||0));}} style={{marginTop:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:600,fontFamily:font,cursor:"pointer"}}>Edit Balance</button>
            :<div style={{marginTop:10,display:"flex",gap:6,alignItems:"center"}}>
              <input type="number" min="0" step="0.01" value={balanceInput} onChange={function(e){setBalanceInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"){persist(function(s){s.balance=parseFloat(balanceInput)||0;});setEditingBalance(false);}}} autoFocus style={{width:130,border:"none",borderRadius:8,padding:"8px 12px",fontSize:15,fontWeight:700,fontFamily:font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
              <button onClick={function(){persist(function(s){s.balance=parseFloat(balanceInput)||0;});setEditingBalance(false);}} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"7px 12px",color:"#fff",fontSize:11,fontWeight:600,fontFamily:font,cursor:"pointer"}}>Save</button>
              <button onClick={function(){setEditingBalance(false);}} style={{background:"none",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"7px 10px",color:"#fff",fontSize:11,fontFamily:font,cursor:"pointer"}}>✕</button></div>}
        </div>
        <div style={{padding:"14px 16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,margin:"4px 0 14px"}}>
            <button onClick={prevMo} style={{background:P.card,border:"1px solid "+P.border,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:P.accent}}>◀</button>
            <div style={{fontSize:14,fontWeight:700,minWidth:140,textAlign:"center"}}>{MONTHS[mo]} {yr}</div>
            <button onClick={nextMo} style={{background:P.card,border:"1px solid "+P.border,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:P.accent}}>▶</button></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[{l:"Income",v:incomeT,bg:P.greenLt,c:P.green},{l:"Spent",v:expenseT,bg:P.redLt,c:P.red},{l:"Net",v:net,bg:net>=0?P.accentLt:P.redLt,c:net>=0?P.accent:P.red}].map(function(b,i){
              return <div key={b.l} style={{background:b.bg,borderRadius:14,padding:"12px 6px",textAlign:"center",animation:"fadeUp 0.4s ease both",animationDelay:(i*60)+"ms"}}>
                <div style={{fontSize:14,fontWeight:800,color:b.c}}><AnimNum value={b.v}/></div>
                <div style={{fontSize:9,fontWeight:700,textTransform:"uppercase",color:b.c,opacity:0.6,marginTop:2,letterSpacing:"0.5px"}}>{b.l}</div></div>;})}</div>
          {incomeT>0&&<Card delay={80}>
            <SecHead icon="◐" label="50 / 30 / 20 Budget"/>
            <BudgetBar label="50% Needs" budget={needs50} spent={spentNeeds} color={P.green} delay={120}/>
            <BudgetBar label="30% Wants" budget={wants30} spent={spentWants} color={P.orange} delay={160}/>
            <BudgetBar label="20% Savings" budget={save20} spent={Math.max(0,net)} color={P.blue} delay={200}/>
            <div style={{fontSize:11,color:P.sub,marginTop:4}}>{Math.max(0,net)>=save20?<span style={{color:P.green,fontWeight:600}}>✓ On track for savings</span>:<span>Saving {fmt(Math.max(0,net))} of {fmt(save20)} target</span>}</div></Card>}
          {expenseT>0&&(function(){var pieData=getCatData();
            return <Card delay={240}>
              <SecHead icon="◉" label="Spending Breakdown" right={selectedPieCat&&<button onClick={function(ev){ev.stopPropagation();setSelectedPieCat(null);}} style={{fontSize:10,color:P.accent,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:font}}>← Back</button>}/>
              {!selectedPieCat?<div style={{display:"flex",alignItems:"center",gap:8}}>
                <ResponsiveContainer width="42%" height={140}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={58} dataKey="value" strokeWidth={2} stroke={P.card} onClick={function(d){setSelectedPieCat(d.name);}}>
                  {pieData.map(function(e,i){return <Cell key={i} fill={e.color} style={{cursor:"pointer"}}/>;})}
                </Pie><Tooltip formatter={function(v){return fmt(v);}} contentStyle={{fontSize:11,borderRadius:10,border:"1px solid "+P.border}}/></PieChart></ResponsiveContainer>
                <div style={{flex:1}}>{pieData.map(function(item){return <div key={item.name} onClick={function(){setSelectedPieCat(item.name);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 6px",borderRadius:6,cursor:"pointer",marginBottom:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:8,height:8,borderRadius:3,background:item.color,flexShrink:0}}/><span style={{fontSize:11,fontWeight:500}}>{item.name}</span></div>
                  <span style={{fontSize:11,fontWeight:600,color:P.sub}}>{fmtShort(item.value)}</span></div>;})}</div></div>
              :<div style={{animation:"fadeUp 0.3s ease both"}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{selectedPieCat} <span style={{fontSize:11,fontWeight:500,color:P.sub}}>({catExpenses.length})</span></div>
                {catExpenses.sort(function(a,b){return b.amount-a.amount;}).map(function(e,i){return <div key={e.id||i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<catExpenses.length-1?"1px solid "+P.border+"80":"none",animation:"fadeUp 0.25s ease both",animationDelay:(i*30)+"ms"}}>
                  <div><div style={{fontSize:12,fontWeight:500}}>{e.name}</div>{e.date&&<div style={{fontSize:10,color:P.muted}}>{e.date}</div>}</div>
                  <span style={{fontSize:12,fontWeight:600,color:P.red}}>{fmt(e.amount)}</span></div>;})}
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1.5px solid "+P.border}}>
                  <span style={{fontSize:12,fontWeight:600}}>Subtotal</span><span style={{fontSize:13,fontWeight:700,color:P.red}}>{fmt(catExpenses.reduce(function(s,e){return s+e.amount;},0))}</span></div></div>}</Card>;})()}
          <Card delay={320}>
            <SecHead icon="↓" label="Recent"/>
            {md.expenses.length===0?<div style={{fontSize:12,color:P.muted,fontStyle:"italic"}}>No expenses yet</div>
            :md.expenses.slice().sort(function(a,b){return(b.date||"").localeCompare(a.date||"");}).slice(0,5).map(function(e,i){
              return <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<4?"1px solid "+P.border+"60":"none"}}>
                <div><div style={{fontSize:12,fontWeight:500}}>{e.name}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>{e.date&&<span style={{fontSize:10,color:P.muted}}>{e.date}</span>}
                    {e.category&&<span style={{fontSize:8,fontWeight:700,textTransform:"uppercase",color:e.category==="needs"?P.green:P.orange,background:e.category==="needs"?P.greenLt:P.orangeLt,borderRadius:4,padding:"1px 5px"}}>{e.category}</span>}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12,fontWeight:600,color:P.red}}>-{fmt(e.amount)}</span>
                  <button onClick={function(){var eid=e.id;upMonth(function(m){m.expenses=m.expenses.filter(function(x){return x.id!==eid;});});persist(function(s){if(s.balance!=null)s.balance+=e.amount;});}} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:12,padding:2}}>✕</button></div></div>;})}</Card>
          {overdueLent.length>0&&<Card delay={380} style={{border:"1.5px solid "+P.red+"30"}}>
            <SecHead icon="⏰" label="Overdue" color={P.red}/>
            {overdueLent.map(function(l){return <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0"}}>
              <span style={{fontSize:12,fontWeight:600}}>{l.name} · {fmt(l.amount)}</span><span style={{fontSize:11,color:P.red,fontWeight:600}}>Due {l.expectedDate}</span></div>;})}</Card>}
          <button onClick={function(){setTab("ai");}} style={{width:"100%",padding:13,borderRadius:14,border:"1.5px solid "+P.plum+"20",background:P.plumLt,color:P.plum,fontFamily:font,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,animation:"fadeUp 0.4s ease both",animationDelay:"420ms"}}>✦ Ask AI about your money</button>
        </div></div>)}
 
      {/* QUICK ADD */}
      {tab==="add"&&(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{fontSize:44,marginBottom:10,animation:qSaved?"badgePop 0.5s ease":"bounceIn 0.5s ease"}}>{qSaved?"✓":"💸"}</div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:4,animation:"fadeUp 0.4s ease both",animationDelay:"80ms"}}>{qSaved?"Saved":"Quick Expense"}</div>
        <div style={{fontSize:12,color:P.sub,marginBottom:22,animation:"fadeUp 0.4s ease both",animationDelay:"120ms"}}>{qSaved?"Deducted from balance":"What did you spend?"}</div>
        {!qSaved&&<div style={{width:"100%",maxWidth:320}}>
          <input placeholder="What did you buy?" value={qName} onChange={function(e){setQName(e.target.value);}} style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"12px 16px",fontSize:14,fontFamily:font,outline:"none",background:"#fff",marginBottom:8,boxSizing:"border-box",color:P.text,animation:"fadeUp 0.3s ease both",animationDelay:"160ms"}}/>
          <input type="number" min="0" step="0.01" placeholder="€ Amount" value={qAmt} onChange={function(e){setQAmt(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")quickAdd();}}
            style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"12px 16px",fontSize:22,fontWeight:800,outline:"none",background:"#fff",textAlign:"center",marginBottom:10,boxSizing:"border-box",color:P.text,animation:"fadeUp 0.3s ease both",animationDelay:"200ms"}}/>
          <input type="date" value={qDate} onChange={function(e){setQDate(e.target.value);}} style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"10px 16px",fontSize:13,fontFamily:font,outline:"none",background:"#fff",marginBottom:10,boxSizing:"border-box",color:P.text,animation:"fadeUp 0.3s ease both",animationDelay:"240ms"}}/>
          <div style={{display:"flex",gap:8,marginBottom:14,animation:"fadeUp 0.3s ease both",animationDelay:"280ms"}}>
            {[{k:"needs",l:"Need",c:P.green},{k:"wants",l:"Want",c:P.orange}].map(function(opt){
              return <button key={opt.k} onClick={function(){setQCat(opt.k);}} style={{flex:1,padding:"11px 0",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:font,cursor:"pointer",background:qCat===opt.k?(opt.k==="needs"?P.greenLt:P.orangeLt):"#fff",border:"1.5px solid "+(qCat===opt.k?opt.c:P.border),color:qCat===opt.k?opt.c:P.sub,transition:"all 0.15s"}}>{opt.l}</button>;})}</div>
          <Btn full onClick={quickAdd} bg={P.brown} style={{padding:14,fontSize:14,borderRadius:14,animation:"fadeUp 0.3s ease both",animationDelay:"320ms"}}>Add Expense</Btn>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:14,animation:"fadeUp 0.3s ease both",animationDelay:"360ms"}}>
            {[2,5,10,20,50].map(function(v){return <button key={v} onClick={function(){setQAmt(String(v));}} style={{background:"#fff",border:"1px solid "+P.border,borderRadius:20,padding:"6px 14px",fontSize:12,fontWeight:600,color:P.accent,fontFamily:font,cursor:"pointer"}}>€{v}</button>;})}</div></div>}</div>)}
 
      {/* STATS */}
      {tab==="stats"&&(<div style={{flex:1,overflowY:"auto",padding:"22px 16px"}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:2,animation:"fadeUp 0.4s ease both"}}>Stats & Recap</div>
        <div style={{fontSize:12,color:P.sub,marginBottom:16,animation:"fadeUp 0.4s ease both",animationDelay:"50ms"}}>{MONTHS[mo]} {yr}</div>
        {recap.thisWeek>0&&<Card delay={80}><SecHead icon="◷" label="This Week"/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:22,fontWeight:800,color:P.text}}>{fmt(recap.thisWeek)}</div><div style={{fontSize:11,color:P.sub}}>{recap.thisWeekCount} transactions</div></div>
            {recap.lastWeek>0&&<div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:600,color:recap.change<=0?P.green:P.red}}>{recap.change<=0?"↓":"↑"} {Math.abs(Math.round(recap.change))}%</div><div style={{fontSize:10,color:P.muted}}>vs last week</div></div>}</div></Card>}
        {forecast.length>1&&<Card delay={160}><SecHead icon="↗" label="Balance Forecast"/>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={forecast} margin={{top:5,right:5,left:-20,bottom:5}}>
              <defs><linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={P.accent} stopOpacity={0.15}/><stop offset="95%" stopColor={P.accent} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="month" tick={{fontSize:10,fill:P.sub,fontFamily:font}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:9,fill:P.muted}} axisLine={false} tickLine={false}/>
              <Tooltip formatter={function(v){return fmt(v);}} contentStyle={{fontSize:11,borderRadius:10,border:"1px solid "+P.border,fontFamily:font}}/>
              <Area type="monotone" dataKey="balance" stroke={P.accent} strokeWidth={2.5} fill="url(#fGrad)" dot={{fill:P.accent,r:3.5,strokeWidth:2,stroke:"#fff"}}/></AreaChart></ResponsiveContainer>
          <div style={{fontSize:10,color:P.sub,textAlign:"center",marginTop:4}}>Based on avg surplus of {fmt(calcAvgNet(state))}/month</div></Card>}
        {md.expenses.length>3&&(function(){var dailyMap={};
          md.expenses.forEach(function(e){if(!e.date)return;var day=parseInt(e.date.split("-")[2]);if(!dailyMap[day])dailyMap[day]=0;dailyMap[day]+=e.amount;});
          var days=Object.keys(dailyMap).map(Number).sort(function(a,b){return a-b;});if(!days.length)return null;
          var barData=days.map(function(d){return{day:""+d,amount:Math.round(dailyMap[d]*100)/100};});
          var avgPerDay=expenseT/Math.max(1,days.length);
          return <Card delay={240}><SecHead icon="▥" label="Daily Spending"/>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={barData} margin={{top:5,right:5,left:-25,bottom:5}}>
                <XAxis dataKey="day" tick={{fontSize:9,fill:P.muted}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9,fill:P.muted}} axisLine={false} tickLine={false}/>
                <Tooltip formatter={function(v){return fmt(v);}} contentStyle={{fontSize:11,borderRadius:8,border:"1px solid "+P.border,fontFamily:font}}/>
                <Bar dataKey="amount" radius={[4,4,0,0]}>{barData.map(function(entry,i){return <Cell key={i} fill={entry.amount>100?P.red:entry.amount>30?P.orange:P.accent}/>;})}
                </Bar></BarChart></ResponsiveContainer>
            <div style={{textAlign:"center",fontSize:10,color:P.sub}}>Avg: {fmt(avgPerDay)}/day</div></Card>;})()}
        {recurring.length>0&&<Card delay={320} onClick={function(){setShowRecurring(!showRecurring);}} style={{cursor:"pointer"}}>
          <SecHead icon="↻" label={"Recurring ("+recurring.length+")"} right={<span style={{fontSize:10,color:P.accent,fontWeight:600}}>{showRecurring?"Hide":"Show"}</span>}/>
          {(showRecurring?recurring:recurring.slice(0,4)).map(function(r,i){return <div key={r.name+i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<(showRecurring?recurring.length:4)-1?"1px solid "+P.border+"60":"none"}}>
            <div><div style={{fontSize:12,fontWeight:500}}>{r.name}</div><div style={{fontSize:10,color:P.muted}}>{r.count}× · ~{fmt(r.avgAmount)}</div></div>
            <span style={{fontSize:8,fontWeight:700,textTransform:"uppercase",color:r.category==="needs"?P.green:P.orange,background:r.category==="needs"?P.greenLt:P.orangeLt,borderRadius:4,padding:"2px 6px"}}>{r.category||"other"}</span></div>;})}
          <div style={{borderTop:"1px solid "+P.border,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:11}}>
            <span style={{color:P.sub}}>Est. monthly</span><span style={{fontWeight:700,color:P.accent}}>{fmt(recurring.reduce(function(s,r){return s+r.lastAmount;},0))}</span></div></Card>}
        <Card delay={400} onClick={function(){setShowBadges(!showBadges);}} style={{cursor:"pointer"}}>
          <SecHead icon="◈" label={"Badges ("+(state.badges||[]).length+"/"+Object.keys(BADGE_DEFS).length+")"} right={<span style={{fontSize:10,color:P.accent,fontWeight:600}}>{showBadges?"Hide":"Show"}</span>}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {(showBadges?Object.keys(BADGE_DEFS):(state.badges||[]).slice(0,5)).map(function(key){var def=BADGE_DEFS[key];if(!def)return null;var earned=(state.badges||[]).indexOf(key)>=0;
              return <div key={key} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:10,background:earned?P.accentLt:"#F1F5F9",border:"1px solid "+(earned?P.accent+"30":P.border),opacity:earned?1:0.35}}>
                <span style={{fontSize:16}}>{def.emoji}</span><div><div style={{fontSize:10,fontWeight:700,color:earned?P.text:P.muted}}>{def.name}</div>
                {showBadges&&<div style={{fontSize:8,color:P.sub}}>{def.desc}</div>}</div></div>;})}</div></Card>
        <Card delay={480}><SecHead icon="↥" label="Import Expenses" right={<span style={{fontSize:10,color:P.sub}}>CSV / Paste</span>}/>
          <div style={{fontSize:11,color:P.sub,lineHeight:1.5,marginBottom:8}}>Paste bank statement lines or CSV.<br/>Format: date, merchant, amount</div>
          <textarea value={csvText} onChange={function(e){setCsvText(e.target.value);setCsvParsed(null);}} placeholder={"2026-03-01,GTT Transport,38.00\n2026-03-02,Lidl,21.34"}
            style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:10,fontSize:11,fontFamily:"monospace",outline:"none",background:"#F8FAFC",boxSizing:"border-box",minHeight:70,resize:"vertical",color:P.text}}/>
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <Btn onClick={parseCSV} bg={P.brownMid} style={{fontSize:11,padding:"8px 14px"}}>Parse</Btn>
            {csvParsed&&csvParsed.length>0&&<Btn onClick={importCSV} bg={P.green} style={{fontSize:11,padding:"8px 14px"}}>Import {csvParsed.length}</Btn>}</div>
          {csvParsed&&csvParsed.length>0&&<div style={{marginTop:8,fontSize:10,color:P.sub}}>{csvParsed.slice(0,3).map(function(e,i){return <div key={i}>{e.date} · {e.name} · {fmt(e.amount)}</div>;})}{csvParsed.length>3&&<div>+{csvParsed.length-3} more</div>}</div>}
          {csvParsed&&csvParsed.length===0&&<div style={{marginTop:6,fontSize:10,color:P.red}}>Could not parse. Check format.</div>}</Card></div>)}
 
      {/* INCOME */}
      {tab==="income"&&(<div style={{flex:1,overflowY:"auto",padding:"22px 16px"}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:4,animation:"fadeUp 0.4s ease both"}}>Income</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,animation:"fadeUp 0.4s ease both",animationDelay:"50ms"}}>
          <button onClick={prevMo} style={{background:P.card,border:"1px solid "+P.border,borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:P.accent}}>◀</button>
          <span style={{fontSize:13,fontWeight:600,color:P.sub}}>{MONTHS[mo]} {yr}</span>
          <button onClick={nextMo} style={{background:P.card,border:"1px solid "+P.border,borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:P.accent}}>▶</button></div>
        <Card delay={100}><SecHead icon="⊕" label="Monthly Salary"/>
          <input type="number" min="0" step="0.01" placeholder="€ Salary" value={md.salary||""} onChange={function(e){upMonth(function(m){m.salary=parseFloat(e.target.value)||0;});}}
            style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:14,fontSize:20,fontWeight:800,outline:"none",background:"#F8FAFC",textAlign:"center",boxSizing:"border-box",color:P.text}}/></Card>
        <Card delay={180}><SecHead icon="📚" label="Private Lessons"/>
          {md.lessons.map(function(l,i){return <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<md.lessons.length-1?"1px solid "+P.border+"60":"none"}}>
            <span style={{fontSize:12,fontWeight:500}}>{l.name}</span>
            <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:12,fontWeight:600,color:P.green}}>+{fmt(l.amount)}</span>
              <button onClick={function(){upMonth(function(m){m.lessons=m.lessons.filter(function(x){return x.id!==l.id;});});}} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:12}}>✕</button></span></div>;})}
          <div style={{display:"flex",gap:6,marginTop:10}}>
            <input placeholder="Student / Subject" value={lessonName} onChange={function(e){setLessonName(e.target.value);}} style={Object.assign({},inputSt,{flex:1})}/>
            <input type="number" min="0" step="0.01" placeholder="€" value={lessonAmt} onChange={function(e){setLessonAmt(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addLesson();}} style={Object.assign({},inputSt,{width:75,textAlign:"right"})}/>
            <button onClick={addLesson} style={{background:P.green,color:"#fff",border:"none",borderRadius:10,padding:"0 12px",cursor:"pointer",fontSize:14}}>+</button></div>
          {md.lessons.length>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1.5px solid "+P.greenLt}}>
            <span style={{fontSize:12,fontWeight:600}}>Total Lessons</span><span style={{fontSize:14,fontWeight:800,color:P.green}}>{fmt(lessonT)}</span></div>}</Card>
        {incomeT>0&&<div style={{background:P.accentLt,borderRadius:16,padding:"14px 18px",textAlign:"center",animation:"fadeUp 0.4s ease both",animationDelay:"260ms"}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:P.accentDk,opacity:0.6,letterSpacing:"1px"}}>Total Income</div>
          <div style={{fontSize:24,fontWeight:800,color:P.accentDk}}><AnimNum value={incomeT}/></div></div>}</div>)}
 
      {/* GOALS */}
      {tab==="goals"&&(<div style={{flex:1,overflowY:"auto",padding:"22px 16px"}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:2,animation:"fadeUp 0.4s ease both"}}>Goals</div>
        <div style={{fontSize:12,color:P.sub,marginBottom:16,animation:"fadeUp 0.4s ease both",animationDelay:"50ms"}}>Things you want — buy when ready</div>
        {state.goals.map(function(g,gi){var avgNet=calcAvgNet(state);var recovery=avgNet>0?Math.ceil(g.target/avgNet):null;
          return <Card key={g.id} delay={gi*80+100} style={g.purchased?{opacity:0.6}:{}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:28}}>{g.emoji}</span>
                <div><div style={{fontSize:14,fontWeight:700,textDecoration:g.purchased?"line-through":"none"}}>{g.name}</div>
                  <div style={{fontSize:13,fontWeight:800,color:P.accent}}>{fmt(g.target)}</div></div></div>
              <button onClick={function(){persist(function(s){s.goals=s.goals.filter(function(x){return x.id!==g.id;});});}} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:14}}>✕</button></div>
            {g.purchased?<div style={{marginTop:8,background:P.greenLt,borderRadius:10,padding:"8px 12px"}}><span style={{fontSize:11,fontWeight:600,color:P.green}}>✓ Purchased{g.purchaseDate?" on "+g.purchaseDate:""}</span></div>
            :<div style={{marginTop:10}}>
              <div style={{background:"#F1F5F9",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:P.sub,marginBottom:6}}>
                  <span style={{fontWeight:600}}>Balance Impact</span><span style={{fontWeight:600,color:(state.balance-g.target)<0?P.red:P.orange}}>{(state.balance-g.target)<0?"Can't afford yet":"−"+Math.round((g.target/state.balance)*100)+"%"}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{fontSize:9,fontWeight:600,color:P.green,width:32}}>Now</span>
                  <div style={{flex:1,background:P.brownLt,borderRadius:20,height:7,overflow:"hidden"}}><div style={{height:"100%",borderRadius:20,width:"100%",background:P.green,transition:"width 0.6s"}}/></div></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:9,fontWeight:600,color:P.red,width:32}}>After</span>
                  <div style={{flex:1,background:P.brownLt,borderRadius:20,height:7,overflow:"hidden"}}><div style={{height:"100%",borderRadius:20,width:Math.max(0,Math.round(((state.balance-g.target)/Math.max(1,state.balance))*100))+"%",background:(state.balance-g.target)<0?P.red:P.orange,transition:"width 0.6s"}}/></div></div>
                <div style={{fontSize:10,color:P.sub,marginTop:4}}>{fmt(state.balance)} → {fmt(Math.max(0,state.balance-g.target))}{recovery?" · ~"+recovery+"mo recovery":""}</div></div>
              {confirmGoalId===g.id?<div>
                <div style={{fontSize:12,fontWeight:600,color:P.red,marginBottom:6,textAlign:"center"}}>Deduct {fmt(g.target)}?</div>
                <div style={{display:"flex",gap:6}}><Btn full onClick={function(){buyGoal(g.id);setConfirmGoalId(null);}} bg={P.red} style={{borderRadius:10}}>Yes</Btn>
                  <Btn onClick={function(){setConfirmGoalId(null);}} bg="#F1F5F9" color={P.sub} style={{borderRadius:10}}>Cancel</Btn></div></div>
              :<Btn full onClick={function(){setConfirmGoalId(g.id);}} bg={P.accent} style={{borderRadius:10}}>Mark Purchased — {fmt(g.target)}</Btn>}</div>}</Card>;})}
        {!goalOpen?<Btn full onClick={function(){setGoalOpen(true);}} bg="#fff" color={P.accent} style={{border:"1.5px dashed "+P.accent+"50",borderRadius:14}}>+ Add Goal</Btn>
        :<Card style={{border:"1.5px solid "+P.accent+"30"}}><SecHead icon="◎" label="New Goal" color={P.accent}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
            {GOAL_PRESETS.map(function(p){return <button key={p.label} onClick={function(){setGoalEmoji(p.emoji);if(!goalName)setGoalName(p.label);}}
              style={{background:goalEmoji===p.emoji?P.accentLt:"#fff",border:"1.5px solid "+(goalEmoji===p.emoji?P.accent:P.border),borderRadius:10,padding:"5px 10px",fontSize:11,fontFamily:font,cursor:"pointer",color:goalEmoji===p.emoji?P.accent:P.text,fontWeight:600}}>{p.emoji+" "+p.label}</button>;})}</div>
          <input placeholder="Goal name" value={goalName} onChange={function(e){setGoalName(e.target.value);}} style={Object.assign({},inputSt,{width:"100%",marginBottom:8})}/>
          <input type="number" min="0" step="0.01" placeholder="Cost (€)" value={goalTarget} onChange={function(e){setGoalTarget(e.target.value);}} style={Object.assign({},inputSt,{width:"100%",marginBottom:12})}/>
          <div style={{display:"flex",gap:6}}><Btn full onClick={addGoal} bg={P.accent}>Create</Btn><Btn onClick={function(){setGoalOpen(false);}} bg="#F1F5F9" color={P.sub}>Cancel</Btn></div></Card>}</div>)}
 
      {/* LENT */}
      {tab==="lent"&&(<div style={{flex:1,overflowY:"auto",padding:"22px 16px"}}>
        <div style={{fontSize:18,fontWeight:800,marginBottom:2,animation:"fadeUp 0.4s ease both"}}>Money Lent</div>
        <div style={{fontSize:12,color:P.sub,marginBottom:8,animation:"fadeUp 0.4s ease both",animationDelay:"50ms"}}>Track who owes you</div>
        {totalLentOut>0&&<div style={{background:P.tealLt,borderRadius:14,padding:"12px 16px",textAlign:"center",marginBottom:14,animation:"fadeUp 0.4s ease both",animationDelay:"100ms"}}>
          <div style={{fontSize:20,fontWeight:800,color:P.teal}}><AnimNum value={totalLentOut}/></div>
          <div style={{fontSize:10,fontWeight:700,color:P.teal,opacity:0.6,textTransform:"uppercase"}}>Outstanding</div></div>}
        {(state.lent||[]).filter(function(l){return!l.returned;}).map(function(l,i){var isOverdue=l.expectedDate&&l.expectedDate<todayStr();
          return <Card key={l.id} delay={i*60+150} style={isOverdue?{border:"1.5px solid "+P.red+"30"}:{}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:14,fontWeight:700}}>{l.name}</div>
                <div style={{fontSize:13,fontWeight:800,color:P.teal}}>{fmt(l.amount)}</div>
                <div style={{fontSize:10,color:isOverdue?P.red:P.sub,fontWeight:isOverdue?600:400}}>{l.expectedDate?(isOverdue?"⚠ Overdue: ":"Due: ")+l.expectedDate:"No date"}</div></div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                <Btn onClick={function(){markReturned(l.id);}} bg={P.green} style={{padding:"7px 12px",fontSize:11}}>✓ Got it</Btn>
                <button onClick={function(){var lid=l.id;persist(function(s){s.lent=(s.lent||[]).filter(function(x){return x.id!==lid;});if(s.balance!=null)s.balance+=l.amount;});}} style={{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:12}}>✕</button></div></div></Card>;})}
        {(state.lent||[]).filter(function(l){return l.returned;}).length>0&&<div style={{marginTop:4}}><SecHead icon="✓" label="Returned"/>
          {(state.lent||[]).filter(function(l){return l.returned;}).map(function(l){return <div key={l.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+P.border+"50",opacity:0.5}}>
            <span style={{fontSize:12}}>{l.name}</span><span style={{fontSize:12,fontWeight:600,color:P.green}}>{fmt(l.amount)}</span></div>;})}</div>}
        <Card style={{marginTop:12}}><SecHead icon="+" label="Lend Money" color={P.teal}/>
          <input placeholder="Who?" value={lentName} onChange={function(e){setLentName(e.target.value);}} style={Object.assign({},inputSt,{width:"100%",marginBottom:8})}/>
          <input type="number" min="0" step="0.01" placeholder="€ Amount" value={lentAmt} onChange={function(e){setLentAmt(e.target.value);}} style={Object.assign({},inputSt,{width:"100%",marginBottom:8})}/>
          <div style={{fontSize:11,color:P.sub,marginBottom:3}}>Expected return</div>
          <input type="date" value={lentDate} onChange={function(e){setLentDate(e.target.value);}} style={Object.assign({},inputSt,{width:"100%",marginBottom:12})}/>
          <Btn full onClick={addLent} bg={P.teal}>Record Loan</Btn></Card></div>)}
 
      {/* AI */}
      {tab==="ai"&&(<div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px"}}>
          {chat.length===0&&<div style={{textAlign:"center",padding:"30px 10px"}}>
            <div style={{fontSize:36,marginBottom:8,animation:"bounceIn 0.5s ease"}}>✦</div>
            <div style={{fontSize:16,fontWeight:800,color:P.plum,marginBottom:4,animation:"fadeUp 0.4s ease both",animationDelay:"100ms"}}>AI Advisor</div>
            <div style={{fontSize:12,color:P.sub,lineHeight:1.6,marginBottom:20,animation:"fadeUp 0.4s ease both",animationDelay:"150ms"}}>I see everything — income, habits, recurring costs, goals.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"}}>
              {AI_CHIPS.map(function(s,i){return <button key={s} onClick={function(){sendAI(s);}} style={{background:P.plumLt,border:"1px solid "+P.plum+"15",borderRadius:20,padding:"7px 14px",fontSize:11,color:P.plum,fontFamily:font,fontWeight:600,cursor:"pointer",animation:"fadeUp 0.3s ease both",animationDelay:(200+i*40)+"ms"}}>{s}</button>;})}</div></div>}
          {chat.map(function(m,i){return <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10,animation:"fadeUp 0.25s ease both"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:16,fontSize:12,lineHeight:1.7,whiteSpace:"pre-wrap",background:m.role==="user"?P.brown:P.card,color:m.role==="user"?"#fff":P.text,border:m.role==="user"?"none":"1px solid "+P.border,borderBottomRightRadius:m.role==="user"?4:16,borderBottomLeftRadius:m.role==="user"?16:4}}>
              {m.role==="assistant"&&<div style={{fontSize:9,fontWeight:700,color:P.plum,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}}>✦ Advisor</div>}{m.text}</div></div>;})}
          {aiThink&&<div style={{display:"flex",marginBottom:10}}><div style={{background:P.card,border:"1px solid "+P.border,borderRadius:16,borderBottomLeftRadius:4,padding:"12px 20px",display:"flex",gap:5}}><div className="dot dot1"/><div className="dot dot2"/><div className="dot dot3"/></div></div>}
          <div ref={chatRef}/></div>
        {chat.length>0&&<div style={{padding:"4px 16px",display:"flex",gap:4,overflowX:"auto",flexShrink:0}}>
          {AI_CHIPS.slice(0,3).map(function(s){return <button key={s} onClick={function(){sendAI(s);}} disabled={aiThink} style={{background:P.plumLt,border:"none",borderRadius:16,padding:"5px 10px",fontSize:10,color:P.plum,fontFamily:font,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",opacity:aiThink?0.4:1}}>{s}</button>;})}</div>}
        <div style={{padding:"10px 16px 12px",display:"flex",gap:8,flexShrink:0}}>
          <input placeholder="Ask about your finances..." value={aiMsg} onChange={function(e){setAiMsg(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"){e.preventDefault();sendAI();}}} disabled={aiThink}
            style={{flex:1,border:"1.5px solid "+P.border,borderRadius:24,padding:"10px 16px",fontSize:12,fontFamily:font,outline:"none",background:"#fff",boxSizing:"border-box",color:P.text}}/>
          <button onClick={function(){sendAI();}} disabled={aiThink||!aiMsg.trim()} style={{background:aiThink?P.muted:P.plum,color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div></div>)}
 
      {/* BOTTOM NAV — 3 + 3 */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(240,242,245,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderTop:"1px solid "+P.border,display:"flex",alignItems:"center",justifyContent:"space-around",padding:"3px 0 8px",zIndex:100}}>
        {["home","income","stats","add","lent","goals","ai"].map(function(id){
          var labels={home:"Home",income:"Income",stats:"Stats",add:"",lent:"Lent",goals:"Goals",ai:"AI"};
          if(id==="add") return <button key="add" onClick={function(){setTab("add");}} style={{background:"linear-gradient(135deg, #0F766E, #0D9488)",border:"none",borderRadius:"50%",width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 14px rgba(13,148,136,0.35)",marginTop:-14}}>
            <NavIcon type="add"/></button>;
          return <button key={id} onClick={function(){setTab(id);}} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"2px 4px",fontFamily:font}}>
            <NavIcon type={id} active={tab===id}/><span style={{fontSize:8,fontWeight:700,color:tab===id?P.accent:P.muted}}>{labels[id]}</span></button>;})}
      </div>
      <style>{animCSS}</style></div>);
}
 
var animCSS = "\n@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}\n@keyframes bounceIn{0%{opacity:0;transform:scale(.3)}50%{transform:scale(1.06)}70%{transform:scale(.96)}100%{opacity:1;transform:scale(1)}}\n@keyframes badgePop{0%{opacity:0;transform:translateX(-50%) scale(.5) translateY(-16px)}60%{transform:translateX(-50%) scale(1.03) translateY(0)}100%{opacity:1;transform:translateX(-50%) scale(1) translateY(0)}}\n.loadSpin{animation:spin .7s linear infinite}\n@keyframes spin{to{transform:rotate(360deg)}}\n.dot{width:6px;height:6px;border-radius:50%;background:#E86565;animation:pulse 1.2s ease-in-out infinite}\n.dot1{animation-delay:0s}.dot2{animation-delay:.15s}.dot3{animation-delay:.3s}\n@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}\ninput:focus{border-color:#0D9488!important}\nbutton:active{transform:scale(.97)}\n*{box-sizing:border-box;margin:0;padding:0}\nbody{margin:0;overflow-x:hidden}\n::-webkit-scrollbar{width:3px}\n::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:3px}\n";
 
