import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import LocationPicker from './LocationPicker';
import { prepareMedia } from './MediaStorage';
import { makeId, actionText, coordinateOf } from './DataUtils';
import { s, Button, Avatar, FollowUp, MediaGallery } from './UI';
import EmotionInsight from './EmotionInsight';

function Rating({
  label,
  value,
  onChange,
  disabled
}) {
  return (
    <View>
      <Text style={s.section}>
        {label}
      </Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable
            key={n}
            disabled={disabled}
            accessibilityLabel={`${n}점`}
            onPress={() => onChange(n)}
          >
            <Text
              style={{
                fontSize: 38,
                color:
                  n <= value
                    ? '#222'
                    : '#DDD'
              }}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function RecordScreen({
  character,
  plannedExperiences = [],
  selectedPlanId,
  onNavigate,
  analyzeEmotion,
  applyFollowUpAnswer,
  getCharacterMemory,
  onSaveRecord,
  onRecordComplete
}) {
  const [plan, setPlan] = useState(null),
    [title, setTitle] = useState(''),
    [text, setText] = useState(''),
    [mood, setMood] = useState(''),
    [beforeMood, setBeforeMood] = useState(''),
    [satisfaction, setSatisfaction] = useState(0),
    [before, setBefore] = useState(0),
    [after, setAfter] = useState(0),
    [media, setMedia] = useState([]),
    [location, setLocation] = useState(null),
    [selectedAction, setSelectedAction] = useState(''),
    [executed, setExecuted] = useState(false),
    [follow, setFollow] = useState(null),
    [time, setTime] = useState(''),
    [cost, setCost] = useState(''),
    [type, setType] = useState('혼자'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(false);

  const saving = useRef(false),
    id = useRef(makeId());

  const selectPlan = p => {
    setPlan(p);
    setTitle(p.title || '');
    setSelectedAction('');
    setExecuted(false);
    setBeforeMood('');
    setBefore(0);
    setAfter(0);
    setFollow(null);
    setTime('');
    setCost('');
    setType('혼자');
  };

  useEffect(() => {
    if (selectedPlanId != null) {
      const p = plannedExperiences.find(
        x =>
          String(x.sourceId) ===
          String(selectedPlanId)
      );

      if (p) selectPlan(p);
    }
  }, [selectedPlanId]);

  const base = useMemo(
    () =>
      mood.trim()
        ? analyzeEmotion(mood)
        : null,
    [mood, analyzeEmotion]
  );

  const analysis = follow || base;

  const beforeAnalysis = useMemo(
    () =>
      beforeMood.trim()
        ? analyzeEmotion(beforeMood)
        : null,
    [beforeMood, analyzeEmotion]
  );

  const actions =
    analysis?.actions?.slice(0, 6) || [];

  const memory =
    beforeAnalysis &&
    !beforeAnalysis.unknown
      ? getCharacterMemory?.(
          beforeAnalysis.groupId
        )
      : null;

  const changeMood = value => {
    setMood(value);
    setFollow(null);
    setSelectedAction('');
    setExecuted(false);
    setBefore(0);
    setAfter(0);
  };

  const answer = option => {
    setFollow(
      applyFollowUpAnswer(
        analysis,
        option
      )
    );

    setSelectedAction('');
    setExecuted(false);
  };

  const pick = async () => {
    if (media.length >= 6) return;

    setError('');

    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted)
          throw new Error(
            '사진 접근 권한을 허용해주세요.'
          );
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: [
            'images',
            'videos'
          ],
          allowsMultipleSelection: true,
          selectionLimit:
            6 - media.length,
          quality: 0.8
        });

      if (!result.canceled)
        setMedia(prev =>
          [
            ...prev,
            ...result.assets.map(x => ({
              uri: x.uri,
              type: x.type,
              fileName: x.fileName,
              width: x.width,
              height: x.height,
              duration: x.duration
            }))
          ].slice(0, 6)
        );
    } catch (e) {
      setError(
        e.message ||
          '사진이나 영상을 불러오지 못했어요.'
      );
    }
  };

  const save = async () => {
    if (
      saving.current ||
      success
    )
      return;

    if (
      !character ||
      !title.trim() ||
      !text.trim() ||
      !mood.trim() ||
      !satisfaction
    ) {
      setError(
        '제목, 경험 내용, 경험 후 마음, 만족도를 입력해주세요.'
      );
      return;
    }

    if (
      executed &&
      selectedAction &&
      !beforeMood.trim()
    ) {
      setError(
        '이 행동을 실제로 했다면 행동 전 마음도 적어주세요.'
      );
      return;
    }

    if (
      executed &&
      before > 0 !== after > 0
    ) {
      setError(
        '전후 기분을 비교하려면 두 점수를 모두 선택해주세요. 선택하지 않아도 기록할 수 있어요.'
      );
      return;
    }

    saving.current = true;

    setBusy(true);
    setError('');

    let prepared = null;

    try {
      prepared =
        await prepareMedia(
          media,
          id.current
        );

      const finalAnalysis =
        analysis ||
        analyzeEmotion(mood);

      const beforeId =
        beforeAnalysis &&
        !beforeAnalysis.unknown
          ? beforeAnalysis.groupId
          : null;

      const didAction =
        executed &&
        !!actionText(
          selectedAction
        );

      const now = Date.now();

      const record = {
        id: id.current,
        userId: 'me',

        character: {
          ...character
        },

        title: title.trim(),
        text: text.trim(),
        mood: mood.trim(),

        emotionGroup:
          finalAnalysis.groupId,

        emotionName:
          finalAnalysis.unknown
            ? mood.trim()
            : finalAnalysis.name,

        emotionConfidence:
          finalAnalysis.confidence,
        emotionSource: finalAnalysis.source || 'inferred',
        emotionAlgorithmVersion: finalAnalysis.algorithmVersion || 3,

        needs:
          finalAnalysis.needs || [],

        actions:
          finalAnalysis.actions || [],

        selectedAction:
          didAction
            ? actionText(
                selectedAction
              )
            : null,

        actionExecuted:
          didAction,

        beforeMood:
          beforeMood.trim() ||
          null,

        beforeEmotionGroup:
          beforeId,

        beforeFeeling:
          didAction
            ? before || null
            : null,

        afterFeeling:
          didAction
            ? after || null
            : null,

        satisfaction,

        media:
          prepared.assets,

        location:
          coordinateOf(location)
            ? location
            : null,

        locationName:
          location?.name ||
          null,

        locationAddress:
          location?.address ||
          null,

        time: time.trim(),
        cost: cost.trim(),
        type,

        sourceExperienceId:
          plan?.sourceId ||
          null,

        createdAt: now
      };

      const feedback =
        didAction && beforeId
          ? {
              eventId:
                id.current,

              type:
                'completed',

              executed: true,
              emotionId:
                beforeId,

              action:
                selectedAction,

              satisfaction,

              before: before
                ? (before - 1) /
                  4
                : null,

              after: after
                ? (after - 1) /
                  4
                : null,

              sourceExperienceId:
                plan?.sourceId ||
                null,

              createdAt: now
            }
          : null;

      await onSaveRecord(
        record,
        feedback
      );

      setSuccess(true);
    } catch (e) {
      if (prepared)
        await prepared
          .rollback()
          .catch(() => {});

      setError(
        e.message?.includes(
          '웹에서는'
        )
          ? e.message
          : '저장하지 못했어요. 입력한 내용은 유지했으니 다시 시도해주세요.'
      );

      saving.current = false;
    } finally {
      setBusy(false);
    }
  };

  if (success)
    return (
      <View
        style={[
          s.container,
          {
            padding: 28,
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]}
      >
        <Text style={{ fontSize: 45 }}>
          🌱
        </Text>

        <Text
          style={[
            s.title,
            {
              marginTop: 15
            }
          ]}
        >
          기록 완료
        </Text>

        <Text style={s.subtitle}>
          오늘의 경험이 저장됐어요.
        </Text>

        <Button
          onPress={onRecordComplete}
        >
          나의 기록 확인하기
        </Button>
      </View>
    );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={
        s.content
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.eyebrow}>
        경험 기록
      </Text>

      <Text style={s.title}>
        오늘의 이야기를
        {'\n'}
        남겨보자
      </Text>

      <Text style={s.subtitle}>
        잘 쓴 글일 필요 없어.
        {'\n'}
        네가 실제로 느낀 것만 남겨줘.
      </Text>

      {plannedExperiences.length > 0 ? (
        <>
          <Text style={s.section}>
            해보고 싶은 경험
          </Text>

          <ScrollView horizontal>
            {plannedExperiences.map(p => (
              <Pressable
                disabled={busy}
                key={p.sourceId}
                onPress={() =>
                  selectPlan(p)
                }
                style={[
                  s.card,
                  {
                    width: 190,
                    marginRight: 10
                  },
                  plan?.sourceId ===
                    p.sourceId &&
                    s.selected
                ]}
              >
                <Avatar
                  character={
                    p.character
                  }
                  size={46}
                />
                <Text
                  style={[
                    s.strong,
                    {
                      marginTop: 10
                    }
                  ]}
                  numberOfLines={2}
                >
                  {p.title}
                </Text>

                <Text style={s.subtitle}>
                  {p.author ||
                    p.character?.name ||
                    '누군가'}
                  의 경험
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {plan ? (
            <Button
              secondary
              disabled={busy}
              onPress={() => {
                setPlan(null);
                setSelectedAction('');
                setExecuted(false);
              }}
            >
              선택한 경험 해제
            </Button>
          ) : null}
        </>
      ) : null}

      <Text style={s.section}>
        어떤 경험이었어?
      </Text>
      <TextInput
        editable={!busy}
        value={title}
        onChangeText={setTitle}
        placeholder="예: 혼자 처음 가본 카페"
        style={s.input}
      />

      <TextInput
        editable={!busy}
        value={text}
        onChangeText={setText}
        placeholder="무엇을 했는지 자유롭게 적어줘."
        multiline
        style={[
          s.input,
          s.area
        ]}
      />

      <Text style={s.section}>
        시간 · 비용 · 동행
      </Text>

      <TextInput
        editable={!busy}
        value={time}
        onChangeText={setTime}
        placeholder="예: 1시간 30분 (선택)"
        style={s.input}
      />

      <TextInput
        editable={!busy}
        value={cost}
        onChangeText={setCost}
        placeholder="예: 5,000원 (선택)"
        style={s.input}
      />

      <View
        style={[
          s.wrap,
          {
            marginTop: 10
          }
        ]}
      >
        {[
          '혼자',
          '친구와',
          '가족과',
          '새로운 사람과',
          '그룹 수업'
        ].map(x => (
          <Button
            secondary={
              type !== x
            }
            disabled={busy}
            key={x}
            onPress={() =>
              setType(x)
            }
          >
            {x}
          </Button>
        ))}
      </View>

      <Text style={s.section}>
        게시 장소
      </Text>

      <LocationPicker
        value={location}
        onChange={setLocation}
        disabled={busy}
      />

      <Text style={s.subtitle}>
        장소를 선택하지 않으면 지도에 표시하지 않아요.
      </Text>
      <Text style={s.section}>
        사진이나 영상
      </Text>

      <Button
        secondary
        disabled={
          busy ||
          media.length >= 6
        }
        onPress={pick}
      >
        📷 사진 / 영상 추가 · {media.length}/6
      </Button>

      <MediaGallery media={media} />

      <View style={s.wrap}>
        {media.map((x, i) => (
          <Button
            secondary
            disabled={busy}
            key={`${x.uri}-${i}`}
            onPress={() =>
              setMedia(prev =>
                prev.filter(
                  (_, j) =>
                    i !== j
                )
              )
            }
          >
            {i + 1}번 삭제
          </Button>
        ))}
      </View>

      <Text style={s.section}>
        경험 후 지금 마음은?
      </Text>

      <TextInput
        editable={!busy}
        value={mood}
        onChangeText={changeMood}
        placeholder="예: 생각보다 마음이 편해졌어"
        multiline
        style={[
          s.input,
          s.area
        ]}
      />

      {analysis ? (
        <View style={s.notice}>
          <Text style={s.strong}>
            {analysis.emoji}{' '}
            {analysis.name}
          </Text>

          <Text style={s.subtitle}>
            {analysis.summary}
          </Text>
        </View>
      ) : null}

      {!busy ? (
        <FollowUp
          analysis={analysis}
          onAnswer={answer}
        />
      ) : null}

      <EmotionInsight analysis={analysis} disabled={busy} onChange={result => {
        setFollow(result);
        setSelectedAction('');
        setExecuted(false);
        setBefore(0);
        setAfter(0);
      }} />

      {actions.length > 0 ? (
        <View style={s.card}>
          <Text style={s.strong}>
            실제로 해본 행동이 있어?
          </Text>

          <Text style={s.subtitle}>
            추천 중 이번에 해본 행동이 있을 때만 선택해줘.
          </Text>

          {actions.map(x => (
            <Button
              disabled={busy}
              secondary={
                selectedAction !==
                x
              }
              key={actionText(x)}
              onPress={() => {
                setSelectedAction(
                  selectedAction ===
                    x
                    ? ''
                    : x
                );

                setExecuted(false);
                setBefore(0);
                setAfter(0);
              }}
            >
              {actionText(x)}
            </Button>
          ))}

          {selectedAction ? (
            <Button
              disabled={busy}
              secondary={!executed}
              onPress={() =>
                setExecuted(
                  v => !v
                )
              }
            >
              {executed
                ? '✓ 이번 경험에서 실제로 했어요'
                : '이 행동을 실제로 했어요'}
            </Button>
          ) : null}
        </View>
      ) : null}

      {executed ? (
        <>
          <Text style={s.section}>
            이 행동을 하기 전 마음은?
          </Text>

          <TextInput
            editable={!busy}
            value={beforeMood}
            onChangeText={
              setBeforeMood
            }
            placeholder="예: 답답하고 지쳐 있었어"
            multiline
            style={[
              s.input,
              s.area
            ]}
          />

          {beforeAnalysis?.unknown ? (
            <Text style={s.subtitle}>
              행동 전 감정이 불확실해서 감정별 학습에는 넣지 않고 기록으로 남길게요.
            </Text>
          ) : null}

          {memory ? (
            <View style={s.notice}>
              <Text style={s.body}>
                🐾 {memory}
              </Text>
            </View>
          ) : null}
          <Text style={s.subtitle}>
            선택 사항: 같은 기준으로 전후 기분을 골라줘.
            {'\n'}
            1점은 매우 나쁨, 5점은 매우 좋음이야.
          </Text>

          <Rating
            label="행동 전 기분"
            value={before}
            onChange={setBefore}
            disabled={busy}
          />

          <Rating
            label="행동 후 기분"
            value={after}
            onChange={setAfter}
            disabled={busy}
          />

          <Button
            secondary
            disabled={busy}
            onPress={() => {
              setBefore(0);
              setAfter(0);
            }}
          >
            전후 점수 선택 취소
          </Button>
        </>
      ) : null}

      <Rating
        label="이 경험, 어땠어?"
        value={satisfaction}
        onChange={
          setSatisfaction
        }
        disabled={busy}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={s.error}
        >
          {error}
        </Text>
      ) : null}

      <Button
        disabled={busy}
        onPress={save}
      >
        {busy
          ? '저장 중…'
          : '오늘의 경험 기록하기'}
      </Button>
    </ScrollView>
  );
}