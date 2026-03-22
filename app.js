// ===== Theme System =====
const THEME_COLORS = {
  'neo-brutalism': { bg:'#fef6e4', surface:'#fff', text:'#222', grid:'rgba(0,0,0,0.06)', zero:'rgba(0,0,0,0.15)' },
  'soft-brutalism': { bg:'#f5f0e8', surface:'#fff', text:'#3d3929', grid:'rgba(0,0,0,0.05)', zero:'rgba(0,0,0,0.12)' },
  'bootstra-386':   { bg:'#0000aa', surface:'#0000aa', text:'#fff', grid:'rgba(85,85,255,0.15)', zero:'rgba(85,85,255,0.4)' },
  'claymorphism':   { bg:'#f2f3f7', surface:'#f2f3f7', text:'#3a3a4a', grid:'rgba(0,0,0,0.04)', zero:'rgba(0,0,0,0.1)' },
  'neu-bootstrap':  { bg:'#e0e5ec', surface:'#e0e5ec', text:'#2d3436', grid:'rgba(0,0,0,0.05)', zero:'rgba(0,0,0,0.12)' }
};
let currentTheme = 'neo-brutalism';

function setTheme(name) {
  currentTheme = name;
  document.getElementById('theme-css').href = 'style_guide/' + name + '.css';
  // Re-render all visible plots after CSS loads
  setTimeout(() => { window.dispatchEvent(new Event('resize')); replotAll(); }, 100);
}

function getPlotColors() {
  const c = THEME_COLORS[currentTheme] || THEME_COLORS['neo-brutalism'];
  return c;
}

// ===== Core =====
function makeLB() {
  const c = getPlotColors();
  return {
    paper_bgcolor: c.bg, plot_bgcolor: c.surface,
    font: { color: c.text, family: 'inherit', size: 11 },
    margin: { t:20, b:45, l:50, r:20 },
    xaxis: { gridcolor:c.grid, zerolinecolor:c.zero, zerolinewidth:2 },
    yaxis: { gridcolor:c.grid, zerolinecolor:c.zero, zerolinewidth:2 },
    showlegend: false, hovermode: 'closest'
  };
}
function ml(e={}) { return { ...JSON.parse(JSON.stringify(makeLB())), ...e }; }
const CFG = { responsive:true, displayModeBar:false };
function ls(a,b,n) { const r=[],s=(b-a)/(n-1); for(let i=0;i<n;i++) r.push(a+s*i); return r; }

// Variable colors
const VC = { a:'#e94560', b:'#3b82f6', c:'#10b981', d:'#f59e0b' };
function cv(c,t) { return `<span class="eq-var" style="color:${c}">${t}</span>`; }
function ss(v) { return v>=0?'+':'-'; }
function af(v) { return Math.abs(v).toFixed(1); }
// Smart format: drop trailing .0, round to 1 decimal
function sf(v) { const r = Math.round(v * 10) / 10; return r === Math.floor(r) ? r.toString() : r.toFixed(1); }
function sfa(v) { return sf(Math.abs(v)); }

// Line colors per theme
function lineC(idx) {
  const palettes = {
    'bootstra-386': ['#ffff55','#55ff55','#ff5555','#55ffff'],
    default: ['#e94560','#3b82f6','#10b981','#f59e0b','#8b5cf6']
  };
  const p = palettes[currentTheme] || palettes.default;
  return p[idx % p.length];
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('tg-active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('tg-active');
    const tab = document.getElementById('tab-' + btn.dataset.tab);
    tab.classList.add('active');
    // Force Plotly to recalculate width for the newly visible tab
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => {
      tab.querySelectorAll('.plot-box').forEach(el => {
        if(el.querySelector('.js-plotly-plot')) Plotly.Plots.resize(el);
      });
    }, 50);
  });
});

// ===== 일차함수 =====
function updateLinear() {
  const a=+document.getElementById('sl-la').value, b=+document.getElementById('sl-lb').value;
  document.getElementById('val-la').textContent=a.toFixed(2);
  document.getElementById('val-lb').textContent=b.toFixed(2);
  document.getElementById('eq-linear').innerHTML=`y = ${cv(VC.a,a.toFixed(1))}x ${ss(b)} ${cv(VC.b,af(b))}`;
  const x=ls(-10,10,200), y=x.map(xi=>a*xi+b);
  const LB=makeLB();
  Plotly.react('plot-linear',[{x,y,type:'scatter',mode:'lines',line:{color:lineC(1),width:3}}],
    ml({xaxis:{...LB.xaxis,range:[-10,10],title:'x'},yaxis:{...LB.yaxis,range:[-15,15],title:'y'}}),CFG);
  document.getElementById('info-slope').textContent=a.toFixed(2);
  document.getElementById('info-yint').textContent=b.toFixed(2);
  document.getElementById('info-xint').textContent=a!==0?(-b/a).toFixed(2):'없음';
  document.getElementById('info-yat1').textContent=(a+b).toFixed(2);
}
function resetLinear() { document.getElementById('sl-la').value=1; document.getElementById('sl-lb').value=0; updateLinear(); }

// ===== 이차함수 =====
let qF={vertex:true,axis:true,derivative:false};
function toggleQF(btn,f) { qF[f]=!qF[f]; btn.classList.toggle('tg-active'); updateQuad(); }
function updateQuad() {
  const a=+document.getElementById('sl-qa').value, b=+document.getElementById('sl-qb').value, c=+document.getElementById('sl-qc').value;
  document.getElementById('val-qa').textContent=a.toFixed(2); document.getElementById('val-qb').textContent=b.toFixed(2); document.getElementById('val-qc').textContent=c.toFixed(2);
  document.getElementById('eq-quad').innerHTML=`y = ${cv(VC.a,a.toFixed(1))}x² ${ss(b)} ${cv(VC.b,af(b))}x ${ss(c)} ${cv(VC.c,af(c))}`;
  const x=ls(-10,10,400), y=x.map(xi=>a*xi*xi+b*xi+c);
  const LB=makeLB();
  const tr=[{x,y,type:'scatter',mode:'lines',line:{color:lineC(0),width:3},name:'f(x)'}];
  const vx=a!==0?-b/(2*a):0, vy=a*vx*vx+b*vx+c;
  if(qF.vertex) tr.push({x:[vx],y:[vy],type:'scatter',mode:'markers',marker:{color:lineC(2),size:12,symbol:'diamond'},name:'꼭짓점'});
  if(qF.axis) tr.push({x:[vx,vx],y:[-20,20],type:'scatter',mode:'lines',line:{color:lineC(2),width:1,dash:'dash'},name:'대칭축'});
  if(qF.derivative) { const dy=x.map(xi=>2*a*xi+b); tr.push({x,y:dy,type:'scatter',mode:'lines',line:{color:lineC(4),width:2,dash:'dot'},name:"f'(x)"}); document.getElementById('deriv-quad').style.display='block'; document.getElementById('deriv-quad').textContent=`f'(x) = ${(2*a).toFixed(2)}x ${ss(b)} ${Math.abs(b).toFixed(2)}`; } else document.getElementById('deriv-quad').style.display='none';
  Plotly.react('plot-quad',tr,ml({xaxis:{...LB.xaxis,range:[-10,10],title:'x'},yaxis:{...LB.yaxis,range:[-15,15],title:'y'}}),CFG);
  document.getElementById('info-vertex').textContent=`(${vx.toFixed(2)}, ${vy.toFixed(2)})`;
  document.getElementById('info-axis').textContent=`x = ${vx.toFixed(2)}`;
  const D=b*b-4*a*c; document.getElementById('info-disc').textContent=D.toFixed(2);
  if(a===0) document.getElementById('info-roots').textContent=b!==0?`x=${(-c/b).toFixed(2)}`:'모든 x';
  else if(D>0){ const r1=(-b+Math.sqrt(D))/(2*a),r2=(-b-Math.sqrt(D))/(2*a); document.getElementById('info-roots').textContent=`x=${r1.toFixed(2)}, ${r2.toFixed(2)}`; }
  else if(D===0) document.getElementById('info-roots').textContent=`x=${(-b/(2*a)).toFixed(2)} (중근)`;
  else document.getElementById('info-roots').textContent='허근 (실근 없음)';
}
function resetQuad() { document.getElementById('sl-qa').value=1; document.getElementById('sl-qb').value=0; document.getElementById('sl-qc').value=0; updateQuad(); }

// ===== 삼각함수 =====
let trigFn='sin', trigOpts={components:false,derivative:false,integralFill:false}, trigExtra={B2:1,C2:0};
function setTF(btn) { document.querySelectorAll('#trig-basic-group .yk-btn,#trig-combo-group .yk-btn,#trig-inv-group .yk-btn').forEach(b=>b.classList.remove('tg-active')); btn.classList.add('tg-active'); trigFn=btn.dataset.fn; buildTrigExtra(); updateTrig(); }
function toggleTO(btn,o) { trigOpts[o]=!trigOpts[o]; btn.classList.toggle('tg-active'); updateTrig(); }
const comboFns=['sin+cos','sin-cos','sin*cos'];
function buildTrigExtra() {
  const el=document.getElementById('trig-extra-sliders');
  if(comboFns.includes(trigFn)) {
    el.innerHTML=`<div class="sec-label" style="margin-top:8px">두 번째 함수 2nd</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-b)"></span><span class="vn" style="color:var(--c-b)">B₂</span><span class="vd">주파수</span></span><span class="vv" style="color:var(--c-b)" id="val-tb2">${trigExtra.B2.toFixed(2)}</span></div><input type="range" class="sl-b" id="sl-tb2" min="0.1" max="6" step="0.1" value="${trigExtra.B2}" oninput="trigExtra.B2=+this.value;document.getElementById('val-tb2').textContent=trigExtra.B2.toFixed(2);updateTrig()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-c)"></span><span class="vn" style="color:var(--c-c)">C₂</span><span class="vd">위상</span></span><span class="vv" style="color:var(--c-c)" id="val-tc2">${trigExtra.C2.toFixed(2)}</span></div><input type="range" class="sl-c" id="sl-tc2" min="-6.28" max="6.28" step="0.05" value="${trigExtra.C2}" oninput="trigExtra.C2=+this.value;document.getElementById('val-tc2').textContent=trigExtra.C2.toFixed(2);updateTrig()"></div>`;
  } else el.innerHTML='';
}
function trigEv(fn,x,A,B,C,D) {
  const CL=20,disc=['tan','cot','sec','csc'].includes(fn),B2=trigExtra.B2,C2=trigExtra.C2;
  return x.map(xi=>{let v;const a1=B*xi+C,a2=B2*xi+C2;switch(fn){case'sin':v=A*Math.sin(a1)+D;break;case'cos':v=A*Math.cos(a1)+D;break;case'tan':v=A*Math.tan(a1)+D;break;case'cot':{const t=Math.tan(a1);v=Math.abs(t)<1e-10?null:A/t+D;}break;case'sec':{const c=Math.cos(a1);v=Math.abs(c)<1e-10?null:A/c+D;}break;case'csc':{const s=Math.sin(a1);v=Math.abs(s)<1e-10?null:A/s+D;}break;case'sin+cos':v=A*(Math.sin(a1)+Math.cos(a2))+D;break;case'sin-cos':v=A*(Math.sin(a1)-Math.cos(a2))+D;break;case'sin*cos':v=A*Math.sin(a1)*Math.cos(a2)+D;break;case'sin2':v=A*Math.pow(Math.sin(a1),2)+D;break;case'cos2':v=A*Math.pow(Math.cos(a1),2)+D;break;case'sin2+cos2':v=A+D;break;case'asin':v=xi>=-1&&xi<=1?A*Math.asin(xi)+D:null;break;case'acos':v=xi>=-1&&xi<=1?A*Math.acos(xi)+D:null;break;case'atan':v=A*Math.atan(xi)+D;break;default:v=A*Math.sin(a1)+D;}if(v!==null&&disc&&Math.abs(v)>CL)return null;return v;});
}
function trigDesc(fn){const d={sin:'사인 함수 (Sine) - 가장 기본적인 삼각함수',cos:'코사인 함수 (Cosine) - sin보다 π/2 앞선 위상',tan:'탄젠트 (Tangent) = sin/cos, π마다 점근선',cot:'코탄젠트 (Cotangent) = cos/sin, tan의 역수',sec:'시컨트 (Secant) = 1/cos',csc:'코시컨트 (Cosecant) = 1/sin','sin+cos':'합: sin+cos = √2·sin(x+π/4) 합성공식','sin-cos':'차: sin-cos = √2·sin(x-π/4)','sin*cos':'곱: sin×cos = ½sin(2x) 곱을합으로',sin2:'sin²=(1-cos2x)/2 반각공식',cos2:'cos²=(1+cos2x)/2 반각공식','sin2+cos2':'sin²+cos²=1 항등식!',asin:'아크사인 (Arcsine) 정의역[-1,1] 치역[-π/2,π/2]',acos:'아크코사인 (Arccosine) 정의역[-1,1] 치역[0,π]',atan:'아크탄젠트 (Arctangent) 치역(-π/2,π/2)'};return d[fn]||'';}
function trigEqH(fn,A,B,C,D){const sA=cv(VC.a,sf(A)),sB=cv(VC.b,sf(B)),sC=cv(VC.c,sfa(C)),sD=cv(VC.d,sfa(D)),cS=ss(C),dS=ss(D),a1=`${sB}x ${cS} ${sC}`,B2=trigExtra.B2,C2=trigExtra.C2,sB2=cv(VC.b,sf(B2)),sC2=cv(VC.c,sfa(C2)),a2=`${sB2}x ${ss(C2)} ${sC2}`,tl=` ${dS} ${sD}`;const m={sin:`y = ${sA} sin(${a1})${tl}`,cos:`y = ${sA} cos(${a1})${tl}`,tan:`y = ${sA} tan(${a1})${tl}`,cot:`y = ${sA} cot(${a1})${tl}`,sec:`y = ${sA} sec(${a1})${tl}`,csc:`y = ${sA} csc(${a1})${tl}`,'sin+cos':`y = ${sA}[sin(${a1})+cos(${a2})]${tl}`,'sin-cos':`y = ${sA}[sin(${a1})-cos(${a2})]${tl}`,'sin*cos':`y = ${sA}sin(${a1})cos(${a2})${tl}`,sin2:`y = ${sA}sin²(${a1})${tl}`,cos2:`y = ${sA}cos²(${a1})${tl}`,'sin2+cos2':`y = ${sA}[sin²(${a1})+cos²(${a1})]${tl}`,asin:`y = ${sA}arcsin(x)${tl}`,acos:`y = ${sA}arccos(x)${tl}`,atan:`y = ${sA}arctan(x)${tl}`};return m[fn]||'';}
function numD(x,y){const d=[];for(let i=0;i<x.length;i++){if(i===0)d.push(y[1]!=null&&y[0]!=null?(y[1]-y[0])/(x[1]-x[0]):null);else if(i===x.length-1)d.push(y[i]!=null&&y[i-1]!=null?(y[i]-y[i-1])/(x[i]-x[i-1]):null);else{if(y[i-1]==null||y[i+1]==null)d.push(null);else d.push((y[i+1]-y[i-1])/(x[i+1]-x[i-1]));}}return d.map(v=>v!=null&&Math.abs(v)>50?null:v);}

function updateTrig() {
  const A=+document.getElementById('sl-ta').value,B=+document.getElementById('sl-tb').value,C=+document.getElementById('sl-tc').value,D=+document.getElementById('sl-td').value;
  document.getElementById('val-ta').textContent=sf(A);document.getElementById('val-tb').textContent=sf(B);document.getElementById('val-tc').textContent=sf(C);document.getElementById('val-td').textContent=sf(D);
  document.getElementById('eq-trig').innerHTML=trigEqH(trigFn,A,B,C,D);
  const isInv=['asin','acos','atan'].includes(trigFn),xR=isInv?(trigFn==='atan'?[-10,10]:[-1.05,1.05]):[-4*Math.PI,4*Math.PI];
  const x=ls(xR[0],xR[1],1200),y=trigEv(trigFn,x,A,B,C,D);
  const LB=makeLB();
  const tr=[{x,y,type:'scatter',mode:'lines',line:{color:lineC(3),width:3},connectgaps:false,name:trigFn}];
  if(trigOpts.components&&comboFns.includes(trigFn)){tr.push({x,y:x.map(xi=>A*Math.sin(B*xi+C)),type:'scatter',mode:'lines',line:{color:lineC(1),width:1.5,dash:'dash'},name:'sin'});tr.push({x,y:x.map(xi=>{const v=trigFn==='sin-cos'?-Math.cos(trigExtra.B2*xi+trigExtra.C2):Math.cos(trigExtra.B2*xi+trigExtra.C2);return A*v;}),type:'scatter',mode:'lines',line:{color:lineC(0),width:1.5,dash:'dash'},name:trigFn==='sin-cos'?'-cos':'cos'});}
  if(trigOpts.components&&trigFn==='sin2+cos2'){tr.push({x,y:x.map(xi=>A*Math.pow(Math.sin(B*xi+C),2)+D),type:'scatter',mode:'lines',line:{color:lineC(1),width:1.5,dash:'dash'},name:'sin²'});tr.push({x,y:x.map(xi=>A*Math.pow(Math.cos(B*xi+C),2)+D),type:'scatter',mode:'lines',line:{color:lineC(0),width:1.5,dash:'dash'},name:'cos²'});}
  if(!isInv&&!['sin2+cos2'].includes(trigFn))tr.push({x,y:trigEv(trigFn,x,1,1,0,0),type:'scatter',mode:'lines',line:{color:'rgba(128,128,128,0.15)',width:1,dash:'dot'},connectgaps:false,name:'기본형'});
  if(trigOpts.derivative){tr.push({x,y:numD(x,y),type:'scatter',mode:'lines',line:{color:lineC(4),width:2,dash:'dashdot'},connectgaps:false,name:"f'(x)"});document.getElementById('trig-deriv-eq').style.display='block';document.getElementById('trig-deriv-eq').textContent="도함수 f'(x)";}else document.getElementById('trig-deriv-eq').style.display='none';
  if(trigOpts.integralFill&&!isInv){const p=2*Math.PI/B,fx=ls(0,p,300),fy=trigEv(trigFn,fx,A,B,C,D);tr.push({x:fx,y:fx.map(()=>0),type:'scatter',mode:'lines',line:{color:'transparent'},showlegend:false});tr.push({x:fx,y:fy,type:'scatter',mode:'lines',fill:'tonexty',fillcolor:'rgba(16,185,129,0.15)',line:{color:'rgba(16,185,129,0.4)',width:1},connectgaps:false,name:'적분영역'});}
  const piTicks={tickvals:[-4*Math.PI,-3.5*Math.PI,-3*Math.PI,-2.5*Math.PI,-2*Math.PI,-1.5*Math.PI,-Math.PI,-0.5*Math.PI,0,0.5*Math.PI,Math.PI,1.5*Math.PI,2*Math.PI,2.5*Math.PI,3*Math.PI,3.5*Math.PI,4*Math.PI],ticktext:['-4π','','-3π','','-2π','','-π','','0','','π','','2π','','3π','','4π'],dtick:Math.PI};
  const xa=isInv?{...LB.xaxis,range:xR,title:'x'}:{...LB.xaxis,range:xR,title:'x',...piTicks};
  Plotly.react('plot-trig',tr,ml({xaxis:xa,yaxis:{...LB.yaxis,range:isInv?[-4,4]:[-8,8],title:'y'},showlegend:true,legend:{x:0.01,y:0.99,bgcolor:'rgba(128,128,128,0.05)',font:{size:10}}}),CFG);
  document.getElementById('info-amp').textContent=sf(Math.abs(A));document.getElementById('info-period').textContent=isInv?'-':sf(+(2*Math.PI/Math.abs(B)).toFixed(2));document.getElementById('info-phase').textContent=isInv?'-':sf(+(-C/B).toFixed(2));document.getElementById('info-vshift').textContent=sf(D);document.getElementById('info-trig-desc').textContent=trigDesc(trigFn);
}
function resetTrig(){document.getElementById('sl-ta').value=1;document.getElementById('sl-tb').value=1;document.getElementById('sl-tc').value=0;document.getElementById('sl-td').value=0;trigFn='sin';trigExtra={B2:1,C2:0};trigOpts={components:false,derivative:false,integralFill:false};document.querySelectorAll('#trig-basic-group .yk-btn,#trig-combo-group .yk-btn,#trig-inv-group .yk-btn').forEach(b=>b.classList.remove('tg-active'));document.querySelector('#trig-basic-group .yk-btn[data-fn="sin"]').classList.add('tg-active');document.querySelectorAll('#trig-show-comp,#trig-show-deriv,#trig-show-integ').forEach(b=>b.classList.remove('tg-active'));buildTrigExtra();updateTrig();}

// ===== 미분 =====
let derivFn='poly',derivOpts={tangent:true,derivCurve:true,deriv2Curve:false};
function setDF(btn){document.querySelectorAll('#dv-fn-group .yk-btn').forEach(b=>b.classList.remove('tg-active'));btn.classList.add('tg-active');derivFn=btn.dataset.fn;buildDerivSliders();updateDeriv();}
function toggleDO(btn,o){derivOpts[o]=!derivOpts[o];btn.classList.toggle('tg-active');updateDeriv();}
function buildDerivSliders(){
  const el=document.getElementById('dv-sliders-panel');
  if(derivFn==='poly'){
    el.innerHTML=`<div class="yk-panel-title"><div class="yk-dot"></div>변수 조절 Variables</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-a)"></span><span class="vn" style="color:var(--c-a)">a</span><span class="vd">x² 계수</span></span><span class="vv" style="color:var(--c-a)" id="val-da">1.00</span></div><input type="range" class="sl-a" id="sl-da" min="-5" max="5" step="0.1" value="1" oninput="updateDeriv()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-b)"></span><span class="vn" style="color:var(--c-b)">b</span><span class="vd">x 계수</span></span><span class="vv" style="color:var(--c-b)" id="val-db">0.00</span></div><input type="range" class="sl-b" id="sl-db" min="-5" max="5" step="0.1" value="0" oninput="updateDeriv()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-c)"></span><span class="vn" style="color:var(--c-c)">c</span><span class="vd">상수항</span></span><span class="vv" style="color:var(--c-c)" id="val-dc">0.00</span></div><input type="range" class="sl-c" id="sl-dc" min="-5" max="5" step="0.1" value="0" oninput="updateDeriv()"></div>`;
  } else {
    el.innerHTML=`<div class="yk-panel-title"><div class="yk-dot"></div>변수 조절 Variables</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-a)"></span><span class="vn" style="color:var(--c-a)">A</span><span class="vd">계수</span></span><span class="vv" style="color:var(--c-a)" id="val-da">1.00</span></div><input type="range" class="sl-a" id="sl-da" min="-3" max="3" step="0.1" value="1" oninput="updateDeriv()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-b)"></span><span class="vn" style="color:var(--c-b)">B</span><span class="vd">주파수</span></span><span class="vv" style="color:var(--c-b)" id="val-db">1.00</span></div><input type="range" class="sl-b" id="sl-db" min="0.1" max="4" step="0.1" value="1" oninput="updateDeriv()"></div>`;
  }
}
function derivAll(fn,x,p){let y,dy,ddy;if(fn==='poly'){y=x.map(xi=>p.a*xi*xi+p.b*xi+p.c);dy=x.map(xi=>2*p.a*xi+p.b);ddy=x.map(()=>2*p.a);}else if(fn==='sin'){y=x.map(xi=>p.a*Math.sin(p.b*xi));dy=x.map(xi=>p.a*p.b*Math.cos(p.b*xi));ddy=x.map(xi=>-p.a*p.b*p.b*Math.sin(p.b*xi));}else if(fn==='cos'){y=x.map(xi=>p.a*Math.cos(p.b*xi));dy=x.map(xi=>-p.a*p.b*Math.sin(p.b*xi));ddy=x.map(xi=>-p.a*p.b*p.b*Math.cos(p.b*xi));}else if(fn==='exp'){y=x.map(xi=>p.a*Math.exp(p.b*xi));dy=x.map(xi=>p.a*p.b*Math.exp(p.b*xi));ddy=x.map(xi=>p.a*p.b*p.b*Math.exp(p.b*xi));}else if(fn==='ln'){y=x.map(xi=>xi>0?p.a*Math.log(p.b*xi):null);dy=x.map(xi=>xi>0?p.a/xi:null);ddy=x.map(xi=>xi>0?-p.a/(xi*xi):null);}return[y,dy,ddy];}

function updateDeriv(){
  const aEl=document.getElementById('sl-da'),bEl=document.getElementById('sl-db'),cEl=document.getElementById('sl-dc');
  const p={a:+aEl.value,b:bEl?+bEl.value:1,c:cEl?+cEl.value:0};
  document.getElementById('val-da').textContent=p.a.toFixed(2);if(document.getElementById('val-db'))document.getElementById('val-db').textContent=p.b.toFixed(2);if(document.getElementById('val-dc'))document.getElementById('val-dc').textContent=p.c.toFixed(2);
  const x0=+document.getElementById('sl-dx0').value;document.getElementById('val-dx0').textContent=x0.toFixed(2);
  const xR=derivFn==='ln'?[0.01,10]:[-8,8],x=ls(xR[0],xR[1],600),[y,dy,ddy]=derivAll(derivFn,x,p);
  let eq='';
  if(derivFn==='poly')eq=`f(x) = ${cv(VC.a,p.a.toFixed(1))}x² ${ss(p.b)} ${cv(VC.b,af(p.b))}x ${ss(p.c)} ${cv(VC.c,af(p.c))}`;
  else if(derivFn==='sin')eq=`f(x) = ${cv(VC.a,p.a.toFixed(1))}sin(${cv(VC.b,p.b.toFixed(1))}x)`;
  else if(derivFn==='cos')eq=`f(x) = ${cv(VC.a,p.a.toFixed(1))}cos(${cv(VC.b,p.b.toFixed(1))}x)`;
  else if(derivFn==='exp')eq=`f(x) = ${cv(VC.a,p.a.toFixed(1))}e^(${cv(VC.b,p.b.toFixed(1))}x)`;
  else if(derivFn==='ln')eq=`f(x) = ${cv(VC.a,p.a.toFixed(1))}ln(${cv(VC.b,p.b.toFixed(1))}x)`;
  document.getElementById('eq-deriv').innerHTML=eq;
  const LB=makeLB();
  const tr=[{x,y,type:'scatter',mode:'lines',line:{color:lineC(0),width:3},connectgaps:false,name:'f(x)'}];
  const[y0,dy0,ddy0]=derivAll(derivFn,[x0],p);const fx0=y0[0],fpx0=dy0[0],fppx0=ddy0[0];
  if(derivOpts.tangent&&fx0!=null&&fpx0!=null){const tl_x=ls(x0-3,x0+3,100),tl_y=tl_x.map(xi=>fx0+fpx0*(xi-x0));tr.push({x:tl_x,y:tl_y,type:'scatter',mode:'lines',line:{color:lineC(3),width:2,dash:'dash'},name:'접선'});tr.push({x:[x0],y:[fx0],type:'scatter',mode:'markers',marker:{color:lineC(3),size:10,line:{color:getPlotColors().text,width:2}},name:'접점'});}
  if(derivOpts.derivCurve)tr.push({x,y:dy,type:'scatter',mode:'lines',line:{color:lineC(4),width:2},connectgaps:false,name:"f'(x)"});
  if(derivOpts.deriv2Curve)tr.push({x,y:ddy,type:'scatter',mode:'lines',line:{color:lineC(2),width:1.5,dash:'dot'},connectgaps:false,name:"f''(x)"});
  Plotly.react('plot-deriv',tr,ml({xaxis:{...LB.xaxis,range:xR,title:'x'},yaxis:{...LB.yaxis,range:[-10,10],title:'y'},showlegend:true,legend:{x:0.01,y:0.99,bgcolor:'rgba(128,128,128,0.05)',font:{size:10}}}),CFG);
  document.getElementById('info-dfx0').textContent=fx0!=null?fx0.toFixed(4):'정의 안됨';document.getElementById('info-dfpx0').textContent=fpx0!=null?fpx0.toFixed(4):'정의 안됨';document.getElementById('info-dfppx0').textContent=fppx0!=null?fppx0.toFixed(4):'정의 안됨';
  if(fx0!=null&&fpx0!=null){const b0=fx0-fpx0*x0;document.getElementById('info-tangent-eq').textContent=`y=${fpx0.toFixed(2)}x ${ss(b0)} ${Math.abs(b0).toFixed(2)}`;}else document.getElementById('info-tangent-eq').textContent='-';
  const descs={poly:`멱의 규칙: d/dx(xⁿ)=nxⁿ⁻¹\nf'(x)=${(2*p.a).toFixed(1)}x ${ss(p.b)} ${af(p.b)}`,sin:`연쇄법칙: f'(x)=${(p.a*p.b).toFixed(2)}cos(${p.b.toFixed(1)}x)`,cos:`연쇄법칙: f'(x)=${(-p.a*p.b).toFixed(2)}sin(${p.b.toFixed(1)}x)`,exp:`지수함수 미분: f'(x)=${(p.a*p.b).toFixed(2)}e^(${p.b.toFixed(1)}x)`,ln:`로그 미분: f'(x)=${p.a.toFixed(1)}/x`};document.getElementById('info-deriv-desc').textContent=descs[derivFn]||'';
}
function resetDeriv(){derivFn='poly';derivOpts={tangent:true,derivCurve:true,deriv2Curve:false};document.querySelectorAll('#dv-fn-group .yk-btn').forEach(b=>b.classList.remove('tg-active'));document.querySelector('#dv-fn-group .yk-btn[data-fn="poly"]').classList.add('tg-active');document.getElementById('dv-tangent').classList.add('tg-active');document.getElementById('dv-deriv').classList.add('tg-active');document.getElementById('dv-deriv2').classList.remove('tg-active');document.getElementById('sl-dx0').value=1;buildDerivSliders();updateDeriv();}

// ===== 적분 =====
let integFn='poly',integOpts={area:true,antideriv:false};
function setIF(btn){document.querySelectorAll('#ig-fn-group .yk-btn').forEach(b=>b.classList.remove('tg-active'));btn.classList.add('tg-active');integFn=btn.dataset.fn;buildIntegSliders();updateInteg();}
function toggleIO(btn,o){integOpts[o]=!integOpts[o];btn.classList.toggle('tg-active');updateInteg();}
function buildIntegSliders(){
  const el=document.getElementById('ig-sliders-panel');
  if(integFn==='poly'){
    el.innerHTML=`<div class="yk-panel-title"><div class="yk-dot"></div>변수 Variables</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-a)"></span><span class="vn" style="color:var(--c-a)">a</span><span class="vd">x²</span></span><span class="vv" style="color:var(--c-a)" id="val-iga2">0.00</span></div><input type="range" class="sl-a" id="sl-iga2" min="-3" max="3" step="0.1" value="0" oninput="updateInteg()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-b)"></span><span class="vn" style="color:var(--c-b)">b</span><span class="vd">x</span></span><span class="vv" style="color:var(--c-b)" id="val-igb2">1.00</span></div><input type="range" class="sl-b" id="sl-igb2" min="-5" max="5" step="0.1" value="1" oninput="updateInteg()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-c)"></span><span class="vn" style="color:var(--c-c)">c</span><span class="vd">상수</span></span><span class="vv" style="color:var(--c-c)" id="val-igc2">0.00</span></div><input type="range" class="sl-c" id="sl-igc2" min="-5" max="5" step="0.1" value="0" oninput="updateInteg()"></div>`;
  } else if(integFn==='abs'){
    el.innerHTML=`<div class="yk-panel-title"><div class="yk-dot"></div>변수 Variables</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-a)"></span><span class="vn" style="color:var(--c-a)">A</span><span class="vd">계수</span></span><span class="vv" style="color:var(--c-a)" id="val-iga2">1.00</span></div><input type="range" class="sl-a" id="sl-iga2" min="0.1" max="3" step="0.1" value="1" oninput="updateInteg()"></div>`;
  } else {
    el.innerHTML=`<div class="yk-panel-title"><div class="yk-dot"></div>변수 Variables</div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-a)"></span><span class="vn" style="color:var(--c-a)">A</span><span class="vd">계수</span></span><span class="vv" style="color:var(--c-a)" id="val-iga2">1.00</span></div><input type="range" class="sl-a" id="sl-iga2" min="-3" max="3" step="0.1" value="1" oninput="updateInteg()"></div>
      <div class="sl-item"><div class="sl-lbl"><span class="nm"><span class="dot" style="background:var(--c-b)"></span><span class="vn" style="color:var(--c-b)">B</span><span class="vd">주파수</span></span><span class="vv" style="color:var(--c-b)" id="val-igb2">1.00</span></div><input type="range" class="sl-b" id="sl-igb2" min="0.1" max="4" step="0.1" value="1" oninput="updateInteg()"></div>`;
  }
}
function integF(fn,x,p){if(fn==='poly')return x.map(xi=>p.a*xi*xi+p.b*xi+p.c);if(fn==='sin')return x.map(xi=>p.a*Math.sin(p.b*xi));if(fn==='cos')return x.map(xi=>p.a*Math.cos(p.b*xi));if(fn==='exp')return x.map(xi=>p.a*Math.exp(p.b*xi));if(fn==='abs')return x.map(xi=>p.a*Math.abs(xi));return x.map(()=>0);}
function integAD(fn,x,p){if(fn==='poly')return x.map(xi=>p.a*xi*xi*xi/3+p.b*xi*xi/2+p.c*xi);if(fn==='sin')return x.map(xi=>-p.a/p.b*Math.cos(p.b*xi));if(fn==='cos')return x.map(xi=>p.a/p.b*Math.sin(p.b*xi));if(fn==='exp')return x.map(xi=>p.a/p.b*Math.exp(p.b*xi));if(fn==='abs')return x.map(xi=>p.a*xi*Math.abs(xi)/2);return x.map(()=>0);}
function integADStr(fn,p){if(fn==='poly')return `F(x)=${(p.a/3).toFixed(2)}x³+${(p.b/2).toFixed(2)}x²+${p.c.toFixed(1)}x+C`;if(fn==='sin')return `F(x)=${(-p.a/p.b).toFixed(2)}cos(${p.b.toFixed(1)}x)+C`;if(fn==='cos')return `F(x)=${(p.a/p.b).toFixed(2)}sin(${p.b.toFixed(1)}x)+C`;if(fn==='exp')return `F(x)=${(p.a/p.b).toFixed(2)}e^(${p.b.toFixed(1)}x)+C`;if(fn==='abs')return `F(x)=${(p.a/2).toFixed(2)}x|x|+C`;return'-';}

function updateInteg(){
  const aEl=document.getElementById('sl-iga2'),bEl=document.getElementById('sl-igb2'),cEl=document.getElementById('sl-igc2');
  const p={a:+aEl.value,b:bEl?+bEl.value:1,c:cEl?+cEl.value:0};
  document.getElementById('val-iga2').textContent=p.a.toFixed(2);if(document.getElementById('val-igb2'))document.getElementById('val-igb2').textContent=p.b.toFixed(2);if(document.getElementById('val-igc2'))document.getElementById('val-igc2').textContent=p.c.toFixed(2);
  const lo=+document.getElementById('sl-iga').value,hi=+document.getElementById('sl-igb').value;
  document.getElementById('val-iga').textContent=lo.toFixed(2);document.getElementById('val-igb').textContent=hi.toFixed(2);
  let eq='';
  if(integFn==='poly')eq=`∫[${cv(VC.a,p.a.toFixed(1))}x² ${ss(p.b)} ${cv(VC.b,af(p.b))}x ${ss(p.c)} ${cv(VC.c,af(p.c))}]dx`;
  else if(integFn==='sin')eq=`∫${cv(VC.a,p.a.toFixed(1))}sin(${cv(VC.b,p.b.toFixed(1))}x)dx`;
  else if(integFn==='cos')eq=`∫${cv(VC.a,p.a.toFixed(1))}cos(${cv(VC.b,p.b.toFixed(1))}x)dx`;
  else if(integFn==='exp')eq=`∫${cv(VC.a,p.a.toFixed(1))}e^(${cv(VC.b,p.b.toFixed(1))}x)dx`;
  else if(integFn==='abs')eq=`∫${cv(VC.a,p.a.toFixed(1))}|x|dx`;
  document.getElementById('eq-integ').innerHTML=eq;
  const LB=makeLB();const x=ls(-8,8,600),y=integF(integFn,x,p);
  const tr=[{x,y,type:'scatter',mode:'lines',line:{color:lineC(0),width:3},connectgaps:false,name:'f(x)'}];
  if(integOpts.area){const a2=Math.min(lo,hi),b2=Math.max(lo,hi),fx=ls(a2,b2,200),fy=integF(integFn,fx,p);tr.push({x:fx,y:fx.map(()=>0),type:'scatter',mode:'lines',line:{color:'transparent'},showlegend:false});tr.push({x:fx,y:fy,type:'scatter',mode:'lines',fill:'tonexty',fillcolor:'rgba(59,130,246,0.15)',line:{color:'rgba(59,130,246,0.4)',width:1},name:'적분영역'});tr.push({x:[lo,hi],y:integF(integFn,[lo,hi],p),type:'scatter',mode:'markers',marker:{color:lineC(2),size:8},name:'구간'});}
  if(integOpts.antideriv){const Fx=integAD(integFn,x,p),Flo=integAD(integFn,[lo],p)[0];tr.push({x,y:Fx.map(v=>v-Flo),type:'scatter',mode:'lines',line:{color:lineC(2),width:2,dash:'dash'},name:'F(x)-F(a)'});}
  Plotly.react('plot-integ',tr,ml({xaxis:{...LB.xaxis,range:[-8,8],title:'x'},yaxis:{...LB.yaxis,range:[-10,10],title:'y'},showlegend:true,legend:{x:0.01,y:0.99,bgcolor:'rgba(128,128,128,0.05)',font:{size:10}}}),CFG);
  const Fv=integAD(integFn,[lo,hi],p),defI=Fv[1]-Fv[0];
  const absX=ls(Math.min(lo,hi),Math.max(lo,hi),1000),absY=integF(integFn,absX,p),dx2=(Math.max(lo,hi)-Math.min(lo,hi))/999;let absA=0;absY.forEach(v=>{if(v!=null)absA+=Math.abs(v)*dx2;});
  document.getElementById('info-ig-val').textContent=defI.toFixed(6);document.getElementById('info-ig-anti').textContent=integADStr(integFn,p);document.getElementById('info-ig-ftc').textContent=`F(${hi.toFixed(1)})-F(${lo.toFixed(1)})=${defI.toFixed(4)}`;document.getElementById('info-ig-absarea').textContent=absA.toFixed(4);
  const descs={poly:'다항함수 적분: ∫xⁿdx=xⁿ⁺¹/(n+1)+C',sin:'삼각함수 적분: ∫sin(x)dx=-cos(x)+C',cos:'삼각함수 적분: ∫cos(x)dx=sin(x)+C',exp:'지수함수 적분: ∫eˣdx=eˣ+C',abs:'절댓값 적분: 구간 나눠 계산'};document.getElementById('info-integ-desc').textContent=descs[integFn]||'';
}
function resetInteg(){integFn='poly';integOpts={area:true,antideriv:false};document.querySelectorAll('#ig-fn-group .yk-btn').forEach(b=>b.classList.remove('tg-active'));document.querySelector('#ig-fn-group .yk-btn[data-fn="poly"]').classList.add('tg-active');document.getElementById('ig-area').classList.add('tg-active');document.getElementById('ig-anti').classList.remove('tg-active');document.getElementById('sl-iga').value=0;document.getElementById('sl-igb').value=3;buildIntegSliders();updateInteg();}

// ===== 교차 영역 =====
function updateIntersection(){
  const m=+document.getElementById('sl-im').value,n=+document.getElementById('sl-in').value,a=+document.getElementById('sl-ia').value,c=+document.getElementById('sl-ic').value;
  document.getElementById('val-im').textContent=m.toFixed(2);document.getElementById('val-in').textContent=n.toFixed(2);document.getElementById('val-ia').textContent=a.toFixed(2);document.getElementById('val-ic').textContent=c.toFixed(2);
  document.getElementById('eq-int-line').innerHTML=`y = ${cv(VC.b,m.toFixed(1))}x ${ss(n)} ${cv(VC.d,af(n))}`;
  document.getElementById('eq-int-quad').innerHTML=`y = ${cv(VC.a,a.toFixed(1))}x² ${ss(c)} ${cv(VC.c,af(c))}`;
  const LB=makeLB();const x=ls(-10,10,500),yL=x.map(xi=>m*xi+n),yQ=x.map(xi=>a*xi*xi+c);
  const A=a,B=-m,C2=c-n,D=B*B-4*A*C2;
  const tr=[{x,y:yL,type:'scatter',mode:'lines',line:{color:lineC(1),width:3},name:'일차함수'},{x,y:yQ,type:'scatter',mode:'lines',line:{color:lineC(0),width:3},name:'이차함수'}];
  let area=0,rs='-',is='-',ps='교차점 없음';
  if(A!==0&&D>=0){const x1=(-B-Math.sqrt(Math.max(0,D)))/(2*A),x2=(-B+Math.sqrt(Math.max(0,D)))/(2*A),lo=Math.min(x1,x2),hi=Math.max(x1,x2);
    if(D>0){const fx=ls(lo,hi,200),fl=fx.map(xi=>m*xi+n),fq=fx.map(xi=>a*xi*xi+c);tr.push({x:fx,y:fl,type:'scatter',mode:'lines',line:{color:'transparent'},showlegend:false});tr.push({x:fx,y:fq,type:'scatter',mode:'lines',fill:'tonexty',fillcolor:'rgba(16,185,129,0.2)',line:{color:'transparent'},name:'넓이'});tr.push({x:[lo,hi],y:[m*lo+n,m*hi+n],type:'scatter',mode:'markers',marker:{color:lineC(2),size:10},name:'교차점'});const F=t=>-a*t*t*t/3+m*t*t/2+(n-c)*t;area=Math.abs(F(hi)-F(lo));ps=`(${lo.toFixed(2)},${(m*lo+n).toFixed(2)}), (${hi.toFixed(2)},${(m*hi+n).toFixed(2)})`;rs=`[${lo.toFixed(2)},${hi.toFixed(2)}]`;is=`∫|f-g|dx=${area.toFixed(4)}`;}else{ps=`(${lo.toFixed(2)},${(m*lo+n).toFixed(2)}) 접점`;tr.push({x:[lo],y:[m*lo+n],type:'scatter',mode:'markers',marker:{color:lineC(2),size:10}});}}
  else if(A===0)ps=n===c?'무한히 많은 교차점':'교차점 없음';
  Plotly.react('plot-intersection',tr,ml({xaxis:{...LB.xaxis,range:[-8,8],title:'x'},yaxis:{...LB.yaxis,range:[-15,15],title:'y'},showlegend:true,legend:{x:0.02,y:0.98,bgcolor:'rgba(128,128,128,0.05)',font:{size:10}}}),CFG);
  document.getElementById('info-ipts').textContent=ps;document.getElementById('info-area').textContent=area.toFixed(4);document.getElementById('info-intrange').textContent=rs;document.getElementById('info-integral').textContent=is;
}
function resetIntersection(){document.getElementById('sl-im').value=1;document.getElementById('sl-in').value=0;document.getElementById('sl-ia').value=1;document.getElementById('sl-ic').value=0;updateIntersection();}

// ===== 삼각비 학습 (Unit Circle + Right Triangle) =====
function setTriAngle(deg) {
  document.getElementById('sl-tl-deg').value = deg;
  updateTriLearn();
}

function updateTriLearn() {
  const deg = +document.getElementById('sl-tl-deg').value;
  const rad = deg * Math.PI / 180;
  document.getElementById('val-tl-deg').textContent = deg + '°';

  // Radian display as fraction of π
  const radFracs = {0:'0',30:'π/6',45:'π/4',60:'π/3',90:'π/2',120:'2π/3',135:'3π/4',150:'5π/6',180:'π',210:'7π/6',225:'5π/4',240:'4π/3',270:'3π/2',300:'5π/3',315:'7π/4',330:'11π/6',360:'2π'};
  document.getElementById('val-tl-rad').textContent = radFracs[deg] || (rad / Math.PI).toFixed(2) + 'π';

  const cosV = Math.cos(rad), sinV = Math.sin(rad), tanV = Math.tan(rad);
  const f = v => Math.abs(v) < 1e-10 ? '0' : v.toFixed(4);

  document.getElementById('tr-sin').textContent = f(sinV);
  document.getElementById('tr-cos').textContent = f(cosV);
  document.getElementById('tr-tan').textContent = Math.abs(cosV) < 1e-10 ? '∞' : f(tanV);
  document.getElementById('tr-csc').textContent = Math.abs(sinV) < 1e-10 ? '∞' : f(1/sinV);
  document.getElementById('tr-sec').textContent = Math.abs(cosV) < 1e-10 ? '∞' : f(1/cosV);
  document.getElementById('tr-cot').textContent = Math.abs(sinV) < 1e-10 ? '∞' : f(cosV/sinV);

  drawUnitCircle(deg, rad, cosV, sinV);
  drawTriLearnGraph(rad, sinV, cosV);
}

function drawTriLearnGraph(rad, sinV, cosV) {
  const LB = makeLB();
  const x = ls(0, 2*Math.PI, 500);
  const ySin = x.map(xi => Math.sin(xi));
  const yCos = x.map(xi => Math.cos(xi));
  // tan 클리핑: -1.5 ~ 1.5 범위만 (원 크기에 맞춤)
  const TCLIP = 1.5;
  const yTan = x.map(xi => { const v = Math.tan(xi); return Math.abs(v) > TCLIP ? null : v; });

  const tanV = Math.abs(cosV) < 1e-10 ? null : sinV / cosV;
  const tanClip = tanV !== null && Math.abs(tanV) <= TCLIP ? tanV : null;

  const tr = [
    { x, y: ySin, type:'scatter', mode:'lines', line:{color:'#e94560',width:2.5}, name:'sin θ' },
    { x, y: yCos, type:'scatter', mode:'lines', line:{color:'#3b82f6',width:2.5}, name:'cos θ' },
    { x, y: yTan, type:'scatter', mode:'lines', line:{color:'#10b981',width:1.5,dash:'dot'}, connectgaps:false, name:'tan θ' },
    // Current angle vertical line
    { x:[rad,rad], y:[-1.8,1.8], type:'scatter', mode:'lines', line:{color:'#f59e0b',width:1.5,dash:'dash'}, showlegend:false },
    // Points at current angle
    { x:[rad], y:[sinV], type:'scatter', mode:'markers', marker:{color:'#e94560',size:10,line:{width:2,color:'white'}}, name:'sin='+sinV.toFixed(2) },
    { x:[rad], y:[cosV], type:'scatter', mode:'markers', marker:{color:'#3b82f6',size:10,line:{width:2,color:'white'}}, name:'cos='+cosV.toFixed(2) },
  ];
  if (tanClip !== null) {
    tr.push({ x:[rad], y:[tanClip], type:'scatter', mode:'markers', marker:{color:'#10b981',size:8,line:{width:2,color:'white'}}, name:'tan='+tanClip.toFixed(2) });
  }

  // x축: π 단위 + 각도 이중 표시 (주요 특수각만)
  const piT = {
    tickvals:[0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2, Math.PI, 3*Math.PI/2, 2*Math.PI],
    ticktext:['0','π/6<br><span style="font-size:0.7em">30°</span>','π/4<br><span style="font-size:0.7em">45°</span>','π/3<br><span style="font-size:0.7em">60°</span>','π/2<br><span style="font-size:0.7em">90°</span>','π<br><span style="font-size:0.7em">180°</span>','3π/2<br><span style="font-size:0.7em">270°</span>','2π<br><span style="font-size:0.7em">360°</span>']
  };

  Plotly.react('plot-trilearn', tr, ml({
    xaxis:{...LB.xaxis, range:[0, 2*Math.PI], title:'θ  (라디안 rad / 각도 deg)', ...piT, tickangle:0},
    yaxis:{...LB.yaxis, range:[-1.8,1.8], title:'값', dtick:0.5},
    height: 350,
    margin:{t:40, b:70, l:50, r:20},
    showlegend:true,
    legend:{orientation:'h', x:0.5, xanchor:'center', y:1.08, font:{size:10}}
  }), CFG);
}

function drawUnitCircle(deg, rad, cosV, sinV) {
  const canvas = document.getElementById('cv-trilearn');
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) || 500;
  canvas.width = size * 2; canvas.height = size * 2;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2); // retina
  const cx = size / 2, cy = size / 2, r = size * 0.35;

  // Get theme colors
  const cs = getComputedStyle(document.body);
  const bgCol = cs.backgroundColor || '#fff';
  const textCol = cs.color || '#222';

  ctx.clearRect(0, 0, size, size);

  // Grid
  ctx.strokeStyle = 'rgba(128,128,128,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(size, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, size); ctx.stroke();

  // Unit circle
  ctx.strokeStyle = 'rgba(128,128,128,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();

  // Angle arc
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.2, 0, -rad, rad > 0); ctx.stroke();

  // Angle label
  ctx.fillStyle = '#f59e0b';
  ctx.font = `${size*0.035}px sans-serif`;
  ctx.textAlign = 'left';
  const labelR = r * 0.28;
  ctx.fillText(deg + '°', cx + labelR * Math.cos(-rad/2) + 4, cy + labelR * Math.sin(-rad/2) + 4);

  // Point on circle
  const px = cx + r * cosV, py = cy - r * sinV;

  // cos line (adjacent - blue)
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();
  ctx.fillStyle = '#3b82f6';
  ctx.font = `bold ${size*0.032}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('cos', (cx + px) / 2, cy + size * 0.04);

  // sin line (opposite - red)
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.fillStyle = '#e94560';
  ctx.textAlign = 'left';
  ctx.fillText('sin', px + 6, (cy + py) / 2 + 4);

  // Hypotenuse (radius line)
  ctx.strokeStyle = textCol;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
  ctx.globalAlpha = 1;

  // Right angle indicator
  if (Math.abs(cosV) > 0.01 && Math.abs(sinV) > 0.01) {
    const sq = size * 0.02;
    const sx = cosV > 0 ? -sq : sq;
    const sy = sinV > 0 ? sq : -sq;
    ctx.strokeStyle = 'rgba(128,128,128,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + sx, cy); ctx.lineTo(px + sx, cy + sy); ctx.lineTo(px, cy + sy);
    ctx.stroke();
  }

  // tan line (green) - from (1,0) vertically
  if (Math.abs(cosV) > 0.01) {
    const tanLen = sinV / cosV;
    const tanPx = cx + r, tanPy = cy - r * tanLen;
    // Clip to reasonable range
    if (Math.abs(tanLen) < 1.5) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(tanPx, cy); ctx.lineTo(tanPx, tanPy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#10b981';
      ctx.font = `bold ${size*0.03}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText('tan', tanPx + 4, (cy + tanPy) / 2);

      // Secant line (origin to tan point)
      ctx.strokeStyle = 'rgba(128,128,128,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tanPx, tanPy); ctx.stroke();
    }
  }

  // Point dot
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(px, py, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = textCol;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Coordinate label
  ctx.fillStyle = textCol;
  ctx.font = `${size*0.028}px sans-serif`;
  ctx.textAlign = cosV >= 0 ? 'left' : 'right';
  const lx = cosV >= 0 ? px + 10 : px - 10;
  const ly = sinV >= 0 ? py - 10 : py + 16;
  ctx.fillText(`(${cosV.toFixed(2)}, ${sinV.toFixed(2)})`, lx, ly);

  // Axis labels
  ctx.fillStyle = 'rgba(128,128,128,0.5)';
  ctx.font = `${size*0.026}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('1', cx + r, cy + size * 0.04);
  ctx.fillText('-1', cx - r, cy + size * 0.04);
  ctx.fillText('1', cx + size * 0.02, cy - r);
  ctx.fillText('-1', cx + size * 0.03, cy + r + size * 0.01);
}

// ===== Replot all for theme change =====
function replotAll(){updateLinear();updateQuad();updateTriLearn();updateTrig();updateDeriv();updateInteg();updateIntersection();}

// ===== Init =====
window.addEventListener('load',()=>{buildDerivSliders();buildIntegSliders();replotAll();});
