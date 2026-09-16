import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  averageSatisfaction,
  selectedActionStats
} from './DataUtils';
import { EMOTION_GROUPS } from './EmotionData';
import {
  s,
  Button,
  Avatar,
  Stars,
  MediaGallery,
  DeleteButton
} from './UI';

export default function ProfileScreen({
  character,
  experiences = [],
  plannedExperiences = [],
  onDeleteExperience,
  onNavigate
}) {
  const [showAll, setShowAll] = useState(false);

  const mine = useMemo(
    () =>
      experiences
        .filter(x => x?.userId === 'me')
        .sort(
          (a, b) =>
            (b.createdAt || 0) -
            (a.createdAt || 0)
        ),
    [experiences]
  );

  const stats = useMemo(
    () => selectedActionStats(mine),
    [mine]
  );

  const emotions = useMemo(() => {
    const counts = new Map();

    mine.forEach(x => {
      const id = x.emotionGroup;

      if (!id || id === 'unknown') return;

      const label =
        EMOTION_GROUPS[id]?.name ||
        x.emotionName ||
        id;

      counts.set(
        label,
        (counts.get(label) || 0) + 1
      );
    });

    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [mine]);

  const average = averageSatisfaction(mine),
    good = mine.filter(
      x => Number(x.satisfaction) >= 4
    ).length;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
    >
      <View
        style={{
          alignItems: 'center',
          paddingTop: 10
        }}
      >
        <Avatar character={character} size={110} />

        <Text
          style={[
            s.strong,
            {
              fontSize: 20,
              marginTop: 12
            }
          ]}
        >
          {character?.name}
        </Text>

        <Text style={s.subtitle}>
          {character?.typeName}
          {character?.accessoryName &&
          character.accessoryName !== '없음'
            ? ` · ${character.accessoryName}`
            : ''}
        </Text>

        <Text style={s.eyebrow}>
          처음 만난 모습 그대로 함께하는 동반자
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.eyebrow}>
          {mine.length < 3
            ? '패턴을 찾는 중'
            : '기록에서 살펴보기'}
        </Text>

        <Text
          style={[
            s.strong,
            {
              fontSize: 20,
              marginTop: 10
            }
          ]}
        >
          {!mine.length
            ? '아직 너를 알아가는 중이야 🌱'
            : mine.length === 1
            ? '첫 번째 기록이 생겼어 ✨'
            : '너만의 경험이 쌓이고 있어 🌿'}
        </Text>

        <Text style={s.subtitle}>
          {!mine.length
            ? '작은 경험 하나부터 남겨보자.'
            : `기록 ${mine.length}개 중 만족도 4점 이상인 경험이 ${good}개야.`}
        </Text>
      </View>

      <Text style={s.section}>나의 경험</Text>

      <View style={s.row}>
        {[
          [mine.length, '기록한 경험'],
          [average, '평균 만족도'],
          [plannedExperiences.length, '해볼 경험']
        ].map(([value, label]) => (
          <View
            style={[
              s.card,
              s.stat,
              {
                paddingHorizontal: 5,
                marginTop: 0
              }
            ]}
            key={label}
          >
            <Text style={s.statNumber}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {plannedExperiences.length > 0 ? (
        <>
          <Text style={s.section}>해보고 싶은 경험</Text>

          {plannedExperiences.map(x => (
            <View key={x.sourceId} style={s.card}>
              <View style={s.row}>
                <Avatar character={x.character} size={46} />

                <Text
                  style={[
                    s.strong,
                    {
                      flex: 1
                    }
                  ]}
                >
                  {x.title}
                </Text>
              </View>

              <Button
                secondary
                onPress={() =>
                  onNavigate('record', x.sourceId)
                }
              >
                실제로 해본 뒤 기록하기 →
              </Button>
            </View>
          ))}
        </>
      ) : null}

      {mine.length > 0 ? (
        <>
          <Text style={s.section}>최근 나의 패턴</Text>

          <View style={s.card}>
            <Text style={s.strong}>자주 만나는 감정</Text>

            <View
              style={[
                s.wrap,
                {
                  marginTop: 10
                }
              ]}
            >
              {emotions.map(([label, count]) => (
                <View key={label} style={s.chip}>
                  <Text style={s.chipText}>
                    {label} · {count}회
                  </Text>
                </View>
              ))}
            </View>

            <Text style={s.section}>실제로 해본 행동</Text>

            {stats.length ? (
              <View style={s.wrap}>
                {stats.map(([label, count]) => (
                  <View key={label} style={s.chip}>
                    <Text style={s.chipText}>
                      {label} · {count}회
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.subtitle}>
                아직 실제로 했다고 표시한 행동이 없어요.
              </Text>
            )}
          </View>
        </>
      ) : null}

      <Text style={s.section}>최근 기록</Text>

      {mine.length === 0 ? (
        <View
          style={[
            s.card,
            {
              alignItems: 'center'
            }
          ]}
        >
          <Text style={{ fontSize: 32 }}>✏️</Text>

          <Text style={s.strong}>
            아직 기록한 경험이 없어
          </Text>

          <Button onPress={() => onNavigate('record')}>
            첫 경험 기록하기 →
          </Button>
        </View>
      ) : (
        (showAll ? mine : mine.slice(0, 5)).map(x => (
          <View key={x.id} style={s.card}>
            <Text style={s.subtitle}>
              {x.emotionName ||
                x.mood ||
                '오늘의 경험'}
            </Text>

            <Stars value={x.satisfaction} />

            <Text
              style={[
                s.strong,
                {
                  fontSize: 17,
                  marginTop: 8
                }
              ]}
            >
              {x.title}
            </Text>

            <Text
              style={[
                s.body,
                {
                  marginTop: 8
                }
              ]}
            >
              {x.text}
            </Text>

            <MediaGallery media={x.media} />

            <DeleteButton
              onDelete={() =>
                onDeleteExperience(x.id)
              }
            />
          </View>
        ))
      )}

      {mine.length > 5 ? (
        <Button
          secondary
          onPress={() =>
            setShowAll(v => !v)
          }
        >
          {showAll
            ? '최근 5개만 보기'
            : '모든 기록 보기'}
        </Button>
      ) : null}

      <Button onPress={() => onNavigate('explore')}>
        새로운 경험 찾아보기 →
      </Button>
    </ScrollView>
  );
}