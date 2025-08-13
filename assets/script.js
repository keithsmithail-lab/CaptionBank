// v9.2 — Pro polish: presets + saved settings, bigger output, multi copy buttons,
// trial limiter + license modal (Gumroad verify), Stripe payment link button,
// "always include hashtags", centered radios fix + robust mode switching + modal delegates.

(function(){
  const $ = (sel)=>document.querySelector(sel);

  // ===== ONE-TIME SETTINGS — EDIT THESE =====
  const VERSION = "9.2";
  const TRIAL_CAP = 3;
  const GUMROAD_PRODUCT_ID = "REPLACE_WITH_GUMROAD_ID_OR_PERMALINK"; // e.g. "prod_ABC123" or "captionbank"
  const GUMROAD_PRODUCT_URL = "https://gumroad.com/l/REPLACE";       // your Gumroad product page
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/REPLACE";       // your Stripe Payment Link

  // ===== State =====
  const state = {
    mode:"niche",
    niche:"",
    articleText:"",
    platform:"Instagram",
    tone:"Friendly",
    length:"Medium",
    useEmojis:true,
    useHashtags:true,
    useCTA:true,
    styleText:"",
    customTags:"",
    qty:5,
    captions:[],
    licensed: false
  };

  // ===== Data =====
  const EMOJI=["✨","✅","💡","📌","📈","🕒","📣","🎯","🔥","💬"];
  const CTAS=[
    "Message me for a quick quote.",
    "Tap the link to get started today.",
    "DM me the word START for details.",
    "Comment LINK and I’ll send it.",
    "Share this with a friend who needs it."
  ];
  const BODIES={
    generic:[
      "Here is a simple way to take action in minutes.",
      "Try this 3-step approach and thank me later.",
      "This works even if you feel short on time.",
      "Use this today and tell me what changes for you.",
      "This is what I wish I knew when I started."
    ],
    Instagram:["Save and share if this helps.","Carousel coming with all steps."],
    Facebook:["Tag someone who needs this.","Drop a comment with your biggest question."],
    TikTok:["Watch to the end for the bonus tip.","Quick cuts make this super easy to follow."],
    LinkedIn:["Here is the framework we use with clients.","Add this to your SOPs this quarter."]
  };

  const STARTER_PRESETS = [
    {name:"Realtors", niche:"Local real estate listings + staging tips", platform:"Instagram", tone:"Professional", length:"Medium", styleText:"crisp, modern, wide margin for headline"},
    {name:"Fitness coaches", niche:"Home workouts + nutrition habits", platform:"Instagram", tone:"Bold", length:"Short", styleText:"high energy, bold headline, bright"},
    {name:"Insurance agents", niche:"Family life insurance education + simple quotes", platform:"Facebook", tone:"Friendly", length:"Medium", styleText:"clean, trustworthy, high-contrast"},
    {name:"Local cafés", niche:"Daily specials + cozy atmosphere", platform:"Instagram", tone:"Friendly", length:"Short", styleText:"warm, inviting, natural light"},
    {name:"E-commerce promos", niche:"New arrivals + limited-time offers", platform:"TikTok", tone:"Bold", length:"Short", styleText:"graphic, punchy, product-forward"},
    {name:"Work-from-home", niche:"WFH productivity + home office ideas", platform:"LinkedIn", tone:"Professional", length:"Long", styleText:"minimal, premium, space for headline"},
  ];

  // ===== Helpers =====
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  function saveSettings(){
    const blob = {
      mode:state.mode, niche:state.niche, platform:state.platform, tone:state.tone, length:state.length,
      useEmojis:state.useEmojis, useHashtags:state.useHashtags, useCTA:state.useCTA,
      styleText:state.styleText, customTags:state.customTags, qty:state.qty
    };
    localStorage.setItem("cb_settings_v1", JSON.stringify(blob));
  }
  function loadSettings(){
    try{
      const blob = JSON.parse(localStorage.getItem("cb_settings_v1")||"{}");
      Object.assign(state, blob);
      document.querySelector(`input[name="mode"][value="${state.mode}"]`)?.click();
      $("#niche").value = state.niche || "";
      $("#platform").value = state.platform || "Instagram";
      $("#tone").value = state.tone || "Friendly";
      $("#length").value = state.length || "Medium";
      $("#useEmojis").checked = !!state.useEmojis; $("#valEmojis").textContent = state.useEmojis?"On":"Off";
      $("#useHashtags").checked = !!state.useHashtags; $("#valTags").textContent = state.useHashtags?"On":"Off";
      $("#useCTA").checked = !!state.useCTA; $("#valCTA").textContent = state.useCTA?"On":"Off";
      $("#styleText").value = state.styleText || "";
      $("#customTags").value = state.customTags || "";
      $("#qty").value = state.qty || 5;
    }catch(e){}
  }
  function applyPreset(p){
    state.mode = "niche";
    state.niche = p.niche; $("#niche").value = p.niche;
    state.platform = p.platform; $("#platform").value = p.platform;
    state.tone = p.tone; $("#tone").value = p.tone;
    state.length = p.length; $("#length").value = p.length;
    state.styleText = p.styleText; $("#styleText").value = p.styleText;
    document.getElementById("nicheCard").style.display = "";
    document.getElementById("articleCard").style.display = "none";
    saveSettings();
  }
  function saveMyPreset(){
    const p = {
      niche: $("#niche").value,
      platform: $("#platform").value,
      tone: $("#tone").value,
      length: $("#length").value,
      styleText: $("#styleText").value
    };
    localStorage.setItem("cb_mypreset_v1", JSON.stringify(p));
    alert("Saved current settings as My Preset.");
  }
  function loadMyPreset(){
    const raw = localStorage.getItem("cb_mypreset_v1");
    if(!raw) return alert("No preset saved yet.");
    applyPreset(JSON.parse(raw));
  }
  function clearMyPreset(){
    localStorage.removeItem("cb_mypreset_v1");
    alert("My Preset cleared.");
  }

  function applyTone(t){
    switch(state.tone){
      case "Bold": return t.replace(/\.$/,"!").toUpperCase();
      case "Professional": return t.replace("Here is","Note: here is");
      case "Empathetic": return t.replace("Here is","You’re not alone. Here is");
      case "Funny": return t.replace("Here is","Okay, real talk—but funny: here is");
      default: return t;
    }
  }
  function expandLength(t){
    if (state.length==="Short") return t;
    if (state.length==="Medium") return t + " Here is how to get started today.";
    return t + " Step 1: get clear on the outcome. Step 2: use a simple checklist. Step 3: review and improve tomorrow.";
  }

  // Relevant hashtags + manual include
  function tags(){
    if (!state.useHashtags) return "";
    const src = state.mode==="niche" ? state.niche : state.articleText;
    const text = (src || "").toLowerCase();

    const phraseTags = [];
    if (/work from home|remote work|wfh/.test(text)) phraseTags.push("#workfromhome","#remotework","#wfh","#homeoffice");
    if (/side hustle|side-hustle|extra income/.test(text)) phraseTags.push("#sidehustle","#extraincome");
    if (/insurance|life insurance|term life|whole life/.test(text)) phraseTags.push("#insurance","#lifeinsurance");
    if (/sales|closing|prospecting|pipeline/.test(text)) phraseTags.push("#sales","#salestraining");
    if (/lead gen|lead generation|appointments?/.test(text)) phraseTags.push("#leadgeneration","#appointments");
    if (/content|post|social/.test(text)) phraseTags.push("#socialmediatips");

    const words = text.replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean);
    const stop = new Set(["for","the","and","or","of","in","to","a","an","with","on","at","is","are","this","that","it","you","your","our","from","as","by","about","be","can","will","not"]);
    const freq = {};
    for (const w of words) { if (w.length>=4 && !stop.has(w)) freq[w]=(freq[w]||0)+1; }
    const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([w])=>"#"+w.replace(/[^a-z0-9]/g,""));

    let platformFallback = [];
    if (phraseTags.length + top.length < 2) {
      platformFallback = {
        Instagram:["#instagramtips","#contentcreator"],
        Facebook:["#facebookmarketing","#socialmediamarketing"],
        TikTok:["#tiktoktips","#smallbusinesstiktok"],
        LinkedIn:["#linkedinmarketing","#b2b"]
      }[state.platform] || [];
    }

    const manual = (state.customTags||"").split(/\s+/).filter(s=>s.startsWith("#"));
    const all = [...new Set([...phraseTags, ...top, ...platformFallback, ...manual])];
    return all.slice(0, 8).join(" ");
  }

  // Sentence extraction
  function extractKeyPoints(text){
    const clean = (text||"").replace(/\s+/g," ").trim();
    if (!clean) return [];
    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    const limited = sentences.slice(0,40);
    const scored = limited.map(s=>{
      const len = Math.min(s.length,200);
      const num = (s.match(/\d+/g) || []).length;
      const verbs = (s.match(/\b(is|are|has|have|can|should|will|avoid|use|get|make|save|protect|plan)\b/gi) || []).length;
      return { s: s.trim(), score: len*0.3 + num*2 + verbs };
    });
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,10).map(x=>x.s);
  }

  function canva(headline, topic){
    const style = state.styleText || "clean, bright, high-contrast, room for headline";
    const cta = state.useCTA ? ` and a small subheadline like "${pick(CTAS)}"` : "";
    const subject = topic || state.niche || "your topic";
    const head = (headline || "").trim() || subject;
    return `Create a ${state.platform} post image for "${subject}". Style: ${style}. Leave generous space for a bold headline "${head}"${cta}. Avoid clutter.`;
  }

  function fromNiche(){
    const body = pick(BODIES.generic) + " " + pick(BODIES[state.platform] || [""]);
    const base = applyTone(body);
    const long = expandLength(base);
    const emoji = state.useEmojis ? " " + pick(EMOJI) : "";
    const cta  = state.useCTA    ? " " + pick(CTAS) : "";
    const tag  = state.useHashtags ? "\n\n" + tags() : "";
    const caption = (long + emoji + cta + tag).trim();
    const headline = state.niche || (state.platform + " post");
    return { caption: caption, canva: canva(headline) };
  }

  function fromArticle(points, i){
    const topic = (state.niche || "this topic").trim();
    let body = points[i % points.length] || "Key insight: make it simple and actionable.";
    if (state.platform==="LinkedIn") body += " Here is the framework we use with clients.";
    if (state.platform==="Instagram") body += " Save and share if this helps.";
    if (state.platform==="TikTok") body += " Watch to the end for the bonus tip.";
    if (state.platform==="Facebook") body += " Tag someone who needs this.";

    const base = applyTone(body);
    const long = expandLength(base);
    const emoji = state.useEmojis ? " " + pick(EMOJI) : "";
    const cta  = state.useCTA    ? " " + pick(CTAS) : "";
    const tag  = state.useHashtags ? "\n\n" + tags() : "";
    const caption = (long + emoji + cta + tag).trim();

    const headline = (points[i % points.length] || topic).split(" ").slice(0,8).join(" ");
    return { caption: caption, canva: canva(headline, topic) };
  }

  function render(){
    const label = $("#articleLabel"), ta=$("#articleText"), fetchRow=$("#fetchRow"), hint=$("#modeHint");
    if (state.mode==="rewrite") {
      label.textContent = "Article text (paste or fetch below)";
      ta.placeholder = "Paste the article text or click Fetch from URL...";
      fetchRow.style.display = "";
      hint.textContent = "Tip: Paste article text or use Fetch from URL (some sites block bots).";
    } else if (state.mode==="ig") {
      label.textContent = "Instagram caption text (paste caption only)";
      ta.placeholder = "Open the Instagram post, copy the caption text, and paste it here.";
      fetchRow.style.display = "none";
      hint.textContent = "Tip: Instagram blocks automated fetching. Paste the caption text manually.";
    } else {
      hint.textContent = "Tip: In rewrite modes you can paste text, or (for articles) fetch a URL via the built-in serverless function.";
    }

    const out=$("#output");
    out.innerHTML="";
    if (!state.captions.length){
      const ph=document.createElement("div");
      ph.className="placeholder";
      ph.textContent="Your captions will appear here after you click Generate.";
      out.appendChild(ph);
      $("#crumbs").textContent="";
      return;
    }

    state.captions.forEach((obj,i)=>{
      const c = obj.caption;
      const prompt = obj.canva;
      const card=document.createElement("div");
      card.className="cardOut";

      const head=document.createElement("div");
      head.className="cardHead";
      head.textContent="Caption "+(i+1);
      const txt=document.createElement("textarea");
      txt.className="text"; txt.rows=12; txt.readOnly=true; txt.value=c + "\n\nCanva image prompt:\n" + prompt;

      const row=document.createElement("div");
      row.className="rowBtns";

      const b1=document.createElement("button");
      b1.className="btn alt"; b1.textContent="Copy Caption";
      b1.onclick=()=>{navigator.clipboard.writeText(c); b1.textContent="Copied"; setTimeout(()=>b1.textContent="Copy Caption",900);};

      const b2=document.createElement("button");
      b2.className="btn alt"; b2.textContent="Copy Plain";
      b2.onclick=()=>{navigator.clipboard.writeText(c.replace(/\n\n#.+$/m,"")); b2.textContent="Copied"; setTimeout(()=>b2.textContent="Copy Plain",900);};

      const b3=document.createElement("button");
      b3.className="btn alt"; b3.textContent="Copy Canva Prompt";
      b3.onclick=()=>{navigator.clipboard.writeText(prompt); b3.textContent="Copied"; setTimeout(()=>b3.textContent="Copy Canva Prompt",900);};

      row.appendChild(b1); row.appendChild(b2); row.appendChild(b3);
      card.appendChild(head); card.appendChild(txt); card.appendChild(row);
      out.appendChild(card);
    });

    const modeText = state.mode==="niche" ? (state.niche||"Any niche")
                   : state.mode==="ig"    ? "Rewriting IG caption"
                   : "Rewriting from article";
    $("#crumbs").textContent = modeText+" • "+state.platform+" • "+state.tone+" • "
       +state.length+(state.useCTA?" • Call To Action: On":" • Call To Action: Off");
  }

  // ===== Mode binding with robust click handling =====
  document.querySelectorAll('input[name="mode"]').forEach(r=>{
    r.addEventListener("change",(e)=>{
      state.mode = e.target.value;
      document.getElementById("nicheCard").style.display = state.mode==="niche" ? "" : "none";
      document.getElementById("articleCard").style.display = (state.mode==="rewrite" || state.mode==="ig") ? "" : "none";
      saveSettings(); render();
    });
  });
  document.querySelector('.modes')?.addEventListener('click',(e)=>{
    const input = e.target.closest('input[type="radio"][name="mode"]');
    if (!input) return;
    input.checked = true;
    input.dispatchEvent(new Event('change', {bubbles:true}));
  });

  $("#platform").addEventListener("change",e=>{state.platform=e.target.value; saveSettings();});
  $("#tone").addEventListener("change",e=>{state.tone=e.target.value; saveSettings();});
  $("#length").addEventListener("change",e=>{state.length=e.target.value; saveSettings();});
  $("#niche").addEventListener("input",e=>{state.niche=e.target.value; saveSettings();});
  $("#articleText").addEventListener("input",e=>{state.articleText=e.target.value;});
  $("#styleText").addEventListener("input",e=>{state.styleText=e.target.value; saveSettings();});
  $("#customTags").addEventListener("input",e=>{state.customTags=e.target.value; saveSettings();});

  const chkE=$("#useEmojis"), chkT=$("#useHashtags"), chkC=$("#useCTA");
  chkE.addEventListener("change",()=>{state.useEmojis=chkE.checked; $("#valEmojis").textContent=chkE.checked?"On":"Off"; saveSettings();});
  chkT.addEventListener("change",()=>{state.useHashtags=chkT.checked; $("#valTags").textContent=chkT.checked?"On":"Off"; saveSettings();});
  chkC.addEventListener("change",()=>{state.useCTA=chkC.checked; $("#valCTA").textContent=chkC.checked?"On":"Off"; saveSettings();});

  $("#qty").addEventListener("input",e=>{
    const v = Math.max(1, Math.min(50, Number(e.target.value)||1));
    state.qty = v; saveSettings();
  });

  // Presets UI
  const presetWrap = $("#starterPresets");
  STARTER_PRESETS.forEach(p=>{
    const el = document.createElement("button");
    el.className="preset-chip";
    el.textContent=p.name;
    el.onclick=()=>applyPreset(p);
    presetWrap.appendChild(el);
  });
  $("#savePreset").addEventListener("click", saveMyPreset);
  $("#loadPreset").addEventListener("click", loadMyPreset);
  $("#clearPreset").addEventListener("click", clearMyPreset);
  $("#resetSettings").addEventListener("click", ()=>{ localStorage.removeItem("cb_settings_v1"); loadSettings(); render(); });

  // Generate with trial limiter
  $("#generate").addEventListener("click",()=>{
    const requested = state.qty;
    let n = requested;

    if (!state.licensed && requested > TRIAL_CAP) {
      n = TRIAL_CAP;
      openModal();
    }
    let results;
    if (state.mode==="rewrite" || state.mode==="ig"){
      const raw = extractKeyPoints(state.articleText);
      const pts = raw.length ? raw.slice(0,n) : Array(n).fill("Key insight: make it simple and actionable.");
      results = Array.from({length:n},(_,i)=>fromArticle(pts,i));
    } else {
      results = Array.from({length:n}, fromNiche);
    }
    state.captions = results;
    render();
  });

  // Copy / CSV / Reset
  $("#copyAll").addEventListener("click",()=>{
    if (!state.captions.length) return;
    const blocks = state.captions.map(o => `${o.caption}\n\nCanva image prompt:\n${o.canva}`);
    navigator.clipboard.writeText(blocks.join("\n\n---\n\n"));
    alert("Copied");
  });
  $("#downloadCSV").addEventListener("click",()=>{
    if (!state.captions.length) return;
    const header=["#","Mode","Niche","Platform","Tone","Length","CallToAction","Caption","CanvaPrompt"];
    const rows=state.captions.map((o,i)=>[i+1,state.mode,state.niche||"",state.platform,state.tone,state.length,state.useCTA?"On":"Off",o.caption,o.canva]);
    const csv=[header,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="captions_"+Date.now()+".csv"; a.click();
    URL.revokeObjectURL(url);
  });
  $("#reset").addEventListener("click",()=>{ state.captions=[]; render(); });

  // Research links (guard against missing buttons)
  function q(s){return encodeURIComponent(s);}
  function openResearch(which){
    const baseTopic = state.mode==="niche" ? (state.niche||"your topic") : (state.articleText.slice(0,80)||"your topic");
    const core = `${baseTopic} tips ideas ${state.platform} ${state.tone} ${state.length}`;
    const map={
      google:`https://www.google.com/search?q=${q(core)}&tbm=vid`,
      reddit:`https://www.google.com/search?q=${q(core+" site:reddit.com")}`,
      tiktok:`https://www.google.com/search?q=${q(core+" site:tiktok.com")}`,
      instagram:`https://www.google.com/search?q=${q(core+" site:instagram.com")}`
    };
    window.open(map[which],"_blank");
  }
  const og=$("#openGoogle"); if(og) og.addEventListener("click",()=>openResearch("google"));
  const or=$("#openReddit"); if(or) or.addEventListener("click",()=>openResearch("reddit"));
  const ot=$("#openTikTok"); if(ot) ot.addEventListener("click",()=>openResearch("tiktok"));
  const oi=$("#openInstagram"); if(oi) oi.addEventListener("click",()=>openResearch("instagram"));

  // Article fetch (serverless)
  async function fetchArticle(){
    const url = ($("#articleUrl").value||"").trim();
    const status = $("#fetchStatus");
    if (!url){ status.textContent="Enter a URL."; return; }
    if (state.mode!=="rewrite"){ status.textContent="Fetching is only for Article mode. Switch to 'Rewrite from article'."; return; }
    status.textContent="Fetching...";
    try{
      const res = await fetch("/.netlify/functions/fetch-article",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({url})
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      const text = (data.text||"").slice(0,20000);
      $("#articleText").value = text;
      state.articleText = text;
      status.textContent = "Fetched and loaded into the text box.";
    }catch(e){
      status.textContent = "Fetch failed. Site may block bots (CORS/anti-scrape). Paste the text instead.";
    }
  }
  $("#btnFetch").addEventListener("click", fetchArticle);

  // ===== License modal & verification — robust delegation =====
  function openModal(){ $("#modalWrap").classList.add("open"); }
  function closeModal(){ $("#modalWrap").classList.remove("open"); }
  $("#btnUnlock")?.addEventListener("click",(e)=>{ e.preventDefault(); openModal(); });
  document.addEventListener("keydown",(e)=>{ if (e.key==="Escape") closeModal(); });
  $("#modalWrap")?.addEventListener("click",(e)=>{ if (e.target.id==="modalWrap") closeModal(); });

  document.addEventListener("click", async (e)=>{
    const id = e.target?.id;
    if (!id) return;

    if (id==="modalClose"){ closeModal(); return; }
    if (id==="buyGumroad"){ window.open(GUMROAD_PRODUCT_URL, "_blank"); return; }
    if (id==="buyStripe"){ window.open(STRIPE_PAYMENT_LINK, "_blank"); return; }

    if (id==="verifyLicense"){
      const key = ($("#licenseInput").value||"").trim();
      const status = $("#licenseStatus");
      if (!key) { status.textContent="Enter a license key."; return; }
      status.textContent="Verifying...";
      try{
        const res = await fetch("/.netlify/functions/verify-gumroad",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({license:key, product_id:GUMROAD_PRODUCT_ID})
        });
        const data = await res.json();
        if (data.valid) {
          localStorage.setItem("cb_license_valid","true");
          localStorage.setItem("cb_license_key", key);
          state.licensed = true;
          status.textContent = "✅ License verified. Unlimited unlocked.";
          setTimeout(closeModal, 800);
        } else {
          status.textContent = "❌ Invalid license. Please check or contact support.";
        }
      }catch(err){
        status.textContent = "Error verifying license. Try again.";
      }
    }
  });

  // Load license state & init
  try { state.licensed = localStorage.getItem("cb_license_valid")==="true"; } catch(e){}
  loadSettings();
  render();
})();


