// Read-only snapshots. Only public protocol fields are retained; no node configuration.
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
function select(value, keys) {
  if (!value || typeof value !== 'object') return value ?? null;
  return Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));
}
function safeRpc(method, body) {
  if (body.error) return {error:select(body.error,['code','message'])};
  if (method === 'eth_getTransactionByHash' && body.result) {
    const t=body.result;
    const out=select(t,['hash','status','type','from_address','to_address','value','value_credited','created_at','result_name','triggered_by','triggered_transactions']);
    for (const key of ['leader_receipt','validators']) {
      const receipts=t.consensus_data?.[key];
      const rows=Array.isArray(receipts)?receipts:receipts?[receipts]:[];
      out[key]=rows.map(row=>select(row,['mode','execution_result','result','calldata','eq_outputs','vote','address','validator_address']));
    }
    return {result:out};
  }
  if (method === 'eth_getTransactionReceipt') return {result:select(body.result,['transactionHash','blockHash','blockNumber','status','from','to','contractAddress','gasUsed'])};
  if (typeof body.result === 'string' || body.result === null) return {result:body.result};
  return {result:select(body.result,['data','status'])};
}
async function read(method,params) {
  try {
    const response=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
    return response.ok ? safeRpc(method,await response.json()) : {error:`HTTP ${response.status}`};
  } catch(e) {return {error:String(e.message || e)};}
}
async function view(method,args,variant) {
  const data=abi.calldata.encode(abi.calldata.makeCalldataObject(method,args,undefined));
  const encoded=abi.transactions.serialize([data,false]);
  const params=[{type:'read',to:contract,from:'0x'+'0'.repeat(40),data:encoded,status:variant}];
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
  certification:'UNVERIFIED_SANITIZED_SNAPSHOT',
  limitations:['Read snapshots may span blocks. Verify finality and transaction linkage manually.',
    'A missing field or RPC error is not a passing test.',
    'Model failures and disagreement cannot be forced by this collector.'],
  chain_id:await read('eth_chainId',[]),views:[]
};
for(const variant of ['finalized']) {
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
await writeFile(file,JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v instanceof Map?Object.fromEntries(v):v,2)+'\n');
console.log(`Saved sanitized evidence: ${file}. Inspect errors, source, finality, consensus and before/after views.`);
