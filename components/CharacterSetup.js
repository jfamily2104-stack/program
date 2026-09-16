import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable
} from 'react-native';
import {
  CHARACTER_TYPES,
  CHARACTER_COLORS,
  CHARACTER_ACCESSORIES,
  normalizeCharacter
} from './CharacterData';
import { s, Button, Avatar } from './UI';

export default function CharacterSetup({
  onComplete
}) {
  const [category, setCategory] = useState('전체'),
    [type, setType] = useState(CHARACTER_TYPES[0]),
    [color, setColor] = useState(CHARACTER_COLORS[0]),
    [accessory, setAccessory] = useState(
      CHARACTER_ACCESSORIES[0]
    ),
    [name, setName] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');

  const character = normalizeCharacter({
    type: type.id,
    color: color.id,
    accessory: accessory.id,
    name: name.trim() || type.name
  });

  const finish = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await onComplete({
        ...character,
        createdAt: Date.now()
      });
    } catch (e) {
      setError(
        '저장하지 못했어요. 다시 시도해주세요.'
      );

      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>
        나의 동반 캐릭터를 골라보세요
      </Text>

      <Text style={s.subtitle}>
        이 캐릭터는 앞으로 나와 함께 경험을 쌓아가요.
      </Text>

      <View
        style={[
          s.card,
          {
            backgroundColor: color.value,
            alignItems: 'center',
            padding: 25
          }
        ]}
      >
        <Avatar character={character} size={120} />

        <Text
          style={[
            s.strong,
            {
              marginTop: 12,
              backgroundColor: '#FFFFFFCC',
              padding: 8,
              borderRadius: 10
            }
          ]}
        >
          {character.name}
        </Text>
      </View>

      <Text style={s.section}>종류</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {[
          '전체',
          ...new Set(
            CHARACTER_TYPES.map(x => x.category)
          )
        ].map(x => (
          <Button
            key={x}
            secondary={x !== category}
            onPress={() => setCategory(x)}
            style={{
              marginRight: 7
            }}
          >
            {x}
          </Button>
        ))}
      </ScrollView>

      <View
        style={[
          s.wrap,
          {
            marginTop: 12
          }
        ]}
      >
        {CHARACTER_TYPES.filter(
          x =>
            category === '전체' ||
            x.category === category
        ).map(x => (
          <Pressable
            key={x.id}
            onPress={() => setType(x)}
            accessibilityLabel={x.name}
            style={[
              {
                width: '22%',
                minHeight: 78,
                backgroundColor: '#FFF',
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center'
              },
              type.id === x.id && s.selected
            ]}
          >
            <Text style={{ fontSize: 28 }}>
              {x.emoji}
            </Text>

            <Text
              style={{
                fontSize: 10,
                color: '#555',
                textAlign: 'center'
              }}
            >
              {x.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.section}>색상</Text>

      <View style={s.wrap}>
        {CHARACTER_COLORS.map(x => (
          <Pressable
            key={x.id}
            accessibilityLabel={x.name}
            onPress={() => setColor(x)}
            style={[
              {
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: x.value,
                borderWidth: 2,
                borderColor: '#FFF'
              },
              x.id === color.id && s.selected
            ]}
          />
        ))}
      </View>

      <Text style={s.section}>작은 포인트</Text>

      <View style={s.wrap}>
        {CHARACTER_ACCESSORIES.map(x => (
          <Pressable
            key={x.id}
            onPress={() => setAccessory(x)}
            style={[
              s.chip,
              x.id === accessory.id && s.selected
            ]}
          >
            <Text style={s.chipText}>
              {x.emoji || '—'} {x.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.section}>캐릭터 이름</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={12}
        placeholder="예: 몽이, 별이, 콩이"
        style={s.input}
      />

      <View style={s.notice}>
        <Text style={s.strong}>
          🔒 캐릭터는 한 번 선택하면 고정돼요
        </Text>

        <Text style={s.subtitle}>
          캐릭터의 기본 정체성은 바뀌지 않아요.
        </Text>
      </View>

      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : null}

      <Button onPress={finish} disabled={busy}>
        {busy
          ? '저장 중…'
          : '이 캐릭터와 시작하기'}
      </Button>
    </ScrollView>
  );
}