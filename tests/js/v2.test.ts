import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerBlock,fileBlock,REVERTS} from '../../src/lib/rules.ts';
import {answerVerified} from '../../src/lib/verify.ts';
import {classifyTransaction,revertReasonFrom} from '../../src/lib/receipt.ts';
import {calldataBytes} from '../../src/lib/calldata.ts';
import type {Grievance} from '../../src/lib/types.ts';
const A='0x'+'a'.repeat(40),B='0x'+'b'.repeat(40);
const g:Grievance={grievance_id:'a'.repeat(64),complainant:A,respondent:B,complaint:'A fictional claim',state:'OPEN',attempts:0,attempts_left:3,max_attempts:3,answers:[]};

test('UTF-8 budget stops multibyte overflow, not merely character overflow',()=>{
  assert.equal(answerBlock(g,B,'é'.repeat(80),254),null);
  assert.equal(answerBlock(g,B,'é'.repeat(81),256),REVERTS.answerTooLong);
  assert.equal(answerBlock(g,B,'x'.repeat(161),255),REVERTS.answerTooLong);
  assert.equal(fileBlock({me:A,respondent:B,complaint:'é'.repeat(61),exists:false,openWithRespondent:false,bytes:202}),REVERTS.complaintTooLong);
  assert.equal(calldataBytes('answer',[g.grievance_id,'é'.repeat(80)]),254);
});

test('inconclusive rollback is readable and is not a successful semantic answer',()=>{
  assert.equal(revertReasonFrom({stderr:REVERTS.inconclusive}),REVERTS.inconclusive);
  const before={g,standing:{wallet:B,resolved_by_owning:0,closed_unanswered:0}};
  assert.equal(answerVerified(before,before,'retryable response').ok,false);
  assert.equal(answerVerified(before,{...before,g:{...g,answers:[{index:1,text:'x',outcome:'INCONCLUSIVE'}]}},'x').ok,false);
});

test('a disputed response closure is confirmed without adding to aggregates',()=>{
  const before={g:{...g,dispute:'FACTS' as const,excluded_from_activity:true},standing:{wallet:B,resolved_by_owning:0,closed_unanswered:0}};
  const after={...before,g:{...before.g,state:'RESOLVED',answers:[{index:1,text:'My response',outcome:'OWNS_IT'}]}};
  assert.equal(answerVerified(before,after,'My response').ok,true);
  assert.equal(answerVerified(before,{...after,standing:{...after.standing,resolved_by_owning:1}},'My response').ok,false);
});

test('leader output without applied consensus remains pending, including errors',()=>{
  for(const result of ['SUCCESS','ERROR']) {
    const consensus_data={leader_receipt:{mode:'leader',execution_result:result,result:REVERTS.inconclusive}};
    for(const status of [undefined,'PROPOSING','REVEALING']) assert.equal(classifyTransaction({status,consensus_data}).kind,'pending');
    assert.equal(classifyTransaction({status:'FINALIZED',consensus_data}).kind,result==='SUCCESS'?'success':'error');
  }
});
