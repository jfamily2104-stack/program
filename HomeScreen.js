import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform, TextInput } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from './PlatformMap';
import { coordinateOf, locationLabel } from './DataUtils';
import { s, Button, Avatar, Stars, MediaGallery, DeleteButton } from './UI';

export default function HomeScreen({
  character,
  experiences = [],
  plannedExperiences = [],
  onTryExperience,
  onDeleteExperience,
  onNavigate
}) {
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const filtered = useMemo(() => {
    const key = query.trim().toLowerCase().replace(/\s+/g, '');
    return experiences.filter(x => (!mineOnly || x.userId === 'me') &&
      (!key || [x.title, x.text, x.mood, x.emotionName, locationLabel(x), ...(x.tags || [])]
        .join(' ').toLowerCase().replace(/\s+/g, '').includes(key)));
  }, [experiences, query, mineOnly]);
  const [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [showUser, setShowUser] = useState(false);

  const request = useRef(0);

  useEffect(() => {
    let alive = true;

    Location.getForegroundPermissionsAsync()
      .then(p => {
        if (alive) setShowUser(p.granted);
      })
      .catch(() => {});

    return () => {
      alive = false;
      request.current++;
    };
  }, []);

  const mapped = useMemo(
    () => filtered.filter(x => coordinateOf(x.location)),
    [filtered]
  );

  const planned = id =>
    plannedExperiences.some(
      x => String(x.sourceId) === String(id)
    );

  const close = () => {
    request.current++;
    setSelected(null);
    setError('');
  };

  const select = async exp => {
    const token = ++request.current;

    setSelected(exp);
    setError('');

    if (
      Platform.OS === 'web' ||
      exp.locationName ||
      exp.locationAddress ||
      exp.location?.name ||
      exp.location?.address ||
      !coordinateOf(exp.location)
    )
      return;

    try {
      const results = await Location.reverseGeocodeAsync(
        coordinateOf(exp.location)
      );

      const first = results[0];
      if (!first || token !== request.current) return;

      const address = [
        first.country,
        first.region,
        first.city,
        first.district,
        first.street,
        first.streetNumber
      ]
        .filter((x, i, a) => x && a.indexOf(x) === i)
        .join(' ');

      setSelected(current =>
        current?.id === exp.id
          ? {
              ...current,
              locationName: first.name || null,
              locationAddress: address || null
            }
          : current
      );
    } catch (e) {}
  };

  const tryExperience = async () => {
    if (busy || !selected) return;

    const exp = selected;

    setBusy(true);

    try {
      if (!planned(exp.id)) await onTryExperience(exp);

      close();

      onNavigate('record', String(exp.id));
    } catch (e) {
      setError('저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={[s.between, { padding: 20 }]}>
        <View>
          <Text style={s.eyebrow}>오늘, 어땠어?</Text>

          <Text
            style={[
              s.title,
              {
                fontSize: 23,
                lineHeight: 31
              }
            ]}
          >
            지금 주변의 이야기를{'\n'}만나보자
          </Text>
        </View>

        <Pressable onPress={() => onNavigate('character')}>
          <Avatar character={character} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
        <TextInput value={query} onChangeText={setQuery} style={s.input}
          accessibilityLabel="경험 검색" placeholder="제목·내용·감정·장소 검색" />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: mineOnly }}
          onPress={() => setMineOnly(!mineOnly)} style={{ paddingVertical: 10 }}>
          <Text>{mineOnly ? '☑' : '☐'} 내가 쓴 기록만 · 검색 결과 {filtered.length}개</Text>
        </Pressable>
      </View>

      <View
        style={{
          flex: 1,
          minHeight: 180,
          marginHorizontal: 12,
          borderRadius: 24,
          overflow: 'hidden'
        }}
      >
        <MapView
          style={{ flex: 1 }}
          mapType="satellite"
          initialRegion={{
            latitude: 37.5665,
            longitude: 126.978,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04
          }}
          showsUserLocation={showUser}
          showsMyLocationButton={showUser}
        >
          {mapped.map(x => (
            <Marker
              key={x.id}
              coordinate={coordinateOf(x.location)}
              title={x.title}
              onPress={() => select(x)}
            >
              <Avatar character={x.character} size={32} />
            </Marker>
          ))}
        </MapView>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            padding: 10,
            borderRadius: 14,
            backgroundColor: '#FFFFFFEE'
          }}
        >
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: '#555'
            }}
          >
            지도 {mapped.length}개 · 전체 {experiences.length}개 경험
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ maxHeight: 170 }}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingVertical: 8
        }}
      >
        {!filtered.length && <Text style={s.subtitle}>검색 결과가 없어요. 다른 단어나 필터로 찾아보세요.</Text>}
        {filtered.map(x => (
          <Pressable
            key={x.id}
            style={[s.row, { paddingVertical: 9 }]}
            onPress={() => select(x)}
          >
            <Avatar character={x.character} size={34} />

            <View style={{ flex: 1 }}>
              <Text style={s.body} numberOfLines={1}>
                {x.title}
              </Text>

              <Text style={s.eyebrow}>
                {x.isExample ? '예시 · ' : ''}
                {locationLabel(x)}
              </Text>
            </View>

            <Text>→</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ padding: 18 }}>
        <Text style={s.strong}>오늘의 작은 발견</Text>

        <Text style={s.subtitle}>
          누군가의 하루가 너의 새로운 경험이 될 수 있어.
        </Text>

        <Button onPress={() => onNavigate('explore')}>
          내 상태로 경험 찾기 →
        </Button>
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <ScrollView>
              {selected ? (
                <>
                  <View style={s.row}>
                    <Avatar character={selected.character} />

                    <View style={{ flex: 1 }}>
                      <Text style={s.strong}>
                        {selected.author ||
                          selected.character?.name ||
                          '누군가'}
                      </Text>

                      <Text style={s.subtitle}>
                        {selected.character?.typeName}
                        {selected.isExample
                          ? ' · 예시 경험'
                          : selected.userId === 'me'
                          ? ' · 내 기록'
                          : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={[s.subtitle, { marginTop: 18 }]}>
                    {selected.emotionName || selected.mood}
                  </Text>

                  <Text style={[s.title, { fontSize: 24 }]}>
                    {selected.title}
                  </Text>

                  <Text style={[s.body, { marginTop: 12 }]}>
                    {selected.text}
                  </Text>

                  <View style={s.notice}>
                    <Text style={s.body}>
                      📍 {locationLabel(selected)}
                    </Text>
                  </View>

                  <Stars value={selected.satisfaction} />
                  <MediaGallery media={selected.media} />

                  {error ? (
                    <Text style={s.error}>{error}</Text>
                  ) : null}

                  {selected.userId === 'me' ? (
                    <DeleteButton
                      onDelete={async () => {
                        await onDeleteExperience(selected.id);
                        close();
                      }}
                    />
                  ) : (
                    <Button
                      disabled={busy}
                      onPress={tryExperience}
                    >
                      {busy
                        ? '저장 중…'
                        : planned(selected.id)
                        ? '✓ 기록 탭에서 해볼 경험'
                        : '나도 해볼래'}
                    </Button>
                  )}

                  <Button secondary onPress={close}>
                    닫기
                  </Button>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}