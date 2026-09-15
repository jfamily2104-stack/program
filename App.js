import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './HomeScreen';
import ExploreScreen from './ExploreScreen';
import RecordScreen from './RecordScreen';
import CharacterScreen from './CharacterScreen';
import ProfileScreen from './ProfileScreen';
import CharacterSetup from './CharacterSetup';
import { analyzeEmotion, applyFollowUpAnswer, getCharacterMemoryMessage } from './EmotionAlgorithm';
import { normalizeCharacter } from './CharacterData';
import { loadSnapshot, createCommitQueue, addRecord } from './AppStorage';
import { s, Button } from './UI';

const tabs = [
  ['home', '🏠', '홈'],
  ['explore', '🔎', '탐색'],
  ['record', '✍️', '기록'],
  ['character', '🐾', '캐릭터'],
  ['profile', '👤', '나']
];

export default function App() {
  const [data, setData] = useState(null),
    [activeTab, setActiveTab] = useState('home'),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [selectedPlanId, setSelectedPlanId] = useState(null);

  const queue = useRef(null),
    alive = useRef(false),
    loadPromise = useRef(null);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;

    setError('');

    if (!loadPromise.current)
      loadPromise.current = loadSnapshot(AsyncStorage).catch(e => {
        loadPromise.current = null;
        throw e;
      });

    loadPromise.current
      .then(initial => {
        if (cancelled) return;

        queue.current = createCommitQueue(AsyncStorage, initial, next => {
          if (alive.current) setData(next);
        });

        setData(initial);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            '저장된 데이터를 불러오지 못했어요. 기존 기록을 유지한 채 다시 시도할 수 있어요.'
          );
      });

    return () => {
      cancelled = true;
      alive.current = false;
    };
  }, [attempt]);

  const commit = useCallback(
    update =>
      queue.current
        ? queue.current(update)
        : Promise.reject(new Error('데이터 준비 중입니다.')),
    []
  );

  const learning = data?.emotionLearning;

  const analyze = useCallback(
    text => analyzeEmotion(text, learning),
    [learning]
  );

  const follow = useCallback(
    (result, option) => applyFollowUpAnswer(result, option, learning),
    [learning]
  );

  const memory = useCallback(
    id => getCharacterMemoryMessage(learning, id),
    [learning]
  );

  const navigate = (tab, planId = null) => {
    if (tab === 'record') setSelectedPlanId(planId);
    setActiveTab(tab);
  };

  const savePlan = experience =>
    commit(prev =>
      prev.plannedExperiences.some(
        x => String(x.sourceId) === String(experience.id)
      )
        ? prev
        : {
            ...prev,
            plannedExperiences: [
              {
                ...experience,
                sourceId: String(experience.id),
                savedAt: Date.now()
              },
              ...prev.plannedExperiences
            ]
          }
    );

  const deleteExperience = id =>
    commit(prev => ({
      ...prev,
      experiences: prev.experiences.filter(
        x => !(String(x.id) === String(id) && x.userId === 'me')
      )
    }));

  const saveRecord = useCallback(
    (record, feedback) =>
      commit(prev => addRecord(prev, record, feedback)),
    [commit]
  );

  const common = {
    character: data?.character,
    experiences: data?.experiences || [],
    plannedExperiences: data?.plannedExperiences || [],
    emotionLearning: learning,
    onNavigate: navigate,
    onDeleteExperience: deleteExperience,
    getCharacterMemory: memory
  };

  let screen;

  if (!data)
    screen = (
      <View
        style={[
          s.container,
          {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30
          }
        ]}
      >
        <Text style={{ fontSize: 48 }}>🌱</Text>

        {error ? (
          <>
            <Text style={s.error}>{error}</Text>
            <Button onPress={() => setAttempt(n => n + 1)}>
              다시 불러오기
            </Button>
          </>
        ) : (
          <>
            <Text style={[s.strong, { marginTop: 15 }]}>
              오늘의 경험을 준비하고 있어요
            </Text>
            <ActivityIndicator style={{ marginTop: 18 }} />
          </>
        )}
      </View>
    );
  else if (!data.character)
    screen = (
      <CharacterSetup
        onComplete={character =>
          commit(prev => ({
            ...prev,
            character: normalizeCharacter(character)
          }))
        }
      />
    );
  else {
    const screens = {
      home: <HomeScreen {...common} onTryExperience={savePlan} />,

      explore: (
        <ExploreScreen
          {...common}
          analyzeEmotion={analyze}
          applyFollowUpAnswer={follow}
          onSaveExperience={savePlan}
        />
      ),

      record: (
        <RecordScreen
          {...common}
          selectedPlanId={selectedPlanId}
          analyzeEmotion={analyze}
          applyFollowUpAnswer={follow}
          onSaveRecord={saveRecord}
          onRecordComplete={() => navigate('profile')}
        />
      ),

      character: <CharacterScreen {...common} />,
      profile: <ProfileScreen {...common} />
    };

    screen = (
      <View style={s.container}>
        <View style={{ flex: 1 }}>
          {screens[activeTab] || screens.home}
        </View>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#FFF',
            borderTopWidth: 1,
            borderTopColor: '#EEE',
            paddingVertical: 5
          }}
        >
          {tabs.map(([id, emoji, label]) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{
                selected: activeTab === id
              }}
              onPress={() => navigate(id)}
              style={{
                flex: 1,
                height: 64,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  activeTab === id ? '#F3F0EA' : '#FFF'
              }}
            >
              <Text style={{ fontSize: 21 }}>{emoji}</Text>

              <Text
                style={{
                  fontSize: 11,
                  color: activeTab === id ? '#222' : '#999',
                  fontWeight: '700',
                  marginTop: 3
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FAFAF8',
        paddingTop:
          Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
      }}
    >
      {screen}
    </SafeAreaView>
  );
}
