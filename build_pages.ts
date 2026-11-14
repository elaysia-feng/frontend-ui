/**
 * 「页面模板」板块生成器 · TypeScript · 零依赖
 *
 * 运行：node build_pages.ts          （Node >= 22.18 原生类型擦除）
 * 产出：frontend-ui.html 仍是单文件、零依赖，双击即用。
 *
 * 维护：在 DEMOS 里增删整页模板，或改 CATS 增删分类，重新运行即可。
 * 脚本幂等：只替换自己生成的 PT 区块，不动原有 391 个组件卡片。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const TARGET = join(ROOT, "frontend-ui.html");

type Cat = { id: string; name: string; icon: string; desc: string };
type Demo = { id: string; cat: string; name: string; desc: string; tags: string; html: string };

// 所有整页模板共享的基础样式，模板里只写差异化 CSS
const BASE = `*{box-sizing:border-box}html,body{margin:0;padding:0}
body{font-family:Inter,"SF Pro Text","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#17181d;background:#f7f7f5;-webkit-font-smoothing:antialiased;font-feature-settings:"tnum" 1}
a{color:inherit;text-decoration:none}button{font:inherit;cursor:pointer;border:0;background:none;color:inherit}
h1,h2,h3,h4,p{margin:0}ul{margin:0;padding:0;list-style:none}img,svg{display:block}
.row{display:flex;align-items:center}.muted{color:#8a90a0}
::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:#d7dae3;border-radius:9px}
`;

const DOC_HEAD = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>__TITLE__</title><style>__CSS__</style></head><body>__BODY__</body></html>`;

// ---------------------------------------------------------------------------
// 高级感统一处理：低饱和配色 / 收敛圆角 / 减淡阴影 / 克制字重 / 单色图标
// 所有模板在生成时统一过一遍，避免每个页面各写一套"模板味"的重渐变和 emoji
// ---------------------------------------------------------------------------

const EMOJI_MAP: Record<string, string> = {
  "🚀": "◈", "📊": "▦", "🛍️": "◇", "🛍": "◇", "✍️": "✎", "✍": "✎",
  "🛠️": "⌘", "🛠": "⌘", "📱": "▯", "🧩": "◧", "🤖": "◉", "🔒": "▣",
  "🔔": "◌", "👋": "", "✉": "◇", "🔴": "●", "🟡": "●", "🟢": "●",
  "🚚": "▷", "🔥": "◆", "💬": "○", "📍": "⌖", "🔗": "↗", "👁": "◉",
  "📋": "▤", "👍": "◇", "📎": "⌁", "🌐": "◎", "🧠": "◈", "📁": "▣",
  "📄": "▤", "⚠": "△", "📅": "◷", "⏮": "◀", "⏭": "▶", "🎧": "◍",
  "🛒": "▣", "😴": "◐", "☕": "◍", "💰": "◈", "🚇": "▬", "🖥": "▤",
};

/** 彩色 emoji → 单色几何符号；几何/文字符号原样保留。 */
function polishText(s: string): string {
  return s.replace(/\p{Extended_Pictographic}\uFE0F?/gu, (m) =>
    EMOJI_MAP[m] ?? EMOJI_MAP[m.replace(/\uFE0F/g, "")] ?? m);
}

/** hex 降饱和：向自身亮度插值，保住明度层级，去掉高饱和的"塑料感"。 */
function desatHex(hex: string): string {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const k = 0.36;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (l - v) * k)))
    .toString(16).padStart(2, "0");
  return "#" + ch(r) + ch(g) + ch(b);
}

function polishCss(css: string): string {
  let out = css.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m) => desatHex(m));
  // 大圆角收敛到 10-16px（药丸 999px、圆形 50% 保留）
  out = out.replace(/border-radius:([^;}]+)/g, (_m, v: string) => "border-radius:" +
    v.replace(/(\d+(?:\.\d+)?)px/g, (_x: string, n: string) => {
      const num = parseFloat(n);
      return (num >= 14 && num < 100 ? Math.max(10, Math.round(num * 0.68)) : num) + "px";
    }));
  // 阴影统一减淡
  out = out.replace(/box-shadow:([^;}]+)/g, (_m, v: string) => "box-shadow:" +
    v.replace(/rgba\(([^,]+,[^,]+,[^,]+,)\s*([\d.]+)\)/g,
      (_x: string, pre: string, a: string) => `rgba(${pre}${Math.min(parseFloat(a), 0.16).toFixed(2)})`));
  // 字重收敛：900/800 → 700，避免过粗的黑体
  out = out.replace(/font-weight:\s*(800|900)/g, "font-weight:700");
  return out;
}

/** 追加在每个模板末尾：统一排版细节 + 少量定点补丁。 */
const REFINE_CSS = `
/* ---- premium refinement ---- */
body{letter-spacing:.005em;text-rendering:optimizeLegibility}
body h1,body h2,body h3,body h4{font-weight:650;letter-spacing:-.035em}
body h1{letter-spacing:-.045em}
body p,body li,body small,body td,body th{line-height:1.75}
body button{letter-spacing:.012em;transition:background .22s,color .22s,border-color .22s,transform .22s,filter .22s}
body button:hover{filter:brightness(.95)}
body a{transition:opacity .2s}body a:hover{opacity:.72}
body th,body td{border-color:rgba(20,22,28,.07)}
::selection{background:#dcdfea;color:#14161b}
/* 定点：首屏细网格 + 墨色底，替代高饱和大渐变 */
[data-demo="landing-1"] .hero{position:relative;background:radial-gradient(900px 460px at 78% 8%,rgba(133,124,190,.2),transparent 62%),linear-gradient(135deg,#14161d,#1c1d2b 60%,#121319)}
[data-demo="landing-1"] .hero::before,[data-demo="landing-2"] .hero::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:56px 56px}
[data-demo="landing-1"] .hero>*,[data-demo="landing-2"] .hero>*{position:relative;z-index:1}
[data-demo="landing-2"] .hero{position:relative}
[data-demo="landing-3"] h1{font-weight:650;letter-spacing:-.055em}
[data-demo="landing-3"] .work .cover{border:1px solid rgba(30,28,24,.08)}
[data-demo="dashboard-4"] .alert.bad span:first-child{color:#c96a6a}
[data-demo="dashboard-4"] .alert:not(.bad) span:first-child{color:#c2a264}
[data-demo="dashboard-4"] .alert:last-child span:first-child{color:#5fa884}
[data-demo="ecommerce-1"] .gallery .big{border:1px solid rgba(60,44,30,.1)}
[data-demo="content-2"] .art h1{letter-spacing:-.05em}
[data-demo="content-2"] .art p{letter-spacing:.012em}
[data-demo="landing-1"] h1 em{color:#aaa5cc}
[data-demo="mobile-1"] .lyric{margin-top:12px}
[data-demo="mobile-1"] .ctrl{padding:16px 32px}
[data-demo="mobile-1"] .bottom{padding:14px 34px}
`;

/** 注入每个模板的动效样式。缩略图（fx-thumb）自动降级为静态，避免 24 个 iframe 同时跑动画。 */
const MOTION_CSS = `
/* ---- motion layer ---- */
@keyframes fxRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes fxRiseSoft{from{transform:translateY(10px)}to{transform:none}}
.fx-reveal{animation:fxRise .6s cubic-bezier(.22,.68,.2,1) both}
.fx-reveal-soft{animation:fxRiseSoft .5s cubic-bezier(.22,.68,.2,1) both}
.fx-bgdrift{animation:fxBgShift 30s ease-in-out infinite alternate}
@keyframes fxRipple{to{transform:scale(2.7);opacity:0}}
.fx-ripple{position:absolute;border-radius:50%;background:currentColor;opacity:.22;pointer-events:none;transform:scale(0);animation:fxRipple .62s ease-out forwards}
@keyframes fxGridDrift{to{background-position:56px 56px}}
[data-demo="landing-1"] .hero::before,[data-demo="landing-2"] .hero::before{animation:fxGridDrift 22s linear infinite}
@keyframes fxBgShift{0%{background-position:0% 45%}100%{background-position:100% 55%}}
.cover,.balance,.device,.big,.ring,.phone{background-size:170% 170%;animation:fxBgShift 26s ease-in-out infinite alternate}
.fx-cursor{position:fixed;top:0;left:0;width:520px;height:520px;border-radius:50%;pointer-events:none;z-index:90;opacity:0;transition:opacity .45s;background:radial-gradient(circle,rgba(126,130,178,.1),transparent 62%)}
.fx-progress{position:fixed;top:0;left:0;height:2px;width:0;z-index:120;pointer-events:none;background:linear-gradient(90deg,#8b86c8,#4d5478)}
body::after{content:"";position:fixed;inset:0;z-index:95;pointer-events:none;opacity:.026;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.goods,.work,.plan,.card,.mini,.post,.dish,.tx,.item,.svc{transition:translate .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s,border-color .35s,background .35s}
.goods:hover,.work:hover,.plan:hover,.mini:hover{translate:0 -4px}
.goods .pic,.work .pic,.work .cover,.post .pic,.dish .pic{transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.goods:hover .pic,.work:hover .pic,.work:hover .cover,.post:hover .pic,.dish:hover .pic{transform:scale(1.045)}
[data-fx-tilt]{transform:perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .4s cubic-bezier(.2,.7,.2,1)}
button{transition:translate .25s cubic-bezier(.2,.7,.2,1),filter .22s,background .22s,color .22s,border-color .22s}
.tabs>.on,.chips>.on,.pages>.on{color:#3a4160;font-weight:700;background:rgba(90,96,140,.07)}
body .fx-selected{background:rgba(90,96,140,.06);box-shadow:inset 2px 0 0 #6b719c}
.fx-toast{position:fixed;right:22px;bottom:22px;z-index:130;padding:11px 17px;border-radius:9px;background:rgba(24,26,32,.92);color:#fff;font-size:12px;letter-spacing:.02em;box-shadow:0 12px 30px rgba(0,0,0,.18);opacity:0;transform:translateY(10px);transition:opacity .28s,transform .28s;pointer-events:none}
.fx-toast.show{opacity:1;transform:none}
.fx-particles{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.85}
.fx-ring{position:fixed;top:0;left:0;width:30px;height:30px;border:1px solid rgba(96,102,150,.5);border-radius:50%;pointer-events:none;z-index:110;transition:width .22s,height .22s,border-color .22s,opacity .3s;opacity:0}
.fx-ring.on{width:50px;height:50px;border-color:rgba(96,102,150,.82)}
.fx-focus>*{transition:opacity .38s cubic-bezier(.2,.7,.2,1),translate .38s,filter .38s}
.fx-focus>*:not(.fx-focus-item){opacity:.48;translate:0 2px;filter:saturate(.75)}
.fx-focus>.fx-focus-item{translate:0 -6px}
.fx-cardwave>*{animation:fxCardIn .62s cubic-bezier(.22,.68,.2,1) both;animation-delay:calc(var(--fx-i,0)*75ms)}
@keyframes fxCardIn{from{transform:translateY(20px) scale(.975)}to{transform:none}}
body{isolation:isolate}
.fx-thumb:not(.fx-active) .fx-cardwave>*,.fx-thumb:not(.fx-active) .fx-bgdrift,.fx-thumb:not(.fx-active) .cover,.fx-thumb:not(.fx-active) .balance,.fx-thumb:not(.fx-active) .device,.fx-thumb:not(.fx-active) .big,.fx-thumb:not(.fx-active) .ring,.fx-thumb:not(.fx-active) .phone,.fx-thumb:not(.fx-active) .hero::before{animation:none!important}
.fx-thumb:not(.fx-active) body::after{display:none}
.fx-thumb:not(.fx-active) .fx-particles{opacity:.32}
.fx-thumb.fx-active .fx-particles{opacity:1}
.no-motion *, .no-motion *::before, .no-motion *::after{animation-duration:.001ms!important;transition-duration:.001ms!important}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}}
`;

/** 注入每个模板的交互运行时（纯浏览器 JS，零依赖）。 */
const MOTION_JS = `
(function(){
  var root=document.documentElement, body=document.body;
  var mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced=mq.matches;
  var raf=function(fn){return window.requestAnimationFrame?requestAnimationFrame(fn):setTimeout(fn,16)};
  var $$=function(s){return [].slice.call(document.querySelectorAll(s))};

  /* 粒子层：canvas 漂浮点 + 近距连线，深色页更亮 */
  function initParticles(lightMode){
    var cv=document.createElement('canvas');cv.className='fx-particles';body.appendChild(cv);
    var ctx=cv.getContext('2d');
    if(!ctx)return {start:function(){},stop:function(){}};
    var dpr=Math.min(window.devicePixelRatio||1,2),W=0,H=0,pts=[],active=false,full=!lightMode;
    var dark=/^(landing-2|dashboard-4|tools-2|mobile-1|mobile-4)$/.test(body.getAttribute('data-demo')||'');
    function resize(){
      W=innerWidth;H=innerHeight;
      cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var n=full?Math.min(60,Math.max(18,Math.round(W*H/27000))):10;
      pts=[];
      for(var i=0;i<n;i++)pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.34,vy:(Math.random()-.5)*.34,r:Math.random()*2.1+1.2});
    }
    function frame(move){
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){
        var p=pts[i];
        if(move){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r*2.5,0,6.2832);
        ctx.fillStyle=dark?'rgba(186,201,246,.1)':'rgba(96,105,152,.07)';ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.2832);
        ctx.fillStyle=dark?'rgba(186,201,246,.8)':'rgba(96,105,152,.5)';ctx.fill();
        if(!full||i>12)continue;
        for(var j=i+1;j<pts.length;j++){
          var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d2=dx*dx+dy*dy;
          if(d2>19000)continue;
          var a=(1-d2/19000)*(dark?0.26:0.17);
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
          ctx.strokeStyle=dark?'rgba(150,170,220,'+a.toFixed(3)+')':'rgba(104,112,156,'+a.toFixed(3)+')';
          ctx.lineWidth=.6;ctx.stroke();
        }
      }
    }
    resize();frame(false);
    addEventListener('resize',function(){resize();frame(false);},{passive:true});
    function loop(){if(!active)return;if(!document.hidden)frame(true);setTimeout(loop,40);}
    return {
      start:function(){if(active)return;if(!full){full=true;resize();}active=true;setTimeout(loop,40);},
      stop:function(){active=false;frame(false);}
    };
  }
  /* 多卡片：整组错落入场 */
  function cardWave(){
    $$('.grid,.cards,.works,.plans,.kpis,.stats,.cols,.grid3,.grid2,.board').forEach(function(g){
      var kids=[].slice.call(g.children);
      if(kids.length<2||kids.length>14)return;
      g.classList.add('fx-cardwave');
      kids.forEach(function(k,i){k.style.setProperty('--fx-i',i);});
    });
  }

  /* 缩略图 iframe 带 scale(.25)：默认静置；hover 时由外层注入 fx-active 再激活动效 */
  var light=false;
  try{var fe=window.frameElement;var tr=fe?getComputedStyle(fe).transform:'';if(tr&&tr!=='none'&&/matrix\\(0?\\.25/.test(tr))light=true;}catch(e){}
  if(light){
    root.classList.add('fx-thumb');
    var pc=null;cardWave();
    if(window.MutationObserver){
      new MutationObserver(function(){
        if(root.classList.contains('fx-active')){
          if(!pc)pc=initParticles(false);
          pc.start();
        }else if(pc)pc.stop();
      }).observe(root,{attributes:true,attributeFilter:['class']});
    }
    return;
  }
  if(reduced)root.classList.add('no-motion');
  cardWave();
  function toast(msg){
    var t=document.getElementById('fx-toast');
    if(!t){t=document.createElement('div');t.id='fx-toast';t.className='fx-toast';body.appendChild(t);}
    t.textContent=msg;t.classList.add('show');
    clearTimeout(t._tm);t._tm=setTimeout(function(){t.classList.remove('show');},1500);
  }

  /* 1. 滚动入场 + 指标数字递增 */
  function countUp(scope){
    [].slice.call(scope.querySelectorAll('b')).forEach(function(b){
      if(b.children.length||b.dataset.fxCount)return;
      var raw=b.textContent.trim(),m=raw.match(/^([^\\d]*)([\\d,]+(?:\\.\\d+)?)(.*)$/);
      if(!m||m[3].indexOf('/')>=0)return;
      var num=parseFloat(m[2].replace(/,/g,''));
      if(!isFinite(num)||num<2||raw.length>18)return;
      b.dataset.fxCount='1';
      var pre=m[1],post=m[3],dec=(m[2].split('.')[1]||'').length,t0=performance.now(),dur=760,done=false;
      setTimeout(function(){done=true;b.textContent=raw;},1500);
      (function step(t){
        if(done)return;
        var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3),v=(num*e).toFixed(dec),parts=v.split('.');
        parts[0]=parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');
        b.textContent=pre+parts.join('.')+post;
        if(p<1)raf(step);else{done=true;b.textContent=raw;}
      })(t0);
    });
  }
  var revealSel='section,article,.card,.kpi,.stat,.plan,.work,.goods,.post,.panel,.col,.mini,.dish,.tx,.svc,.alert,.comment,.feature,.hero,.head,.intro,.ring,.chart,.rank,.about>div,.metrics>div';
  var reveal=$$(revealSel).filter(function(el){
    return el.getBoundingClientRect().height>20 && !(el.parentElement&&el.parentElement.closest(revealSel));
  });
  if('IntersectionObserver' in window&&!reduced){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en,i){
        if(!en.isIntersecting)return;
        var first=en.boundingClientRect.top<innerHeight*0.85;
        en.target.style.animationDelay=(first?0:Math.min(i,7)*45)+'ms';
        en.target.classList.add(first?'fx-reveal-soft':'fx-reveal');
        io.unobserve(en.target);
        countUp(en.target);
      });
    },{threshold:.06,rootMargin:'0px 0px -5% 0px'});
    reveal.forEach(function(el){io.observe(el);});
  }

  /* 2. 背景：叠加两层极淡光斑并缓慢漂移，保留模板原背景 */
  if(!reduced){
    try{
      var bi=getComputedStyle(body).backgroundImage;
      var extra='radial-gradient(60% 50% at 18% 12%,rgba(126,132,178,.09),transparent 70%),radial-gradient(55% 55% at 82% 78%,rgba(150,142,172,.07),transparent 70%)';
      body.style.backgroundImage=(bi&&bi!=='none')?extra+','+bi:extra;
      body.style.backgroundSize='160% 160%';
      body.style.backgroundAttachment='fixed';
      body.classList.add('fx-bgdrift');
    }catch(e){}
  }

  /* 3. 粒子 + 鼠标跟随光晕 + 光标环 */
  var pctrl=initParticles(false);
  if(!reduced)pctrl.start();
  var cursor=document.createElement('div');cursor.className='fx-cursor';body.appendChild(cursor);
  var ring=document.createElement('div');ring.className='fx-ring';body.appendChild(ring);
  var cx=innerWidth/2,cy=innerHeight/2,tx=cx,ty=cy;
  document.addEventListener('mousemove',function(e){
    tx=e.clientX;ty=e.clientY;cursor.style.opacity='1';ring.style.opacity='1';
    ring.style.transform='translate3d('+(tx-15)+'px,'+(ty-15)+'px,0)';
    var t=e.target instanceof Element?e.target.closest('button,a,[role=button],.card,.goods,.work,.plan'):null;
    ring.classList.toggle('on',!!t);
  },{passive:true});
  document.addEventListener('mouseleave',function(){cursor.style.opacity='0';ring.style.opacity='0';});
  if(!reduced)(function loop(){cx+=(tx-cx)*.11;cy+=(ty-cy)*.11;cursor.style.transform='translate3d('+(cx-260)+'px,'+(cy-260)+'px,0)';raf(loop);})();
  else cursor.style.display='none';

  /* 多卡片联动：hover 一张，同组其它卡片退让 */
  $$('.goods,.work,.plan,.post,.card,.kpi,.stat,.mini,.dish,.tx,.svc').forEach(function(el){
    var p=el.parentElement;
    if(!p||p.children.length<2||p.children.length>12)return;
    el.addEventListener('mouseenter',function(){p.classList.add('fx-focus');el.classList.add('fx-focus-item');});
    el.addEventListener('mouseleave',function(){p.classList.remove('fx-focus');el.classList.remove('fx-focus-item');});
  });

  /* 4. 磁吸按钮 + 点击涟漪 */
  $$('button,.btn,.primary,.add,.buy,.submit').forEach(function(el){
    el.addEventListener('mousemove',function(e){
      var r=el.getBoundingClientRect();
      el.style.translate=(((e.clientX-r.left-r.width/2)/r.width)*10).toFixed(1)+'px '+(((e.clientY-r.top-r.height/2)/r.height)*6).toFixed(1)+'px';
    },{passive:true});
    el.addEventListener('mouseleave',function(){el.style.translate='0 0';});
  });
  document.addEventListener('click',function(e){
    var el=e.target instanceof Element?e.target.closest('button,.btn,[role=button],a'):null;
    if(!el)return;
    if(el.tagName==='BUTTON'||el.classList.contains('btn')){
      var r=el.getBoundingClientRect(),size=Math.max(r.width,r.height)*1.5;
      var s=document.createElement('span');s.className='fx-ripple';
      s.style.width=s.style.height=size+'px';
      s.style.left=(e.clientX-r.left-size/2)+'px';s.style.top=(e.clientY-r.top-size/2)+'px';
      var pos=getComputedStyle(el).position;
      if(pos==='static')el.style.position='relative';
      el.style.overflow='hidden';el.appendChild(s);
      setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s);},640);
    }
  },true);

  /* 4. 选项互斥 / 行选中 / 无处理器按钮的点击反馈 */
  var groupSel='.tabs,.opts,.cats,.chips,.pages,.pay,.switch,.addr,.side';
  var rowSel='.item,.dish,.tx,.post,.svc,.comment,.work,.goods';
  document.addEventListener('click',function(e){
    if(!(e.target instanceof Element))return;
    var el=e.target;
    var group=el.parentElement;
    var inGroup=!!(group&&group.matches(groupSel));
    if(inGroup&&!el.hasAttribute('onclick')){
      [].slice.call(group.children).forEach(function(p){p.classList.remove('on','active');});
      el.classList.add('on');
      return;
    }
    var row=el.closest(rowSel);
    if(row&&!el.hasAttribute('onclick')){
      var peers=$$('.fx-selected');peers.forEach(function(p){if(p!==row)p.classList.remove('fx-selected');});
      row.classList.toggle('fx-selected');return;
    }
    var btn=el.closest('button');
    if(btn&&!btn.hasAttribute('onclick')&&!inGroup&&!row){
      var label=(btn.textContent||'').trim().replace(/\\s+/g,' ').slice(0,16);
      if(label&&!/^[\\d\\s]+$/.test(label))toast('已触发 · '+label);
    }
  });

  /* 5. 搜索框实时筛选（只作用于明确的内容卡片，用透明度避免布局跳动） */
  $$('input').forEach(function(inp){
    if(!/搜索|搜一搜|search/i.test(inp.placeholder||''))return;
    inp.addEventListener('input',function(){
      var q=inp.value.trim().toLowerCase();
      var cards=$$('.goods,.post,.dish,.work,.item,.tx,.svc,.plan,.mini,tr');
      cards=cards.filter(function(c){return c.tagName!=='TR'||!c.querySelector('th');});
      cards.forEach(function(c){
        c.style.opacity=(!q||(c.textContent||'').toLowerCase().indexOf(q)>=0)?'1':'.22';
      });
      toast(q?'筛选 · '+q:'已清空筛选');
    });
  });

  /* 6. 3D 倾斜 */
  $$('.work .cover,.goods .pic,.balance,.ring,.phone,.gallery .big').forEach(function(el){
    if(getComputedStyle(el).transform!=='none'&&!el.style.transform)return;
    el.setAttribute('data-fx-tilt','');
    el.addEventListener('mousemove',function(e){
      var r=el.getBoundingClientRect();
      el.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*10).toFixed(2)+'deg');
      el.style.setProperty('--rx',(((.5-(e.clientY-r.top)/r.height)*10)).toFixed(2)+'deg');
    },{passive:true});
    el.addEventListener('mouseleave',function(){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');});
  });

  /* 7. 滚动进度 */
  var bar=document.createElement('div');bar.className='fx-progress';body.appendChild(bar);
  addEventListener('scroll',function(){
    var max=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(max>0?(scrollY/max*100):0)+'%';
  },{passive:true});
})();
`;

function tpl(title: string, css: string, body: string): string {
  return DOC_HEAD.replace("__TITLE__", title)
    .replace("__CSS__", BASE + polishCss(css) + REFINE_CSS + MOTION_CSS)
    .replace("__BODY__", polishText(body) + "\n<script>" + MOTION_JS + "</script>");
}

const CATS: Cat[] = [
  { id: "landing", name: "落地页", icon: "◈", desc: "营销官网、产品发布、作品集、定价页 —— 首屏说服力与转化路径" },
  { id: "dashboard", name: "后台仪表盘", icon: "▦", desc: "数据总览、订单管理、客户管理、监控大屏 —— 高密度信息布局" },
  { id: "ecommerce", name: "电商", icon: "◇", desc: "商品详情、购物车结算、商品列表、物流跟踪 —— 完整下单链路" },
  { id: "content", name: "内容社区", icon: "✎", desc: "资讯首页、文章阅读、话题社区、个人主页 —— 阅读与互动体验" },
  { id: "tools", name: "工具应用", icon: "⌘", desc: "AI 工作台、代码编辑器、项目看板、团队日历 —— 生产力工具界面" },
  { id: "mobile", name: "移动端 App", icon: "▯", desc: "音乐、点餐、健康、钱包 —— 手机视口内的原生感设计" },
];

const DEMOS: Demo[] = [];

function add(cid: string, name: string, desc: string, tags: string, title: string, css: string, body: string): void {
  const seq = DEMOS.filter((d: Demo) => d.cat === cid).length + 1;
  const id = `${cid}-${seq}`;
  const html = tpl(title, css, body).replace("<body>", `<body data-demo="${id}" data-cat="${cid}">`);
  DEMOS.push({ id, cat: cid, name, desc, tags, html });
}

// ============ 1. 落地页 ============
add("landing", "SaaS 产品官网", "深色渐变首屏 + 数据指标 + 功能矩阵，标准 B2B 转化结构",
    "SaaS / 官网 / 转化", "云枢 · 团队协作平台",
    `
body{background:#fff}
.nav{height:72px;padding:0 64px;display:flex;align-items:center;gap:38px;border-bottom:1px solid #eef0f5}
.logo{font-size:20px;font-weight:900;letter-spacing:-1px}.logo i{color:#7c6cff;font-style:normal}
.nav a{font-size:14px;color:#5c6272}.nav .sp{flex:1}.btn{background:#6c5cff;color:#fff;padding:11px 20px;border-radius:10px;font-size:14px;font-weight:700}
.btn.ghost{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45)}
.hero{background:radial-gradient(circle at 78% 18%,#5336c9 0,transparent 42%),linear-gradient(135deg,#171433,#241a55 60%,#12102b);color:#fff;padding:78px 64px 88px;display:grid;grid-template-columns:1fr .9fr;gap:54px;align-items:center}
.pill{display:inline-flex;gap:8px;align-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);padding:7px 14px;border-radius:999px;font-size:12px;color:#d8d2ff}
h1{font-size:58px;line-height:1.12;letter-spacing:-2.5px;margin:22px 0 18px}h1 em{font-style:normal;color:#a99bff}
.sub{color:#c3c0dd;font-size:17px;line-height:1.8;max-width:490px}.acts{display:flex;gap:12px;margin-top:32px}
.trust{margin-top:38px;font-size:12px;color:#9892bd}
.mock{background:#fff;border-radius:20px;padding:20px;color:#17191f;box-shadow:0 34px 70px rgba(0,0,0,.45);transform:rotate(-2deg)}
.mock .bar{display:flex;gap:6px;margin-bottom:18px}.mock .bar i{width:9px;height:9px;border-radius:50%;background:#e6e6f2}
.mock h4{font-size:14px;margin-bottom:14px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.stats div{background:#f5f4ff;border-radius:12px;padding:14px}.stats b{display:block;font-size:22px}.stats span{font-size:11px;color:#8a90a0}
.chart{display:flex;align-items:flex-end;gap:9px;height:104px;margin-top:18px;padding:10px;background:#fafaff;border-radius:12px}
.chart i{flex:1;background:linear-gradient(180deg,#8f7dff,#d9d2ff);border-radius:5px 5px 0 0}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);padding:38px 64px;border-bottom:1px solid #eef0f5}
.metrics b{display:block;font-size:30px;letter-spacing:-1px}.metrics span{font-size:13px;color:#8a90a0}
.features{padding:70px 64px 84px}h2{font-size:34px;letter-spacing:-1.2px;text-align:center;margin-bottom:12px}
.lead{text-align:center;color:#8a90a0;font-size:14px;margin-bottom:42px}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cards article{border:1px solid #eceef4;border-radius:18px;padding:26px}
.cards .ic{width:42px;height:42px;border-radius:12px;background:#f0edff;display:grid;place-items:center;font-size:20px;margin-bottom:18px}
.cards h3{font-size:17px;margin-bottom:9px}.cards p{font-size:13px;color:#8a90a0;line-height:1.8}
.foot{padding:26px 64px;background:#141327;color:#9a97b8;font-size:12px;display:flex;justify-content:space-between}
`,
    `
<nav class="nav"><div class="logo">云<i>枢</i> YUNSHU</div><a>产品</a><a>解决方案</a><a>定价</a><a>文档</a><span class="sp"></span><a>登录</a><button class="btn" onclick="this.textContent='已提交申请 ✓'">免费试用</button></nav>
<section class="hero"><div><span class="pill">✦ 2026 春季版本 · 智能工作流已上线</span>
<h1>让团队协作<br><em>快过一个念头</em></h1>
<p class="sub">把需求、任务、文档和 AI 助手放进同一个工作空间。少开会，多交付，让每个进度都看得见。</p>
<div class="acts"><button class="btn" onclick="this.textContent='欢迎加入 ✓'">免费开始使用</button><button class="btn ghost" onclick="this.textContent='预约已完成 ✓'">预约演示</button></div>
<div class="trust">已服务 12,000+ 团队 · 包括 星海科技、拾光设计、北岸数据</div></div>
<div class="mock"><div class="bar"><i></i><i></i><i></i></div><h4>项目总览 · 本周</h4>
<div class="stats"><div><b>128</b><span>进行中任务</span></div><div><b>94.6%</b><span>按时交付率</span></div><div><b>36</b><span>协作成员</span></div></div>
<div class="chart"><i style="height:42%"></i><i style="height:61%"></i><i style="height:48%"></i><i style="height:76%"></i><i style="height:64%"></i><i style="height:91%"></i><i style="height:72%"></i><i style="height:100%"></i></div></div></section>
<section class="metrics"><div><b>12,000+</b><span>活跃团队</span></div><div><b>4.9 / 5</b><span>用户评分</span></div><div><b>99.98%</b><span>服务可用性</span></div><div><b>42%</b><span>平均效率提升</span></div></section>
<section class="features"><h2>一套工具，覆盖完整工作流</h2><p class="lead">从想法到上线，不再需要来回切换五六个软件</p>
<div class="cards"><article><div class="ic">🧩</div><h3>可视化工作流</h3><p>拖拽编排自动化流程，审批、通知、数据同步一次配置，全团队即时生效。</p></article>
<article><div class="ic">🤖</div><h3>AI 协作助手</h3><p>自动汇总会议纪要、拆解需求、生成周报，让 AI 处理重复劳动。</p></article>
<article><div class="ic">🔒</div><h3>企业级权限</h3><p>细粒度角色与审计日志，支持私有化部署，满足合规要求。</p></article></div></section>
<footer class="foot"><span>© 2026 云枢科技 · 让协作更简单</span><span>隐私政策 · 服务条款 · 联系我们</span></footer>
`)

add("landing", "新品发布活动页", "大字号发布会视觉 + 倒计时 + 卖点矩阵，适合单品营销",
    "发布会 / 营销 / 单页", "AURA 2026 新品发布",
    `
body{background:#0d0d10;color:#fff}
.wrap{max-width:1120px;margin:auto;padding:0 48px}
.nav{height:70px;display:flex;align-items:center;border-bottom:1px solid #26262d;font-size:13px;gap:32px}
.nav b{font-size:19px;letter-spacing:3px}.nav .sp{flex:1}.nav button{border:1px solid #3a3a44;padding:9px 18px;border-radius:999px;font-size:12px}
.hero{text-align:center;padding:74px 0 46px;background:radial-gradient(circle at 50% 22%,rgba(255,122,54,.25),transparent 48%)}
.kicker{color:#ff9a5c;font-size:13px;letter-spacing:5px;font-weight:700}
h1{font-size:106px;letter-spacing:-7px;line-height:1;margin:18px 0 6px;background:linear-gradient(180deg,#fff,#8c8c96);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:#a5a5b0;font-size:17px}.price{margin:22px 0 26px;font-size:15px;color:#d8d8df}.price b{font-size:28px;color:#ff9a5c}
.count{display:flex;gap:10px;justify-content:center;margin-bottom:28px}
.count div{background:#1a1a21;border:1px solid #2e2e38;border-radius:12px;padding:12px 18px;min-width:74px}
.count b{display:block;font-size:26px}.count span{font-size:10px;color:#8b8b96}
.cta{background:#ff7a36;color:#160c05;font-weight:800;padding:15px 42px;border-radius:999px;font-size:15px}
.device{width:520px;height:280px;margin:52px auto 0;border-radius:36px 36px 0 0;border:8px solid #2a2a33;border-bottom:0;background:radial-gradient(circle at 30% 30%,#ffb36b,#ff5a36 45%,#7b1d5c 100%);box-shadow:0 -20px 90px rgba(255,110,50,.28);position:relative;overflow:hidden}
.device::after{content:"AURA";position:absolute;inset:0;display:grid;place-items:center;font-size:74px;font-weight:900;letter-spacing:12px;color:rgba(255,255,255,.82)}
.specs{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#26262d;margin-top:0;border:1px solid #26262d;border-radius:18px;overflow:hidden}
.specs div{background:#141418;padding:28px 22px}.specs b{display:block;font-size:30px;color:#ff9a5c;margin-bottom:8px}.specs span{font-size:12px;color:#92929d}
.features{padding:80px 0}.features h2{font-size:38px;letter-spacing:-1.5px}.features>p{color:#92929d;margin-top:10px;font-size:14px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px}
.grid3 article{background:#17171d;border:1px solid #282830;border-radius:18px;padding:26px;min-height:170px}
.grid3 em{font-style:normal;font-size:26px}.grid3 h3{font-size:17px;margin:16px 0 9px}.grid3 p{font-size:13px;color:#92929d;line-height:1.8}
.foot{border-top:1px solid #26262d;padding:26px 0 40px;color:#6f6f7a;font-size:12px;display:flex;justify-content:space-between}
`,
    `
<div class="wrap"><nav class="nav"><b>AURA</b><span>产品</span><span>技术规格</span><span>媒体资料</span><span class="sp"></span><button onclick="this.textContent='已加入日历 ✓'">发布会提醒</button></nav>
<section class="hero"><div class="kicker">2026 · 全新一代</div><h1>AURA</h1>
<p class="sub">把整片星空，装进一块屏幕</p><div class="price">首发价 <b>¥4,999</b> 起 · 11 月 18 日 20:00 开售</div>
<div class="count"><div><b>07</b><span>天</span></div><div><b>12</b><span>时</span></div><div><b>36</b><span>分</span></div><div><b>08</b><span>秒</span></div></div>
<button class="cta" onclick="this.textContent='预约成功，开售前会提醒你 ✓'">立即预约</button>
<div class="device"></div></section></div>
<div class="wrap"><section class="specs"><div><b>6.8"</b><span>2K 柔性光屏</span></div><div><b>120Hz</b><span>自适应刷新</span></div><div><b>48h</b><span>续航时间</span></div><div><b>168g</b><span>整机重量</span></div></section>
<section class="features"><h2>每一处，都重新想过</h2><p>不是堆料，是让技术安静地服务于你</p>
<div class="grid3"><article><em>◉</em><h3>自研光感引擎</h3><p>根据环境光逐像素调节色温，长时间阅读也不刺眼。</p></article>
<article><em>⌁</em><h3>零延迟交互</h3><p>从触控到反馈仅需 8ms，跟手得像纸上的笔。</p></article>
<article><em>⬡</em><h3>一体化机身</h3><p>航空级铝合金一体成型，无缝、无螺钉、无妥协。</p></article></div></section>
<footer class="foot"><span>© 2026 AURA Lab</span><span>参数以最终量产版为准</span></footer></div>
`)

add("landing", "创作者作品集", "米白极简排版 + 项目网格，适合设计师 / 独立开发者",
    "作品集 / 极简 / 个人站", "林澈 · 设计作品集",
    `
body{background:#faf8f4;color:#1b1a18}
.wrap{max-width:1120px;margin:auto;padding:0 60px}
.nav{height:86px;display:flex;align-items:center;font-size:13px;gap:30px;border-bottom:1px solid #e6e2da}
.nav b{font-size:17px;letter-spacing:2px}.nav .sp{flex:1}.nav .dot{width:8px;height:8px;border-radius:50%;background:#3fae76;display:inline-block;margin-right:7px}
.hero{padding:92px 0 72px;display:grid;grid-template-columns:1.25fr .75fr;gap:60px;align-items:end}
h1{font-size:70px;line-height:1.08;letter-spacing:-4px;font-weight:800}h1 i{font-style:normal;color:#c0b8a8}
.hero p{color:#716c62;font-size:16px;line-height:1.9;max-width:520px;margin-top:26px}
.since{font-size:12px;color:#9a948a;line-height:2.2;border-left:2px solid #d9d2c4;padding-left:20px}
.since b{display:block;font-size:30px;color:#1b1a18;letter-spacing:-1px}
.label{font-size:11px;letter-spacing:3px;color:#a49c8e;text-transform:uppercase;margin-bottom:20px}
.works{display:grid;grid-template-columns:1fr 1fr;gap:26px;padding-bottom:76px}
.work .cover{height:250px;border-radius:6px;position:relative;overflow:hidden;padding:24px;display:flex;align-items:flex-end}
.work:nth-child(1) .cover{background:linear-gradient(135deg,#dfe8dc,#8fb59b)}.work:nth-child(2) .cover{background:linear-gradient(135deg,#f6dcc8,#e39b73)}
.work:nth-child(3) .cover{background:linear-gradient(135deg,#d9dcf2,#7c85c9)}.work:nth-child(4) .cover{background:linear-gradient(135deg,#f2e6b8,#c9a94e)}
.work .cover span{background:rgba(255,255,255,.88);padding:9px 15px;border-radius:999px;font-size:11px;font-weight:700}
.work .cover b{position:absolute;top:26px;left:26px;font-size:44px;letter-spacing:-2px;color:rgba(255,255,255,.75)}
.work h3{font-size:19px;margin:16px 0 6px}.work p{font-size:13px;color:#8c8578}
.contact{border-top:1px solid #e6e2da;padding:54px 0 70px;display:flex;justify-content:space-between;align-items:end}
.contact h2{font-size:40px;letter-spacing:-2px}.contact p{color:#8c8578;font-size:14px;margin-top:12px}
.mail{background:#1b1a18;color:#fff;padding:15px 28px;border-radius:999px;font-size:14px}
`,
    `
<div class="wrap"><nav class="nav"><b>LIN CHE / 林澈</b><span>作品</span><span>关于</span><span>随笔</span><span class="sp"></span><span><i class="dot"></i>目前可接新项目</span></nav>
<section class="hero"><div><h1>设计，是把<br><i>复杂藏起来</i></h1>
<p>独立产品设计师，第 8 年。专注 B 端工具与品牌体验，帮团队把难用的产品变好用。曾服务 云枢、拾光、北岸数据。</p></div>
<div class="since"><b>08</b>年设计经验<br><b>36</b>个上线项目<br><b>04</b>项设计奖项</div></section>
<div class="label">SELECTED WORK / 2023—2026</div>
<section class="works">
<article class="work"><div class="cover"><b>01</b><span>产品设计 · SaaS</span></div><h3>云枢工作台重构</h3><p>把 14 个分散模块收进一套统一设计语言</p></article>
<article class="work"><div class="cover"><b>02</b><span>品牌 · 视觉</span></div><h3>拾光咖啡品牌升级</h3><p>从门店到小程序的完整体验设计</p></article>
<article class="work"><div class="cover"><b>03</b><span>数据可视化</span></div><h3>北岸数据监控台</h3><p>面向运维团队的实时指标体系</p></article>
<article class="work"><div class="cover"><b>04</b><span>移动端 · App</span></div><h3>「潮汐」习惯养成</h3><p>轻量、克制、无打扰的日常记录工具</p></article>
</section>
<section class="contact"><div><h2>有个想法想聊聊？</h2><p>通常在 2 个工作日内回复，欢迎附上项目背景</p></div><button class="mail" onclick="this.textContent='邮箱：hi@linche.design'">查看联系方式 →</button></section></div>
`)

add("landing", "定价方案页", "三档价格卡 + 月付年付切换 + 功能对比表",
    "定价 / 转化 / 表格", "云枢 · 定价方案",
    `
body{background:#fbfbfe;color:#191a22}
.wrap{max-width:1080px;margin:auto;padding:0 48px}
.nav{height:72px;display:flex;align-items:center;gap:32px;font-size:13px;color:#5d6270}
.nav b{font-size:19px;color:#191a22;letter-spacing:-.5px}.nav .sp{flex:1}
.head{text-align:center;padding:66px 0 30px}h1{font-size:46px;letter-spacing:-2.2px}.head p{color:#7d8290;margin-top:14px;font-size:15px}
.switch{display:flex;gap:4px;background:#eeeff5;border-radius:999px;padding:4px;width:fit-content;margin:28px auto 0}
.switch button{padding:9px 22px;border-radius:999px;font-size:13px;color:#6d7280}.switch button.on{background:#fff;color:#191a22;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.switch em{font-style:normal;color:#4aab76;font-size:11px;margin-left:5px}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;align-items:start;margin-top:38px}
.plan{background:#fff;border:1px solid #e9eaf0;border-radius:20px;padding:28px;position:relative}
.plan.hot{border:2px solid #6c5cff;box-shadow:0 18px 44px rgba(108,92,255,.14);transform:translateY(-8px)}
.badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#6c5cff;color:#fff;font-size:11px;padding:5px 14px;border-radius:999px;white-space:nowrap}
.plan h3{font-size:17px}.plan .note{font-size:12px;color:#8a90a0;margin-top:6px;min-height:34px;line-height:1.6}
.amt{font-size:40px;font-weight:800;letter-spacing:-2px;margin:18px 0 4px}.amt span{font-size:13px;font-weight:400;color:#8a90a0;letter-spacing:0}
.plan .cycle{font-size:12px;color:#8a90a0;min-height:18px}
.primary{display:block;width:100%;text-align:center;background:#6c5cff;color:#fff;padding:12px;border-radius:11px;font-size:14px;font-weight:700;margin:22px 0}
.plan:not(.hot) .primary{background:#f0efff;color:#5a4bd6}
.feat{border-top:1px solid #eff0f5;padding-top:18px}.feat li{font-size:13px;color:#4c5160;padding:7px 0 7px 22px;position:relative}
.feat li::before{content:"✓";position:absolute;left:0;color:#4aab76;font-weight:800}
.compare{margin:66px 0 80px}.compare h2{font-size:26px;letter-spacing:-1px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e9eaf0;border-radius:14px;overflow:hidden;font-size:13px}
th,td{padding:14px 20px;text-align:left;border-bottom:1px solid #f0f1f5}th{background:#f7f7fc;color:#7d8290;font-weight:600}td:not(:first-child){text-align:center;color:#4aab76}
.foot{text-align:center;color:#9a9eaa;font-size:12px;padding-bottom:40px}
`,
    `
<div class="wrap"><nav class="nav"><b>云枢 YUNSHU</b><span>产品</span><span>解决方案</span><span>文档</span><span class="sp"></span><span>登录</span></nav>
<section class="head"><h1>选一个刚好够用的方案</h1><p>所有方案均包含 14 天免费试用，无需绑定信用卡</p>
<div class="switch"><button class="on" onclick="tog(this,0)">按月付费</button><button onclick="tog(this,1)">按年付费<em>省 20%</em></button></div></section>
<section class="plans">
<article class="plan"><h3>基础版</h3><p class="note">适合刚起步的小团队，先把协作跑起来</p><div class="amt" data-m="¥0" data-y="¥0">¥0</div><div class="cycle">永久免费</div>
<button class="primary" onclick="this.textContent='已创建工作区 ✓'">免费开始</button>
<ul class="feat"><li>最多 8 位成员</li><li>3 个活跃项目</li><li>基础任务与文档</li><li>社区支持</li></ul></article>
<article class="plan hot"><div class="badge">最受欢迎</div><h3>专业版</h3><p class="note">成长型团队的标准配置，自动化与 AI 全开</p>
<div class="amt" data-m="¥69" data-y="¥55">¥69</div><div class="cycle" data-m="/ 人 / 月" data-y="/ 人 / 月，按年结算">/ 人 / 月</div>
<button class="primary" onclick="this.textContent='试用已开启 ✓'">免费试用 14 天</button>
<ul class="feat"><li>成员数不限</li><li>无限项目与工作流</li><li>AI 助手与自动周报</li><li>高级权限与审计</li><li>优先技术支持</li></ul></article>
<article class="plan"><h3>企业版</h3><p class="note">面向有合规与私有化要求的大型组织</p><div class="amt" data-m="定制" data-y="定制">定制</div><div class="cycle">联系销售获取报价</div>
<button class="primary" onclick="this.textContent='已提交，销售会联系你 ✓'">联系销售</button>
<ul class="feat"><li>包含专业版全部能力</li><li>私有化 / 混合云部署</li><li>SSO 与 SCIM</li><li>专属客户成功经理</li><li>99.99% SLA 保障</li></ul></article></section>
<section class="compare"><h2>功能对比</h2><table><tr><th>能力</th><th>基础版</th><th>专业版</th><th>企业版</th></tr>
<tr><td>项目数量</td><td>3 个</td><td>不限</td><td>不限</td></tr><tr><td>自动化工作流</td><td>—</td><td>✓</td><td>✓</td></tr>
<tr><td>AI 协作助手</td><td>—</td><td>✓</td><td>✓</td></tr><tr><td>审计日志</td><td>—</td><td>90 天</td><td>不限</td></tr><tr><td>私有化部署</td><td>—</td><td>—</td><td>✓</td></tr></table></section>
<div class="foot">还有疑问？查看帮助中心或发邮件给 hi@yunshu.dev</div></div>
<script>tog=function(b,y){var s=b.parentNode;[...s.children].forEach(x=>x.classList.remove('on'));b.classList.add('on');document.querySelectorAll('.amt,.cycle').forEach(e=>{var k=y?'data-y':'data-m';if(e.hasAttribute(k))e.textContent=e.getAttribute(k)})}</script>
`)

// ============ 2. 后台仪表盘 ============
add("dashboard", "数据分析总览", "深色侧栏 + KPI 卡 + 趋势折线 + 渠道分布，最典型的 BI 首页",
    "BI / 数据 / 后台", "云枢 · 数据总览",
    `
body{display:flex;background:#f5f6fa;font-size:13px}
.side{width:216px;min-height:100vh;background:#161a26;color:#aab1c2;padding:22px 14px;flex-shrink:0}
.logo{color:#fff;font-size:17px;font-weight:800;padding:0 10px 26px}.logo i{color:#7c6cff;font-style:normal}
.side .grp{font-size:10px;letter-spacing:2px;color:#5f677a;padding:18px 10px 8px}
.side a{display:flex;gap:10px;align-items:center;padding:10px;border-radius:9px;margin-bottom:3px}
.side a.on{background:#2b2f45;color:#fff;font-weight:600}.side a:hover{background:#222739}
.side .me{margin-top:40px;border-top:1px solid #2a3040;padding-top:18px;display:flex;gap:10px;align-items:center;font-size:12px}
.av{width:32px;height:32px;border-radius:50%;background:#6c5cff;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700}
.main{flex:1;min-width:0}.top{height:64px;background:#fff;border-bottom:1px solid #eceef3;display:flex;align-items:center;padding:0 26px;gap:14px}
.top h2{font-size:17px}.top .sp{flex:1}.top .range{border:1px solid #e5e7ee;border-radius:9px;padding:8px 14px;color:#707684}
.top .bell{width:34px;height:34px;border-radius:9px;background:#f3f4f8;display:grid;place-items:center}
.content{padding:24px 26px}.crumb{color:#8a90a0;font-size:12px;margin-bottom:6px}.content h1{font-size:24px;letter-spacing:-.7px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:22px 0}
.kpi{background:#fff;border:1px solid #eceef3;border-radius:15px;padding:18px}.kpi span{font-size:12px;color:#8a90a0}
.kpi b{display:block;font-size:27px;letter-spacing:-1px;margin:8px 0 6px}.kpi em{font-style:normal;font-size:11px;color:#2fa866;background:#e8f8ee;padding:3px 7px;border-radius:6px}
.kpi em.down{color:#e05b5b;background:#ffeded}
.panel{background:#fff;border:1px solid #eceef3;border-radius:15px;padding:20px}
.panel h3{font-size:14px;margin-bottom:4px}.panel>p{font-size:11px;color:#9a9fad}
.two{display:grid;grid-template-columns:1.65fr 1fr;gap:14px}
.tabs{display:flex;gap:16px;font-size:12px;color:#9a9fad;margin:16px 0 8px}.tabs b{color:#6c5cff;border-bottom:2px solid #6c5cff;padding-bottom:6px}
.legend{display:flex;gap:16px;font-size:11px;color:#8a90a0;margin-top:10px}.legend i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#6c5cff;margin-right:5px}
.bars{display:flex;flex-direction:column;gap:14px;margin-top:18px}.bars div{display:flex;align-items:center;gap:10px;font-size:12px}
.bars label{width:66px;color:#707684}.track{flex:1;height:9px;background:#f0f1f6;border-radius:9px;overflow:hidden}.track i{display:block;height:100%;background:linear-gradient(90deg,#8b7bff,#5c4ae0);border-radius:9px}
.bars b{width:38px;text-align:right;font-size:11px}
.table{margin-top:14px}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:#9a9fad;font-weight:500;padding:11px 8px;border-bottom:1px solid #f0f1f5}
td{padding:12px 8px;border-bottom:1px solid #f5f6f9}.tagS{font-size:10px;padding:4px 9px;border-radius:999px;background:#e8f8ee;color:#2fa866}.tagW{background:#fff4e0;color:#d18b1f}
`,
    `
<aside class="side"><div class="logo">云<i>枢</i> Console</div><div class="grp">工作台</div>
<a class="on">◈ 数据总览</a><a>▤ 订单管理</a><a>◍ 客户管理</a><a>◷ 实时监控</a>
<div class="grp">管理</div><a>⚙ 团队与权限</a><a>▦ 内容配置</a><a>↗ 数据导出</a>
<div class="me"><div class="av">陈</div><div><b style="color:#fff">陈知远</b><br>管理员</div></div></aside>
<div class="main"><header class="top"><h2>数据总览</h2><span class="sp"></span><button class="range" onclick="this.textContent=this.textContent.includes('近 30 天')?'近 7 天 ▾':'近 30 天 ▾'">近 30 天 ▾</button><div class="bell">🔔</div><div class="av">陈</div></header>
<div class="content"><div class="crumb">工作台 / 数据总览</div><h1>早上好，知远 👋</h1>
<div class="kpis"><div class="kpi"><span>总营收</span><b>¥ 1,284,690</b><em>↑ 12.8%</em></div>
<div class="kpi"><span>新增订单</span><b>8,492</b><em>↑ 8.3%</em></div><div class="kpi"><span>活跃客户</span><b>3,271</b><em>↑ 5.1%</em></div>
<div class="kpi"><span>退款率</span><b>1.42%</b><em class="down">↓ 0.3%</em></div></div>
<div class="two"><section class="panel"><h3>营收趋势</h3><p>按日统计 · 单位：万元</p>
<div class="tabs"><b>营收</b><span>订单量</span><span>客单价</span></div>
<svg viewBox="0 0 640 190" style="width:100%;height:190px"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c5cff" stop-opacity=".28"/><stop offset="1" stop-color="#6c5cff" stop-opacity="0"/></linearGradient></defs>
<path d="M0 150 L60 132 L120 142 L180 105 L240 118 L300 78 L360 92 L420 56 L480 70 L540 34 L640 22 L640 190 L0 190Z" fill="url(#g)"/>
<path d="M0 150 L60 132 L120 142 L180 105 L240 118 L300 78 L360 92 L420 56 L480 70 L540 34 L640 22" fill="none" stroke="#6c5cff" stroke-width="3" stroke-linecap="round"/>
<g stroke="#eef0f5"><line x1="0" y1="40" x2="640" y2="40"/><line x1="0" y1="90" x2="640" y2="90"/><line x1="0" y1="140" x2="640" y2="140"/></g>
<circle cx="540" cy="34" r="5" fill="#fff" stroke="#6c5cff" stroke-width="3"/></svg>
<div class="legend"><span><i></i>本期</span><span style="margin-left:auto">10/01 — 10/30</span></div></section>
<section class="panel"><h3>流量渠道</h3><p>会话占比</p><div class="bars">
<div><label>自然搜索</label><div class="track"><i style="width:78%"></i></div><b>38%</b></div>
<div><label>直接访问</label><div class="track"><i style="width:56%"></i></div><b>27%</b></div>
<div><label>社交媒体</label><div class="track"><i style="width:40%"></i></div><b>19%</b></div>
<div><label>付费投放</label><div class="track"><i style="width:25%"></i></div><b>12%</b></div>
<div><label>其他</label><div class="track"><i style="width:9%"></i></div><b>4%</b></div></div></section></div>
<section class="panel" style="margin-top:14px"><h3>最近订单</h3><div class="table"><table><tr><th>订单号</th><th>客户</th><th>商品</th><th>金额</th><th>状态</th><th>时间</th></tr>
<tr><td>#YS20261030001</td><td>星海科技</td><td>专业版 · 50 席位</td><td>¥ 34,500</td><td><span class="tagS">已完成</span></td><td>10-30 14:22</td></tr>
<tr><td>#YS20261030002</td><td>拾光设计</td><td>专业版 · 12 席位</td><td>¥ 8,280</td><td><span class="tagW">待付款</span></td><td>10-30 13:08</td></tr>
<tr><td>#YS20261029008</td><td>北岸数据</td><td>企业版 · 私有化</td><td>¥ 168,000</td><td><span class="tagS">已完成</span></td><td>10-29 18:41</td></tr></table></div></section></div></div>
`)

add("dashboard", "电商订单管理", "筛选工具条 + 状态标签 + 批量操作 + 分页的运营后台列表页",
    "后台 / 表格 / 运营", "订单管理 · 后台",
    `
body{display:flex;background:#f6f7fb;font-size:13px}
.side{width:200px;min-height:100vh;background:#fff;border-right:1px solid #e9ebf1;padding:22px 14px;flex-shrink:0;color:#6b7180}
.logo{font-size:17px;font-weight:800;color:#191a22;padding:0 10px 26px}.logo em{font-style:normal;color:#ff7a45}
.side a{display:block;padding:10px 12px;border-radius:9px;margin-bottom:4px}.side a.on{background:#fff1e9;color:#e2602a;font-weight:700}
.side .grp{font-size:10px;letter-spacing:2px;color:#a8adba;padding:20px 12px 8px}
.main{flex:1;min-width:0}.top{height:62px;background:#fff;border-bottom:1px solid #e9ebf1;display:flex;align-items:center;padding:0 24px;gap:12px}
.top b{font-size:17px}.top .sp{flex:1}.top .av{width:32px;height:32px;border-radius:50%;background:#ffd9c4;color:#c2511c;display:grid;place-items:center;font-weight:700}
.wrap{padding:24px}h1{font-size:23px;letter-spacing:-.6px}.sub{color:#8a90a0;font-size:12px;margin-top:6px}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0}
.stat{background:#fff;border:1px solid #eceef3;border-radius:13px;padding:15px}.stat span{font-size:11px;color:#8a90a0}.stat b{display:block;font-size:22px;margin-top:6px}
.stat.act{border-color:#ff9d6c;background:#fff8f4}.stat.act b{color:#e2602a}
.box{background:#fff;border:1px solid #eceef3;border-radius:15px;overflow:hidden}
.bar{display:flex;gap:9px;padding:16px;border-bottom:1px solid #f0f1f5;align-items:center}
.bar input,.bar select{border:1px solid #e4e6ed;border-radius:9px;padding:9px 12px;font:inherit;font-size:12px;background:#fff;color:#4b5060}
.bar input{width:230px}.bar .sp{flex:1}.btn{background:#ff7a45;color:#fff;padding:9px 16px;border-radius:9px;font-size:12px;font-weight:700}
.btn.line{background:#fff;color:#5d6270;border:1px solid #e4e6ed;font-weight:400}
.tabs{display:flex;gap:24px;padding:0 18px;border-bottom:1px solid #f0f1f5;font-size:13px;color:#7d8290}
.tabs b{color:#e2602a;padding:14px 0;border-bottom:2px solid #ff7a45}
table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:12px 16px;background:#fafbfd;color:#9297a4;font-weight:500}
td{padding:14px 16px;border-top:1px solid #f3f4f8;color:#4b5060}td b{color:#191a22}
.goods{display:flex;align-items:center;gap:10px}.thumb{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#ffd9c4,#ffb088)}
.st{font-size:11px;padding:4px 9px;border-radius:999px}.st.ok{background:#e8f8ee;color:#2fa866}.st.wait{background:#fff4e0;color:#d18b1f}.st.ship{background:#eaf1ff;color:#4a76d8}.st.close{background:#f1f2f5;color:#8a90a0}
.link{color:#e2602a;cursor:pointer}.foot{padding:14px 18px;display:flex;align-items:center;gap:6px;color:#8a90a0;font-size:12px}
.foot .sp{flex:1}.pg{border:1px solid #e4e6ed;border-radius:7px;padding:6px 10px;background:#fff}.pg.on{background:#ff7a45;color:#fff;border-color:#ff7a45}
`,
    `
<aside class="side"><div class="logo">橙<em>市</em>商户后台</div><div class="grp">交易</div><a class="on">▤ 订单管理</a><a>↩ 售后退款</a><a>◈ 数据概览</a>
<div class="grp">商品</div><a>▦ 商品列表</a><a>▣ 库存管理</a><a>◉ 分类与标签</a><div class="grp">设置</div><a>⚙ 店铺设置</a></aside>
<div class="main"><header class="top"><b>订单管理</b><span class="sp"></span><span style="font-size:12px;color:#8a90a0">2026-10-30 星期五</span><div class="av">周</div></header>
<div class="wrap"><h1>订单列表</h1><p class="sub">共 2,486 笔订单 · 今日新增 38 笔 · 数据每 5 分钟同步</p>
<div class="stats"><div class="stat act"><span>待付款</span><b>42</b></div><div class="stat"><span>待发货</span><b>86</b></div><div class="stat"><span>运输中</span><b>153</b></div><div class="stat"><span>已完成</span><b>2,184</b></div><div class="stat"><span>已关闭</span><b>21</b></div></div>
<div class="box"><div class="bar"><input placeholder="搜索订单号 / 买家手机号 / 商品名"><select><option>全部状态</option><option>待付款</option><option>待发货</option></select><select><option>近 30 天</option><option>近 7 天</option></select><span class="sp"></span><button class="btn line" onclick="this.textContent='已导出 38 条 ✓'">导出报表</button><button class="btn" onclick="this.textContent='筛选已应用 ✓'">筛选</button></div>
<div class="tabs"><b>全部 2,486</b><span>待付款 42</span><span>待发货 86</span><span>运输中 153</span><span>已完成 2,184</span></div>
<table><tr><th><input type="checkbox"></th><th>订单信息</th><th>商品</th><th>买家</th><th>实付金额</th><th>状态</th><th>操作</th></tr>
<tr><td><input type="checkbox"></td><td><b>#CS2026103001842</b><br><span style="color:#9a9fad">10-30 14:22:08</span></td><td><div class="goods"><div class="thumb"></div><div>拾光手冲咖啡套装<br><span style="color:#9a9fad">× 2 · 深空灰</span></div></div></td><td>陈知远<br><span style="color:#9a9fad">138****6621</span></td><td><b>¥ 498.00</b><br><span style="color:#9a9fad">含运费 ¥12</span></td><td><span class="st wait">待发货</span></td><td><span class="link">发货</span> · <span class="link">详情</span></td></tr>
<tr><td><input type="checkbox"></td><td><b>#CS2026103001841</b><br><span style="color:#9a9fad">10-30 13:56:31</span></td><td><div class="goods"><div class="thumb" style="background:linear-gradient(135deg,#d7e6ff,#8ea9e8)"></div><div>静音无线鼠标 Pro<br><span style="color:#9a9fad">× 1 · 雾白</span></div></div></td><td>林澈<br><span style="color:#9a9fad">186****2043</span></td><td><b>¥ 329.00</b><br><span style="color:#9a9fad">含运费 ¥0</span></td><td><span class="st ship">运输中</span></td><td><span class="link">查物流</span> · <span class="link">详情</span></td></tr>
<tr><td><input type="checkbox"></td><td><b>#CS2026103001840</b><br><span style="color:#9a9fad">10-30 11:08:44</span></td><td><div class="goods"><div class="thumb" style="background:linear-gradient(135deg,#e7ddff,#a98cf0)"></div><div>亚麻桌旗 · 秋日限定<br><span style="color:#9a9fad">× 3 · 焦糖</span></div></div></td><td>苏晚<br><span style="color:#9a9fad">159****8817</span></td><td><b>¥ 267.00</b><br><span style="color:#9a9fad">含运费 ¥0</span></td><td><span class="st ok">已完成</span></td><td><span class="link">详情</span></td></tr>
<tr><td><input type="checkbox"></td><td><b>#CS2026103001839</b><br><span style="color:#9a9fad">10-30 09:31:12</span></td><td><div class="goods"><div class="thumb" style="background:linear-gradient(135deg,#d9f2e5,#84c9a6)"></div><div>桌面绿植组合<br><span style="color:#9a9fad">× 1 · 标准</span></div></div></td><td>周叙<br><span style="color:#9a9fad">137****4402</span></td><td><b>¥ 89.00</b><br><span style="color:#9a9fad">含运费 ¥8</span></td><td><span class="st close">已关闭</span></td><td><span class="link">详情</span></td></tr></table>
<div class="foot"><span>已选 0 项</span><button class="btn line" style="margin-left:12px">批量发货</button><span class="sp"></span><span>共 249 页</span><button class="pg">‹</button><button class="pg on">1</button><button class="pg">2</button><button class="pg">3</button><button class="pg">›</button></div></div></div></div>
`)

add("dashboard", "客户管理详情", "左侧客户列表 + 右侧 360° 详情面板，CRM 双栏布局",
    "CRM / 双栏 / 详情", "客户管理 · CRM",
    `
body{display:flex;background:#f4f6f9;font-size:13px;height:100vh}
.side{width:66px;background:#1d2333;display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 0;flex-shrink:0;color:#8d95a8;font-size:18px}
.side .lg{width:34px;height:34px;border-radius:10px;background:#5b7cff;color:#fff;display:grid;place-items:center;font-size:15px;font-weight:800;margin-bottom:18px}
.side span{width:38px;height:38px;border-radius:10px;display:grid;place-items:center}.side span.on{background:#313a52;color:#fff}
.list{width:302px;background:#fff;border-right:1px solid #e8eaf0;padding:20px 16px;flex-shrink:0;overflow:auto}
.list h2{font-size:18px}.list>p{color:#9297a4;font-size:11px;margin:6px 0 16px}
.search{background:#f5f6fa;border-radius:9px;padding:10px 12px;color:#a2a7b3;font-size:12px;margin-bottom:14px}
.chips{display:flex;gap:6px;margin-bottom:14px}.chips span{font-size:11px;padding:5px 10px;border-radius:999px;background:#f2f3f7;color:#7d8290}.chips b{background:#e9edff;color:#4b63d8}
.item{display:flex;gap:10px;padding:12px 10px;border-radius:11px;margin-bottom:4px;align-items:center}
.item.on{background:#eef1ff}.item .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0}
.item b{font-size:13px}.item small{color:#9a9fad;font-size:11px;display:block;margin-top:3px}.item .amt{margin-left:auto;font-size:12px;color:#4b5060}
.detail{flex:1;min-width:0;overflow:auto}.top{height:62px;background:#fff;border-bottom:1x solid #e8eaf0;display:flex;align-items:center;padding:0 26px;gap:12px}
.top b{font-size:16px}.top .sp{flex:1}.top button{background:#4b63d8;color:#fff;padding:9px 16px;border-radius:9px;font-size:12px}
.inner{padding:24px 26px}.hero{background:#fff;border:1px solid #e8eaf0;border-radius:16px;padding:24px;display:flex;gap:20px;align-items:center}
.bigav{width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#6d84ff,#43c0c0);color:#fff;display:grid;place-items:center;font-size:26px;font-weight:800}
.hero h1{font-size:23px;letter-spacing:-.6px}.hero p{color:#8a90a0;font-size:12px;margin-top:7px}
.hero .tags{display:flex;gap:6px;margin-top:10px}.hero .tags span{font-size:10px;padding:4px 9px;border-radius:999px;background:#eef1ff;color:#4b63d8}
.hero .sp{flex:1}.hero .kpi{text-align:center;padding:0 20px;border-left:1px solid #f0f1f5}.hero .kpi b{display:block;font-size:21px}.hero .kpi span{font-size:11px;color:#9a9fad}
.two{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-top:14px}
.card{background:#fff;border:1px solid #e8eaf0;border-radius:16px;padding:20px}.card h3{font-size:14px;margin-bottom:16px}
.chart{display:flex;align-items:flex-end;gap:9px;height:120px;border-bottom:1px solid #eef0f5;padding-bottom:2px}
.chart i{flex:1;background:linear-gradient(180deg,#7f92ff,#cfd6ff);border-radius:5px 5px 0 0}
.months{display:flex;justify-content:space-between;font-size:10px;color:#a2a7b3;margin-top:8px}
.tl{border-left:2px solid #eef0f5;padding-left:16px;margin-left:6px}.tl div{position:relative;padding-bottom:18px;font-size:12px}
.tl div::before{content:"";position:absolute;left:-22px;top:3px;width:10px;height:10px;border-radius:50%;background:#7f92ff;border:2px solid #fff}
.tl b{display:block}.tl span{color:#9a9fad;font-size:11px}
.info{display:grid;grid-template-columns:1fr 1fr;gap:14px 10px;font-size:12px}.info label{display:block;color:#9a9fad;font-size:11px;margin-bottom:4px}
`,
    `
<aside class="side"><div class="lg">N</div><span class="on">◍</span><span>▤</span><span>◈</span><span>✉</span><span>⚙</span></aside>
<section class="list"><h2>客户</h2><p>共 1,284 位客户 · 本月新增 62 位</p>
<div class="search">⌕ 搜索姓名 / 公司 / 手机号</div><div class="chips"><b>全部</b><span>重点客户</span><span>待跟进</span><span>已成交</span></div>
<div class="item on"><div class="av" style="background:#6d84ff">星</div><div><b>星海科技 · 陈知远</b><small>企业客户 · 2 小时前活跃</small></div><span class="amt">¥34.5万</span></div>
<div class="item"><div class="av" style="background:#f29a6c">拾</div><div><b>拾光设计 · 林澈</b><small>企业客户 · 昨天</small></div><span class="amt">¥8.2万</span></div>
<div class="item"><div class="av" style="background:#5cbf9b">北</div><div><b>北岸数据 · 周叙</b><small>企业客户 · 3 天前</small></div><span class="amt">¥16.8万</span></div>
<div class="item"><div class="av" style="background:#a58cf0">苏</div><div><b>苏晚</b><small>个人客户 · 5 天前</small></div><span class="amt">¥2,670</span></div>
<div class="item"><div class="av" style="background:#e27f9c">何</div><div><b>何一舟</b><small>个人客户 · 上周</small></div><span class="amt">¥980</span></div></section>
<section class="detail"><header class="top"><b>客户 / 星海科技</b><span class="sp"></span><button class="" style="background:#fff;color:#5d6270;border:1px solid #e4e6ed" onclick="this.textContent='已发起 ✓'">发消息</button><button onclick="this.textContent='跟进任务已创建 ✓'">+ 新建跟进</button></header>
<div class="inner"><div class="hero"><div class="bigav">星</div><div><h1>星海科技 <span style="font-size:11px;background:#e8f8ee;color:#2fa866;padding:4px 9px;border-radius:999px;vertical-align:middle">已成交</span></h1>
<p>联系人 陈知远 · 采购负责人 · 上海市徐汇区 · 成立于 2018 年</p><div class="tags"><span>企业客户</span><span>SaaS</span><span>重点跟进</span></div></div><span class="sp"></span>
<div class="kpi"><b>¥34.5万</b><span>累计成交</span></div><div class="kpi"><b>7</b><span>订单数</span></div><div class="kpi"><b>218天</b><span>合作时长</span></div></div>
<div class="two"><div class="card"><h3>近 6 个月成交趋势</h3><div class="chart"><i style="height:32%"></i><i style="height:55%"></i><i style="height:41%"></i><i style="height:74%"></i><i style="height:62%"></i><i style="height:96%"></i></div>
<div class="months"><span>5月</span><span>6月</span><span>7月</span><span>8月</span><span>9月</span><span>10月</span></div>
<h3 style="margin-top:24px">客户资料</h3><div class="info"><div><label>联系电话</label>138 6621 0088</div><div><label>邮箱</label>chen@xinghai.com</div><div><label>所属行业</label>企业服务 / 软件</div><div><label>客户来源</label>官网注册</div><div><label>归属销售</label>陈知远</div><div><label>下次跟进</label>11 月 12 日</div></div></div>
<div class="card"><h3>跟进动态</h3><div class="tl">
<div><b>续约方案已发出</b><span>10-30 15:42 · 陈知远</span></div><div><b>电话沟通扩容需求</b><span>10-28 10:15 · 陈知远</span></div>
<div><b>专业版 50 席位订单完成</b><span>10-30 14:22 · 系统</span></div><div><b>创建客户档案</b><span>03-26 09:10 · 系统</span></div></div></div></div></div></section>
`)

add("dashboard", "系统监控大屏", "深色运维大屏 + 实时指标 + 服务健康度 + 告警流",
    "监控 / 深色 / 大屏", "监控中心 · NOC",
    `
body{background:#0b0f18;color:#dbe2ef;font-size:13px}
.top{height:64px;border-bottom:1px solid #1d2535;display:flex;align-items:center;padding:0 28px;gap:14px;background:#0e1421}
.top b{font-size:17px;letter-spacing:.5px}.top .live{font-size:11px;color:#45d39a;background:rgba(69,211,154,.1);padding:5px 11px;border-radius:999px}
.top .live i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#45d39a;margin-right:6px}
.top .sp{flex:1}.top span{color:#7c889e;font-size:12px}
.wrap{padding:22px 28px}.headline{display:flex;align-items:end;margin-bottom:18px}.headline h1{font-size:22px}.headline p{color:#7c889e;font-size:12px;margin-top:6px}
.headline .sp{flex:1}.headline button{border:1px solid #29344a;color:#9caac0;padding:8px 14px;border-radius:8px;font-size:12px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.kpi{background:#111827;border:1px solid #1e283a;border-radius:14px;padding:18px;position:relative;overflow:hidden}
.kpi::after{content:"";position:absolute;right:-20px;top:-20px;width:90px;height:90px;border-radius:50%;background:rgba(74,124,255,.07)}
.kpi span{color:#8492aa;font-size:12px}.kpi b{display:block;font-size:30px;letter-spacing:-1px;margin:9px 0 6px;color:#fff}
.kpi em{font-style:normal;font-size:11px}.ok{color:#45d39a}.warn{color:#f5b74f}.bad{color:#f47777}
.bar{height:6px;background:#1c2638;border-radius:6px;margin-top:12px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#3b7bff,#45d39a);border-radius:6px}
.two{display:grid;grid-template-columns:1.5fr 1fr;gap:14px;margin-top:14px}
.panel{background:#111827;border:1px solid #1e283a;border-radius:14px;padding:20px}.panel h3{font-size:14px;color:#fff}.panel>p{color:#7c889e;font-size:11px;margin-top:6px}
svg .grid{stroke:#1e283a}.legend{display:flex;gap:18px;font-size:11px;color:#8492aa;margin-top:12px}
.legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.svc{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #1b2434;font-size:12px}
.svc:last-child{border:0}.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.svc .sp{flex:1}.svc b{color:#fff;font-weight:500}.svc small{color:#7c889e}
.alerts{margin-top:14px}.alert{display:flex;gap:12px;padding:13px 16px;border-left:3px solid #f5b74f;background:#151d2c;border-radius:0 9px 9px 0;margin-bottom:9px;font-size:12px}
.alert.bad{border-color:#f47777}.alert .sp{flex:1}.alert small{color:#7c889e;display:block;margin-top:4px}
`,
    `
<header class="top"><b>◉ NORTHSTAR 监控中心</b><span class="live"><i></i>数据实时同步</span><span class="sp"></span><span>华东 1 区 · 生产环境</span><span>2026-10-30 15:42:08</span></header>
<div class="wrap"><div class="headline"><div><h1>系统运行态势</h1><p>过去 24 小时 · 42 个服务实例 · 8 个可用区</p></div><span class="sp"></span><button onclick="this.textContent='已切至近 7 天 ✓'">近 24 小时 ▾</button><button>刷新数据</button></div>
<div class="kpis"><div class="kpi"><span>整体可用性</span><b class="ok">99.98%</b><em class="ok">↑ 0.02% 较昨日</em><div class="bar"><i style="width:99%"></i></div></div>
<div class="kpi"><span>平均响应延迟</span><b>128<span style="font-size:14px;color:#8492aa"> ms</span></b><em class="ok">↓ 14ms 较昨日</em><div class="bar"><i style="width:36%"></i></div></div>
<div class="kpi"><span>请求总量 / 日</span><b>8.42<span style="font-size:14px;color:#8492aa"> M</span></b><em class="warn">↑ 12.4% 较昨日</em><div class="bar"><i style="width:68%"></i></div></div>
<div class="kpi"><span>错误率</span><b class="warn">0.14%</b><em class="bad">↑ 0.03% 需关注</em><div class="bar"><i style="width:14%;background:linear-gradient(90deg,#f5b74f,#f47777)"></i></div></div></div>
<div class="two"><section class="panel"><h3>请求量与延迟</h3><p>QPS（千次/秒）· P95 延迟（ms）</p>
<svg viewBox="0 0 620 210" style="width:100%;height:210px"><g class="grid"><line x1="0" y1="30" x2="620" y2="30"/><line x1="0" y1="80" x2="620" y2="80"/><line x1="0" y1="130" x2="620" y2="130"/><line x1="0" y1="180" x2="620" y2="180"/></g>
<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b7bff" stop-opacity=".35"/><stop offset="1" stop-color="#3b7bff" stop-opacity="0"/></linearGradient></defs>
<path d="M0 150 C60 140 80 90 130 100 S210 160 260 130 S340 60 390 78 S470 140 520 100 S590 55 620 48 L620 210 L0 210Z" fill="url(#a)"/>
<path d="M0 150 C60 140 80 90 130 100 S210 160 260 130 S340 60 390 78 S470 140 520 100 S590 55 620 48" fill="none" stroke="#4b8dff" stroke-width="2.5"/>
<path d="M0 170 C80 165 120 150 190 158 S300 145 360 150 S480 130 620 138" fill="none" stroke="#45d39a" stroke-width="2" stroke-dasharray="5 4"/>
<text x="4" y="204" fill="#62708a" font-size="10">00:00</text><text x="290" y="204" fill="#62708a" font-size="10">12:00</text><text x="580" y="204" fill="#62708a" font-size="10">24:00</text></svg>
<div class="legend"><span><i style="background:#4b8dff"></i>QPS</span><span><i style="background:#45d39a"></i>P95 延迟</span><span style="margin-left:auto">峰值 14:20 · 12.8k/s</span></div></section>
<section class="panel"><h3>服务健康度</h3><p>42 个实例 · 40 正常 / 2 降级</p>
<div class="svc"><i class="dot" style="background:#45d39a"></i><b>api-gateway</b><span class="sp"></span><small>8/8 实例</small><small class="ok">正常</small></div>
<div class="svc"><i class="dot" style="background:#45d39a"></i><b>order-service</b><span class="sp"></span><small>6/6 实例</small><small class="ok">正常</small></div>
<div class="svc"><i class="dot" style="background:#f5b74f"></i><b>payment-service</b><span class="sp"></span><small>5/6 实例</small><small class="warn">降级</small></div>
<div class="svc"><i class="dot" style="background:#45d39a"></i><b>user-center</b><span class="sp"></span><small>4/4 实例</small><small class="ok">正常</small></div>
<div class="svc"><i class="dot" style="background:#f47777"></i><b>search-index</b><span class="sp"></span><small>2/3 实例</small><small class="bad">异常</small></div>
<div class="svc"><i class="dot" style="background:#45d39a"></i><b>message-queue</b><span class="sp"></span><small>3/3 实例</small><small class="ok">正常</small></div></section></div>
<section class="alerts"><div class="alert bad"><span>🔴</span><div class="sp"><b>search-index 实例 i-7f2a CPU 持续超过 92%</b><small>持续 8 分钟 · 已触发 P2 告警 · 负责人 周叙</small></div><small>2 分钟前</small></div>
<div class="alert"><span>🟡</span><div class="sp"><b>payment-service 单实例响应超时，已自动摘除流量</b><small>自动恢复中 · 影响约 0.3% 请求</small></div><small>18 分钟前</small></div>
<div class="alert"><span>🟢</span><div class="sp"><b>api-gateway 扩容完成：6 → 8 实例</b><small>由自动伸缩策略触发</small></div><small>1 小时前</small></div></section></div>
`)

// ============ 3. 电商 ============
add("ecommerce", "商品详情页", "图库 + SKU 选择 + 价格权益 + 加购，转化率导向的经典结构",
    "商详 / SKU / 转化", "拾光 · 手冲咖啡套装",
    `
body{background:#fff;color:#22242a;font-size:13px}
.nav{height:66px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;padding:0 54px;gap:34px}
.logo{font-size:20px;font-weight:900;letter-spacing:2px}.logo em{font-style:normal;color:#c1763f}
.nav a{color:#636873;font-size:13px}.nav .sp{flex:1}.search{background:#f5f6f8;border-radius:999px;padding:9px 18px;color:#a2a7b0;font-size:12px;width:230px}
.cart{border:1px solid #e6e8ed;border-radius:999px;padding:8px 16px;font-size:12px}
.crumb{color:#9a9faa;font-size:12px;padding:20px 54px 0}.crumb b{color:#22242a}
.main{display:grid;grid-template-columns:1fr 1fr;gap:56px;padding:22px 54px 70px;max-width:1300px}
.gallery .big{height:470px;border-radius:18px;background:radial-gradient(circle at 34% 32%,#f6e2cf,#d5a476 55%,#8f5b35);position:relative;display:grid;place-items:center;overflow:hidden}
.gallery .big::after{content:"";width:210px;height:250px;border-radius:90px 90px 26px 26px;background:linear-gradient(145deg,rgba(255,255,255,.85),rgba(255,255,255,.3));box-shadow:0 26px 50px rgba(90,52,24,.28);backdrop-filter:blur(4px)}
.gallery .big span{position:absolute;top:20px;left:20px;background:#fff;color:#b8652c;font-size:11px;padding:6px 12px;border-radius:999px;font-weight:700}
.thumbs{display:flex;gap:10px;margin-top:12px}.thumbs div{width:78px;height:78px;border-radius:11px;background:linear-gradient(135deg,#f3e3d3,#c99a6c);border:2px solid transparent;cursor:pointer}
.thumbs div:first-child{border-color:#c1763f}.thumbs div:nth-child(2){background:linear-gradient(135deg,#dfe4ea,#9aa3ae)}.thumbs div:nth-child(3){background:linear-gradient(135deg,#e8d9c6,#a07b58)}.thumbs div:nth-child(4){background:linear-gradient(135deg,#f0e8dc,#c2a17c)}
.info h1{font-size:29px;letter-spacing:-.9px;line-height:1.35}.sub{color:#8a8f9a;margin-top:10px;font-size:13px;line-height:1.8}
.pricebox{background:#fdf6f0;border:1px solid #f5e2d1;border-radius:14px;padding:18px 20px;margin:22px 0;display:flex;align-items:end;gap:12px}
.pricebox b{font-size:36px;color:#c25f24;letter-spacing:-1.5px}.pricebox del{color:#a9a39c;font-size:13px}.pricebox .off{background:#c25f24;color:#fff;font-size:11px;padding:4px 9px;border-radius:6px}.pricebox .sp{flex:1}.pricebox span{color:#8a8f9a;font-size:12px}
.row{margin:18px 0;display:flex;gap:14px;align-items:flex-start}.row>label{width:56px;color:#8a8f9a;font-size:12px;padding-top:9px;flex-shrink:0}
.opts{display:flex;gap:9px;flex-wrap:wrap}.opts button{border:1px solid #e3e5ea;border-radius:9px;padding:9px 15px;font-size:12px;background:#fff}
.opts button.on{border-color:#c1763f;color:#b8652c;background:#fff8f3;font-weight:700}
.qty{display:flex;align-items:center;border:1px solid #e3e5ea;border-radius:9px;overflow:hidden}.qty button{padding:8px 13px;background:#fafbfc}.qty span{padding:8px 18px;border-left:1px solid #e3e5ea;border-right:1px solid #e3e5ea}
.acts{display:flex;gap:12px;margin-top:26px}.add{background:#f6e6d8;color:#b8652c;border:1px solid #e8c5a5;padding:15px 34px;border-radius:11px;font-size:15px;font-weight:800}
.buy{background:#22242a;color:#fff;padding:15px 40px;border-radius:11px;font-size:15px;font-weight:800}
.promise{display:flex;gap:22px;margin-top:24px;padding-top:20px;border-top:1px solid #f0f1f4;color:#8a8f9a;font-size:12px}
.desc{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:0 54px 70px}.desc article{background:#faf9f7;border-radius:14px;padding:22px}.desc b{font-size:14px}.desc p{color:#8a8f9a;font-size:12px;line-height:1.8;margin-top:9px}
`,
    `
<nav class="nav"><div class="logo">拾<em>光</em> SHIGUANG</div><a>全部商品</a><a>咖啡器具</a><a>生活方式</a><a>品牌故事</a><span class="sp"></span><div class="search">⌕ 搜索好物</div><button class="cart">购物车 (2)</button></nav>
<div class="crumb">首页 / 咖啡器具 / <b>手冲咖啡套装</b></div>
<section class="main"><div class="gallery"><div class="big"><span>限时 85 折</span></div><div class="thumbs"><div></div><div></div><div></div><div></div></div></div>
<div class="info"><h1>拾光手冲咖啡套装 · 山野系列</h1><p class="sub">磨砂陶土滤杯 + 双层玻璃分享壶 + 手冲壶，附赠 20 张滤纸与冲煮手册。让每天的第一杯，慢下来一点。</p>
<div class="pricebox"><b>¥ 498</b><del>¥ 588</del><span class="off">省 ¥90</span><span class="sp"></span><span>已售 2,184 件 · 好评率 98.6%</span></div>
<div class="row"><label>颜色</label><div class="opts"><button class="on" onclick="pick(this)">深空灰</button><button onclick="pick(this)">雾白</button><button onclick="pick(this)">焦糖棕</button></div></div>
<div class="row"><label>规格</label><div class="opts"><button class="on" onclick="pick(this)">标准版 · 4 件套</button><button onclick="pick(this)">进阶版 · 6 件套</button></div></div>
<div class="row"><label>数量</label><div class="qty"><button onclick="n(this,1)">+</button><span>1</span><button onclick="n(this,-1)">−</button></div><span style="color:#a2a7b0;font-size:12px;padding-top:9px">库存 86 件</span></div>
<div class="acts"><button class="add" onclick="this.textContent='已加入购物车 ✓'">加入购物车</button><button class="buy" onclick="this.textContent='订单已提交 ✓'">立即购买</button></div>
<div class="promise"><span>✓ 7 天无理由退换</span><span>✓ 顺丰包邮</span><span>✓ 一年质保</span><span>✓ 正品保障</span></div></div></section>
<section class="desc"><article><b>◉ 关于材质</b><p>滤杯采用 1280℃ 高温烧制陶土，螺旋肋骨设计让萃取更均匀，保温性优于普通玻璃。</p></article>
<article><b>⌁ 关于手感</b><p>壶嘴经 12 次手工调校，水流细而稳定；胡桃木手柄隔热防烫，握感温润。</p></article>
<article><b>⬡ 关于包装</b><p>再生纸礼盒包装，无塑料填充物，可直接作为礼物送出。</p></article></section>
<script>pick=function(b){[...b.parentNode.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')};n=function(b,d){var s=b.parentNode.querySelector('span');s.textContent=Math.max(1,+s.textContent+d)}</script>
`)

add("ecommerce", "购物车与结算", "商品清单 + 地址卡 + 支付方式 + 金额汇总，完整下单页",
    "结算 / 表单 / 下单", "确认订单 · 拾光",
    `
body{background:#f6f7f9;color:#22242a;font-size:13px}
.nav{height:64px;background:#fff;border-bottom:1px solid #eceef2;display:flex;align-items:center;padding:0 54px;gap:12px}
.logo{font-size:19px;font-weight:900;letter-spacing:2px}.logo em{font-style:normal;color:#c1763f}.nav .sp{flex:1}.nav span{color:#8a8f9a;font-size:12px}
.steps{display:flex;justify-content:center;gap:70px;padding:26px 0 6px;color:#a1a6b0;font-size:13px}.steps b{color:#c1763f}.steps i{font-style:normal;margin-right:8px}
.wrap{max-width:1160px;margin:16px auto 70px;display:grid;grid-template-columns:1fr 330px;gap:18px;align-items:start}
.card{background:#fff;border:1px solid #eceef2;border-radius:16px;padding:22px;margin-bottom:16px}
.card h2{font-size:16px;margin-bottom:18px}.card h2 span{font-size:12px;color:#9a9faa;font-weight:400;margin-left:10px}
.addr{display:flex;gap:12px}.addr>div{flex:1;border:1px solid #e6e8ed;border-radius:11px;padding:15px;cursor:pointer}
.addr>div.on{border-color:#c1763f;background:#fff9f4}.addr b{font-size:13px}.addr p{color:#8a8f9a;font-size:12px;line-height:1.7;margin-top:7px}
.addr em{font-style:normal;color:#c1763f;font-size:11px}
.item{display:flex;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #f2f3f6}.item:last-child{border:0}
.pic{width:78px;height:78px;border-radius:11px;background:linear-gradient(135deg,#f3e3d3,#c99a6c);flex-shrink:0}
.item .t{flex:1}.item .t b{font-size:13px}.item .t p{color:#9a9faa;font-size:11px;margin-top:7px}
.item .p{font-weight:700}.item .q{color:#9a9faa;font-size:12px;width:60px;text-align:center}
.pay{display:flex;gap:10px}.pay button{flex:1;border:1px solid #e6e8ed;border-radius:10px;padding:13px;font-size:13px}.pay button.on{border-color:#c1763f;background:#fff9f4;color:#b8652c;font-weight:700}
.coupon{display:flex;gap:10px;margin-top:16px}.coupon input{flex:1;border:1px solid #e6e8ed;border-radius:9px;padding:11px 13px;font:inherit;font-size:12px}.coupon button{background:#22242a;color:#fff;border-radius:9px;padding:0 20px;font-size:12px}
.sum{position:sticky;top:20px}.sum h2{font-size:16px;margin-bottom:18px}.line{display:flex;justify-content:space-between;padding:9px 0;color:#6d7280;font-size:12px}.line b{color:#22242a}
.total{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid #f0f1f4;margin-top:14px;padding-top:18px}.total span{font-size:12px;color:#8a8f9a}.total b{font-size:30px;color:#c25f24;letter-spacing:-1px}
.submit{display:block;width:100%;background:#22242a;color:#fff;text-align:center;padding:15px;border-radius:11px;font-size:15px;font-weight:800;margin-top:20px}
.tip{font-size:11px;color:#9a9faa;line-height:1.8;margin-top:14px}
`,
    `
<nav class="nav"><div class="logo">拾<em>光</em> SHIGUANG</div><span class="sp"></span><span>Hi，陈知远</span><span>·</span><span>我的订单</span><span>·</span><span>帮助中心</span></nav>
<div class="steps"><span><i>✓</i>1. 购物车</span><b><i>2</i>2. 确认订单</b><span><i>3</i>3. 完成支付</span></div>
<div class="wrap"><div><section class="card"><h2>收货地址 <span>管理地址</span></h2><div class="addr">
<div class="on"><b>陈知远 <em>默认</em></b><p>138****6621<br>上海市 徐汇区 漕溪北路 88 号 星海大厦 12F</p></div>
<div><b>陈知远 <em>公司</em></b><p>138****6621<br>上海市 浦东新区 张江路 66 号 A 座 3F</p></div>
<div style="display:grid;place-items:center;color:#a2a7b0;border-style:dashed">+ 新增地址</div></div></section>
<section class="card"><h2>商品清单 <span>共 2 件</span></h2>
<div class="item"><div class="pic"></div><div class="t"><b>拾光手冲咖啡套装 · 山野系列</b><p>深空灰 / 标准版 4 件套 · 7 天无理由</p></div><div class="q">× 1</div><div class="p">¥ 498.00</div></div>
<div class="item"><div class="pic" style="background:linear-gradient(135deg,#dfe4ea,#9aa3ae)"></div><div class="t"><b>静音无线鼠标 Pro</b><p>雾白 / 蓝牙双模 · 一年质保</p></div><div class="q">× 1</div><div class="p">¥ 329.00</div></div></section>
<section class="card"><h2>支付方式</h2><div class="pay"><button class="on" onclick="pick(this)">◉ 微信支付</button><button onclick="pick(this)">◉ 支付宝</button><button onclick="pick(this)">◉ 银行卡</button></div>
<div class="coupon"><input placeholder="输入优惠码，如 SHIGUANG50"><button onclick="this.textContent='已抵扣 ¥50 ✓'">使用</button></div></section></div>
<aside class="card sum"><h2>订单汇总</h2><div class="line"><span>商品金额</span><b>¥ 827.00</b></div><div class="line"><span>运费</span><b>¥ 0.00</b></div>
<div class="line"><span>优惠券</span><b style="color:#c25f24">− ¥ 50.00</b></div><div class="line"><span>会员积分抵扣</span><b>− ¥ 12.00</b></div>
<div class="total"><span>应付总额</span><b>¥ 765.00</b></div><button class="submit" onclick="this.textContent='支付已发起 ✓'">提交订单并支付</button>
<p class="tip">提交即表示同意《服务条款》与《隐私政策》。商品预计 11 月 2 日前送达，支持 7 天无理由退换。</p></aside></div>
<script>pick=function(b){[...b.parentNode.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')}</script>
`)

add("ecommerce", "商品列表页", "左侧筛选 + 排序工具条 + 商品网格，品类页标准布局",
    "列表 / 筛选 / 网格", "全部商品 · 拾光",
    `
body{background:#faf9f7;color:#22242a;font-size:13px}
.nav{height:64px;background:#fff;border-bottom:1px solid #edeae5;display:flex;align-items:center;padding:0 48px;gap:30px}
.logo{font-size:19px;font-weight:900;letter-spacing:2px}.logo em{font-style:normal;color:#b0784a}.nav a{color:#6b6f78}.nav .sp{flex:1}
.banner{background:linear-gradient(120deg,#efe4d6,#f8f2e9 60%,#e8d5bd);padding:40px 48px;margin:0 0 26px}
.banner h1{font-size:34px;letter-spacing:-1.5px}.banner p{color:#7d7163;margin-top:10px;font-size:13px}
.wrap{display:grid;grid-template-columns:214px 1fr;gap:26px;padding:0 48px 70px}
.filter{background:#fff;border:1px solid #edeae5;border-radius:14px;padding:18px;height:fit-content}
.filter h3{font-size:13px;padding:0 0 12px;border-bottom:1px solid #f2efea}.filter .grp{padding:16px 0;border-bottom:1px solid #f5f2ee}
.filter .grp b{display:block;font-size:12px;margin-bottom:10px}.filter label{display:flex;gap:8px;align-items:center;padding:5px 0;color:#6b6f78;font-size:12px}
.filter input[type=range]{width:100%;accent-color:#b0784a}
.bar{display:flex;align-items:center;gap:10px;margin-bottom:16px}.bar b{font-size:16px}.bar span{color:#9a958d;font-size:12px}.bar .sp{flex:1}
.bar button{border:1px solid #e5e0d8;background:#fff;border-radius:8px;padding:8px 13px;font-size:12px}.bar button.on{background:#2b2723;color:#fff;border-color:#2b2723}
.chips{display:flex;gap:8px;margin-bottom:18px}.chips span{background:#fff;border:1px solid #e5e0d8;border-radius:999px;padding:6px 12px;font-size:11px;color:#6b6f78}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.goods{background:#fff;border:1px solid #edeae5;border-radius:15px;overflow:hidden;transition:.2s}.goods:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(60,45,30,.1)}
.goods .pic{height:190px;position:relative;background:linear-gradient(135deg,#efe0cd,#c9a077)}.goods:nth-child(2) .pic{background:linear-gradient(135deg,#e1e6ea,#93a3ad)}
.goods:nth-child(3) .pic{background:linear-gradient(135deg,#f0e2c2,#c9ab63)}.goods:nth-child(4) .pic{background:linear-gradient(135deg,#e3e8dc,#9db58a)}
.goods:nth-child(5) .pic{background:linear-gradient(135deg,#e9dce9,#b293b3)}.goods:nth-child(6) .pic{background:linear-gradient(135deg,#dcdfea,#8d93b0)}
.goods .pic i{position:absolute;top:12px;left:12px;font-style:normal;background:#fff;color:#b0784a;font-size:10px;padding:5px 10px;border-radius:999px;font-weight:700}
.goods .txt{padding:15px}.goods .txt b{font-size:13px}.goods .txt p{color:#9a958d;font-size:11px;margin-top:6px}
.goods .bot{display:flex;align-items:baseline;justify-content:space-between;margin-top:12px}.goods .bot b{font-size:18px;color:#a85f2c}.goods .bot span{font-size:11px;color:#a9a49b}
.pages{display:flex;gap:6px;justify-content:center;margin-top:30px}.pages button{width:34px;height:34px;border:1px solid #e5e0d8;background:#fff;border-radius:8px}.pages button.on{background:#2b2723;color:#fff}
`,
    `
<nav class="nav"><div class="logo">拾<em>光</em> SHIGUANG</div><a>全部商品</a><a>咖啡器具</a><a>桌面好物</a><a>生活方式</a><span class="sp"></span><a>搜索</a><a>购物车 (2)</a></nav>
<section class="banner"><h1>把日常，过成喜欢的样子</h1><p>精选 128 件器物 · 每周三上新 · 满 ¥299 顺丰包邮</p></section>
<div class="wrap"><aside class="filter"><h3>筛选</h3><div class="grp"><b>分类</b>
<label><input type="checkbox" checked> 咖啡器具 (42)</label><label><input type="checkbox"> 桌面好物 (36)</label><label><input type="checkbox"> 家居织物 (28)</label><label><input type="checkbox"> 香氛蜡烛 (22)</label></div>
<div class="grp"><b>价格区间</b><input type="range" value="60"><div style="display:flex;justify-content:space-between;color:#9a958d;font-size:11px"><span>¥0</span><span>¥1999</span></div></div>
<div class="grp"><b>材质</b><label><input type="checkbox"> 陶土</label><label><input type="checkbox"> 玻璃</label><label><input type="checkbox"> 实木</label><label><input type="checkbox"> 亚麻</label></div>
<div class="grp" style="border:0"><b>服务</b><label><input type="checkbox"> 现货速发</label><label><input type="checkbox"> 支持定制</label></div></aside>
<div><div class="bar"><b>全部商品</b><span>共 128 件</span><span class="sp"></span><button class="on" onclick="sortBtn(this)">综合排序</button><button onclick="sortBtn(this)">销量优先</button><button onclick="sortBtn(this)">价格 ↑</button><button onclick="sortBtn(this)">最新上架</button></div>
<div class="chips"><span>已选：咖啡器具 ✕</span><span>满 299 包邮 ✕</span></div>
<div class="grid">
<article class="goods"><div class="pic"><i>热卖 TOP 1</i></div><div class="txt"><b>山野手冲咖啡套装</b><p>陶土滤杯 · 4 件套</p><div class="bot"><b>¥ 498</b><span>已售 2,184</span></div></div></article>
<article class="goods"><div class="pic"><i>新品</i></div><div class="txt"><b>静音无线鼠标 Pro</b><p>雾白 · 蓝牙双模</p><div class="bot"><b>¥ 329</b><span>已售 864</span></div></div></article>
<article class="goods"><div class="pic"></div><div class="txt"><b>亚麻桌旗 · 秋日限定</b><p>焦糖 / 160×30cm</p><div class="bot"><b>¥ 89</b><span>已售 1,206</span></div></div></article>
<article class="goods"><div class="pic"></div><div class="txt"><b>桌面绿植组合</b><p>含陶盆 · 免打理</p><div class="bot"><b>¥ 128</b><span>已售 642</span></div></div></article>
<article class="goods"><div class="pic"><i>限时 8 折</i></div><div class="txt"><b>雪松木香氛蜡烛</b><p>180g · 燃烧 40h</p><div class="bot"><b>¥ 158</b><span>已售 923</span></div></div></article>
<article class="goods"><div class="pic"></div><div class="txt"><b>双层玻璃分享壶</b><p>600ml · 耐热</p><div class="bot"><b>¥ 219</b><span>已售 517</span></div></div></article></div>
<div class="pages"><button>‹</button><button class="on">1</button><button>2</button><button>3</button><button>…</button><button>22</button><button>›</button></div></div></div>
<script>sortBtn=function(b){[...b.parentNode.children].forEach(x=>{if(x.tagName==='BUTTON')x.classList.remove('on')});b.classList.add('on')}</script>
`)

add("ecommerce", "订单物流跟踪", "物流时间线 + 运单信息 + 商品快照，售后查询页",
    "物流 / 时间线 / 查询", "物流详情 · 顺丰速运",
    `
body{background:#f5f7fa;color:#22242a;font-size:13px}
.nav{height:62px;background:#fff;border-bottom:1px solid #e9ecf1;display:flex;align-items:center;padding:0 48px;gap:10px}
.nav b{font-size:17px}.nav .sp{flex:1}.nav span{color:#8a90a0;font-size:12px}
.wrap{max-width:1080px;margin:26px auto 70px;display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}
.card{background:#fff;border:1px solid #e9ecf1;border-radius:16px;padding:24px;margin-bottom:16px}
.status{background:linear-gradient(120deg,#eaf6ee,#f6fbf7);border:1px solid #d8eddf;border-radius:16px;padding:24px;display:flex;gap:18px;align-items:center;margin-bottom:16px}
.status .ic{width:54px;height:54px;border-radius:16px;background:#2fa866;color:#fff;display:grid;place-items:center;font-size:26px}
.status h1{font-size:21px;letter-spacing:-.5px}.status p{color:#5e8a70;font-size:12px;margin-top:7px}.status .sp{flex:1}
.status button{border:1px solid #b9dcc7;color:#2b8a58;border-radius:9px;padding:9px 15px;font-size:12px;background:#fff}
h2{font-size:15px;margin-bottom:20px}.tl{margin-left:8px;border-left:2px solid #eef0f4;padding-left:24px}
.tl div{position:relative;padding-bottom:24px}.tl div:last-child{padding-bottom:0}
.tl div::before{content:"";position:absolute;left:-31px;top:3px;width:12px;height:12px;border-radius:50%;background:#dfe3ea;border:2px solid #fff;box-shadow:0 0 0 2px #eef0f4}
.tl div.on::before{background:#2fa866;box-shadow:0 0 0 3px #d8f0e1}
.tl b{font-size:13px}.tl .on b{color:#2b8a58}.tl p{color:#8a90a0;font-size:12px;margin-top:6px;line-height:1.6}
.info{display:grid;grid-template-columns:1fr 1fr;gap:16px 10px;font-size:12px}.info label{display:block;color:#9aa0ac;font-size:11px;margin-bottom:5px}
.goods{display:flex;gap:12px;align-items:center;padding-top:16px;border-top:1px solid #f0f1f5;margin-top:18px}
.goods .pic{width:60px;height:60px;border-radius:10px;background:linear-gradient(135deg,#f3e3d3,#c99a6c)}
.goods b{font-size:12px}.goods p{color:#9aa0ac;font-size:11px;margin-top:6px}
.link{color:#3b6fd8;font-size:12px}.side h2{font-size:14px}.side .row{display:flex;justify-content:space-between;padding:9px 0;font-size:12px;color:#6d7280}.side .row b{color:#22242a}
.tip{background:#fff8ec;border:1px solid #f6e5c4;border-radius:11px;padding:14px;font-size:11px;color:#9a7a3f;line-height:1.8;margin-top:16px}
`,
    `
<nav class="nav"><b>◈ 订单中心</b><span class="sp"></span><span>我的订单</span><span>·</span><span>帮助中心</span></nav>
<div class="wrap"><div><section class="status"><div class="ic">🚚</div><div><h1>运输中 · 包裹已到达上海转运中心</h1><p>预计 11 月 2 日 18:00 前送达 · 顺丰速运 SF1392847561203</p></div><span class="sp"></span><button onclick="this.textContent='已订阅短信提醒 ✓'">订阅短信提醒</button></section>
<section class="card"><h2>物流进度</h2><div class="tl">
<div class="on"><b>【上海转运中心】已发车，发往徐汇集散点</b><p>2026-10-30 14:22:08 · 上海市</p></div>
<div><b>【上海转运中心】快件已到达</b><p>2026-10-30 09:41:16 · 上海市</p></div>
<div><b>【杭州分拨中心】快件已发出</b><p>2026-10-29 22:07:33 · 杭州市</p></div>
<div><b>【杭州分拨中心】快件已揽收</b><p>2026-10-29 18:15:02 · 杭州市</p></div>
<div><b>商家已发货，等待快递揽收</b><p>2026-10-29 16:30:44 · 拾光旗舰店</p></div>
<div><b>订单已付款，商家正在备货</b><p>2026-10-29 14:22:08</p></div></div></section></div>
<aside class="card side"><h2>订单信息</h2><div class="row"><span>订单编号</span><b>#CS2026102901842</b></div><div class="row"><span>下单时间</span><b>10-29 14:22</b></div>
<div class="row"><span>支付方式</span><b>微信支付</b></div><div class="row"><span>实付金额</span><b>¥ 765.00</b></div>
<div class="info" style="margin-top:18px"><div><label>收货人</label>陈知远</div><div><label>联系电话</label>138****6621</div></div>
<div style="margin-top:14px"><label>收货地址</label><p style="color:#4b5060;font-size:12px;line-height:1.7;margin-top:5px">上海市徐汇区漕溪北路 88 号<br>星海大厦 12F</p></div>
<div class="goods"><div class="pic"></div><div><b>拾光手冲咖啡套装</b><p>深空灰 / 标准版 · × 1</p></div></div>
<span class="link">联系客服 →</span><div class="tip">如包裹超过 48 小时未更新，可点击「联系客服」发起查件，我们会在 2 小时内回复。</div></aside></div>
`)

// ============ 4. 内容社区 ============
add("content", "资讯 / 博客首页", "头图文章 + 分类导航 + 卡片流 + 热门榜，媒体站首页",
    "媒体 / 列表 / 首页", "深潜 DEEPDIVE · 科技与商业",
    `
body{background:#fff;color:#17191f;font-size:13px}
.nav{height:70px;border-bottom:1px solid #eceef2;display:flex;align-items:center;padding:0 52px;gap:28px}
.logo{font-size:22px;font-weight:900;letter-spacing:-1px}.logo em{font-style:normal;color:#2f6bff}.nav a{color:#5d6270;font-size:13px}.nav .sp{flex:1}
.nav button{background:#17191f;color:#fff;border-radius:8px;padding:9px 17px;font-size:12px}
.wrap{max-width:1180px;margin:auto;padding:30px 52px 70px}
.topic{display:flex;gap:22px;border-bottom:1px solid #eceef2;padding-bottom:14px;font-size:13px;color:#8a90a0;margin-bottom:26px}.topic b{color:#17191f;border-bottom:2px solid #2f6bff;padding-bottom:14px}
.lead{display:grid;grid-template-columns:1.35fr 1fr;gap:20px;margin-bottom:34px}
.cover{height:330px;border-radius:16px;background:radial-gradient(circle at 70% 20%,#4d7bff,#1b2c6b 60%,#111a3d);padding:32px;display:flex;flex-direction:column;justify-content:end;color:#fff;position:relative;overflow:hidden}
.cover::after{content:"";position:absolute;right:-60px;top:-60px;width:280px;height:280px;border:60px solid rgba(255,255,255,.09);border-radius:50%}
.cover .k{font-size:11px;background:rgba(255,255,255,.18);padding:5px 11px;border-radius:999px;width:fit-content;margin-bottom:auto}
.cover h1{font-size:34px;line-height:1.35;letter-spacing:-1.3px}.cover p{color:#c3cdf5;font-size:12px;margin-top:12px}.cover .by{margin-top:18px;font-size:11px;color:#a9b6e6}
.side{display:flex;flex-direction:column;gap:16px}.side article{border:1px solid #eceef2;border-radius:14px;padding:22px;flex:1}
.side .k{font-size:11px;color:#2f6bff;font-weight:700}.side h3{font-size:19px;line-height:1.5;margin:12px 0 10px;letter-spacing:-.4px}
.side p{color:#8a90a0;font-size:12px;line-height:1.7}.side span{color:#a7acb8;font-size:11px;display:block;margin-top:14px}
.cols{display:grid;grid-template-columns:1fr 290px;gap:34px}.sec{display:flex;align-items:center;margin-bottom:20px}.sec h2{font-size:20px;letter-spacing:-.6px}.sec .sp{flex:1}.sec span{font-size:12px;color:#8a90a0}
.post{display:flex;gap:16px;padding:18px 0;border-bottom:1px solid #f0f1f5}.post .t{flex:1}
.post .k{font-size:11px;color:#2f6bff}.post h3{font-size:16px;margin:8px 0;line-height:1.5}.post p{color:#8a90a0;font-size:12px;line-height:1.7}
.post .meta{color:#a7acb8;font-size:11px;margin-top:10px}.post .pic{width:132px;height:94px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#dce6ff,#8fa9e8)}
.post:nth-child(3) .pic{background:linear-gradient(135deg,#ffe6d5,#e9a97c)}.post:nth-child(4) .pic{background:linear-gradient(135deg,#dff2e6,#8bc4a2)}.post:nth-child(5) .pic{background:linear-gradient(135deg,#e8ddff,#a98cf0)}
.rank{border:1px solid #eceef2;border-radius:14px;padding:20px;height:fit-content}.rank h3{font-size:15px;margin-bottom:16px}
.rank li{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid #f4f5f8;font-size:12px;line-height:1.6}.rank li:last-child{border:0}
.rank i{font-style:normal;font-size:17px;font-weight:800;color:#d3d7e0;min-width:20px}.rank li:first-child i{color:#2f6bff}
.tagbox{display:flex;gap:7px;flex-wrap:wrap;margin-top:18px}.tagbox span{background:#f3f5f9;border-radius:999px;padding:6px 11px;font-size:11px;color:#6d7280}
`,
    `
<nav class="nav"><div class="logo">深潜<em>DEEPDIVE</em></div><a>科技</a><a>商业</a><a>设计</a><a>人物</a><a>专栏</a><span class="sp"></span><a>搜索</a><button onclick="this.textContent='订阅成功 ✓'">订阅周刊</button></nav>
<div class="wrap"><div class="topic"><b>今日精选</b><span>人工智能</span><span>产品观察</span><span>创业公司</span><span>设计趋势</span><span>深度长文</span></div>
<section class="lead"><article class="cover"><span class="k">封面故事 · 深度</span><h1>当 AI 开始写需求文档，<br>产品经理还剩什么</h1>
<p>我们走访了 12 个已经把 AI 塞进研发流程的团队，发现真正被改变的不是岗位，而是协作的颗粒度。</p><span class="by">文 / 沈砚 · 2026 年 10 月 30 日 · 阅读 18 分钟</span></article>
<div class="side"><article><span class="k">快讯</span><h3>国内首个端侧多模态大模型<br>开源，手机可离线运行</h3><p>模型体积压缩至 1.8GB，在主流旗舰机上推理速度达到 32 token/s。</p><span>10 分钟前 · 2.4k 阅读</span></article>
<article><span class="k">观点</span><h3>别再做「全能型」后台了</h3><p>功能越多，用户完成第一件事的路径越长。克制才是效率。</p><span>2 小时前 · 6.8k 阅读</span></article></div></section>
<div class="cols"><div><div class="sec"><h2>最新文章</h2><span class="sp"></span><span>查看全部 →</span></div>
<article class="post"><div class="t"><span class="k">产品设计</span><h3>把 391 个组件做成一个页面之后，我们重新理解了设计系统</h3><p>一致性不来自规范文档，而来自每一次取舍时的同一个判断标准。</p><div class="meta">林澈 · 10-30 · 8.2k 阅读 · 42 评论</div></div><div class="pic"></div></article>
<article class="post"><div class="t"><span class="k">商业观察</span><h3>SaaS 定价的第三次转向：从席位到用量，再到结果</h3><p>当软件开始替客户完成工作，按人头收费的逻辑正在松动。</p><div class="meta">陈知远 · 10-29 · 5.6k 阅读 · 31 评论</div></div><div class="pic"></div></article>
<article class="post"><div class="t"><span class="k">工程实践</span><h3>零依赖单文件应用，在 2026 年还有意义吗</h3><p>不用构建、不用安装、双击即用 —— 被低估的交付形态。</p><div class="meta">周叙 · 10-28 · 12.4k 阅读 · 96 评论</div></div><div class="pic"></div></article>
<article class="post"><div class="t"><span class="k">设计趋势</span><h3>玻璃拟态退潮之后，界面开始重新拥抱「实体感」</h3><p>阴影、厚度、材质：拟物以一种更克制的方式回来了。</p><div class="meta">苏晚 · 10-27 · 3.9k 阅读 · 18 评论</div></div><div class="pic"></div></article></div>
<aside><div class="rank"><h3>🔥 本周热榜</h3><ul><li><i>01</i><span>AI 原生应用的交互范式，正在被重新定义</span></li><li><i>02</i><span>一个人做产品，第 100 天的复盘</span></li>
<li><i>03</i><span>我们删掉了后台 40% 的功能，留存反而涨了</span></li><li><i>04</i><span>2026 前端调查报告：工具链的收敛</span></li><li><i>05</i><span>为什么好设计总是「看不见」</span></li></ul>
<div class="tagbox"><span>#AI 原生</span><span>#设计系统</span><span>#独立开发</span><span>#数据可视化</span></div></div></aside></div></div>
`)

add("content", "文章阅读页", "舒适正文排版 + 侧边目录 + 作者卡 + 评论区，长文阅读体验",
    "阅读 / 排版 / 长文", "文章 · 深潜 DEEPDIVE",
    `
body{background:#fff;color:#24262d;font-size:14px}
.nav{height:64px;border-bottom:1px solid #eceef2;display:flex;align-items:center;padding:0 48px;gap:12px}
.logo{font-size:19px;font-weight:900;letter-spacing:-1px}.logo em{font-style:normal;color:#2f6bff}.nav .sp{flex:1}.nav span{color:#8a90a0;font-size:12px}
.progress{height:3px;background:#eef0f5;position:sticky;top:0;z-index:5}.progress i{display:block;height:100%;width:38%;background:#2f6bff}
.wrap{max-width:1080px;margin:auto;padding:44px 48px 80px;display:grid;grid-template-columns:1fr 220px;gap:60px}
.art h1{font-size:40px;line-height:1.35;letter-spacing:-1.8px}.art .sub{color:#7d8290;font-size:16px;line-height:1.8;margin-top:18px}
.by{display:flex;align-items:center;gap:12px;margin:28px 0 34px;padding-bottom:24px;border-bottom:1px solid #f0f1f5}
.av{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#7d92ff,#4a63d8);color:#fff;display:grid;place-items:center;font-weight:700}
.by b{font-size:13px}.by small{display:block;color:#9aa0ac;font-size:11px;margin-top:4px}.by .sp{flex:1}
.by button{border:1px solid #e3e6ed;border-radius:8px;padding:8px 15px;font-size:12px;background:#fff}
.cover{height:300px;border-radius:14px;background:radial-gradient(circle at 30% 25%,#8ea8ff,#3b56b8 50%,#1b2a63);margin-bottom:36px}
.art p{font-size:16px;line-height:2;color:#3a3e48;margin-bottom:22px}.art h2{font-size:24px;letter-spacing:-.6px;margin:44px 0 18px}
.art blockquote{border-left:3px solid #2f6bff;background:#f7f9ff;padding:18px 22px;margin:28px 0;color:#4a5573;font-size:15px;line-height:1.9;border-radius:0 10px 10px 0}
.art ul{margin:0 0 24px;padding-left:22px}.art li{line-height:2;color:#3a3e48;margin-bottom:6px}
.tags{display:flex;gap:8px;margin:36px 0}.tags span{background:#f3f5f9;color:#6d7280;font-size:12px;padding:6px 12px;border-radius:999px}
.reacts{display:flex;gap:10px;border-top:1px solid #f0f1f5;border-bottom:1px solid #f0f1f5;padding:18px 0;margin-bottom:32px}
.reacts button{border:1px solid #e3e6ed;border-radius:9px;padding:9px 16px;font-size:13px}.reacts .sp{flex:1}
.comment{display:flex;gap:12px;padding:16px 0;border-bottom:1px solid #f4f5f8}.comment .av{width:36px;height:36px;font-size:12px;flex-shrink:0;background:#e8edff;color:#4a63d8}
.comment b{font-size:12px}.comment span{color:#a0a5b0;font-size:11px;margin-left:8px}.comment p{font-size:13px;line-height:1.8;color:#4b5060;margin:6px 0 0}
.side{position:sticky;top:30px;height:fit-content}.side h4{font-size:12px;color:#9aa0ac;letter-spacing:1px;margin-bottom:14px}
.side a{display:block;padding:8px 0 8px 12px;border-left:2px solid #eef0f5;color:#8a90a0;font-size:12px;line-height:1.5}
.side a.on{border-color:#2f6bff;color:#2f6bff;font-weight:700}.author{background:#f7f9fc;border:1px solid #eceff5;border-radius:12px;padding:16px;margin-top:28px}
.author b{font-size:13px}.author p{font-size:11px;color:#8a90a0;line-height:1.8;margin-top:8px}
`,
    `
<nav class="nav"><div class="logo">深潜<em>DEEPDIVE</em></div><span class="sp"></span><span>科技 / 产品设计</span><span>·</span><span>字体 Aa</span></nav>
<div class="progress"><i></i></div>
<div class="wrap"><article class="art"><h1>把 391 个组件做成一个页面之后，<br>我们重新理解了设计系统</h1>
<p class="sub">一致性不来自规范文档，而来自每一次取舍时的同一个判断标准。这是一次关于「克制」的复盘。</p>
<div class="by"><div class="av">林</div><div><b>林澈</b><small>独立产品设计师 · 2026-10-30 · 阅读 12 分钟</small></div><span class="sp"></span><button onclick="this.textContent='已关注 ✓'">+ 关注</button></div>
<div class="cover"></div>
<p>最开始，这只是个内部用的速查表。我们把项目里反复出现的按钮、弹窗、图表收进一个 HTML 文件，方便开会时快速指认：「就长这样」。没想到三个月后，它成了团队里被打开次数最多的页面。</p>
<p>原因很简单：大家不需要理解一套抽象原则，只需要看到一个具体的东西。规范文档里的「间距保持呼吸感」，远不如一张卡片来得直接。</p>
<h2>一、consistency 是被「用」出来的</h2>
<p>我们曾经花两周写过一份 60 页的设计规范，包含颜色变量、字阶、圆角、动效曲线。半年后回头看，真正被遵守的只有其中不到三分之一。剩下的部分，要么太抽象，要么在真实场景里根本不成立。</p>
<blockquote>规范不是写给别人看的说明书，是一群人反复做同一个判断之后，留下的共同习惯。</blockquote>
<p>于是我们换了个做法：不再先写规则，而是先把具体页面做出来。每加一个组件，先问「它和旁边那个是不是一家人」。这个问题比任何 token 命名都有效。</p>
<h2>二、三个真正起作用的约束</h2>
<ul><li><b>只保留一种强调色。</b>当页面里只有一个紫色按钮时，用户的视线不需要学习。</li><li><b>圆角不超过三档。</b>12px、20px、999px，够用了。</li><li><b>所有卡片同高，所有标题同阶。</b>网格自己会建立秩序。</li></ul>
<h2>三、下一步：从组件到页面</h2>
<p>组件解决的是局部，页面解决的是路径。当用户要在你的产品里完成一件事，他看到的是整页，不是单个按钮。所以我们开始按业务场景重新组织这些内容：落地页、后台、电商、内容社区、工具、移动端。</p>
<p>这不是把卡片重新分个组，而是承认一件事 —— 展示的价值，最终要落回「这个页面能不能用」。</p>
<div class="tags"><span>#设计系统</span><span>#组件库</span><span>#产品复盘</span></div>
<div class="reacts"><button onclick="this.textContent='已赞 129 ♥'">♡ 128 赞</button><button>▤ 收藏</button><button>↗ 分享</button><span class="sp"></span><span style="color:#9aa0ac;font-size:12px;padding-top:10px">96 条评论</span></div>
<h2 style="margin-top:0;font-size:18px">评论</h2>
<div class="comment"><div class="av">陈</div><div><b>陈知远 <span>2 小时前</span></b><p>「一致性是用出来的」这句太准了，我们那份规范也躺在文档库里吃灰。</p></div></div>
<div class="comment"><div class="av">苏</div><div><b>苏晚 <span>5 小时前</span></b><p>圆角三档这个约束很实用，准备直接抄走。</p></div></div></article>
<aside class="side"><h4>本文目录</h4><a class="on">一、consistency 是被「用」出来的</a><a>二、三个真正起作用的约束</a><a>三、下一步：从组件到页面</a>
<div class="author"><b>关于作者</b><p>林澈，独立产品设计师。专注 B 端工具与品牌体验，偶尔写点关于设计判断的复盘。</p></div></aside></div>
`)

add("content", "社区话题列表", "帖子流 + 投票互动 + 热门话题侧栏，论坛 / 社区首页",
    "社区 / 信息流 / 互动", "屿见 · 设计与产品社区",
    `
body{background:#f6f7fb;color:#24262d;font-size:13px}
.nav{height:64px;background:#fff;border-bottom:1px solid #e9ecf1;display:flex;align-items:center;padding:0 46px;gap:26px}
.logo{font-size:20px;font-weight:900;color:#3b56d8}.logo em{font-style:normal;color:#f2994a}.nav a{color:#6d7280}.nav .sp{flex:1}
.search{background:#f3f5f9;border-radius:999px;padding:9px 18px;color:#a2a7b3;font-size:12px;width:250px}
.nav button{background:#3b56d8;color:#fff;border-radius:9px;padding:9px 18px;font-size:12px;font-weight:700}
.wrap{max-width:1120px;margin:26px auto 70px;display:grid;grid-template-columns:1fr 290px;gap:20px;align-items:start}
.tabs{background:#fff;border:1px solid #e9ecf1;border-radius:13px;padding:6px;display:flex;gap:4px;margin-bottom:14px}
.tabs button{padding:9px 18px;border-radius:9px;font-size:13px;color:#6d7280}.tabs button.on{background:#3b56d8;color:#fff;font-weight:700}
.post{background:#fff;border:1px solid #e9ecf1;border-radius:14px;padding:20px;margin-bottom:12px}
.post .head{display:flex;gap:10px;align-items:center}.post .av{width:34px;height:34px;border-radius:50%;background:#dfe6ff;color:#3b56d8;display:grid;place-items:center;font-weight:700;font-size:12px}
.post .head b{font-size:12px}.post .head span{color:#a2a7b3;font-size:11px;margin-left:8px}.post .head .sp{flex:1}.post .head em{font-style:normal;background:#fff3e6;color:#d1812f;font-size:10px;padding:5px 10px;border-radius:999px}
.post h3{font-size:17px;letter-spacing:-.3px;margin:14px 0 9px}.post p{color:#6d7280;font-size:12px;line-height:1.8}
.post .img{height:120px;border-radius:10px;background:linear-gradient(135deg,#dfe6ff,#9db1e8);margin-top:14px}
.post .foot{display:flex;gap:18px;margin-top:16px;color:#8a90a0;font-size:12px}.post .foot span{cursor:pointer}.post .foot .sp{flex:1}
.vote{display:flex;align-items:center;gap:8px;background:#f3f6ff;border-radius:8px;padding:5px 10px;color:#3b56d8;font-weight:700}
.side>div{background:#fff;border:1px solid #e9ecf1;border-radius:14px;padding:20px;margin-bottom:14px}
.side h3{font-size:14px;margin-bottom:14px}.topic{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f8;font-size:12px}
.topic:last-child{border:0}.topic i{font-style:normal;color:#d0d4de;font-weight:800;width:18px}.topic:first-of-type i{color:#f2994a}
.topic .sp{flex:1}.topic b{color:#3b56d8;font-weight:500}.topic small{color:#a2a7b3;font-size:11px}
.stat{display:flex;justify-content:space-between;text-align:center}.stat div b{display:block;font-size:20px}.stat div span{font-size:11px;color:#a2a7b3}
.notice{background:linear-gradient(135deg,#3b56d8,#6a7ff0);color:#fff;border:0}.notice h3{color:#fff}.notice p{font-size:12px;line-height:1.8;color:#dbe2ff;margin-bottom:14px}
.notice button{background:#fff;color:#3b56d8;border-radius:8px;padding:9px 18px;font-size:12px;font-weight:700}
`,
    `
<nav class="nav"><div class="logo">屿<em>见</em> YUJIAN</div><a>首页</a><a>话题</a><a>作品</a><a>招聘</a><span class="sp"></span><div class="search">⌕ 搜索帖子、话题或用户</div><button onclick="this.textContent='编辑器已打开 ✓'">发布内容</button></nav>
<div class="wrap"><div><div class="tabs"><button class="on" onclick="tab(this)">推荐</button><button onclick="tab(this)">最新</button><button onclick="tab(this)">热议</button><button onclick="tab(this)">关注</button><button onclick="tab(this)">精华</button></div>
<article class="post"><div class="head"><div class="av">林</div><div><b>林澈</b><span>2 小时前 · 发布于 设计讨论</span></div><span class="sp"></span><em>精华</em></div>
<h3>做了 8 年 B 端，我总结出 5 条「别这么做」</h3><p>1）别把筛选条件全摊在首屏；2）别用颜色单独表达状态；3）别让空页面只显示「暂无数据」；4）别把危险操作放在顺手的位置；5）别相信「用户会自己发现」……完整展开聊聊第 3 条。</p>
<div class="img"></div><div class="foot"><span class="vote" onclick="vote(this)">▲ 128</span><span>💬 42 条评论</span><span>↗ 分享</span><span class="sp"></span><span>收藏</span></div></article>
<article class="post"><div class="head"><div class="av" style="background:#ffe9d6;color:#d1812f">陈</div><div><b>陈知远</b><span>5 小时前 · 发布于 产品观察</span></div><span class="sp"></span></div>
<h3>你们的团队，多久没人认真看过一次「新手首次使用」的全流程了？</h3><p>上周我们以新用户身份走了一遍自己的注册到上手，一共卡了 4 次。最离谱的一处是必填项没标红，提交后只提示「请检查输入」。</p>
<div class="foot"><span class="vote" onclick="vote(this)">▲ 96</span><span>💬 87 条评论</span><span>↗ 分享</span><span class="sp"></span><span>收藏</span></div></article>
<article class="post"><div class="head"><div class="av" style="background:#dff2e6;color:#2f9660">苏</div><div><b>苏晚</b><span>昨天 · 发布于 作品展示</span></div><span class="sp"></span><em>热门</em></div>
<h3>用一个 HTML 文件做完整个组件图库，附 391 个效果</h3><p>零依赖、双击即用、支持中文搜索和技术栈切换。写的过程中最大的收获不是代码，是想清楚了「展示」和「复用」的边界。</p>
<div class="foot"><span class="vote" onclick="vote(this)">▲ 243</span><span>💬 156 条评论</span><span>↗ 分享</span><span class="sp"></span><span>收藏</span></div></article></div>
<aside class="side"><div class="notice"><h3>欢迎来到屿见 👋</h3><p>一个聊设计、产品与独立开发的地方。少一点转发，多一点真实经验。</p><button onclick="this.textContent='已加入 ✓'">加入社区</button></div>
<div><h3>🔥 热门话题</h3><div class="topic"><i>01</i><span class="sp"><b># 设计系统到底有没有用</b></span><small>328 帖</small></div>
<div class="topic"><i>02</i><span class="sp"><b># AI 会替代 UI 设计师吗</b></span><small>271 帖</small></div>
<div class="topic"><i>03</i><span class="sp"><b># 独立开发第一年</b></span><small>196 帖</small></div>
<div class="topic"><i>04</i><span class="sp"><b># 那些难用到离谱的后台</b></span><small>184 帖</small></div></div>
<div><h3>社区数据</h3><div class="stat"><div><b>12.4k</b><span>成员</span></div><div><b>8,206</b><span>帖子</span></div><div><b>342</b><span>今日在线</span></div></div></div></aside></div>
<script>tab=function(b){[...b.parentNode.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')};vote=function(e){var n=+e.textContent.replace(/\D/g,'');e.textContent='▲ '+(n+1);e.style.background='#e2e8ff'}</script>
`)

add("content", "个人主页", "封面头图 + 身份信息 + 数据指标 + 作品网格，创作者主页",
    "个人主页 / 作品网格", "苏晚 · 个人主页",
    `
body{background:#f7f8fb;color:#1e2028;font-size:13px}
.nav{height:62px;background:#fff;border-bottom:1px solid #eceef2;display:flex;align-items:center;padding:0 48px;gap:10px}
.nav b{font-size:17px;color:#6b5bd6}.nav .sp{flex:1}.nav span{color:#8a90a0;font-size:12px}
.cover{height:210px;background:radial-gradient(circle at 20% 20%,#b9a7ff,#7c6bd6 45%,#4d4a9e);position:relative}
.cover::after{content:"";position:absolute;right:8%;top:-40px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.08)}
.wrap{max-width:1040px;margin:auto;padding:0 48px 70px}
.profile{background:#fff;border:1px solid #eceef2;border-radius:0 0 18px 18px;padding:0 28px 24px;display:flex;gap:20px;align-items:flex-end;margin-top:-46px;position:relative}
.av{width:96px;height:96px;border-radius:24px;background:linear-gradient(135deg,#ffd6b8,#e58d6c);border:4px solid #fff;display:grid;place-items:center;font-size:32px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 10px 24px rgba(60,50,80,.14)}
.profile .txt{flex:1;padding-bottom:4px}.profile h1{font-size:24px;letter-spacing:-.7px}.profile h1 span{font-size:11px;background:#eeeaff;color:#6b5bd6;padding:4px 9px;border-radius:999px;vertical-align:middle;margin-left:8px}
.profile p{color:#8a90a0;font-size:12px;margin-top:9px;line-height:1.7}.profile .loc{font-size:11px;color:#a2a7b3;margin-top:8px}
.profile button{background:#6b5bd6;color:#fff;border-radius:10px;padding:11px 22px;font-size:13px;font-weight:700;margin-bottom:4px}
.profile button.line{background:#fff;color:#5d6270;border:1px solid #e3e6ed;font-weight:400;margin-left:8px}
.metrics{display:flex;gap:0;background:#fff;border:1px solid #eceef2;border-top:0;border-radius:0 0 16px 16px;padding:16px 28px;margin-bottom:24px}
.metrics div{padding:0 30px;border-right:1px solid #f0f1f5}.metrics div:first-child{padding-left:0}.metrics div:last-child{border:0}
.metrics b{display:block;font-size:20px}.metrics span{font-size:11px;color:#9aa0ac}
.tabs{display:flex;gap:26px;border-bottom:1px solid #eceef2;margin-bottom:22px;font-size:13px;color:#8a90a0}.tabs b{color:#6b5bd6;border-bottom:2px solid #6b5bd6;padding-bottom:12px}
.works{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.work{background:#fff;border:1px solid #eceef2;border-radius:14px;overflow:hidden}
.work .pic{height:150px;background:linear-gradient(135deg,#dcd4ff,#8f7ee0)}.work:nth-child(2) .pic{background:linear-gradient(135deg,#ffdfd2,#e79b81)}
.work:nth-child(3) .pic{background:linear-gradient(135deg,#d7ecff,#7faee0)}.work:nth-child(4) .pic{background:linear-gradient(135deg,#dff2e6,#83c2a0)}
.work:nth-child(5) .pic{background:linear-gradient(135deg,#ffeecb,#d9ae5d)}.work:nth-child(6) .pic{background:linear-gradient(135deg,#e8ddff,#a98cf0)}
.work .t{padding:15px}.work b{font-size:14px}.work p{color:#9aa0ac;font-size:11px;margin-top:7px}.work .foot{display:flex;gap:14px;color:#a2a7b3;font-size:11px;margin-top:12px}
.about{display:grid;grid-template-columns:1fr 260px;gap:20px;margin-top:26px}.about>div{background:#fff;border:1px solid #eceef2;border-radius:14px;padding:22px}
.about h3{font-size:14px;margin-bottom:14px}.about p{color:#6d7280;font-size:12px;line-height:1.9}.skill{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.skill span{background:#f3f4f9;border-radius:999px;padding:6px 11px;font-size:11px;color:#6d7280}
`,
    `
<nav class="nav"><b>◈ 屿见</b><span class="sp"></span><span>发现</span><span>·</span><span>话题</span><span>·</span><span>消息</span></nav>
<div class="cover"></div><div class="wrap"><section class="profile"><div class="av">苏</div>
<div class="txt"><h1>苏晚 <span>PRO 创作者</span></h1><p>产品设计师 / 独立开发者 · 喜欢做小而完整的工具，也写点关于界面判断的文章</p>
<div class="loc">📍 杭州 · 🔗 suwan.design · 加入于 2023 年 4 月</div></div>
<button class="line" onclick="this.textContent='消息已发送 ✓'">发消息</button><button onclick="this.textContent='已关注 ✓'">+ 关注</button></section>
<section class="metrics"><div><b>128</b><span>作品</span></div><div><b>12.4k</b><span>关注者</span></div><div><b>236</b><span>正在关注</span></div><div><b>48.6k</b><span>获赞与收藏</span></div><div><b>36</b><span>文章</span></div></section>
<div class="tabs"><b>作品 128</b><span>文章 36</span><span>收藏 84</span><span>动态 212</span></div>
<section class="works">
<article class="work"><div class="pic"></div><div class="t"><b>组件图库 Pro · 391 个效果</b><p>零依赖单文件 · 设计系统</p><div class="foot"><span>♡ 2.4k</span><span>👁 18.6k</span><span>10-28</span></div></div></article>
<article class="work"><div class="pic"></div><div class="t"><b>拾光咖啡 · 品牌与包装</b><p>视觉识别 · 品牌设计</p><div class="foot"><span>♡ 1.2k</span><span>👁 9.8k</span><span>10-12</span></div></div></article>
<article class="work"><div class="pic"></div><div class="t"><b>潮汐 · 习惯养成 App</b><p>移动端 · 交互设计</p><div class="foot"><span>♡ 986</span><span>👁 7.2k</span><span>09-30</span></div></div></article>
<article class="work"><div class="pic"></div><div class="t"><b>北岸数据监控台</b><p>数据可视化 · B 端</p><div class="foot"><span>♡ 824</span><span>👁 6.4k</span><span>09-18</span></div></div></article>
<article class="work"><div class="pic"></div><div class="t"><b>秋日限定 · 海报系列</b><p>平面 · 版式</p><div class="foot"><span>♡ 762</span><span>👁 5.1k</span><span>09-02</span></div></div></article>
<article class="work"><div class="pic"></div><div class="t"><b>AI 助手对话界面探索</b><p>概念设计 · 动效</p><div class="foot"><span>♡ 1.8k</span><span>👁 12.3k</span><span>08-21</span></div></div></article></section>
<section class="about"><div><h3>关于</h3><p>做了 6 年产品设计与前端实现，目前在独立开发一些小工具。相信好的界面应该安静、清楚、让人少想一步。接品牌体验、B 端工具与数据可视化相关的合作，也欢迎单纯聊聊想法。</p>
<div class="skill"><span>产品设计</span><span>设计系统</span><span>TypeScript</span><span>Figma</span><span>数据可视化</span></div></div>
<div><h3>最近动态</h3><p style="color:#4b5060">发布了作品「组件图库 Pro」<br><span style="color:#a2a7b3">10 月 28 日</span></p>
<p style="margin-top:14px;color:#4b5060">在话题 #设计系统到底有没有用 中回复<br><span style="color:#a2a7b3">10 月 24 日</span></p></div></section></div>
`)

// ============ 5. 工具应用 ============
add("tools", "AI 聊天工作台", "会话侧栏 + 消息流 + 流式输出态 + 多模态输入框，AI 产品标配",
    "AI / 对话 / 工作台", "知微 AI 工作台",
    `
body{display:flex;background:#fbfbfd;color:#20222b;font-size:13px;height:100vh}
.hist{width:248px;background:#f4f5f9;border-right:1px solid #e9ebf1;padding:18px 12px;flex-shrink:0;display:flex;flex-direction:column}
.hist .logo{font-size:16px;font-weight:800;padding:4px 8px 18px}.hist .logo em{font-style:normal;color:#6d5bd6}
.new{background:#20222b;color:#fff;border-radius:10px;padding:11px;text-align:center;font-size:12px;font-weight:700;margin-bottom:18px}
.hist .grp{font-size:10px;letter-spacing:1.5px;color:#a2a7b3;padding:10px 8px 8px}
.hist a{display:block;padding:10px;border-radius:9px;color:#5d6270;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hist a.on{background:#fff;color:#20222b;font-weight:700;box-shadow:0 2px 8px rgba(30,35,50,.05)}
.hist .sp{flex:1}.me{display:flex;gap:9px;align-items:center;border-top:1px solid #e6e8ef;padding-top:14px;font-size:12px}
.me i{width:30px;height:30px;border-radius:50%;background:#6d5bd6;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:700}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.top{height:60px;border-bottom:1px solid #edeff4;display:flex;align-items:center;padding:0 26px;gap:12px;background:#fff}
.top b{font-size:14px}.top span{color:#a2a7b3;font-size:11px}.top .sp{flex:1}.top button{border:1px solid #e6e8ef;border-radius:8px;padding:8px 13px;font-size:12px;color:#6d7280}
.chat{flex:1;overflow:auto;padding:34px 0 20px}.inner{max-width:760px;margin:auto;padding:0 26px}
.msg{display:flex;gap:12px;margin-bottom:26px}.msg .av{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;font-size:13px;font-weight:800}
.msg.me .av{background:#20222b;color:#fff}.msg.ai .av{background:linear-gradient(135deg,#8f7bf0,#5b48c9);color:#fff}
.bubble{background:#f2f3f8;border-radius:4px 14px 14px 14px;padding:14px 17px;line-height:1.9;font-size:13px;color:#3d414d}
.msg.ai .bubble{background:#fff;border:1px solid #eceef4;box-shadow:0 4px 14px rgba(30,35,50,.04)}
.msg.ai .bubble h4{font-size:13px;margin:12px 0 6px}.msg.ai .bubble p{color:#5d6270;font-size:12.5px}.msg.ai .bubble li{font-size:12.5px;color:#5d6270;line-height:2;padding-left:18px;position:relative}
.msg.ai .bubble li::before{content:"•";position:absolute;left:4px;color:#6d5bd6}
.code{background:#171a22;color:#c9d2e3;border-radius:9px;padding:13px 15px;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;line-height:1.8;margin:12px 0;white-space:pre-wrap}
.tools{display:flex;gap:8px;margin-top:14px}.tools span{border:1px solid #e6e8ef;border-radius:8px;padding:6px 11px;font-size:11px;color:#6d7280;background:#fff}
.cursor{display:inline-block;width:6px;height:14px;background:#6d5bd6;vertical-align:-2px;animation:bk 1s steps(1) infinite}@keyframes bk{50%{opacity:0}}
.composer{max-width:760px;width:100%;margin:0 auto 22px;padding:0 26px}
.box{border:1px solid #e3e6ee;border-radius:16px;background:#fff;box-shadow:0 8px 30px rgba(30,35,50,.07);padding:14px}
.box textarea{width:100%;border:0;outline:0;resize:none;font:inherit;font-size:13px;color:#3d414d;background:transparent}
.bar{display:flex;gap:8px;align-items:center;margin-top:12px}.bar span{font-size:11px;color:#8a90a0;border:1px solid #eceef4;border-radius:8px;padding:6px 10px}
.bar .sp{flex:1}.send{background:#6d5bd6;color:#fff;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-weight:800}
.hint{text-align:center;color:#b0b4c0;font-size:11px;margin-top:10px}
`,
    `
<aside class="hist"><div class="logo">知<em>微</em> AI</div><button class="new" onclick="this.textContent='已新建会话 ✓'">+ 新建会话</button>
<div class="grp">今天</div><a class="on">重构订单页的信息层级</a><a>周报摘要 · 第 43 周</a><a>解释一下 RLS 策略</a>
<div class="grp">近 7 天</div><a>落地页文案 A/B 测试</a><a>TypeScript 类型体操答疑</a><a>监控告警收敛方案</a><a>组件库分类梳理</a>
<span class="sp"></span><div class="me"><i>陈</i><div><b>陈知远</b><br><span style="color:#a2a7b3;font-size:11px">专业版 · 剩余 8,420 积分</span></div></div></aside>
<div class="main"><header class="top"><b>重构订单页的信息层级</b><span>· 已自动保存</span><span class="sp"></span><button>分享</button><button>⌘K 搜索</button></header>
<div class="chat"><div class="inner">
<div class="msg me"><div class="av">陈</div><div class="bubble">订单列表里有 5 个状态和 8 个字段，运营同学反馈找不到重点。帮我理一下信息层级。</div></div>
<div class="msg ai"><div class="av">✦</div><div class="bubble"><p>先看一个判断：这一页的<b>主任务</b>是「找出需要处理的订单并操作」，不是「浏览所有订单」。按这个目标重排：</p>
<h4>1. 把状态变成筛选，而不是列</h4><p>顶部用 5 个状态 Tab 直接分流，表格里只保留必要标记。待付款 / 待发货 这类需要动作的排在前面。</p>
<h4>2. 字段按决策顺序排列</h4><ul><li>第一屏：订单号 + 商品 + 买家 + 金额 + 状态 + 操作</li><li>次要信息（运费、下单渠道、备注）收进详情抽屉</li><li>时间统一放右下角，不参与扫视路径</li></ul>
<h4>3. 批量操作前置</h4><p>86 笔待发货如果逐条点，是纯体力活。表格加勾选与批量发货。</p>
<div class="code">// 建议的状态优先级（决定 Tab 顺序）
const ORDER_TABS = ['待付款', '待发货', '运输中', '已完成', '已关闭'];</div>
<p>改完之后可以埋一个指标：从进页面到点第一个「发货」的中位耗时。<span class="cursor"></span></p>
<div class="tools"><span>📋 复制建议</span><span>↻ 重新生成</span><span>👍 有帮助</span></div></div></div></div></div>
<div class="composer"><div class="box"><textarea rows="2" placeholder="继续追问，或粘贴一段代码让知微分析…"></textarea>
<div class="bar"><span>📎 附件</span><span>🌐 联网搜索</span><span>🧠 深度思考</span><span class="sp"></span><span style="border:0;color:#a2a7b3">Claude Sonnet 4 ▾</span><button class="send" onclick="this.textContent='✓'">↑</button></div></div>
<div class="hint">知微可能会出错，重要信息请核对 · 按 Enter 发送，Shift + Enter 换行</div></div></div>
`)

add("tools", "在线代码编辑器", "文件树 + 语法高亮代码区 + 标签页 + 终端面板，IDE 布局",
    "IDE / 编辑器 / 开发工具", "Orbit Studio · 代码编辑器",
    `
body{background:#14171f;color:#c9d1e0;font-size:12px;height:100vh;display:flex;flex-direction:column;font-family:Inter,"Segoe UI",sans-serif}
.title{height:38px;background:#1b1f29;border-bottom:1px solid #272c38;display:flex;align-items:center;padding:0 14px;gap:8px;font-size:11px;color:#8b95a8}
.title i{width:10px;height:10px;border-radius:50%;display:inline-block}.title .sp{flex:1}
.body{flex:1;display:flex;min-height:0}
.rail{width:48px;background:#181c25;border-right:1px solid #262b37;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 0;color:#6e788c;font-size:16px}
.rail span{width:34px;height:34px;border-radius:8px;display:grid;place-items:center}.rail span.on{background:#2a3040;color:#a99bff}
.tree{width:210px;background:#1b1f29;border-right:1px solid #272c38;padding:14px 10px;flex-shrink:0}
.tree h4{font-size:10px;letter-spacing:1.5px;color:#6e788c;padding:0 8px 12px}
.tree div{padding:6px 8px;border-radius:6px;color:#97a1b4;white-space:nowrap}.tree div.on{background:#2a3040;color:#fff}
.tree .in{padding-left:22px}.tree .in2{padding-left:36px}.tree .ts{color:#6fa8ff}.tree .css{color:#c792ea}.tree .json{color:#e5c07b}
.editor{flex:1;min-width:0;display:flex;flex-direction:column}
.tabs{height:38px;background:#181c25;border-bottom:1px solid #272c38;display:flex}
.tabs div{padding:0 16px;display:flex;align-items:center;gap:8px;border-right:1px solid #272c38;color:#7f899c;font-size:11px}
.tabs div.on{background:#14171f;color:#e4e9f2;border-top:2px solid #a99bff}
.code{flex:1;display:flex;overflow:hidden;font-family:ui-monospace,Consolas,monospace;font-size:12px;line-height:1.85}
.ln{padding:16px 12px;text-align:right;color:#4c5568;background:#14171f;user-select:none;min-width:44px}
pre{margin:0;padding:16px 0;flex:1;overflow:hidden;color:#c9d1e0;white-space:pre}
.k{color:#c792ea}.s{color:#a5d6a7}.f{color:#82aaff}.c{color:#5d6779}.n{color:#f78c6c}.p{color:#89ddff}
.term{height:150px;background:#11141b;border-top:1px solid #2a3040;display:flex;flex-direction:column}
.term .th{display:flex;gap:18px;padding:9px 16px;border-bottom:1px solid #232834;color:#7f899c;font-size:11px}.term .th b{color:#a99bff;font-weight:600}
.term pre{padding:12px 16px;font-size:11.5px;line-height:1.9;color:#9fb0c8}
.status{height:24px;background:#2b3350;color:#c3cdec;display:flex;align-items:center;padding:0 12px;gap:16px;font-size:10.5px}
.status .sp{flex:1}
`,
    `
<div class="title"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span style="margin-left:10px">orbit-studio — gallery-pro</span><span class="sp"></span><span>main*</span><span>◉ 已同步</span></div>
<div class="body"><div class="rail"><span class="on">▤</span><span>⌕</span><span>⑂</span><span>▣</span><span>◈</span><span style="margin-top:auto">⚙</span></div>
<aside class="tree"><h4>EXPLORER · GALLERY-PRO</h4><div>▾ 📁 src</div><div class="in">▾ 📁 components</div><div class="in2 on ts">◉ Card.tsx</div><div class="in2 ts">◉ FilterBar.tsx</div><div class="in2 css">◉ tokens.css</div><div class="in">▾ 📁 pages</div><div class="in2 ts">◉ Landing.tsx</div><div class="in2 ts">◉ Dashboard.tsx</div><div class="in ts">◉ main.ts</div><div class="in css">◉ index.css</div><div>▸ 📁 public</div><div class="json">◉ package.json</div><div class="json">◉ tsconfig.json</div><div>▾ 📄 README.md</div></aside>
<div class="editor"><div class="tabs"><div>Card.tsx</div><div>FilterBar.tsx</div><div class="on">◉ <b style="color:#82aaff">main.ts</b> ✕</div><div>tokens.css</div></div>
<div class="code"><div class="ln">1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20</div>
<pre><span class="c">// 组件图库入口 · 零运行时依赖</span>
<span class="k">import</span> { <span class="f">mountGallery</span> } <span class="k">from</span> <span class="s">'./gallery'</span>;
<span class="k">import</span> <span class="k">type</span> { <span class="p">GalleryOptions</span> } <span class="k">from</span> <span class="s">'./types'</span>;

<span class="k">const</span> <span class="n">options</span>: <span class="p">GalleryOptions</span> = {
  <span class="f">category</span>: <span class="s">'all'</span>,
  <span class="f">searchable</span>: <span class="k">true</span>,
  <span class="f">stack</span>: <span class="s">'react'</span>,
  <span class="f">reduceMotion</span>: <span class="k">true</span>,
};

<span class="k">const</span> <span class="f">render</span> = (): <span class="p">void</span> =&gt; {
  <span class="k">const</span> <span class="n">root</span> = <span class="n">document</span>.<span class="f">querySelector</span>(<span class="s">'#app'</span>);
  <span class="k">if</span> (!<span class="n">root</span>) <span class="k">throw new</span> <span class="f">Error</span>(<span class="s">'#app not found'</span>);
  <span class="f">mountGallery</span>(<span class="n">root</span>, <span class="n">options</span>);
};

<span class="n">document</span>.<span class="f">addEventListener</span>(<span class="s">'DOMContentLoaded'</span>, <span class="f">render</span>);</pre></div>
<div class="term"><div class="th"><b>TERMINAL</b><span>PROBLEMS 0</span><span>OUTPUT</span><span>DEBUG CONSOLE</span></div>
<pre><span style="color:#a5d6a7">➜</span> gallery-pro <span style="color:#82aaff">npm run dev</span>
  VITE v6.2.1  ready in 342 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
<span style="color:#5d6779">✓ 391 components compiled · 0 errors · 0 warnings</span>
<span style="color:#a5d6a7">➜</span> gallery-pro <span style="color:#f78c6c">█</span></pre></div></div></div>
<div class="status"><span>⑂ main*</span><span>⊗ 0  ⚠ 0</span><span class="sp"></span><span>Ln 12, Col 34</span><span>UTF-8</span><span>LF</span><span>TypeScript</span><span>Prettier</span></div>
`)

add("tools", "项目看板", "四列 Kanban + 优先级标签 + 成员头像 + 拖拽视觉，协作管理页",
    "看板 / 任务 / 协作", "云枢 · 项目看板",
    `
body{background:#f6f7fa;color:#22242c;font-size:13px;height:100vh}
.top{height:64px;background:#fff;border-bottom:1px solid #e9ebf1;display:flex;align-items:center;padding:0 28px;gap:14px}
.top .logo{font-size:17px;font-weight:800}.top .logo em{font-style:normal;color:#6c5cff}.top .sp{flex:1}
.top button{border:1px solid #e3e6ed;border-radius:9px;padding:9px 14px;font-size:12px;color:#5d6270;background:#fff}
.top button.pri{background:#6c5cff;color:#fff;border-color:#6c5cff;font-weight:700}
.av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}
.wrap{padding:24px 28px}.head{display:flex;align-items:end;margin-bottom:22px}
.head h1{font-size:24px;letter-spacing:-.7px}.head p{color:#8a90a0;font-size:12px;margin-top:7px}.head .sp{flex:1}
.tabs{display:flex;gap:22px;font-size:12px;color:#8a90a0}.tabs b{color:#6c5cff;border-bottom:2px solid #6c5cff;padding-bottom:8px}
.team{display:flex;margin-left:20px}.team .av{margin-left:-8px;border:2px solid #f6f7fa}
.board{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:start}
.col{background:#eef0f5;border-radius:14px;padding:12px;min-height:520px}
.col>h3{font-size:12px;font-weight:700;padding:6px 6px 14px;display:flex;align-items:center;gap:8px}
.col>h3 i{font-style:normal;background:#dfe2ea;color:#6d7280;border-radius:999px;padding:2px 8px;font-size:10px}
.col>h3 .sp{flex:1}.col>h3 span{color:#9aa0ac;font-size:14px}
.dot{width:8px;height:8px;border-radius:50%}
.card{background:#fff;border:1px solid #e8eaf0;border-radius:11px;padding:14px;margin-bottom:10px;box-shadow:0 2px 6px rgba(30,35,50,.04)}
.card:hover{box-shadow:0 8px 20px rgba(30,35,50,.1)}.card .tags{display:flex;gap:6px;margin-bottom:10px}
.tag{font-size:10px;padding:3px 8px;border-radius:6px}.tag.hi{background:#ffeded;color:#e05b5b}.tag.mid{background:#fff4e0;color:#d18b1f}.tag.low{background:#e8f8ee;color:#2fa866}
.tag.gray{background:#f1f2f6;color:#8a90a0}
.card h4{font-size:13px;line-height:1.55;font-weight:700}.card p{color:#9aa0ac;font-size:11px;line-height:1.6;margin-top:7px}
.prog{height:5px;background:#eef0f5;border-radius:5px;margin:12px 0}.prog i{display:block;height:100%;background:#6c5cff;border-radius:5px}
.card .foot{display:flex;align-items:center;gap:6px;margin-top:12px;color:#a2a7b3;font-size:10.5px}.card .foot .sp{flex:1}
.card .foot .av{width:24px;height:24px;font-size:10px}
.addcol{border:1px dashed #cfd4de;border-radius:10px;padding:11px;text-align:center;color:#9aa0ac;font-size:11px}
`,
    `
<header class="top"><div class="logo">云<em>枢</em></div><span>项目 / 工作台重构</span><span class="sp"></span><button>⌕ 搜索任务</button><button>筛选</button><button class="pri" onclick="this.textContent='已打开新建任务 ✓'">+ 新建任务</button><div class="av" style="background:#6c5cff">陈</div></header>
<div class="wrap"><div class="head"><div><h1>工作台重构 · 第 3 迭代</h1><p>2026/10/20 — 11/08 · 24 个任务 · 已完成 9 个</p></div><span class="sp"></span>
<div class="tabs"><b>看板</b><span>列表</span><span>甘特图</span><span>日历</span></div><div class="team"><div class="av" style="background:#f29a6c">林</div><div class="av" style="background:#5cbf9b">苏</div><div class="av" style="background:#a58cf0">周</div><div class="av" style="background:#e27f9c">何</div></div></div>
<div class="board">
<section class="col"><h3><i class="dot" style="background:#9aa0ac"></i>待办 <i>6</i><span class="sp"></span><span>+</span></h3>
<article class="card"><div class="tags"><span class="tag hi">高优</span><span class="tag gray">设计</span></div><h4>梳理订单页的字段优先级</h4><p>输出字段清单与折叠规则，需与运营确认</p><div class="foot"><span>📅 11-04</span><span class="sp"></span><div class="av" style="background:#f29a6c">林</div></div></article>
<article class="card"><div class="tags"><span class="tag mid">中优</span><span class="tag gray">前端</span></div><h4>筛选器支持多条件组合</h4><p>状态 + 时间 + 金额区间可叠加</p><div class="foot"><span>💬 3</span><span>📎 2</span><span class="sp"></span><div class="av" style="background:#5cbf9b">苏</div></div></article>
<article class="card"><div class="tags"><span class="tag low">低优</span><span class="tag gray">文档</span></div><h4>补齐组件使用说明</h4><div class="foot"><span>📅 11-10</span><span class="sp"></span><div class="av" style="background:#a58cf0">周</div></div></article>
<div class="addcol">+ 添加任务</div></section>
<section class="col"><h3><i class="dot" style="background:#6c5cff"></i>进行中 <i>4</i><span class="sp"></span><span>+</span></h3>
<article class="card"><div class="tags"><span class="tag hi">高优</span><span class="tag gray">前端</span></div><h4>页面模板板块：分类与全屏预览</h4><p>6 大业务场景，24 个整页模板</p><div class="prog"><i style="width:68%"></i></div><div class="foot"><span>✓ 8 / 12 子任务</span><span class="sp"></span><div class="av" style="background:#6c5cff">陈</div></div></article>
<article class="card"><div class="tags"><span class="tag mid">中优</span><span class="tag gray">设计</span></div><h4>空状态与错误态补完</h4><p>含骨架屏、重试入口、空搜索结果</p><div class="prog"><i style="width:35%"></i></div><div class="foot"><span>💬 5</span><span class="sp"></span><div class="av" style="background:#f29a6c">林</div></div></article>
<div class="addcol">+ 添加任务</div></section>
<section class="col"><h3><i class="dot" style="background:#f5b74f"></i>待验收 <i>3</i><span class="sp"></span><span>+</span></h3>
<article class="card"><div class="tags"><span class="tag gray">前端</span><span class="tag low">已自测</span></div><h4>搜索支持中英文混合关键词</h4><p>补了拼音首字母与英文标签索引</p><div class="foot"><span>📅 11-01</span><span class="sp"></span><div class="av" style="background:#5cbf9b">苏</div></div></article>
<article class="card"><div class="tags"><span class="tag gray">动效</span></div><h4>减少动态效果偏好适配</h4><div class="foot"><span>💬 2</span><span class="sp"></span><div class="av" style="background:#e27f9c">何</div></div></article>
<div class="addcol">+ 添加任务</div></section>
<section class="col"><h3><i class="dot" style="background:#2fa866"></i>已完成 <i>9</i><span class="sp"></span><span>+</span></h3>
<article class="card"><div class="tags"><span class="tag low">已上线</span></div><h4>组件库技术栈切换</h4><p>HTML / React / Vue 三种 Prompt 覆盖</p><div class="foot"><span>✓ 10-28</span><span class="sp"></span><div class="av" style="background:#6c5cff">陈</div></div></article>
<article class="card"><div class="tags"><span class="tag low">已上线</span></div><h4>移动端组件补齐至 391 个</h4><div class="foot"><span>✓ 10-25</span><span class="sp"></span><div class="av" style="background:#a58cf0">周</div></div></article></section>
</div></div>
`)

add("tools", "团队日历", "月视图 + 多成员色块 + 待办侧栏 + 会议详情，日程管理页",
    "日历 / 日程 / 协作", "云枢 · 团队日历",
    `
body{display:flex;background:#fbfbfd;color:#22242c;font-size:12px;height:100vh}
.side{width:220px;background:#fff;border-right:1px solid #eceef3;padding:22px 14px;flex-shrink:0}
.logo{font-size:17px;font-weight:800;padding:0 8px 22px}.logo em{font-style:normal;color:#3b8d68}
.side .new{background:#2f8d64;color:#fff;border-radius:10px;padding:11px;text-align:center;font-weight:700;margin-bottom:22px}
.side h4{font-size:10px;letter-spacing:1.5px;color:#a2a7b3;padding:0 8px 10px}
.side a{display:flex;gap:9px;align-items:center;padding:9px 10px;border-radius:9px;color:#5d6270;margin-bottom:3px}
.side a.on{background:#eaf6f0;color:#2f8d64;font-weight:700}.side .dot{width:9px;height:9px;border-radius:3px}
.mini{margin-top:26px;border-top:1px solid #f0f1f5;padding-top:18px}.mini h4{padding:0 8px}.mini table{width:100%;border-collapse:collapse;text-align:center;font-size:10.5px;color:#8a90a0}
.mini td{padding:5px}.mini td.on{background:#2f8d64;color:#fff;border-radius:50%}.mini td.out{color:#d0d4dc}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.top{height:66px;border-bottom:1px solid #eceef3;display:flex;align-items:center;padding:0 24px;gap:14px;background:#fff}
.top h1{font-size:19px}.top .sp{flex:1}.top button{border:1px solid #e3e6ed;border-radius:8px;padding:8px 13px;font-size:12px;color:#5d6270;background:#fff}
.top .today{background:#2f8d64;color:#fff;border-color:#2f8d64;font-weight:700}
.cal{flex:1;display:flex;flex-direction:column;padding:0 24px 20px;min-height:0}
.week{display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #eceef3}
.week span{padding:11px 8px;color:#9aa0ac;font-size:11px}.week span:first-child,.week span:last-child{color:#c2c6d0}
.days{flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(5,1fr)}
.day{border-right:1px solid #f0f1f5;border-bottom:1px solid #f0f1f5;padding:7px;min-height:0;overflow:hidden}
.day:nth-child(7n){border-right:0}.day.out{background:#fafbfc}.day .n{font-size:11px;color:#8a90a0;margin-bottom:5px}
.day.today .n{background:#2f8d64;color:#fff;border-radius:50%;width:20px;height:20px;display:grid;place-items:center}
.ev{border-radius:5px;padding:4px 6px;font-size:10px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ev.g{background:#e6f5ed;color:#2f8d64;border-left:2px solid #2f8d64}.ev.b{background:#e8f0ff;color:#3b6fd8;border-left:2px solid #3b6fd8}
.ev.o{background:#fff2e2;color:#d18b1f;border-left:2px solid #f0ae42}.ev.p{background:#f1ecff;color:#6c5cff;border-left:2px solid #6c5cff}
.right{width:250px;background:#fff;border-left:1px solid #eceef3;padding:20px 16px;flex-shrink:0}
.right h3{font-size:13px;margin-bottom:14px}.todo{display:flex;gap:9px;padding:10px 0;border-bottom:1px solid #f3f4f8;font-size:11.5px;line-height:1.6}
.todo input{accent-color:#2f8d64}.todo span{color:#8a90a0;display:block;font-size:10px;margin-top:3px}
.meet{background:#f7f9fb;border:1px solid #edf0f4;border-radius:11px;padding:14px;margin-top:20px}
.meet b{font-size:12px}.meet p{color:#8a90a0;font-size:11px;line-height:1.8;margin-top:8px}
.meet .who{display:flex;margin-top:10px}.meet .who i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-style:normal;font-size:10px;margin-left:-6px;border:2px solid #fff}
`,
    `
<aside class="side"><div class="logo">云<em>枢</em> 日程</div><button class="new" onclick="this.textContent='已打开新建日程 ✓'">+ 新建日程</button>
<h4>视图</h4><a class="on">▦ 月视图</a><a>▤ 周视图</a><a>▬ 日视图</a><a>☰ 日程列表</a>
<h4 style="margin-top:20px">我的日历</h4><a><i class="dot" style="background:#2f8d64"></i>团队日程</a><a><i class="dot" style="background:#3b6fd8"></i>产品评审</a>
<a><i class="dot" style="background:#f0ae42"></i>客户会议</a><a><i class="dot" style="background:#6c5cff"></i>个人专注</a>
<div class="mini"><h4>十一月 2026</h4><table><tr><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td><td>日</td></tr>
<tr><td class="out">26</td><td class="out">27</td><td class="out">28</td><td class="out">29</td><td class="out">30</td><td class="out">31</td><td>1</td></tr>
<tr><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td></tr>
<tr><td>9</td><td class="on">10</td><td>11</td><td>12</td><td>13</td><td>14</td><td>15</td></tr>
<tr><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td></tr></table></div></aside>
<div class="main"><header class="top"><h1>2026 年 11 月</h1><span style="color:#9aa0ac">第 45 周</span><span class="sp"></span><button>‹</button><button class="today">今天</button><button>›</button><button>月 ▾</button></header>
<div class="cal"><div class="week"><span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span></div>
<div class="days">
<div class="day out"><div class="n">26</div></div><div class="day out"><div class="n">27</div></div><div class="day out"><div class="n">28</div></div><div class="day out"><div class="n">29</div></div><div class="day out"><div class="n">30</div></div><div class="day out"><div class="n">31</div></div><div class="day"><div class="n">1</div></div>
<div class="day"><div class="n">2</div><div class="ev g">10:00 迭代启动会</div><div class="ev p">14:00 设计评审</div></div>
<div class="day"><div class="n">3</div><div class="ev b">09:30 需求对齐</div></div>
<div class="day"><div class="n">4</div><div class="ev o">15:00 星海科技复盘</div></div>
<div class="day"><div class="n">5</div><div class="ev g">11:00 周会</div><div class="ev p">16:00 专注时间</div></div>
<div class="day"><div class="n">6</div><div class="ev b">14:00 技术评审</div></div><div class="day"><div class="n">7</div></div><div class="day"><div class="n">8</div></div>
<div class="day"><div class="n">9</div><div class="ev g">10:00 迭代启动会</div></div>
<div class="day today"><div class="n">10</div><div class="ev b">09:30 页面模板评审</div><div class="ev o">14:00 客户演示</div><div class="ev p">17:00 周报整理</div></div>
<div class="day"><div class="n">11</div><div class="ev g">10:00 设计走查</div></div>
<div class="day"><div class="n">12</div><div class="ev o">15:00 拾光设计沟通</div></div>
<div class="day"><div class="n">13</div><div class="ev p">全天 专注开发</div></div><div class="day"><div class="n">14</div></div><div class="day"><div class="n">15</div></div>
<div class="day"><div class="n">16</div><div class="ev g">10:00 迭代启动会</div></div>
<div class="day"><div class="n">17</div><div class="ev b">11:00 数据复盘</div></div>
<div class="day"><div class="n">18</div></div><div class="day"><div class="n">19</div><div class="ev o">16:00 月度述职</div></div>
<div class="day"><div class="n">20</div><div class="ev g">14:00 版本发布</div></div><div class="day"><div class="n">21</div></div><div class="day"><div class="n">22</div></div>
<div class="day"><div class="n">23</div></div><div class="day"><div class="n">24</div><div class="ev p">全天 设计探索</div></div>
<div class="day"><div class="n">25</div></div><div class="day"><div class="n">26</div><div class="ev b">10:00 下迭代规划</div></div>
<div class="day"><div class="n">27</div></div><div class="day"><div class="n">28</div></div><div class="day"><div class="n">29</div></div>
<div class="day"><div class="n">30</div><div class="ev g">15:00 月度总结</div></div><div class="day out"><div class="n">1</div></div>
<div class="day out"><div class="n">2</div></div><div class="day out"><div class="n">3</div></div><div class="day out"><div class="n">4</div></div><div class="day out"><div class="n">5</div></div><div class="day out"><div class="n">6</div></div></div></div></div>
<aside class="right"><h3>今日待办 · 11 月 10 日</h3>
<div class="todo"><input type="checkbox" checked><div><s>确认页面模板分类</s><span>09:00 · 已完成</span></div></div>
<div class="todo"><input type="checkbox"><div>评审 24 个整页模板<span>11:00 · 产品组</span></div></div>
<div class="todo"><input type="checkbox"><div>客户演示环境检查<span>13:30 · 售前</span></div></div>
<div class="todo"><input type="checkbox"><div>整理第 45 周周报<span>17:00 · 个人</span></div></div>
<div class="meet"><b>📅 下一场：客户演示</b><p>14:00 — 15:00 · 会议室 A3 / 线上<br>星海科技 · 工作台重构阶段汇报</p>
<div class="who"><i style="background:#6c5cff">陈</i><i style="background:#f29a6c">林</i><i style="background:#5cbf9b">苏</i><i style="background:#a58cf0">周</i></div></div></aside>
`)

// ============ 6. 移动端 App ============
add("mobile", "音乐播放器", "沉浸式专辑封面 + 歌词 + 进度与控制条，深色音乐 App",
    "iOS / 音乐 / 沉浸式", "潮汐音乐 · 正在播放",
    `
body{background:radial-gradient(circle at 20% 15%,#3a2a5c,#171426 45%,#0e0d18);color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;gap:90px;font-size:13px}
.intro{max-width:330px}.intro h1{font-size:44px;line-height:1.2;letter-spacing:-2px}.intro p{color:#a49fbe;font-size:14px;line-height:1.9;margin-top:18px}
.intro .pills{display:flex;gap:8px;margin-top:24px;flex-wrap:wrap}.intro span{border:1px solid #3b3657;border-radius:999px;padding:7px 13px;font-size:11px;color:#c3bde0}
.phone{width:390px;height:800px;border-radius:46px;border:9px solid #262436;background:linear-gradient(170deg,#4a3566,#241c3b 55%,#151222);box-shadow:0 40px 90px rgba(0,0,0,.55);overflow:hidden;position:relative;flex-shrink:0}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:130px;height:26px;background:#262436;border-radius:0 0 16px 16px;z-index:2}
.status{display:flex;justify-content:space-between;padding:14px 24px 0;font-size:10px;color:#ded9f0;position:relative;z-index:3}
.top{display:flex;justify-content:space-between;align-items:center;padding:26px 24px 8px;font-size:11px;color:#c2bbdd}
.top b{font-size:13px;color:#fff;display:block;text-align:center}.top i{font-size:17px;font-style:normal}
.cover{width:290px;height:290px;margin:24px auto 0;border-radius:22px;background:radial-gradient(circle at 30% 25%,#ffc4a3,#e8756b 42%,#7b3a83 78%,#2c2048);box-shadow:0 26px 50px rgba(0,0,0,.45);position:relative;overflow:hidden}
.cover::after{content:"";position:absolute;right:-50px;bottom:-60px;width:220px;height:220px;border-radius:50%;border:40px solid rgba(255,255,255,.1)}
.cover span{position:absolute;bottom:20px;left:22px;font-size:30px;font-weight:900;letter-spacing:2px;color:rgba(255,255,255,.9)}
.song{display:flex;align-items:center;padding:26px 28px 0}.song .t{flex:1}.song h2{font-size:21px;letter-spacing:-.5px}.song p{color:#a9a1c8;font-size:12px;margin-top:6px}.song i{font-size:20px;font-style:normal;color:#ff9f8a}
.prog{padding:22px 28px 0}.bar{height:4px;background:rgba(255,255,255,.18);border-radius:4px;position:relative}.bar i{display:block;height:100%;width:42%;background:#ffb39d;border-radius:4px}.bar b{position:absolute;left:42%;top:50%;transform:translate(-50%,-50%);width:11px;height:11px;border-radius:50%;background:#fff}
.time{display:flex;justify-content:space-between;color:#9c95b8;font-size:10px;margin-top:9px}
.ctrl{display:flex;justify-content:space-between;align-items:center;padding:22px 32px;font-size:22px;color:#e6e1f5}
.ctrl .play{width:66px;height:66px;border-radius:50%;background:#fff;color:#3a2a5c;display:grid;place-items:center;font-size:25px;box-shadow:0 12px 26px rgba(255,255,255,.18)}
.lyric{text-align:center;margin-top:22px;color:#8f88ab;font-size:12px;line-height:2}.lyric b{display:block;color:#fff;font-size:14px}
.bottom{display:flex;justify-content:space-between;padding:26px 34px;color:#9c95b8;font-size:11px}.home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:4px;background:rgba(255,255,255,.5)}
`,
    `
<div class="intro"><h1>把一整晚<br>交给这首歌</h1><p>潮汐音乐 · 沉浸式播放页。封面取色、歌词逐行、无干扰控制，让听歌这件事重新只关于听歌。</p>
<div class="pills"><span>沉浸模式</span><span>设备流转</span><span>无损音质</span><span>睡眠定时</span></div></div>
<div class="phone"><div class="notch"></div><div class="status"><span>9:41</span><span>▮▮▮  ⌁  ▰</span></div>
<div class="top"><i>⌄</i><div><b>正在播放</b><span style="font-size:10px">来自「深夜通勤」歌单</span></div><i>⋯</i></div>
<div class="cover"><span>晚风</span></div>
<div class="song"><div class="t"><h2>晚风来信</h2><p>拾光乐队 · 城市漫游</p></div><i>♥</i></div>
<div class="prog"><div class="bar"><i></i><b></b></div><div class="time"><span>1:42</span><span>-2:36</span></div></div>
<div class="ctrl"><span>⇄</span><span>⏮</span><button class="play" onclick="this.textContent=this.textContent==='❚❚'?'▶':'❚❚'">❚❚</button><span>⏭</span><span>☰</span></div>
<div class="lyric"><b>风把没说完的话吹向海边</b>路灯替我数着第几个深夜<br><span style="opacity:.5">下一句 · 而我还留在原地</span></div>
<div class="bottom"><span>🎧 AirPods Pro</span><span>♫ 歌词</span><span>☰ 列表</span></div><div class="home"></div></div>
`)

add("mobile", "外卖点餐", "店铺头图 + 分类侧栏 + 菜品列表 + 底部购物车，点餐主流程",
    "点餐 / 列表 / 购物车", "小满食堂 · 在线点餐",
    `
body{background:linear-gradient(135deg,#fff3e8,#ffe6d2 55%,#ffd9c4);min-height:100vh;display:flex;align-items:center;justify-content:center;gap:86px;font-size:13px;color:#29241f}
.intro{max-width:320px}.intro h1{font-size:42px;line-height:1.25;letter-spacing:-2px}.intro p{color:#8a7461;font-size:14px;line-height:1.9;margin-top:18px}
.intro .kv{display:flex;gap:24px;margin-top:26px}.intro .kv b{display:block;font-size:24px}.intro .kv span{font-size:11px;color:#a08a76}
.phone{width:390px;height:800px;border-radius:46px;border:9px solid #2b2724;background:#faf8f5;box-shadow:0 40px 90px rgba(90,50,20,.3);overflow:hidden;position:relative;flex-shrink:0}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:130px;height:26px;background:#2b2724;border-radius:0 0 16px 16px;z-index:3}
.status{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:10px;color:#4a4038;position:relative;z-index:4}
.hero{height:180px;background:linear-gradient(120deg,#e8a465,#c96a3c 60%,#8f4326);position:relative;padding:18px;color:#fff}
.hero .navrow{display:flex;justify-content:space-between;font-size:17px}.hero h1{font-size:24px;margin-top:56px;letter-spacing:-.5px}
.hero .badge{position:absolute;right:16px;bottom:16px;background:rgba(255,255,255,.9);color:#b95b2c;font-size:10px;padding:5px 10px;border-radius:999px;font-weight:700}
.shop{background:#fff;border-radius:18px 18px 0 0;margin-top:-16px;position:relative;padding:16px 16px 0;height:594px}
.shop .row{display:flex;gap:10px;align-items:center}.shop .row b{font-size:16px}.shop .row span{color:#c86a32;font-size:11px}.shop .row .sp{flex:1}
.tags{display:flex;gap:6px;margin:12px 0 14px}.tags span{background:#fff3e8;color:#c0703a;font-size:10px;padding:5px 9px;border-radius:6px}
.content{display:flex;gap:10px;height:480px}.cats{width:72px;flex-shrink:0}.cats div{padding:12px 6px;background:#f6f4f0;font-size:11px;color:#8b8177;text-align:center;margin-bottom:4px;border-radius:8px}
.cats div.on{background:#fff;color:#c05e2b;font-weight:800;border-left:3px solid #e07a3c}
.dishes{flex:1;overflow:hidden}.dishes h4{font-size:12px;color:#8b8177;margin:4px 0 10px}
.dish{display:flex;gap:10px;margin-bottom:14px}.pic{width:70px;height:70px;border-radius:10px;background:linear-gradient(135deg,#f4d3a8,#d99255);flex-shrink:0}
.dish:nth-child(3) .pic{background:linear-gradient(135deg,#e8dcc0,#a8b878)}.dish:nth-child(4) .pic{background:linear-gradient(135deg,#f2c9b4,#c9715c)}
.dish .t{flex:1}.dish b{font-size:12px}.dish p{font-size:10px;color:#a0978d;line-height:1.6;margin-top:5px}.dish .sale{font-size:10px;color:#b0a79c;margin-top:4px}
.dish .bot{display:flex;align-items:center;justify-content:space-between;margin-top:7px}.dish .price{color:#d05f28;font-weight:800;font-size:14px}
.dish button{background:#e8753a;color:#fff;width:22px;height:22px;border-radius:50%;font-size:15px;line-height:1}
.cart{position:absolute;left:14px;right:14px;bottom:18px;height:54px;background:#2c2724;border-radius:999px;display:flex;align-items:center;padding:0 8px 0 16px;color:#fff;box-shadow:0 12px 26px rgba(40,25,15,.3)}
.cart .ic{width:42px;height:42px;border-radius:50%;background:#e8753a;display:grid;place-items:center;font-size:20px;margin-top:-16px;border:3px solid #2c2724}
.cart .t{margin-left:10px}.cart .t b{font-size:15px}.cart .t span{display:block;font-size:10px;color:#b3aaa1;margin-top:2px}
.cart .sp{flex:1}.cart button{background:#e8753a;border-radius:999px;padding:11px 20px;font-size:12px;font-weight:700;color:#fff}
.home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:4px;background:#bbb;z-index:5}
`,
    `
<div class="intro"><h1>今天中午，<br>吃点热乎的</h1><p>小满食堂 · 点餐页。分类侧栏与菜品列表联动，购物车始终可见，从挑菜到结算不超过 3 次点击。</p>
<div class="kv"><div><b>4.9 ★</b><span>店铺评分</span></div><div><b>28 min</b><span>预计送达</span></div><div><b>¥0</b><span>配送费</span></div></div></div>
<div class="phone"><div class="notch"></div><div class="status"><span>9:41</span><span>▮▮▮  ⌁  ▰</span></div>
<div class="hero"><div class="navrow"><span>‹</span><span>♡  ⋯</span></div><h1>小满食堂 · 徐汇店</h1><span class="badge">满 30 减 8</span></div>
<div class="shop"><div class="row"><b>家常热炒</b><span>★ 4.9</span><span class="sp"></span><span style="color:#a0978d">月售 2,486</span></div>
<div class="tags"><span>28 分钟送达</span><span>起送 ¥20</span><span>食品安全 A 级</span></div>
<div class="content"><div class="cats"><div class="on">热销</div><div>热炒</div><div>主食</div><div>汤品</div><div>小食</div><div>饮品</div></div>
<div class="dishes"><h4>热销 · 本店必点</h4>
<article class="dish"><div class="pic"></div><div class="t"><b>小炒黄牛肉</b><p>现炒 · 微辣 · 配米饭</p><div class="sale">月售 486 · 好评 98%</div><div class="bot"><span class="price">¥ 38</span><button onclick="this.textContent='✓'">+</button></div></div></article>
<article class="dish"><div class="pic"></div><div class="t"><b>砂锅豆腐煲</b><p>嫩豆腐 · 菌菇 · 清淡</p><div class="sale">月售 312 · 好评 96%</div><div class="bot"><span class="price">¥ 28</span><button onclick="this.textContent='✓'">+</button></div></div></article>
<article class="dish"><div class="pic"></div><div class="t"><b>糖醋小排</b><p>酸甜口 · 可去骨</p><div class="sale">月售 268 · 好评 95%</div><div class="bot"><span class="price">¥ 42</span><button onclick="this.textContent='✓'">+</button></div></div></article></div></div>
<div class="cart"><div class="ic">🛒</div><div class="t"><b>¥ 66</b><span>已选 2 件 · 另需配送费 ¥0</span></div><span class="sp"></span><button onclick="this.textContent='去结算 ✓'">去结算</button></div></div><div class="home"></div></div>
`)

add("mobile", "健康数据", "活动圆环 + 步数柱状 + 心率曲线 + 指标卡，健康类 App 首页",
    "健康 / 数据可视化 / iOS", "轻量 · 健康概览",
    `
body{background:linear-gradient(135deg,#eef4f0,#dceae2 60%,#cbe0d5);min-height:100vh;display:flex;align-items:center;justify-content:center;gap:86px;font-size:13px;color:#1d2b25}
.intro{max-width:320px}.intro h1{font-size:42px;line-height:1.25;letter-spacing:-2px}.intro p{color:#6f8278;font-size:14px;line-height:1.9;margin-top:18px}
.intro .pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}.intro span{border:1px solid #b8cfc1;border-radius:999px;padding:7px 13px;font-size:11px;color:#4e6b5b}
.phone{width:390px;height:800px;border-radius:46px;border:9px solid #26332c;background:#f7faf8;box-shadow:0 40px 90px rgba(30,60,45,.28);overflow:hidden;position:relative;flex-shrink:0}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:130px;height:26px;background:#26332c;border-radius:0 0 16px 16px;z-index:3}
.status{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:10px;color:#2f4438;position:relative;z-index:4}
.wrap{padding:22px 20px}.head{display:flex;align-items:end;margin-top:10px}.head h1{font-size:25px;letter-spacing:-.8px}.head p{color:#8b9c92;font-size:11px;margin-top:5px}.head .sp{flex:1}
.head .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#8fc7a6,#3f8c68);color:#fff;display:grid;place-items:center;font-weight:700}
.ring{background:#fff;border:1px solid #e6eee9;border-radius:20px;padding:20px;margin-top:20px;display:flex;gap:20px;align-items:center}
.circle{width:126px;height:126px;border-radius:50%;background:conic-gradient(#3f9c6d 0 78%,#ffbe6b 78% 90%,#e8efeb 90% 100%);display:grid;place-items:center;position:relative;flex-shrink:0}
.circle::after{content:"";position:absolute;inset:13px;background:#fff;border-radius:50%}
.circle div{position:relative;z-index:2;text-align:center}.circle b{display:block;font-size:25px;letter-spacing:-1px}.circle span{font-size:10px;color:#8b9c92}
.ring .t{flex:1}.ring .t h3{font-size:14px}.ring .t p{font-size:11px;color:#8b9c92;line-height:1.7;margin-top:8px}
.ring .t .line{display:flex;justify-content:space-between;font-size:11px;padding:7px 0;border-bottom:1px solid #f0f4f1}.ring .t .line:last-child{border:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.mini{background:#fff;border:1px solid #e6eee9;border-radius:16px;padding:14px}.mini .k{font-size:11px;color:#8b9c92}.mini b{display:block;font-size:22px;letter-spacing:-.7px;margin-top:7px}.mini span{font-size:10px;color:#3f9c6d}
.chart{background:#fff;border:1px solid #e6eee9;border-radius:18px;padding:18px;margin-top:12px}.chart h3{font-size:13px}.chart p{font-size:10px;color:#8b9c92;margin-top:4px}
.bars{display:flex;align-items:flex-end;gap:9px;height:96px;margin-top:16px;border-bottom:1px solid #eef2ef;padding-bottom:2px}
.bars i{flex:1;background:linear-gradient(180deg,#68b98c,#c7e3d2);border-radius:5px 5px 0 0}.bars i.today{background:linear-gradient(180deg,#2f8c60,#7cc39d)}
.mon{display:flex;justify-content:space-between;font-size:9px;color:#a4b3aa;margin-top:7px}
.tabs{position:absolute;left:0;right:0;bottom:0;height:66px;background:#fff;border-top:1px solid #e9f0eb;display:flex;justify-content:space-around;align-items:center;font-size:10px;color:#a4b3aa}
.tabs b{color:#2f8c60;font-weight:700}.tabs span{font-size:18px;display:block;text-align:center;margin-bottom:3px}
.home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:4px;background:#bbb;z-index:5}
`,
    `
<div class="intro"><h1>今天的身体，<br>比昨天好一点</h1><p>轻量 · 健康概览。把活动、睡眠、心率收进一屏，用颜色而非数字先给出状态，再让细节可查。</p>
<div class="pills"><span>三环目标</span><span>周趋势</span><span>静息心率</span><span>睡眠分期</span></div></div>
<div class="phone"><div class="notch"></div><div class="status"><span>9:41</span><span>▮▮▮  ⌁  ▰</span></div>
<div class="wrap"><div class="head"><div><h1>早上好，苏晚</h1><p>11 月 10 日 星期二 · 已完成本周目标 5/7 天</p></div><span class="sp"></span><div class="av">苏</div></div>
<section class="ring"><div class="circle"><div><b>78%</b><span>活动完成</span></div></div>
<div class="t"><h3>今日活动</h3><p>还差 1,840 步就能合上圆环，晚饭后散个步刚好。</p>
<div class="line"><span>步数</span><b>8,160 / 10,000</b></div><div class="line"><span>活动能量</span><b>386 / 500 kcal</b></div><div class="line"><span>站立小时</span><b>9 / 12 h</b></div></div></section>
<div class="grid2"><div class="mini"><div class="k">😴 昨晚睡眠</div><b>7h 24m</b><span>深睡 1h 48m · 优于 68% 用户</span></div>
<div class="mini"><div class="k">♥ 静息心率</div><b>62 <span style="font-size:11px;color:#8b9c92">bpm</span></b><span>较上周 ↓ 3 bpm</span></div></div>
<section class="chart"><h3>本周步数</h3><p>日均 8,942 步 · 较上周 ↑ 12%</p>
<div class="bars"><i style="height:52%"></i><i style="height:70%"></i><i style="height:44%"></i><i style="height:82%"></i><i style="height:66%"></i><i style="height:94%"></i><i class="today" style="height:76%"></i></div>
<div class="mon"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div></section></div>
<div class="tabs"><div><b><span>◉</span>概览</b></div><div><span>◈</span>趋势</div><div><span>◷</span>训练</div><div><span>◎</span>我的</div></div><div class="home"></div></div>
`)

add("mobile", "钱包记账", "余额卡 + 快捷操作 + 趋势图 + 交易流水，个人财务 App",
    "金融 / 钱包 / 流水", "口袋 · 钱包首页",
    `
body{background:radial-gradient(circle at 15% 10%,#3b2f6e,#1e1a3c 50%,#131127);min-height:100vh;display:flex;align-items:center;justify-content:center;gap:86px;font-size:13px;color:#fff}
.intro{max-width:320px}.intro h1{font-size:42px;line-height:1.25;letter-spacing:-2px}.intro p{color:#aca5cc;font-size:14px;line-height:1.9;margin-top:18px}
.intro .pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:24px}.intro span{border:1px solid #463d70;border-radius:999px;padding:7px 13px;font-size:11px;color:#c6bfe6}
.phone{width:390px;height:800px;border-radius:46px;border:9px solid #221e3a;background:#171430;box-shadow:0 40px 90px rgba(0,0,0,.5);overflow:hidden;position:relative;flex-shrink:0}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:130px;height:26px;background:#221e3a;border-radius:0 0 16px 16px;z-index:3}
.status{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:10px;color:#cfc9e8;position:relative;z-index:4}
.wrap{padding:22px 20px}.head{display:flex;align-items:center;margin-top:10px}.head h1{font-size:19px}.head .sp{flex:1}.head i{width:32px;height:32px;border-radius:50%;background:#2b2550;display:grid;place-items:center;font-style:normal;margin-left:8px}
.balance{margin-top:22px;padding:24px;border-radius:22px;background:linear-gradient(135deg,#8b6cff,#5b46c9 55%,#3e3197);box-shadow:0 18px 40px rgba(90,65,210,.35);position:relative;overflow:hidden}
.balance::after{content:"";position:absolute;right:-40px;top:-50px;width:180px;height:180px;border-radius:50%;border:36px solid rgba(255,255,255,.08)}
.balance .k{font-size:11px;color:#ded6ff}.balance b{display:block;font-size:36px;letter-spacing:-1.5px;margin-top:9px}.balance .row{display:flex;gap:20px;margin-top:20px;font-size:11px;color:#ded6ff}.balance .row b{font-size:13px;color:#fff;display:block;letter-spacing:0;margin-top:3px}
.acts{display:flex;justify-content:space-around;margin-top:22px}.acts div{text-align:center;font-size:10px;color:#b3abcf}.acts i{width:48px;height:48px;border-radius:16px;background:#252044;display:grid;place-items:center;font-style:normal;font-size:19px;margin-bottom:8px;color:#c9bcff}
.trend{background:#211c3e;border:1px solid #302952;border-radius:18px;padding:18px;margin-top:22px}.trend .r{display:flex;align-items:center}.trend h3{font-size:13px}.trend .r span{margin-left:auto;font-size:10px;color:#9c93c2}
svg{width:100%;height:80px;margin-top:10px}
.list{margin-top:22px}.list h3{font-size:13px;margin-bottom:12px}.list .day{font-size:10px;color:#8b83ad;margin:14px 0 8px}
.tx{display:flex;align-items:center;gap:11px;padding:10px 0}.tx .ic{width:38px;height:38px;border-radius:12px;background:#2b2550;display:grid;place-items:center;font-size:16px;flex-shrink:0}
.tx .t{flex:1}.tx b{font-size:12px}.tx span{display:block;font-size:10px;color:#8b83ad;margin-top:4px}.tx .amt{font-size:13px;font-weight:700}.tx .amt.in{color:#62d29a}
.tabs{position:absolute;left:0;right:0;bottom:0;height:66px;background:#1d1838;border-top:1px solid #2e2750;display:flex;justify-content:space-around;align-items:center;font-size:10px;color:#7f76a3}
.tabs b{color:#bcaaff;font-weight:700}.tabs span{font-size:18px;display:block;text-align:center;margin-bottom:3px}
.home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:4px;background:#5b5480;z-index:5}
`,
    `
<div class="intro"><h1>每一笔，<br>都心里有数</h1><p>口袋 · 钱包首页。余额、本月收支、趋势与流水在一屏内闭环，重点数字先给，明细往后放。</p>
<div class="pills"><span>自动归类</span><span>预算提醒</span><span>多账户</span><span>月度报告</span></div></div>
<div class="phone"><div class="notch"></div><div class="status"><span>9:41</span><span>▮▮▮  ⌁  ▰</span></div>
<div class="wrap"><div class="head"><h1>我的钱包</h1><span class="sp"></span><i>⌕</i><i>⋯</i></div>
<section class="balance"><div class="k">总资产 · 已隐藏 2 个账户</div><b>¥ 28,460.72</b>
<div class="row"><div>本月收入<b>¥ 16,800</b></div><div>本月支出<b>¥ 6,234</b></div><div>结余<b>¥ 10,566</b></div></div></section>
<div class="acts"><div><i>↗</i>转账</div><div><i>↙</i>收款</div><div><i>✎</i>记一笔</div><div><i>▤</i>账单</div></div>
<section class="trend"><div class="r"><h3>近 6 个月结余</h3><span>查看报告 →</span></div>
<svg viewBox="0 0 330 80" preserveAspectRatio="none"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a58cff" stop-opacity=".45"/><stop offset="1" stop-color="#a58cff" stop-opacity="0"/></linearGradient></defs>
<path d="M0 62 L55 50 L110 58 L165 34 L220 42 L275 18 L330 26 L330 80 L0 80Z" fill="url(#w)"/><path d="M0 62 L55 50 L110 58 L165 34 L220 42 L275 18 L330 26" fill="none" stroke="#b7a4ff" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="275" cy="18" r="4" fill="#fff"/></svg></section>
<section class="list"><h3>最近交易</h3><div class="day">今天 · 11 月 10 日</div>
<div class="tx"><div class="ic">☕</div><div class="t"><b>拾光咖啡</b><span>餐饮 · 微信支付</span></div><div class="amt">− ¥ 32.00</div></div>
<div class="tx"><div class="ic">💰</div><div class="t"><b>工资入账</b><span>收入 · 招商银行</span></div><div class="amt in">+ ¥ 16,800.00</div></div>
<div class="day">昨天 · 11 月 9 日</div>
<div class="tx"><div class="ic">🛒</div><div class="t"><b>盒马鲜生</b><span>日用 · 支付宝</span></div><div class="amt">− ¥ 186.40</div></div>
<div class="tx"><div class="ic">🚇</div><div class="t"><b>地铁出行</b><span>交通 · 交通卡</span></div><div class="amt">− ¥ 6.00</div></div></section></div>
<div class="tabs"><div><b><span>◉</span>首页</b></div><div><span>▤</span>明细</div><div><span>◈</span>统计</div><div><span>◎</span>我的</div></div><div class="home"></div></div>
`)

// ============ 7. 每类再加 1 个「多卡片」页面 ============
add("landing", "行业峰会报名页", "大会议程 / 讲者 / 赞助商多卡片矩阵，活动落地页",
    "会议 / 议程 / 报名", "前瞻 2026 · 产品与设计峰会",
    `
body{background:#f6f5f2;color:#1c1d21;font-size:13px}
.nav{height:66px;background:#fff;border-bottom:1px solid #e8e6e0;display:flex;align-items:center;padding:0 54px;gap:30px}
.logo{font-size:18px;font-weight:700;letter-spacing:-.5px}.logo em{font-style:normal;color:#8a6a3c}.nav .sp{flex:1}
.nav a{color:#6c6a64}.nav button{background:#1c1d21;color:#fff;border-radius:8px;padding:10px 18px;font-size:12px;font-weight:700}
.hero{padding:74px 54px 66px;background:radial-gradient(circle at 78% 10%,rgba(180,150,100,.14),transparent 45%),#f6f5f2;border-bottom:1px solid #e8e6e0}
.kicker{font-size:11px;letter-spacing:4px;color:#9a7c50;font-weight:700}
h1{font-size:58px;letter-spacing:-3px;line-height:1.1;margin:18px 0 16px;max-width:760px}
.hero p{color:#6c6a64;font-size:15px;line-height:1.8;max-width:560px}
.meta{display:flex;gap:26px;margin:26px 0 30px;font-size:13px;color:#4b4944}.meta b{color:#1c1d21}
.acts{display:flex;gap:10px}.primary{background:#1c1d21;color:#fff;padding:14px 28px;border-radius:9px;font-size:14px;font-weight:700}
.ghost{border:1px solid #d5d1c8;background:#fff;padding:14px 24px;border-radius:9px;font-size:14px}
.wrap{padding:56px 54px 76px}h2{font-size:26px;letter-spacing:-1px;margin-bottom:6px}.lead{color:#8b887f;font-size:12px;margin-bottom:24px}
.agenda{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:52px}
.slot{background:#fff;border:1px solid #e8e6e0;border-radius:12px;padding:20px;transition:.3s}
.slot:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(40,35,25,.09)}
.slot .time{font-size:11px;color:#9a7c50;font-weight:700;letter-spacing:1px}.slot h3{font-size:16px;margin:12px 0 8px;line-height:1.5}
.slot p{font-size:12px;color:#8b887f;line-height:1.7}.slot .who{margin-top:16px;font-size:11px;color:#4b4944}
.speakers{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.sp{background:#fff;border:1px solid #e8e6e0;border-radius:12px;overflow:hidden;text-align:center;padding-bottom:16px}
.sp .pic{height:130px;background:linear-gradient(140deg,#d8d0c0,#a89a80)}.sp:nth-child(2) .pic{background:linear-gradient(140deg,#c9d4d2,#8ba5a1)}
.sp:nth-child(3) .pic{background:linear-gradient(140deg,#ded0cc,#b5918a)}.sp:nth-child(4) .pic{background:linear-gradient(140deg,#d2d0dd,#9b97b4)}
.sp b{display:block;font-size:14px;margin-top:14px}.sp span{font-size:11px;color:#8b887f}
.sponsors{display:flex;gap:12px;margin-top:46px;flex-wrap:wrap}.sponsors span{border:1px solid #e2dfd7;border-radius:8px;padding:12px 20px;color:#8b887f;font-size:12px;background:#fff}
.foot{margin-top:56px;padding-top:22px;border-top:1px solid #e2dfd7;color:#9a978f;font-size:11px;display:flex;justify-content:space-between}
`,
    `
<nav class="nav"><div class="logo">前<em>瞻</em> SUMMIT</div><a>议程</a><a>讲者</a><a>往届回顾</a><a>常见问题</a><span class="sp"></span><button onclick="this.textContent='报名成功 ✓'">立即报名</button></nav>
<section class="hero"><div class="kicker">2026 · 第六届</div><h1>把下一年的产品<br>想得更清楚一点</h1>
<p>两天，24 场分享，和 800 位认真做产品的人聊聊：AI 之后，我们到底在设计什么。</p>
<div class="meta"><span><b>11 月 21—22 日</b> · 周六至周日</span><span><b>上海 · 西岸艺术中心</b></span><span><b>线下 + 全程直播</b></span></div>
<div class="acts"><button class="primary" onclick="this.textContent='已提交报名 ✓'">报名参会 ¥ 680</button><button class="ghost">下载议程 PDF</button></div></section>
<div class="wrap"><h2>首日议程</h2><p class="lead">11 月 21 日 · 主会场 A · 更多分论坛见完整议程</p>
<div class="agenda">
<article class="slot"><div class="time">09:30 — 10:20</div><h3>开场：设计判断的回归</h3><p>当生成变得零成本，什么决定了产品的好坏。</p><div class="who">林澈 · 独立产品设计师</div></article>
<article class="slot"><div class="time">10:40 — 11:30</div><h3>AI 原生应用的交互范式</h3><p>从对话框到工作流，三种正在成形的界面结构。</p><div class="who">陈知远 · 云枢科技</div></article>
<article class="slot"><div class="time">13:30 — 14:20</div><h3>设计系统不是文档</h3><p>391 个组件做成一个页面之后，我们改变了什么。</p><div class="who">苏晚 · 产品设计师</div></article>
<article class="slot"><div class="time">14:40 — 15:30</div><h3>数据可视化的克制</h3><p>如何在监控大屏里让告警真正被看见。</p><div class="who">周叙 · 北岸数据</div></article>
<article class="slot"><div class="time">15:50 — 16:40</div><h3>零依赖交付的复兴</h3><p>单文件、双击即用，被低估的工程选择。</p><div class="who">何一舟 · 独立开发者</div></article>
<article class="slot"><div class="time">17:00 — 18:00</div><h3>圆桌：接下来三年</h3><p>五位嘉宾，关于工具、团队与职业的开放讨论。</p><div class="who">全体讲者</div></article></div>
<h2>讲者</h2><p class="lead">首批确认出席 · 持续更新</p><div class="speakers">
<article class="sp"><div class="pic"></div><b>林澈</b><span>独立产品设计师</span></article>
<article class="sp"><div class="pic"></div><b>陈知远</b><span>云枢科技 · 产品负责人</span></article>
<article class="sp"><div class="pic"></div><b>苏晚</b><span>设计师 / 独立开发者</span></article>
<article class="sp"><div class="pic"></div><b>周叙</b><span>北岸数据 · 设计总监</span></article></div>
<div class="sponsors"><span>云枢 YUNSHU</span><span>拾光 SHIGUANG</span><span>深潜 DEEPDIVE</span><span>屿见 YUJIAN</span><span>小满食堂</span></div>
<footer class="foot"><span>© 2026 前瞻峰会 · 主办方保留议程调整权利</span><span>商务合作 · 媒体报名 · 联系主办方</span></footer></div>
`)

add("dashboard", "项目组合概览", "多项目卡片网格 + 进度 / 状态 / 成员，PMO 首页",
    "PMO / 卡片 / 后台", "云枢 · 项目组合",
    `
body{display:flex;background:#f6f7f9;font-size:13px;color:#20232a}
.side{width:210px;background:#fff;border-right:1px solid #e9ebf0;padding:22px 14px;flex-shrink:0}
.logo{font-size:17px;font-weight:700;padding:0 8px 24px;letter-spacing:-.4px}.logo em{font-style:normal;color:#5b5f9c}
.side a{display:block;padding:10px 12px;border-radius:8px;color:#6d7280;margin-bottom:3px;font-size:12px}
.side a.on{background:#eeeef8;color:#4b508c;font-weight:700}.side .grp{font-size:10px;letter-spacing:1.5px;color:#a8adba;padding:20px 12px 8px}
.main{flex:1;min-width:0}.top{height:62px;background:#fff;border-bottom:1px solid #e9ebf0;display:flex;align-items:center;padding:0 26px;gap:12px}
.top b{font-size:16px}.top .sp{flex:1}.top button{border:1px solid #e4e6ed;border-radius:8px;padding:9px 14px;font-size:12px;background:#fff;color:#5d6270}
.top button.pri{background:#4b508c;color:#fff;border-color:#4b508c}
.wrap{padding:24px 26px}h1{font-size:23px;letter-spacing:-.7px}.sub{color:#8a90a0;font-size:12px;margin-top:6px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0 24px}
.kpi{background:#fff;border:1px solid #e9ebf0;border-radius:12px;padding:16px}.kpi span{font-size:11px;color:#8a90a0}.kpi b{display:block;font-size:25px;margin-top:7px;letter-spacing:-.8px}.kpi em{font-style:normal;font-size:11px;color:#2f9a68}
.bar{display:flex;align-items:center;gap:10px;margin-bottom:16px}.bar .sp{flex:1}.tabs{display:flex;gap:18px;font-size:12px;color:#8a90a0}.tabs b{color:#4b508c;border-bottom:2px solid #4b508c;padding-bottom:8px}
.projects{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.pj{background:#fff;border:1px solid #e9ebf0;border-radius:13px;padding:18px;transition:.3s}
.pj:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(30,35,50,.1)}
.pj .hd{display:flex;align-items:center;gap:10px}.pj .ic{width:34px;height:34px;border-radius:9px;background:#eeeef8;color:#4b508c;display:grid;place-items:center;font-weight:700}
.pj h3{font-size:14px;flex:1}.pj .st{font-size:10px;padding:4px 8px;border-radius:6px;background:#e8f6ee;color:#2f9a68}
.pj .st.warn{background:#fff3e0;color:#c88a28}.pj .st.gray{background:#f0f1f5;color:#8a90a0}
.pj p{font-size:11px;color:#8a90a0;line-height:1.7;margin:12px 0 14px}
.track{height:6px;background:#eef0f5;border-radius:6px;overflow:hidden}.track i{display:block;height:100%;background:linear-gradient(90deg,#7d83c4,#4b508c);border-radius:6px}
.pj .ft{display:flex;align-items:center;margin-top:14px;font-size:11px;color:#8a90a0}.pj .ft .sp{flex:1}
.avs{display:flex}.avs i{width:24px;height:24px;border-radius:50%;background:#a7a9d6;color:#fff;display:grid;place-items:center;font-size:9px;font-style:normal;margin-left:-6px;border:2px solid #fff}
.activity{margin-top:22px;background:#fff;border:1px solid #e9ebf0;border-radius:13px;padding:20px}
.activity h3{font-size:14px;margin-bottom:14px}.activity div{padding:9px 0;border-bottom:1px solid #f2f3f7;font-size:12px;color:#5d6270}.activity div:last-child{border:0}.activity span{color:#a8adba;margin-right:12px}
`,
    `
<aside class="side"><div class="logo">云<em>枢</em> PMO</div><div class="grp">组合</div><a class="on">▦ 项目总览</a><a>◷ 里程碑</a><a>◈ 资源排期</a><a>◉ 风险看板</a>
<div class="grp">管理</div><a>▤ 报表中心</a><a>⚙ 团队设置</a></aside>
<div class="main"><header class="top"><b>项目组合</b><span class="sp"></span><button>本季度 ▾</button><button>导出</button><button class="pri" onclick="this.textContent='已打开新建 ✓'">+ 新建项目</button></header>
<div class="wrap"><h1>2026 Q4 项目组合</h1><p class="sub">12 个在途项目 · 3 个需关注 · 数据更新于 10 分钟前</p>
<div class="kpis"><div class="kpi"><span>在途项目</span><b>12</b><em>↑ 2 较上季度</em></div><div class="kpi"><span>按时交付率</span><b>91.4%</b><em>↑ 3.2%</em></div>
<div class="kpi"><span>本周里程碑</span><b>8</b><em>已完成 5</em></div><div class="kpi"><span>资源占用</span><b>76%</b><em>处于健康区间</em></div></div>
<div class="bar"><div class="tabs"><b>全部 12</b><span>进行中 8</span><span>待验收 3</span><span>有风险 1</span></div><span class="sp"></span><span style="font-size:11px;color:#a8adba">按截止时间排序</span></div>
<section class="projects">
<article class="pj"><div class="hd"><div class="ic">A</div><h3>工作台重构 · 三期</h3><span class="st">进行中</span></div><p>统一设计语言，补齐页面模板与全屏预览能力。</p><div class="track"><i style="width:78%"></i></div><div class="ft"><span>78% · 11 月 18 日交付</span><span class="sp"></span><div class="avs"><i>陈</i><i>林</i><i>苏</i></div></div></article>
<article class="pj"><div class="hd"><div class="ic" style="background:#e8f4ee;color:#2f9a68">B</div><h3>移动端组件库</h3><span class="st">进行中</span></div><p>iOS / Android 双端 86 个组件对齐与验收。</p><div class="track"><i style="width:62%"></i></div><div class="ft"><span>62% · 11 月 26 日交付</span><span class="sp"></span><div class="avs"><i>周</i><i>何</i></div></div></article>
<article class="pj"><div class="hd"><div class="ic" style="background:#fff2e2;color:#c88a28">C</div><h3>数据平台迁移</h3><span class="st warn">有风险</span></div><p>历史数据校验进度落后，需增派一名后端。</p><div class="track"><i style="width:41%;background:linear-gradient(90deg,#e6bd76,#d69a35)"></i></div><div class="ft"><span>41% · 12 月 03 日交付</span><span class="sp"></span><div class="avs"><i>陈</i><i>周</i></div></div></article>
<article class="pj"><div class="hd"><div class="ic">D</div><h3>品牌官网改版</h3><span class="st">待验收</span></div><p>新视觉系统与内容结构，等待法务确认文案。</p><div class="track"><i style="width:96%"></i></div><div class="ft"><span>96% · 11 月 12 日交付</span><span class="sp"></span><div class="avs"><i>林</i><i>苏</i></div></div></article>
<article class="pj"><div class="hd"><div class="ic">E</div><h3>搜索能力升级</h3><span class="st">进行中</span></div><p>全局命令面板、多关键词与同义词召回。</p><div class="track"><i style="width:88%"></i></div><div class="ft"><span>88% · 11 月 15 日交付</span><span class="sp"></span><div class="avs"><i>陈</i><i>何</i></div></div></article>
<article class="pj"><div class="hd"><div class="ic" style="background:#f0f1f5;color:#8a90a0">F</div><h3>客户门户 V1</h3><span class="st gray">已规划</span></div><p>等待需求评审，预计下季度启动。</p><div class="track"><i style="width:8%"></i></div><div class="ft"><span>8% · 2027 Q1</span><span class="sp"></span><div class="avs"><i>苏</i></div></div></article></section>
<section class="activity"><h3>最近动态</h3><div><span>10 分钟前</span>工作台重构 · 三期 完成「全屏预览」验收</div>
<div><span>1 小时前</span>数据平台迁移 被标记为「有风险」</div><div><span>3 小时前</span>陈知远 在 搜索能力升级 中提交了 4 个任务</div></section></div></div>
`)

add("ecommerce", "商品对比页", "四款商品并排对比 + 参数矩阵，选购决策页",
    "对比 / 决策 / 电商", "拾光 · 商品对比",
    `
body{background:#faf9f7;color:#22242a;font-size:13px}
.nav{height:64px;background:#fff;border-bottom:1px solid #ece9e3;display:flex;align-items:center;padding:0 48px;gap:28px}
.logo{font-size:19px;font-weight:700;letter-spacing:1px}.logo em{font-style:normal;color:#a8784c}.nav .sp{flex:1}.nav a{color:#6d6a64}
.wrap{max-width:1180px;margin:auto;padding:34px 48px 76px}
.crumb{font-size:11px;color:#a09b92;margin-bottom:14px}h1{font-size:30px;letter-spacing:-1.2px}.sub{color:#8b8780;font-size:13px;margin-top:8px}
.picks{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}
.pick{background:#fff;border:1px solid #eae7e1;border-radius:13px;overflow:hidden;position:relative;transition:.3s}
.pick:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(60,45,30,.11)}
.pick.best{border:2px solid #a8784c}.pick .flag{position:absolute;top:12px;left:12px;background:#a8784c;color:#fff;font-size:10px;padding:4px 9px;border-radius:6px}
.pick .pic{height:160px;background:linear-gradient(140deg,#e9dcc9,#c49c73)}.pick:nth-child(2) .pic{background:linear-gradient(140deg,#dde2e6,#94a5ad)}
.pick:nth-child(3) .pic{background:linear-gradient(140deg,#e6dccd,#a98f72)}.pick:nth-child(4) .pic{background:linear-gradient(140deg,#dcd9e6,#9a95b2)}
.pick .t{padding:16px}.pick h3{font-size:14px}.pick .price{font-size:21px;font-weight:700;color:#9b6234;margin:10px 0 4px}.pick .old{font-size:11px;color:#aaa49b;text-decoration:line-through}
.pick .stars{font-size:11px;color:#a8784c;margin-top:10px}
.pick button{display:block;width:100%;margin-top:14px;border:1px solid #e2ded6;border-radius:8px;padding:9px;font-size:12px;background:#fff}
.pick.best button{background:#22242a;color:#fff;border-color:#22242a}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #eae7e1;border-radius:13px;overflow:hidden;font-size:12px}
th,td{padding:14px 18px;text-align:left;border-bottom:1px solid #f1efea}th{background:#f6f4f0;color:#8b8780;font-weight:600;width:180px}
td{color:#4b4944}tr:last-child td,tr:last-child th{border:0}.yes{color:#2f9a68;font-weight:700}.no{color:#c2beb6}
.note{margin-top:20px;font-size:11px;color:#a09b92;line-height:1.8}
`,
    `
<nav class="nav"><div class="logo">拾<em>光</em> SHIGUANG</div><a>全部商品</a><a>咖啡器具</a><a>对比</a><span class="sp"></span><a>购物车 (2)</a></nav>
<div class="wrap"><div class="crumb">首页 / 咖啡器具 / 对比</div><h1>四款手冲套装，怎么选</h1>
<p class="sub">我们挑了店里最常被放在一起比较的 4 套，把差异摊开来看。参数以实物为准。</p>
<div class="picks">
<article class="pick best"><div class="flag">最多人选择</div><div class="pic"></div><div class="t"><h3>山野 · 标准版</h3><div class="price">¥ 498</div><span class="old">¥ 588</span><div class="stars">★ 4.9 · 2,184 条评价</div><button onclick="this.textContent='已加入对比 ✓'">加入购物车</button></div></article>
<article class="pick"><div class="pic"></div><div class="t"><h3>雾白 · 入门版</h3><div class="price">¥ 268</div><span class="old">¥ 298</span><div class="stars">★ 4.7 · 986 条评价</div><button onclick="this.textContent='已加入对比 ✓'">加入购物车</button></div></article>
<article class="pick"><div class="pic"></div><div class="t"><h3>焦糖 · 进阶版</h3><div class="price">¥ 728</div><span class="old">¥ 828</span><div class="stars">★ 4.8 · 642 条评价</div><button onclick="this.textContent='已加入对比 ✓'">加入购物车</button></div></article>
<article class="pick"><div class="pic"></div><div class="t"><h3>深空 · 礼盒版</h3><div class="price">¥ 898</div><span class="old">¥ 1,080</span><div class="stars">★ 4.9 · 318 条评价</div><button onclick="this.textContent='已加入对比 ✓'">加入购物车</button></div></article></div>
<table><tr><th>对比项</th><td>山野 标准版</td><td>雾白 入门版</td><td>焦糖 进阶版</td><td>深空 礼盒版</td></tr>
<tr><th>套装件数</th><td>4 件</td><td>3 件</td><td>6 件</td><td>8 件</td></tr>
<tr><th>滤杯材质</th><td>高温陶土</td><td>食品级树脂</td><td>高温陶土</td><td>手作粗陶</td></tr>
<tr><th>含手冲壶</th><td class="yes">✓ 细口壶</td><td class="no">—</td><td class="yes">✓ 温控壶</td><td class="yes">✓ 温控壶</td></tr>
<tr><th>分享壶容量</th><td>600 ml</td><td>400 ml</td><td>600 ml</td><td>700 ml</td></tr>
<tr><th>附赠滤纸</th><td>20 张</td><td>10 张</td><td>40 张</td><td>60 张</td></tr>
<tr><th>礼盒包装</th><td class="no">—</td><td class="no">—</td><td class="yes">✓</td><td class="yes">✓ 实木盒</td></tr>
<tr><th>适合人群</th><td>日常自用</td><td>刚入门</td><td>想认真玩</td><td>送礼 / 收藏</td></tr></table>
<p class="note">对比信息更新于 2026 年 10 月。所有套装均享 7 天无理由退换与一年质保；满 ¥299 顺丰包邮。</p></div>
`)

add("content", "课程 / 播客列表", "课程卡片矩阵 + 分类筛选 + 底部播放条，内容平台",
    "课程 / 播客 / 卡片", "知声 · 课程库",
    `
body{background:#fbfaf8;color:#1f2126;font-size:13px;padding-bottom:82px}
.nav{height:64px;background:#fff;border-bottom:1px solid #eceae5;display:flex;align-items:center;padding:0 48px;gap:26px}
.logo{font-size:19px;font-weight:700;letter-spacing:-.5px}.logo em{font-style:normal;color:#8a6a9c}.nav .sp{flex:1}.nav a{color:#6d6a64}
.wrap{max-width:1180px;margin:auto;padding:32px 48px 40px}
.head{display:flex;align-items:end;gap:20px}.head h1{font-size:30px;letter-spacing:-1.2px}.head p{color:#8b8780;font-size:12px;margin-top:8px}.head .sp{flex:1}
.chips{display:flex;gap:8px;margin:24px 0}.chips button{border:1px solid #e6e3dd;background:#fff;border-radius:8px;padding:8px 14px;font-size:12px;color:#6d6a64}
.chips button.on{background:#1f2126;color:#fff;border-color:#1f2126}
.courses{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.cs{background:#fff;border:1px solid #eceae5;border-radius:13px;overflow:hidden;transition:.3s}
.cs:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(40,35,45,.1)}
.cs .cover{height:140px;position:relative;background:linear-gradient(140deg,#e3d9ea,#ab98bb);display:grid;place-items:center}
.cs:nth-child(2) .cover{background:linear-gradient(140deg,#d9e2df,#93ada6)}.cs:nth-child(3) .cover{background:linear-gradient(140deg,#eadfd4,#bb9c80)}
.cs:nth-child(4) .cover{background:linear-gradient(140deg,#d8deea,#93a3c0)}.cs:nth-child(5) .cover{background:linear-gradient(140deg,#e7e0cf,#b3a578)}
.cs:nth-child(6) .cover{background:linear-gradient(140deg,#e6d9dc,#b9959d)}
.cs .cover i{font-style:normal;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.86);display:grid;place-items:center;color:#4b4358;font-size:15px}
.cs .cover span{position:absolute;right:12px;bottom:12px;background:rgba(31,33,38,.78);color:#fff;font-size:10px;padding:4px 8px;border-radius:5px}
.cs .t{padding:16px}.cs .cat{font-size:10px;color:#8a6a9c;font-weight:700;letter-spacing:.5px}.cs h3{font-size:15px;line-height:1.5;margin:8px 0 8px}
.cs p{font-size:11px;color:#8b8780;line-height:1.7}.cs .ft{display:flex;align-items:center;margin-top:14px;font-size:11px;color:#a09b92}
.cs .ft .sp{flex:1}.track{height:4px;background:#f0eeea;border-radius:4px;margin-top:12px;overflow:hidden}.track i{display:block;height:100%;background:#8a6a9c}
.player{position:fixed;left:0;right:0;bottom:0;height:74px;background:#fff;border-top:1px solid #e9e6e0;display:flex;align-items:center;padding:0 48px;gap:16px;box-shadow:0 -8px 26px rgba(30,25,35,.06)}
.player .art{width:44px;height:44px;border-radius:9px;background:linear-gradient(140deg,#d9cdE4,#9a86b0)}
.player b{font-size:13px}.player small{display:block;color:#9a968e;font-size:11px;margin-top:4px}
.player .sp{flex:1}.pbar{width:280px;height:4px;background:#ece9e3;border-radius:4px;position:relative}.pbar i{display:block;width:38%;height:100%;background:#8a6a9c;border-radius:4px}
.player button{width:38px;height:38px;border-radius:50%;background:#1f2126;color:#fff;display:grid;place-items:center;font-size:14px}
`,
    `
<nav class="nav"><div class="logo">知<em>声</em> ZHISHENG</div><a>课程库</a><a>播客</a><a>专题</a><a>会员</a><span class="sp"></span><a>我的学习</a></nav>
<div class="wrap"><div class="head"><div><h1>继续学点什么</h1><p>42 门课程 · 本周新增 3 讲 · 已学完 12 门</p></div><span class="sp"></span><span style="font-size:12px;color:#9a968e">按最近学习排序</span></div>
<div class="chips"><button class="on" onclick="pick(this)">全部</button><button onclick="pick(this)">产品设计</button><button onclick="pick(this)">前端工程</button><button onclick="pick(this)">商业观察</button><button onclick="pick(this)">个人成长</button></div>
<div class="courses">
<article class="cs"><div class="cover"><i>▶</i><span>24 讲 · 6h 12m</span></div><div class="t"><div class="cat">产品设计</div><h3>设计系统：从规范到习惯</h3><p>用真实项目拆解组件库的取舍与落地。</p><div class="ft"><span>林澈 · 2.4k 人在学</span><span class="sp"></span><span>已学 68%</span></div><div class="track"><i style="width:68%"></i></div></div></article>
<article class="cs"><div class="cover"><i>▶</i><span>18 讲 · 4h 40m</span></div><div class="t"><div class="cat">前端工程</div><h3>零依赖单文件应用实践</h3><p>不用构建工具，也能交付完整的界面。</p><div class="ft"><span>何一舟 · 1.8k 人在学</span><span class="sp"></span><span>已学 32%</span></div><div class="track"><i style="width:32%"></i></div></div></article>
<article class="cs"><div class="cover"><i>▶</i><span>12 讲 · 3h 05m</span></div><div class="t"><div class="cat">商业观察</div><h3>SaaS 定价的三次转向</h3><p>从席位到用量，再到结果收费。</p><div class="ft"><span>陈知远 · 3.1k 人在学</span><span class="sp"></span><span>未开始</span></div></div></article>
<article class="cs"><div class="cover"><i>▶</i><span>30 讲 · 8h 20m</span></div><div class="t"><div class="cat">前端工程</div><h3>TypeScript 工程化入门</h3><p>类型、构建与项目结构的一次梳理。</p><div class="ft"><span>周叙 · 5.6k 人在学</span><span class="sp"></span><span>已学 91%</span></div><div class="track"><i style="width:91%"></i></div></div></article>
<article class="cs"><div class="cover"><i>▶</i><span>16 讲 · 4h 10m</span></div><div class="t"><div class="cat">产品设计</div><h3>界面里的动效判断</h3><p>什么时候该动，什么时候必须安静。</p><div class="ft"><span>苏晚 · 2.9k 人在学</span><span class="sp"></span><span>已学 15%</span></div><div class="track"><i style="width:15%"></i></div></div></article>
<article class="cs"><div class="cover"><i>▶</i><span>20 讲 · 5h 30m</span></div><div class="t"><div class="cat">个人成长</div><h3>独立开发第一年</h3><p>关于节奏、定价和一个人做决定的事。</p><div class="ft"><span>苏晚 · 1.2k 人在学</span><span class="sp"></span><span>未开始</span></div></div></article></div></div>
<div class="player"><div class="art"></div><div><b>第 9 讲 · 组件的边界</b><small>设计系统：从规范到习惯 · 林澈</small></div><span class="sp"></span>
<span style="font-size:11px;color:#9a968e">12:48</span><div class="pbar"><i></i></div><span style="font-size:11px;color:#9a968e">33:20</span>
<button onclick="this.textContent=this.textContent==='❚❚'?'▶':'❚❚'">❚❚</button></div>
<script>pick=function(b){[...b.parentNode.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')}</script>
`)

add("tools", "设计系统文档站", "侧栏 + 多组件预览卡 + 代码片段 + 属性表，开发者文档",
    "文档 / 组件 / 开发者", "Prism Design System",
    `
body{display:flex;background:#fbfbfd;font-size:13px;color:#20232a}
.side{width:230px;background:#fff;border-right:1px solid #e9ebf0;padding:22px 14px;flex-shrink:0;height:100vh;position:sticky;top:0}
.logo{font-size:17px;font-weight:700;padding:0 8px 6px;letter-spacing:-.5px}.logo span{display:block;font-size:10px;color:#a8adba;font-weight:400;margin-top:4px}
.side .grp{font-size:10px;letter-spacing:1.5px;color:#a8adba;padding:22px 10px 8px}
.side a{display:block;padding:8px 10px;border-radius:7px;color:#6d7280;font-size:12px}.side a.on{background:#eeeef8;color:#4b508c;font-weight:700}
.main{flex:1;min-width:0;padding:36px 44px 80px;max-width:960px}
.kicker{font-size:11px;letter-spacing:2px;color:#8b86c8;font-weight:700}h1{font-size:32px;letter-spacing:-1.2px;margin:10px 0 10px}
.intro{color:#6d7280;font-size:14px;line-height:1.8;max-width:620px}.version{display:inline-block;margin-top:16px;background:#eeeef8;color:#4b508c;font-size:11px;padding:5px 10px;border-radius:6px}
h2{font-size:18px;letter-spacing:-.5px;margin:44px 0 8px}.desc{color:#8a90a0;font-size:12px;margin-bottom:18px}
.demo{border:1px solid #e9ebf0;border-radius:13px;background:#fff;overflow:hidden}
.demo .stage{padding:28px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:repeating-linear-gradient(45deg,#fcfcfe,#fcfcfe 10px,#f8f8fc 10px,#f8f8fc 20px)}
.btn{border-radius:8px;padding:10px 16px;font-size:13px;font-weight:600;background:#4b508c;color:#fff}.btn.sec{background:#fff;color:#4b508c;border:1px solid #d9dbea}.btn.ghost{background:transparent;color:#6d7280}.btn.sm{padding:7px 12px;font-size:12px}
.field{border:1px solid #e2e4ec;border-radius:8px;padding:10px 13px;font-size:12px;color:#a8adba;background:#fff;min-width:190px}
.chip{border:1px solid #e2e4ec;border-radius:999px;padding:6px 12px;font-size:11px;color:#5d6270;background:#fff}.chip.on{background:#4b508c;color:#fff;border-color:#4b508c}
.code{background:#1b1e28;color:#ccd3e4;padding:18px 22px;font-family:ui-monospace,Consolas,monospace;font-size:11.5px;line-height:1.9;border-top:1px solid #e9ebf0}
.code .k{color:#c792ea}.code .s{color:#a5d6a7}.code .f{color:#82aaff}
table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}th,td{padding:11px 14px;text-align:left;border-bottom:1px solid #eef0f5}th{color:#8a90a0;font-weight:600;background:#fafbfd}td code{background:#f1f2f7;padding:2px 6px;border-radius:4px;font-size:11px}
.cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.mini{border:1px solid #e9ebf0;border-radius:11px;background:#fff;padding:18px}.mini b{font-size:13px}.mini p{font-size:11px;color:#8a90a0;line-height:1.7;margin-top:8px}
`,
    `
<aside class="side"><div class="logo">Prism DS<span>Design System · v2.4</span></div><div class="grp">开始</div><a>安装与接入</a><a>设计原则</a><a>更新日志</a>
<div class="grp">基础</div><a>颜色</a><a>字阶</a><a>间距与圆角</a><a>动效曲线</a><div class="grp">组件</div><a class="on">Button 按钮</a><a>Input 输入框</a><a>Tag 标签</a><a>Card 卡片</a><a>Modal 弹窗</a></aside>
<div class="main"><div class="kicker">COMPONENTS / BUTTON</div><h1>Button 按钮</h1>
<p class="intro">按钮用于触发一个明确的动作。一个视图里只保留一个主按钮，次动作降级为次级或文字按钮。</p>
<span class="version">稳定 · 上次更新 2026-10-28</span>
<h2>基础用法</h2><p class="desc">三种层级，配合尺寸可覆盖绝大多数场景。悬停、聚焦、禁用态均已内置。</p>
<div class="demo"><div class="stage"><button class="btn">主要操作</button><button class="btn sec">次要操作</button><button class="btn ghost">文字按钮</button><button class="btn sm">小尺寸</button><span class="chip on">已选中</span><span class="chip">标签</span><div class="field">请输入内容…</div></div>
<div class="code"><span class="k">import</span> { <span class="f">Button</span> } <span class="k">from</span> <span class="s">'@prism/ui'</span>;<br><br>&lt;<span class="f">Button</span> variant=<span class="s">"primary"</span>&gt;主要操作&lt;/<span class="f">Button</span>&gt;<br>&lt;<span class="f">Button</span> variant=<span class="s">"secondary"</span>&gt;次要操作&lt;/<span class="f">Button</span>&gt;<br>&lt;<span class="f">Button</span> variant=<span class="s">"ghost"</span> size=<span class="s">"sm"</span>&gt;文字按钮&lt;/<span class="f">Button</span>&gt;</div></div>
<h2>设计约定</h2><div class="cards3">
<div class="mini"><b>层级优先</b><p>同一区域只出现一个 primary，避免用户在选择上停顿。</p></div>
<div class="mini"><b>动词开头</b><p>用「保存」「创建」而不是「确定」，让结果可预期。</p></div>
<div class="mini"><b>状态完整</b><p>默认、Hover、Focus、Active、Disabled、Loading 都要有定义。</p></div></div>
<h2>属性</h2><table><tr><th>属性</th><th>说明</th><th>类型</th><th>默认值</th></tr>
<tr><td><code>variant</code></td><td>视觉层级</td><td><code>'primary' | 'secondary' | 'ghost'</code></td><td><code>'primary'</code></td></tr>
<tr><td><code>size</code></td><td>尺寸</td><td><code>'sm' | 'md' | 'lg'</code></td><td><code>'md'</code></td></tr>
<tr><td><code>disabled</code></td><td>禁用态</td><td><code>boolean</code></td><td><code>false</code></td></tr>
<tr><td><code>loading</code></td><td>加载态，自动禁用点击</td><td><code>boolean</code></td><td><code>false</code></td></tr></table></div>
`)

add("mobile", "天气 App", "手机视口 + 逐小时卡 / 七日列表 / 指数卡，信息卡片密集",
    "天气 / 移动端 / 卡片", "晴时 · 天气",
    `
body{min-height:100vh;display:flex;align-items:center;justify-content:center;gap:86px;background:linear-gradient(135deg,#e8eef5,#dbe5ef 55%,#d3dfeb);font-size:13px;color:#1e2a38}
.intro{max-width:310px}.intro h1{font-size:42px;line-height:1.22;letter-spacing:-2px}.intro p{color:#6d7d8d;font-size:14px;line-height:1.9;margin-top:18px}
.intro .kv{display:flex;gap:22px;margin-top:26px}.intro .kv b{display:block;font-size:22px}.intro .kv span{font-size:11px;color:#8a99a8}
.phone{width:390px;height:800px;border-radius:38px;border:9px solid #2b3542;background:linear-gradient(180deg,#5c86b8,#8fb2d4 38%,#d9e6f1 100%);box-shadow:0 40px 90px rgba(30,50,75,.3);overflow:hidden;position:relative;flex-shrink:0;color:#fff}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:130px;height:26px;background:#2b3542;border-radius:0 0 16px 16px;z-index:3}
.status{display:flex;justify-content:space-between;padding:14px 22px 0;font-size:10px;position:relative;z-index:4}
.city{text-align:center;margin-top:22px}.city b{font-size:17px}.city span{display:block;font-size:11px;opacity:.8;margin-top:5px}
.temp{text-align:center;margin-top:12px}.temp b{font-size:82px;font-weight:300;letter-spacing:-5px;line-height:1}.temp span{display:block;font-size:13px;opacity:.9;margin-top:6px}
.sun{width:100px;height:100px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3c4,#ffd479);box-shadow:0 0 60px rgba(255,220,130,.65);margin:14px auto 0}
.hour{margin:20px 16px 0;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:14px;backdrop-filter:blur(8px)}
.hour .hd{font-size:10px;opacity:.85;margin-bottom:12px;display:flex;justify-content:space-between}
.hrow{display:flex;gap:8px;justify-content:space-between}
.hrow div{text-align:center;font-size:10px;opacity:.9;flex:1}.hrow div b{display:block;font-size:15px;font-weight:600;margin:8px 0 6px}.hrow div i{font-style:normal;font-size:14px}
.week{margin:12px 16px 0;background:rgba(255,255,255,.88);color:#2b3a4a;border-radius:14px;padding:12px 14px}
.week .r{display:flex;align-items:center;padding:8px 0;font-size:11px;border-bottom:1px solid rgba(40,60,80,.07)}.week .r:last-child{border:0}
.week .r span{width:52px}.week .r i{font-style:normal;flex:1;opacity:.75}.week .r .bar{width:70px;height:5px;border-radius:5px;background:linear-gradient(90deg,#8fc0e8,#f2c477);margin:0 10px}
.week .r b{font-size:11px}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 16px 0}
.mt{background:rgba(255,255,255,.88);color:#2b3a4a;border-radius:13px;padding:12px}.mt span{font-size:10px;color:#7b8b9b}.mt b{display:block;font-size:19px;margin-top:6px}.mt small{font-size:10px;color:#8a99a8}
.home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:120px;height:4px;border-radius:4px;background:rgba(255,255,255,.6);z-index:5}
`,
    `
<div class="intro"><h1>出门前，<br>先看一眼天</h1><p>晴时 · 天气。把逐小时、七日趋势与生活指数收进一屏，用卡片分层而不是滚动到底。</p>
<div class="kv"><div><b>18°</b><span>当前温度</span></div><div><b>32%</b><span>降水概率</span></div><div><b>优</b><span>空气质量</span></div></div></div>
<div class="phone"><div class="notch"></div><div class="status"><span>9:41</span><span>▮▮▮  ⌁  ▰</span></div>
<div class="city"><b>杭州 · 西湖区</b><span>11 月 11 日 星期三 · 多云转晴</span></div>
<div class="temp"><b>18°</b><span>体感 16° · 最高 21° / 最低 12°</span></div><div class="sun"></div>
<div class="hour"><div class="hd"><span>未来 6 小时</span><span>降水概率 10% ↓</span></div><div class="hrow">
<div><span>现在</span><i>☀</i><b>18°</b></div><div><span>10:00</span><i>☀</i><b>19°</b></div><div><span>11:00</span><i>◐</i><b>20°</b></div>
<div><span>12:00</span><i>◐</i><b>21°</b></div><div><span>13:00</span><i>☁</i><b>20°</b></div><div><span>14:00</span><i>☁</i><b>19°</b></div></div></div>
<div class="week"><div class="r"><span>今天</span><i>◐ 多云</i><div class="bar"></div><b>12° / 21°</b></div>
<div class="r"><span>周四</span><i>☀ 晴</i><div class="bar" style="background:linear-gradient(90deg,#9ecbe8,#f4cb7d)"></div><b>11° / 22°</b></div>
<div class="r"><span>周五</span><i>☁ 阴</i><div class="bar" style="background:linear-gradient(90deg,#a9b8c6,#c9d4de)"></div><b>13° / 19°</b></div>
<div class="r"><span>周六</span><i>☂ 小雨</i><div class="bar" style="background:linear-gradient(90deg,#8fb6d8,#7fa8cf)"></div><b>12° / 17°</b></div></div>
<div class="metrics"><div class="mt"><span>空气质量</span><b>32 优</b><small>PM2.5 18 μg/m³</small></div>
<div class="mt"><span>紫外线</span><b>中等</b><small>建议涂抹防晒</small></div>
<div class="mt"><span>风速</span><b>2 级</b><small>东南风 3 m/s</small></div><div class="mt"><span>日落</span><b>17:08</b><small>昼长 10h 32m</small></div></div>
<div class="home"></div></div>
`)

// __MORE_DEMOS__

// ==================================================================
// 生成的板块：样式 / 结构 / 浏览器运行时 / 注入
// ==================================================================

const BLOCK_CSS = `
[hidden]{display:none!important}
.viewbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:-4px 0 18px}
.viewbtn{display:flex;align-items:center;gap:9px;border:1px solid var(--line);background:rgba(255,255,255,.82);border-radius:14px;padding:11px 18px;font-size:14px;font-weight:700;color:#4b5060;cursor:pointer;transition:.2s;box-shadow:0 6px 18px rgba(30,35,50,.05)}
.viewbtn:hover{transform:translateY(-2px)}
.viewbtn.active{background:#181a20;color:#fff;border-color:#181a20;box-shadow:0 10px 24px rgba(24,26,32,.2)}
.viewbtn small{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:#eeeaff;color:#5b50c9}
.viewbtn.active small{background:rgba(255,255,255,.2);color:#fff}
.viewbtn:focus-visible,.pt-cat:focus-visible,.pt-vbtn:focus-visible,.pt-vback:focus-visible{outline:3px solid #8176ff;outline-offset:3px}
.viewhint{margin-left:auto;font-size:12px;color:var(--muted)}
.pt-toolbar{position:sticky;top:12px;z-index:30;display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;padding:12px;border-radius:19px;background:rgba(255,255,255,.82);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.9);box-shadow:0 12px 36px rgba(40,44,60,.1);margin-bottom:20px}
.pt-search{background:#fff;font-size:13px}
.pt-search input{width:100%;border:0;outline:0;background:transparent;padding:12px 0}
.pt-search input::placeholder{color:#6f7480;opacity:1}
.pt-cats{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
.pt-cat{border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px 13px;font-size:12.5px;cursor:pointer;transition:.2s;white-space:nowrap}
.pt-cat:hover{transform:translateY(-1px)}.pt-cat.active{background:#181a20;color:#fff;border-color:#181a20}
.pt-intro{background:linear-gradient(120deg,#f1edff,#e9f6ff);border:1px solid #e5e0ff;border-radius:18px;padding:18px 22px;margin-bottom:20px;display:flex;gap:16px;align-items:center}
.pt-intro .ic{font-size:27px;line-height:1}
.pt-intro h2{margin:0 0 6px;font-size:17px;letter-spacing:-.3px}
.pt-intro p{margin:0;font-size:12.5px;color:#6d7280;line-height:1.7}
.pt-intro .n{margin-left:auto;white-space:nowrap;font-size:12px;color:#5b50c9;background:#fff;padding:8px 14px;border-radius:999px;font-weight:700;box-shadow:0 4px 12px rgba(90,80,180,.08)}
.pt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.pt-card{background:rgba(255,255,255,.96);border:1px solid rgba(255,255,255,.96);border-radius:20px;overflow:hidden;box-shadow:0 10px 28px rgba(32,36,48,.08);transition:.23s;cursor:pointer}
.pt-card:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(32,36,48,.16)}
.pt-card:focus-visible{outline:3px solid #8176ff;outline-offset:3px}
.pt-thumb{height:210px;position:relative;overflow:hidden;background:#eef0f7;border-bottom:1px solid #eef0f5}
.pt-thumb iframe{position:absolute;top:0;left:0;width:400%;height:400%;transform:scale(.25);transform-origin:top left;border:0;pointer-events:none;background:#fff}
.pt-zoom{position:absolute;right:12px;bottom:12px;background:rgba(24,26,32,.84);color:#fff;font-size:11px;padding:7px 12px;border-radius:999px;opacity:0;transform:translateY(6px);transition:.2s}
.pt-card:hover .pt-zoom,.pt-card:focus-visible .pt-zoom{opacity:1;transform:none}
.pt-meta{padding:16px 18px 18px}
.pt-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
.pt-head b{font-size:15px}
.pt-badge{font-size:11px;padding:4px 9px;border-radius:999px;background:#eeeaff;color:#5b50c9;white-space:nowrap}
.pt-meta p{font-size:12.5px;color:var(--muted);line-height:1.65;margin:8px 0 0;min-height:40px}
.pt-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
.pt-tags span{font-size:10.5px;color:#8a90a0;background:#f4f5f9;border-radius:6px;padding:4px 8px}
.pt-empty{text-align:center;color:var(--muted);padding:55px}
.pt-viewer{position:fixed;inset:0;z-index:2000;background:#0f1117;display:none;flex-direction:column}
.pt-viewer.open{display:flex}
.pt-vtop{height:58px;background:#191c25;color:#fff;display:flex;align-items:center;gap:9px;padding:0 16px;flex-shrink:0;border-bottom:1px solid #2a2f3b;overflow-x:auto}
.pt-vback{border:0;background:transparent;color:#c8cfe0;font-size:13px;padding:8px 10px;border-radius:8px;cursor:pointer;white-space:nowrap}
.pt-vback:hover{background:#262c39}
.pt-vtop b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}
.pt-vtop .meta{font-size:11px;color:#8b94a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pt-vtop .sp{flex:1;min-width:8px}
.pt-vbtn{border:1px solid #343b4b;background:#232834;color:#d5dbe8;border-radius:9px;padding:8px 12px;font-size:12px;cursor:pointer;white-space:nowrap}
.pt-vbtn:hover{background:#2e3545}
.pt-vbtn.on{background:#6758ff;border-color:#6758ff;color:#fff}
.pt-vclose{background:#e05b5b;border-color:#e05b5b;color:#fff;font-weight:700}
.pt-stage{flex:1;display:grid;place-items:center;padding:18px;overflow:auto;background:radial-gradient(circle at 50% 0,#1b2030,#0f1117)}
.pt-stage iframe{width:100%;height:100%;border:0;background:#fff;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.pt-stage.mobile iframe{width:390px;height:760px;border:8px solid #23262e;border-radius:32px;box-shadow:0 24px 60px rgba(0,0,0,.5)}
@media(max-width:900px){.viewhint{display:none}.pt-toolbar{grid-template-columns:1fr}.pt-cats{justify-content:flex-start}.pt-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}.pt-intro .n{display:none}.pt-vtop .meta{display:none}}

/* ---- premium shell：中性底 / 细线 / 克制圆角 / 编辑感标题 ---- */
:root{--accent:#3b4263;--line:#e6e6e2;--muted:#777b84}
body{background:radial-gradient(1100px 560px at 50% -12%,#fff 0,rgba(255,255,255,0) 70%),#f7f7f5;color:#181a1f}
.hero h1{font-family:"Iowan Old Style","Palatino Linotype",Georgia,"Times New Roman",serif;font-weight:600;letter-spacing:-.048em}
.hero p{color:#6f737c}
.counter{background:rgba(255,255,255,.72);border:1px solid #e7e7e3;box-shadow:none;color:#6f737c;font-variant-numeric:tabular-nums}
.viewbar{margin-top:2px}
.viewbtn{border-radius:10px;background:transparent;border-color:#e2e2de;box-shadow:none;color:#555a63;font-weight:600}
.viewbtn.active{background:#181a1f;border-color:#181a1f;color:#fff;box-shadow:none}
.viewbtn small{background:#ececf0;color:#5b6070}
.viewbtn.active small{background:rgba(255,255,255,.16);color:#fff}
.viewhint{color:#8a8e96;letter-spacing:.02em}
.toolbar,.pt-toolbar{background:rgba(255,255,255,.76);border:1px solid #e9e9e5;box-shadow:0 8px 26px rgba(28,30,36,.045);border-radius:14px}
.search,.pt-search{border:1px solid #e9e9e5;background:rgba(255,255,255,.7);border-radius:10px}
.filter,.pt-cat{border-radius:9px;border-color:#e4e4e0;background:transparent;color:#5f636c}
.filter.active,.pt-cat.active{background:#181a1f;border-color:#181a1f;color:#fff}
.motionToggle{border-radius:9px;background:#f0f0f4;border-color:#e2e2e6;color:#4d5262}
.pt-intro{background:linear-gradient(120deg,#f3f3f0,#f8f8f6);border:1px solid #e8e8e3;border-radius:14px}
.pt-intro .ic{color:#4a5068;font-weight:400}
.pt-intro h2{font-weight:650;letter-spacing:-.03em}
.pt-intro p{color:#747983}
.pt-intro .n{background:#fff;border:1px solid #e8e8e3;box-shadow:none;color:#4a5068;font-weight:600}
.pt-grid{gap:22px}
.pt-card{border:1px solid #e8e8e4;border-radius:13px;background:#fff;box-shadow:0 2px 8px rgba(28,30,36,.035)}
.pt-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(28,30,36,.09)}
.pt-thumb{height:206px;border-bottom:1px solid #ecece8;background:#f2f2ef}
.pt-zoom{background:rgba(24,26,31,.9);border-radius:8px;letter-spacing:.02em}
.pt-meta{padding:17px 18px 19px}
.pt-head b{font-weight:650;letter-spacing:-.02em}
.pt-badge{background:transparent;border:1px solid #dcdce2;color:#5a5f6c;border-radius:6px;font-size:10px;letter-spacing:.04em}
.pt-tags span{background:#f6f6f4;color:#858a92;border-radius:5px}
.grid article.card{border:1px solid #e8e8e4;border-radius:13px;background:#fff;box-shadow:0 2px 8px rgba(28,30,36,.035)}
.grid article.card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(28,30,36,.09)}
.pt-viewer{background:#101216}
.pt-vtop{background:#14161c;border-bottom:1px solid #262a33}
.pt-vbtn{border:1px solid #343842;background:#1c1f27;color:#d7dbe4;border-radius:8px;font-weight:500}
.pt-vbtn.on{background:#f2f2f0;color:#181a1f;border-color:#f2f2f0}
.pt-vclose{background:#b8564f;border-color:#b8564f;color:#fff}
.pt-stage{background:radial-gradient(circle at 50% 0,#1a1e27,#101216);padding:20px}
.pt-stage iframe{border:1px solid rgba(255,255,255,.1);border-radius:8px;box-shadow:0 24px 60px rgba(0,0,0,.4)}
.viewbtn:focus-visible,.pt-cat:focus-visible,.pt-vbtn:focus-visible{outline:2px solid #8b86c8;outline-offset:2px}
.pt-vback:focus-visible{outline:2px solid rgba(255,255,255,.26);outline-offset:2px}

/* ---- shell motion ---- */
@keyframes fxShellIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.pt-card{position:relative;--mx:50%;--my:50%;animation:fxShellIn .5s cubic-bezier(.22,.68,.2,1) both}
.pt-card::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(340px circle at var(--mx) var(--my),rgba(120,124,170,.11),transparent 62%)}
.pt-card:hover::after,.pt-card.fx-hovered::after{opacity:1}
.pt-card.fx-hovered{border-color:#c9c6d4;box-shadow:0 14px 30px rgba(28,30,36,.1)}
.pt-card.fx-hovered .pt-zoom{opacity:1;transform:none}
.pt-card .pt-thumb iframe{transition:transform .5s cubic-bezier(.2,.7,.2,1)}
.pt-card:hover .pt-thumb iframe,.pt-card.fx-hovered .pt-thumb iframe{transform:scale(.253) translateY(-3px)}
.pt-toolbar,.pt-intro{animation:fxShellIn .45s both}
.viewbtn:active,.pt-cat:active,.filter:active{transform:scale(.97)}
.pt-zoom{backdrop-filter:blur(6px)}
.motion-paused .pt-card,.motion-paused .pt-toolbar,.motion-paused .pt-intro{animation:none}

/* ---- search / command palette ---- */
mark{background:rgba(139,134,200,.22);color:inherit;border-radius:3px;padding:0 2px}
.gsTrigger{margin-left:14px;border:1px solid #dedee2;background:rgba(255,255,255,.7);border-radius:9px;padding:9px 13px;font-size:12px;color:#555a63;cursor:pointer;transition:.2s;white-space:nowrap}
.gsTrigger:hover{border-color:#b9b9c6;background:#fff}
.gsTrigger kbd,.gs-input kbd{font:inherit;font-size:10px;border:1px solid #dcdce2;border-radius:5px;padding:2px 5px;color:#8a8e98;background:#f7f7f8}
.pt-clear{border:0;background:transparent;color:#9aa0ac;font-size:12px;cursor:pointer;padding:2px 4px;opacity:.35;transition:.2s;flex-shrink:0}
.pt-search:focus-within .pt-clear,.pt-clear.show{opacity:1}
.pt-clear:hover{color:#181a1f}
.pt-suggest{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:-6px 0 18px}
.pt-suggest>span{font-size:11px;color:#9a9ea6;margin-right:2px}
.pt-suggest button,.pt-empty button,.empty button{font-size:11px;border:1px solid #e4e4e0;background:#fff;color:#5f636c;border-radius:7px;padding:5px 10px;cursor:pointer;transition:.2s}
.pt-suggest button:hover,.pt-empty button:hover,.empty button:hover{border-color:#b9b9c6;color:#181a1f}
.pt-empty button,.empty button{margin:0 4px}
.pt-pos{font-size:11px;color:#8b94a8;font-variant-numeric:tabular-nums;white-space:nowrap}
.gs{position:fixed;inset:0;z-index:3000;display:none;align-items:flex-start;justify-content:center;padding-top:11vh}
.gs.open{display:flex}
.gs-mask{position:absolute;inset:0;background:rgba(20,22,28,.42);backdrop-filter:blur(5px)}
.gs-box{position:relative;width:min(680px,92vw);max-height:74vh;display:flex;flex-direction:column;background:#fbfbfa;border:1px solid #e3e3df;border-radius:16px;box-shadow:0 30px 90px rgba(20,22,28,.28);overflow:hidden;animation:fxShellIn .28s both}
.gs-input{display:flex;align-items:center;gap:11px;padding:16px 18px;border-bottom:1px solid #e9e9e5}
.gs-input>span{font-size:20px;color:#8a8e98}
.gs-input input{flex:1;border:0;outline:0;background:transparent;font-size:16px;color:#181a1f}
.gs-input input::placeholder{color:#a2a6ae}
.gs-hot{display:flex;gap:7px;flex-wrap:wrap;align-items:center;padding:12px 18px;border-bottom:1px solid #f0f0ec}
.gs-hot>span{font-size:11px;color:#9a9ea6}
.gs-hot button{font-size:11px;border:1px solid #e4e4e0;background:#fff;border-radius:7px;padding:5px 10px;color:#5f636c;cursor:pointer}
.gs-hot button:hover{border-color:#b9b9c6;color:#181a1f}
.gs-results{flex:1;overflow:auto;padding:8px}
.gs-group{font-size:10px;letter-spacing:.12em;color:#9a9ea6;padding:12px 12px 6px}
.gs-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:9px;cursor:pointer;color:#3b3f48}
.gs-item:hover,.gs-item.on{background:#efeff4}
.gs-item .ic{width:28px;height:28px;border-radius:7px;background:#e9e9ee;display:grid;place-items:center;font-size:13px;color:#5b6070;flex-shrink:0}
.gs-item .tx{flex:1;min-width:0}
.gs-item b{display:block;font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-item small{display:block;font-size:11px;color:#8a8e98;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-item .kind{font-size:10px;color:#8a8e98;border:1px solid #e2e2e0;border-radius:5px;padding:3px 7px;white-space:nowrap}
.gs-empty{padding:36px;text-align:center;color:#8a8e98;font-size:13px}
.gs-foot{display:flex;justify-content:space-between;gap:12px;padding:11px 18px;border-top:1px solid #e9e9e5;font-size:10.5px;color:#9a9ea6}
@media(max-width:700px){.gs-foot span:first-child{display:none}.gsTrigger kbd{display:none}}

/* ---- Design system / Quiet editorial ---------------------------------
   唯一视觉来源：以下语义 token。上方区块只保留布局与运行时所需的
   基础声明，颜色、圆角、阴影、字重、字号一律以本层为准。
   组件预览内部的彩色属于「展品」，刻意不收敛：中性画框衬彩色作品。 */
:root{
  --paper:#f7f7f4; --surface:#ffffff; --surface-2:#f1f1ee;
  --line:#e5e5e0; --line-strong:#d3d3cd;
  --ink:#1b1c20; --ink-2:#5f636c; --ink-3:#666b74;
  --brand:#2f3550; --focus:#2f3550; --on-dark:#a8adb8;
  --r-card:10px; --r-ctl:8px;
  --shadow:0 1px 2px rgba(26,28,32,.035);
  --shadow-hover:0 12px 28px rgba(26,28,32,.085);
  --serif:"Iowan Old Style","Palatino Linotype",Georgia,"Times New Roman",serif;
  --bg:var(--paper); --card:var(--surface); --text:var(--ink);
  --muted:var(--ink-2); --accent:var(--brand);
}
body{background:var(--paper);color:var(--ink);-webkit-font-smoothing:antialiased}
.app{padding:40px 28px 76px}
.hero{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:22px}
.hero>div:first-child::before{content:"DESIGN REFERENCE · VOL. 01";display:block;color:var(--ink-3);font-size:10.5px;font-weight:500;letter-spacing:.18em;margin-bottom:14px}
.hero h1{font-family:var(--serif);font-weight:600;font-size:clamp(34px,4vw,52px);letter-spacing:-.045em;line-height:1.1}
.hero p{color:var(--ink-2);font-size:13px;line-height:1.75;max-width:62ch}
.counter{background:transparent;border:1px solid var(--line-strong);border-radius:999px;color:var(--ink-2);font-size:12px;padding:9px 15px;box-shadow:none;font-variant-numeric:tabular-nums;white-space:nowrap}
.counter b{color:var(--ink);font-weight:600}

/* 视图切换：下划线式 tab，实心块只留给筛选 */
.viewbar{display:flex;align-items:center;gap:2px;flex-wrap:wrap;margin:0 0 18px;padding:0;border-bottom:1px solid var(--line)}
.viewbtn{position:relative;border:0;background:transparent;border-radius:0;box-shadow:none;padding:12px 16px 14px;min-height:44px;font-size:13px;font-weight:500;color:var(--ink-2);transition:color .2s,background .2s}
.viewbtn:hover{transform:none;background:var(--surface-2);color:var(--ink)}
.viewbtn.active{background:transparent;border-color:transparent;color:var(--ink);font-weight:600;box-shadow:none;transform:none}
.viewbtn.active::after{content:"";position:absolute;left:16px;right:16px;bottom:-1px;height:2px;background:var(--ink)}
.viewbtn small{background:var(--surface-2);color:var(--ink-2);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:500;font-variant-numeric:tabular-nums}
.viewbtn.active small{background:rgba(27,28,32,.08);color:var(--ink)}
.viewhint{margin-left:auto;color:var(--ink-3);font-size:12px;letter-spacing:.01em}
.gsTrigger{margin-left:12px;border:1px solid var(--line);background:transparent;border-radius:var(--r-ctl);padding:10px 13px;min-height:44px;font-size:12px;font-weight:400;color:var(--ink-2);box-shadow:none;white-space:nowrap}
.gsTrigger:hover{border-color:var(--line-strong);background:var(--surface);transform:none}
.gsTrigger kbd,.gs-input kbd{font-size:10.5px;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);border-radius:4px;padding:2px 5px}

/* 工具栏：单层、极淡阴影 */
.toolbar,.pt-toolbar{position:sticky;top:12px;z-index:30;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--shadow);padding:10px 12px;margin-bottom:22px}
.search,.pt-search{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-ctl);font-size:13px}
.search input,.pt-search input{color:var(--ink)}
.search input::placeholder,.pt-search input::placeholder{color:var(--ink-3);opacity:1}
.filters,.pt-cats{justify-content:flex-start}
.filter,.pt-cat{min-height:44px;padding:10px 14px;border:1px solid var(--line);background:transparent;color:var(--ink-2);border-radius:var(--r-ctl);font-size:12.5px;font-weight:400;white-space:nowrap}
.filter:hover,.pt-cat:hover{transform:none;border-color:var(--line-strong);color:var(--ink)}
.filter.active,.pt-cat.active{background:var(--ink);border-color:var(--ink);color:#fff;font-weight:500;box-shadow:none;transform:none}
.motionToggle{min-height:44px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink-2);border-radius:var(--r-ctl);font-weight:500}
.motionToggle:hover{border-color:var(--line-strong);color:var(--ink)}

/* 卡片：画廊式白框 */
.grid{gap:22px}
.grid article.card,.pt-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:var(--shadow)}
.grid article.card{position:relative}
.grid article.card::before{content:"";position:absolute;z-index:2;top:0;left:0;right:0;height:2px;background:var(--brand);opacity:0;transition:opacity .25s}
.grid article.card:hover::before,.grid article.card:focus-visible::before{opacity:1}
.grid article.card:hover,.pt-card:hover{transform:translateY(-3px);border-color:var(--line-strong);box-shadow:var(--shadow-hover)}
.preview{background:var(--surface-2);border-bottom:1px solid var(--line)}
.meta{padding:16px 18px 18px}
.name{font-size:14px;font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.tag{background:transparent;border:1px solid var(--line);color:var(--ink-2);font-size:11px;font-weight:400;padding:3px 8px;border-radius:999px}
.desc{font-size:12.5px;color:var(--ink-2);line-height:1.65;margin-top:8px}
/* 减层：场景与 CTA 退为辅助信息，hover 才显强调 */
.sceneLine{margin-top:8px;padding:0;background:transparent;border:0;border-radius:0;color:var(--ink-3);font-size:12px;line-height:1.5}
.promptHint{margin-top:8px;padding:0;border:0;color:var(--ink-3);font-size:12px;font-weight:400;letter-spacing:.01em;transition:color .2s}
.grid article.card:hover .promptHint,.grid article.card:focus-visible .promptHint{color:var(--brand)}

/* 页面模板视图：横线分节取代渐变公告板 */
.pt-intro{background:transparent;border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);border-radius:0;padding:18px 0;margin-bottom:22px}
.pt-intro .ic{color:var(--brand);font-size:22px;font-weight:400}
.pt-intro h2{font-family:var(--serif);font-size:20px;font-weight:600;letter-spacing:-.03em;color:var(--ink)}
.pt-intro p{font-size:12.5px;color:var(--ink-2);line-height:1.7}
.pt-intro .n{background:var(--surface);border:1px solid var(--line);color:var(--ink-2);font-weight:500;border-radius:999px;box-shadow:none;font-variant-numeric:tabular-nums}
.pt-grid{gap:24px}
.pt-thumb{height:200px;background:var(--surface-2);border-bottom:1px solid var(--line)}
.pt-zoom{background:rgba(27,28,32,.9);border-radius:var(--r-ctl);font-size:11px;letter-spacing:.02em}
.pt-meta{padding:16px 18px 18px}
.pt-head b{font-size:14.5px;font-weight:600;letter-spacing:-.01em;color:var(--ink)}
.pt-badge{background:transparent;border:1px solid var(--line);color:var(--ink-2);border-radius:var(--r-ctl);font-size:10.5px;letter-spacing:.04em}
.pt-meta p{font-size:12.5px;color:var(--ink-2);line-height:1.65;min-height:0}
.pt-tags span{background:transparent;border:1px solid var(--line);color:var(--ink-3);border-radius:var(--r-ctl);font-size:11px}
.pt-clear{color:var(--ink-3);opacity:.55}
.pt-pos{color:var(--ink-2)}
.pt-suggest>span,.pt-empty button,.empty button,.gs-group,.gs-item small,.gs-item .kind,.gs-empty,.gs-foot,.gs-hot>span{color:var(--ink-2)}
.pt-suggest button,.pt-empty button,.empty button,.gs-hot button{font-size:12px;min-height:36px;border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:var(--r-ctl)}
.pt-suggest button:hover,.pt-empty button:hover,.empty button:hover,.gs-hot button:hover{border-color:var(--line-strong);color:var(--ink)}
mark{background:rgba(47,53,80,.13);color:inherit}

/* 全屏预览：深色工具条 */
.pt-viewer{background:#101216}
.pt-vtop{background:#14161c;border-bottom:1px solid #262a33}
.pt-vbtn{min-height:36px;border:1px solid #343842;background:#1c1f27;color:#d7dbe4;border-radius:var(--r-ctl);font-weight:400}
.pt-vbtn.on{background:var(--surface);color:var(--ink);border-color:var(--surface)}
.pt-vclose{background:#8f4a45;border-color:#8f4a45;color:#fff}
.pt-stage{background:radial-gradient(circle at 50% 0,#1a1e27,#101216);padding:20px}
.pt-stage iframe{border:1px solid rgba(255,255,255,.1);border-radius:var(--r-ctl)}
.pt-vback{color:#c8cfe0}

/* Prompt 弹窗 */
.promptPanel{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:0 24px 70px rgba(20,22,28,.16);padding:28px}
.promptBackdrop{background:rgba(20,22,28,.42)}
.promptEyebrow{color:var(--brand);font-size:10.5px;letter-spacing:.16em;font-weight:500}
.promptPanel h2{font-family:var(--serif);font-weight:600;font-size:26px;letter-spacing:-.03em;color:var(--ink)}
.promptMeta{color:var(--ink-2)}
.promptScene{background:var(--surface-2);color:var(--ink);font-weight:500;border-radius:var(--r-ctl)}
.promptOptions{color:var(--ink-2)}
.promptOptions select,.secondaryBtn{border:1px solid var(--line);background:var(--surface);color:var(--ink-2);border-radius:var(--r-ctl)}
.promptTabs{background:var(--surface-2);border-radius:var(--r-ctl)}
.promptTab{font-weight:500;color:var(--ink-2);border-radius:6px;filter:grayscale(1)}
.promptTab:hover{background:rgba(255,255,255,.55);color:var(--ink)}
.promptTab.active{background:var(--surface);color:var(--ink);box-shadow:none}
#promptText{background:var(--paper);border:1px solid var(--line);border-radius:var(--r-ctl);color:var(--ink)}
#codeBlock{border-radius:var(--r-ctl)}
.copyBtn{background:var(--ink);color:#fff;border-radius:var(--r-ctl)}
.promptActions button{border-radius:var(--r-ctl);min-height:44px}
.promptClose{background:var(--surface-2);color:var(--ink-2)}

/* 全局搜索面板 */
.gs-box{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-card);box-shadow:0 30px 80px rgba(20,22,28,.2)}
.gs-input,.gs-hot,.gs-foot{border-color:var(--line)}
.gs-input>span{color:var(--ink-3)}
.gs-input input::placeholder{color:var(--ink-3)}
.gs-group{font-size:10.5px;letter-spacing:.12em;color:var(--ink-3)}
.gs-item:hover,.gs-item.on{background:var(--surface-2)}
.gs-item b{font-weight:600;font-size:13px;color:var(--ink)}
.gs-item .ic{background:var(--surface-2);color:var(--ink-2);border-radius:6px}
.gs-item .kind{border-color:var(--line)}
.gs-foot{font-size:12px;color:var(--ink-2)}

/* 焦点：浅底墨色 9.6:1，深色工具条 7.7:1 */
.card:focus-visible,.filter:focus-visible,.motionToggle:focus-visible,
.promptPanel button:focus-visible,.promptPanel select:focus-visible,
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,
[contenteditable]:focus-visible,.viewbtn:focus-visible,.pt-cat:focus-visible,
.pt-vbtn:focus-visible,.pt-card:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.pt-vback:focus-visible{outline:2px solid var(--on-dark);outline-offset:2px}

/* 动效层收敛为中性 */
.pt-card::after{background:radial-gradient(340px circle at var(--mx) var(--my),rgba(27,28,32,.045),transparent 62%)}
.pt-card.fx-hovered{border-color:var(--line-strong);box-shadow:var(--shadow-hover)}

/* 断点统一：900 / 640 */
@media(max-width:900px){
  .viewhint{display:none}
  .toolbar,.pt-toolbar{grid-template-columns:1fr;position:static}
  .filters,.pt-cats{justify-content:flex-start}
  .hero{align-items:flex-start;flex-direction:column}
  .app{padding:24px 16px 52px !important}
  .pt-grid{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
  .pt-intro .n,.pt-vtop .meta{display:none}
}
@media(max-width:640px){
  .grid,.pt-grid{grid-template-columns:1fr}
  .hero h1{font-size:32px}
  .gs-foot span:first-child,.gsTrigger kbd{display:none}
  .pt-vtop b{max-width:140px}
}
@media(prefers-reduced-motion:reduce){
  .grid article.card:hover,.pt-card:hover,.viewbtn:hover,.filter:hover,.pt-cat:hover{transform:none}
  .pt-card,.pt-toolbar,.pt-intro{animation:none}
}
`;

const BLOCK_SWITCH = `<nav aria-label="内容视图" class="viewbar" role="tablist">
<button aria-selected="true" class="viewbtn active" data-view="components" role="tab" type="button">◧ 组件库 <small class="nComponents">391</small></button>
<button aria-selected="false" class="viewbtn" data-view="pages" role="tab" type="button">▤ 页面模板 <small class="nPages">30</small></button>
<span class="viewhint">按业务场景组织的完整页面 · 全屏预览 / 视口切换 / 复制源码</span>
<button aria-label="打开全局搜索" class="gsTrigger" id="gsTrigger" type="button">⌕ 全局搜索 <kbd data-kbd>Ctrl K</kbd></button>
</nav>`;

const BLOCK_GALLERY = `<section aria-label="页面模板" id="pageGallery" hidden>
<div class="pt-toolbar">
<label class="search pt-search">⌕ <input aria-label="搜索页面模板" id="ptQ" placeholder="搜索：落地页 / 仪表盘 / 结算 / 看板 ...  空格多词 · 逗号或"/> <button aria-label="清空搜索" class="pt-clear" id="ptClear" type="button">✕</button></label>
<div aria-label="页面分类" class="pt-cats" id="ptCats" role="tablist"></div>
</div>
<div class="pt-intro"><div class="ic" id="ptIcon">▦</div><div><h2 id="ptTitle">全部页面模板</h2><p id="ptDesc">按业务场景组织的完整前端页面，点击任意卡片全屏预览。</p></div><span aria-live="polite" class="n" id="ptCount">0 个页面</span></div>
<div class="pt-suggest" id="ptSuggest"></div>
<div class="pt-grid" id="ptGrid"></div><div class="pt-empty" id="ptEmpty">没有匹配的页面模板，换个关键词试试</div>
</section>
<div aria-hidden="true" aria-label="页面模板预览" aria-modal="true" class="pt-viewer" id="ptViewer" role="dialog">
<div class="pt-vtop">
<button class="pt-vback" id="ptClose" type="button">← 返回图库</button>
<b id="ptVTitle">—</b><span class="meta" id="ptVMeta"></span>
<button aria-label="上一个模板" class="pt-vbtn" id="ptPrev" type="button">‹</button>
<button aria-label="下一个模板" class="pt-vbtn" id="ptNext" type="button">›</button>
<span class="pt-pos" id="ptPos"></span><span class="sp"></span>
<button class="pt-vbtn on" data-vp="desktop" type="button">桌面</button>
<button class="pt-vbtn" data-vp="mobile" type="button">移动 390</button>
<button class="pt-vbtn" id="ptRefresh" type="button">刷新</button>
<button class="pt-vbtn" id="ptCopy" type="button">复制源码</button>
<button class="pt-vbtn" id="ptOpen" type="button">新窗口</button>
<button class="pt-vbtn pt-vclose" id="ptEsc" type="button">关闭</button>
</div>
<div class="pt-stage" id="ptStage"><iframe id="ptFrame" title="页面模板预览"></iframe></div>
</div>
<div aria-hidden="true" aria-label="全局搜索" aria-modal="true" class="gs" id="gsPanel" role="dialog">
<div class="gs-mask" data-gs-close="1"></div>
<div class="gs-box">
<div class="gs-input"><span>⌕</span><input aria-label="全局搜索" autocomplete="off" id="gsInput" placeholder="搜索 391 个组件与 24 个页面模板…"/><kbd>Esc</kbd></div>
<div class="gs-hot" id="gsHot"></div>
<div class="gs-results" id="gsResults" role="listbox"></div>
<div class="gs-foot"><span>空格 = 同时包含 · 逗号 = 任一匹配 · 支持中英文同义词</span><span>↑↓ 选择 · Enter 打开</span></div>
</div></div>`;

/** 浏览器端运行时：类型注解由 Node 原生 TS 擦除后，整个函数被序列化注入 HTML。 */
function galleryRuntime(data: Demo[], cats: Cat[]): void {
  var $ = function (s: string) { return document.querySelector(s); };
  var $$ = function (s: string) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var byId: Record<string, Demo> = {};
  data.forEach(function (d) { byId[d.id] = d; });
  var catMap: Record<string, Cat> = {};
  cats.forEach(function (c) { catMap[c.id] = c; });

  var viewBtns = $$(".viewbtn"), pageGallery = $("#pageGallery"), toolbar = $(".toolbar"),
      grid = $("#grid"), empty = $("#empty"), heroP = $(".hero p"), counter = $(".counter"),
      count = $("#count"), total = $("#totalCount"),
      ptCats = $("#ptCats"), ptQ = $("#ptQ"), ptGrid = $("#ptGrid"), ptEmpty = $("#ptEmpty"),
      ptTitle = $("#ptTitle"), ptDesc = $("#ptDesc"), ptIcon = $("#ptIcon"), ptCount = $("#ptCount"),
      viewer = $("#ptViewer"), vFrame = $("#ptFrame"), vTitle = $("#ptVTitle"), vMeta = $("#ptVMeta"),
      stage = $("#ptStage"), stageBtns = $$("[data-vp]"), motionToggle = $("#motionToggle"),
      gsPanel = $("#gsPanel"), gsInput = $("#gsInput"), gsResults = $("#gsResults"), gsHot = $("#gsHot"),
      gsTrigger = $("#gsTrigger"), ptSuggest = $("#ptSuggest"), ptClear = $("#ptClear"), ptPos = $("#ptPos"),
      qComponents = $("#q");
  var motionPaused = false, gsIndex = 0, gsItems: any[] = [], currentList: string[] = [];
  var cardMap: Record<string, any> = {}, cardsBuilt = false, debounceTimer: any = null;
  var heroOriginal = heroP ? heroP.textContent : "";
  var componentTotal = document.querySelectorAll("article.card").length;
  var currentCat = "all", currentId: string | null = null, lastFocus: Element | null = null,
      visibleCount = data.length, observer: IntersectionObserver | null = null, isPages = false;
  var kbdEl = document.querySelector("[data-kbd]");
  if (kbdEl) kbdEl.textContent = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "") ? "\u2318K" : "Ctrl K";

  function catLabel(id: string) { return catMap[id] ? catMap[id].name : id; }
  function setHash(h: string) { try { history.replaceState(null, "", h); } catch (e) { /* file:// 下忽略 */ } }
  function esc(s: string) { return s.replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as Record<string, string>)[c]; }); }
  function makeDebounce(ms: number): (fn: () => void) => void {
    var t: any = null;
    return function (fn: () => void) { if (t) clearTimeout(t); t = setTimeout(fn, ms); };
  }
  var debounceComp = makeDebounce(90), debouncePages = makeDebounce(70), debounceGS = makeDebounce(60);

  // 多关键词：空格 = AND，逗号/竖线 = OR；同义词与英文缩写扩大召回
  var SYN: Record<string, string[]> = {
    "落地页": ["landing", "官网", "营销", "homepage"], "landing": ["落地页", "官网"],
    "仪表盘": ["dashboard", "后台", "数据", "console"], "dashboard": ["仪表盘", "后台", "数据"],
    "后台": ["dashboard", "admin", "console", "管理"], "admin": ["后台", "管理"],
    "电商": ["ecommerce", "shop", "商品", "购物车"], "shop": ["电商", "商品"],
    "结算": ["checkout", "购物车", "支付", "下单"], "checkout": ["结算", "购物车"],
    "商详": ["商品详情", "detail", "sku"], "商品详情": ["商详", "detail"],
    "社区": ["content", "论坛", "帖子", "blog"], "内容": ["content", "文章", "博客"],
    "工具": ["tools", "编辑器", "看板", "日历"], "编辑器": ["editor", "code", "ide"],
    "看板": ["kanban", "任务", "board"], "kanban": ["看板", "任务"],
    "移动端": ["mobile", "app", "手机", "ios"], "mobile": ["移动端", "手机", "app"],
    "app": ["移动端", "mobile", "手机"], "音乐": ["music", "播放器"],
    "弹窗": ["modal", "dialog", "反馈"], "modal": ["弹窗", "对话框"],
    "图表": ["chart", "data", "可视化"], "chart": ["图表", "数据"],
    "表格": ["table", "列表", "crud"], "table": ["表格", "数据表"],
    "表单": ["form", "input", "输入"], "form": ["表单", "输入"],
    "动效": ["motion", "animation", "动画"], "motion": ["动效", "动画"],
    "玻璃": ["glass", "毛玻璃", "拟态"], "glass": ["玻璃", "毛玻璃"],
    "导航": ["navigation", "nav", "菜单"], "nav": ["导航", "菜单"],
    "日历": ["calendar", "日程"], "calendar": ["日历", "日程"],
    "监控": ["monitor", "运维", "大屏"], "深色": ["dark", "暗色", "黑色"],
    "定价": ["pricing", "价格", "方案"], "pricing": ["定价", "价格"],
    "文章": ["article", "阅读", "博客"], "作品集": ["portfolio", "作品"],
    "钱包": ["wallet", "记账", "财务"], "健康": ["health", "运动"],
    "ai": ["人工智能", "聊天", "助手", "chat"], "chat": ["ai", "对话", "聊天"],
    "ss": ["搜索", "search"], "ht": ["后台", "dashboard"], "ds": ["电商", "shop"],
    "yd": ["移动端", "mobile"], "ldy": ["落地页", "landing"], "ybp": ["仪表盘", "dashboard"],
    "kb": ["看板", "kanban"], "tb": ["图表", "chart"], "bg": ["表格", "table"]
  };
  function branchesOf(q: string): string[][] {
    return (q || "").toLowerCase().split(/[,，|]/).map(function (b) {
      return b.trim().split(/\s+/).filter(Boolean);
    }).filter(function (b) { return b.length > 0; });
  }
  function hit(text: string, term: string): boolean {
    if (text.indexOf(term) >= 0) return true;
    var alts = SYN[term] || [];
    for (var i = 0; i < alts.length; i++) if (text.indexOf(alts[i]) >= 0) return true;
    return false;
  }
  function testText(text: string, branches: string[][]): boolean {
    if (!branches.length) return true;
    return branches.some(function (toks) { return toks.every(function (t) { return hit(text, t); }); });
  }
  function scoreFields(fields: string[], branches: string[][]): number {
    var s = 0, all = fields.join(" ").toLowerCase();
    branches.forEach(function (toks) {
      toks.forEach(function (t) {
        if (fields[0].indexOf(t) >= 0) s += 12;
        else if (fields[1].indexOf(t) >= 0) s += 7;
        else if (fields[2].indexOf(t) >= 0) s += 5;
        else if (fields[3].indexOf(t) >= 0) s += 3;
        else if (hit(all, t)) s += 1;
      });
    });
    return s;
  }
  function hl(text: string, branches: string[][]): string {
    var out = esc(text), terms: string[] = [];
    branches.forEach(function (b) { b.forEach(function (t) { terms.push(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); }); });
    if (!terms.length) return out;
    return out.replace(new RegExp("(" + terms.join("|") + ")", "gi"), "<mark>$1</mark>");
  }
  var HOT = ["落地页", "仪表盘", "结算", "看板", "文章阅读", "移动端", "弹窗", "图表", "深色", "定价"];
  function recent(): string[] {
    try { return JSON.parse(localStorage.getItem("fuig_recent") || "[]"); } catch (e) { return []; }
  }
  function remember(q: string) {
    try {
      var r = recent().filter(function (x) { return x !== q; });
      r.unshift(q); localStorage.setItem("fuig_recent", JSON.stringify(r.slice(0, 6)));
    } catch (e) { /* file:// 下忽略 */ }
  }

  // 主页面「暂停动效」同步到所有 iframe 文档
  function applyMotion(frame: any) {
    try {
      var d = frame.contentDocument;
      if (d && d.documentElement) d.documentElement.classList.toggle("no-motion", motionPaused);
    } catch (e) { /* 跨源忽略 */ }
  }
  function watchMotion(frame: any) {
    frame.addEventListener("load", function () { applyMotion(frame); });
  }

  // 缩略图：进入视口才加载 iframe，避免同时渲染 24 个整页
  function lazyThumbs() {
    if (observer) observer.disconnect();
    var frames = $$("#ptGrid iframe[data-demo]");
    if (!("IntersectionObserver" in window)) {
      frames.forEach(function (f: any) { watchMotion(f); f.srcdoc = byId[f.getAttribute("data-demo")].html; });
      return;
    }
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var f: any = en.target;
        if (!f.srcdoc) f.srcdoc = byId[f.getAttribute("data-demo")].html;
        if (observer) observer.unobserve(f);
      });
    }, { rootMargin: "240px" });
    frames.forEach(function (f: any) { watchMotion(f); if (observer) observer.observe(f); });
  }
  // 首屏可见卡片立即加载，其余仍交给 IntersectionObserver
  function ensureVisibleThumbs() {
    $$("#ptGrid .pt-card:not([hidden]) iframe[data-demo]").forEach(function (f: any) {
      var r = f.getBoundingClientRect();
      if (!f.srcdoc && r.top < innerHeight * 1.25 && r.bottom > -120) {
        f.srcdoc = byId[f.getAttribute("data-demo")].html;
      }
    });
  }

  function renderCats() {
    var all: Cat[] = [{ id: "all", name: "全部", icon: "▦", desc: "全部业务场景的页面模板" }].concat(cats);
    ptCats.innerHTML = all.map(function (c) {
      return '<button aria-selected="' + (c.id === currentCat) + '" class="pt-cat' + (c.id === currentCat ? " active" : "") +
        '" data-cat="' + c.id + '" role="tab" type="button">' + c.icon + " " + c.name + "</button>";
    }).join("");
  }

  function updateIntro() {
    var c = catMap[currentCat];
    ptIcon.textContent = c ? c.icon : "▦";
    ptTitle.textContent = c ? c.name : "全部页面模板";
    ptDesc.textContent = c ? c.desc : "按业务场景组织的完整前端页面，点击任意卡片全屏预览。";
  }

  function cardHTML(d: Demo): string {
    return '<article aria-label="全屏预览 ' + esc(d.name) + '" class="pt-card" data-id="' + d.id + '" role="button" tabindex="0">' +
      '<div class="pt-thumb"><iframe data-demo="' + d.id + '" tabindex="-1" title="' + esc(d.name) + ' 缩略图"></iframe>' +
      '<span class="pt-zoom">⤢ 全屏预览</span></div>' +
      '<div class="pt-meta"><div class="pt-head"><b>' + esc(d.name) + '</b><span class="pt-badge">' + esc(catLabel(d.cat)) + "</span></div>" +
      "<p>" + esc(d.desc) + "</p>" +
      '<div class="pt-tags">' + d.tags.split(" / ").map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div></div></article>";
  }

  // 卡片只创建一次；后续搜索/分类只切换 hidden + CSS order，iframe 不重建、不闪烁
  function buildAllCards() {
    ptGrid.innerHTML = data.map(cardHTML).join("");
    $$("#ptGrid .pt-card").forEach(function (c: any, i: number) {
      cardMap[c.getAttribute("data-id")] = c;
      c.style.animationDelay = Math.min(i, 11) * 38 + "ms";
    });
    cardsBuilt = true;
    lazyThumbs();
  }

  function renderCards() {
    if (!cardsBuilt) buildAllCards();
    var branches = branchesOf((ptQ.value || "").trim());
    var list = data.filter(function (d) {
      if (currentCat !== "all" && d.cat !== currentCat) return false;
      var label = catLabel(d.cat).toLowerCase();
      var fields = [d.name.toLowerCase(), (d.tags + " " + label).toLowerCase(), label, d.desc.toLowerCase()];
      return testText(fields.join(" "), branches);
    }).map(function (d) {
      var label = catLabel(d.cat).toLowerCase();
      var fields = [d.name.toLowerCase(), (d.tags + " " + label).toLowerCase(), label, d.desc.toLowerCase()];
      return { d: d, s: scoreFields(fields, branches) };
    }).sort(function (a, b) { return b.s - a.s; });

    visibleCount = list.length;
    currentList = list.map(function (x) { return x.d.id; });
    ptCount.textContent = visibleCount + " / " + data.length + " 个页面";
    syncCounter();
    Object.keys(cardMap).forEach(function (id) { cardMap[id].hidden = true; });
    list.forEach(function (x, i) {
      var node: any = cardMap[x.d.id];
      node.hidden = false;
      node.style.order = String(i);
      node.querySelector(".pt-head b").innerHTML = hl(x.d.name, branches);
      node.querySelector(".pt-meta p").innerHTML = hl(x.d.desc, branches);
      node.querySelector(".pt-badge").innerHTML = hl(catLabel(x.d.cat), branches);
    });
    ptEmpty.style.display = list.length ? "none" : "block";
    if (!list.length) {
      ptEmpty.innerHTML = "没有匹配的页面模板 · 试试 " + HOT.slice(0, 5).map(function (w) {
        return '<button data-suggest="' + esc(w) + '" type="button">' + esc(w) + "</button>";
      }).join("");
    }
    ptClear.classList.toggle("show", !!ptQ.value);
    ensureVisibleThumbs();
  }

  function renderSuggest() {
    var r = recent();
    var words = r.length
      ? r.slice(0, 4).concat(HOT.filter(function (w) { return r.indexOf(w) < 0; }).slice(0, 5))
      : HOT.slice(0, 8);
    ptSuggest.innerHTML = "<span>快速搜索</span>" + words.map(function (w) {
      return '<button data-suggest="' + esc(w) + '" type="button">' + esc(w) + "</button>";
    }).join("");
  }

  function syncCounter() {
    if (!isPages) return;
    count.textContent = visibleCount;
    total.textContent = data.length;
  }

  function setView(v: string, writeHash: boolean) {
    var pages = v === "pages";
    isPages = pages;
    viewBtns.forEach(function (b: any) {
      var on = b.getAttribute("data-view") === v;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    toolbar.hidden = pages; grid.hidden = pages; pageGallery.hidden = !pages;
    if (pages) {
      empty.style.display = "none";
      if (heroP) heroP.textContent = componentTotal + " 个 UI 组件速查 + 按业务场景组织的完整页面模板。可全屏预览、切换视口、一键复制整页源码。";
      if (counter && counter.lastChild) counter.lastChild.textContent = " 个页面";
      total.textContent = data.length;
      count.textContent = visibleCount;
      if (writeHash) setHash("#pages/" + currentCat);
    } else {
      closeViewer(false);
      if (heroP) heroP.textContent = heroOriginal;
      if (counter && counter.lastChild) counter.lastChild.textContent = " 个效果";
      total.textContent = componentTotal;
      if (typeof (window as any).run === "function") (window as any).run();
      if (writeHash) setHash("#components");
    }
  }

  function openViewer(id: string, writeHash: boolean) {
    var d = byId[id];
    if (!d) return;
    currentId = id;
    lastFocus = document.activeElement;
    vTitle.textContent = d.name;
    vMeta.textContent = catLabel(d.cat) + " · " + d.tags;
    var order = currentList.length ? currentList : data.map(function (x) { return x.id; });
    var k = order.indexOf(id) + 1;
    ptPos.textContent = k > 0 ? k + " / " + order.length : "";
    vFrame.srcdoc = d.html;
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    ($("#ptClose") as HTMLElement).focus();
    if (writeHash !== false) setHash("#page/" + id);
  }

  function closeViewer(writeHash: boolean) {
    if (!viewer.classList.contains("open")) return;
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    vFrame.srcdoc = "";
    currentId = null;
    if (lastFocus && document.contains(lastFocus)) (lastFocus as HTMLElement).focus();
    if (writeHash !== false) setHash("#pages/" + currentCat);
  }

  function copySource() {
    if (!currentId) return;
    var btn: any = $("#ptCopy"), html = byId[currentId].html;
    function done(ok: boolean) {
      btn.textContent = ok ? "已复制" : "复制失败";
      setTimeout(function () { btn.textContent = "复制源码"; }, 1400);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = html; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { /* noop */ }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(function () { done(true); }, function () { done(fallback()); });
    } else done(fallback());
  }

  // ---- 组件库搜索接管：多关键词 / OR / 同义词 / 命中高亮 ----
  var compCards = $$("article.card");
  var compIndex = compCards.map(function (c: any) {
    var ne = c.querySelector(".meta .name"), te = c.querySelector(".tag");
    var name = ne ? ne.textContent.trim() : "";
    var cat = te ? te.textContent.trim() : "";
    return {
      el: c, name: name, nameEl: ne, cat: cat, tagEl: te,
      text: (name + " " + cat + " " + (c.dataset.key || "") + " " + (c.textContent || "")).toLowerCase()
    };
  });
  function enhancedRun() {
    var branches = branchesOf((qComponents.value || "").trim());
    var activeBtn = document.querySelector(".filter.active");
    var activeCat = activeBtn ? activeBtn.getAttribute("data-c") : "all";
    var n = 0, shown = 0;
    compCards.forEach(function (c: any, i: number) {
      var cm = activeCat === "all" || (c.dataset.cat || "").split(" ").indexOf(activeCat) >= 0;
      var show = cm && testText(compIndex[i].text, branches);
      c.classList.toggle("hide", !show);
      if (!show) return;
      n++;
      var ne: any = compIndex[i].nameEl;
      if (!ne) return;
      if (shown < 120) {
        ne.innerHTML = hl(compIndex[i].name, branches);
        var tg: any = compIndex[i].tagEl;
        if (tg) tg.innerHTML = hl(compIndex[i].cat, branches);
        shown++;
      }
      else if (ne.innerHTML.indexOf("<mark>") >= 0) ne.textContent = compIndex[i].name;
    });
    if (!isPages) { count.textContent = n; total.textContent = componentTotal; }
    empty.style.display = n ? "none" : "block";
    if (n) empty.textContent = "没有匹配结果";
    else empty.innerHTML = "没有匹配结果 · 试试 " + HOT.slice(0, 5).map(function (w) {
      return '<button data-comp-suggest="' + esc(w) + '" type="button">' + esc(w) + "</button>";
    }).join("");
  }
  (window as any).run = enhancedRun;
  qComponents.oninput = function () { debounceComp(enhancedRun); };

  // ---- 全局搜索：一次搜 391 个组件 + 24 个页面模板 ----
  var GS_ITEMS: any[] = [], gsOpen = false, gsFocus: Element | null = null;
  function gsIndexData(): any[] {
    var items: any[] = compIndex.map(function (x, i) {
      return { type: "component", id: "c" + i, name: x.name, cat: x.cat,
        desc: (x.el.dataset.key || "").trim().slice(0, 90), text: x.text };
    });
    data.forEach(function (d) {
      var label = catLabel(d.cat);
      items.push({ type: "page", id: d.id, name: d.name, cat: label, desc: d.desc,
        text: (d.name + " " + d.desc + " " + d.tags + " " + label).toLowerCase() });
    });
    return items;
  }
  function gsGroup(title: string, rows: any[], branches: string[][]): string {
    if (!rows.length) return "";
    return '<div class="gs-group">' + title + " · " + rows.length + "</div>" + rows.map(function (r) {
      var it = r.it;
      return '<div class="gs-item" data-id="' + esc(it.id) + '" data-type="' + it.type + '" role="option">' +
        '<span class="ic">' + (it.type === "page" ? "▤" : "◧") + "</span>" +
        '<div class="tx"><b>' + hl(it.name, branches) + "</b><small>" +
        hl((it.cat || "") + " · " + (it.desc || "").slice(0, 64), branches) + "</small></div>" +
        '<span class="kind">' + (it.type === "page" ? "页面" : "组件") + "</span></div>";
    }).join("");
  }
  function gsRender(q: string) {
    var branches = branchesOf(q);
    var results: any[] = [];
    GS_ITEMS.forEach(function (it) {
      if (!branches.length) { results.push({ it: it, s: 0 }); return; }
      var fields = [it.name.toLowerCase(), (it.cat + " " + (it.desc || "")).toLowerCase(),
        (it.cat || "").toLowerCase(), (it.desc || "").toLowerCase()];
      if (!testText(it.text, branches)) return;
      results.push({ it: it, s: scoreFields(fields, branches) + (it.type === "page" ? 3 : 0) });
    });
    results.sort(function (a, b) { return b.s - a.s; });
    var lim = q ? 8 : 4;
    var pages = results.filter(function (r) { return r.it.type === "page"; }).slice(0, lim);
    var comps = results.filter(function (r) { return r.it.type === "component"; }).slice(0, lim);
    var html = gsGroup(q ? "页面模板" : "推荐页面", pages, branches) + gsGroup(q ? "组件" : "推荐组件", comps, branches);
    if (!html) html = '<div class="gs-empty">没有找到相关内容 · 试试更短的词，或用逗号分隔多个关键词</div>';
    gsResults.innerHTML = html;
    gsItems = $$("#gsResults .gs-item");
    gsIndex = 0; gsSelect(0);
  }
  function gsSelect(i: number) {
    gsItems.forEach(function (el: any, k: number) { el.classList.toggle("on", k === i); });
    if (gsItems[i]) gsItems[i].scrollIntoView({ block: "nearest" });
  }
  function gsRenderHot() {
    var r = recent();
    var words = r.length ? r.slice(0, 5) : HOT.slice(0, 7);
    gsHot.innerHTML = "<span>" + (r.length ? "最近搜索" : "热门搜索") + "</span>" + words.map(function (w) {
      return '<button data-hot="' + esc(w) + '" type="button">' + esc(w) + "</button>";
    }).join("");
  }
  function gsToggle(open: boolean) {
    if (open === gsOpen) return;
    gsOpen = open;
    gsPanel.classList.toggle("open", open);
    gsPanel.setAttribute("aria-hidden", String(!open));
    if (open) {
      gsFocus = document.activeElement;
      gsInput.value = "";
      gsRenderHot(); gsRender("");
      setTimeout(function () { gsInput.focus(); }, 20);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = viewer.classList.contains("open") ? "hidden" : "";
      if (gsFocus && document.contains(gsFocus)) (gsFocus as HTMLElement).focus();
    }
  }
  function gsActivate(item: any) {
    if (!item) return;
    var type = item.getAttribute("data-type"), id = item.getAttribute("data-id");
    var q = gsInput.value.trim();
    if (q) { remember(q); gsRenderHot(); }
    gsToggle(false);
    if (type === "page") { setView("pages", true); openViewer(id, true); return; }
    var idx = parseInt(id.slice(1), 10), el: any = compCards[idx];
    if (!el) return;
    setView("components", true);
    qComponents.value = "";
    (window as any).run();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(function () { el.click(); }, 140);
  }
  function viewerStep(step: number) {
    if (!currentId || !viewer.classList.contains("open")) return;
    var list = currentList.length ? currentList : data.map(function (d) { return d.id; });
    var i = list.indexOf(currentId);
    if (i < 0) i = 0;
    openViewer(list[(i + step + list.length) % list.length], true);
  }

  // 事件绑定
  viewBtns.forEach(function (b: any) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-view"), true); });
  });
  ptGrid.addEventListener("mousemove", function (e: any) {
    var c = e.target.closest(".pt-card");
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });
  // hover 缩略图时只激活这一张的动效/粒子，其余仍保持静置
  ptGrid.addEventListener("mouseover", function (e: any) {
    var c = e.target.closest(".pt-card");
    if (!c) return;
    c.classList.add("fx-hovered");
    try { var d = c.querySelector("iframe").contentDocument; if (d) d.documentElement.classList.add("fx-active"); } catch (err) { }
  });
  ptGrid.addEventListener("mouseout", function (e: any) {
    var c = e.target.closest(".pt-card");
    if (!c || c.contains(e.relatedTarget)) return;
    c.classList.remove("fx-hovered");
    try { var d = c.querySelector("iframe").contentDocument; if (d) d.documentElement.classList.remove("fx-active"); } catch (err) { }
  });
  watchMotion(vFrame);
  if (motionToggle) motionToggle.addEventListener("click", function () {
    motionPaused = document.body.classList.contains("motion-paused");
    $$("iframe").forEach(function (f: any) { applyMotion(f); });
  });
  ptCats.addEventListener("click", function (e: any) {
    var b = e.target.closest(".pt-cat");
    if (!b) return;
    currentCat = b.getAttribute("data-cat");
    renderCats(); updateIntro(); renderCards();
    setHash("#pages/" + currentCat);
  });
  ptQ.addEventListener("input", function () { debouncePages(renderCards); });
  ptQ.addEventListener("keydown", function (e: any) {
    if (e.key === "Escape" && ptQ.value) { ptQ.value = ""; renderCards(); e.stopPropagation(); }
  });
  ptClear.addEventListener("click", function () { ptQ.value = ""; renderCards(); ptQ.focus(); });
  document.addEventListener("click", function (e: any) {
    var s = e.target.closest("[data-suggest],[data-comp-suggest]");
    if (!s) return;
    if (s.hasAttribute("data-comp-suggest")) {
      qComponents.value = s.getAttribute("data-comp-suggest");
      (window as any).run(); qComponents.focus();
    } else {
      ptQ.value = s.getAttribute("data-suggest");
      renderCards(); ptQ.focus();
      remember(ptQ.value); renderSuggest();
    }
  });
  gsTrigger.addEventListener("click", function () { gsToggle(true); });
  gsPanel.addEventListener("click", function (e: any) {
    if (e.target.closest("[data-gs-close]")) { gsToggle(false); return; }
    var hot = e.target.closest("[data-hot]");
    if (hot) { gsInput.value = hot.getAttribute("data-hot"); gsRender(gsInput.value); gsInput.focus(); return; }
    var item = e.target.closest(".gs-item");
    if (item) gsActivate(item);
  });
  gsInput.addEventListener("input", function () { debounceGS(function () { gsRender(gsInput.value); }); });
  gsInput.addEventListener("keydown", function (e: any) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!gsItems.length) return;
      gsIndex = (gsIndex + (e.key === "ArrowDown" ? 1 : -1) + gsItems.length) % gsItems.length;
      gsSelect(gsIndex);
    } else if (e.key === "Enter") {
      e.preventDefault(); gsActivate(gsItems[gsIndex]);
    } else if (e.key === "Escape") { e.preventDefault(); gsToggle(false); }
  });
  $("#ptPrev").addEventListener("click", function () { viewerStep(-1); });
  $("#ptNext").addEventListener("click", function () { viewerStep(1); });
  document.addEventListener("keydown", function (e: any) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); gsToggle(!gsOpen); return; }
    if (e.key === "/" && !gsOpen && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ""))) {
      e.preventDefault(); gsToggle(true); return;
    }
    if (gsOpen) {
      if (e.key === "Escape") gsToggle(false);
      return;
    }
    if (e.target instanceof Element && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (viewer.classList.contains("open")) {
      if (e.key === "ArrowLeft") { e.preventDefault(); viewerStep(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); viewerStep(1); }
    }
  });
  ptGrid.addEventListener("click", function (e: any) {
    var c = e.target.closest(".pt-card");
    if (c) openViewer(c.getAttribute("data-id"), true);
  });
  ptGrid.addEventListener("keydown", function (e: any) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var c = e.target.closest(".pt-card");
    if (c && e.target === c) { e.preventDefault(); openViewer(c.getAttribute("data-id"), true); }
  });
  $("#ptClose").addEventListener("click", function () { closeViewer(true); });
  $("#ptEsc").addEventListener("click", function () { closeViewer(true); });
  $("#ptRefresh").addEventListener("click", function () { if (currentId) vFrame.srcdoc = byId[currentId].html; });
  $("#ptCopy").addEventListener("click", copySource);
  $("#ptOpen").addEventListener("click", function () {
    if (!currentId) return;
    var url = URL.createObjectURL(new Blob([byId[currentId].html], { type: "text/html;charset=utf-8" }));
    var w = window.open(url, "_blank");
    if (!w) { var b: any = $("#ptOpen"); b.textContent = "请允许弹窗"; setTimeout(function () { b.textContent = "新窗口"; }, 1600); }
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  });
  stageBtns.forEach(function (b: any) {
    b.addEventListener("click", function () {
      stageBtns.forEach(function (x: any) { x.classList.toggle("on", x === b); });
      stage.classList.toggle("mobile", b.getAttribute("data-vp") === "mobile");
    });
  });
  document.addEventListener("keydown", function (e: any) {
    if (gsOpen || !viewer.classList.contains("open")) return;
    if (e.key === "Escape") { closeViewer(true); return; }
    if (e.key !== "Tab") return;
    var f = $$("#ptViewer button:not([disabled])");
    if (!f.length) return;
    var first: any = f[0], last: any = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // 初始化（支持 #pages/<cat> 与 #page/<id> 深链）
  var nComponents: any = document.querySelector(".nComponents"), nPages: any = document.querySelector(".nPages");
  if (nComponents) nComponents.textContent = componentTotal;
  if (nPages) nPages.textContent = data.length;
  var hash = location.hash || "";
  var pageMatch = hash.match(/^#page\/([a-z0-9-]+)$/);
  var startPages = hash.indexOf("#pages") === 0 || !!pageMatch;
  currentCat = hash.indexOf("#pages/") === 0 ? hash.split("/")[1] : "all";
  if (!catMap[currentCat]) currentCat = "all";
  if (startPages) setView("pages", false);
  GS_ITEMS = gsIndexData();
  gsRenderHot(); renderSuggest();
  renderCats(); updateIntro(); renderCards();
  if (pageMatch) openViewer(pageMatch[1], false);
  enhancedRun();
}

// JSON 字符串里出现 </script> 会提前结束外层脚本，统一转义闭合标签
function safeJSString(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripGenerated(html: string): string {
  const marks: [string, string][] = [
    ["/* PT:CSS:START */", "/* PT:CSS:END */"],
    ["<!-- PT:SWITCH:START -->", "<!-- PT:SWITCH:END -->"],
    ["<!-- PT:GALLERY:START -->", "<!-- PT:GALLERY:END -->"],
    ["<!-- PT:JS:START -->", "<!-- PT:JS:END -->"],
  ];
  for (const [a, b] of marks) {
    html = html.replace(new RegExp(escapeRe(a) + "[\\s\\S]*?" + escapeRe(b) + "\\s*", "g"), "");
  }
  return html;
}

function build(): void {
  let html = stripGenerated(readFileSync(TARGET, "utf8"));
  const anchors: RegExp[] = [
    /<\/style>(?=\s*<\/head>)/,
    /<section class="toolbar">/,
    /<div class="empty" id="empty">没有匹配结果<\/div>/,
    /<\/script>\s*<\/body>/,
  ];
  for (const re of anchors) {
    if (!re.test(html)) throw new Error("注入锚点缺失，文件结构可能已改变: " + re);
  }

  const css = "/* PT:CSS:START */" + BLOCK_CSS + "/* PT:CSS:END */\n";
  const sw = "<!-- PT:SWITCH:START -->\n" + BLOCK_SWITCH + "\n<!-- PT:SWITCH:END -->\n";
  const gal = "<!-- PT:GALLERY:START -->\n" + BLOCK_GALLERY + "\n<!-- PT:GALLERY:END -->\n";
  const runtime = "(" + galleryRuntime.toString() + ")(" + safeJSString(DEMOS) + ", " + safeJSString(CATS) + ");";
  const js = "<!-- PT:JS:START -->\n<script>\n(function(){\n" + runtime + "\n})();\n</script>\n<!-- PT:JS:END -->\n";

  html = html.replace(anchors[0], () => css + "</style>");
  html = html.replace(anchors[1], () => sw + '<section class="toolbar">');
  html = html.replace(anchors[2], (m) => m + "\n" + gal);
  html = html.replace(anchors[3], () => "</script>\n" + js + "</body>");
  writeFileSync(TARGET, html, "utf8");

  const perCat = CATS.map((c) => `${c.name} ${DEMOS.filter((d) => d.cat === c.id).length}`).join(" / ");
  console.log(`已生成 ${DEMOS.length} 个整页模板 · ${CATS.length} 个分类（${perCat}）`);
  console.log(`写入 ${TARGET} (${(Buffer.byteLength(html, "utf8") / 1024 / 1024).toFixed(2)} MB)`);
}

build();

