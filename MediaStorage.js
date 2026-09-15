import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const asDataURL = async uri => {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('사진이나 영상을 읽지 못했어요. 다시 선택해주세요.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('첨부 파일을 읽지 못했어요.'));
    reader.readAsDataURL(blob);
  });
};

export async function prepareMedia(assets) {
  const created = [];
  const rollback = async () => {
    await Promise.all(created.map(uri => FileSystem.deleteAsync(uri, { idempotent: true })));
  };
  try {
    const saved = [];
    for (const value of Array.isArray(assets) ? assets : []) {
      const asset = typeof value === 'string' ? { uri: value } : value;
      if (!asset?.uri) continue;
      let uri = asset.uri;
      if (Platform.OS === 'web') {
        if (uri.startsWith('blob:')) uri = await asDataURL(uri);
      } else if (!/^(https?:|data:)/i.test(uri)) {
        if (!FileSystem.documentDirectory) throw new Error('파일 저장 공간을 사용할 수 없어요.');
        const directory = `${FileSystem.documentDirectory}record-media/`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        const extension = (asset.fileName || uri.split('?')[0]).match(/\.([a-z0-9]{1,8})$/i)?.[1]
          || (asset.type === 'video' ? 'mp4' : 'jpg');
        uri = `${directory}${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        created.push(uri);
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
      }
      saved.push({ ...asset, uri });
    }
    return { assets: saved, rollback };
  } catch (error) {
    await rollback().catch(() => {});
    throw error;
  }
}
