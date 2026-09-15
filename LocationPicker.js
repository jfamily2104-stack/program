import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TextInput, Platform } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from './PlatformMap';
import { coordinateOf, locationLabel } from './DataUtils';
import { s, Button } from './UI';

const addressOf = x =>
  [
    x?.country,
    x?.region,
    x?.city,
    x?.district,
    x?.street,
    x?.streetNumber
  ]
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .join(' ');

export default function LocationPicker({
  value,
  onChange,
  disabled
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [results, setResults] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [region, setRegion] = useState(null);

  const generation = useRef(0),
    searchGeneration = useRef(0),
    alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      generation.current++;
      searchGeneration.current++;
    };
  }, []);

  const setCoordinate = async (
    coordinate,
    name = '지도에서 선택한 장소'
  ) => {
    const point = coordinateOf(coordinate);

    if (!point) return;

    const token = ++generation.current;

    onChange({
      ...point,
      name
    });

    setRegion({
      ...point,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02
    });

    if (Platform.OS === 'web') return;

    try {
      const rows = await Location.reverseGeocodeAsync(point);

      if (!alive.current || token !== generation.current) return;

      onChange({
        ...point,
        name:
          (name === '현재 위치' || name === '지도에서 선택한 장소')
            ? rows[0]?.name || name
            : name,
        address: addressOf(rows[0])
      });
    } catch (e) {}
  };

  const current = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    const token = ++generation.current;

    try {
      const p = await Location.requestForegroundPermissionsAsync();

      if (!p.granted)
        throw new Error(
          '위치 권한이 없어도 장소 없이 기록할 수 있어요.'
        );

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      if (alive.current && token === generation.current)
        await setCoordinate(pos.coords, '현재 위치');
    } catch (e) {
      if (alive.current)
        setError(
          e.message || '현재 위치를 찾지 못했어요.'
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const search = async () => {
    const q = query.trim();

    if (!q || busy) return;

    const token = ++searchGeneration.current;

    setBusy(true);
    setError('');

    try {
      if (Platform.OS === 'android') {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (!permission.granted)
          throw new Error(
            '주소 검색에는 위치 권한이 필요해요. 지도에서 직접 선택하거나 장소 없이 기록해주세요.'
          );
      }

      const rows = await Location.geocodeAsync(q);

      if (
        alive.current &&
        token === searchGeneration.current
      ) {
        setResults(
          rows
            .filter(coordinateOf)
            .slice(0, 5)
            .map(x => ({
              ...x,
              name: q
            }))
        );

        if (!rows.length)
          setError(
            '검색 결과가 없어요. 도로명 주소로 다시 검색해주세요.'
          );
      }
    } catch (e) {
      if (alive.current)
        setError(
          e.message || '주소를 찾지 못했어요.'
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  };

  const close = () => {
    generation.current++;
    searchGeneration.current++;
    setOpen(false);
    setBusy(false);
  };

  return (
    <>
      <Button
        secondary
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        📍 {locationLabel({ location: value })} · 변경
      </Button>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={close}
      >
        <View
          style={[
            s.container,
            {
              padding: 18,
              paddingTop: 55
            }
          ]}
        >
          <View style={s.between}>
            <Text style={s.strong}>게시할 장소 선택</Text>

            <Button secondary onPress={close}>
              닫기
            </Button>
          </View>

          <Button disabled={busy} onPress={current}>
            {busy ? '확인 중…' : '현재 위치 사용'}
          </Button>

          {Platform.OS !== 'web' ? (
            <>
              <TextInput
                value={query}
                onChangeText={v => {
                  searchGeneration.current++;
                  setQuery(v);
                  setResults([]);
                }}
                style={s.input}
                placeholder="도로명 주소 또는 장소명"
              />

              <Button
                secondary
                disabled={busy}
                onPress={search}
              >
                주소 검색
              </Button>

              {results.map((x, i) => (
                <Button
                  key={`${x.latitude}-${x.longitude}-${i}`}
                  secondary
                  onPress={() => {
                    setResults([]);
                    setCoordinate(x, x.name);
                  }}
                >
                  {x.name}
                </Button>
              ))}
            </>
          ) : (
            <Text style={s.subtitle}>
              웹에서는 현재 위치를 사용하거나 장소 없이 기록할 수 있어요.
              주소 검색과 지도 선택은 모바일에서 지원해요.
            </Text>
          )}

          {error ? (
            <Text style={s.error}>{error}</Text>
          ) : null}

          <MapView
            style={{
              flex: 1,
              minHeight: 120,
              marginTop: 12
            }}
            region={
              region || {
                ...(coordinateOf(value) || {
                  latitude: 37.5665,
                  longitude: 126.978
                }),
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
              }
            }
            onRegionChangeComplete={setRegion}
            onPress={e =>
              setCoordinate(e.nativeEvent.coordinate)
            }
          >
            {coordinateOf(value) ? (
              <Marker coordinate={coordinateOf(value)} />
            ) : null}
          </MapView>

          <Button
            secondary
            onPress={() => {
              generation.current++;
              onChange(null);
              close();
            }}
          >
            장소 없이 기록
          </Button>

          <TextInput
            value={value?.name || ''}
            editable={!disabled}
            onChangeText={name => {
              generation.current++;
              if (coordinateOf(value)) onChange({ ...value, name });
            }}
            style={s.input}
            placeholder="장소 이름 (예: 집 앞 공원)"
            accessibilityLabel="장소 이름"
          />
          <Text style={s.subtitle}>{locationLabel({ location: value })}</Text>

          <Button disabled={busy} onPress={close}>
            이 장소로 설정
          </Button>
        </View>
      </Modal>
    </>
  );
}
