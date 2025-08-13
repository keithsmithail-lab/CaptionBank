(function(){
  const $ = (sel) => document.querySelector(sel);

  const state = {
    mode: "niche",
    niche: "",
    articleText: "",
    platform: "Instagram",
    tone: "Friendly",
    length: "Medium",
    useEmojis: true,
    useHashtags: true,
    useCTA: true,
    styleText: "",
    qty: 5,
    captions: []
  };

  const HOOKS = ["Real talk: ","Quick win: ","If you struggle with this, read on: ","Hot take: ","Save this for later: ","Most people miss this: ","New on the feed: "];
  const GENERIC_EMOJIS = ["✨","✅","💡","📌","📈","🕒","📣","🎯","🔥","💬"];
  const CTAS = ["Message me for a quick quote.","Tap the link to get started today.","DM me the word START for details.","Comment LINK and I’ll send it.","Share this with a friend who needs it."];
  const BODIES = {
    generic: ["here is a simple way to take action in minutes.","try this 3 step approach and thank me later.","this works even if you feel stuck or short on time.","use this today and tell me what changes for you.","this is what I wish I knew when I started."],
    Instagram: ["carousel coming with all steps.","save to your collections and share with a friend."],
    Facebook: ["tag someone who needs this.","drop a comment with your biggest question."],
    TikTok: ["watch to the end for the bonus tip.","quick cuts make this super easy to follow."],
    LinkedIn: ["here is the framework we use with clients.","add this to your SOPs this quarter."]
  };

  function pick(a){return a[Math.floor(Math.random()*a.length)];}
  function applyTone(t){
    switch(state.tone){
      case "Bold": return t.replace(/\.$/,"!").toUpperCase();
      case "Professional": return t.replace("Real talk:","Note:").replace("Hot take:","Observation:");
      case "Empathetic": return t.replace("Real talk:","You are not alone:");
      case "Funny": return t.replace("Real talk: ","Real talk (and a tiny joke): ").replace("Hot take: ","Hot take (don’t @ me): ");
      default: return t;
    }
  }
  function expandLength(t){
    if(state.length==="Short") return t;
    if(state.length==="Medium") return t + " Here is how to get started today.";
    return t + " Step 1: get clear on the outcome. Step 2: use a simple checklist. Step 3: review and improve tomorrow.";
  }
  function buildHashtags(){
    if(!state.useHashtags) return "";
    const src = state.mode==="niche" ? state.niche : state.articleText;
    const words = (src||"").toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(Boolean);
    const stops = new Set(["for","the","and","or","of","in","to","a","an","with","on","at","is","are","this","that","it","you","your","our"]);
    const base=[]; for(const w of words){ if(!stops.has(w) && base.length<3) base.push("#"+w.replace(/[^a-z0-9]/g,"")); }
    const platformTags = {Instagram:["#instagramtips","#contentcreator"],Facebook:["#facebookmarketing","#socialmediamarketing"],TikTok:["#tiktoktips","#smallbusinesstiktok"],LinkedIn:["#linkedinmarketing","#b2b"]}[state.platform];
    return [...base, ...platformTags].join(" ");
  }
  function extractKeyPoints(text){
    const clean = (text||"").replace(/\s+/g," ").trim(); if(!clean) return [];
    const sentences = clean.split(/(?<=[.!?])\s+/).slice(0,40);
    const scored = sentences.map(s=>{ const len=Math.min(s.length,200); const num=(s.match(/\d+/g)||[]).length; const verbs=(s.match(/\b(is|are|has|have|can|should|will|avoid|use|get|make|save|protect|plan)\b/gi)||[]).length; return {s,score:len*0.3+num*2+verbs}; });
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,10).map(x=>x.s);
  }
  function makeCanvaPrompt(hook, topic){
    const style = state.styleText || "clean, bright, high‑contrast, room for headline";
    const cta = state.useCTA ? ` and a small subheadline like "${pick(CTAS)}"` : "";
    const subject = topic || state.niche || "your topic";
    return `Create a ${state.platform} post image for "${subject}". Style: ${style}. Leave generous space for a bold headline "${hook.trim()}"${cta}. Avoid clutter.`;
  }
  function makeFromNiche(){
    const hook=pick(HOOKS), body=pick(BODIES.generic)+" "+pick(BODIES[state.platform]||[""]);
    const base=applyTone(hook+body), long=expandLength(base), emoji=state.useEmojis?" "+pick(GENERIC_EMOJIS):"", cta=state.useCTA?" "+pick(CTAS):"", tags=state.useHashtags?"\n\n"+buildHashtags():"";
    const caption=(long+emoji+cta+tags).trim(); const canva=makeCanvaPrompt(hook); return caption+"\n\nCanva image prompt:\n"+canva;
  }
  function makeFromArticle(points,i){
    const topic=(state.niche||"this topic").trim(); const hook=pick(HOOKS);
    let body = points[i%points.length] || "Key insight: make it simple and actionable.";
    if(state.platform==="LinkedIn") body+=" Here is the framework we use with clients.";
    if(state.platform==="Instagram") body+=" Save and share if this helps.";
    if(state.platform==="TikTok") body+=" Watch to the end for the bonus tip.";
    if(state.platform==="Facebook") body+=" Tag someone who needs this.";
    const base=applyTone(hook+body), long=expandLength(base), emoji=state.useEmojis?" "+pick(GENERIC_EMOJIS):"", cta=state.useCTA?" "+pick(CTAS):"", tags=state.useHashtags?"\n\n"+buildHashtags():"";
    const caption=(long+emoji+cta+tags).trim(); const canva=makeCanvaPrompt(hook, topic); return caption+"\n\nCanva image prompt:\n"+canva;
  }
  function render(){
    const out=$("#output"); out.innerHTML="";
    if(!state.captions.length){ const ph=document.createElement("div"); ph.className="placeholder"; ph.textContent="Your captions will appear here after you click Generate."; out.appendChild(ph); $("#crumbs").textContent=""; return; }
    state.captions.forEach((c,i)=>{ const card=document.createElement("div"); card.className="cardOut"; const head=document.createElement("div"); head.className="cardHead"; head.textContent="Caption "+(i+1); const ta=document.createElement("textarea"); ta.className="text"; ta.rows=12; ta.readOnly=true; ta.value=c; const row=document.createElement("div"); row.className="rowBtns"; const b=document.createElement("button"); b.className="btn alt"; b.textContent="Copy"; b.onclick=()=>{navigator.clipboard.writeText(c); b.textContent="Copied"; setTimeout(()=>b.textContent="Copy",900)}; row.appendChild(b); card.appendChild(head); card.appendChild(ta); card.appendChild(row); out.appendChild(card); });
    const modeText = state.mode==="niche" ? (state.niche||"Any niche") : "Rewriting from article";
    $("#crumbs").textContent = modeText+" • "+state.platform+" • "+state.tone+" • "+state.length+(state.useCTA?" • Call To Action: On":" • Call To Action: Off");
  }

  // UI bindings
  document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener("change",(e)=>{
    state.mode=e.target.value;
    document.getElementById("nicheCard").style.display = state.mode==="niche" ? "" : "none";
    document.getElementById("articleCard").style.display = state.mode==="rewrite" ? "" : "none";
  }));
  $("#platform").addEventListener("change",e=>state.platform=e.target.value);
  $("#tone").addEventListener("change",e=>state.tone=e.target.value);
  $("#length").addEventListener("change",e=>state.length=e.target.value);
  $("#niche").addEventListener("input",e=>state.niche=e.target.value);
  $("#articleText").addEventListener("input",e=>state.articleText=e.target.value);
  $("#styleText").addEventListener("input",e=>state.styleText=e.target.value);

  const chkE=$("#useEmojis"), chkT=$("#useHashtags"), chkC=$("#useCTA");
  chkE.addEventListener("change",()=>{state.useEmojis=chkE.checked; $("#valEmojis").textContent=chkE.checked?"On":"Off";});
  chkT.addEventListener("change",()=>{state.useHashtags=chkT.checked; $("#valTags").textContent=chkT.checked?"On":"Off";});
  chkC.addEventListener("change",()=>{state.useCTA=chkC.checked; $("#valCTA").textContent=chkC.checked?"On":"Off";});

  $("#qty").addEventListener("input",e=>{const v=Math.max(1,Math.min(50,Number(e.target.value)||1)); state.qty=v;});
  $("#generate").addEventListener("click",()=>{const n=state.qty; if(state.mode==="rewrite"){ const pts=extractKeyPoints(state.articleText).slice(0,n)||["Key insight: make it simple and actionable."]; state.captions=Array.from({length:n},(_,i)=>makeFromArticle(pts,i)); } else { state.captions=Array.from({length:n}, makeFromNiche);} render();});
  $("#copyAll").addEventListener("click",()=>{ if(!state.captions.length) return; navigator.clipboard.writeText(state.captions.join("\n\n---\n\n")); alert("Copied"); });
  $("#downloadCSV").addEventListener("click",()=>{ if(!state.captions.length) return; const header=['#','Mode','Niche','Platform','Tone','Length','CallToAction','Caption']; const rows=state.captions.map((c,i)=>[i+1,state.mode,state.niche||"",state.platform,state.tone,state.length,state.useCTA?"On":"Off",c]); const csv=[header,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n"); const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="captions_"+Date.now()+".csv"; a.click(); URL.revokeObjectURL(url); });

  // Research links
  function q(s){return encodeURIComponent(s);}
  function openResearch(which){ const baseTopic = state.mode==="niche" ? (state.niche||"your topic") : (state.articleText.slice(0,80)||"your topic"); const core=`${baseTopic} tips ideas ${state.platform} ${state.tone} ${state.length}`; const maps={google:`https://www.google.com/search?q=${q(core)}&tbm=vid`, reddit:`https://www.google.com/search?q=${q(core+" site:reddit.com")}`, tiktok:`https://www.google.com/search?q=${q(core+" site:tiktok.com")}`, instagram:`https://www.google.com/search?q=${q(core+" site:instagram.com")}`}; window.open(maps[which],"_blank"); }
  $("#openGoogle").addEventListener("click",()=>openResearch("google"));
  $("#openReddit").addEventListener("click",()=>openResearch("reddit"));
  $("#openTikTok").addEventListener("click",()=>openResearch("tiktok"));
  $("#openInstagram").addEventListener("click",()=>openResearch("instagram"));

  // Fetch from URL via Netlify Function
  async function fetchArticleIntoTextarea(){
    const url = ($("#articleUrl").value||"").trim(); const status=$("#fetchStatus"); if(!url){status.textContent="Enter a URL."; return;}
    status.textContent="Fetching...";
    try{
      const res = await fetch("/.netlify/functions/fetch-article", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({url})});
      if(!res.ok) throw new Error("Fetch failed");
      const data = await res.json(); const text=(data.text||"").slice(0,20000);
      $("#articleText").value=text; state.articleText=text; status.textContent="Fetched and loaded into the text box.";
    }catch(e){ status.textContent="Fetch failed. Check the URL or CORS policy."; }
  }
  $("#btnFetch").addEventListener("click", fetchArticleIntoTextarea);

  render();
})();