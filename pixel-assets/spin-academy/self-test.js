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
