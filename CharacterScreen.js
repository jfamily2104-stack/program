import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { averageSatisfaction } from './DataUtils';
import { s, Button, Avatar } from './UI';

export default function CharacterScreen({
  character,
  experiences = [],
  emotionLearning,
  getCharacterMemory
}) {
  const [message, setMessage] = useState(
    '오늘은 뭐 하고 왔어?'
  );

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

  const recent = mine[0];

  const talk = () => {
    const ids = [
      recent?.beforeEmotionGroup,
      recent?.emotionGroup,
      ...(emotionLearning?.interactions || []).map(
        x => x.emotionId
      )
    ].filter(Boolean);

    let text = null;

    for (const id of [...new Set(ids)]) {
      text = getCharacterMemory?.(id);

      if (text) break;
    }

    setMessage(
      text ||
        (recent
          ? `"${recent.title}"을 기록했구나. 네 이야기를 기억하고 있어.`
          : '첫 경험을 남겨주면 같이 기억해볼게.')
    );
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
    >
      <Text style={s.title}>나의 동반자</Text>

      <Text style={s.subtitle}>
        나의 경험을 함께 쌓아가는 캐릭터
      </Text>

      <View
        style={[
          s.card,
          {
            alignItems: 'center',
            backgroundColor:
              character?.colorValue || '#DDD',
            padding: 25
          }
        ]}
      >
        <Avatar character={character} size={145} />

        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#FFFFFFCC',
            padding: 12,
            borderRadius: 15,
            marginTop: 12
          }}
        >
          <Text
            style={[
              s.strong,
              {
                fontSize: 23
              }
            ]}
          >
            {character?.name}
          </Text>

          <Text style={s.subtitle}>
            {character?.typeName} ·{' '}
            {character?.accessoryName || '없음'}
          </Text>

          <Text style={s.eyebrow}>
            🔒 나의 동반자
          </Text>
        </View>
      </View>

      <View style={s.dialogue}>
        <Text
          style={[
            s.strong,
            {
              textAlign: 'center',
              lineHeight: 24
            }
          ]}
        >
          {message}
        </Text>
      </View>

      <Text style={s.section}>같이 놀기</Text>

      <View style={s.row}>
        {[
          [
            '❤️',
            '쓰다듬기',
            () =>
              setMessage(
                '헤헤, 쓰다듬어주는 거 좋아. 🥰'
              )
          ],
          [
            '🍪',
            '간식',
            () =>
              setMessage(
                '간식이다! 고마워 🍪'
              )
          ],
          [
            '🎮',
            '놀기',
            () =>
              setMessage(
                '좋아! 오늘은 같이 뭐 하고 놀까? 🎮'
              )
          ],
          ['💬', '이야기', talk]
        ].map(([emoji, label, onPress]) => (
          <Button
            key={label}
            secondary
            style={{
              flex: 1,
              paddingHorizontal: 3
            }}
            onPress={onPress}
          >
            {emoji}
            {'\n'}
            {label}
          </Button>
        ))}
      </View>

      <View style={[s.card, s.dark]}>
        <Text
          style={[
            s.strong,
            s.light,
            {
              fontSize: 20
            }
          ]}
        >
          🧠 나를 알아가는 중
        </Text>

        <Text
          style={[
            s.subtitle,
            {
              color: '#CCC'
            }
          ]}
        >
          네가 남긴 경험을 바탕으로
          {'\n'}
          조금씩 너를 알아가고 있어.
        </Text>

        <View
          style={[
            s.row,
            {
              marginTop: 20
            }
          ]}
        >
          {[
            [mine.length, '기록한 경험'],
            [
              averageSatisfaction(mine),
              '평균 만족도'
            ]
          ].map(([value, label]) => (
            <View key={label} style={s.stat}>
              <Text
                style={[
                  s.statNumber,
                  s.light
                ]}
              >
                {value}
              </Text>

              <Text style={s.statLabel}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            s.notice,
            {
              backgroundColor: '#333'
            }
          ]}
        >
          <Text style={s.eyebrow}>
            {recent ? '최근 기억' : '아직 기억이 없어'}
          </Text>

          <Text
            style={[
              s.strong,
              s.light,
              {
                marginTop: 8
              }
            ]}
          >
            {recent?.title ||
              '첫 경험을 기다리고 있어'}
          </Text>

          <Text
            style={[
              s.body,
              {
                color: '#CCC',
                marginTop: 5
              }
            ]}
          >
            {recent?.text ||
              '작은 경험 하나부터 남겨봐.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}