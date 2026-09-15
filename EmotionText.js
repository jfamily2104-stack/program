// Deterministic Korean phrase analysis. Scores are evidence weights, not probabilities.
// Deliberately limited inflection families: never strip arbitrary Korean endings.
const FORMS = [
  [/즐거(?:워|웠|운|울|움)|즐겁/g, '즐겁'],
  [/외로(?:워|웠|운|울|움)|외롭/g, '외롭'],
  [/괴로(?:워|웠|운|울|움)|괴롭/g, '괴롭'],
  [/두려(?:워|웠|운|울|움)|두렵/g, '두렵'],
  [/무서(?:워|웠|운|울|움)|무섭/g, '무섭'],
  [/부러(?:워|웠|운|울|움)|부럽/g, '부럽'],
  [/그리(?:워|웠|운|울|움)|그립/g, '그립'],
  [/부끄러(?:워|웠|운|울|움)|부끄럽/g, '부끄럽'],
  [/자랑스러(?:워|웠|운|울|움)|자랑스럽/g, '자랑스럽'],
  [/혼란스러(?:워|웠|운|울|움)|혼란스럽/g, '혼란스럽'],
  [/고통스러(?:워|웠|운|울|움)|고통스럽/g, '고통스럽'],
  [/만족스러(?:워|웠|운|울|움)|만족스럽/g, '만족스럽'],
  [/경이로(?:워|웠|운|울|움)|경이롭/g, '경이롭'],
  [/신비로(?:워|웠|운|울|움)|신비롭/g, '신비롭'],
  [/서글(?:퍼|펐|픈|플|픔)|서글프/g, '서글프'],
  [/서러(?:워|웠|운|울|움)|서럽/g, '서럽'],
  [/슬(?:퍼|펐|픈|플|픔|픕)|슬프/g, '슬프'],
  [/지(?:쳐|쳤|친|칠|침|칩)|지치/g, '지치'],
  [/힘(?:들어|들었|든|들다|들고|들면|듦|들)|힘들/g, '힘들'],
  [/졸(?:려|렸|린|릴|림|립)|졸리/g, '졸리'],
  [/설(?:레어|렜|렌|렐|렘|레)|설레/g, '설레'],
  [/고마(?:워|웠|운|울|움)|고맙/g, '고맙'],
  [/거슬(?:려|렸|린|릴|림)|거슬리/g, '거슬리'],
  [/지겨(?:워|웠|운|울|움)|지겹/g, '지겹'],
  [/기뻐|기뻤|기쁜|기쁠|기쁨|기쁩|기쁘/g, '기쁘'],
  [/아파|아팠|아픈|아플|아픔|아프/g, '아프'],
];
export function normalizeEmotionText(value) {
  let text = String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  // Only high-confidence, common misspellings. No fuzzy substring matching.
  text = text.replace(/짜증낫/g, '짜증났').replace(/우울햇/g, '우울했')
    .replace(/행복햇/g, '행복했').replace(/불안햇/g, '불안했')
    .replace(/힘드러/g, '힘들어').replace(/외로와/g, '외로워')
    .replace(/설래/g, '설레').replace(/어떻하지/g, '어떡하지');
  for (const [pattern, replacement] of FORMS) text = text.replace(pattern, replacement);
  return text;
}

export function emotionClauses(input) {
  const source = String(input ?? '').slice(0, 4000);
  const hasPresent = /지금|이제|현재|오늘은/.test(source);
  // Split coordination too, so '슬프지 않고 기뻐' has independent polarity.
  const parts = source.replace(/(않|없|싫)고/g, '$1고|').split(/[.!?\n,;]+|그렇지만|하지만|그런데|그래도|그리고|반면|지만|는데|면서|\|/);
  let subject = false;
  const seen = new Set();
  return parts.map(raw => {
    const text = normalizeEmotionText(raw);
    if (/나는|내가|나도|나를|내마음|내기분|내말|저는|제가|저를/.test(text)) subject = false;
    else if (/^(?:친구|엄마|아빠|동생|언니|오빠|누나|형|그사람|걔|그녀)(?:가|이|는|은)/.test(text)) subject = true;
    // Worry about a hypothetical event is a current feeling, not hypothetical worry.
    const hypothetical = /(?:다면|라면|으면)/.test(text) && !/걱정|불안|두렵|무섭|초조/.test(text);
    const past = hasPresent && /어제|예전|아까|지난|그때/.test(text) && !/지금|이제|현재/.test(text);
    return { text, raw: raw.trim(), weight: subject ? 0 : hypothetical ? 0.3 : past ? 0.3 : 1,
      reason: subject ? '다른 사람의 상태' : hypothetical ? '가정·예상 표현' : past ? '과거의 상태' : null };
  }).filter(x => {
    const key = `${x.weight}:${x.text}`;
    if (!x.text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isNegated(text, index, phrase) {
  const before = text.slice(Math.max(0, index - 5), index);
  const after = text.slice(index + phrase.length, index + phrase.length + 22);
  const intrinsic = /없|싫|않|못|안좋|안생|안가|안풀|안돼/.test(phrase);
  const prefix = !intrinsic && /(?:안|못|전혀|별로|그다지)$/.test(before);
  const suffix = /^(?:(?:하|해|했|되|돼|지|진|지는|하지|하진|하지는|되지는|하다는|다는|한건|한게|은건|은게|은|는|다|고싶지|고싶지는|고싶진|고싶어하지|고싶어하진|고싶어하지는|이|가|스럽|스럽지|스럽지는))*?(?:않|아니|못)/.test(after);
  // '행복하지 않은 건 아니야' expresses weak positive evidence.
  const double = suffix && /않(?:은|다는)?(?:건|것은|게)?아니/.test(after);
  return double ? false : Boolean(prefix !== suffix);
}

export function keywordMatches(clause, keywords, includeNegated = false) {
  const spans = [];
  const phrases = [...new Set(keywords.map(normalizeEmotionText))].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    let start = 0;
    while (start < clause.text.length) {
      const index = clause.text.indexOf(phrase, start);
      if (index < 0) break;
      const end = index + phrase.length;
      start = end;
      const after = clause.text.slice(end);
      const before = clause.text.slice(Math.max(0, index - 3), index);
      if (phrase === '시기' && !/^(?:해|하|가나|심)/.test(after)) continue;
      if (phrase === '무료' && !/^(?:해|하|함)/.test(after)) continue;
      if (phrase === '화가' && !/^(?:나|났|치밀|솟|폭발)/.test(after)) continue;
      if (phrase === '기대' && /^(?:했|에못|가무너)/.test(after)) continue;
      if (phrase === '새로운') continue; // Novel objects are not themselves emotions.
      if (phrase === '반복' && /^문/.test(after)) continue;
      if (phrase === '수치' && !/^(?:심|스럽|스러)/.test(after)) continue;
      if (phrase === '안정' && /^(?:제|성|적수익)/.test(after)) continue;
      if (phrase === '사랑' && /^니/.test(after)) continue;
      if ((phrase === '좋아' || phrase === '좋다') && /^(?:하는|하던|하던것|하는것)/.test(after)) continue;
      if (phrase === '분하' && /홀가|충|구|십$/.test(before)) continue;
      const denied = isNegated(clause.text, index, phrase);
      if ((!denied || includeNegated) && !spans.some(s => index < s.end && end > s.start)) {
        const nearby = clause.text.slice(Math.max(0, index - 5), end + 4);
        const strength = /너무|정말|진짜|엄청|완전/.test(nearby) ? 1.3 : /조금|약간|살짝|좀/.test(nearby) ? 0.75 : 1;
        spans.push({ start: index, end, phrase, strength, negated: denied });
      }
    }
  }
  return [...new Map(spans.map(s => [s.phrase, s])).values()].slice(0, 3);
}
export function scoreEmotionKeywords(clause, keywords) {
  const matches = keywordMatches(clause, keywords);
  return { score: matches.reduce((sum, s) => sum + (1.5 + Math.min(s.phrase.length, 12) * 0.025) * s.strength * clause.weight * (/^(?:하|해|고)?(?:고)?싶|^(?:해|했|하)?으면좋겠/.test(clause.text.slice(s.end)) ? 0.3 : 1), 0),
    phrases: clause.weight > 0 ? matches.map(s => s.phrase) : [] };
}
