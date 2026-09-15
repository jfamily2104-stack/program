# Korean emotion and activity recognition v4

Both Explore and Record use `analyzeEmotion` from `EmotionAlgorithm.js`.
The engine runs locally without API keys, external requests, or a model download.
This is a curated, deterministic language engine, not a general Korean morphological
analyzer or a newly trained language model.

## Changes

- `EmotionText.js` normalizes Unicode, spaces, a small explicit typo list, and
  common inflection families (e.g. 슬퍼/슬픈/슬픔, 외로워/외로운/외로움).
- `EmotionLanguage.js` supplements all 35 emotion groups and 10 activity categories
  with vocabulary, idioms, and common activity conjugations.
- Emotions, needs, states and intent share phrase matching and polarity checks.
  Negation, some double negatives, contrast, explicit present/past markers,
  other-person attribution and hypothetical clauses are treated separately.
- Repeated identical clauses are deduplicated; overlapping phrases within a group
  are counted once. Longer phrases get a small specificity weight.
- Worry about a future event remains a present emotion. Wanting to meet somebody
  alone is not evidence of loneliness. Activities alone do not establish emotion.
- `activityMentions` retains `completed`, `planned`, `mentioned`, `avoided`,
  `hypothetical` and `reported` statuses. The compatible `activities` field excludes
  avoided, hypothetical and reported mentions. EmotionInsight displays the statuses.
- Self-selected feelings and valid follow-up choices retain precedence.
- App imports match this repository's flat file structure. `EmotionText.js` is now
  a standard JavaScript module; the old extensionless file forwards to it.

## Verification

Run `npm test` using Node.js with VM modules support (tested on Node 24).
The tests load the real algorithm, vocabulary, data utilities and learning modules;
there are no mocked emotion scores. They cover inflections, idioms, typos, negation,
multiple clauses, chronology, third-person attribution, action status, neutral noun
collisions, explicit needs, follow-up, manual corrections and bounded input.

The examples are regression tests, not a representative accuracy benchmark.
Sarcasm, unseen slang, ambiguous subjects, quoted speech and complicated long-distance
negation can still be missed. Activity status is a linguistic estimate, not proof that
an activity occurred. Confidence is a heuristic evidence score, not a probability.
Unknown inputs continue to offer a follow-up or manual choice.

To extend coverage, add an observed failure as a test first. Add precise phrases or
an inflection family with negative controls; avoid short unrestricted substrings.
No user text is sent to a server or silently used for model training.

## Device checks still needed

Use the updated project in Expo Go and verify Explore/Record with:
`슬펐습니다`, `기진맥진해`, `실패할까 봐 걱정돼`, and
`운동은 안 하고 공부했어`. Check displayed emotion candidates, activity labels,
follow-up choices and saved records. This update was tested in Node, not on a device.
