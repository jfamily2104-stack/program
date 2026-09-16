import React from 'react';
import { View, Text } from 'react-native';

export function Marker() {
  return null;
}

export default function MapView({ style }) {
  return (
    <View
      style={[
        {
          minHeight: 180,
          backgroundColor: '#F0EFEB',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        },
        style
      ]}
    >
      <Text
        style={{
          color: '#777',
          textAlign: 'center',
          lineHeight: 20
        }}
      >
        지도는 모바일 앱에서 표시돼요.
      </Text>
    </View>
  );
}