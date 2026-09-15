import React, { useMemo, useState } from "react";
import EmotionInsight from './EmotionInsight';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";

const EMOTION_META = {
  happy: { name: "기분 좋음", emoji: "😊" },
  excitement: { name: "설렘·호기심", emoji: "✨" },
  calm: { name: "편안함·평온", emoji: "🌿" },
  boredom: { name: "심심함·권태", emoji: "😐" },
  tired: { name: "피곤함·소진", emoji: "😮‍💨" },
  frustration: { name: "답답함·스트레스", emoji: "😣" },
  loneliness: { name: "외로움·연결 욕구", emoji: "🥺" },
  sadness: { name: "슬픔·속상함", emoji: "😢" },
  anxiety: { name: "불안·걱정", emoji: "😟" },
  overload: { name: "과부하·무기력", emoji: "🫠" },
  anger: { name: "분노·불쾌", emoji: "😡" },
};

const NEED_ALIASES = {
  rest: ["휴식", "회복", "부담 감소"],
  change: ["변화", "기분전환"],
  connection: ["연결", "대화", "관계"],
  alone: ["혼자만의 시간", "혼자"],
  new: ["새로움", "탐색", "성장"],
  release: ["해소", "거리두기"],
  organize: ["정리", "생각 정리"],
};

const QUICK_INPUTS = [
  "오늘 너무 지쳐서 쉬고 싶어",
  "매일 똑같아서 심심해",
  "혼자 있고 싶은데 조금 외로워",
  "새로운 걸 해보고 싶어",
  "기분 전환이 필요해",
];

const UNKNOWN_FOLLOW_UP_FALLBACK = {
  question: "지금 상태가 아래 중 어느 쪽에 조금 더 가까워요?",
  description: "정확한 감정 이름을 몰라도 괜찮아요. 가장 가까운 느낌을 골라주세요.",
  options: [
    { id: "unknown_low", label: "기운이 없고 아무것도 하기 싫어", emotions: { tired: 0.9, overload: 0.55 }, needs: { rest: 0.8 } },
    { id: "unknown_heavy", label: "마음이 무겁고 속상해", emotions: { sadness: 0.75, frustration: 0.35 }, needs: { comfort: 0.75 } },
    { id: "unknown_worried", label: "걱정되고 불안한 느낌이야", emotions: { anxiety: 0.9, confusion: 0.3 }, needs: { organize: 0.6 } },
    { id: "unknown_connection", label: "누군가를 만나거나 이야기하고 싶어", emotions: { loneliness: 0.85 }, needs: { connection: 0.85 } },
    { id: "unknown_irritated", label: "답답하고 짜증나거나 거슬려", emotions: { frustration: 0.85, anger: 0.35 }, needs: { release: 0.7 } },
    { id: "unknown_good", label: "나쁘진 않고 편안하거나 괜찮아", emotions: { calm: 0.75, happy: 0.2 }, needs: { rest: 0.3 } },
    { id: "unknown_mixed", label: "여러 감정이 섞여서 설명하기 어려워", emotions: { confusion: 0.7, overload: 0.35 }, needs: { organize: 0.55, comfort: 0.35 } },
  ],
};

function normalize(text = "") {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCharacterInfo(experience) {
  const character = experience?.character;

  if (!character) {
    return {
      emoji: "🙂",
      name: experience?.author || "누군가",
      accessory: "",
    };
  }

  return {
    emoji: character.emoji || "🙂",
    name: character.name || experience.author || "누군가",
    accessory:
      character.accessoryEmoji ||
      "",
  };
}

function getSatisfaction(exp) {
  const value = Number(exp?.satisfaction || 0);
  if (value >= 5) return "★★★★★";
  if (value >= 4) return "★★★★☆";
  if (value >= 3) return "★★★☆☆";
  if (value >= 2) return "★★☆☆☆";
  if (value >= 1) return "★☆☆☆☆";

  return "아직 평가 없음";
}

function getCostValue(cost = "") {
  const text = String(cost);

  if (text.includes("0원")) return 0;
  if (text.includes("무료")) return 0;

  const match = text.replace(/,/g, "").match(/(\d+)/);

  if (!match) return 5000;

  return Number(match[1]);
}

function getTimeMinutes(time = "") {
  const text = String(time);

  const hour = text.match(/(\d+)\s*시간/);
  const minute = text.match(/(\d+)\s*분/);

  let value = 0;

  if (hour) value += Number(hour[1]) * 60;
  if (minute) value += Number(minute[1]);

  if (value === 0) return 60;

  return value;
}

function getBurdenFromExperience(exp) {
  const minutes = getTimeMinutes(exp.time);
  const cost = getCostValue(exp.cost);
  let burden = 0.25;

  if (minutes >= 180) burden += 0.2;
  else if (minutes >= 120) burden += 0.12;
  else if (minutes <= 45) burden -= 0.08;

  if (cost >= 30000) burden += 0.18;
  else if (cost >= 10000) burden += 0.08;
  else if (cost === 0) burden -= 0.08;

  const type = normalize(exp.type);

  if (
    type.includes("혼자") ||
    type.includes("집")
  ) {
    burden -= 0.05;
  }

  return Math.max(0, Math.min(1, burden));
}

function getSocialLevel(exp) {
  const type = normalize(exp.type);

  if (
    type.includes("친구") ||
    type.includes("연인") ||
    type.includes("사람") ||
    type.includes("모임") ||
    type.includes("함께")
  ) {
    return 0.8;
  }

  if (
    type.includes("혼자") ||
    type.includes("나 혼자")
  ) {
    return 0.1;
  }
  return 0.4;
}

function getNoveltyLevel(exp) {
  const tags = Array.isArray(exp.tags)
    ? exp.tags.join(" ")
    : "";

  const text = normalize(
    `${exp.title || ""} ${exp.text || ""} ${tags}`
  );

  let score = 0.3;

  if (
    text.includes("새로운") ||
    text.includes("처음") ||
    text.includes("탐험") ||
    text.includes("새로")
  ) {
    score += 0.45;
  }

  if (
    text.includes("평소 안") ||
    text.includes("다른 길") ||
    text.includes("처음 가")
  ) {
    score += 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

function getRestLevel(exp) {
  const text = normalize(
    `${exp.title || ""} ${exp.text || ""} ${
      Array.isArray(exp.tags) ? exp.tags.join(" ") : ""
    }`
  );

  let score = 0.2;

  if (
    text.includes("카페") ||
    text.includes("산책") ||
    text.includes("책") ||
    text.includes("휴식") ||
    text.includes("쉬")
  ) {
    score += 0.3;
  }

  if (
    text.includes("천천히") ||
    text.includes("조용") ||
    text.includes("힐링")
  ) {
    score += 0.25;
  }

  return Math.max(0, Math.min(1, score));
}

function getEmotionMatch(analysis, experience) {
  if (!analysis || !experience) return 0;

  const target = experience.emotionGroup;

  if (!target) return 0.2;

  let score = 0;

  if (analysis.groupId === target) {
    score += 1;
  }

  if (analysis.compound?.groupId === target) {
    score += 0.65;
  }

  const candidate = analysis.candidates?.find(
    (item) => item.groupId === target
  );

  if (candidate) {
    score += candidate.ratio * 0.7;
  }

  /*
    경험의 mood와 사용자의 분석 결과도 비교
  */
  const mood = normalize(experience.mood);

  if (
    mood &&
    (
      normalize(analysis.name).includes(mood) ||
      mood.includes(normalize(analysis.name))
    )
  ) {
    score += 0.25;
  }

  return Math.min(1.5, score);
}

function getNeedMatch(analysis, experience) {
  if (!analysis?.detectedNeeds?.length) return 0;

  const text = normalize(
    `${experience.title || ""} ${experience.text || ""} ${
      Array.isArray(experience.tags)
        ? experience.tags.join(" ")
        : ""
    }`
  );

  let score = 0;

  analysis.detectedNeeds.forEach((need) => {
    const aliases = NEED_ALIASES[need.id] || [
      need.name,
    ];

    if (
      aliases.some((alias) =>
        text.includes(normalize(alias))
      )
    ) {
      score += 0.35;
    }

    /*
      욕구와 경험의 성격을 직접 연결
    */
    if (need.id === "rest") {
      score += getRestLevel(experience) * 0.5;
    }

    if (need.id === "new") {
      score += getNoveltyLevel(experience) * 0.5;
    }

    if (need.id === "connection") {
      score += getSocialLevel(experience) * 0.5;
    }

    if (need.id === "alone") {
      score += (1 - getSocialLevel(experience)) * 0.5;
    }

    if (need.id === "change") {
      score += getNoveltyLevel(experience) * 0.35;
    }
  });

  return Math.min(1.4, score);
}

function getBehaviorMatch(analysis, experience) {
  const behavior = analysis?.behavioral;

  if (!behavior) return 0.4;

  const burden = getBurdenFromExperience(experience);

  /*
    현재 부담이 높으면
    가벼운 경험을 강하게 우선
  */
  const burdenMatch =
    1 - Math.abs(
      burden - behavior.burden
    );

  let score = burdenMatch * 0.35;

  /*
    에너지가 낮을수록 짧고 쉬운 경험 선호
  */
  if (behavior.energy <= 0.35) {
    if (burden <= 0.35) score += 0.45;
    else if (burden >= 0.7) score -= 0.25;
  }

  /*
    에너지가 높으면 조금 더 적극적인 경험
  */
  if (behavior.energy >= 0.7) {
    if (burden >= 0.35) score += 0.2;
  }

  /*
    행동 의향이 낮으면
    진입장벽 낮은 경험 우선
  */
  if (behavior.willingness <= 0.35) {
    if (burden <= 0.3) score += 0.35;
  }

  return Math.max(-0.2, Math.min(1, score));
}

function getSocialMatch(analysis, experience) {
  const target = analysis?.behavioral?.socialNeed;

  if (typeof target !== "number") return 0.3;

  const social = getSocialLevel(experience);

  return 1 - Math.abs(target - social);
}

function getNoveltyMatch(analysis, experience) {
  const target = analysis?.behavioral?.noveltyNeed;

  if (typeof target !== "number") return 0.3;

  const novelty = getNoveltyLevel(experience);

  return 1 - Math.abs(target - novelty);
}

function getRestMatch(analysis, experience) {
  const target = analysis?.behavioral?.restNeed;

  if (typeof target !== "number") return 0.3;

  const rest = getRestLevel(experience);
  return 1 - Math.abs(target - rest);
}

function getSatisfactionScore(experience) {
  const value = Number(experience?.satisfaction || 0);

  if (value <= 0) return 0.25;

  return value / 5;
}

/* =========================================================
   핵심 추천 점수
========================================================= */

function calculateRecommendationScore(
  analysis,
  experience
) {
  if (!analysis || !experience) return 0;
  const emotion = getEmotionMatch(
    analysis,
    experience
  );

  const need = getNeedMatch(
    analysis,
    experience
  );

  const behavior = getBehaviorMatch(
    analysis,
    experience
  );

  const social = getSocialMatch(
    analysis,
    experience
  );

  const novelty = getNoveltyMatch(
    analysis,
    experience
  );

  const rest = getRestMatch(
    analysis,
    experience
  );

  const satisfaction =
    getSatisfactionScore(experience);

  /*
    가중치

    감정       28%
    욕구       22%
    행동상태   18%
    사회성      8%
    새로움      7%
    휴식        7%
    만족도     10%
  */

  let score =
    emotion * 28 +
    need * 22 +
    behavior * 18 +
    social * 8 +
    novelty * 7 +
    rest * 7 +
    satisfaction * 10;

  /*
    특수 상황 보정
  */

  if (
    analysis.behavioral?.energy <= 0.3 &&
    getBurdenFromExperience(experience) >= 0.7
  ) {
    score -= 12;
  }

  if (
    analysis.behavioral?.restNeed >= 0.75 &&
    getRestLevel(experience) >= 0.65
  ) {
    score += 8;
  }

  if (
    analysis.behavioral?.noveltyNeed >= 0.75 &&
    getNoveltyLevel(experience) >= 0.65
  ) {
    score += 8;
  }

  if (
    analysis.behavioral?.socialNeed >= 0.75 &&
    getSocialLevel(experience) >= 0.65
  ) {
    score += 7;
  }

  if (
    analysis.behavioral?.socialNeed <= 0.25 &&
    getSocialLevel(experience) >= 0.75
  ) {
    score -= 8;
  }

  /*
    "아무것도 하기 싫다" 같은 상태에서는
    매우 적극적인 경험의 점수를 낮춤
  */
  if (
    analysis.groupId === "overload" &&
    getBurdenFromExperience(experience) >= 0.6
  ) {
    score -= 10;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

function getRecommendationReason(
  analysis,
  experience,
  score
) {
  if (!analysis) {
    return "지금의 상태와 비슷한 사람이 해본 경험이에요.";
  }

  const behavior = analysis.behavioral || {};

  if (
    behavior.restNeed >= 0.75 &&
    getRestLevel(experience) >= 0.6
  ) {
    return "지금은 회복이 중요해서 부담이 적은 경험을 골랐어요.";
  }

  if (
    behavior.noveltyNeed >= 0.75 &&
    getNoveltyLevel(experience) >= 0.65
  ) {
    return "평소와 다른 작은 변화가 지금 상태와 잘 맞아요.";
  }

  if (
    behavior.socialNeed >= 0.7 &&
    getSocialLevel(experience) >= 0.65
  ) {
    return "누군가와 연결되고 싶은 마음에 잘 맞는 경험이에요.";
  }

  if (
    behavior.socialNeed <= 0.3 &&
    getSocialLevel(experience) <= 0.25
  ) {
    return "지금은 혼자 편하게 할 수 있는 경험을 우선했어요.";
  }

  if (
    experience.emotionGroup === analysis.groupId
  ) {
    return "지금 느끼는 감정과 비슷한 상태에서 나온 경험이에요.";
  }

  if (score >= 70) {
    return "현재 상태와 여러 조건이 고르게 잘 맞는 경험이에요.";
  }

  return "현재 상태에서 부담 없이 시도해볼 만한 경험이에요.";
}

/* =========================================================
   화면
========================================================= */

export default function ExploreScreen({
  character,
  experiences = [],
  plannedExperiences = [],
  onSaveExperience,
  analyzeEmotion,
  applyFollowUpAnswer,
  onNavigate,
}) {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const plannedIds = useMemo(
    () =>
      new Set(
        plannedExperiences.map(
          (item) =>
            item.sourceId || item.id
        )
      ),
    [plannedExperiences]
  );
  const search = (value = input) => {
    if (!value.trim()) return;

    const result = analyzeEmotion
      ? analyzeEmotion(value)
      : null;

    const normalizedResult =
      result?.unknown &&
      (!result.followUp ||
        !Array.isArray(result.followUp.options) ||
        result.followUp.options.length === 0)
        ? { ...result, followUp: UNKNOWN_FOLLOW_UP_FALLBACK }
        : result;

    setAnalysis(normalizedResult);
  };

  const handleFollowUpAnswer = (option) => {
    if (!analysis || !option) return;
    const merged = applyFollowUpAnswer
      ? applyFollowUpAnswer(analysis, option)
      : null;

    if (merged) {
      setAnalysis(merged);
    }
  };

  const recommendations = useMemo(() => {
    if (!analysis || (analysis.unknown && !analysis.candidates?.length)) {
      return [];
    }

    return experiences
      .map((experience) => {
        const score =
          calculateRecommendationScore(
            analysis,
            experience
          );

        return {
          ...experience,
          recommendationScore: score,
          recommendationReason:
            getRecommendationReason(
              analysis,
              experience,
              score
            ),
        };
      })
      .sort(
        (a, b) =>
          b.recommendationScore -
          a.recommendationScore
      );
  }, [analysis, experiences]);

  const selectQuickInput = (value) => {
    setInput(value);
    search(value);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              TODAY, HOW WAS IT?
            </Text>

            <Text style={styles.title}>
              지금, 어때?
            </Text>
          </View>

          <Pressable
            onPress={() =>
              onNavigate?.("record")
            }
            style={styles.headerRecord}
          >
            <Text style={styles.headerRecordText}>
              기록
            </Text>
          </Pressable>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.questionEmoji}>
            💭
          </Text>

          <Text style={styles.question}>
            지금 어떤 하루를 보내고 있어?
          </Text>

          <Text style={styles.questionSub}>
            정확하게 말하지 않아도 괜찮아.
            {"\n"}
            그냥 지금 떠오르는 대로 적어줘.
          </Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() =>
              search()
            }
            placeholder="예: 오늘 너무 지치고 아무것도 하기 싫어..."
            placeholderTextColor="#AAAAAA"
            multiline
            style={styles.input}
          />

          <Pressable
            onPress={() => search()}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>
              내 상태 알아보기
            </Text>
          </Pressable>
        </View>

        {!analysis && (
          <View>
            <Text style={styles.sectionTitle}>
              이렇게 말해도 좋아
            </Text>

            <View style={styles.quickGrid}>
              {QUICK_INPUTS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() =>
                    selectQuickInput(item)
                  }
                  style={styles.quickCard}
                >
                  <Text style={styles.quickText}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.loopBox}>
              <Text style={styles.loopEmoji}>
                🔎 → ✨ → 🚶 → ✍️
              </Text>

              <Text style={styles.loopTitle}>
                발견하고, 해보고, 남겨보세요
              </Text>

              <Text style={styles.loopText}>
                다른 사람이 실제로 해본 작은 경험이
                {"\n"}
                오늘의 당신에게 새로운 선택지가 될 수 있어요.
              </Text>
            </View>
          </View>
        )}

        {analysis && (
          <View>
            <View style={styles.analysisCard}>
              <View style={styles.analysisTop}>
                <View style={styles.bigEmotion}>
                  <Text style={styles.bigEmotionEmoji}>
                    {analysis.emoji}
                  </Text>

                  <View>
                    <Text style={styles.analysisLabel}>
                      지금의 상태
                    </Text>

                    <Text style={styles.analysisName}>
                      {analysis.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.confidenceBox}>
                  <Text style={styles.confidenceLabel}>
                    분석
                  </Text>

                  <Text style={styles.confidence}>
                    입력한 내용을 바탕으로 살펴본 감정
                  </Text>
                </View>
              </View>

              <Text style={styles.summary}>
                {analysis.summary}
              </Text>
              <EmotionInsight analysis={analysis} onChange={setAnalysis} />

              <View style={styles.intensityRow}>
                <Text style={styles.metricLabel}>
                  감정 강도
                </Text>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progress,
                      {
                        width: `${Math.round(
                          (analysis.intensity || 0) *
                            100
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.metricValue}>
                  {Math.round(
                    (analysis.intensity || 0) *
                      100
                  )}
                </Text>
              </View>
            </View>

            {analysis.activities?.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>감지된 활동</Text>
                <View style={styles.chipRow}>
                  {analysis.activities.slice(0, 4).map((activity) => (
                    <View key={activity.id} style={styles.activityChip}>
                      <Text style={styles.activityChipText}>
                        {activity.emoji} {activity.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {analysis.followUp?.question &&
              Array.isArray(analysis.followUp.options) &&
              analysis.followUp.options.length > 0 && (
                <View style={styles.followUpCard}>
                  <Text style={styles.followUpEyebrow}>조금만 더 알려줘</Text>
                  <Text style={styles.followUpQuestion}>{analysis.followUp.question}</Text>
                  {analysis.followUp.description ? (
                    <Text style={styles.followUpDescription}>{analysis.followUp.description}</Text>
                  ) : null}
                  {analysis.followUp.options.map((option, index) => (
                    <Pressable
                      key={option.id || `${option.label}-${index}`}
                      style={styles.followUpOption}
                      onPress={() => handleFollowUpAnswer(option)}
                    >
                      <Text style={styles.followUpOptionText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

            {analysis.compound && (
              <View style={styles.compoundCard}>
                <Text style={styles.cardSmallTitle}>
                  함께 느껴지는 감정
                </Text>

                <Text style={styles.compoundText}>
                  {analysis.emoji} {analysis.name}
                  {"  +  "}
                  {analysis.compound.emoji}{" "}
                  {analysis.compound.name}
                </Text>
              </View>
            )}

            {analysis.detectedNeeds?.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>
                  지금 필요한 것
                </Text>

                <View style={styles.chipRow}>
                  {analysis.detectedNeeds
                    .slice(0, 4)
                    .map((need) => (
                      <View
                        key={need.id}
                        style={styles.needChip}
                      >
                        <Text
                          style={styles.needChipText}
                        >
                          {need.name}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

            {analysis.behavioral && (
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>
                  지금의 행동 상태
                </Text>

                <Metric
                  label="해보고 싶은 마음"
                  value={
                    analysis.behavioral
                      .willingness
                  }
                />

                <Metric
                  label="현재 에너지"
                  value={
                    analysis.behavioral.energy
                  }
                />

                <Metric
                  label="부담감"
                  value={
                    analysis.behavioral.burden
                  }
                />

                <Metric
                  label="새로운 것에 대한 욕구"
                  value={
                    analysis.behavioral
                      .noveltyNeed
                  }
                />

                <Metric
                  label="사람과 연결되고 싶은 정도"
                  value={
                    analysis.behavioral
                      .socialNeed
                  }
                />

                <Metric
                  label="쉬고 싶은 정도"
                  value={
                    analysis.behavioral
                      .restNeed
                  }
                />
              </View>
            )}

            <View style={styles.recommendHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  오늘의 경험
                </Text>

                <Text style={styles.recommendSub}>
                  지금 상태에 맞춰 골라봤어요.
                </Text>
              </View>

              <Text style={styles.resultCount}>
                {recommendations.length}개
              </Text>
            </View>

            {recommendations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>
                  🌱
                </Text>

                <Text style={styles.emptyTitle}>
                  아직 딱 맞는 경험이 없어요.
                </Text>

                <Text style={styles.emptyText}>
                  먼저 작은 경험 하나를 기록해주면
                  {"\n"}
                  다음 사람에게 새로운 선택지가 생겨요.
                </Text>

                <Pressable
                  onPress={() =>
                    onNavigate?.("record")
                  }
                  style={styles.emptyButton}
                >
                  <Text
                    style={styles.emptyButtonText}
                  >
                    내 경험 기록하기
                  </Text>
                </Pressable>
              </View>
            ) : (
              recommendations.map(
                (experience, index) => {
                  const creator =
                    getCharacterInfo(experience);

                  const isPlanned =
                    plannedIds.has(
                      experience.id
                    );

                  return (
                    <View
                      key={experience.id}
                      style={styles.experienceCard}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.creator}>
                          <View
                            style={
                              styles.creatorCharacter
                            }
                          >
                            <Text
                              style={
                                styles.creatorEmoji
                              }
                            >
                              {creator.emoji}
                            </Text>

                            {creator.accessory ? (
                              <Text
                                style={
                                  styles.creatorAccessory
                                }
                              >
                                {creator.accessory}
                              </Text>
                            ) : null}
                          </View>

                          <View>
                            <Text
                              style={
                                styles.creatorName
                              }
                            >
                              {creator.name}
                            </Text>
                            <Text
                              style={
                                styles.creatorSub
                              }
                            >
                              이 경험을 해봤어요
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.scoreBadge
                          }
                        >
                          <Text
                            style={
                              styles.scoreText
                            }
                          >
                            {Math.round(
                              experience.recommendationScore
                            )}
                            점
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={styles.experienceTitle}
                      >
                        {experience.title}
                      </Text>

                      <Text
                        style={styles.experienceText}
                        numberOfLines={3}
                      >
                        {experience.text}
                      </Text>

                      <View style={styles.metaRow}>
                        <Meta
                          icon="🕐"
                          value={
                            experience.time ||
                            "시간 정보 없음"
                          }
                        />

                        <Meta
                          icon="💰"
                          value={
                            experience.cost ||
                            "비용 정보 없음"
                          }
                        />

                        <Meta
                          icon="👥"
                          value={
                            experience.type ||
                            "정보 없음"
                          }
                        />
                      </View>

                      <View style={styles.reasonBox}>
                        <Text
                          style={styles.reasonEmoji}
                        >
                          ✨
                        </Text>

                        <Text
                          style={styles.reasonText}
                        >
                          {
                            experience.recommendationReason
                          }
                        </Text>
                      </View>

                      <View style={styles.bottomRow}>
                        <View>
                          <Text
                            style={styles.rating}
                          >
                            {getSatisfaction(
                              experience
                            )}
                          </Text>

                          <Text
                            style={styles.ratingLabel}
                          >
                            실제 경험 만족도
                          </Text>
                        </View>

                        <Pressable
                          disabled={isPlanned}
                          onPress={() =>
                            onSaveExperience?.(
                              experience
                            )
                          }
                          style={[
                            styles.tryButton,
                            isPlanned &&
                              styles.tryButtonDone,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tryButtonText,
                              isPlanned &&
                                styles.tryButtonTextDone,
                            ]}
                          >
                            {isPlanned
                              ? "해볼 예정 ✓"
                              : "나도 해볼래 →"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                }
              )
            )}

            <Pressable
              onPress={() => {
                setAnalysis(null);
                setInput("");
              }}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>
                다른 상태로 다시 찾아보기
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   작은 컴포넌트
========================================================= */

function Metric({ label, value = 0 }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <Text style={styles.metricName}>
          {label}
        </Text>

        <Text style={styles.metricNumber}>
          {Math.round(value * 100)}
        </Text>
      </View>

      <View style={styles.metricBar}>
        <View
          style={[
            styles.metricBarFill,
            {
              width: `${Math.round(
                value * 100
              )}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function Meta({ icon, value }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

/* =========================================================
   스타일
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: "#AAAAAA",
    letterSpacing: 1.4,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#222222",
    marginTop: 3,
  },

  headerRecord: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#222222",
  },

  headerRecordText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  questionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 21,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  questionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  question: {
    fontSize: 21,
    fontWeight: "900",
    color: "#222222",
  },

  questionSub: {
    marginTop: 8,
    fontSize: 13,
    color: "#888888",
    lineHeight: 20,
  },

  input: {
    marginTop: 17,
    minHeight: 105,
    backgroundColor: "#F7F7F5",
    borderRadius: 17,
    padding: 15,
    fontSize: 14,
    lineHeight: 21,
    color: "#222222",
    textAlignVertical: "top",
  },

  searchButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 19,
    fontWeight: "900",
    color: "#222222",
  },

  quickGrid: {
    marginTop: 11,
    gap: 8,
  },

  quickCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  quickText: {
    fontSize: 13,
    color: "#555555",
    fontWeight: "700",
  },

  loopBox: {
    marginTop: 24,
    backgroundColor: "#F1F0EC",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },

  loopEmoji: {
    fontSize: 21,
    marginBottom: 9,
  },

  loopTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#333333",
  },

  loopText: {
    marginTop: 7,
    fontSize: 12,
    color: "#777777",
    lineHeight: 18,
    textAlign: "center",
  },

  analysisCard: {
    marginTop: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  analysisTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bigEmotion: {
    flexDirection: "row",
    alignItems: "center",
  },

  bigEmotionEmoji: {
    fontSize: 45,
    marginRight: 13,
  },

  analysisLabel: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "700",
  },
  analysisName: {
    marginTop: 3,
    fontSize: 20,
    color: "#222222",
    fontWeight: "900",
  },

  confidenceBox: {
    alignItems: "flex-end",
  },

  confidenceLabel: {
    fontSize: 10,
    color: "#AAAAAA",
  },

  confidence: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: "#555555",
  },

  summary: {
    marginTop: 18,
    fontSize: 14,
    lineHeight: 21,
    color: "#555555",
  },

  intensityRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  metricLabel: {
    width: 62,
    fontSize: 10,
    color: "#888888",
    fontWeight: "700",
  },

  progressBackground: {
    flex: 1,
    height: 7,
    backgroundColor: "#EEEEEE",
    borderRadius: 10,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: "#333333",
    borderRadius: 10,
  },

  metricValue: {
    width: 35,
    textAlign: "right",
    fontSize: 10,
    color: "#666666",
    fontWeight: "800",
  },

  activityChip: {
    backgroundColor: "#EEF7F0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 7,
    marginBottom: 7,
  },

  activityChipText: {
    fontSize: 12,
    color: "#487052",
    fontWeight: "700",
  },

  followUpCard: {
    backgroundColor: "#FFFDF5",
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F0E7C8",
  },

  followUpEyebrow: {
    fontSize: 12,
    color: "#A58B46",
    fontWeight: "800",
  },

  followUpQuestion: {
    fontSize: 17,
    lineHeight: 24,
    color: "#333333",
    fontWeight: "800",
    marginTop: 7,
  },

  followUpDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888888",
    marginTop: 6,
    marginBottom: 10,
  },

  followUpOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginTop: 7,
    borderWidth: 1,
    borderColor: "#EDE7D8",
  },

  followUpOptionText: {
    color: "#444444",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },

  compoundCard: {
    marginTop: 10,
    backgroundColor: "#F4F2EC",
    borderRadius: 17,
    padding: 15,
  },

  cardSmallTitle: {
    fontSize: 10,
    color: "#999999",
    fontWeight: "800",
  },

  compoundText: {
    marginTop: 6,
    fontSize: 13,
    color: "#444444",
    fontWeight: "800",
  },

  infoCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 17,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#333333",
    marginBottom: 11,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  needChip: {
    backgroundColor: "#F0EFEB",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
  },

  needChipText: {
    fontSize: 11,
    color: "#555555",
    fontWeight: "800",
  },

  metric: {
    marginTop: 10,
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  metricName: {
    fontSize: 11,
    color: "#777777",
    fontWeight: "700",
  },

  metricNumber: {
    fontSize: 10,
    color: "#555555",
    fontWeight: "900",
  },

  metricBar: {
    height: 5,
    backgroundColor: "#EEEEEE",
    borderRadius: 10,
    overflow: "hidden",
  },

  metricBarFill: {
    height: "100%",
    backgroundColor: "#444444",
    borderRadius: 10,
  },

  recommendHeader: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  recommendSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#999999",
  },
  resultCount: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "800",
    marginBottom: 3,
  },

  experienceCard: {
    marginTop: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  creator: {
    flexDirection: "row",
    alignItems: "center",
  },

  creatorCharacter: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#F2F0EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    position: "relative",
  },

  creatorEmoji: {
    fontSize: 28,
  },
  creatorAccessory: {
    position: "absolute",
    top: 1,
    right: 1,
    fontSize: 13,
  },

  creatorName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#333333",
  },

  creatorSub: {
    marginTop: 2,
    fontSize: 10,
    color: "#AAAAAA",
  },

  scoreBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "#F2F0EA",
  },

  scoreText: {
    fontSize: 11,
    color: "#555555",
    fontWeight: "900",
  },

  experienceTitle: {
    marginTop: 16,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#222222",
  },

  experienceText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    color: "#777777",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 13,
    gap: 7,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 11,
  },
  metaIcon: {
    fontSize: 11,
    marginRight: 4,
  },

  metaText: {
    fontSize: 10,
    color: "#666666",
    fontWeight: "700",
  },

  reasonBox: {
    marginTop: 13,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8F6F0",
    flexDirection: "row",
    alignItems: "flex-start",
  },

  reasonEmoji: {
    fontSize: 13,
    marginRight: 7,
  },

  reasonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#666666",
    fontWeight: "700",
  },

  bottomRow: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rating: {
    fontSize: 13,
    letterSpacing: 1,
    color: "#555555",
  },

  ratingLabel: {
    marginTop: 3,
    fontSize: 9,
    color: "#AAAAAA",
  },

  tryButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 15,
    backgroundColor: "#222222",
  },

  tryButtonDone: {
    backgroundColor: "#E9E8E3",
  },

  tryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  tryButtonTextDone: {
    color: "#777777",
  },

  emptyCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  emptyEmoji: {
    fontSize: 38,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#333333",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#888888",
  },
  emptyButton: {
    marginTop: 15,
    backgroundColor: "#222222",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 14,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  resetButton: {
    marginTop: 18,
    alignItems: "center",
    padding: 13,
  },

  resetText: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "700",
  },
});
