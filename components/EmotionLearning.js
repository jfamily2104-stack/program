import { actionText, finiteNumber, clamp } from './DataUtils';

export const DEFAULT_LEARNING_DATA = Object.freeze({
  version: 2,
  actions: Object.freeze({}),
  interactions: Object.freeze([])
});

const isObject = x =>
  x !== null && typeof x === 'object' && !Array.isArray(x);

const safeKey = x =>
  typeof x === 'string' &&
  x &&
  !['__proto__', 'prototype', 'constructor'].includes(x);

export function normalizeLearningData(data) {
  if (!isObject(data))
    return {
      version: 2,
      actions: {},
      interactions: []
    };

  const legacy =
    data.version === 1
      ? JSON.parse(JSON.stringify(data))
      : data.legacy;

  const actions = {};

  if (data.version === 2 && isObject(data.actions))
    Object.entries(data.actions).forEach(([emotion, values]) => {
      if (!safeKey(emotion) || !isObject(values)) return;

      actions[emotion] = {};

      Object.entries(values).forEach(([action, value]) => {
        if (!safeKey(action) || !isObject(value)) return;

        const count = Math.max(
          0,
          Math.floor(finiteNumber(value.tries) ?? 0)
        );

        const changeCount = clamp(
          Math.floor(finiteNumber(value.changeCount) ?? 0),
          0,
          count
        );

        actions[emotion][action] = {
          tries: count,

          improved: clamp(
            Math.floor(finiteNumber(value.improved) ?? 0),
            0,
            changeCount
          ),

          changeCount,

          totalChange: clamp(
            finiteNumber(value.totalChange) ?? 0,
            -changeCount,
            changeCount
          ),

          ratingCount: clamp(
            Math.floor(finiteNumber(value.ratingCount) ?? 0),
            0,
            count
          ),

          totalRating: Math.max(
            0,
            finiteNumber(value.totalRating) ?? 0
          )
        };
      });
    });

  return {
    version: 2,

    actions,

    interactions:
      data.version === 2 && Array.isArray(data.interactions)
        ? data.interactions
            .filter(isObject)
            .map(x => ({
              ...x
            }))
            .slice(0, 300)
        : [],

    ...(legacy
      ? {
          legacy: JSON.parse(JSON.stringify(legacy))
        }
      : {})
  };
}

export function recordActionResult(learning, feedback = {}) {
  const next = normalizeLearningData(learning);

  if (feedback.type === 'selected' || feedback.executed !== true)
    return next;

  const emotionId = feedback.emotionId || feedback.emotion;
  const action = actionText(feedback.action);
  const eventId = feedback.eventId;

  if (
    !safeKey(emotionId) ||
    emotionId === 'unknown' ||
    !safeKey(action) ||
    typeof eventId !== 'string' ||
    !eventId
  )
    return next;

  if (next.interactions.some(x => x.id === eventId)) return next;

  const before = finiteNumber(feedback.before),
    after = finiteNumber(feedback.after),
    rating = finiteNumber(feedback.satisfaction);

  const hasChange =
    before !== null &&
    after !== null &&
    before >= 0 &&
    before <= 1 &&
    after >= 0 &&
    after <= 1;

  const hasRating =
    rating !== null && rating >= 1 && rating <= 5;

  if (!hasChange && !hasRating) return next;

  const item = next.actions[emotionId]?.[action] || {
    tries: 0,
    improved: 0,
    changeCount: 0,
    totalChange: 0,
    ratingCount: 0,
    totalRating: 0
  };

  const change = hasChange ? after - before : null;

  next.actions[emotionId] = {
    ...next.actions[emotionId],

    [action]: {
      ...item,

      tries: item.tries + 1,

      improved:
        item.improved +
        (change !== null && change > 0.05 ? 1 : 0),

      changeCount:
        item.changeCount + (hasChange ? 1 : 0),

      totalChange:
        item.totalChange + (change ?? 0),

      ratingCount:
        item.ratingCount + (hasRating ? 1 : 0),

      totalRating:
        item.totalRating + (hasRating ? rating : 0)
    }
  };

  next.interactions = [
    {
      id: eventId,
      emotionId,
      action,
      sourceExperienceId: feedback.sourceExperienceId ?? null,
      before: hasChange ? before : null,
      after: hasChange ? after : null,
      change,
      satisfaction: hasRating ? rating : null,
      createdAt: feedback.createdAt ?? Date.now()
    },
    ...next.interactions
  ].slice(0, 300);

  return next;
}

export function getPersonalActionScore(
  learning,
  emotionId,
  action
) {
  const row =
    learning?.version === 2
      ? learning.actions?.[emotionId]?.[actionText(action)]
      : null;

  if (!row?.tries) return 0;

  const rating = row.ratingCount
    ? (row.totalRating / row.ratingCount - 3) / 2
    : 0;

  const change = row.changeCount
    ? row.totalChange / row.changeCount
    : 0;

  return clamp(
    (rating * 0.45 + change * 0.55) *
      (row.tries / (row.tries + 3)),
    -1,
    1
  );
}

export function personalizeActions(actions, emotionId, learning) {
  return [...actions].sort(
    (a, b) =>
      getPersonalActionScore(learning, emotionId, b) -
      getPersonalActionScore(learning, emotionId, a)
  );
}

export function getCharacterMemoryMessage(learning, emotionId) {
  if (learning?.version !== 2 || !emotionId) return null;

  const rows = Object.entries(
    learning.actions?.[emotionId] || {}
  );

  const changed = rows
    .filter(
      ([, v]) =>
        v.changeCount >= 2 &&
        v.improved / v.changeCount >= 0.6 &&
        v.totalChange / v.changeCount > 0.03
    )
    .sort(
      (a, b) =>
        b[1].totalChange / b[1].changeCount -
        a[1].totalChange / a[1].changeCount
    );

  if (changed[0])
    return `지난 기록에서는 "${changed[0][0]}"을 해본 뒤 기분이 나아졌다고 남겼어. 오늘도 해볼까?`;

  const rated = rows
    .filter(
      ([, v]) =>
        v.ratingCount >= 2 &&
        v.totalRating / v.ratingCount >= 4
    )
    .sort(
      (a, b) =>
        b[1].totalRating / b[1].ratingCount -
        a[1].totalRating / a[1].ratingCount
    );

  return rated[0]
    ? `"${rated[0][0]}"을 해봤을 때 만족도가 높았어. 기억해두고 있어.`
    : null;
}