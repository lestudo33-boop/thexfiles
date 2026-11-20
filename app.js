const {useState,useEffect,useMemo,useRef}=React,html=htm.bind(React.createElement),D=window.DATA;
const B=Object.fromEntries(D.profiles.map(p=>[p.id,p]));
const M={busca:"Busca e apreensão",prisao:"Prisão",bloqueio:"Bloqueio de perfil",investigado:"Investigação",arquivamento:"Arquivamento",decisao:"Decisão"};
const TABS=[["","Todos"],["prisao","Prisões"],["bloqueio","Bloqueios"],["busca","Buscas"],["arquivamento","Arquivamentos"]];
const I={r:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',t:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',l:'<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',s:'<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',b:'<path d="M15 18l-6-6 6-6"/>',c:'<path d="M6 9l6 6 6-6"/>',q:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',ai:'<path d="M19.2 14.8A8.5 8.5 0 1 1 9.3 3.8"/><path d="M7.5 16.5 18 6"/>' ,more:'<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>'};
const Ic=({n})=>html`<svg viewBox="0 0 24 24" dangerouslySetInnerHTML=${{__html:I[n]}}/>`;
const fmt=d=>d.length==4?d:d.length==7?new Date(d+"-15T12:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}):new Date(d+"T12:00").toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"});
const Av=({p,lg})=>p.foto?html`<img className=${"av"+(lg?" lg":"")} src=${p.foto} alt=${p.name}/>`:html`<div className=${"av"+(lg?" lg":"")} style=${{background:p.color}}>${p.name[0]}</div>`;
const Src=({x})=>html`<div className="src">${x.c?html`<b className="chk">Conferir na decisão original · </b>`:""}Fonte: ${x.u||x.url?html`<a href=${x.u||x.url} target="_blank" rel="noopener" onClick=${e=>e.stopPropagation()}>${x.f||x.fonte}</a>`:(x.f||x.fonte)}</div>`;
const Name=({p,meta})=>html`<div className="line"><a className="nm" href=${"#/perfil/"+p.id} onClick=${e=>e.stopPropagation()}>${p.name}</a>${p.kind=="auth"&&html`<span className="badge" title="Autoridade que decidiu">⚖</span>`}${p.handle&&html`<span className="hd">@${p.handle}</span>`}<span className="meta">· ${meta}</span></div>`;
let explanationCsrfToken=null;
async function readExplanationResponse(response){
 const raw=await response.text();
 const contentType=(response.headers.get("content-type")||"").toLowerCase();
 if(!contentType.includes("application/json"))throw new Error("A rota de explicações não está sendo executada pelo PHP (HTTP "+response.status+", "+(contentType||"sem Content-Type")+"). Inicie o servidor PHP na raiz do projeto e confirme que a pasta `api/` foi publicada.");
 let payload;
 try{payload=JSON.parse(raw)}catch{throw new Error("O endpoint PHP retornou JSON inválido (HTTP "+response.status+"). Verifique os logs do PHP.")}
 if(!response.ok||payload.success===false)throw new Error(payload.error||"O servidor respondeu com HTTP "+response.status+".");
 return payload;
}
async function requestExplanation(x,signal){
 if(!explanationCsrfToken){
  const tokenResponse=await fetch("api/explain_process.php",{credentials:"same-origin",headers:{Accept:"application/json"},signal});
  const tokenPayload=await readExplanationResponse(tokenResponse);
  if(typeof tokenPayload.csrf_token!="string"||!tokenPayload.csrf_token)throw new Error("Não foi possível iniciar a sessão segura. Recarregue a página.");
  explanationCsrfToken=tokenPayload.csrf_token;
 }
 const response=await fetch("api/explain_process.php",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":explanationCsrfToken,Accept:"application/json"},signal,body:JSON.stringify({process_id:x.id})});
 if(response.status==403)explanationCsrfToken=null;
 const payload=await readExplanationResponse(response);
 if(typeof payload.text!="string"||!payload.text.trim())throw new Error("O modelo não retornou uma análise.");
 return payload.text.trim();
}
function ExplainModal({state,post,profile,onClose,onRetry}){
 const panel=useRef(null),closeButton=useRef(null);
 useEffect(()=>{
  const active=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  closeButton.current?.focus();
  return()=>{document.body.style.overflow=overflow;active?.focus?.()};
 },[]);
 const key=e=>{
  if(e.key=="Escape"){e.preventDefault();onClose();return}
  if(e.key!="Tab")return;
  const buttons=panel.current?.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])');
  if(!buttons?.length)return;
  const first=buttons[0],last=buttons[buttons.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 };
 return html`<div className="explain-backdrop" onClick=${e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="explain-modal" role="dialog" aria-modal="true" aria-labelledby="explain-title" ref=${panel} onKeyDown=${key}>
   <header className="explain-header"><div className="explain-brand"><img className="ai-mark" src="logo.png" alt=""/><div><h2 id="explain-title">Análise com IA</h2><span>Contextualizada com esta publicação</span></div></div><button className="explain-close" type="button" aria-label="Fechar análise" ref=${closeButton} onClick=${onClose}>×</button></header>
   <div className="explain-context"><div><strong>${profile.name}</strong><span> · ${fmt(post.date)}</span></div><p>${post.texto}</p></div>
   <div className="explain-content" aria-live="polite">
    ${state.status=="loading"&&html`<div className="explain-loading" role="status"><span className="explain-spinner"/>Preparando uma análise concisa…</div>`}
    ${state.status=="success"&&html`<p className="explain-answer">${state.text}</p>`}
    ${state.status=="error"&&html`<div className="explain-error" role="alert"><p>${state.error}</p><button className="explain-retry" type="button" onClick=${onRetry}>Tentar novamente</button></div>`}
   </div>
   <p className="explain-disclaimer">Conteúdo gerado por IA a partir dos registros exibidos. Confira as fontes originais; a análise pode conter erros e não é aconselhamento jurídico.</p>
  </section>
 </div>`;
}
function Step({s,root,last}){const p=B[s.a];return html`<div className="step"><div className="rail"><${Av} p=${p}/>${!last&&html`<i/>`}</div><div className="sb"><${Name} p=${p} meta=${fmt(s.d)}/><div className="role">Respondendo a <span className="lnk">@${B[root].handle}</span> · ${p.role}</div><div className="txt">${s.t}</div>${s.k&&html`<span className=${"tag "+s.k}>${M[s.k]}</span>`}<${Src} x=${s}/></div></div>`}
function Post({x,open,toggle,liked,like,detail,caseTags=[]}){const p=B[x.user],n=x.passos.length,[copyStatus,setCopyStatus]=useState(""),[menuOpen,setMenuOpen]=useState(false),[explanation,setExplanation]=useState(null),activeRequest=useRef(0),activeController=useRef(null),menuRef=useRef(null);
 useEffect(()=>()=>activeController.current?.abort(),[]);
 useEffect(()=>{if(!menuOpen)return;const outside=e=>{if(!menuRef.current?.contains(e.target))setMenuOpen(false)},escape=e=>{if(e.key=="Escape")setMenuOpen(false)};document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape)}},[menuOpen]);
 const share=async e=>{e.stopPropagation();setMenuOpen(false);try{if(!navigator.clipboard?.writeText)throw new Error("Clipboard indisponível");await navigator.clipboard.writeText(location.href.split("#")[0]+"#/p/"+x.id);setCopyStatus("Link copiado")}catch{setCopyStatus("Não foi possível copiar o link.")}setTimeout(()=>setCopyStatus(""),2000)};
 const explain=async()=>{activeController.current?.abort();const id=++activeRequest.current,controller=new AbortController();activeController.current=controller;setExplanation({status:"loading"});
  try{const text=await requestExplanation(x,controller.signal);if(id===activeRequest.current)setExplanation({status:"success",text})}
  catch(error){if(error.name=="AbortError")return;const message=error instanceof TypeError?(location.protocol=="file:"?"A análise com IA precisa de uma origem HTTP. Rode o app em um servidor PHP e abra `http://localhost:8000`.":"Não foi possível conectar à API local. Verifique se o app está em um servidor com PHP habilitado."):error.message||"Não foi possível gerar a análise.";if(id===activeRequest.current)setExplanation({status:"error",error:message})}
 };
 const closeExplanation=()=>{activeRequest.current++;activeController.current?.abort();activeController.current=null;setExplanation(null)};
 return html`<article className=${"post"+(open?" open":"")} id=${"p-"+x.id}>
 ${x.pinned&&html`<div className="pin">📌 Processo fixado</div>`}
 <div className="main" onClick=${toggle}>
  <div className="rail"><${Av} p=${p}/>${open&&html`<i/>`}</div>
  <div className="sb"><div className="post-heading"><${Name} p=${p} meta=${fmt(x.date)}/><div className="post-tools"><button className="post-tool ai-action" type="button" aria-label="Analisar publicação com IA" title="Analisar publicação com IA" onClick=${e=>{e.stopPropagation();explain()}}><img src="logo.png" alt=""/></button><div className="post-menu-wrap" ref=${menuRef}><button className="post-tool menu-action" type="button" aria-label="Mais opções" aria-haspopup="menu" aria-expanded=${menuOpen} onClick=${e=>{e.stopPropagation();setMenuOpen(v=>!v)}}><${Ic} n="more"/></button>${menuOpen&&html`<div className="post-menu" role="menu"><button type="button" role="menuitem" onClick=${share}>Copiar link</button></div>`}</div></div></div>
   <div className="txt">${x.texto}</div>
   <span className=${"tag "+x.medida}>${M[x.medida]}</span><${Src} x=${x}/>
   ${caseTags.length>0&&html`<div className="feed-case-tags"><span>Vínculos:</span>${caseTags.map(t=>html`<a key=${t.identifier} href=${t.href} onClick=${e=>e.stopPropagation()}>${t.identifier}</a>`)}</div>`}
   <div className="acts" onClick=${e=>e.stopPropagation()}>
    <button className=${"ab r"+(open?" on":"")} onClick=${toggle} aria-label="Andamentos"><${Ic} n="r"/>${n} andamento${n>1?"s":""}<span className=${"chev"+(open?" up":"")}><${Ic} n="c"/></span></button>
    <button className=${"ab l"+(liked?" on":"")} onClick=${like} aria-label="Curtir"><${Ic} n="l"/></button>
    ${!detail&&html`<a className="ab open" href=${"#/p/"+x.id}>Abrir processo</a>`}
    ${copyStatus&&html`<span className="copy-confirmation" role="status">${copyStatus}</span>`}
   </div></div></div>
 ${open&&html`<div className="thread"><button className="thread-explainer" type="button" onClick=${explain}><img src="logo.png" alt=""/><span>Analisar publicação com IA</span><small>Análise com IA</small></button>${x.passos.map((s,i)=>html`<${Step} key=${i} s=${s} root=${x.user} last=${i==x.passos.length-1}/>`)}${(x.notes||[]).map((note,i)=>html`<div key=${"note-"+i} className="case-note"><span>${note.text}</span><div>Fonte: <a href=${note.url} target="_blank" rel="noopener noreferrer">${note.source}</a></div></div>`)}</div>`}
 ${explanation&&html`<${ExplainModal} state=${explanation} post=${x} profile=${p} onClose=${closeExplanation} onRetry=${explain}/>`}
 </article>`}
const Head=({t,sub,back,home,backTo})=>html`<div className=${"top"+(home?" home-heading":"")}>${back&&html`<a className="back" href=${backTo||"#/"} aria-label="Voltar"><${Ic} n="b"/></a>`}<div className="tt"><h1>${t}</h1>${sub&&html`<small>${sub}</small>`}</div></div>`;
const years=[...new Set([...D.posts.flatMap(x=>[x.date,...x.passos.map(s=>s.d)]),...D.inquiries.flatMap(x=>x.sources.map(s=>s.date).filter(Boolean))].map(d=>d.slice(0,4)))].sort();
function useFeed(){const [open,setOpen]=useState({inq:false}),[liked,setL]=useState({});
 return {open,liked,toggle:id=>setOpen(o=>({...o,[id]:!o[id]})),like:id=>setL(l=>({...l,[id]:!l[id]}))}}
function Home({feed}){const [F,setF]=useState({q:"",k:"",u:"",y:""}),set=(k,v)=>setF(f=>({...f,[k]:v})),q=F.q.toLowerCase(),inquiryFeed=useMemo(()=>buildInquiryFeed(),[]);
 const list=useMemo(()=>{const posts=D.posts.filter(x=>(!F.k||x.medida==F.k||x.passos.some(s=>s.k==F.k))&&(!F.u||x.user==F.u)&&(!F.y||x.date.startsWith(F.y)||x.passos.some(s=>s.d.startsWith(F.y)))&&(!q||(x.texto+B[x.user].name+x.passos.map(s=>s.t+B[s.a].name).join(" ")).toLowerCase().includes(q))).map(x=>({type:"post",item:x,date:x.date,pinned:x.pinned}));
 const people=inquiryFeed.people.filter(x=>(!F.k||x.measure==F.k)&&(!F.u||x.profile==F.u)&&(!F.y||x.date.startsWith(F.y))&&(!q||(`${x.name} ${x.handle} ${x.relationships.map(r=>r.text+" "+r.identifiers.join(" ")+" "+r.title).join(" ")}`).toLowerCase().includes(q))).map(x=>({type:"related",item:x,date:x.date,pinned:false}));
 return [...posts,...people].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date.localeCompare(a.date))},[F,inquiryFeed,q]);
 const filtering=F.k||F.u||F.y||F.q;
 return html`<${React.Fragment}><${Head} t="Inquérito 4.781 e investigações conexas · STF" sub=${html`<strong>Processos, pessoas, decisões e acontecimentos relacionados às investigações conduzidas pelo Supremo Tribunal Federal.</strong>`} home=${true}/>
 <div className="tabs sticky-tabs">${TABS.map(([k,l])=>html`<button key=${k} className=${F.k==k?"on":""} onClick=${()=>set("k",k)}>${l}<i/></button>`)}</div>
 <div className="filters"><label className="search-filter"><${Ic} n="q"/><input aria-label="Buscar processos, pessoas e decisões" placeholder="Buscar processos, pessoas e decisões" value=${F.q} onChange=${e=>set("q",e.target.value)}/></label><label className="filter-select"><select aria-label="Filtrar por pessoa" value=${F.u} onChange=${e=>set("u",e.target.value)}><option value="">Pessoa</option>${D.profiles.filter(p=>p.kind=="inv").map(p=>html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select></label><label className="filter-select"><select aria-label="Filtrar por ano" value=${F.y} onChange=${e=>set("y",e.target.value)}><option value="">Ano</option>${years.map(y=>html`<option key=${y}>${y}</option>`)}</select></label></div>
 ${list.filter(x=>!(x.pinned&&filtering)).map(x=>x.type=="post"?html`<${Post} key=${x.item.id} x=${x.item} open=${!!feed.open[x.item.id]} toggle=${()=>feed.toggle(x.item.id)} liked=${feed.liked[x.item.id]} like=${()=>feed.like(x.item.id)} caseTags=${inquiryFeed.tagsByPost[x.item.id]||[]}/>`:html`<${InquiryFeedPost} key=${x.item.id} item=${x.item}/>`)}
 ${!list.length&&html`<div className="empty">Nenhum processo encontrado.</div>`}<//>`}
function Detail({id,feed}){const x=D.posts.find(p=>p.id==id);useEffect(()=>{if(x&&!feed.open[id])feed.toggle(id)},[id]);
 if(!x)return html`<${Head} t="Processo" back=${1}/><div className="empty">Processo não encontrado.</div>`;
 return html`<${Head} t="Processo" sub=${B[x.user].name} back=${1}/><${Post} x=${x} open=${true} toggle=${()=>{}} liked=${feed.liked[id]} like=${()=>feed.like(id)} detail=${true}/>`}
const ReportMetric=({value,label,detail,tone})=>html`<div className=${"report-metric"+(tone?" "+tone:"")}><strong>${value}</strong><span>${label}</span>${detail&&html`<small>${detail}</small>`}</div>`;
const ReportSection=({title,kicker,children})=>html`<section className="report-section">${kicker&&html`<span className="report-kicker">${kicker}</span>`}<h2>${title}</h2>${children}</section>`;
const Bar=({label,value,max,color="blue",detail})=>html`<div className="report-bar"><div className="report-bar-label"><span>${label}</span><b>${value}${detail?" "+detail:""}</b></div><div className="report-bar-track"><i className=${"report-bar-fill "+color} style=${{width:Math.max(2,(value/max)*100)+"%"}}/></div></div>`;
const MiniBars=({labels,values,colors=["blue","violet","cyan","green"]})=>html`<div className="report-mini-bars">${labels.map((label,i)=>html`<div key=${label} className="report-mini-column"><div className="report-mini-plot"><i className=${"report-mini-fill "+colors[i]} style=${{height:(values[i]/Math.max(...values)*100)+"%"}}><span>${values[i]}</span></i></div><small>${label}</small></div>`)}</div>`;
const Donut=({segments,size="report-donut"})=>{let start=0;const stops=segments.map(s=>{const end=start+s.value/segments.reduce((n,x)=>n+x.value,0)*360;const stop=start+"deg "+end+"deg";start=end;return s.color+" "+stop}).join(",");return html`<div className=${size} style=${{background:"conic-gradient("+stops+")"}}><div><b>${segments.reduce((n,s)=>n+s.value,0)}</b><small>réus</small></div></div>`};
function Inq({feed}){const x=D.posts[0];useEffect(()=>{if(!feed.open.inq)feed.toggle("inq")},[]);
 return html`<${React.Fragment}><${Head} t="Relatório STF – 8 de janeiro" sub="Síntese processual apresentada em 19/11/2026" back=${1}/><div className="report">
 <section className="report-hero"><div><span className="report-kicker">Visão geral</span><h2>1.535 réus responsabilizados</h2><p>Dados consolidados sobre investigações, atos processuais, condenações, penas e custódia.</p></div><${Donut} segments=${[{value:598,color:"#1d9bf0"},{value:482,color:"#7856ff"},{value:455,color:"#00ba7c"}]}/></section>
 <div className="report-kpis">
 <${ReportMetric} value="1.927" label="denúncias recebidas" tone="blue"/>
 <${ReportMetric} value="200" label="presos atuais" detail="13,03% dos réus" tone="red"/>
 <${ReportMetric} value="945" label="condenações" detail="483 simples + 463 graves" tone="green"/>
 <${ReportMetric} value="598" label="ANPPs" detail="38,96%" tone="violet"/>
 </div>
 <${ReportSection} title="Dados gerais" kicker="I">
  <div className="report-grid">
   <${ReportMetric} value="115" label="petições (Pets)" detail="+ 6 inquéritos"/>
   <${ReportMetric} value="621" label="executores" detail="Inq. 4922"/>
   <${ReportMetric} value="1.154" label="incitadores" detail="Inq. 4921"/>
   <${ReportMetric} value="31" label="núcleos principais"/>
   <${ReportMetric} value="121" label="financiadores"/>
   <${ReportMetric} value="20" label="denúncias em recebimento"/>
   <${ReportMetric} value="121" label="investigações em andamento"/>
   <${ReportMetric} value="179" label="arquivamentos" detail="ausência de justa causa"/>
  </div>
 </${ReportSection}>
 <${ReportSection} title="Atos processuais por ano" kicker="II">
  <div className="report-chart-list">
   <div className="report-chart-row"><b>Audiências de custódia</b><${MiniBars} labels=${["2023","2024","2025","2026"]} values=${[1397,137,51,49]} colors=${["blue","violet","cyan","green"]}/></div>
   <div className="report-chart-row"><b>Audiências de instrução</b><${MiniBars} labels=${["2023","2024","2025","2026"]} values=${[232,860,187,125]} colors=${["blue","violet","cyan","green"]}/></div>
   <div className="report-chart-row"><b>Testemunhas de acusação</b><${MiniBars} labels=${["2023","2024","2025","2026"]} values=${[719,1660,143,216]} colors=${["blue","violet","cyan","green"]}/></div>
   <div className="report-chart-row"><b>Testemunhas de defesa</b><${MiniBars} labels=${["2023","2024","2025","2026"]} values=${[386,980,287,232]} colors=${["blue","violet","cyan","green"]}/></div>
   <div className="report-chart-row"><b>Interrogatórios dos réus</b><${MiniBars} labels=${["2023","2024","2025","2026"]} values=${[232,860,187,163]} colors=${["blue","violet","cyan","green"]}/></div>
  </div>
  <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Ato</th><th>2023</th><th>2024</th><th>2025</th><th>2026</th><th>Total</th></tr></thead><tbody>
   ${[["Audiências de custódia",1397,137,51,49,1636],["Audiências de instrução",232,860,187,125,1404],["Oitivas — acusação",719,1660,143,216,2738],["Oitivas — defesa",386,980,287,232,1885],["Interrogatórios",232,860,187,163,1442]].map(r=>html`<tr>${r.map((v,i)=>html`<td key=${i} className=${i==5?"report-total":""}>${v}</td>`)}</tr>`)}
  </tbody></table></div>
 </${ReportSection}>
 <${ReportSection} title="Réus responsabilizados e ações penais" kicker="III">
  <div className="report-grid report-grid-three">
   <${ReportMetric} value="29" label="núcleos principais"/>
   <${ReportMetric} value="426" label="crimes graves"/>
   <${ReportMetric} value="482" label="crimes menos graves"/>
  </div>
  <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Ações penais</th><th>Simples</th><th>Graves</th><th>Total</th></tr></thead><tbody>
   ${[["Condenações",483,463,945],["Absolvições",9,8,17],["Instrução em andamento",66,96,162],["Extinção — art. 107, I",5,7,12]].map(r=>html`<tr>${r.map((v,i)=>html`<td key=${i} className=${i==0?"report-label":i==3?"report-total":""}>${v}</td>`)}</tr>`)}
  </tbody></table></div>
  <div className="report-sanctions"><div className="report-donut-wrap"><${Donut} segments=${[{value:598,color:"#1d9bf0"},{value:482,color:"#7856ff"},{value:455,color:"#00ba7c"}]}/></div><div className="report-legend">
   ${[{v:"598",p:"38,96%",l:"ANPPs",c:"blue"},{v:"482",p:"31,40%",l:"Penas restritivas",c:"violet"},{v:"455",p:"29,64%",l:"Penas privativas",c:"green"}].map(x=>html`<div key=${x.l}><i className=${x.c}/><span><b>${x.v}</b> ${x.l}</span><strong>${x.p}</strong></div>`)}
  </div></div>
 </${ReportSection}>
 <${ReportSection} title="Principais faixas de pena" kicker="IV">
  <div className="report-bars"><${Bar} label="1 ano" value="465" max="465" detail="(30,29%)"/><${Bar} label="14 anos" value="237" max="465" detail="(15,44%)" color="violet"/><${Bar} label="17 anos" value="58" max="465" detail="(3,78%)" color="cyan"/><${Bar} label="16 anos e 6 meses" value="57" max="465" detail="(3,71%)" color="green"/><${Bar} label="13 anos e 6 meses" value="42" max="465" detail="(2,74%)" color="orange"/><${Bar} label="2 anos e 5 meses" value="25" max="465" detail="(1,63%)" color="rose"/></div>
  <p className="report-note">Maiores penas: 27 anos e 3 meses (1); 26 anos e 6 meses (1); 26 anos (1); 24 anos e 6 meses (1); 24 anos (3); 21 anos (6). A tabela completa reúne 29 faixas.</p>
 </${ReportSection}>
 <${ReportSection} title="Execução penal" kicker="V">
  <div className="execution-grid">
   <div className="execution-card blue"><span>ANPPs</span><strong>598</strong><div><b>382</b><small>extintos · 24,88%</small></div><div><b>216</b><small>em andamento · 14,07%</small></div></div>
   <div className="execution-card violet"><span>Restritivas de direito</span><strong>482</strong><div><b>21</b><small>extintas · 1,37%</small></div><div><b>461</b><small>em andamento · 30,03%</small></div></div>
   <div className="execution-card green"><span>Crimes graves</span><strong>455</strong><div><b>432</b><small>fechado · 28,14%</small></div><div><b>11</b><small>semiaberto · 0,72%</small></div><div><b>12</b><small>aberto · 0,78%</small></div></div>
  </div>
  <div className="report-fine"><span>Multas — pena cumprida e punibilidade extinta</span><strong>R$ 276.504,26</strong></div>
 </${ReportSection}>
 <${ReportSection} title="Progressão e prisões atuais" kicker="VI–VII">
  <div className="prison-layout"><div><h3>183 presos definitivos</h3><${Bar} label="Regime fechado" value="161" max="183" detail="" color="red"/><div className="report-subbars"><span>92 em presídio</span><span>69 em domiciliar</span></div><${Bar} label="Progressão ao semiaberto" value="17" max="183" detail="" color="orange"/><div className="report-subbars"><span>10 em colônia penal</span><span>7 em domiciliar</span></div></div><div><h3>200 presos atuais</h3><${Donut} segments=${[{value:183,color:"#f4212e"},{value:17,color:"#ffd400"}]}/><div className="report-legend"><div><i className="red"/><span><b>183</b> definitivos</span><strong>11,92%</strong></div><div><i className="yellow"/><span><b>17</b> processuais</span><strong>1,11%</strong></div></div></div></div>
  <div className="gender-grid"><div><span>Definitivas</span><strong>47 mulheres · 136 homens</strong><div className="gender-bar"><i className="women" style=${{width:"25.68%"}}/><i className="men" style=${{width:"74.32%"}}/></div></div><div><span>Processuais</span><strong>6 mulheres · 11 homens</strong><div className="gender-bar"><i className="women" style=${{width:"35.29%"}}/><i className="men" style=${{width:"64.71%"}}/></div></div><div><span>Em domicílio — 88</span><strong>30 mulheres · 58 homens</strong><div className="gender-bar"><i className="women" style=${{width:"34.09%"}}/><i className="men" style=${{width:"65.91%"}}/></div></div></div>
  <p className="report-note">Homens em regime fechado: 30 na faixa de 41–50 anos e 30 na faixa de 51–60 anos (16,39% cada). Homens em domiciliar definitivo: 15 na faixa de 61–65 anos (8,20%).</p>
 </${ReportSection}>
 <${ReportSection} title="Núcleos principais" kicker="VIII">
  <div className="nuclei-grid"><${ReportMetric} value="21" label="sessões de julgamento"/><${ReportMetric} value="31" label="réus julgados"/><${ReportMetric} value="127" label="advogados"/><${ReportMetric} value="154" label="testemunhas"/><${ReportMetric} value="146" label="testemunhas de defesa"/><${ReportMetric} value="8" label="testemunhas de acusação"/></div>
  <div className="report-outcomes"><div><strong>25</strong><span>condenações integrais · 80,6%</span></div><div><strong>2</strong><span>condenações parciais · 6,45%</span></div><div><strong>2</strong><span>desclassificações · 6,45%</span></div><div><strong>2</strong><span>absolvições · 6,45%</span></div></div>
  <p className="report-note">Penas dos 29 condenados: 27 anos (1), 26 anos e 6 meses (1), 26 anos (1), 24 anos (5), 21 anos (5), 17 anos (3) e 13 anos e 6 meses (2). Ao todo, foram registradas 18 faixas, de 1 ano e 11 meses até 27 anos.</p>
 </${ReportSection}>
 <details className="report-inconsistencies"><summary>Inconsistências identificadas no documento</summary><ul><li>Maior pena: 27 anos e 3 meses na seção IV e 27 anos na seção VII para o mesmo grupo.</li><li>Faixas de 24 e 21 anos diferem entre as seções IV e VII, possivelmente por conta por ação penal ou por grupo de réus.</li><li>O total de 455 condenados em crimes graves bate com os regimes, mas difere dos 426 réus da seção III.</li><li>A seção VI cita 7 preventivas, enquanto a tabela indica 6 preventivas e 11 domiciliares processuais.</li></ul></details>
 </div><${Post} x=${x} open=${true} toggle=${()=>{}} detail=${true}/><div className="empty small">O número de "mais de 1.600 ações penais" não foi confirmado em fontes consultadas e não é exibido.</div><//>`}
const CaseCites=({refs,sources})=>refs&&html`<span className="case-cites">${refs.map(i=>sources[i].url?html`<a key=${i} href=${sources[i].url} target="_blank" rel="noopener noreferrer" aria-label=${"Fonte "+(i+1)+": "+sources[i].title}>[${i+1}]</a>`:html`<span key=${i} aria-label=${"Referência sem link: "+sources[i].title}>[${i+1}]</span>`)}</span>`;
function buildInquiryFeed(){const tagsByPost={inq:[{identifier:"#Inq4781",href:"#/inquerito"}]},missing=new Map(),normalize=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 for(const inquiry of D.inquiries){for(const [groupIndex,group] of inquiry.groups.entries()){const href="#/caso/"+inquiry.id;
  for(const person of group.people){const identifiers=person.identifiers||group.identifiers||[group.identifier||"#Inq"+inquiry.id],personName=normalize(person.name),existing=person.profile&&D.posts.find(post=>post.user==person.profile)||D.posts.find(post=>{const text=normalize(post.texto+" "+B[post.user].name+" "+post.passos.map(s=>s.t+" "+B[s.a].name).join(" "));return text.includes(personName)});
   if(existing){const tags=tagsByPost[existing.id]||(tagsByPost[existing.id]=[]);for(const identifier of identifiers)if(!tags.some(t=>t.identifier==identifier))tags.push({identifier,href});continue}
   const key=person.profile||personName;let item=missing.get(key);if(!item){item={id:"inquiry-"+key,name:person.name,handle:person.handle||(person.profile&&B[person.profile].handle)||"",profile:person.profile,date:"",measure:person.measure||"",relationships:[]};missing.set(key,item)}
   if(!item.handle&&person.handle)item.handle=person.handle;
   const dates=(person.sources||[]).map(i=>inquiry.sources[i].date).filter(Boolean).sort();if(dates.length&&dates[dates.length-1]>item.date)item.date=dates[dates.length-1];
   if(!item.relationships.some(r=>r.key==inquiry.id+"-"+groupIndex))item.relationships.push({key:inquiry.id+"-"+groupIndex,inquiryId:inquiry.id,title:inquiry.title,identifiers,href,text:person.relation,sources:person.sources,sourceList:inquiry.sources});
  }
 }}
 return {tagsByPost,people:[...missing.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name))}}
function InquiryFeedPost({item}){return html`<article className="post"><div className="main inquiry-feed-main"><div className="inquiry-feed-avatar" style=${item.profile?{background:B[item.profile].color,borderColor:B[item.profile].color,color:"#fff"}:{}} aria-hidden="true">${item.profile?item.name[0]:"#"}</div><div className="sb"><div className="line">${item.profile?html`<a className="nm" href=${"#/perfil/"+item.profile}>${item.name}</a>`:html`<span className="nm">${item.name}</span>`}${item.handle&&html`<span className="hd">@${item.handle}</span>`}<span className="meta">· data da fonte: ${fmt(item.date)}</span></div>${item.relationships.map(r=>html`<div key=${r.key} className="inquiry-feed-relation"><div className="feed-case-tags">${r.identifiers.map(identifier=>html`<a key=${identifier} href=${r.href}>${identifier}</a>`)}</div><div className="txt">${r.text}</div><${CaseCites} refs=${r.sources} sources=${r.sourceList}/></div>`)}</div></div></article>`}
const CaseCard=({x,href})=>html`<a className="case-card" href=${href}><div className="case-card-head"><h2>${x.title}</h2><span className="case-arrow">›</span></div><p>${x.summary}</p><div className="case-card-meta"><span>${x.status}</span><span>${x.groups.reduce((n,g)=>n+g.people.length,0)} ${x.peopleLabel||"vínculos documentados"}</span></div></a>`;
function Inquiries(){return html`<${React.Fragment}><${Head} t="Inquéritos" sub="Investigações relacionadas ao ecossistema do STF" back=${1}/><div className="case-list">
 <a className="case-card" href="#/inquerito"><div className="case-card-head"><h2>Inq. 4.781 — Inquérito das Fake News</h2><span className="case-arrow">›</span></div><p>Inquérito principal sobre notícias fraudulentas, ameaças e ataques ao STF. Consulte a linha do tempo e os andamentos registrados.</p><div className="case-card-meta"><span>Arquivado em 09/11/2026</span><span>Linha do tempo</span></div></a>
 ${D.inquiries.map(x=>html`<${CaseCard} key=${x.id} x=${x} href=${"#/caso/"+x.id}/>`)}
 </div><//>`}
function InquiryDetail({id}){const x=D.inquiries.find(c=>c.id==id);if(!x)return html`<${Head} t="Inquérito" back=${1} backTo="#/inqueritos"/><div className="empty">Inquérito não encontrado.</div>`;
 return html`<${React.Fragment}><${Head} t=${x.title} sub="Investigação relacionada" back=${1} backTo="#/inqueritos"/><div className="case-detail"><p className="case-summary">${x.summary}</p><div className="case-status"><b>Status:</b> ${x.status}</div>
 ${x.groups.map((g,gi)=>html`<section key=${gi} className="case-group"><div className="case-group-heading"><h2 className="sec">${g.title}</h2><a className="case-group-id" href=${"#/caso/"+x.id}>${g.identifier}</a></div>${g.note&&html`<p className="case-note">${g.note}</p>`}${g.people.map((p,pi)=>html`<article key=${pi} className="case-person"><div className="case-person-name">${p.profile&&B[p.profile]?html`<a href=${"#/perfil/"+p.profile}>${p.name}</a>`:p.name}<${CaseCites} refs=${p.sources} sources=${x.sources}/></div>${p.identifiers&&html`<div className="feed-case-tags">${p.identifiers.map(identifier=>html`<a key=${identifier} href=${"#/caso/"+x.id}>${identifier}</a>`)}</div>`}<p>${p.relation}</p></article>`)}</section>`)}
 ${x.notes.map((n,i)=>html`<div key=${i} className="case-note"><span>${n.text}</span><${CaseCites} refs=${n.sources} sources=${x.sources}/></div>`)}
 <section className="case-sources"><h2 className="sec">Fontes</h2><ol>${x.sources.map((s,i)=>html`<li key=${i}>${s.url?html`<a href=${s.url} target="_blank" rel="noopener noreferrer">${s.title}</a>`:s.title}</li>`)}</ol></section>
 </div><//>`}
const Row=({p})=>html`<a className="pl" href=${"#/perfil/"+p.id}><${Av} p=${p}/><div><${Name} p=${p} meta=${""}/><div className="meta">${p.kind=="auth"?p.role:p.status}</div></div></a>`;
const Perfis=()=>html`<${Head} t="Perfis"/><h2 className="sec">Investigados</h2>${D.profiles.filter(p=>p.kind=="inv").map(p=>html`<${Row} key=${p.id} p=${p}/>`)}<h2 className="sec">Pessoas mencionadas</h2>${D.profiles.filter(p=>p.kind=="related").map(p=>html`<${Row} key=${p.id} p=${p}/>`)}<h2 className="sec">Quem decidiu</h2>${D.profiles.filter(p=>p.kind=="auth").map(p=>html`<${Row} key=${p.id} p=${p}/>` )}`;
const CT={condenado:"Condenado",apurado:"Em apuração",arquivado:"Arquivado",reu:"Réu"};
const cnt=(l,k)=>l.filter(s=>s.k==k).length;
function Perfil({id,feed}){const p=B[id],[tab,setTab]=useState(""),[o,setO]=useState({});if(!p)return html`<${Home} feed=${feed}/>`;
 const au=p.kind=="auth",mine=D.posts.filter(x=>x.user==id),caseItems=au?[]:buildInquiryFeed().people.filter(x=>x.profile==id),
 acts=D.posts.flatMap(x=>x.passos.map(s=>({...s,x}))).filter(s=>s.a==id).sort((a,b)=>b.d.localeCompare(a.d)),
 steps=mine.flatMap(x=>x.passos.map(s=>({...s,x}))).sort((a,b)=>b.d.localeCompare(a.d)),L=au?acts:steps;
 const stats=au?[[acts.length,"andamentos"],[new Set(acts.map(s=>s.x.id)).size,"processos"],[cnt(acts,"prisao"),"prisões"],[cnt(acts,"bloqueio"),"bloqueios"],[cnt(acts,"busca"),"buscas"]]:[[mine.length,"processos"],[steps.length,"andamentos"],[cnt(steps,"prisao"),"prisões"],[cnt(steps,"bloqueio"),"bloqueios"],[cnt(steps,"busca"),"buscas"],...(caseItems.length?[[caseItems.length,caseItems.length==1?"vínculo em inquérito":"vínculos em inquéritos"]]:[])];
 const tabs=au?[["","Andamentos"],["prisao","Prisões"],["bloqueio","Bloqueios"],["busca","Buscas"]]:[["","Processos"],["m","Medidas"]];
 const flat=au||tab=="m",shown=L.filter(s=>!au?true:!tab||s.k==tab);
 return html`<${Head} t=${p.name} sub=${au?acts.length+" andamento"+(acts.length==1?"":"s")+" neste arquivo":mine.length+" processo"+(mine.length==1?"":"s")+(caseItems.length?" · "+caseItems.length+" vínculo"+(caseItems.length==1?"":"s")+" em inquérito"+(caseItems.length==1?"":"s"):"")} back=${1}/><div className="banner" style=${{background:p.color+"33"}}/>
 <div className="ph"><div className="prow"><${Av} p=${p} lg=${1}/><button className="pbtn" onClick=${()=>navigator.clipboard&&navigator.clipboard.writeText(location.href).catch(()=>{})}>Copiar link</button></div>
 <h2>${p.name}${au&&html`<span className="badge">⚖</span>`}</h2>${p.handle&&html`<div className="hd">@${p.handle}</div>`}<p>${p.bio}</p>${(p.since||p.status)&&html`<div className="stat">${au?p.since:html`<span><b>Status:</b> ${p.status}</span>`}</div>`}
 ${p.crime&&html`<div className="crime"><div className="ch"><b>Crime / imputação</b><span className=${"tag ct "+p.crimeTipo}>${CT[p.crimeTipo]}</span></div><div>${p.crime}</div></div>`}
 <div className="stats">${stats.map(([n,l])=>html`<span key=${l}><b>${n}</b> ${l}</span>`)}</div><div className="meta">Contagens consideram só os registros deste arquivo, não o total de decisões da pessoa.</div></div>
 <div className="ptabs">${tabs.map(([k,l])=>html`<button key=${k} className=${tab==k?"on":""} onClick=${()=>setTab(k)}>${l}<i/></button>`)}</div>
 ${flat?shown.map((s,i)=>html`<a key=${i} className="act" href=${"#/p/"+s.x.id}><div className="meta">${au?"Em resposta a @"+B[s.x.user].handle:B[s.a].name} · ${fmt(s.d)}</div><div className="txt">${s.t}</div>${s.k&&html`<span className=${"tag "+s.k}>${M[s.k]}</span>`}</a>`):html`<${React.Fragment}>${mine.map(x=>html`<${Post} key=${x.id} x=${x} open=${o[x.id]!==false} toggle=${()=>setO(v=>({...v,[x.id]:v[x.id]===false}))} liked=${feed.liked[x.id]} like=${()=>feed.like(x.id)}/>`)}${caseItems.map(x=>html`<${InquiryFeedPost} key=${x.id} item=${x}/>`)}<//>`}
 ${!shown.length&&!mine.length&&(!caseItems.length||flat)&&html`<div className="empty">Nada nesta aba.</div>`}`}
function App(){const feed=useFeed(),[h,setH]=useState(location.hash);useEffect(()=>{const f=()=>{setH(location.hash);scrollTo(0,0)};addEventListener("hashchange",f);return()=>removeEventListener("hashchange",f)},[]);
 const [r,a]=h.replace("#/","").split("/");let v;
 if(r=="p")v=html`<${Detail} id=${a} feed=${feed}/>`;else if(r=="inqueritos")v=html`<${Inquiries}/>`;else if(r=="caso")v=html`<${InquiryDetail} id=${a}/>`;else if(r=="inquerito")v=html`<${Inq} feed=${feed}/>`;else if(r=="perfis")v=html`<${Perfis}/>`;else if(r=="perfil")v=html`<${Perfil} id=${a} feed=${feed}/>`;else v=html`<${Home} feed=${feed}/>`;
 const nav=[["#/","Início","⌂",""],["#/inqueritos","Inquéritos","⚖","inqueritos"],["#/perfis","Perfis","☺","perfis"]],cnt={};D.posts.forEach(x=>x.passos.forEach(s=>cnt[s.a]=(cnt[s.a]||0)+1));
 return html`<div className="app"><nav className="left"><a className="logo" href="#/"><img src="logo.png" alt="The Xandão-Files"/><span> The Xandão-Files</span></a>${nav.map(([l,t,i,k])=>html`<a key=${l} className=${"item"+((r||"")==k||(r=="perfil"&&k=="perfis")? " on":(["inquerito","caso"].includes(r)&&k=="inqueritos"?" on":""))} href=${l}>${i} <span>${t}</span></a>`)}<a className="pill" href="#/inqueritos">Ver inquéritos</a></nav>
 <main>${v}</main>
 <aside><div className="card"><h3>Inquéritos</h3><p>Instaurado em 14/03/2019, por determinação da Presidência do STF, para investigar a disseminação de notícias fraudulentas, ameaças, denunciações caluniosas e ataques à Corte e a seus integrantes.</p><p><strong>Status:</strong> Arquivado em 09/11/2026, por decisão do ministro Edson Fachin.</p><p><strong>Desdobramentos:</strong> A investigação deu origem a diversos procedimentos autônomos no STF, incluindo os Inquéritos 4.828, 4.874, 4.878, 4.879, 4.888, 4.918, 4.919, 4.920, 4.921, 4.922, 4.923, 4.929 e 4.930.</p><p>O arquivamento do inquérito principal não encerra automaticamente os procedimentos derivados, nem invalida ações penais, provas, decisões ou condenações já existentes. Cada procedimento possui tramitação e situação processual próprias.</p><a className="case-more" href="#/inqueritos">Ver inquéritos relacionados <span>›</span></a></div><div className="card"><h3>Quem decidiu</h3>${D.profiles.filter(p=>p.kind=="auth").map(p=>html`<a key=${p.id} className="pl s" href=${"#/perfil/"+p.id}><${Av} p=${p}/><div><div className="nm">${p.name}</div><div className="meta">${cnt[p.id]||0} andamento${(cnt[p.id]||0)==1?"":"s"}</div></div></a>`)}<p className="note">Perfis das autoridades são ilustrativos, não são contas reais.</p></div></aside></div>
 <div className="bn">${nav.map(([l,t])=>html`<a key=${l} href=${l}>${t.split(" ")[0]}</a>`)}</div>
 <div className="disc">Conteúdo reúne informações públicas e itens marcados como não verificados quando não há fonte documental fornecida. Ferramenta de transparência e arquivo histórico. Não afiliada ao X nem ao STF.</div>`}
ReactDOM.createRoot(document.getElementById("root")).render(html`<${App}/>`);
const loadingScreen=document.getElementById("loading-screen");
if(loadingScreen)window.setTimeout(()=>loadingScreen.classList.add("is-hidden"),900);
