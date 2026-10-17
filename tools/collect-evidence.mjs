// Read-only snapshots. Raw RPC errors and finality are preserved, never converted to PASS.
import { abi } from 'genlayer-js';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const [contract, respondent, grievanceId, txHash] = process.argv.slice(2);
const wallet=/^0x[0-9a-fA-F]{40}$/;
if (!wallet.test(contract || '') || !wallet.test(respondent || '') ||
    !/^[0-9a-fA-F]{64}$/.test(grievanceId || '') || (txHash && !/^0x[0-9a-fA-F]{64}$/.test(txHash))) {
  console.error('Usage: node tools/collect-evidence.mjs CONTRACT RESPONDENT GRIEVANCE_ID [TX_HASH]');
  process.exit(2);
}
const rpc=process.env.RPC_URL || 'https://studio.genlayer.com/api';
async function read(method,params) {
  try {
    const response=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
    return response.ok ? await response.json() : {error:`HTTP ${response.status}`};
  } catch(e) {return {error:String(e.message || e)};}
}
async function view(method,args,variant) {
  const data=abi.calldata.encode(abi.calldata.makeCalldataObject(method,args,undefined));
  const encoded=abi.transactions.serialize([data,false]);
  const params=[{type:'read',to:contract,from:'0x'+'0'.repeat(40),data:encoded,transaction_hash_variant:variant}];
  const raw=await read('gen_call',params);
  let decoded=null;
  try {
    const result=raw.result;
    if(result?.status?.code) throw new Error(result.status.message || 'gen_call failed');
    const hex=typeof result==='string' ? result : result?.data;
    if(typeof hex==='string') decoded=abi.calldata.decode(Buffer.from(hex.replace(/^0x/,''),'hex'));
  } catch(e) { decoded={decode_error:String(e.message || e)}; }
  return {method,args,variant,request:{method:'gen_call',params},raw,decoded};
}
const report={
  recorded_at:new Date().toISOString(),source_commit:process.env.SOURCE_COMMIT || null,
  contract,respondent,grievance_id:grievanceId,transaction_hash:txHash || null,
  certification:'UNVERIFIED_RAW_SNAPSHOT',
  limitations:['Read snapshots may span blocks. Verify finality and transaction linkage manually.',
    'A missing field or RPC error is not a passing test.',
    'Model failures and disagreement cannot be forced by this collector.'],
  chain_id:await read('eth_chainId',[]),views:[]
};
for(const variant of ['latest-final','latest-nonfinal']) {
  for(const [method,args] of [['get_limits',[]],['get_grievance',[grievanceId]],['get_standing',[respondent]]]) {
    report.views.push(await view(method,args,variant));
  }
}
if(txHash) {
  report.transaction=await read('eth_getTransactionByHash',[txHash]);
  report.receipt=await read('eth_getTransactionReceipt',[txHash]);
}
const dir=resolve('docs/evidence/v2');await mkdir(dir,{recursive:true});
const file=resolve(dir,`snapshot-${Date.now()}.json`);
await writeFile(file,JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(`Saved raw evidence: ${file}. Inspect errors, source, finality, consensus and before/after views.`);
