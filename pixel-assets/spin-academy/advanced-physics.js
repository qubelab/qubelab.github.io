/* QUBE Lab — advanced radical-pair teaching engine.
   H/h: MHz (cycles/µs), B:mT, t:µs, distances:nm. Independent, local JS.
   Four-dimensional electron Hilbert space. Quasistatic Overhauser fields model nuclear bath.
   Equal-rate yields: exact eigensystem. General Haberkorn + Lindblad: inverse Liouvillian.
   No published or experimentally fitted MagLOV variant parameters are bundled. */
(function(root){'use strict';const Q=root.QPhysics;if(!Q)throw Error('Load physics.js first.');
const N=4, E=Q.ops(2), ID=Q.eye(4), zero=()=>Q.z(4), add=Q.add,sc=Q.scale,mul=Q.mul,tr=Q.tr;
const K=13.99624555;let dot=zero();for(let a=0;a<3;a++)dot=add(dot,mul(E[0][a],E[1][a]));
const PS=add(sc(ID,.25),sc(dot,-1)),PT=add(ID,sc(PS,-1));
function dTensor(theta=0){const a=theta*Math.PI/180,v=[Math.sin(a),0,Math.cos(a)];let m=dot;for(let i=0;i<3;i++)for(let j=0;j<3;j++)m=add(m,sc(mul(E[0][i],E[1][j]),-3*v[i]*v[j]));return m;}
const RHO0=PS;function compDot(u,v){let re=0,im=0;for(let i=0;i<u.length;i+=2){re+=u[i]*v[i]+u[i+1]*v[i+1];im+=u[i]*v[i+1]-u[i+1]*v[i];}return [re,im];}
function cEig(H){ // Complex Hermitian eigenpairs via real symmetric 8×8 embedding and complex Gram–Schmidt.
 const n=4,b=Q.z(2*n);for(let i=0;i<n;i++)for(let j=0;j<n;j++){let h=2*(i*n+j),re=H[h],im=H[h+1],D=2*n; b[2*(i*D+j)]=re;b[2*(i*D+j+n)]=-im;b[2*((i+n)*D+j)]=im;b[2*((i+n)*D+j+n)]=re;}
 const all=Q.eig(b),cols=[],evals=[];
 for(let k=0;k<2*n;k++){const v=new Float64Array(2*n);for(let i=0;i<n;i++){v[2*i]=all.v[2*(i*(2*n)+k)];v[2*i+1]=all.v[2*((i+n)*(2*n)+k)];}
  for(const old of cols){const [ar,ai]=compDot(old,v);for(let i=0;i<n;i++){let a=old[2*i],bb=old[2*i+1];v[2*i]-=ar*a-ai*bb;v[2*i+1]-=ar*bb+ai*a;}}
  const q=Math.sqrt(compDot(v,v)[0]);if(q>1e-7){for(let i=0;i<v.length;i++)v[i]/=q;cols.push(v);evals.push(all.e[k]);if(cols.length===n)break;}}
 if(cols.length!==n)throw Error('Hermitian eigensolver could not resolve eigenvectors.');const V=Q.z(n);for(let i=0;i<n;i++)for(let j=0;j<n;j++){V[2*(i*n+j)]=cols[j][2*i];V[2*(i*n+j)+1]=cols[j][2*i+1];}return {e:evals,v:V};}
function hamiltonian(p,fieldA=[0,0,0],fieldB=[0,0,0],rf=null){let h=zero();const gA=p.gA??2.003,gB=p.gB??2.002,B=p.B??1;
 const fA=K*gA*B-(rf?.freq??0),fB=K*gB*B-(rf?.freq??0);
 const A=[fieldA[0],fieldA[1],fieldA[2]+fA], bb=[fieldB[0],fieldB[1],fieldB[2]+fB];
 for(let a=0;a<3;a++){h=add(h,sc(E[0][a],A[a]));h=add(h,sc(E[1][a],bb[a]));}
 h=add(h,sc(dot,p.J??0));if((p.r??0)>0){const d=52.041*(gA*gB/(2.00231930436**2))/p.r**3;h=add(h,sc(dTensor(p.theta??0),d));}
 if(rf){const B1=rf.B1??0;h=add(h,sc(E[0][0],K*gA*B1/2));h=add(h,sc(E[1][0],K*gB*B1/2));}return h;}
function exactYield(H,k,rho=RHO0){if(!(k>0))throw Error('Uniform loss rate must be > 0');const ev=cEig(H),V=ev.v,Va=Q.adj(V),r=mul(mul(Va,rho),V),prod=Q.z(N);
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){const w=2*Math.PI*(ev.e[i]-ev.e[j]),den=k*k+w*w,ar=k*k/den,ai=-k*w/den,q=2*(i*N+j),x=r[q],y=r[q+1];prod[q]=ar*x-ai*y;prod[q+1]=ar*y+ai*x;}
 const integrated=mul(mul(V,prod),Va),S=Q.expect(PS,integrated);return {S,T:Q.expect(PT,integrated),integrated,ev};}
function timeSinglet(ev,t,rho=RHO0){let u=Q.propagator(ev,t);return Q.expect(PS,Q.evolve(rho,u));}
function rng(seed=1){let s=(seed>>>0)||12345;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
function normal(random){let u=Math.max(1e-12,random()),v=random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const isotopes={H1:{I:.5},H2:{I:1},N14:{I:1},N15:{I:.5},C13:{I:.5},C12:{I:0}};
function parseNuclei(input){const rows=input.trim().split(/[\n;]+/).map(x=>x.trim()).filter(Boolean);if(!rows.length)throw Error('Enter at least one nuclear coupling.');if(rows.length>12)throw Error('Maximum 12 nuclei in this teaching model.');return rows.map((line,i)=>{let x=line.split(/[,\s]+/),site=x[0].toUpperCase(),iso=x[1]?.toUpperCase(),A=Number(x[2]);if(x.length!==3||!['A','B'].includes(site)||!isotopes[iso]||!Number.isFinite(A)||Math.abs(A)>100)throw Error('Nucleus '+(i+1)+': use A,H1,12 or B,N14,8; |A| ≤ 100 MHz.');return {site:site==='A'?0:1,iso,A,I:isotopes[iso].I};});}
function bathDraws(nuclei,count,seed=2106,planar=false){if(!Number.isInteger(count)||count<1||count>256)throw Error('Use 1–256 nuclear-field samples.');const random=rng(seed);return Array.from({length:count},()=>{let v=[[0,0,0],[0,0,0]];for(const c of nuclei){let sd=c.A*Math.sqrt(c.I*(c.I+1)/3);for(let a=0;a<3;a++)if(!planar||a!==1)v[c.site][a]+=sd*normal(random);}return v;});}
function ensemble(p,draws,k=p.k??1){let v=0,v2=0;for(const [a,b] of draws){let y=exactYield(hamiltonian(p,a,b),k).S;v+=y;v2+=y*y;}let mean=v/draws.length,sd=Math.sqrt(Math.max(0,v2/draws.length-mean*mean));return {mean,se:draws.length>1?sd/Math.sqrt(draws.length-1):0};}
const halfAnti=(A,r)=>sc(add(mul(A,r),mul(r,A)),-.5);
const HFC_L=E.flat(), D_OP=dTensor(0);
function diss(L,r){return add(mul(mul(L,r),L),halfAnti(mul(L,L),r));}
function generator(H,p){const ks=p.ks??1, kt=p.kt??1, kbet=p.kbet??0,kesc=p.kesc??0,kD=p.kD??0,kHFC=p.kHFC??0;const sp=ks+kbet;
 const opsHF=HFC_L.map(x=>x),D=sc(dTensor(p.theta??0),1); // fixed orientation operator, dimensionless
 return rho=>{
  let C=add(mul(H,rho),sc(mul(rho,H),-1)),out=new Float64Array(C.length);for(let j=0;j<C.length;j+=2){out[j]=2*Math.PI*C[j+1];out[j+1]=-2*Math.PI*C[j];}
  out=add(out,sc(halfAnti(PS,rho),sp));out=add(out,sc(halfAnti(PT,rho),kt));out=add(out,sc(rho,-kesc));
  if(kD)out=add(out,sc(diss(D,rho),kD));if(kHFC)for(const L of opsHF)out=add(out,sc(diss(L,rho),kHFC/3));
  return out;};}
function liouvillian(gen){const dim=16,L=new Float64Array(2*dim*dim);for(let col=0;col<dim;col++){let basis=zero();basis[2*col]=1;let out=gen(basis);for(let row=0;row<dim;row++){let q=2*(row*dim+col);L[q]=-out[2*row];L[q+1]=-out[2*row+1];}}return L;}
function solve(M,bb){const n=bb.length/2,A=Float64Array.from(M),b=Float64Array.from(bb);const magnitude=(u,v)=>u*u+v*v;
 for(let k=0;k<n;k++){let pivot=k,best=0;for(let r=k;r<n;r++){let q=2*(r*n+k),v=magnitude(A[q],A[q+1]);if(v>best){best=v;pivot=r;}}
  if(best<1e-22)throw Error('Kinetic Liouvillian is singular. Add a nonzero escape or triplet-loss rate.');
  if(pivot!==k){for(let j=0;j<n;j++){let a=2*(k*n+j),c=2*(pivot*n+j);[A[a],A[c]]=[A[c],A[a]];[A[a+1],A[c+1]]=[A[c+1],A[a+1]];}let a=2*k,c=2*pivot;[b[a],b[c]]=[b[c],b[a]];[b[a+1],b[c+1]]=[b[c+1],b[a+1]];}
  const idx=2*(k*n+k),pr=A[idx],pi=A[idx+1],den=pr*pr+pi*pi;
  for(let r=k+1;r<n;r++){let q=2*(r*n+k),re=(A[q]*pr+A[q+1]*pi)/den,im=(A[q+1]*pr-A[q]*pi)/den;A[q]=0;A[q+1]=0;
   for(let c=k+1;c<n;c++){let row=2*(r*n+c),lead=2*(k*n+c),ar=A[lead],ai=A[lead+1];A[row]-=re*ar-im*ai;A[row+1]-=re*ai+im*ar;}
   let o=2*r,k2=2*k,ar=b[k2],ai=b[k2+1];b[o]-=re*ar-im*ai;b[o+1]-=re*ai+im*ar;}}
 const x=new Float64Array(2*n);for(let i=n-1;i>=0;i--){let re=b[2*i],im=b[2*i+1];for(let j=i+1;j<n;j++){let q=2*(i*n+j),a=A[q],bb=A[q+1],v=x[2*j],w=x[2*j+1];re-=a*v-bb*w;im-=a*w+bb*v;}let q=2*(i*n+i),a=A[q],bb=A[q+1],den=a*a+bb*bb;x[2*i]=(re*a+im*bb)/den;x[2*i+1]=(im*a-re*bb)/den;}return x;}
function kinetics(H,p){if(!(p.ks+p.kt+p.kbet+p.kesc>0))throw Error('At least one product or escape channel must be enabled.');const gen=generator(H,p),v=solve(liouvillian(gen),RHO0),x=Float64Array.from(v),out={S:p.ks*Q.expect(PS,x),BET:p.kbet*Q.expect(PS,x),T:p.kt*Q.expect(PT,x),escape:p.kesc*tr(x)};out.total=out.S+out.BET+out.T+out.escape;return out;}
function timeKinetics(H,p,duration=2,points=101){const gen=generator(H,p),initial=Float64Array.from(RHO0),ev=cEig(H),span=ev.e[N-1]-ev.e[0],rate=Math.max(p.ks+p.kbet,p.kt,p.kesc,p.kD,p.kHFC),dtMax=1/Math.max(12*span,10*rate,25),base=Math.ceil(duration/dtMax),sub=Math.ceil(base/(points-1));if(sub*(points-1)>16000)throw Error('Time trace too oscillatory: lower B, shorten duration or decrease couplings.');
 const dt=duration/((points-1)*sub), t=[],ps=[],pt=[],surv=[],product=[],r=initial;let curr=r,total=0;
 const deriv=x=>gen(x), step=x=>{let a=deriv(x),b=deriv(add(x,sc(a,dt/2))),c=deriv(add(x,sc(b,dt/2))),d=deriv(add(x,sc(c,dt)));return add(x,sc(add(add(a,sc(add(b,c),2)),d),dt/6));};
 for(let i=0;i<points;i++){t.push(i*duration/(points-1));ps.push(Q.expect(PS,curr));pt.push(Q.expect(PT,curr));surv.push(tr(curr));product.push(total);if(i!==points-1){for(let j=0;j<sub;j++){let previous=1-tr(curr);curr=step(curr);total+=Math.max(0,(1-tr(curr))-previous);}}}
 return {t,ps,pt,surv,product,steps:sub*(points-1)};}
function odmr(p,freq,B1,samples){let on=0,off=0;for(const [a,b] of samples){const h0=hamiltonian(p,[0,0,a[2]],[0,0,b[2]],{freq,B1:0});const h1=hamiltonian(p,[0,0,a[2]],[0,0,b[2]],{freq,B1});const yy=kinetics(h1,p),base=kinetics(h0,p);on+=yy.S+yy.BET;off+=base.S+base.BET;}return {on:on/samples.length,off:off/samples.length};}
root.QRPAdvanced={K,PS,PT,E,dTensor,hamiltonian,cEig,exactYield,timeSinglet,parseNuclei,bathDraws,ensemble,generator,liouvillian,solve,kinetics,timeKinetics,odmr,isotopes};
})(typeof window==='undefined'?globalThis:window);
