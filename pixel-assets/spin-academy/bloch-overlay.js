/* QUBE Lab | Physical Bloch & magnetisation readouts, v2.
 * Spin-1/2: r = (Tr[rho sigma_x], Tr[rho sigma_y], Tr[rho sigma_z])
 * Higher spin: m = <S>/S, a physically exact moment but NOT complete tomography.
 * This script never changes an original simulation or its CSV data. */
(()=>{'use strict';
const body=document.body;
const kind=body.dataset.spinModule?'spin':body.dataset.radicalModule?'radical':body.dataset.advancedRp?'advanced':null;
if(!kind)return;
const mod=body.dataset.spinModule||body.dataset.radicalModule||body.dataset.advancedRp;
const Q=window.QPhysics,R=window.QRadical,P=window.QRPAdvanced;
if(!Q || (kind==='radical'&&!R) || (kind==='advanced'&&!P))return;
const container=document.getElementById('results');if(!container)return;
const controls=document.getElementById('controls');
if(kind==='spin'&&mod==='isotopes'&&controls&&!document.getElementById('blochProbeTime')){
 const extra=document.createElement('label');extra.htmlFor='blochProbeTime';extra.textContent='Bloch reference evolution time (µs)';
 const input=document.createElement('input');input.type='number';input.id='blochProbeTime';input.min='0';input.max='100';input.step='any';input.value='0.002';
 extra.appendChild(input);controls.appendChild(extra);
}
const number=(id,fallback=0)=>{let e=document.getElementById(id);if(!e)return fallback;let n=e.valueAsNumber===undefined?Number(e.value):e.valueAsNumber;return Number.isFinite(n)?n:fallback;};
const selected=(id,fallback='')=>document.getElementById(id)?.value??fallback;
const enabled=id=>Boolean(document.getElementById(id)?.checked);
const rad=x=>x*Math.PI/180;
const colors=['#99f2dc','#c8b4ff','#ffd68a','#ffb8b4'];
const fmt=x=>Math.abs(x)<1e-10?'0':Number(x.toPrecision(5)).toString();
const scale=(a,b)=>Q.scale(a,b);
const add=(a,b)=>Q.add(a,b);
const mul=(a,b)=>Q.mul(a,b);
const trace=Q.tr;
const initial=(n)=>Q.pure(n);
const finiteVector=a=>a.length===3&&a.every(Number.isFinite);
function pairCorrelations(rho,n=2,iA=0,iB=1){
 const tensor=[];
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  const A=Q.local(Q.P[i],iA,n),B=Q.local(Q.P[j],iB,n);
  tensor.push(Q.expect(mul(A,B),rho));
 }
 return {tensor,singlet:(1-tensor[0]-tensor[4]-tensor[8])/4};
}

const vec=(label,v,meta='')=>({label,v,meta});
const normalizedSpin=(rho,S)=>{
 const ops=Q.spin(S);return ops.map(op=>Q.expect(op,rho)/S);
};
const eigenRho=(ev,index=0)=>{
 const n=ev.e.length,v=ev.v,rho=Q.z(n);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const a=2*(i*n+index),b=2*(j*n+index),p=2*(i*n+j);
  rho[p]=v[a]*v[b]+v[a+1]*v[b+1];
  rho[p+1]=v[a+1]*v[b]-v[a]*v[b+1];
 }
 return rho;
};
const normalized=(rho)=>{
 const tr=trace(rho);if(!(tr>1e-12))throw Error('Snapshot population is zero');return scale(rho,1/tr);
};
function reducedElectron(model,rho){let er=R.reduced(model,rho);return [vec('Radical A',Q.bloch(er,0,2)),vec('Radical B',Q.bloch(er,1,2))];}
function pRadical(){return {
 iso:selected('iso','N14'),initial:selected('initial','S'),site:number('site',0),
 B:number('B',1),gA:number('gA',2.003),gB:number('gB',2.002),
 Axy:number('Axy',8),Az:number('Az',16),J:number('J',1),r:number('r',0),
 theta:number('theta',0),k:number('k',1)
};}
function pAdvanced(){return {
 gA:number('gA',2.003),gB:number('gB',2.002),J:number('J',0),
 r:number('r',0),theta:number('theta',0),B:number('B',0),
 ks:number('ks',0),kt:number('kt',0),kbet:number('kbet',0),
 kesc:number('kesc',0),kD:number('kD',0),kHFC:number('kHFC',0)
};}
function residence(H,p){const g=P.generator(H,p),A=P.liouvillian(g);
 return P.solve(A,P.PS); // unnormalised ∫ρ(t)dt; ensemble normalisation occurs after averaging
}
function fromRho4(rho,meta){rho=normalized(rho);return {
 label:'Electron-spin reduced density matrices',type:'bloch',
 vectors:[vec('Radical A',Q.bloch(rho,0,2)),vec('Radical B',Q.bloch(rho,1,2))],corr:pairCorrelations(rho),
 meta
};}
function meanDensity4(densities){let out=Q.z(4);for(const rho of densities)out=add(out,scale(rho,1/densities.length));return out;}
function radicalSnapshot(){
 const p=pRadical(),m=R.model(p);
 let rho=m.rho,meta='Exact initial electronic reduced density matrices after tracing out the optional nucleus.';
 switch(mod){
 case 'pulse':{
  const seq=[{delay:number('delay',0.15)},{site:number('target',0),axis:number('axis',0),angle:number('angle',180)}];
  rho=R.sequence(m,seq).r;
  meta='Exact conditional state immediately after the selected delay and ideal pulse; recombination survival is conditioned out.';
  break;}
 case 'entangle':{
  const op=selected('operation','none');
  if(op!=='none')rho=R.pulse(m,rho,0,{x:0,y:1,z:2}[op],op==='y'?Math.PI/2:Math.PI);
  rho=R.evolve(m,rho,number('duration',2));
  meta='Electronic reduced state at the final time, evolved under the module Hamiltonian after the selected operation.';
  break;}
 case 'isotope':{
  const pairs={H:['H1','H2'],N:['N14','N15'],C:['C13','C12']};const names=pairs[selected('sub','H')]||pairs.H;
  const factor=R.isotopes[names[0]].gamma;
  const entries=names.map(name=>{
   const f=R.isotopes[name].gamma/factor;
   const m2=R.model({...p,iso:name,Axy:p.Axy*f,Az:p.Az*f});
   const product=R.yields(m2).product;
   const er=R.reduced(m2,normalized(product));
   return vec(R.isotopes[name].label+' · radical A',Q.bloch(er,0,2));
  });
  return {label:'Exact product-weighted radical A states',type:'bloch',vectors:entries,
   corr:pairCorrelations(R.reduced(R.model({...p,iso:names[0]}),R.yields(R.model({...p,iso:names[0]})).product)),
   meta:'Each sphere is the radical-A reduced state of the normalized, reaction-weighted product density for the corresponding isotope.'};
 }
 case 'epr':rho=R.evolve(m,rho,number('delay',0.1));
  meta='Exact electronic reduced state at the specified TREPR delay (before the phenomenological survival amplitude).';break;
 case 'cidep':rho=R.evolve(m,rho,number('duration',2));
  meta='Exact electronic reduced state at the selected final time, consistent with the CIDEP spin Hamiltonian.';break;
 case 'levels':meta='Exact electronic precursor state at the selected magnetic field. A singlet yields zero individual Bloch vectors despite nonzero pair correlations.';break;
 case 'dip':meta='Exact initial electronic precursor used for the exchange/dipolar comparison; the original simulation sweeps interaction parameters rather than preparing a new state.';break;
 case 'three':{
  const t=number('tau',1),steps=[
   {site:0,angle:enabled('mw1')?number('angle1',90):0},
   {delay:t},{site:1,angle:enabled('mw2')?number('angle2',180):0},
   ...(enabled('rf')?[{site:2,angle:number('angle3',180)}]:[]),{delay:t}];
  rho=R.sequence(m,steps).r;
  meta='Exact two-electron reduced state after the pulse sequence at the displayed maximum interpulse delay.';break;
 }
 case 'cidnp':{
  if(m.iso.I===0)throw Error('No magnetic nucleus selected');
  const y=R.yields(m),I=m.iso.I;
  let data=[];
  for(const [name,proj,weight] of [['Singlet product',m.PS,y.S],['Triplet product',m.PT,y.T]]){
   if(weight<1e-10)continue;
   // Projected product population; the product projector commutes with the nuclear spin operators.
   const moments=m.nu.map(a=>Q.expect(Q.mul(proj,a),y.product)/(I*weight));
   data.push(vec(name,moments));
  }
  return {label:'Conditional product nuclear spin moments',type:I===.5?'bloch':'moment',vectors:data,
   meta:I===.5?'Exact conditional nuclear Bloch vectors from the singlet/triplet product density operators.':'Exact normalized nuclear spin expectation ⟨I⟩/I; for I > ½ this dipole vector is not full nuclear-state tomography.'};
 }
 }
 return {label:'Exact electron reduced density matrices',type:'bloch',vectors:reducedElectron(m,rho),corr:pairCorrelations(R.reduced(m,rho)),meta};
}
const singleSpinOptions={
 '1H':[.5,42.577], '2H':[1,6.536], '13C':[.5,10.705], '14N':[1,3.077], '15N':[.5,-4.317]
};
function spinSnapshot(){
 switch(mod){
 case 'pulse':case 'gates':return null; // Their QPhysics density-matrix Bloch spheres are already exact.
 case 'isotopes':{
  const el=selected('element','H'), row=document.querySelector('#results .table-scroll tbody tr');
  if(!row)return {label:'No isotope selected',type:'unavailable',vectors:[],meta:'Select a magnetic isotope from the atlas.'};
  const cells=[...row.querySelectorAll('td')].map(e=>e.textContent.trim());
  const I=Number(cells[1]),gamma=Number(cells[2]),B=number('B',9.4),t=number('blochProbeTime',.002);
  if(!(I>0)||!Number.isFinite(gamma))return {label:'No Bloch reference state',type:'unavailable',vectors:[],meta:'An isotope with nonzero spin is required.'};
  const phi=-2*Math.PI*gamma*B*t;
  return {label:'Exactly propagated reference nuclear spin',type:I===.5?'bloch':'moment',
   vectors:[vec(cells[0]+' · prepared +x',[Math.cos(phi),Math.sin(phi),0],`t=${fmt(t)} µs`)],
   meta:`Reference preparation, not an isotope-atlas measurement: an ideal spin-coherent +x state evolves for t=${fmt(t)} µs under H/h=−(γ/2π)B I_z with B=${fmt(B)} T and γ/2π=${fmt(gamma)} MHz/T. This is exact under the Zeeman-only Larmor model.${I>.5?' For I>½ the arrow gives ⟨I⟩/I, not the full higher-spin density matrix.':''}`};
 }
 case 'polar':{
  const sp=selected('species','e');
  const table={'e':[.5,-28024.951],'1H':[.5,42.577],'2H':[1,6.536], '13C':[.5,10.705],'14N':[1,3.077],'15N':[.5,-4.317]};
  const pair=table[sp];
  // Exact values for curated species: we use their same spin quantum number and gamma.
  const gammaTable=[
   ['e',.5,-28024.951],['1H',.5,42.577],['2H',1,6.536],['3He',.5,-32.434],
   ['6Li',1,6.266],['7Li',1.5,16.546],['10B',3,4.575],['11B',1.5,13.663],
   ['13C',.5,10.705],['14N',1,3.077],['15N',.5,-4.317],['17O',2.5,-5.772],
   ['19F',.5,40.052],['23Na',1.5,11.262],['29Si',.5,-8.465],['31P',.5,17.235],
   ['33S',1.5,3.272],['35Cl',1.5,4.177],['37Cl',1.5,3.477],
   ['79Br',1.5,10.705],['81Br',1.5,11.538],['127I',2.5,8.577]
  ];
  const [_,I,gamma]=gammaTable.find(a=>a[0]===sp)||pair||gammaTable[0];
  const B=number('B',9.4),T=number('T',298),p=Q.polarization(I,gamma,B,T);
  return {label:'Exact equilibrium spin polarization',type:I===.5?'bloch':'moment',
   vectors:[vec(sp,[0,0,p],'⟨I_z⟩/I = '+fmt(p))],
   meta:`Exact Zeeman thermal polarization at B=${fmt(B)} T and T=${fmt(T)} K; the vector length is NOT artificially magnified.${I>.5?' For spin I > ½ this is the exact dipole moment, not a complete Bloch description.':''}`};
 }
 case 'triplet':{
  const S=1,D=number('D',1200),E=number('E',150),th=rad(number('theta',35)),g=number('g',2.0023),B=number('marker',25)/1000;
  const [sx,sy,sz]=Q.spin(S),id=Q.eye(3);
  let H=add(scale(add(mul(sz,sz),scale(id,-2/3)),D),scale(add(mul(sx,sx),scale(mul(sy,sy),-1)),E));
  H=add(H,scale(add(scale(sx,Math.sin(th)),scale(sz,Math.cos(th))),13996.24555*g*B));
  const eig=Q.eig(H);
  return {label:'Exact spin-1 eigenstate dipole moments',type:'moment',
   vectors:[0,1,2].map(i=>vec('Eigenstate '+(i+1),normalizedSpin(eigenRho(eig,i),S),`E/h = ${fmt(eig.e[i])} MHz`)),
   meta:'Exactly diagonalized spin-1 Hamiltonian at the selected marker field; each vector gives ⟨S⟩/S. A 3-level spin-1 density matrix cannot be fully represented by a Bloch sphere.'};
 }
 case 'dipolar':{
  const B=number('B',350)/1000,r=number('r',2),gA=number('g1',2.0023),gB=number('g2',2.0023),th=rad(number('theta',90));
  const d=Q.dipolar(B,r,gA,gB,th);const rho=eigenRho(d.ev,0);
  return {label:'Exact two-electron eigenstate Bloch vectors',type:'bloch',
   vectors:[vec('Electron A',Q.bloch(rho,0,2)),vec('Electron B',Q.bloch(rho,1,2))],corr:pairCorrelations(rho),
   meta:'The lowest-energy eigenstate of the full dipolar Hamiltonian at the selected single orientation. The powder-averaged DEER trace does not define a unique Bloch vector.'};
 }
 case 'epr':{
  const S=number('S',.5),D=number('D',0),gPara=number('gp',2.0026),gPerp=number('gt',2.0026),B=number('center',340),[sx,sy,sz]=Q.spin(S);
  const H0=scale(add(mul(sz,sz),scale(Q.eye(2*S+1),-S*(S+1)/3)),D);
  const get=(theta)=>{
   const st=Math.sin(theta),ct=Math.cos(theta);
   const H=add(H0,scale(add(scale(sx,gPerp*st),scale(sz,gPara*ct)),13.99624555*B));
   return normalizedSpin(eigenRho(Q.eig(H),0),S);
  };
  return {label:'Exact electron eigenstate magnetic moments',type:S===.5?'bloch':'moment',
   vectors:[vec('B ∥ ZFS z',get(0)),vec('B ⟂ ZFS z',get(Math.PI/2))],
   meta:`Exact lowest-energy eigenstate moments for two resolved orientations (not a powder-average state). The EPR model specifies neither sample temperature nor microwave B₁, so no unique driven steady-state Bloch vector exists.${S>.5?' For S > ½ these are exact ⟨S⟩/S moments, not full-state tomography.':''}`};
 }
 case 'three':return threeChannelSnapshot();
 case 'nmr':return nmrSnapshot();
 }
 return null;
}
function relaxElectron(rho,n,k,t,T1,T2){
 if(t<=0)return rho;
 const A=Math.exp(-t/T1),B=Math.exp(-t*Math.max(0,1/T2-1/(2*T1))),u=.55;
 const make=(a,b,c,d)=>Float64Array.of(a,0,b,0,c,0,d,0);
 const kraus=[scale(make(1,0,0,Math.sqrt(A)),Math.sqrt(u)),scale(make(0,Math.sqrt(1-A),0,0),Math.sqrt(u)),scale(make(Math.sqrt(A),0,0,1),Math.sqrt(1-u)),scale(make(0,0,Math.sqrt(1-A),0),Math.sqrt(1-u))];
 let out=Q.z(2**n);for(const K of kraus)out=add(out,Q.evolve(rho,Q.local(K,k,n)));
 return add(scale(out,(1+B)/2),scale(Q.evolve(out,Q.local(Q.Z,k,n)),(1-B)/2));
}
function threeChannelSnapshot(){
 const n=3;let rho=Q.thermal(n),op=Q.ops(n),max=number('tau',2),exp=selected('experiment','Hahn echo');
 const H=Q.hamiltonian(n,[number('oa',.3),number('ob',-.2),number('nu',1.5)],[[0,1,2,2,number('d',1)],[0,2,2,2,number('A',2)],[0,2,2,0,number('B',.8)]]),eig=Q.eig(H);
 const pulse=(ch,deg,axis=0)=>({ch,deg,axis}),delay=t=>({t});
 let seq;
 if(exp==='Hahn echo')seq=[pulse(0,90,1),delay(max),pulse(0,180),delay(max)];
 else if(exp==='DEER (two electron echo)')seq=[pulse(0,90,1),delay(max/2),pulse(1,180),delay(max/2),pulse(0,180),delay(max)];
 else if(exp==='Three-pulse ESEEM')seq=[pulse(0,90,1),delay(max),pulse(0,90,1),delay(.3),pulse(0,90,1),delay(max)];
 else seq=[pulse(0,90,1),delay(max/2),pulse(2,180),delay(max/2),pulse(0,180),delay(max)];
 for(const step of seq){
  if(step.t!==undefined){
   rho=Q.evolve(rho,Q.propagator(eig,step.t));
   rho=relaxElectron(rho,n,0,step.t,number('t1',40),number('t2',10));
   rho=relaxElectron(rho,n,1,step.t,number('t1',40),number('t2',10));
   const c=Math.exp(-step.t/number('nt2',30));
   rho=add(scale(rho,(1+c)/2),scale(Q.evolve(rho,Q.local(Q.Z,2,n)),(1-c)/2));
  }else if(enabled('abc'[step.ch]))rho=Q.evolve(rho,Q.local(Q.rotation(step.axis,rad(step.deg)),step.ch,n));
 }
 return {label:'Exact density-matrix spin readout',type:'bloch',
  vectors:['Observer e⁻','Partner e⁻','Nucleus ½'].map((name,i)=>vec(name,Q.bloch(rho,i,n))),corr:pairCorrelations(rho,3,0,1),
  meta:'Exact normalized one-spin density matrices after the displayed pulse sequence at τ=max. Uses the central resonance offset and the same local relaxation channels as the simulation; the plotted trace averages over additional offsets when requested.'};
}
function nmrSnapshot(){
 const shifts=selected('shifts','1.0,1.04').split(',').map(a=>Number(a.trim()));
 if(shifts.length<2||shifts.length>4||shifts.some(x=>!Number.isFinite(x)))return null;
 const n=shifts.length,J=number('J',12),B=number('B',9.4),ref=number('ref',1),off=shifts.map(v=>(v-ref)*42.577*B),terms=[];
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let a=0;a<3;a++)terms.push([i,j,a,a,J]);
 let rho=initial(n);
 for(let i=0;i<n;i++)rho=Q.evolve(rho,Q.local(Q.rotation(1,Math.PI/2),i,n));
 const tau=.002;rho=Q.evolve(rho,Q.propagator(Q.eig(Q.hamiltonian(n,off,terms)),tau));
 return {label:'Exact coupled-spin probe-state Bloch vectors',type:'bloch',
  vectors:Array.from({length:n},(_,i)=>vec('Proton '+(i+1),Q.bloch(rho,i,n))),
  meta:`Exact reduced density matrices of a defined probe state: |↑…↑⟩, ideal 90°ᵧ pulses, then ${tau*1e3} ms of free evolution under the same isotropic J/shift Hamiltonian. This is a reference preparation, NOT a state determined uniquely by the NMR absorption spectrum.`};
}
function advancedSnapshot(){
 const p=pAdvanced();
 switch(mod){
 case 'mary':case 'semiclassical':{
  const nuc=P.parseNuclei(selected('nuclei','')),draws=P.bathDraws(nuc,number('draws',12),number('seed',2206));
  const B=mod==='mary'?number('maxB',5)/2:number('B',1);
  const k=number('k',1);const rhos=draws.map(([a,b])=>P.exactYield(P.hamiltonian({...p,B},a,b),k).integrated);
  return {...fromRho4(meanDensity4(rhos)),meta:`Exact ensemble average of the normalized, reaction-weighted two-electron density matrices across the same ${draws.length} quasi-static nuclear-field samples, at B=${fmt(B)} mT. Both spins start in a singlet state.`};
 }
 case 'kinetics':{
  const a=[number('hA',4),0,number('hA',4)*.3],b=[0,0,number('hB',6)];
  return {...fromRho4(residence(P.hamiltonian(p,a,b),p)),
   meta:'Exact residence-time-integrated electron density matrix from the same Haberkorn + Lindblad Liouvillian, normalized by its trace. This is a reaction-lifetime-weighted state, not an instantaneous state.'};
 }
 case 'odmr':{
  const nuc=[{site:0,iso:'H1',A:number('aA',6),I:.5},{site:1,iso:'H1',A:number('aB',9),I:.5}];
  const draws=P.bathDraws(nuc,number('draws',4),2412),freq=P.K*(p.gA+p.gB)*p.B/2,B1=number('B1',.16);
  const rs=draws.map(([a,b])=>residence(P.hamiltonian(p,[0,0,a[2]],[0,0,b[2]],{freq,B1}),p));
  return {...fromRho4(meanDensity4(rs)),meta:`Exact normalized, reaction-lifetime-weighted electron density from the same rotating-wave Hamiltonian, with RF at the center frequency (${fmt(freq)} MHz), B₁=${fmt(B1)} mT, and the same longitudinal bath samples. This is not a laboratory-frame precession trajectory.`};
 }
 case 'gradient':{
  const fieldA=[number('A',8),0,number('A',8)*.2],fieldB=[0,0,-number('A',8)*.75],k=number('k',1),span=number('span',1),G=number('Gx',.65);
  const fields=[p.B,p.B+G*span];
  return {label:'Exact local electron reduced density matrices',type:'bloch',
   corr:pairCorrelations(normalized(P.exactYield(P.hamiltonian({...p,B:p.B},fieldA,fieldB),k).integrated)),
   vectors:fields.map((B,i)=>{
    const rho=P.exactYield(P.hamiltonian({...p,B},fieldA,fieldB),k).integrated;
    return vec(i?'Radical A · +x edge':'Radical A · center',Q.bloch(normalized(rho),0,2),`B=${fmt(B)} mT`);
   }),meta:'Normalized product-weighted local electron density matrices, evaluated at the center and +x edge using the same field-gradient Hamiltonian. Each vector corresponds to a different spatial field.'};
 }
 }
 return null;
}
function content(){try{return kind==='spin'?spinSnapshot():kind==='radical'?radicalSnapshot():advancedSnapshot();}catch(err){
 return {label:'Bloch readout unavailable for current parameters',type:'unavailable',vectors:[],meta:err.message};
}}
function sphere(item,index,type){
 const nrm=item.v.every(Number.isFinite)?item.v:[0,0,0];
 const x=Math.max(-1,Math.min(1,nrm[0])),y=Math.max(-1,Math.min(1,nrm[1])),z=Math.max(-1,Math.min(1,nrm[2]));
 const m=Math.hypot(x,y,z),c=colors[index%colors.length];
 // Orthographic projection using an orthonormal 3D camera basis (azimuth 35°, elevation 25°).
 const az=35*Math.PI/180,el=25*Math.PI/180;
 const right=Math.cos(az)*x-Math.sin(az)*y;
 const up=Math.sin(az)*Math.sin(el)*x+Math.cos(az)*Math.sin(el)*y+Math.cos(el)*z;
 const px=100+69*right,py=100-69*up;
 return `<div class="bloch-physical-item"><svg viewBox="0 0 200 200" role="img" aria-label="${item.label}: x ${fmt(x)}, y ${fmt(y)}, z ${fmt(z)}">
 <circle cx="100" cy="100" r="72" fill="#111a34" stroke="#92a1d2"/>
 <ellipse cx="100" cy="100" rx="72" ry="24" fill="none" stroke="#4b567f"/>
 <ellipse cx="100" cy="100" rx="27" ry="72" fill="none" stroke="#4b567f"/>
 <path d="M28 100H172 M100 28V172 M65 125L135 75" stroke="#596999" stroke-dasharray="3 4"/>
 <path d="M100 100L${px} ${py}" stroke="${c}" stroke-width="4"/>
 <circle cx="${px}" cy="${py}" r="5" fill="${c}"/>
 <text x="177" y="102">x</text><text x="102" y="20">z</text><text x="137" y="71">y</text>
 </svg><b>${item.label}</b><small>${type==='moment'?'⟨spin⟩/spin quantum number':'⟨σ⟩'} = (${fmt(x)}, ${fmt(y)}, ${fmt(z)})</small><small>|r| = ${fmt(m)}${item.meta?' · '+item.meta:''}</small></div>`;
}
function correlationHTML(corr){
 if(!corr)return '';
 const t=corr.tensor;
 return `<div class="bloch-corr"><h4>Exact electron-pair correlations</h4><div class="bloch-corr-grid"><span>⟨σAx σBx⟩ ${fmt(t[0])}</span><span>⟨σAy σBy⟩ ${fmt(t[4])}</span><span>⟨σAz σBz⟩ ${fmt(t[8])}</span><span>Singlet fraction ${fmt(corr.singlet)}</span></div><p class="note">From the same normalized two-spin density matrix. Local Bloch vectors can vanish while pair correlations remain nonzero.</p></div>`;
}
function html(data){return `<section class="spin-chart bloch-autopanel" aria-label="Physical Bloch sphere readout">
 <h3>${data.label}</h3>
 ${data.type==='unavailable'?'<p class="note"><strong>No physical Bloch vector defined.</strong></p>':`<div class="bloch-grid">${data.vectors.map((x,i)=>sphere(x,i,data.type)).join('')}</div>`}
 ${correlationHTML(data.corr)}
 <p class="note">${data.meta}</p>
 </section>`;}
let observer=null,scheduled=false;
function update(){scheduled=false;observer?.disconnect();
 try{
  container.querySelectorAll('.bloch-autopanel').forEach(n=>n.remove());
  // Only render after a successful simulation output. The status element is the source of truth for successful calculation.
  const status=document.getElementById('status')?.textContent||'';
  if(!container.children.length || /^Error:/.test(status) || /Parameters changed/.test(status))return;
  const data=content();if(!data)return;
  container.insertAdjacentHTML('afterbegin',html(data));
 }finally{observer?.observe(container,{childList:true});}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update);}
observer=new MutationObserver(schedule);observer.observe(container,{childList:true});
window.addEventListener('load',schedule);document.getElementById('run')?.addEventListener('click',()=>setTimeout(schedule,25));
controls?.addEventListener('change',()=>setTimeout(schedule,25));
schedule();
})();
