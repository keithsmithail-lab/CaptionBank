// v8 fixed: robust article rewriting + safer sentence splitting + hardened generate handler
// v9 — no intro hooks, larger paste box, smarter hashtags, IG-caption rewrite mode
(function(){
  const $ = (sel)=>document.querySelector(sel);

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
    qty:5,
    captions:[]
  };

  // No “Quick win / Hot take” intros anymore
  const HOOKS = []; // intentionally empty

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

  const pick=a=>a[Math.floor(Math.random()*a.length)];

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

  // Smarter, relevant hashtags
  function tags(){
    if (!state.useHashtags) return "";

    const src = state.mode==="niche" ? state.niche : state.articleText;
    const text = (src || "").toLowerCase();

    // Phrase mappings (high precision)
    const phraseTags = [];
    if (/work from home|remote work|wfh/.test(text)) {
      phraseTags.push("#workfromhome","#remotework","#wfh","#homeoffice");
    }
    if (/side hustle|side-hustle|extra income/.test(text)) {
      phraseTags.push("#sidehustle","#extraincome");
    }
    if (/insurance|life insurance|term life|whole life/.test(text)) {
      phraseTags.push("#insurance","#lifeinsurance");
    }
    if (/sales|closing|prospecting|pipeline/.test(text)) {
      phraseTags.push("#sales","#salestraining");
    }
    if (/lead gen|lead generation|appointments?/.test(text)) {
      phraseTags.push("#leadgeneration","#appointments");
    }
    if (/content|post|social/.test(text)) {
      phraseTags.push("#socialmediatips");
    }

    // Keyword frequency for 2–3 more tags
    const words = text.replace(/[^a-z0-9\s]/g," ")
                      .split(/\s+/).filter(Boolean);
    const stop = new Set(["for","the","and","or","of","in","to","a","an","with","on","at","is","are","this","that","it","you","your","our","from","as","by","about","be","can","will","not"]);
    const freq = {};
    for (const w of words) {
      if (w.length < 4 || stop.has(w)) continue;
      freq[w] = (freq[w]||0) + 1;
    }
    const top = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([w])=>"#"+w.replace(/[^a-z0-9]/g,""));

    // Fallback platform tags only if needed
    let platformFallback = [];
    if (phraseTags.length + top.length < 2) {
      platformFallback = {
        Instagram:["#instagramtips","#contentcreator"],
        Facebook:["#facebookmarketing","#socialmediamarketing"],
        TikTok:["#tiktoktips","#smallbusinesstiktok"],
        LinkedIn:["#linkedinmarketing","#b2b"]
      }[state.platform] || [];
    }

    const all = [...new Set([...phraseTags, ...top, ...platformFallback])];
    return all.slice(0,6).join(" ");
  }

  // Robust sentence splitter (no lookbehind)
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
    return caption + "\n\nCanva image prompt:\n" + canva(headline);
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
    return caption + "\n\nCanva image prompt:\n" + canva(headline, topic);
  }

  function render(){
    // Adjust UI depending on mode
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
    state.captions.forEach((c,i)=>{
      const card=document.createElement("div");
      card.className="cardOut";
      const head=document.createElement("div");
      head.className="cardHead";
      head.textContent="Caption "+(i+1);
      const txt=document.createElement("textarea");
      txt.className="text"; txt.rows=12; txt.readOnly=true; txt.value=c;
      const row=document.createElement("div");
      row.className="rowBtns";
      const b=document.createElement("button");
      b.className="btn alt"; b.textContent="Copy";
      b.onclick=()=>{navigator.clipboard.writeText(c); b.textContent="Copied"; setTimeout(()=>b.textContent="Copy",900);};
      row.appendChild(b);
      card.appendChild(head); card.appendChild(txt); card.appendChild(row);
      out.appendChild(card);
    });

    const modeText = state.mode==="niche" ? (state.niche||"Any niche")
                   : state.mode==="ig"    ? "Rewriting IG caption"
                   : "Rewriting from article";
    $("#crumbs").textContent = modeText+" • "+state.platform+" • "+state.tone+" • "+state.length+(state.useCTA?" • Call To Action: On":" • Call To Action: Off");
  }

  // Bindings
  document.querySelectorAll('input[name="mode"]').forEach(r=>{
    r.addEventListener("change",(e)=>{
      state.mode = e.target.value;
      document.getElementById("nicheCard").style.display = state.mode==="niche" ? "" : "none";
      document.getElementById("articleCard").style.display = (state.mode==="rewrite" || state.mode==="ig") ? "" : "none";
      render();
    });
  });
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

  $("#qty").addEventListener("input",e=>{
    const v = Math.max(1, Math.min(50, Number(e.target.value)||1));
    state.qty = v;
  });

  // Generate
  $("#generate").addEventListener("click",()=>{
    const n = state.qty;
    if (state.mode==="rewrite" || state.mode==="ig"){
      const raw = extractKeyPoints(state.articleText);
      const pts = raw.length ? raw.slice(0,n) : Array(n).fill("Key insight: make it simple and actionable.");
      state.captions = Array.from({length:n},(_,i)=>fromArticle(pts,i));
    } else {
      state.captions = Array.from({length:n}, fromNiche);
    }
    render();
  });

  // Copy / CSV / Reset
  $("#copyAll").addEventListener("click",()=>{
    if (!state.captions.length) return;
    navigator.clipboard.writeText(state.captions.join("\n\n---\n\n"));
    alert("Copied");
  });
  $("#downloadCSV").addEventListener("click",()=>{
    if (!state.captions.length) return;
    const header=["#","Mode","Niche","Platform","Tone","Length","CallToAction","Caption"];
    const rows=state.captions.map((c,i)=>[i+1,state.mode,state.niche||"",state.platform,state.tone,state.length,state.useCTA?"On":"Off",c]);
    const csv=[header,...rows].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="captions_"+Date.now()+".csv"; a.click();
    URL.revokeObjectURL(url);
  });
  $("#reset").


