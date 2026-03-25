import React, { useState, useEffect, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { loadAll, saveAll } from "./firebase.js";

var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var uid = function() { return Math.random().toString(36).slice(2,9); };
var fmt = function(n) { return (Number(n)||0).toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €"; };
var todayStr = function() { var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

var P = {
  bg:"#F5F0E8",card:"#FFFFFF",accent:"#3A7D5C",accentDk:"#1E4D38",accentLt:"#E2F2E8",
  orange:"#D97B3D",orangeLt:"#FFF0E2",red:"#C94F4F",redLt:"#FDE8E8",
  blue:"#4A7FB5",blueLt:"#E4EFF8",purple:"#7C5CBF",purpleLt:"#EDE5F8",
  teal:"#2A9D8F",tealLt:"#E0F5F2",
  text:"#2B2B2B",sub:"#7A756E",muted:"#ADA89F",border:"#E6E1D8",
  cardSh:"0 1px 8px rgba(0,0,0,0.05)",
};
var font="'Nunito',sans-serif";

var blankState=function(){return{balance:null,months:{},goals:[],lent:[]};};
var blankMonth=function(){return{salary:0,lessons:[],expenses:[]};};

// ─── Pre-filled March 2026 from bank statements ───
var PREFILL_DATA=function(){
  return {
    balance:5680.40,
    goals:[],
    lent:[],
    months:{
      "2026-03":{
        salary:1736,
        lessons:[
          {id:uid(),name:"GoStudent Online Tutoring",amount:1044.50}
        ],
        expenses:[
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
        ]
      }
    }
  };
};
var GOAL_PRESETS=[
  {emoji:"📱",label:"Phone"},{emoji:"💻",label:"Laptop"},{emoji:"✈️",label:"Trip"},
  {emoji:"🚗",label:"Car"},{emoji:"🏠",label:"Furniture"},{emoji:"👟",label:"Shoes"},
  {emoji:"📚",label:"Course"},{emoji:"🎮",label:"Console"},{emoji:"⌚",label:"Watch"},
  {emoji:"🎸",label:"Hobby"},{emoji:"🎁",label:"Gift"},{emoji:"💡",label:"Other"},
];

var AI_CHIPS=["How am I doing?","Can I reach my goals?","Where do I overspend?","How many extra lessons?","Who owes me money?","50/30/20 check"];

// ─── AI context builder ───
function buildCtx(state,mk){
  var b=state.balance,months=state.months,goals=state.goals,lent=state.lent||[];
  var c="=== TEACHER FINANCE DATA ===\nBalance: "+(b!=null?"€"+b:"not set")+"\nViewing: "+mk+"\nToday: "+new Date().toLocaleDateString()+"\n\n";
  c+="BUDGET RULE: 50/30/20 (50% needs, 30% fun/wants, 20% savings)\n\n";
  var keys=Object.keys(months).sort();
  for(var i=0;i<keys.length;i++){
    var k=keys[i],d=months[k],parts=k.split("-");
    var mn=MONTHS[parseInt(parts[1])]+" "+parts[0];
    var lt=(d.lessons||[]).reduce(function(s,l){return s+l.amount;},0);
    var et=(d.expenses||[]).reduce(function(s,e){return s+e.amount;},0);
    var inc=(d.salary||0)+lt;
    var needs50=inc*0.5,wants30=inc*0.3,save20=inc*0.2;
    c+="-- "+mn+" --\nSalary: €"+(d.salary||0)+"\n";
    if(d.lessons&&d.lessons.length){c+="Lessons: ";d.lessons.forEach(function(l){c+=l.name+" €"+l.amount+", ";});c+="Total: €"+lt+"\n";}
    c+="Total income: €"+inc+"\n";
    c+="50/30/20 split: Needs €"+needs50.toFixed(0)+" | Fun €"+wants30.toFixed(0)+" | Savings €"+save20.toFixed(0)+"\n";
    if(d.expenses&&d.expenses.length){c+="Expenses:\n";d.expenses.forEach(function(e){c+="  "+e.name+": €"+e.amount+" ("+( e.category||"uncategorized")+")\n";});c+="Total spent: €"+et+"\n";}
    c+="Net: €"+(inc-et).toFixed(2)+"\n\n";
  }
  if(goals.length){c+="-- GOALS (things to buy) --\n";goals.forEach(function(g){
    c+=g.emoji+" "+g.name+": €"+g.target+(g.purchased?" [PURCHASED - setback €"+g.target+"]":" [not yet purchased]")+"\n";
  });}
  c+="\n";
  if(lent.length){c+="-- MONEY LENT --\n";lent.forEach(function(l){
    c+=l.name+": €"+l.amount+" (expected: "+(l.expectedDate||"unknown")+(l.returned?" [RETURNED]":" [PENDING]")+")\n";
  });}
  return c;
}

async function askAI(state,mk,userMsg,history){
  var sys="You are a friendly financial advisor in a teacher's finance app. The teacher earns salary + private lessons.\n\nYou see ALL their data. Be specific with real numbers. Keep replies 2-3 paragraphs, warm, practical. Use €.\n\nIMPORTANT RULES:\n- Use the 50/30/20 rule (50% needs, 30% fun, 20% savings) to evaluate their spending\n- For goals/purchases, calculate recovery time based on their average monthly surplus\n- Flag money lent that is overdue\n- Suggest extra lessons when goals seem hard to reach\n- Always reference their actual numbers\n\n"+buildCtx(state,mk);
  var msgs=history.map(function(m){return{role:m.role,content:m.text};});
  msgs.push({role:"user",content:userMsg});

  // Use the serverless proxy instead of calling Anthropic directly
  var res=await fetch("/api/chat",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({system:sys,messages:msgs}),
  });
  var data=await res.json();
  if(data.content)return data.content.map(function(b){return b.text||"";}).join("\n");
  if(data.error)return "AI is not configured yet. Add your ANTHROPIC_API_KEY in Vercel settings.";
  return "Something went wrong, please try again.";
}

function calcAvgNet(state){
  var keys=Object.keys(state.months);if(!keys.length)return 0;
  var total=0;
  for(var i=0;i<keys.length;i++){var d=state.months[keys[i]];
    var inc=(d.salary||0)+(d.lessons||[]).reduce(function(s,l){return s+l.amount;},0);
    var exp=(d.expenses||[]).reduce(function(s,e){return s+e.amount;},0);
    total+=inc-exp;}
  return total/keys.length;
}

// ─── Shared Components ───
function Card(props){return React.createElement("div",{style:Object.assign({background:P.card,borderRadius:16,padding:"16px 18px",boxShadow:P.cardSh,border:"1px solid "+P.border,marginBottom:12},props.style||{})},props.children);}
function SecHead(props){return React.createElement("div",{style:{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.8px",color:props.color||P.sub,marginBottom:10,display:"flex",alignItems:"center",gap:6}},props.icon," ",props.label);}
function Btn(props){return React.createElement("button",{onClick:props.onClick,style:Object.assign({background:props.bg||P.accent,color:props.color||"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,fontFamily:font,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:props.full?"100%":"auto"},props.style||{})},props.children);}
function NavIcon(props){
  var c=props.active?P.accent:P.muted;
  var map={
    home:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2},React.createElement("path",{d:"M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"})),
    add:React.createElement("svg",{width:26,height:26,viewBox:"0 0 24 24",fill:"none",stroke:"#fff",strokeWidth:2.5},React.createElement("line",{x1:12,y1:6,x2:12,y2:18}),React.createElement("line",{x1:6,y1:12,x2:18,y2:12})),
    income:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2},React.createElement("rect",{x:2,y:6,width:20,height:14,rx:2}),React.createElement("path",{d:"M2 10h20"})),
    goals:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2},React.createElement("circle",{cx:12,cy:12,r:10}),React.createElement("circle",{cx:12,cy:12,r:6}),React.createElement("circle",{cx:12,cy:12,r:2,fill:c})),
    lent:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2},React.createElement("path",{d:"M17 1l4 4-4 4"}),React.createElement("path",{d:"M3 11V9a4 4 0 014-4h14"}),React.createElement("path",{d:"M7 23l-4-4 4-4"}),React.createElement("path",{d:"M21 13v2a4 4 0 01-4 4H3"})),
    ai:React.createElement("svg",{width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2},React.createElement("path",{d:"M12 2l2 5.5L20 8l-4.5 4L17 18l-5-3.5L7 18l1.5-6L4 8l6-.5z"})),
  };
  return map[props.type]||null;
}

var inputSt={border:"1.5px solid "+P.border,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:font,outline:"none",background:"#FDFBF7",boxSizing:"border-box"};

// ═══ MAIN APP ═══
export default function App(){
  var now=new Date();
  var [mo,setMo]=useState(now.getMonth());
  var [yr,setYr]=useState(now.getFullYear());
  var [state,setState]=useState(blankState());
  var [ready,setReady]=useState(false);
  var [tab,setTab]=useState("home");

  var [chat,setChat]=useState([]);
  var [aiMsg,setAiMsg]=useState("");
  var [aiThink,setAiThink]=useState(false);
  var chatRef=useRef(null);

  var [qName,setQName]=useState("");
  var [qAmt,setQAmt]=useState("");
  var [qCat,setQCat]=useState("needs");
  var [qDate,setQDate]=useState(todayStr());
  var [qSaved,setQSaved]=useState(false);

  var [goalOpen,setGoalOpen]=useState(false);
  var [goalEmoji,setGoalEmoji]=useState("📱");
  var [goalName,setGoalName]=useState("");
  var [goalTarget,setGoalTarget]=useState("");

  var [lentName,setLentName]=useState("");
  var [lentAmt,setLentAmt]=useState("");
  var [lentDate,setLentDate]=useState("");

  var [lessonName,setLessonName]=useState("");
  var [lessonAmt,setLessonAmt]=useState("");

  var [editingBalance,setEditingBalance]=useState(false);
  var [balanceInput,setBalanceInput]=useState("");
  var [confirmGoalId,setConfirmGoalId]=useState(null);

  var mk=yr+"-"+String(mo+1).padStart(2,"0");
  var md=state.months[mk]||blankMonth();

  var persist=useCallback(function(fn){
    setState(function(prev){var next=JSON.parse(JSON.stringify(prev));fn(next);saveAll(next);return next;});
  },[]);
  var upMonth=useCallback(function(fn){
    persist(function(s){if(!s.months[mk])s.months[mk]=blankMonth();fn(s.months[mk]);});
  },[persist,mk]);

  useEffect(function(){loadAll().then(function(d){if(d){setState(d);}else{setState(PREFILL_DATA());}setReady(true);});},[]);
  useEffect(function(){if(chatRef.current)chatRef.current.scrollIntoView({behavior:"smooth"});},[chat,aiThink]);

  var prevMo=function(){if(mo===0){setMo(11);setYr(function(y){return y-1});}else setMo(function(m){return m-1;});};
  var nextMo=function(){if(mo===11){setMo(0);setYr(function(y){return y+1});}else setMo(function(m){return m+1;});};

  var lessonT=md.lessons.reduce(function(s,l){return s+l.amount;},0);
  var incomeT=(md.salary||0)+lessonT;
  var expenseT=md.expenses.reduce(function(s,e){return s+e.amount;},0);
  var net=incomeT-expenseT;

  // 50/30/20
  var needs50=incomeT*0.5, wants30=incomeT*0.3, save20=incomeT*0.2;
  var spentNeeds=md.expenses.filter(function(e){return e.category==="needs";}).reduce(function(s,e){return s+e.amount;},0);
  var spentWants=md.expenses.filter(function(e){return e.category==="wants";}).reduce(function(s,e){return s+e.amount;},0);
  var spentOther=md.expenses.filter(function(e){return!e.category||e.category==="other";}).reduce(function(s,e){return s+e.amount;},0);

  // Lent totals
  var totalLentOut=(state.lent||[]).filter(function(l){return!l.returned;}).reduce(function(s,l){return s+l.amount;},0);
  var overdueLent=(state.lent||[]).filter(function(l){return!l.returned&&l.expectedDate&&l.expectedDate<todayStr();});

  var addLesson=function(){var a=parseFloat(lessonAmt);if(!lessonName.trim()||!a)return;var name=lessonName.trim();
    upMonth(function(m){m.lessons.push({id:uid(),name:name,amount:a});});
    persist(function(s){if(s.balance!=null)s.balance+=a;});
    setLessonName("");setLessonAmt("");};

  var quickAdd=function(){var a=parseFloat(qAmt);if(!qName.trim()||!a)return;var name=qName.trim();
    var expDate=qDate||todayStr();
    var parts=expDate.split("-");
    var targetMk=parts[0]+"-"+parts[1];
    persist(function(s){if(!s.months[targetMk])s.months[targetMk]=blankMonth();
      s.months[targetMk].expenses.push({id:uid(),name:name,amount:a,date:expDate,category:qCat});
      if(s.balance!=null)s.balance=Math.max(0,s.balance-a);});
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
    persist(function(s){if(!s.lent)s.lent=[];
      s.lent.push({id:uid(),name:lentName.trim(),amount:a,date:todayStr(),expectedDate:lentDate||"",returned:false});
      if(s.balance!=null)s.balance=Math.max(0,s.balance-a);});
    setLentName("");setLentAmt("");setLentDate("");};

  var markReturned=function(lid){persist(function(s){var l=(s.lent||[]).find(function(x){return x.id===lid;});
    if(l&&!l.returned){l.returned=true;l.returnDate=todayStr();if(s.balance!=null)s.balance+=l.amount;}});};

  var sendAI=async function(text){var m=text||aiMsg.trim();if(!m||aiThink)return;setAiMsg("");
    var nc=chat.concat([{role:"user",text:m}]);setChat(nc);setAiThink(true);
    try{var r=await askAI(state,mk,m,chat);setChat(nc.concat([{role:"assistant",text:r}]));}
    catch(e){setChat(nc.concat([{role:"assistant",text:"Connection error — try again."}]));}
    setAiThink(false);};

  if(!ready)return React.createElement("div",{style:{fontFamily:font,display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:P.bg,color:P.muted}},"Loading...");

  // ─── Onboarding ───
  if(state.balance===null){
    return(
      <div style={{fontFamily:font,background:P.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
        <div style={{fontSize:48,marginBottom:16}}>👋</div>
        <div style={{fontSize:22,fontWeight:800,color:P.text,marginBottom:6}}>Welcome!</div>
        <div style={{fontSize:14,color:P.sub,textAlign:"center",lineHeight:1.5,marginBottom:28,maxWidth:300}}>
          How much money do you have right now? All accounts, wallet, everything.
        </div>
        <input type="number" min="0" step="0.01" placeholder="€ Your current balance"
          value={state._onboard||""} onChange={function(e){setState(function(p){return Object.assign({},p,{_onboard:parseFloat(e.target.value)||0});});}}
          style={{width:"100%",maxWidth:280,border:"1.5px solid "+P.border,borderRadius:12,padding:14,fontSize:22,fontWeight:700,fontFamily:font,outline:"none",background:"#FDFBF7",textAlign:"center",boxSizing:"border-box",marginBottom:20}}/>
        <Btn full onClick={function(){persist(function(s){s.balance=s._onboard||0;delete s._onboard;});}} style={{maxWidth:280}}>Start Tracking →</Btn>
      </div>
    );
  }

  // ─── Budget bar helper ───
  var BudgetBar=function(props){
    var pct=props.budget>0?Math.min(100,Math.round((props.spent/props.budget)*100)):0;
    var over=props.spent>props.budget;
    return(
      <div style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
          <span style={{fontSize:12,fontWeight:700,color:props.color}}>{props.label}</span>
          <span style={{fontSize:11,color:over?P.red:P.sub,fontWeight:600}}>{fmt(props.spent)} / {fmt(props.budget)}</span>
        </div>
        <div style={{background:P.border,borderRadius:20,height:8,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:20,width:pct+"%",background:over?P.red:props.color,transition:"width .3s"}}/>
        </div>
        {over&&<div style={{fontSize:10,color:P.red,fontWeight:700,marginTop:2}}>⚠️ Over by {fmt(props.spent-props.budget)}</div>}
      </div>
    );
  };

  return(
    <div style={{fontFamily:font,background:P.bg,minHeight:"100vh",color:P.text,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",paddingBottom:74}}>

      {/* ═══ HOME ═══ */}
      {tab==="home"&&(
        <div style={{flex:1,overflowY:"auto"}}>
          <div style={{background:"linear-gradient(140deg,"+P.accentDk+","+P.accent+")",color:"#fff",padding:"26px 22px 22px",borderRadius:"0 0 28px 28px"}}>
            <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",opacity:0.7,marginBottom:3}}>Current Balance</div>
            <div style={{fontSize:30,fontWeight:800,letterSpacing:"-1px"}}>{fmt(state.balance)}</div>
            {totalLentOut>0&&<div style={{fontSize:12,opacity:0.8,marginTop:4}}>💸 €{totalLentOut.toFixed(0)} lent out{overdueLent.length>0?" ("+overdueLent.length+" overdue!)":""}</div>}
            {!editingBalance
              ?React.createElement("button",{onClick:function(){setEditingBalance(true);setBalanceInput(String(state.balance||0));},
                style:{marginTop:10,background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:600,fontFamily:font,cursor:"pointer"}},"Edit Balance")
              :React.createElement("div",{style:{marginTop:10,display:"flex",gap:6,alignItems:"center"}},
                React.createElement("input",{type:"number",min:"0",step:"0.01",value:balanceInput,
                  onChange:function(e){setBalanceInput(e.target.value);},
                  onKeyDown:function(e){if(e.key==="Enter"){persist(function(s){s.balance=parseFloat(balanceInput)||0;});setEditingBalance(false);}},
                  autoFocus:true,
                  style:{width:140,border:"none",borderRadius:8,padding:"8px 12px",fontSize:16,fontWeight:700,fontFamily:font,outline:"none",textAlign:"center",boxSizing:"border-box"}}),
                React.createElement("button",{onClick:function(){persist(function(s){s.balance=parseFloat(balanceInput)||0;});setEditingBalance(false);},
                  style:{background:"rgba(255,255,255,0.3)",border:"none",borderRadius:8,padding:"8px 12px",color:"#fff",fontSize:12,fontWeight:700,fontFamily:font,cursor:"pointer"}},"Save"),
                React.createElement("button",{onClick:function(){setEditingBalance(false);},
                  style:{background:"none",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"8px 10px",color:"#fff",fontSize:12,fontFamily:font,cursor:"pointer"}},"✕"))
            }
          </div>
          <div style={{padding:"14px 16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"2px 0 12px"}}>
              <button onClick={prevMo} style={{background:"none",border:"none",cursor:"pointer",color:P.accent,fontSize:18}}>◀</button>
              <div style={{fontSize:15,fontWeight:700,minWidth:140,textAlign:"center"}}>{MONTHS[mo]} {yr}</div>
              <button onClick={nextMo} style={{background:"none",border:"none",cursor:"pointer",color:P.accent,fontSize:18}}>▶</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{l:"Income",v:incomeT,bg:P.accentLt,c:P.accentDk},{l:"Spent",v:expenseT,bg:P.redLt,c:P.red},{l:"Net",v:net,bg:net>=0?P.blueLt:P.redLt,c:net>=0?P.blue:P.red}].map(function(b){
                return React.createElement("div",{key:b.l,style:{background:b.bg,borderRadius:12,padding:"11px 6px",textAlign:"center"}},
                  React.createElement("div",{style:{fontSize:15,fontWeight:800,color:b.c}},fmt(b.v)),
                  React.createElement("div",{style:{fontSize:10,fontWeight:700,textTransform:"uppercase",color:b.c,opacity:0.7,marginTop:2}},b.l));
              })}
            </div>

            {/* Income vs Expense Chart */}
            {incomeT>0&&(function(){
              var chartData=[
                {name:"Salary",amount:md.salary||0,fill:P.accent},
                {name:"Lessons",amount:lessonT,fill:P.blue},
                {name:"Needs",amount:spentNeeds,fill:"#E74C3C"},
                {name:"Wants",amount:spentWants,fill:P.orange},
                {name:"Saved",amount:Math.max(0,net),fill:P.teal},
              ];
              return React.createElement(Card,null,
                React.createElement(SecHead,{icon:"💰",label:"Income vs Spending"}),
                React.createElement(ResponsiveContainer,{width:"100%",height:160},
                  React.createElement(BarChart,{data:chartData,margin:{top:5,right:5,left:-20,bottom:5}},
                    React.createElement(XAxis,{dataKey:"name",tick:{fontSize:10,fill:P.sub},axisLine:false,tickLine:false}),
                    React.createElement(YAxis,{tick:{fontSize:9,fill:P.muted},axisLine:false,tickLine:false}),
                    React.createElement(Tooltip,{formatter:function(v){return"€"+Number(v).toFixed(2);},contentStyle:{fontSize:12,borderRadius:8,border:"1px solid "+P.border}}),
                    React.createElement(Bar,{dataKey:"amount",radius:[6,6,0,0]},
                      chartData.map(function(entry,i){return React.createElement(Cell,{key:i,fill:entry.fill});})
                    )
                  )
                )
              );
            })()}

            {/* 50/30/20 Breakdown */}
            {incomeT>0&&(
              <Card>
                <SecHead icon="📊" label="50 / 30 / 20 Budget Rule"/>
                <BudgetBar label="50% Needs" budget={needs50} spent={spentNeeds} color={P.accent}/>
                <BudgetBar label="30% Fun & Wants" budget={wants30} spent={spentWants} color={P.orange}/>
                <BudgetBar label="20% Savings" budget={save20} spent={Math.max(0,net)} color={P.blue}/>
                <div style={{fontSize:11,color:P.sub,lineHeight:1.4,marginTop:4}}>
                  {Math.max(0,net)>=save20?"✅ On track to hit savings target!":"You're saving "+fmt(Math.max(0,net))+" of "+fmt(save20)+" target."}
                </div>
              </Card>
            )}

            {/* Spending Pie Chart + Category List */}
            {expenseT>0&&(function(){
              var groups={};
              var catColorMap={};
              md.expenses.forEach(function(e){
                var n=e.name.toLowerCase();
                var cat="Other"; var col=P.muted;
                if(n.indexOf("lidl")>=0||n.indexOf("carrefour")>=0||n.indexOf("grocer")>=0){cat="Groceries";col=P.accent;}
                else if(n.indexOf("rent")>=0){cat="Rent";col="#E74C3C";}
                else if(n.indexOf("mcdonald")>=0||n.indexOf("signor panino")>=0||n.indexOf("bkno")>=0||n.indexOf("efeso")>=0||n.indexOf("bistrot")>=0||n.indexOf("cafe")>=0){cat="Dining Out";col=P.orange;}
                else if(n.indexOf("tabacchi")>=0||n.indexOf("procino")>=0||n.indexOf("di feo")>=0||n.indexOf("filomena")>=0){cat="Tabacchi";col="#E67E22";}
                else if(n.indexOf("gtt")>=0||n.indexOf("transport")>=0){cat="Transport";col=P.blue;}
                else if(n.indexOf("iliad")>=0||n.indexOf("phone")>=0){cat="Phone";col="#8E44AD";}
                else if(n.indexOf("claude")>=0||n.indexOf("apple")>=0||n.indexOf("subscription")>=0){cat="Subscriptions";col=P.purple;}
                else if(n.indexOf("planet")>=0||n.indexOf("night")>=0){cat="Going Out";col="#2ECC71";}
                else if(n.indexOf("bank")>=0||n.indexOf("commission")>=0||n.indexOf("transfer")>=0){cat="Bank Fees";col="#95A5A6";}
                else{cat="Other";col="#BDC3C7";}
                if(!groups[cat])groups[cat]=0;
                groups[cat]+=e.amount;
                catColorMap[cat]=col;
              });
              var pieData=Object.keys(groups).sort(function(a,b){return groups[b]-groups[a];}).map(function(cat){
                return{name:cat,value:Math.round(groups[cat]*100)/100,color:catColorMap[cat]};
              });
              return React.createElement(Card,null,
                React.createElement(SecHead,{icon:"🍕",label:"Where Your Money Goes"}),
                React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},
                  React.createElement(ResponsiveContainer,{width:"45%",height:150},
                    React.createElement(PieChart,null,
                      React.createElement(Pie,{data:pieData,cx:"50%",cy:"50%",innerRadius:30,outerRadius:60,dataKey:"value",strokeWidth:2,stroke:"#fff"},
                        pieData.map(function(entry,i){return React.createElement(Cell,{key:i,fill:entry.color});})
                      )
                    )
                  ),
                  React.createElement("div",{style:{flex:1}},
                    pieData.map(function(item){
                      return React.createElement("div",{key:item.name,style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 0"}},
                        React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                          React.createElement("div",{style:{width:10,height:10,borderRadius:3,background:item.color,flexShrink:0}}),
                          React.createElement("span",{style:{fontSize:11,fontWeight:600}},item.name)),
                        React.createElement("span",{style:{fontSize:11,fontWeight:700,color:P.sub}},"€"+item.value.toFixed(0)+" ("+Math.round((item.value/expenseT)*100)+"%)"));
                    })
                  )
                ),
                React.createElement("div",{style:{borderTop:"1px solid "+P.border,paddingTop:8,marginTop:6,display:"flex",justifyContent:"space-between"}},
                  React.createElement("span",{style:{fontSize:12,fontWeight:700}},"Total Spent"),
                  React.createElement("span",{style:{fontSize:13,fontWeight:800,color:P.red}},fmt(expenseT)))
              );
            })()}

            {/* Daily Spending Bar Chart */}
            {md.expenses.length>3&&(function(){
              var dailyMap={};
              md.expenses.forEach(function(e){
                if(!e.date)return;
                var day=parseInt(e.date.split("-")[2]);
                if(!dailyMap[day])dailyMap[day]=0;
                dailyMap[day]+=e.amount;
              });
              var days=Object.keys(dailyMap).map(Number).sort(function(a,b){return a-b;});
              if(!days.length)return null;
              var barData=days.map(function(d){return{day:""+d,amount:Math.round(dailyMap[d]*100)/100};});
              var maxDay=days.reduce(function(a,b){return dailyMap[a]>dailyMap[b]?a:b;});
              var avgPerDay=expenseT/Math.max(1,days.length);
              return React.createElement(Card,null,
                React.createElement(SecHead,{icon:"📅",label:"Daily Spending"}),
                React.createElement(ResponsiveContainer,{width:"100%",height:120},
                  React.createElement(BarChart,{data:barData,margin:{top:5,right:5,left:-25,bottom:5}},
                    React.createElement(XAxis,{dataKey:"day",tick:{fontSize:9,fill:P.muted},axisLine:false,tickLine:false}),
                    React.createElement(YAxis,{tick:{fontSize:9,fill:P.muted},axisLine:false,tickLine:false}),
                    React.createElement(Tooltip,{formatter:function(v){return"€"+Number(v).toFixed(2);},contentStyle:{fontSize:11,borderRadius:8,border:"1px solid "+P.border}}),
                    React.createElement(Bar,{dataKey:"amount",radius:[4,4,0,0]},
                      barData.map(function(entry,i){
                        return React.createElement(Cell,{key:i,fill:entry.amount>100?P.red:entry.amount>30?P.orange:P.accent});
                      })
                    )
                  )
                ),
                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:11,color:P.sub,marginTop:2}},
                  React.createElement("span",null,"Avg: "+fmt(avgPerDay)+"/day"),
                  React.createElement("span",{style:{fontWeight:700}},"Peak: €"+Math.round(dailyMap[maxDay])+" on "+MONTHS[mo]+" "+maxDay))
              );
            })()}

            <Card>
              <SecHead icon="💸" label="Recent Expenses"/>
              {md.expenses.length===0
                ?<div style={{fontSize:13,color:P.muted,fontStyle:"italic"}}>No expenses yet — tap + to add</div>
                :md.expenses.slice().sort(function(a,b){return(b.date||"").localeCompare(a.date||"");}).slice(0,8).map(function(e){
                  var catColors={needs:P.accent,wants:P.orange,other:P.sub};
                  return React.createElement("div",{key:e.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+P.border}},
                    React.createElement("div",null,
                      React.createElement("div",{style:{fontSize:13,fontWeight:600}},e.name),
                      React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
                        e.date&&React.createElement("span",{style:{fontSize:11,color:P.muted}},e.date),
                        e.category&&React.createElement("span",{style:{fontSize:9,fontWeight:700,textTransform:"uppercase",color:catColors[e.category]||P.sub,background:(e.category==="needs"?P.accentLt:e.category==="wants"?P.orangeLt:"#eee"),borderRadius:6,padding:"1px 6px"}},e.category))),
                    React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                      React.createElement("span",{style:{fontSize:13,fontWeight:700,color:P.red}},"-"+fmt(e.amount)),
                      React.createElement("button",{onClick:function(){var eid=e.id;upMonth(function(m){m.expenses=m.expenses.filter(function(x){return x.id!==eid;});});persist(function(s){if(s.balance!=null)s.balance+=e.amount;});},
                        style:{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:13,padding:2}},"✕")));
                })
              }
            </Card>

            {overdueLent.length>0&&(
              <Card style={{border:"2px solid "+P.red+"40"}}>
                <SecHead icon="⏰" label="Overdue Returns" color={P.red}/>
                {overdueLent.map(function(l){return React.createElement("div",{key:l.id,style:{display:"flex",justifyContent:"space-between",padding:"4px 0"}},
                  React.createElement("span",{style:{fontSize:13,fontWeight:600}},l.name+" owes "+fmt(l.amount)),
                  React.createElement("span",{style:{fontSize:11,color:P.red,fontWeight:700}},"Due: "+l.expectedDate));})}
              </Card>
            )}

            <button onClick={function(){setTab("ai");}} style={{width:"100%",padding:13,borderRadius:14,border:"1.5px solid "+P.purple+"25",background:P.purpleLt,color:P.purple,fontFamily:font,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
              ✨ Ask AI about your money
            </button>
          </div>
        </div>
      )}

      {/* ═══ QUICK ADD ═══ */}
      {tab==="add"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{fontSize:48,marginBottom:10}}>{qSaved?"✅":"💸"}</div>
          <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{qSaved?"Saved!":"Quick Expense"}</div>
          <div style={{fontSize:13,color:P.sub,marginBottom:24,textAlign:"center"}}>{qSaved?"Deducted from your balance":"What did you just spend?"}</div>
          {!qSaved&&(
            <div style={{width:"100%",maxWidth:320}}>
              <input placeholder="What did you buy?" value={qName} onChange={function(e){setQName(e.target.value);}}
                style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"12px 16px",fontSize:15,fontFamily:font,outline:"none",background:"#fff",marginBottom:8,boxSizing:"border-box"}}/>
              <input type="number" min="0" step="0.01" placeholder="€ Amount" value={qAmt} onChange={function(e){setQAmt(e.target.value);}}
                onKeyDown={function(e){if(e.key==="Enter")quickAdd();}}
                style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"12px 16px",fontSize:22,fontWeight:700,fontFamily:font,outline:"none",background:"#fff",textAlign:"center",marginBottom:10,boxSizing:"border-box"}}/>
              <input type="date" value={qDate} onChange={function(e){setQDate(e.target.value);}}
                style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:"10px 16px",fontSize:14,fontFamily:font,outline:"none",background:"#fff",marginBottom:10,boxSizing:"border-box",color:P.text}}/>
              <div style={{display:"flex",gap:6,marginBottom:14}}>
                {[{k:"needs",l:"🏠 Need",c:P.accent},{k:"wants",l:"🎉 Want",c:P.orange}].map(function(opt){
                  return React.createElement("button",{key:opt.k,onClick:function(){setQCat(opt.k);},
                    style:{flex:1,padding:"10px 0",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:font,cursor:"pointer",
                      background:qCat===opt.k?(opt.k==="needs"?P.accentLt:P.orangeLt):"#fff",
                      border:"1.5px solid "+(qCat===opt.k?opt.c:P.border),color:qCat===opt.k?opt.c:P.sub}},opt.l);
                })}
              </div>
              <Btn full onClick={quickAdd} bg={P.red} style={{padding:14,fontSize:15,borderRadius:14}}>💸 Add Expense</Btn>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14,flexWrap:"wrap"}}>
                {[2,5,10,20,50].map(function(v){
                  return React.createElement("button",{key:v,onClick:function(){setQAmt(String(v));},
                    style:{background:P.orangeLt,border:"1px solid "+P.orange+"30",borderRadius:20,padding:"6px 16px",fontSize:13,fontWeight:700,color:P.orange,fontFamily:font,cursor:"pointer"}},"€"+v);
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ INCOME ═══ */}
      {tab==="income"&&(
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>Income</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={prevMo} style={{background:"none",border:"none",cursor:"pointer",color:P.accent,fontSize:16}}>◀</button>
            <span style={{fontSize:14,fontWeight:600,color:P.sub}}>{MONTHS[mo]} {yr}</span>
            <button onClick={nextMo} style={{background:"none",border:"none",cursor:"pointer",color:P.accent,fontSize:16}}>▶</button>
          </div>
          <Card>
            <SecHead icon="💰" label="Monthly Salary"/>
            <input type="number" min="0" step="0.01" placeholder="€ Salary" value={md.salary||""}
              onChange={function(e){upMonth(function(m){m.salary=parseFloat(e.target.value)||0;});}}
              style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:12,padding:14,fontSize:20,fontWeight:700,fontFamily:font,outline:"none",background:"#FDFBF7",textAlign:"center",boxSizing:"border-box"}}/>
          </Card>
          <Card>
            <SecHead icon="📚" label="Private Lessons"/>
            {md.lessons.map(function(l,i){return React.createElement("div",{key:l.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<md.lessons.length-1?"1px solid "+P.border:"none"}},
              React.createElement("span",{style:{fontSize:13,fontWeight:500}},l.name),
              React.createElement("span",{style:{display:"flex",alignItems:"center",gap:6}},
                React.createElement("span",{style:{fontSize:13,fontWeight:700,color:P.accent}},"+"+fmt(l.amount)),
                React.createElement("button",{onClick:function(){upMonth(function(m){m.lessons=m.lessons.filter(function(x){return x.id!==l.id;});});},style:{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:14}},"✕")));
            })}
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <input placeholder="Student / Subject" value={lessonName} onChange={function(e){setLessonName(e.target.value);}} style={Object.assign({},inputSt,{flex:1})}/>
              <input type="number" min="0" step="0.01" placeholder="€" value={lessonAmt} onChange={function(e){setLessonAmt(e.target.value);}}
                onKeyDown={function(e){if(e.key==="Enter")addLesson();}} style={Object.assign({},inputSt,{width:80,textAlign:"right"})}/>
              <button onClick={addLesson} style={{background:P.accent,color:"#fff",border:"none",borderRadius:8,padding:"0 12px",cursor:"pointer",fontSize:16}}>+</button>
            </div>
            {md.lessons.length>0&&React.createElement("div",{style:{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"2px solid "+P.accentLt}},
              React.createElement("span",{style:{fontSize:13,fontWeight:700}},"Total Lessons"),
              React.createElement("span",{style:{fontSize:15,fontWeight:800,color:P.accent}},fmt(lessonT)))}
          </Card>
          {incomeT>0&&React.createElement("div",{style:{background:P.accentLt,borderRadius:14,padding:"14px 18px",textAlign:"center"}},
            React.createElement("div",{style:{fontSize:11,fontWeight:700,textTransform:"uppercase",color:P.accentDk,opacity:0.7}},"Total Income"),
            React.createElement("div",{style:{fontSize:24,fontWeight:800,color:P.accentDk}},fmt(incomeT)),
            React.createElement("div",{style:{fontSize:11,color:P.accentDk,opacity:0.6,marginTop:4}},"50% needs: "+fmt(needs50)+" · 30% fun: "+fmt(wants30)+" · 20% save: "+fmt(save20)))}
        </div>
      )}

      {/* ═══ GOALS ═══ */}
      {tab==="goals"&&(
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>Goals</div>
          <div style={{fontSize:13,color:P.sub,marginBottom:16}}>Things you want — buy them when ready</div>
          {state.goals.map(function(g){
            var avgNet=calcAvgNet(state);
            var recoveryMonths=avgNet>0?Math.ceil(g.target/avgNet):null;
            return React.createElement(Card,{key:g.id,style:g.purchased?{opacity:0.7,border:"1px solid "+P.accentLt}:{}},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
                React.createElement("div",{style:{display:"flex",gap:10,alignItems:"center"}},
                  React.createElement("div",{style:{fontSize:32}},g.emoji),
                  React.createElement("div",null,
                    React.createElement("div",{style:{fontSize:15,fontWeight:700,textDecoration:g.purchased?"line-through":"none"}},g.name),
                    React.createElement("div",{style:{fontSize:13,fontWeight:700,color:P.orange}},fmt(g.target)))),
                React.createElement("button",{onClick:function(){persist(function(s){s.goals=s.goals.filter(function(x){return x.id!==g.id;});});},
                  style:{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:16}},"✕")),
              g.purchased
                ?React.createElement("div",{style:{marginTop:8,background:P.accentLt,borderRadius:10,padding:"10px 12px"}},
                    React.createElement("div",{style:{fontSize:12,fontWeight:700,color:P.accent}},"✅ Purchased"+(g.purchaseDate?" on "+g.purchaseDate:"")),
                    React.createElement("div",{style:{fontSize:12,color:P.sub,marginTop:2}},recoveryMonths?"Based on your avg surplus, recovery takes ~"+recoveryMonths+" month"+(recoveryMonths>1?"s":""):"Log more months to estimate recovery"))
                :React.createElement("div",{style:{marginTop:8}},
                    React.createElement("div",{style:{background:P.border+"80",borderRadius:10,padding:"10px 12px",marginBottom:10}},
                      React.createElement("div",{style:{fontSize:11,fontWeight:700,color:P.sub,marginBottom:6}},"BALANCE IMPACT"),
                      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
                        React.createElement("span",{style:{fontSize:11,color:P.accent,fontWeight:700,minWidth:50}},"Now"),
                        React.createElement("div",{style:{flex:1,background:P.border,borderRadius:20,height:10,overflow:"hidden"}},
                          React.createElement("div",{style:{height:"100%",borderRadius:20,width:"100%",background:P.accent}}))),
                      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:4}},
                        React.createElement("span",{style:{fontSize:11,color:P.red,fontWeight:700,minWidth:50}},"After"),
                        React.createElement("div",{style:{flex:1,background:P.border,borderRadius:20,height:10,overflow:"hidden"}},
                          React.createElement("div",{style:{height:"100%",borderRadius:20,width:Math.max(0,Math.round(((state.balance-g.target)/Math.max(1,state.balance))*100))+"%",background:((state.balance-g.target)<0)?P.red:P.orange}}))),
                      React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:11,color:P.sub,marginTop:2}},
                        React.createElement("span",null,fmt(state.balance)+" → "+fmt(Math.max(0,state.balance-g.target))),
                        React.createElement("span",{style:{fontWeight:700,color:(state.balance-g.target)<0?P.red:P.orange}},
                          (state.balance-g.target)<0?"❌ Can't afford":"−"+Math.round((g.target/state.balance)*100)+"%"))),
                    recoveryMonths?React.createElement("div",{style:{fontSize:11,color:P.sub,marginTop:4}},"⏱ Recovery: ~"+recoveryMonths+" month"+(recoveryMonths>1?"s":"")+" based on avg surplus"):null,
                    confirmGoalId===g.id
                      ?React.createElement("div",null,
                          React.createElement("div",{style:{fontSize:13,fontWeight:700,color:P.red,marginBottom:8,textAlign:"center"}},"Deduct "+fmt(g.target)+" from your balance?"),
                          React.createElement("div",{style:{display:"flex",gap:8}},
                            React.createElement(Btn,{full:true,onClick:function(){buyGoal(g.id);setConfirmGoalId(null);},bg:P.red,style:{borderRadius:12}},"Yes, I bought it"),
                            React.createElement(Btn,{onClick:function(){setConfirmGoalId(null);},bg:"#eee",color:P.sub,style:{borderRadius:12}},"Cancel")))
                      :React.createElement(Btn,{full:true,onClick:function(){setConfirmGoalId(g.id);},bg:P.orange,style:{borderRadius:12}},"🛒 Mark as Purchased — "+fmt(g.target)))
            );
          })}
          {!goalOpen
            ?React.createElement(Btn,{full:true,onClick:function(){setGoalOpen(true);},bg:P.orangeLt,color:P.orange,style:{border:"1.5px dashed "+P.orange+"60"}},"+  Add a New Goal")
            :React.createElement(Card,{style:{border:"2px solid "+P.orange+"40"}},
                React.createElement(SecHead,{icon:"🎯",label:"New Goal",color:P.orange}),
                React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}},
                  GOAL_PRESETS.map(function(p){return React.createElement("button",{key:p.label,onClick:function(){setGoalEmoji(p.emoji);if(!goalName)setGoalName(p.label);},
                    style:{background:goalEmoji===p.emoji?P.orangeLt:"#fff",border:"1.5px solid "+(goalEmoji===p.emoji?P.orange:P.border),borderRadius:10,padding:"6px 10px",fontSize:12,fontFamily:font,cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:goalEmoji===p.emoji?P.orange:P.text,fontWeight:600}},p.emoji+" "+p.label);})),
                React.createElement("input",{placeholder:"Goal name (e.g. iPhone 16 Pro)",value:goalName,onChange:function(e){setGoalName(e.target.value);},
                  style:{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:font,outline:"none",marginBottom:8,background:"#FDFBF7",boxSizing:"border-box"}}),
                React.createElement("input",{type:"number",min:"0",step:"0.01",placeholder:"Total cost (€)",value:goalTarget,onChange:function(e){setGoalTarget(e.target.value);},
                  style:{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:font,outline:"none",marginBottom:12,background:"#FDFBF7",boxSizing:"border-box"}}),
                React.createElement("div",{style:{display:"flex",gap:8}},
                  React.createElement(Btn,{full:true,onClick:addGoal,bg:P.orange},"Create Goal"),
                  React.createElement(Btn,{onClick:function(){setGoalOpen(false);},bg:"#eee",color:P.sub},"Cancel")))}
        </div>
      )}

      {/* ═══ MONEY LENT ═══ */}
      {tab==="lent"&&(
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{fontSize:18,fontWeight:800,marginBottom:2}}>Money Lent</div>
          <div style={{fontSize:13,color:P.sub,marginBottom:6}}>Track who owes you</div>
          {totalLentOut>0&&React.createElement("div",{style:{background:P.tealLt,borderRadius:12,padding:"12px 14px",textAlign:"center",marginBottom:14}},
            React.createElement("div",{style:{fontSize:20,fontWeight:800,color:P.teal}},fmt(totalLentOut)),
            React.createElement("div",{style:{fontSize:11,fontWeight:700,color:P.teal,opacity:0.7,textTransform:"uppercase"}},"Total Outstanding"))}

          {(state.lent||[]).filter(function(l){return!l.returned;}).map(function(l){
            var isOverdue=l.expectedDate&&l.expectedDate<todayStr();
            return React.createElement(Card,{key:l.id,style:isOverdue?{border:"2px solid "+P.red+"40"}:{}},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
                React.createElement("div",null,
                  React.createElement("div",{style:{fontSize:15,fontWeight:700}},l.name),
                  React.createElement("div",{style:{fontSize:13,fontWeight:700,color:P.teal}},fmt(l.amount)),
                  React.createElement("div",{style:{fontSize:11,color:isOverdue?P.red:P.sub,fontWeight:isOverdue?700:400}},
                    l.expectedDate?(isOverdue?"⚠️ Overdue! Expected: ":"Expected: ")+l.expectedDate:"No date set")),
                React.createElement("div",{style:{display:"flex",gap:6,alignItems:"center"}},
                  React.createElement(Btn,{onClick:function(){markReturned(l.id);},bg:P.accent,style:{padding:"8px 14px",fontSize:12}},"✓ Returned"),
                  React.createElement("button",{onClick:function(){var lid=l.id;persist(function(s){s.lent=(s.lent||[]).filter(function(x){return x.id!==lid;});if(s.balance!=null)s.balance+=l.amount;});},
                    style:{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:14}},"✕"))));
          })}

          {(state.lent||[]).filter(function(l){return l.returned;}).length>0&&React.createElement("div",null,
            React.createElement(SecHead,{icon:"✅",label:"Returned"}),
            (state.lent||[]).filter(function(l){return l.returned;}).map(function(l){
              return React.createElement("div",{key:l.id,style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+P.border,opacity:0.6}},
                React.createElement("span",{style:{fontSize:13}},l.name),
                React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                  React.createElement("span",{style:{fontSize:13,fontWeight:600,color:P.accent}},fmt(l.amount)),
                  React.createElement("button",{onClick:function(){var lid=l.id;persist(function(s){s.lent=(s.lent||[]).filter(function(x){return x.id!==lid;});});},
                    style:{background:"none",border:"none",cursor:"pointer",color:P.muted,fontSize:13}},"✕")));
            }))}

          <Card style={{marginTop:12}}>
            <SecHead icon="➕" label="Lend Money" color={P.teal}/>
            <input placeholder="Who?" value={lentName} onChange={function(e){setLentName(e.target.value);}}
              style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:font,outline:"none",marginBottom:8,background:"#FDFBF7",boxSizing:"border-box"}}/>
            <input type="number" min="0" step="0.01" placeholder="€ Amount" value={lentAmt} onChange={function(e){setLentAmt(e.target.value);}}
              style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:font,outline:"none",marginBottom:8,background:"#FDFBF7",boxSizing:"border-box"}}/>
            <div style={{fontSize:12,color:P.sub,marginBottom:4}}>When do you expect it back?</div>
            <input type="date" value={lentDate} onChange={function(e){setLentDate(e.target.value);}}
              style={{width:"100%",border:"1.5px solid "+P.border,borderRadius:10,padding:"10px 12px",fontSize:14,fontFamily:font,outline:"none",marginBottom:12,background:"#FDFBF7",boxSizing:"border-box"}}/>
            <Btn full onClick={addLent} bg={P.teal}>💸 Record Loan</Btn>
          </Card>
        </div>
      )}

      {/* ═══ AI ═══ */}
      {tab==="ai"&&(
        <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px"}}>
            {chat.length===0&&React.createElement("div",{style:{textAlign:"center",padding:"30px 10px"}},
              React.createElement("div",{style:{fontSize:36,marginBottom:8}},"✨"),
              React.createElement("div",{style:{fontSize:16,fontWeight:800,color:P.purple,marginBottom:4}},"AI Financial Advisor"),
              React.createElement("div",{style:{fontSize:13,color:P.sub,lineHeight:1.5,marginBottom:20}},"I see your income, expenses, 50/30/20 breakdown, goals, and loans. Ask me anything!"),
              React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}},
                AI_CHIPS.map(function(s){return React.createElement("button",{key:s,onClick:function(){sendAI(s);},
                  style:{background:P.purpleLt,border:"1px solid "+P.purple+"20",borderRadius:20,padding:"7px 14px",fontSize:12,color:P.purple,fontFamily:font,fontWeight:600,cursor:"pointer"}},s);})))}
            {chat.map(function(m,i){return React.createElement("div",{key:i,style:{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10}},
              React.createElement("div",{style:{maxWidth:"85%",padding:"10px 14px",borderRadius:16,fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",
                background:m.role==="user"?P.accent:P.card,color:m.role==="user"?"#fff":P.text,
                border:m.role==="user"?"none":"1px solid "+P.border,
                borderBottomRightRadius:m.role==="user"?4:16,borderBottomLeftRadius:m.role==="user"?16:4,
                boxShadow:m.role==="user"?"none":"0 1px 4px rgba(0,0,0,0.04)"}},
                m.role==="assistant"&&React.createElement("div",{style:{fontSize:10,fontWeight:800,color:P.purple,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.5px"}},"✨ Advisor"),
                m.text));})}
            {aiThink&&React.createElement("div",{style:{display:"flex",marginBottom:10}},
              React.createElement("div",{style:{background:P.card,border:"1px solid "+P.border,borderRadius:16,borderBottomLeftRadius:4,padding:"14px 20px",display:"flex",gap:6}},
                React.createElement("div",{className:"dot dot1"}),React.createElement("div",{className:"dot dot2"}),React.createElement("div",{className:"dot dot3"})))}
            <div ref={chatRef}/>
          </div>
          {chat.length>0&&React.createElement("div",{style:{padding:"4px 16px",display:"flex",gap:5,overflowX:"auto",flexShrink:0}},
            AI_CHIPS.slice(0,3).map(function(s){return React.createElement("button",{key:s,onClick:function(){sendAI(s);},disabled:aiThink,
              style:{background:P.purpleLt,border:"none",borderRadius:16,padding:"5px 11px",fontSize:11,color:P.purple,fontFamily:font,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,opacity:aiThink?0.5:1}},s);}))}
          <div style={{padding:"10px 16px 14px",display:"flex",gap:8,flexShrink:0}}>
            <input placeholder="Ask about your finances..." value={aiMsg} onChange={function(e){setAiMsg(e.target.value);}}
              onKeyDown={function(e){if(e.key==="Enter"){e.preventDefault();sendAI();}}} disabled={aiThink}
              style={{flex:1,border:"1.5px solid "+P.border,borderRadius:24,padding:"10px 16px",fontSize:13,fontFamily:font,outline:"none",background:"#fff",boxSizing:"border-box"}}/>
            <button onClick={function(){sendAI();}} disabled={aiThink||!aiMsg.trim()} style={{
              background:aiThink?P.muted:P.purple,color:"#fff",border:"none",borderRadius:"50%",
              width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM NAV ═══ */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,
        background:"#fff",borderTop:"1px solid "+P.border,display:"flex",alignItems:"center",justifyContent:"space-around",
        padding:"5px 0 8px",zIndex:100,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)"}}>
        {["home","income","add","lent","goals","ai"].map(function(id){
          var labels={home:"Home",income:"Income",add:"",lent:"Lent",goals:"Goals",ai:"AI"};
          if(id==="add"){return React.createElement("button",{key:"add",onClick:function(){setTab("add");},
            style:{background:P.red,border:"none",borderRadius:"50%",width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 4px 14px "+P.red+"50",marginTop:-16}},
            React.createElement(NavIcon,{type:"add"}));}
          return React.createElement("button",{key:id,onClick:function(){setTab(id);},
            style:{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"2px 6px",fontFamily:font}},
            React.createElement(NavIcon,{type:id,active:tab===id}),
            React.createElement("span",{style:{fontSize:9,fontWeight:700,color:tab===id?P.accent:P.muted}},labels[id]));
        })}
      </div>

      <style>{"\n.dot{width:7px;height:7px;border-radius:50%;background:"+P.purple+";animation:pulse 1.2s ease-in-out infinite}\n.dot1{animation-delay:0s}.dot2{animation-delay:.15s}.dot3{animation-delay:.3s}\n@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}\ninput:focus{border-color:"+P.accent+"!important}\n"}</style>
    </div>
  );
}
