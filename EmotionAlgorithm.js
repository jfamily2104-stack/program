import {
  EMOTION_GROUPS,
  NEED_NAMES,
  ACTIVITY_RULES
} from './EmotionData';

import {
  clamp
} from './DataUtils';

import {
  personalizeActions
} from './EmotionLearning';
import { emotionClauses, scoreEmotionKeywords, normalizeEmotionText, keywordMatches } from './EmotionText';
import { EMOTION_VOCABULARY, NEED_VOCABULARY, extendedWords, recognizeActivities } from './EmotionLanguage';

export {
  DEFAULT_LEARNING_DATA,
  normalizeLearningData,
  recordActionResult,
  getCharacterMemoryMessage
} from './EmotionLearning';

export {
  EMOTION_GROUPS
} from './EmotionData';

const compact = normalizeEmotionText;

const option = (
  id,
  label,
  emotions,
  needs = {}
) => ({
  id,
  label,
  emotions,
  needs
});

export const UNKNOWN_FOLLOW_UP = {
  question:
    '지금 상태가 아래 중 어느 쪽에 조금 더 가까워요?',

  description:
    '가장 가까운 느낌을 골라주세요. 어떤 선택지도 맞지 않으면 문장을 바꿔 적어도 괜찮아요.',

  options: [
    option(
      'unknown_low',
      '기운이 없고 아무것도 하기 싫어',
      {
        tired: 1,
        overload: 0.55
      },
      {
        rest: 1
      }
    ),
    option(
      'unknown_heavy',
      '마음이 무겁고 속상해',
      {
        sadness: 1,
        frustration: 0.35
      },
      {
        comfort: 1
      }
    ),

    option(
      'unknown_worried',
      '걱정되고 불안한 느낌이야',
      {
        anxiety: 1,
        confusion: 0.3
      },
      {
        calm: 0.5,
        organize: 0.6
      }
    ),

    option(
      'unknown_connection',
      '누군가를 만나거나 이야기하고 싶어',
      {
        loneliness: 1
      },
      {
        connection: 1
      }
    ),

    option(
      'unknown_irritated',
      '답답하고 짜증나거나 거슬려',
      {
        frustration: 1,
        irritation: 0.5
      },
      {
        release: 1
      }
    ),

    option(
      'unknown_good',
      '편안하거나 괜찮아',
      {
        calm: 1,
        contentment: 0.6
      },
      {
        calm: 0.8
      }
    ),

    option(
      'unknown_mixed',
      '여러 감정이 섞여 설명하기 어려워',
      {
        confusion: 1,
        overload: 0.3
      },
      {
        organize: 0.8
      }
    )
  ]
};

const FOLLOW_UPS = {
  boredom: {
    question:
      '심심한 이유는 어떤 쪽에 가까워요?',

    options: [
      option(
        'bored_change',
        '새로운 걸 하고 싶어',
        {
          boredom: 0.5,
          excitement: 1
        },
        {
          new: 1
        }
      ),

      option(
        'bored_people',
        '누군가랑 같이 있고 싶어',
        {
          loneliness: 1,
          boredom: 0.3
        },
        {
          connection: 1
        }
      ),

      option(
        'bored_rest',
        '아무것도 하기 싫고 쉬고 싶어',
        {
          tired: 1,
          overload: 0.6
        },
        {
          rest: 1
        }
      ),

      option(
        'bored_alone',
        '혼자 조용히 뭔가 하고 싶어',
        {
          calm: 1,
          boredom: 0.4
        },
        {
          alone: 1,
          new: 0.3
        }
      )
    ]
  },

  frustration: {
    question:
      '답답한 이유가 어떤 쪽에 가까워요?',

    options: [
      option(
        'frustration_work',
        '일이 뜻대로 안 돼서',
        {
          frustration: 1,
          overload: 0.4
        },
        {
          organize: 0.8
        }
      ),

      option(
        'frustration_people',
        '사람 때문에',
        {
          frustration: 1,
          sadness: 0.5
        },
        {
          release: 1
        }
      ),

      option(
        'frustration_tired',
        '너무 지쳐서',
        {
          tired: 1,
          overload: 0.5
        },
        {
          rest: 1
        }
      ),

      option(
        'frustration_change',
        '환경을 바꾸고 싶어',
        {
          frustration: 0.7,
          boredom: 0.5
        },
        {
          change: 1
        }
      )
    ]
  },

  overload: {
    question:
      '지금 가장 힘든 건 어떤 쪽이에요?',

    options: [
      option(
        'overload_work',
        '해야 할 일이 너무 많아',
        {
          overload: 1
        },
        {
          organize: 1,
          rest: 0.4
        }
      ),

      option(
        'overload_thought',
        '생각이 너무 많아',
        {
          overload: 0.7,
          confusion: 1
        },
        {
          organize: 1
        }
      ),

      option(
        'overload_energy',
        '아무것도 할 힘이 없어',
        {
          tired: 1,
          overload: 0.5
        },
        {
          rest: 1
        }
      ),

      option(
        'overload_emotion',
        '감정적으로 너무 벅차',
        {
          overload: 1,
          sadness: 0.5
        },
        {
          comfort: 1
        }
      )
    ]
  },

  loneliness: {
    question:
      '외로움은 어떤 방식으로 느껴져요?',

    options: [
      option(
        'lonely_talk',
        '누군가와 이야기하고 싶어',
        {
          loneliness: 1
        },
        {
          connection: 1
        }
      ),

      option(
        'lonely_understood',
        '곁에 사람이 있어도 이해받지 못한 느낌이야',
        {
          loneliness: 1,
          sadness: 0.5
        },
        {
          comfort: 1,
          connection: 0.6
        }
      ),

      option(
        'lonely_specific',
        '특정한 사람이 보고 싶어',
        {
          nostalgia: 1,
          loneliness: 0.6
        },
        {
          connection: 1
        }
      ),

      option(
        'lonely_but_alone',
        '외롭지만 지금은 혼자 있고 싶어',
        {
          loneliness: 1
        },
        {
          alone: 1,
          comfort: 0.6
        }
      )
    ]
  },

  anxiety: {
    question:
      '무엇이 가장 걱정되나요?',

    options: [
      option(
        'fear_future',
        '앞으로 어떻게 될지 모르겠어',
        {
          anxiety: 1,
          confusion: 0.4
        },
        {
          organize: 1
        }
      ),

      option(
        'fear_failure',
        '실패하거나 실망시킬까 봐 무서워',
        {
          anxiety: 0.8,
          insecurity: 1
        },
        {
          confidence: 1
        }
      ),

      option(
        'fear_alone',
        '혼자 감당해야 할까 봐 두려워',
        {
          anxiety: 0.8,
          loneliness: 1
        },
        {
          connection: 1
        }
      ),

      option(
        'fear_body',
        '몸이 먼저 긴장하고 굳는 느낌이야',
        {
          anxiety: 1
        },
        {
          calm: 1,
          rest: 0.4
        }
      )
    ]
  },

  confusion: {
    question:
      '지금 헷갈리는 이유는 어떤 쪽에 가까워요?',

    options: [
      option(
        'confusion_choice',
        '뭘 선택해야 할지 모르겠어',
        {
          confusion: 1
        },
        {
          organize: 1
        }
      ),

      option(
        'confusion_toomuch',
        '생각할 게 너무 많아',
        {
          overload: 1,
          confusion: 0.5
        },
        {
          organize: 0.8,
          rest: 0.5
        }
      ),

      option(
        'confusion_emotion',
        '내 감정 자체를 모르겠어',
        {
          confusion: 1
        },
        {
          comfort: 0.7
        }
      )
    ]
  },

  headache: {
    question:
      '몸의 불편함과 마음의 부담 중 어떤 쪽에 가까워요?',

    options: [
      option(
        'headache_physical',
        '몸이 피곤하고 지친 느낌이야',
        {
          tired: 1
        },
        {
          rest: 1
        }
      ),

      option(
        'headache_thought',
        '생각이 많아 머리가 복잡해',
        {
          overload: 1,
          confusion: 0.4
        },
        {
          organize: 1
        }
      ),

      option(
        'headache_stress',
        '스트레스를 느끼고 있어',
        {
          frustration: 1
        },
        {
          release: 0.8,
          rest: 0.5
        }
      ),

      option(
        'headache_unknown',
        '잘 모르겠어',
        {
          confusion: 1
        },
        {
          rest: 0.6
        }
      )
    ]
  }
};

const BEHIND_FOLLOW_UP = {
  question:
    '뒤처진 것처럼 느껴질 때 무엇이 가장 크게 다가와요?',

  options: [
    option(
      'behind_alone',
      '나만 무리에서 빠진 것 같고 외로워',
      {
        loneliness: 1
      },
      {
        connection: 1
      }
    ),

    option(
      'behind_afraid',
      '계속 늦어질까 봐 무서워',
      {
        anxiety: 1,
        insecurity: 0.6
      },
      {
        confidence: 0.8
      }
    ),

    option(
      'behind_pressure',
      '남들처럼 해야 한다는 압박이 커',
      {
        overload: 1,
        anxiety: 0.5
      },
      {
        rest: 0.5,
        organize: 0.7
      }
    ),

    option(
      'behind_direction',
      '어디로 가야 할지 모르겠어',
      {
        confusion: 1,
        insecurity: 0.5
      },
      {
        organize: 1
      }
    )
  ]
};

const needPatterns = {
  rest: [
    '쉬고 싶',
    '쉬어야',
    '자고 싶',
    '누워 있고 싶',
    '아무것도 안 하고',
    '그냥 쉬'
  ],

  alone: [
    '혼자 있고 싶',
    '혼자만',
    '사람 만나기 싫',
    '연락하기 싫'
  ],

  connection: [
    '사람 만나고 싶',
    '친구 만나고 싶',
    '대화하고 싶',
    '연락하고 싶',
    '누구 만나고 싶',
    '같이 있고 싶'
  ],

  change: [
    '기분 전환',
    '바꾸고 싶',
    '변화가 필요',
    '다른 걸',
    '색다른'
  ],

  new: [
    '새로운',
    '처음',
    '해보고 싶',
    '가보고 싶',
    '배워보고 싶'
  ],

  release: [
    '풀고 싶',
    '스트레스',
    '답답',
    '화가',
    '짜증',
    '털어놓'
  ],

  organize: [
    '정리',
    '생각이 많',
    '복잡',
    '계획'
  ],

  recognition: [
    '인정받고 싶',
    '칭찬받고 싶',
    '알아줬으면'
  ],

  comfort: [
    '위로받고 싶',
    '위로가 필요',
    '괜찮다고 말해'
  ]
};

const allNeedPatterns = { ...needPatterns };
for (const id of Object.keys(NEED_VOCABULARY)) {
  allNeedPatterns[id] = extendedWords(NEED_VOCABULARY, id, needPatterns[id]);
}

const stateRules = [
  {
    id: 'headache',
    name: '몸의 불편함',
    emoji: '🩹',
    patterns: [
      '속이 안 좋',
      '속이 불편',
      '메스꺼',
      '울렁',
      '토할 것 같',
      '배가 아',
      '배 아',
      '몸이 안 좋',
      '컨디션이 안 좋',
      '아파',
      '아픈',
      '아프',
      '두통',
      '머리 아',
      '머리가 아',
      '어지러',
      '현기증'
    ]
  },

  {
    id: 'mentalOverload',
    name: '생각 과부하',
    emoji: '🧠',
    patterns: [
      '생각이 너무 많',
      '머리가 복잡',
      '해야 할 게 너무 많'
    ]
  },

  {
    id: 'lowEnergy',
    name: '에너지 저하',
    emoji: '🔋',
    patterns: [
      '기운이 없어',
      '힘이 없어',
      '에너지가 없어',
      '축 처져'
    ]
  },

  {
    id: 'indecision',
    name: '결정하기 어려움',
    emoji: '🤔',
    patterns: [
      '뭘 해야 할지 모르',
      '뭐할지 모르',
      '어디서부터 해야'
    ]
  },

  {
    id: 'socialNeed',
    name: '연결되고 싶은 상태',
    emoji: '🫂',
    patterns:
      allNeedPatterns.connection
  },

  {
    id: 'socialAvoidance',
    name: '혼자 있고 싶은 상태',
    emoji: '🌙',
    patterns:
      allNeedPatterns.alone
  }
];

// Share normalization and polarity between emotions, needs, states and intent.
export function splitClauses(input) {
  return emotionClauses(input).map(c => c.text);
}
function matches(text, phrases) {
  return keywordMatches({ text: compact(text), weight: 1 }, phrases).length > 0;
}

function deriveNeeds(
  scores,
  explicit = {}
) {
  const values = {
    ...explicit
  };

  Object.entries(
    scores
  ).forEach(
    ([id, score]) => {
      if (score <= 0)
        return;

      (
        EMOTION_GROUPS[id]
          ?.needs || []
      ).forEach(name => {
        const key =
          Object.keys(
            NEED_NAMES
          ).find(
            k =>
              NEED_NAMES[k] ===
              name
          );

        if (key)
          values[key] =
            (values[key] ||
              0) +
            Math.min(
              score * 0.18,
              0.7
            );
      });
    }
  );

  return Object.entries(
    values
  )
    .filter(
      ([id, n]) =>
        NEED_NAMES[id] &&
        n > 0.15
    )
    .sort(
      (a, b) =>
        b[1] -
        a[1]
    )
    .map(
      ([id, score]) => ({
        id,
        name:
          NEED_NAMES[id],
        score:
          Number(
            score.toFixed(
              3
            )
          )
      })
    );
}

function deriveBehavior(
  scores,
  needs,
  signals = {}
) {
  const n =
    Object.fromEntries(
      needs.map(x => [
        x.id,
        x.score
      ])
    );

  const emotionalBurden =
    Math.min(
      0.4,
      (
        (scores.tired ||
          0) +
        (scores.overload ||
          0) +
        (scores.distress ||
          0)
      ) * 0.08
    );
  const burden =
    clamp(
      0.3 +
        emotionalBurden +
        (signals.lowIntent
          ? 0.15
          : 0)
    );

  const willingness =
    clamp(
      0.5 +
        (signals.highIntent
          ? 0.2
          : 0) -
        (signals.lowIntent
          ? 0.3
          : 0)
    );

  const energy =
    clamp(
      0.7 -
        burden * 0.55 -
        (
          (scores.tired ||
            0) +
          (scores.overload ||
            0)
        ) *
          0.045
    );

  const restNeed =
    clamp(
      0.2 +
        (
          (scores.tired ||
            0) +
          (scores.overload ||
            0)
        ) *
          0.12 +
        (n.rest || 0) *
          0.25
    );

  let socialNeed =
    clamp(
      0.35 +
        (scores.loneliness ||
          0) *
          0.07 +
        (n.connection ||
          0) *
          0.3 -
        (n.alone || 0) *
          0.3
    );

  if (
    signals.alone &&
    !signals.connection
  )
    socialNeed =
      Math.min(
        socialNeed,
        0.2
      );

  if (
    signals.connection &&
    !signals.alone
  )
    socialNeed =
      Math.max(
        socialNeed,
        0.8
      );

  const noveltyNeed =
    clamp(
      0.25 +
        (
          (scores.boredom ||
            0) +
          (scores.excitement ||
            0)
        ) *
          0.1 +
        (n.new || 0) *
          0.2
    );

  return Object.fromEntries(
    Object.entries({
      burden,
      willingness,
      energy,
      restNeed,
      socialNeed,
      noveltyNeed
    }).map(([k, v]) => [
      k,
      Number(
        v.toFixed(3)
      )
    ])
  );
}

function buildResult(
  scores,
  explicitNeeds,
  signals,
  learning,
  meta = {},
  answered = false
) {
  const sorted =
    Object.entries(scores)
      .filter(
        ([id, n]) =>
          EMOTION_GROUPS[id] &&
          Number.isFinite(n) &&
          n > 0
      )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      );

  const total =
    sorted.reduce(
      (s, [, n]) =>
        s + n,
      0
    );

  const candidates =
    sorted.map(
      ([
        groupId,
        score
      ]) => ({
        groupId,

        name:
          EMOTION_GROUPS[
            groupId
          ].name,

        emoji:
          EMOTION_GROUPS[
            groupId
          ].emoji,

        score:
          Number(
            score.toFixed(
              3
            )
          ),

        ratio:
          score / total,
        intensity:
          clamp(
            0.3 +
              score *
                0.1
          )
      })
    );

  const primary =
    candidates[0];

  const unknown =
    !primary ||
    (!answered &&
      primary.score <
        0.95);

  const compound =
    !unknown &&
    candidates[1]
      ?.ratio >= 0.22 &&
    candidates[1]
      .score >=
      primary.score *
        0.48
      ? candidates[1]
      : null;

  const detectedNeeds =
    deriveNeeds(
      scores,
      explicitNeeds
    );

  const behavioral =
    deriveBehavior(
      scores,
      detectedNeeds,
      signals
    );
  const confidence =
    unknown
      ? Math.min(
          0.4,
          (primary?.ratio ||
            0) *
            0.4
        )
      : clamp(
          0.3 +
            Math.min(
              primary.score *
                0.06,
              0.3
            ) +
            primary.ratio *
              0.2 +
            (answered
              ? 0.1
              : 0),
          0,
          0.9
        );

  let actions =
    unknown
      ? [
          '지금 기분 한 단어로 적어보기',
          '아무것도 하지 않고 쉬기'
        ]
      : [
          ...new Set(
            candidates
              .slice(0, 3)
              .flatMap(
                x =>
                  EMOTION_GROUPS[
                    x.groupId
                  ].actions
              )
          )
        ];

  if (
    !unknown &&
    behavioral.restNeed >=
      0.7
  )
    actions = [
      '아무것도 하지 않고 쉬기',
      ...actions
    ];

  actions =
    personalizeActions(
      [
        ...new Set(actions)
      ],
      primary?.groupId,
      learning
    ).slice(0, 8);

  let followUp = null;

  if (
    !answered &&
    meta.input?.trim()
  ) {
    if (unknown)
      followUp =
        UNKNOWN_FOLLOW_UP;

    else if (
      meta.context?.some(
        x =>
          x.id ===
          'fallingBehind'
      )
    )
      followUp =
        BEHIND_FOLLOW_UP;

    else if (
      meta.states?.some(
        x =>
          x.id ===
          'headache'
      )
    )
      followUp =
        FOLLOW_UPS.headache;

    else if (
      compound ||
      confidence < 0.6
    )
      followUp =
        FOLLOW_UPS[
          primary.groupId
        ] || null;
  }

  const summary =
    unknown
      ? '아직 감정을 정하기 어려워요. 가까운 느낌을 골라줘도 좋아요.'
      : compound
      ? `${primary.emoji} ${primary.name}과 ${compound.name}이 함께 느껴지는 것 같아요.`
      : `${primary.emoji} 지금은 ${primary.name}에 가까워 보여요.`;

  return {
    ...meta,

    groupId:
      unknown
        ? 'unknown'
        : primary.groupId,

    name:
      unknown
        ? '아직 잘 모르겠어요'
        : primary.name,

    emoji:
      unknown
        ? '💭'
        : primary.emoji,

    confidence:
      Number(
        confidence.toFixed(
          3
        )
      ),

    candidates,

    compound,

    needs:
      unknown
        ? []
        : EMOTION_GROUPS[
            primary.groupId
          ].needs,

    detectedNeeds,
    behavioral,

    actions,

    followUp,

    unknown,

    summary,

    intensity:
      unknown
        ? 0
        : primary.intensity,

    explicitNeeds: {
      ...explicitNeeds
    },

    signals: {
      ...signals
    }
  };
}

export function analyzeEmotion(
  input = '',
  learning = null
) {
  const contextualClauses = emotionClauses(input);
  const clauses =
      contextualClauses.filter(c => c.weight === 1).map(c => c.text),
    scores = {},
    explicitNeeds = {};
  const evidence = [];

  const states =
    stateRules
      .filter(r =>
        clauses.some(c =>
          matches(
            c,
            r.patterns
          )
        )
      )
      .map(
        ({
          id,
          name,
          emoji
        }) => ({
          id,
          name,
          emoji
        })
      );

  contextualClauses.forEach(
    contextual => {
      const clause = contextual.text;
      Object.entries(
        EMOTION_GROUPS
      ).forEach(
        ([id, g]) => {
          const match = scoreEmotionKeywords(contextual, extendedWords(EMOTION_VOCABULARY, id, id === 'loneliness' ? g.keywords.filter(k => !/대화하고 싶|같이 있고 싶|연락하고 싶|보고 싶|누구랑 얘기/.test(k)) : g.keywords));
          scores[id] =
            (scores[id] ||
              0) + match.score;
          if (match.score > 0) evidence.push({ groupId: id, phrases: match.phrases,
            context: contextual.reason, score: Number(match.score.toFixed(3)) });
        }
      );

      if (contextual.weight !== 1) return;

      Object.entries(
        allNeedPatterns
      ).forEach(
        ([
          id,
          patterns
        ]) => {
          if (
            matches(
              clause,
              patterns
            )
          )
            explicitNeeds[id] =
              (explicitNeeds[id] ||
                0) +
              1.2;
        }
      );

      if (
        /(?:기분이?|몸이?|속이?|컨디션이?)안좋|별로야/.test(
          clause
        )
      ) {
        if (
          /몸|속|컨디션/.test(
            clause
          )
        )
          scores.tired =
            (scores.tired ||
              0) +
            1.5;
        else
          scores.frustration =
            (scores.frustration ||
              0) +
            1.2;
      }

      if (
        matches(
          clause,
          [
            '할 게 없어',
            '할 일이 없어',
            '뭐 하지',
            '시간이 안 가'
          ]
        )
      )
        scores.boredom =
          (scores.boredom ||
            0) +
          1.2;
    }
  );

  const effects = {
    headache: [
      'tired',
      1.4
    ],

    mentalOverload: [
      'overload',
      1.2
    ],

    lowEnergy: [
      'tired',
      1.5
    ],

    indecision: [
      'confusion',
      1.3
    ]
  };

  states.forEach(s => {
    if (effects[s.id]) {
      const [
        id,
        value
      ] = effects[s.id];

      scores[id] =
        (scores[id] ||
          0) +
        value;
    }
  });

  // 혼자 있고 싶은 욕구를 평온함으로,
  // 만남의 욕구를 외로움으로 단정하지 않습니다.
  const context = [];

  if (
    clauses.some(c => matches(c, ['뒤처', '뒤쳐', '뒤떨어', '나만 제자리', '소외', '나만 빠진']))
  ) {
    context.push({
      id:
        'fallingBehind',
      name:
        '뒤처진 느낌'
    });

    scores.insecurity =
      (scores.insecurity ||
        0) +
      1.2;

    scores.anxiety =
      (scores.anxiety ||
        0) +
      0.7;
  }

  const { activities, mentions: activityMentions } = recognizeActivities(input, ACTIVITY_RULES);

  const signals = {
    lowIntent:
      clauses.some(c =>
        matches(
          c,
          [
            '하기 싫',
            '귀찮',
            '못하겠',
            '할 힘이 없',
            '의욕이 없',
            '하고 싶지 않',
            '하고 싶지는 않',
            '하기가 싫',
            '의욕이 안 나'
          ]
        )
      ),

    highIntent:
      clauses.some(c =>
        matches(
          c,
          [
            '하고 싶',
            '해보고 싶',
            '가고 싶',
            '만나고 싶',
            '배우고 싶',
            '해볼래'
          ]
        )
      ),

    alone:
      Boolean(explicitNeeds.alone),

    connection:
      Boolean(explicitNeeds.connection)
  };

  return buildResult(
    scores,
    explicitNeeds,
    signals,
    learning,
    {
      input:
        String(
          input ?? ''
        ),

      states,

      activities,
      activityMentions,

      context,

      everydayLanguage: [...new Set(evidence.flatMap(e => e.phrases))],
      semanticSignals: activityMentions.map(m => ({ type: 'activity', ...m })),
      algorithmVersion: 4,
      evidence,
      contextNotes: [...new Set(contextualClauses.map(c => c.reason).filter(Boolean))],
      source: 'inferred'
    }
  );
}

// A self-reported emotion takes precedence; do not pretend this is model confidence.
export function selectEmotion(result, groupId, learning = null) {
  if (!EMOTION_GROUPS[groupId]) return result;
  return buildResult({ [groupId]: 3 }, {}, {}, learning, {
    ...result,
    source: 'self_reported',
    evidence: [],
    contextNotes: [],
    answeredOptionId: null
  }, true);
}

export function applyFollowUpAnswer(
  result,
  selected,
  learning = null
) {
  if (
    !result ||
    !selected
  )
    return result;

  const valid =
    result.followUp
      ?.options?.find(
        x =>
          x.id ===
          selected.id
      );

  if (!valid)
    return result;

  // 사용자가 고른 답을 우선하고,
  // 자동 추론 점수는 보조 근거로만 남깁니다.
  const scores = {};

  (
    result.candidates ||
    []
  ).forEach(x => {
    if (
      EMOTION_GROUPS[
        x.groupId
      ]
    )
      scores[
        x.groupId
      ] =
        clamp(
          x.ratio
        ) *
        0.6;
  });

  Object.entries(
    valid.emotions || {}
  ).forEach(
    ([id, n]) => {
      if (
        EMOTION_GROUPS[id] &&
        Number.isFinite(n)
      )
        scores[id] =
          (scores[id] ||
            0) +
          n * 3;
    }
  );

  if (
    !Object.keys(scores)
      .length
  )
    return result;

  const explicitNeeds = {
    ...result.explicitNeeds
  };

  Object.entries(
    valid.needs || {}
  ).forEach(
    ([id, n]) => {
      if (
        NEED_NAMES[id]
      )
        explicitNeeds[id] =
          Math.max(
            explicitNeeds[
              id
            ] || 0,
            n * 1.5
          );
    }
  );

  const signals = {
    ...result.signals
  };

  if (
    valid.needs?.alone
  ) {
    signals.alone = true;

    signals.connection =
      false;

    explicitNeeds.connection =
      0;
  }

  if (
    valid.needs
      ?.connection
  ) {
    signals.connection =
      true;
    signals.alone = false;

    explicitNeeds.alone =
      0;
  }

  if (
    valid.needs?.rest >=
    0.8
  ) {
    signals.lowIntent =
      true;

    signals.highIntent =
      false;
  }

  if (
    valid.needs?.new >=
    0.8
  ) {
    signals.highIntent =
      true;

    signals.lowIntent =
      false;
  }

  return buildResult(
    scores,
    explicitNeeds,
    signals,
    learning,
    {
      ...result,

      answeredOptionId:
        valid.id,
      source: 'follow_up'
    },
    true
  );
}
