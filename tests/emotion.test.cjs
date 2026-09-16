const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ console });
const cache = new Map();
function load(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename);
  const m = new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { context, identifier: filename });
  cache.set(filename, m);
  return m;
}
let ready;
async function api() {
  if (!ready) ready = (async () => { const m = load(path.join(__dirname, '../components/EmotionAlgorithm.js')); await m.link((specifier, parent) => load(path.resolve(path.dirname(parent.identifier), specifier + (path.extname(specifier) ? '' : '.js')))); await m.evaluate(); return m.namespace; })();
  return ready;
}
const examples = [
  ['슬퍼요', 'sadness'], ['슬픔', 'sadness'], ['슬픈 하루', 'sadness'], ['슬펐습니다', 'sadness'],
  ['즐겁습니다', 'happy'], ['즐거웠어요', 'happy'], ['기쁩니다', 'happy'], ['기쁜 하루', 'happy'],
  ['외롭네요', 'loneliness'], ['외로웠습니다', 'loneliness'], ['외로운 밤', 'loneliness'], ['외로움', 'loneliness'],
  ['두렵습니다', 'anxiety'], ['두려웠다', 'anxiety'], ['무섭네요', 'anxiety'], ['무서운 마음', 'anxiety'],
  ['너무 지칩니다', 'tired'], ['지친 하루', 'tired'], ['지쳤습니다', 'tired'], ['졸립니다', 'tired'],
  ['부러운 마음', 'envy'], ['그리운 사람', 'nostalgia'], ['고마운 마음', 'gratitude'],
  ['혼란스러운 마음', 'confusion'], ['고통스럽습니다', 'distress'], ['자랑스러운 나', 'pride'],
  ['노심초사하고 있어', 'anxiety'], ['기진맥진한 상태야', 'tired'], ['회한이 남는다', 'regret'],
  ['의기소침해졌어', 'insecurity'], ['자괴감이 든다', 'shame'], ['비통한 마음', 'sadness'],
  ['홀가분하네', 'relief'], ['갈팡질팡하고 있어', 'confusion'], ['허무감이 들어', 'emptiness'],
  ['힘드러', 'tired'], ['외로와', 'loneliness'], ['설래', 'excitement'], ['우울햇어', 'sadness'],
  ['실패할까 봐 걱정돼', 'anxiety'], ['시험에 떨어지면 어쩌나 불안해', 'anxiety'],
];
for (const [input, expected] of examples) test(`emotion: ${input}`, async () => {
  const r = (await api()).analyzeEmotion(input);
  assert.equal(r.groupId, expected, JSON.stringify(r.candidates));
  assert.equal(r.algorithmVersion, 4);
});
for (const input of ['행복하지 않아', '행복하지는 않습니다', '행복하진 않아', '안 행복해', '슬프지 않아', '외롭지 않아요', '무료 배송', '수치가 10이다', '화가 직업', '영화가 시작됐어', '친구가 슬퍼요']) test(`not asserted: ${input}`, async () => {
  const r = (await api()).analyzeEmotion(input);
  assert(!r.candidates.some(c => ['happy', 'sadness', 'loneliness', 'anger', 'shame', 'boredom'].includes(c.groupId)), JSON.stringify(r.candidates));
});
const activityCases = [
  ['산책했어요', 'exercise', 'completed'], ['러닝하고 싶어', 'exercise', 'planned'],
  ['공원에서 걸었어요', 'exercise', 'completed'], ['책을 읽었어요', 'learning', 'completed'],
  ['친구를 만났어요', 'social', 'completed'], ['피아노를 연주했어요', 'creative', 'completed'],
  ['뜨개질을 했습니다', 'creative', 'completed'], ['명상하고 싶어요', 'rest', 'planned'],
  ['설거지했어요', 'work', 'completed'], ['밥을 먹었어요', 'food', 'completed'],
  ['드라마를 정주행했어', 'digital', 'completed'], ['쇼핑하고 싶지 않아', 'shopping', 'avoided'],
  ['운동하기 싫어', 'exercise', 'avoided'], ['운동하지 않았어', 'exercise', 'avoided'],
  ['안 산책했어', 'exercise', 'avoided'], ['친구가 수영했어', 'exercise', 'reported'],
];
for (const [input, id, status] of activityCases) test(`activity: ${input}`, async () => {
  const r = (await api()).analyzeEmotion(input);
  assert(r.activityMentions.some(m => m.id === id && m.status === status), JSON.stringify(r.activityMentions));
  if (['avoided', 'reported'].includes(status)) assert(!r.activities.some(a => a.id === id));
});
test('mixed emotions survive', async () => { const r=(await api()).analyzeEmotion('기쁘지만 불안해'); assert(r.candidates.some(c=>c.groupId==='happy')); assert(r.candidates.some(c=>c.groupId==='anxiety')); assert(r.compound); });
test('current feeling wins over past', async () => { assert.equal((await api()).analyzeEmotion('어제 슬펐지만 지금 기뻐').groupId,'happy'); });
test('explicit self overrides third-person clause', async () => { assert.equal((await api()).analyzeEmotion('친구가 슬프지만 나는 기뻐').groupId,'happy'); });
test('desire for company does not prove loneliness', async () => { const r=(await api()).analyzeEmotion('친구를 만나고 싶어'); assert(!r.candidates.some(c=>c.groupId==='loneliness')); assert(r.signals.connection); });
test('activity alone does not prove emotion', async () => { assert((await api()).analyzeEmotion('책을 읽었어요').unknown); });
test('user correction takes precedence', async () => {const a=await api(); const r=a.selectEmotion(a.analyzeEmotion('슬프다'), 'happy'); assert.equal(r.groupId,'happy'); assert.equal(r.source,'self_reported');});
test('follow-up answer is honored', async () => {const a=await api();const r=a.analyzeEmotion('잘 모르겠어');assert(r.followUp);const n=a.applyFollowUpAnswer(r,r.followUp.options[0]);assert.equal(n.source,'follow_up');assert(!n.unknown);});
test('input is bounded and stable', async () => {const a=await api();for(const input of [null,undefined,'','가'.repeat(20000)])assert(a.analyzeEmotion(input).unknown);});
for (const input of ['슬프지 않고 기뻐', '슬프지 않지만 기뻐', '친구가 나를 무시해서 서운해', '별로 안 슬퍼', '슬프지 않은 건 아니야']) test(`scope: ${input}`, async () => {
  const r=(await api()).analyzeEmotion(input);
  if(input.includes('기뻐')) assert.equal(r.groupId,'happy');
  else if(input.includes('서운')) assert(r.candidates.some(c=>['resentment','sadness'].includes(c.groupId)));
  else if(input.includes('아니야')) assert(r.candidates.some(c=>c.groupId==='sadness'));
  else assert(!r.candidates.some(c=>c.groupId==='sadness'));
});
for (const input of ['행복하고 싶어', '행복했으면 좋겠어', '행복하다면', '친구가 슬프고 외롭대']) test(`not current assertion: ${input}`, async () => { assert((await api()).analyzeEmotion(input).unknown); });
for (const [input,id] of [['걷습니다','exercise'], ['뛰었습니다','exercise'], ['걸으려고 해','exercise'], ['책을 읽습니다','learning'], ['쉬려고 해','rest'], ['커피를 마셨어','food'], ['사진을 촬영했어','creative'], ['삼림욕을 했어','nature']]) test(`additional action: ${input}`,async()=>{assert((await api()).analyzeEmotion(input).activities.some(a=>a.id===id));});
for (const input of ['운동은 안 했어', '운동을 못 했어', '산책하고 싶지는 않아', '산책하기는 싫어']) test(`avoided activity: ${input}`,async()=>{const r=(await api()).analyzeEmotion(input);assert(!r.activities.some(a=>a.id==='exercise'),JSON.stringify(r.activityMentions));});
test('opposite action choices in one sentence',async()=>{const r=(await api()).analyzeEmotion('운동은 안 하고 공부했어');assert(!r.activities.some(a=>a.id==='exercise'));assert(r.activityMentions.some(a=>a.id==='learning'&&a.status==='completed'));});
test('activity double negation is not avoidance',async()=>{assert((await api()).analyzeEmotion('운동하기 싫지는 않아').activities.some(a=>a.id==='exercise'));});
test('repeated text is not added independent evidence',async()=>{const a=await api();assert.equal(a.analyzeEmotion('행복해. 행복해. 행복해.').confidence,a.analyzeEmotion('행복해').confidence);});
test('denied need does not set social intent',async()=>{const r=(await api()).analyzeEmotion('친구를 만나고 싶지는 않아');assert(!r.signals.connection);assert(!r.signals.highIntent);});
test('direct need survives unknown emotion',async()=>{const r=(await api()).analyzeEmotion('그냥 쉬려고 해');assert(r.detectedNeeds.some(n=>n.id==='rest'));});
for(const input of ['무료쿠폰을 받았다','수치 해석 과제','사랑니 치료','안정제를 먹었다','새로운 책을 읽었어','반복문을 공부했어','사과를 먹었다'])test(`neutral literal: ${input}`,async()=>{assert((await api()).analyzeEmotion(input).unknown,JSON.stringify((await api()).analyzeEmotion(input).candidates));});

