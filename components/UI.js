import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  useWindowDimensions
} from 'react-native';

import {
  Video,
  ResizeMode
} from 'expo-av';

import {
  clamp,
  finiteNumber
} from './DataUtils';

export const s =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#FAFAF8'
    },

    content: {
      padding: 20,
      paddingBottom: 50
    },

    title: {
      fontSize: 28,
      fontWeight: '900',
      color: '#222',
      lineHeight: 36
    },

    subtitle: {
      fontSize: 13,
      color: '#888',
      lineHeight: 21,
      marginTop: 6
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      color: '#999'
    },

    section: {
      fontSize: 18,
      fontWeight: '800',
      color: '#222',
      marginTop: 24,
      marginBottom: 10
    },

    card: {
      backgroundColor: '#FFF',
      borderRadius: 22,
      padding: 18,
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#EEE'
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },

    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },

    between: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10
    },

    body: {
      fontSize: 14,
      color: '#555',
      lineHeight: 22
    },

    strong: {
      fontSize: 16,
      fontWeight: '800',
      color: '#222'
    },

    button: {
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 15,
      backgroundColor: '#222',
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 10
    },

    buttonText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 13
    },

    secondary: {
      backgroundColor:
        '#F0EFEB'
    },

    secondaryText: {
      color: '#555'
    },

    input: {
      minHeight: 52,
      padding: 14,
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 16,
      fontSize: 15,
      color: '#222',
      marginTop: 8
    },

    area: {
      minHeight: 105,
      textAlignVertical: 'top',
      lineHeight: 22
    },

    chip: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor:
        '#F0EFEB',
      borderRadius: 14
    },

    chipText: {
      fontSize: 12,
      color: '#555',
      fontWeight: '700'
    },

    selected: {
      borderWidth: 2,
      borderColor: '#222'
    },

    notice: {
      padding: 15,
      borderRadius: 16,
      backgroundColor:
        '#F1F0EC',
      marginTop: 12
    },

    dialogue: {
      backgroundColor: '#FFF',
      borderRadius: 18,
      padding: 17,
      marginTop: 14
    },

    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.5)',
      justifyContent:
        'flex-end'
    },

    modal: {
      backgroundColor: '#FFF',
      maxHeight: '85%',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 22
    },

    rating: {
      fontSize: 22,
      color: '#555'
    },

    error: {
      color: '#B33',
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8
    },

    metricTop: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginBottom: 5
    },

    track: {
      height: 5,
      borderRadius: 5,
      backgroundColor: '#EEE',
      overflow: 'hidden'
    },

    fill: {
      height: '100%',
      backgroundColor: '#444'
    },

    stat: {
      flex: 1,
      alignItems: 'center'
    },

    statNumber: {
      fontSize: 25,
      fontWeight: '800',
      color: '#222'
    },

    statLabel: {
      fontSize: 11,
      color: '#999',
      marginTop: 5
    },

    mediaThumb: {
      width: 76,
      height: 76,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#EEE'
    },

    dark: {
      backgroundColor: '#222',
      borderColor: '#222'
    },

    light: {
      color: '#FFF'
    }
  });

export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        secondary &&
          s.secondary,
        disabled && {
          opacity: 0.5
        },
        style
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary &&
            s.secondaryText
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function Avatar({
  character,
  size = 54
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius:
          size / 3,
        backgroundColor:
          character?.colorValue ||
          '#F2F0EA',
        alignItems: 'center',
        justifyContent:
          'center'
      }}
    >
      <Text
        style={{
          fontSize:
            size * 0.55
        }}
      >
        {character?.emoji ||
          '🙂'}
      </Text>

      {character?.accessoryEmoji ? (
        <Text
          style={{
            position:
              'absolute',
            right: 0,
            top: 0,
            fontSize:
              size * 0.27
          }}
        >
          {
            character
              .accessoryEmoji
          }
        </Text>
      ) : null}
    </View>
  );
}

export function Metric({
  label,
  value = 0
}) {
  const v = clamp(
    finiteNumber(value) ?? 0
  );

  return (
    <View
      style={{
        marginTop: 12
      }}
    >
      <View style={s.metricTop}>
        <Text style={s.eyebrow}>
          {label}
        </Text>

        <Text style={s.eyebrow}>
          {Math.round(v * 100)}
        </Text>
      </View>

      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${
                v * 100
              }%`
            }
          ]}
        />
      </View>
    </View>
  );
}

export function Stars({
  value
}) {
  const count = Math.floor(
    clamp(
      finiteNumber(value) ?? 0,
      0,
      5
    )
  );

  return (
    <Text style={s.rating}>
      {'★'.repeat(count)}
      {'☆'.repeat(5 - count)}
    </Text>
  );
}

export function FollowUp({
  analysis,
  onAnswer
}) {
  if (
    !analysis?.followUp
      ?.options?.length
  )
    return null;

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor:
            '#FFFDF5',
          borderColor:
            '#F0E7C8'
        }
      ]}
    >
      <Text style={s.eyebrow}>
        조금만 더 알려줘
      </Text>

      <Text
        style={[
          s.strong,
          {
            marginTop: 8
          }
        ]}
      >
        {
          analysis.followUp
            .question
        }
      </Text>

      {analysis.followUp
        .description ? (
        <Text style={s.subtitle}>
          {
            analysis.followUp
              .description
          }
        </Text>
      ) : null}

      {analysis.followUp.options.map(
        option => (
          <Button
            key={option.id}
            secondary
            onPress={() =>
              onAnswer(option)
            }
          >
            {option.label}
          </Button>
        )
      )}
    </View>
  );
}

export function MediaGallery({
  media = []
}) {
  const [selected, setSelected] =
      useState(null),
    [error, setError] =
      useState('');

  const {
    width,
    height
  } = useWindowDimensions();

  const assets = media
    .map(x =>
      typeof x === 'string'
        ? {
            uri: x
          }
        : x
    )
    .filter(
      x =>
        typeof x?.uri ===
          'string' &&
        x.uri
    );

  const isVideo = x =>
    x?.type === 'video' ||
    /\.(mp4|mov|m4v|webm)(\?|$)/i.test(
      x?.uri || ''
    ) ||
    String(
      x?.uri
    ).startsWith(
      'data:video/'
    );

  return (
    <>
      <View
        style={[
          s.wrap,
          {
            marginTop: 12
          }
        ]}
      >
        {assets.map(
          (asset, i) => (
            <Pressable
              accessibilityLabel={
                isVideo(asset)
                  ? '영상 열기'
                  : '사진 열기'
              }
              key={`${asset.uri}-${i}`}
              style={s.mediaThumb}
              onPress={() => {
                setError('');
                setSelected(
                  asset
                );
              }}
            >
              {isVideo(
                asset
              ) ? (
                <View
                  style={{
                    flex: 1,
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    backgroundColor:
                      '#333'
                  }}
                >
                  <Text
                    style={{
                      color:
                        '#FFF',
                      fontSize: 25
                    }}
                  >
                    ▶
                  </Text>
                </View>
              ) : (
                <Image
                  source={{
                    uri:
                      asset.uri
                  }}
                  style={{
                    width:
                      '100%',
                    height:
                      '100%'
                  }}
                />
              )}
            </Pressable>
          )
        )}
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelected(null)
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              '#111',
            paddingTop: 50,
            paddingBottom: 25
          }}
        >
          <Button
            secondary
            onPress={() =>
              setSelected(null)
            }
            style={{
              alignSelf:
                'flex-end',
              marginRight: 20
            }}
          >
            닫기
          </Button>

          {selected &&
            (isVideo(
              selected
            ) ? (
              <Video
                source={{
                  uri:
                    selected.uri
                }}
                style={{
                  width,
                  height:
                    height -
                    160
                }}
                useNativeControls
                shouldPlay
                resizeMode={
                  ResizeMode.CONTAIN
                }
                onError={() =>
                  setError(
                    '영상을 열지 못했어요. 파일이 남아 있는지 확인해주세요.'
                  )
                }
              />
            ) : (
              <ScrollView
                maximumZoomScale={
                  3
                }
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent:
                    'center'
                }}
              >
                <Image
                  source={{
                    uri:
                      selected.uri
                  }}
                  style={{
                    width,
                    height:
                      height -
                      170,
                    resizeMode:
                      'contain'
                  }}
                  onError={() =>
                    setError(
                      '사진을 열지 못했어요.'
                    )
                  }
                />
              </ScrollView>
            ))}

          {error ? (
            <Text
              style={[
                s.error,
                {
                  padding: 15
                }
              ]}
            >
              {error}
            </Text>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

export function DeleteButton({
  onDelete
}) {
  const [open, setOpen] =
      useState(false),
    [busy, setBusy] =
      useState(false),
    [error, setError] =
      useState('');

  const remove = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await onDelete();
      setOpen(false);
    } catch (e) {
      setError(
        '삭제를 저장하지 못했어요. 다시 시도해주세요.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        secondary
        onPress={() =>
          setOpen(true)
        }
      >
        게시물 삭제
      </Button>

      <Modal
        visible={open}
        transparent
        onRequestClose={() => {
          if (!busy)
            setOpen(false);
        }}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.strong}>
              게시물을 삭제할까?
            </Text>

            <Text style={s.subtitle}>
              삭제하면 지도와 나의 기록에서 함께 사라져.
            </Text>

            {error ? (
              <Text style={s.error}>
                {error}
              </Text>
            ) : null}

            <Button
              disabled={busy}
              onPress={remove}
            >
              {busy
                ? '삭제 중…'
                : '삭제'}
            </Button>

            <Button
              disabled={busy}
              secondary
              onPress={() =>
                setOpen(false)
              }
            >
              취소
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}