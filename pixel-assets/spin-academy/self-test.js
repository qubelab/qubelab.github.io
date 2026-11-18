/* Run with node pixel-assets/spin-academy/self-test.js */
require('./physics.js');
const Q=globalThis.QPhysics, assert=require('node:assert/strict');
const near=(x,y,t=1e-9)=>assert.ok(Math.abs(x-y)<t,`${x} != ${y}`);
for (const g of ['X','Y','Z','H','S','T','√X','CNOT','CZ','SWAP','√SWAP','iSWAP']) {
 const u=Q.gate(g,0,2), p=Q.mul(u,Q.adj(u)), id=Q.eye(4);p.forEach((x,i)=>near(x,id[i]));
}
let bell=Q.evolve(Q.evolve(Q.pure(2),Q.gate('H',0,2)),Q.gate('CNOT',0,2));near(Q.tr(bell),1);near(Q.expect(bell,bell),1);near(bell[0],.5);near(bell[30],.5);Q.bloch(bell,0,2).forEach(x=>near(x,0));
let e=Q.triplet(1200,150,2,0,0);[-800,250,550].forEach((x,i)=>near(e[i],x));
let p=Q.polarization(.5,42.577,9.4,298);near(p,Math.tanh(6.62607015e-34*42.577e6*9.4/(2*1.380649e-23*298)),1e-12);near(Q.dipolar(.35,2,2.00231930436,2.00231930436,Math.PI/2).d,6.505125);
let r=Q.relax(Q.evolve(Q.thermal(2),Q.local(Q.rotation(0,Math.PI/2),0,2)),2,10000,20,10);near(Q.tr(r),1);Q.bloch(r,0,2).forEach((x,i)=>near(x,[0,0,.1][i]));
let h=Q.hamiltonian(2,[10,20],[]),ev=Q.eig(h);[-15,-5,5,15].forEach((v,i)=>near(ev.e[i],v));
console.log('PASS: unitary gates, Bell state, triplet ZFS, thermal polarization, dipolar constant, relaxation, uncoupled Hamiltonian.');
// Extended QA: eigenpair residuals, exact frequency limits, relaxation and phase.
let seed=157;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32)*2-1;
const maxerr=(a,b)=>Math.max(...a.map((x,i)=>Math.abs(x-b[i])));
for(const n of [2,3,4,6,8,16])for(let j=0;j<12;j++){
 let h=Q.z(n);for(let a=0;a<n;a++)for(let b=a;b<n;b++)h[2*(a*n+b)]=h[2*(b*n+a)]=100*rnd();
 const e=Q.eig(h),d=Q.z(n);for(let a=0;a<n;a++)d[2*(a*n+a)]=e.e[a];
 assert.ok(maxerr(Q.mul(h,e.v),Q.mul(e.v,d))<1e-7,'eigen residual');
 assert.ok(maxerr(Q.mul(Q.adj(e.v),e.v),Q.eye(n))<1e-9,'orthogonality');
 const u=Q.propagator(e,.318);assert.ok(maxerr(Q.mul(u,Q.adj(u)),Q.eye(n))<1e-9,'time evolution unitarity');
}
let r0=Q.evolve(Q.pure(1),Q.rotation(1,Math.PI/2)),rr=Q.relax(r0,1,3,5,4,.1);near(Q.bloch(rr,0,1)[0],Math.exp(-3/4));near(Q.bloch(rr,0,1)[2],.1*(1-Math.exp(-3/5)));near(Q.tr(rr),1);
// Hahn echo refocuses static offset when J=0, with ideal instantaneous pulses.
let q0=Q.evolve(Q.pure(1),Q.rotation(1,Math.PI/2)),U=Q.propagator(Q.eig(Q.hamiltonian(1,[1.234],[])),.731);let echo=Q.evolve(Q.evolve(Q.evolve(q0,U),Q.rotation(0,Math.PI)),U);near(Q.bloch(echo,0,1)[0],1);near(Q.bloch(echo,0,1)[1],0);
// SWAP identities, both control directions, negative gamma, zero field.
for(const g of ['SWAP','√SWAP','iSWAP']){let u=Q.gate(g,0,2);assert.ok(maxerr(Q.mul(u,Q.adj(u)),Q.eye(4))<1e-9);}
let sq=Q.gate('√SWAP',0,2);assert.ok(maxerr(Q.mul(sq,sq),Q.gate('SWAP',0,2))<1e-9);
let c=Q.evolve(Q.evolve(Q.pure(2),Q.gate('X',1,2)),Q.gate('CNOT',1,2));near(c[30],1);
near(Q.polarization(2.5,-5.772,0,298),0);near(Q.polarization(1,-42.577,100,.01),-1,1e-6);
const ds=Q.dipolar(0,2,2.00231930436,2.00231930436,0);[-ds.d/2,-ds.d/2,0,ds.d].forEach((v,i)=>near(ds.ev.e[i],v));
const dm=Q.dipolar(0,2,2.00231930436,2.00231930436,1.13);ds.ev.e.forEach((v,i)=>near(dm.ev.e[i],v));
// NMR: spin raising matrix transition frequencies in the uncoupled limit.
const he=Q.eig(Q.hamiltonian(2,[11,23],[])); const so=Q.ops(2);const mt=Q.transitions(he,[Q.add(so[0][0],so[1][0]),Q.add(so[0][1],so[1][1])]);assert.deepEqual([...new Set(mt.map(t=>t.f))].sort((a,b)=>a-b),[11,23]);
// Spin-1 commutator [Sx,Sy] = i Sz.
let [sx,sy,sz]=Q.spin(1),comm=Q.add(Q.mul(sx,sy),Q.scale(Q.mul(sy,sx),-1));const iz=sz.map((_,i)=>i%2?sz[i-1]:-sz[i+1]);assert.ok(maxerr(comm,iz)<1e-9);
console.log('PASS: 72 randomized eigensystems (dimensions 2–16); propagators; exact T1/T2; Hahn echo; SWAP and reverse CNOT; signed polarization; dipolar rotation invariance; uncoupled NMR; spin commutator.');
