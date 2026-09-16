import { INITIAL_EXPERIENCES } from './InitialExperiences';
import { normalizeCharacter } from './CharacterData';
import {
  normalizeExperiences,
  normalizePlannedExperiences
} from './DataUtils';
import {
  normalizeLearningData,
  recordActionResult
} from './EmotionLearning';

export const SNAPSHOT_KEY = '@today_how_was_it_snapshot_v8';

export const LEGACY_KEYS = [
  '@today_how_was_it_character_v7',
  '@today_how_was_it_experiences_v7',
  '@today_how_was_it_planned_v7',
  '@today_how_was_it_emotion_learning_v1'
];

export function normalizeSnapshot(raw) {
  if (
    !raw ||
    typeof raw !== 'object' ||
    raw.version !== 8 ||
    !Array.isArray(raw.experiences) ||
    !Array.isArray(raw.plannedExperiences)
  )
    throw new Error(
      '저장 형식을 확인할 수 없어요. 기존 데이터는 변경하지 않았어요.'
    );

  const character = normalizeCharacter(raw.character);

  if (raw.character && !character)
    throw new Error('캐릭터 데이터를 읽을 수 없어요.');

  return {
    version: 8,
    character,
    experiences: normalizeExperiences(raw.experiences),
    plannedExperiences: normalizePlannedExperiences(
      raw.plannedExperiences
    ),
    emotionLearning: normalizeLearningData(raw.emotionLearning)
  };
}

export async function loadSnapshot(storage) {
  const current = await storage.getItem(SNAPSHOT_KEY);

  if (current !== null)
    return normalizeSnapshot(JSON.parse(current));

  const saved = await Promise.all(
    LEGACY_KEYS.map(k => storage.getItem(k))
  );

  const parsed = saved.map(v =>
    v === null ? null : JSON.parse(v)
  );

  if (parsed[1] !== null && !Array.isArray(parsed[1]))
    throw new Error('기존 경험 데이터가 배열이 아니에요.');

  if (parsed[2] !== null && !Array.isArray(parsed[2]))
    throw new Error('기존 예정 경험을 읽을 수 없어요.');

  const next = normalizeSnapshot({
    version: 8,
    character: parsed[0],
    experiences:
      parsed[1] === null ? INITIAL_EXPERIENCES : parsed[1],
    plannedExperiences: parsed[2] || [],
    emotionLearning: parsed[3]
  });

  await storage.setItem(SNAPSHOT_KEY, JSON.stringify(next));

  return next;
}

export function addRecord(snapshot, experience, feedback) {
  if (
    snapshot.experiences.some(
      x => String(x.id) === String(experience.id)
    )
  )
    return snapshot;

  const source = experience.sourceExperienceId;

  return {
    ...snapshot,

    experiences: normalizeExperiences([
      experience,
      ...snapshot.experiences
    ]),

    plannedExperiences:
      source == null
        ? snapshot.plannedExperiences
        : snapshot.plannedExperiences.filter(
            x => String(x.sourceId) !== String(source)
          ),

    emotionLearning: feedback
      ? recordActionResult(snapshot.emotionLearning, feedback)
      : snapshot.emotionLearning
  };
}

export function createCommitQueue(storage, initial, onUpdate) {
  let latest = initial,
    tail = Promise.resolve();

  return mutate => {
    const operation = tail.then(async () => {
      const next = normalizeSnapshot(mutate(latest));

      await storage.setItem(SNAPSHOT_KEY, JSON.stringify(next));

      latest = next;
      onUpdate(next);

      return next;
    });

    tail = operation.catch(() => {});

    return operation;
  };
}