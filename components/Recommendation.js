import {
  finiteNumber,
  clamp
} from './DataUtils';

import {
  getPersonalActionScore
} from './EmotionLearning';

const norm = v =>
  String(v ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');

const full = exp =>
  norm(
    `${exp.title || ''} ${exp.text || ''} ${(exp.tags || []).join(' ')}`
  );

export function getCostValue(cost) {
  const text = String(cost ?? '')
    .trim()
    .replace(/,/g, '');

  if (/^(무료|공짜)$/.test(text))
    return 0;

  if (
    !/^\d+(?:\.\d+)?\s*(?:만\s*)?원?$/.test(
      text
    )
  )
    return null;

  const n = Number(
    text.match(
      /^\d+(?:\.\d+)?/
    )[0]
  );

  return text.includes('만')
    ? n * 10000
    : n;
}

export function getTimeMinutes(time) {
  const text = String(time ?? '').trim();

  if (!text) return null;

  const hours = text.match(
      /(\d+(?:\.\d+)?)\s*시간/
    ),
    mins = text.match(
      /(\d+)\s*분/
    );

  if (!hours && !mins)
    return null;

  return (
    Number(hours?.[1] || 0) *
      60 +
    Number(mins?.[1] || 0) +
    (text.includes('반')
      ? 30
      : 0)
  );
}

export function getBurdenFromExperience(exp) {
  const minutes =
      getTimeMinutes(exp.time),
    cost =
      getCostValue(exp.cost);

  let burden = 0.3;

  if (minutes !== null) {
    if (minutes >= 180)
      burden += 0.25;
    else if (minutes >= 120)
      burden += 0.15;
    else if (minutes <= 45)
      burden -= 0.1;
  }

  if (cost !== null) {
    if (cost >= 30000)
      burden += 0.2;
    else if (cost >= 10000)
      burden += 0.1;
    else if (cost === 0)
      burden -= 0.08;
  }

  if (
    /복싱|헬스|달리|등산|축구/.test(
      full(exp)
    )
  )
    burden += 0.15;

  if (
    /혼자|집/.test(
      norm(exp.type)
    )
  )
    burden -= 0.04;

  return clamp(burden);
}

export function getSocialLevel(exp) {
  const t = norm(exp.type);

  return /혼자/.test(t)
    ? 0.1
    : /친구|연인|사람|모임|함께|그룹/.test(t)
    ? 0.8
    : 0.4;
}

export function getNoveltyLevel(exp) {
  const t = full(exp);

  return clamp(
    0.3 +
      (/새로운|처음|탐험|새로|낯선|즉흥/.test(t)
        ? 0.45
        : 0) +
      (/평소안|다른길/.test(t)
        ? 0.2
        : 0)
  );
}

export function getRestLevel(exp) {
  const t = full(exp);

  return clamp(
    0.2 +
      (/카페|산책|책|휴식|쉬/.test(t)
        ? 0.3
        : 0) +
      (/천천히|조용|힐링/.test(t)
        ? 0.25
        : 0) -
      (/복싱|달리|헬스/.test(t)
        ? 0.3
        : 0)
  );
}

export function getBehaviorMatch(
  analysis,
  exp
) {
  const b = analysis?.behavioral;

  if (!b) return 0.4;

  const target = clamp(
    (1 - b.burden) * 0.45 +
      b.energy * 0.25 +
      b.willingness * 0.15,
    0,
    0.8
  );

  const burden =
    getBurdenFromExperience(
      exp
    );

  return clamp(
    1 -
      Math.abs(
        burden - target
      ) -
      (burden > target
        ? 0.4 *
          (burden - target)
        : 0)
  );
}

export function calculateRecommendationScore(
  analysis,
  exp,
  learning = null
) {
  if (
    !analysis ||
    analysis.unknown ||
    !exp
  )
    return 0;

  const b =
    analysis.behavioral || {};

  const target =
    exp.beforeEmotionGroup ||
    exp.emotionGroup;

  const candidate =
    analysis.candidates?.find(
      x =>
        x.groupId === target
    );

  const emotion = clamp(
    (analysis.groupId === target
      ? 0.8
      : analysis.compound?.groupId === target
      ? 0.5
      : 0) +
      (candidate?.ratio || 0) *
        0.2
  );

  const needs =
    analysis.detectedNeeds || [];

  let weighted = 0,
    total = 0;

  needs.forEach(n => {
    const weight = Math.max(
      0,
      n.score || 0
    );

    let value = full(exp).includes(
      norm(n.name)
    )
      ? 0.8
      : 0.2;

    if (
      ['rest', 'recovery'].includes(
        n.id
      )
    )
      value = getRestLevel(exp);

    if (
      [
        'new',
        'change',
        'growth',
        'exploration'
      ].includes(n.id)
    )
      value =
        getNoveltyLevel(exp);

    if (
      [
        'connection',
        'relationship',
        'dialogue'
      ].includes(n.id)
    )
      value =
        getSocialLevel(exp);

    if (n.id === 'alone')
      value =
        1 -
        getSocialLevel(exp);

    weighted +=
      weight * value;

    total += weight;
  });

  const satisfaction =
    finiteNumber(
      exp.satisfaction
    );

  let score =
    emotion * 28 +
    (total
      ? weighted / total
      : 0.4) *
      22 +
    getBehaviorMatch(
      analysis,
      exp
    ) *
      18 +
    (1 -
      Math.abs(
        (b.socialNeed ?? 0.4) -
          getSocialLevel(exp)
      )) *
      8 +
    (1 -
      Math.abs(
        (b.noveltyNeed ?? 0.4) -
          getNoveltyLevel(exp)
      )) *
      7 +
    (1 -
      Math.abs(
        (b.restNeed ?? 0.4) -
          getRestLevel(exp)
      )) *
      7 +
    (satisfaction === null
      ? 0.4
      : clamp(
          satisfaction / 5
        )) *
      10;

  if (
    b.energy <= 0.3 &&
    getBurdenFromExperience(
      exp
    ) >= 0.7
  )
    score -= 12;

  if (
    b.socialNeed <= 0.25 &&
    getSocialLevel(exp) >=
      0.75
  )
    score -= 8;

  const personal =
    getPersonalActionScore(
      learning,
      analysis.groupId,
      exp.selectedAction ||
        exp.title
    );

  const records = (
    learning?.interactions ||
    []
  ).filter(
    x =>
      x.sourceExperienceId !=
        null &&
      String(
        x.sourceExperienceId
      ) === String(exp.id) &&
      x.emotionId ===
        analysis.groupId &&
      finiteNumber(
        x.satisfaction
      ) !== null
  );

  const sourceScore =
    records.length
      ? ((records.reduce(
          (s, x) =>
            s +
            x.satisfaction,
          0
        ) /
          records.length -
          3) /
          2) *
        (records.length /
          (records.length + 3))
      : 0;

  score +=
    clamp(
      personal + sourceScore,
      -1,
      1
    ) * 12;

  return Number(
    clamp(
      score,
      0,
      100
    ).toFixed(2)
  );
}

export function getRecommendationReason(
  analysis,
  exp
) {
  const b =
    analysis?.behavioral || {};

  if (
    b.restNeed >= 0.7 &&
    getRestLevel(exp) >= 0.6 &&
    getBurdenFromExperience(
      exp
    ) <= 0.4
  )
    return '회복을 원할 때 가볍게 시도할 만한 경험이에요.';

  if (
    b.socialNeed <= 0.3 &&
    getSocialLevel(exp) <= 0.25
  )
    return '혼자 할 수 있는 경험이에요.';

  if (
    b.socialNeed >= 0.7 &&
    getSocialLevel(exp) >= 0.65
  )
    return '누군가와 함께하고 싶은 마음을 반영했어요.';

  if (
    b.noveltyNeed >= 0.7 &&
    getNoveltyLevel(exp) >= 0.65
  )
    return '평소와 다른 작은 변화를 찾는 마음을 반영했어요.';

  if (
    (exp.beforeEmotionGroup ||
      exp.emotionGroup) ===
    analysis?.groupId
  )
    return '비슷한 감정이 기록된 경험이에요.';

  return '감정과 시간·비용·활동 성격을 함께 비교했어요.';
}