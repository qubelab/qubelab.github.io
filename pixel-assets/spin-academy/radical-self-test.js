/* Run: node pixel-assets/spin-academy/radical-self-test.js */
require('./physics.js'); require('./radical-physics.js');
const Q=globalThis.QPhysics,R=globalThis.QRadical,assert=require('node:assert/strict');
let count=0; const near=(a,b,msg,tol=1e-8)=>{assert.ok(Number.isFinite(a)&&Math.abs(a-b)<tol,`${msg}: ${a} != ${b}`);count++;};
const p={iso:'none',initial:'S',site:0,B:0,gA:2.0023,gB:2.0023,Axy:0,Az:0,J:0,r:0,theta:0,k:1};
let M=R.model(p);near(Q.tr(M.rho),1,'trace');near(Q.expect(M.PS,M.rho),1,'singlet initial');near(R.yields(M).S,1,'uncoupled yield');near(R.yields(M).T,0,'uncoupled triplet yield');
let out=R.sequence(M,[{delay:.4},{site:0,axis:2,angle:180}]);near(out.S,1-Math.exp(-.4),'pre-pulse singlet products');near(out.T,Math.exp(-.4),'post-pulse triplet products');
let V=R.model({...p,B:5,gA:2.003,gB:2.001,k:.4});let dw=2*Math.PI*13.99624555*5*.002;near(R.yields(V).S,.5*(1+.4**2/(.4**2+dw**2)),'delta-g analytic');near(Q.expect(V.PS,R.evolve(V,V.rho,.25)),Math.cos(dw*.25/2)**2,'delta-g dynamics');
let J=R.model({...p,J:4});near(J.ev.e[0],-3,'exchange S');J.ev.e.slice(1).forEach(v=>near(v,1,'exchange T'));near(Q.tr(R.reduced(M,M.rho)),1,'reduced trace');near(Q.tr(Q.mul(R.reduced(M,M.rho),R.reduced(M,M.rho))),1,'pure electronic singlet');
for(let iso of Object.keys(R.isotopes)){for(let initial of ['S','T0','T+','T−','T','mixed']){let m=R.model({...p,iso,initial,B:2,Axy:8,Az:15,J:3,r:2,theta:42,k:.7});let y=R.yields(m);near(Q.tr(m.rho),1,'normalized initial');near(Q.tr(Q.mul(m.PS,m.PT)),0,'orthogonal projectors');near(Q.tr(y.product),1,'product trace');near(y.S+y.T,1,'product yields sum');assert.ok(y.S>=-1e-9&&y.S<=1+1e-9);let t=.2,r=R.evolve(m,m.rho,t);near(Q.tr(r),1,'unitary trace');near([m.PS,m.P0,m.Pp,m.Pm].reduce((s,a)=>s+Q.expect(a,r),0),1,'populations sum');near(Q.tr(R.integrated(m,m.rho,t)),1-Math.exp(-.7*t),'finite integration');near(R.sequence(m,[{delay:t}]).S,y.S,'unchanged free sequence');near(Q.tr(R.reduced(m,r)),1,'reduced trace');if(m.iso.I){let rr=R.pulse(m,r,2,0,Math.PI);near(Q.tr(rr),1,'nuclear pulse trace');near(Q.expect(m.nu[2],rr),-Q.expect(m.nu[2],r),'nuclear x inversion');}}}
// Compare analytical integral with direct quadrature for a genuinely coupled system.
M=R.model({...p,iso:'H1',B:1,Axy:1,Az:2,J:.5,r:3,theta:42,k:4});let s=0,dt=.001;for(let i=0;i<=4000;i++){let t=i*dt;s+=(i===0||i===4000?.5:1)*4*Math.exp(-4*t)*Q.expect(M.PS,R.evolve(M,M.rho,t))*dt;}near(s,R.yields(M).S,'direct quadrature',3e-6);
let sp=R.spectrum(M,0,1),sp2=R.spectrum(M,.5,1);sp.y.forEach((v,i)=>near(sp2.y[i],v*Math.exp(-2),'EPR survival amplitude'));
console.log(`PASS: ${count} numerical assertions`);
