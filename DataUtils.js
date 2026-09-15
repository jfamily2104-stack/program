import { normalizeCharacter } from './CharacterData';

export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

export function finiteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && !value.trim())
  )
    return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export function coordinateOf(value) {
  const latitude = finiteNumber(value?.latitude),
    longitude = finiteNumber(value?.longitude);

  return latitude !== null &&
    longitude !== null &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? {
        latitude,
        longitude
      }
    : null;
}

export function normalizeExperiences(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();

  return value
    .filter(x => {
      if (
        !x ||
        x.id === null ||
        x.id === undefined ||
        typeof x.title !== 'string' ||
        !x.title.trim() ||
        seen.has(String(x.id))
      )
        return false;

      seen.add(String(x.id));
      return true;
    })
    .map(x => ({
      ...x,

      id: String(x.id),

      isExample:
        x.isExample === true ||
        (!x.userId &&
          /^exp(?:[1-9]|1[0-5])$/.test(String(x.id))),

      character: normalizeCharacter(x.character),

      location: coordinateOf(x.location)
        ? {
            ...x.location,
            ...coordinateOf(x.location)
          }
        : null,

      tags: Array.isArray(x.tags)
        ? x.tags.filter(t => typeof t === 'string')
        : [],

      media: Array.isArray(x.media) ? x.media : []
    }));
}

export function normalizePlannedExperiences(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();

  return value
    .filter(x => {
      if (
        !x ||
        x.sourceId === null ||
        x.sourceId === undefined ||
        typeof x.title !== 'string' ||
        seen.has(String(x.sourceId))
      )
        return false;

      seen.add(String(x.sourceId));
      return true;
    })
    .map(x => ({
      ...x,
      sourceId: String(x.sourceId),
      character: normalizeCharacter(x.character)
    }));
}

export function actionText(action) {
  if (typeof action === 'string') return action.trim();

  for (const key of ['text', 'label', 'title', 'name', 'id'])
    if (
      typeof action?.[key] === 'string' &&
      action[key].trim()
    )
      return action[key].trim();

  return '';
}

export function averageSatisfaction(items) {
  const values = items
    .map(x => finiteNumber(x.satisfaction))
    .filter(n => n !== null && n >= 1 && n <= 5);

  return values.length
    ? (
        values.reduce((a, b) => a + b, 0) / values.length
      ).toFixed(1)
    : '-';
}

export function selectedActionStats(items) {
  const counts = new Map();

  items.forEach(x => {
    const action = actionText(x.selectedAction);

    if (action && x.actionExecuted === true)
      counts.set(action, (counts.get(action) || 0) + 1);
  });

  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

export function locationLabel(item) {
  return (
    [
      item?.locationName || item?.location?.name,
      item?.locationAddress || item?.location?.address
    ]
      .filter(
        (v, i, a) =>
          typeof v === 'string' && v && a.indexOf(v) === i
      )
      .join(' · ') ||
    (coordinateOf(item?.location)
      ? '지도에 표시된 장소'
      : '장소 미지정')
  );
}

export function makeId() {
  return `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
