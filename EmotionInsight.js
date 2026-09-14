import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { EMOTION_GROUPS, selectEmotion } from './EmotionAlgorithm';

export default function EmotionInsight({ analysis, onChange, disabled = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!analysis) return null;
  const phrases = [...new Set((analysis.evidence || [])
    .filter(e => e.groupId === analysis.groupId).flatMap(e => e.phrases))].slice(0, 4);
  return (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <Text style={{ color: '#52645C', fontSize: 13, lineHeight: 20 }}>
        {analysis.source === 'self_reported' ? '내가 직접 선택한 감정이에요.' :
          analysis.source === 'follow_up' ? '추가 질문에 고른 답을 우선 반영했어요.' :
          phrases.length ? `분석 단서: ${phrases.map(p => `“${p}”`).join(', ')}` : '뚜렷한 표현이 적어요. 직접 골라도 괜찮아요.'}
      </Text>
      {!!analysis.contextNotes?.length && (
        <Text style={{ color: '#666', fontSize: 12 }}>
          덜 반영한 표현: {analysis.contextNotes.join(' · ')}
        </Text>
      )}
      <Text style={{ color: '#777', fontSize: 12, lineHeight: 18 }}>
        기기 안에서 문장 규칙으로 추정해요. 의학적 진단이나 정확도 확률이 아니며, 내 느낌이 우선이에요.
      </Text>
      {onChange && (
        <Pressable disabled={disabled} accessibilityRole="button" accessibilityState={{ expanded, disabled }}
          onPress={() => setExpanded(!expanded)} style={{ paddingVertical: 10 }}>
          <Text style={{ color: '#355C4A', fontWeight: '700' }}>
            {expanded ? '감정 선택 닫기 ∧' : '내 감정 직접 고르기 ∨'}
          </Text>
        </Pressable>
      )}
      {expanded && onChange && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(EMOTION_GROUPS).map(([id, group]) => (
            <Pressable key={id} disabled={disabled} accessibilityRole="button"
              accessibilityState={{ selected: analysis.groupId === id, disabled }}
              onPress={() => { onChange(selectEmotion(analysis, id)); setExpanded(false); }}
              style={{ padding: 12, borderRadius: 16, backgroundColor: analysis.groupId === id ? '#D6E9DE' : '#F0F1EF' }}>
              <Text style={{ color: '#263B30' }}>{group.emoji} {group.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}