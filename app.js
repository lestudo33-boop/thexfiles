const {useState,useEffect,useMemo}=React,html=htm.bind(React.createElement),D=window.DATA;
const B=Object.fromEntries(D.profiles.map(p=>[p.id,p]));
const M={busca:"Busca e apreensão",prisao:"Prisão",bloqueio:"Bloqueio de perfil",investigado:"Investigação",arquivamento:"Arquivamento",decisao:"Decisão"};
const TABS=[["","Todos"],["prisao","Prisões"],["bloqueio","Bloqueios"],["busca","Buscas"],["arquivamento","Arquivamentos"]];
const I={r:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',t:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',l:'<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/>',s:'<path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',b:'<path d="M15 18l-6-6 6-6"/>',c:'<path d="M6 9l6 6 6-6"/>'};
const Ic=({n})=>html`<svg viewBox="0 0 24 24" dangerouslySetInnerHTML=${{__html:I[n]}}/>`;
const fmt=d=>d.length==4?d:d.length==7?new Date(d+"-15T12:00").toLocaleDateString("pt-BR",{month:"short",year:"numeric"}):new Date(d+"T12:00").toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"});
const Av=({p,lg})=>p.foto?html`<img className=${"av"+(lg?" lg":"")} src=${p.foto} alt=${p.name}/>`:html`<div className=${"av"+(lg?" lg":"")} style=${{background:p.color}}>${p.name[0]}</div>`;
const Src=({x})=>html`<div className="src">${x.c?html`<b className="chk">Conferir na decisão original · </b>`:""}Fonte: ${x.u||x.url?html`<a href=${x.u||x.url} target="_blank" rel="noopener" onClick=${e=>e.stopPropagation()}>${x.f||x.fonte}</a>`:(x.f||x.fonte)}</div>`;
const Name=({p,meta})=>html`<div className="line"><a className="nm" href=${"#/perfil/"+p.id} onClick=${e=>e.stopPropagation()}>${p.name}</a>${p.kind=="auth"&&html`<span className="badge" title="Autoridade que decidiu">⚖</span>`}<span className="hd">@${p.handle}</span><span className="meta">· ${meta}</span></div>`;
function Step({s,root,last}){const p=B[s.a];return html`<div className="step"><div className="rail"><${Av} p=${p}/>${!last&&html`<i/>`}</div><div className="sb"><${Name} p=${p} meta=${fmt(s.d)}/><div className="role">Respondendo a <span className="lnk">@${B[root].handle}</span> · ${p.role}</div><div className="txt">${s.t}</div>${s.k&&html`<span className=${"tag "+s.k}>${M[s.k]}</span>`}<${Src} x=${s}/></div></div>`}
function Post({x,open,toggle,liked,like,detail}){const p=B[x.user],n=x.passos.length,[cp,setCp]=useState(false);
 const key=e=>{if(e.key=="Enter"||e.key==" "){e.preventDefault();toggle()}};
 const share=e=>{e.stopPropagation();const u=location.href.split("#")[0]+"#/p/"+x.id;navigator.clipboard&&navigator.clipboard.writeText(u).catch(()=>{});setCp(true);setTimeout(()=>setCp(false),1500)};
 return html`<article className=${"post"+(open?" open":"")} id=${"p-"+x.id}>
 ${x.pinned&&html`<div className="pin">📌 Processo fixado</div>`}
 <div className="main" role="button" tabIndex="0" aria-expanded=${open} onClick=${toggle} onKeyDown=${key}>
  <div className="rail"><${Av} p=${p}/>${open&&html`<i/>`}</div>
  <div className="sb"><${Name} p=${p} meta=${fmt(x.date)}/>
   <div className="txt">${x.texto}</div>
   <span className=${"tag "+x.medida}>${M[x.medida]}</span><${Src} x=${x}/>
   <div className="acts" onClick=${e=>e.stopPropagation()}>
    <button className=${"ab r"+(open?" on":"")} onClick=${toggle} aria-label="Andamentos"><${Ic} n="r"/>${n} andamento${n>1?"s":""}<span className=${"chev"+(open?" up":"")}><${Ic} n="c"/></span></button>
    <button className="ab t" onClick=${share} aria-label="Copiar link"><${Ic} n="s"/>${cp?"Link copiado":""}</button>
    <button className=${"ab l"+(liked?" on":"")} onClick=${like} aria-label="Curtir"><${Ic} n="l"/></button>
    ${!detail&&html`<a className="ab open" href=${"#/p/"+x.id}>Abrir processo</a>`}
   </div></div></div>
 ${open&&html`<div className="thread">${x.passos.map((s,i)=>html`<${Step} key=${i} s=${s} root=${x.user} last=${i==x.passos.length-1}/>`)}</div>`}
 </article>`}
const Head=({t,sub,back,children})=>html`<div className="top">${back&&html`<a className="back" href="#/" aria-label="Voltar"><${Ic} n="b"/></a>`}<div className="tt"><h1>${t}</h1>${sub&&html`<small>${sub}</small>`}</div>${children}</div>`;
const years=[...new Set(D.posts.flatMap(x=>[x.date,...x.passos.map(s=>s.d)].map(d=>d.slice(0,4))))].sort();
function useFeed(){const [open,setOpen]=useState({inq:false}),[liked,setL]=useState({});
 return {open,liked,toggle:id=>setOpen(o=>({...o,[id]:!o[id]})),like:id=>setL(l=>({...l,[id]:!l[id]}))}}
function Home({feed}){const [F,setF]=useState({q:"",k:"",u:"",y:""}),set=(k,v)=>setF(f=>({...f,[k]:v})),q=F.q.toLowerCase();
 const list=useMemo(()=>D.posts.filter(x=>(!F.k||x.medida==F.k||x.passos.some(s=>s.k==F.k))&&(!F.u||x.user==F.u)&&(!F.y||x.date.startsWith(F.y)||x.passos.some(s=>s.d.startsWith(F.y)))&&(!q||(x.texto+B[x.user].name+x.passos.map(s=>s.t+B[s.a].name).join(" ")).toLowerCase().includes(q))).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date.localeCompare(a.date)),[F]);
 const filtering=F.k||F.u||F.y||F.q;
 return html`<${React.Fragment}><${Head} t="Processos" sub="Inquérito 4.781 · toque em um processo para ver os andamentos"><div className="tabs">${TABS.map(([k,l])=>html`<button key=${k} className=${F.k==k?"on":""} onClick=${()=>set("k",k)}>${l}<i/></button>`)}</div>
 <div className="filters"><input placeholder="Buscar processos, pessoas, decisões" value=${F.q} onChange=${e=>set("q",e.target.value)}/><select value=${F.u} onChange=${e=>set("u",e.target.value)}><option value="">Pessoa</option>${D.profiles.filter(p=>p.kind=="inv").map(p=>html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}</select><select value=${F.y} onChange=${e=>set("y",e.target.value)}><option value="">Ano</option>${years.map(y=>html`<option key=${y}>${y}</option>`)}</select></div><//>
 ${list.filter(x=>!(x.pinned&&filtering)).map(x=>html`<${Post} key=${x.id} x=${x} open=${!!feed.open[x.id]} toggle=${()=>feed.toggle(x.id)} liked=${feed.liked[x.id]} like=${()=>feed.like(x.id)}/>`)}
 ${!list.length&&html`<div className="empty">Nenhum processo encontrado.</div>`}<//>`}
function Detail({id,feed}){const x=D.posts.find(p=>p.id==id);useEffect(()=>{if(x&&!feed.open[id])feed.toggle(id)},[id]);
 if(!x)return html`<${Head} t="Processo" back=${1}/><div className="empty">Processo não encontrado.</div>`;
 return html`<${Head} t="Processo" sub=${B[x.user].name} back=${1}/><${Post} x=${x} open=${true} toggle=${()=>{}} liked=${feed.liked[id]} like=${()=>feed.like(id)} detail=${true}/>`}
function Inq({feed}){const x=D.posts[0];useEffect(()=>{if(!feed.open.inq)feed.toggle("inq")},[]);
 return html`<${Head} t="Inquérito 4.781" sub="Inquérito das Fake News" back=${1}/><div className="grid">${D.numbers.map(n=>html`<div key=${n[0]}><b>${n[0]}</b><span>${n[1]}</span></div>`)}</div><${Post} x=${x} open=${true} toggle=${()=>{}} detail=${true}/><div className="empty small">O número de "mais de 1.600 ações penais" não foi confirmado em fontes consultadas e não é exibido.</div>`}
const Row=({p})=>html`<a className="pl" href=${"#/perfil/"+p.id}><${Av} p=${p}/><div><${Name} p=${p} meta=${""}/><div className="meta">${p.kind=="auth"?p.role:p.status}</div></div></a>`;
const Perfis=()=>html`<${Head} t="Perfis"/><h2 className="sec">Investigados</h2>${D.profiles.filter(p=>p.kind=="inv").map(p=>html`<${Row} key=${p.id} p=${p}/>`)}<h2 className="sec">Quem decidiu</h2>${D.profiles.filter(p=>p.kind=="auth").map(p=>html`<${Row} key=${p.id} p=${p}/>`)}`;
const CT={condenado:"Condenado",apurado:"Em apuração",arquivado:"Arquivado",reu:"Réu"};
const cnt=(l,k)=>l.filter(s=>s.k==k).length;
function Perfil({id,feed}){const p=B[id],[tab,setTab]=useState(""),[o,setO]=useState({});if(!p)return html`<${Home} feed=${feed}/>`;
 const au=p.kind=="auth",mine=D.posts.filter(x=>x.user==id),
 acts=D.posts.flatMap(x=>x.passos.map(s=>({...s,x}))).filter(s=>s.a==id).sort((a,b)=>b.d.localeCompare(a.d)),
 steps=mine.flatMap(x=>x.passos.map(s=>({...s,x}))).sort((a,b)=>b.d.localeCompare(a.d)),L=au?acts:steps;
 const stats=au?[[acts.length,"andamentos"],[new Set(acts.map(s=>s.x.id)).size,"processos"],[cnt(acts,"prisao"),"prisões"],[cnt(acts,"bloqueio"),"bloqueios"],[cnt(acts,"busca"),"buscas"]]:[[mine.length,"processos"],[steps.length,"andamentos"],[cnt(steps,"prisao"),"prisões"],[cnt(steps,"bloqueio"),"bloqueios"],[cnt(steps,"busca"),"buscas"]];
 const tabs=au?[["","Andamentos"],["prisao","Prisões"],["bloqueio","Bloqueios"],["busca","Buscas"]]:[["","Processos"],["m","Medidas"]];
 const flat=au||tab=="m",shown=L.filter(s=>!au?true:!tab||s.k==tab);
 return html`<${Head} t=${p.name} sub=${au?acts.length+" andamento"+(acts.length==1?"":"s")+" neste arquivo":mine.length+" processo"+(mine.length==1?"":"s")} back=${1}/><div className="banner" style=${{background:p.color+"33"}}/>
 <div className="ph"><div className="prow"><${Av} p=${p} lg=${1}/><button className="pbtn" onClick=${()=>navigator.clipboard&&navigator.clipboard.writeText(location.href).catch(()=>{})}>Copiar link</button></div>
 <h2>${p.name}${au&&html`<span className="badge">⚖</span>`}</h2><div className="hd">@${p.handle}</div><p>${p.bio}</p>${(p.since||p.status)&&html`<div className="stat">${au?p.since:html`<span><b>Status:</b> ${p.status}</span>`}</div>`}
 ${p.crime&&html`<div className="crime"><div className="ch"><b>Crime / imputação</b><span className=${"tag ct "+p.crimeTipo}>${CT[p.crimeTipo]}</span></div><div>${p.crime}</div></div>`}
 <div className="stats">${stats.map(([n,l])=>html`<span key=${l}><b>${n}</b> ${l}</span>`)}</div><div className="meta">Contagens consideram só os registros deste arquivo, não o total de decisões da pessoa.</div></div>
 <div className="ptabs">${tabs.map(([k,l])=>html`<button key=${k} className=${tab==k?"on":""} onClick=${()=>setTab(k)}>${l}<i/></button>`)}</div>
 ${flat?shown.map((s,i)=>html`<a key=${i} className="act" href=${"#/p/"+s.x.id}><div className="meta">${au?"Em resposta a @"+B[s.x.user].handle:B[s.a].name} · ${fmt(s.d)}</div><div className="txt">${s.t}</div>${s.k&&html`<span className=${"tag "+s.k}>${M[s.k]}</span>`}</a>`):mine.map(x=>html`<${Post} key=${x.id} x=${x} open=${o[x.id]!==false} toggle=${()=>setO(v=>({...v,[x.id]:v[x.id]===false}))} liked=${feed.liked[x.id]} like=${()=>feed.like(x.id)}/>`)}
 ${!shown.length&&html`<div className="empty">Nada nesta aba.</div>`}`}
function App(){const feed=useFeed(),[h,setH]=useState(location.hash);useEffect(()=>{const f=()=>{setH(location.hash);scrollTo(0,0)};addEventListener("hashchange",f);return()=>removeEventListener("hashchange",f)},[]);
 const [r,a]=h.replace("#/","").split("/");let v;
 if(r=="p")v=html`<${Detail} id=${a} feed=${feed}/>`;else if(r=="inquerito")v=html`<${Inq} feed=${feed}/>`;else if(r=="perfis")v=html`<${Perfis}/>`;else if(r=="perfil")v=html`<${Perfil} id=${a} feed=${feed}/>`;else v=html`<${Home} feed=${feed}/>`;
 const nav=[["#/","Início","⌂",""],["#/inquerito","Inquérito 4.781","⚖","inquerito"],["#/perfis","Perfis","☺","perfis"]],cnt={};D.posts.forEach(x=>x.passos.forEach(s=>cnt[s.a]=(cnt[s.a]||0)+1));
 return html`<div className="app"><nav className="left"><a className="logo" href="#/"><img src="logo.png" alt="The Xandão-Files"/><span> The Xandão-Files</span></a>${nav.map(([l,t,i,k])=>html`<a key=${l} className=${"item"+((r||"")==k||(r=="perfil"&&k=="perfis")?" on":"")} href=${l}>${i} <span>${t}</span></a>`)}<a className="pill" href="#/inquerito">Linha do tempo</a></nav>
 <main>${v}</main>
 <aside><div className="card"><h3>Inquérito 4.781</h3><p>Aberto em março/2019. Arquivado por Fachin em 09/11/2026.</p><p>O arquivamento não anula condenações nem ações penais em curso (Gazeta do Povo).</p></div><div className="card"><h3>Quem decidiu</h3>${D.profiles.filter(p=>p.kind=="auth").map(p=>html`<a key=${p.id} className="pl s" href=${"#/perfil/"+p.id}><${Av} p=${p}/><div><div className="nm">${p.name}</div><div className="meta">${cnt[p.id]||0} andamento${(cnt[p.id]||0)==1?"":"s"}</div></div></a>`)}<p className="note">Perfis das autoridades são ilustrativos, não são contas reais.</p></div></aside></div>
 <div className="bn">${nav.map(([l,t])=>html`<a key=${l} href=${l}>${t.split(" ")[0]}</a>`)}</div>
 <div className="disc">Conteúdo baseado exclusivamente em informações públicas e decisões judiciais. Ferramenta de transparência e arquivo histórico. Não afiliada ao X nem ao STF.</div>`}
ReactDOM.createRoot(document.getElementById("root")).render(html`<${App}/>`);
