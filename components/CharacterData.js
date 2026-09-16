const groups = {
  사람: [
    ['person', '사람', '🙂'],
    ['student', '학생', '🎓'],
    ['worker', '직장인', '💼'],
    ['artist', '예술가', '🎨'],
    ['traveler', '여행가', '🧳'],
    ['chef', '요리사', '👨‍🍳'],
    ['scientist', '과학자', '🔬'],
    ['musician', '음악가', '🎸']
  ],

  동물: [
    ['dog', '강아지', '🐶'],
    ['puppy', '아기 강아지', '🐕'],
    ['shiba', '시바견', '🐕‍🦺'],
    ['poodle', '푸들', '🐩'],
    ['cat', '고양이', '🐱'],
    ['blackcat', '검은 고양이', '🐈‍⬛'],
    ['kitten', '아기 고양이', '🐈'],
    ['rabbit', '토끼', '🐰'],
    ['bear', '곰', '🐻'],
    ['panda', '판다', '🐼'],
    ['koala', '코알라', '🐨'],
    ['fox', '여우', '🦊'],
    ['hamster', '햄스터', '🐹'],
    ['mouse', '생쥐', '🐭'],
    ['hedgehog', '고슴도치', '🦔'],
    ['monkey', '원숭이', '🐵'],
    ['lion', '사자', '🦁'],
    ['tiger', '호랑이', '🐯'],
    ['frog', '개구리', '🐸'],
    ['pig', '돼지', '🐷'],
    ['cow', '소', '🐮'],
    ['deer', '사슴', '🦌'],
    ['otter', '수달', '🦦']
  ],

  새: [
    ['chick', '병아리', '🐥'],
    ['bird', '새', '🐦'],
    ['duck', '오리', '🦆'],
    ['owl', '부엉이', '🦉'],
    ['penguin', '펭귄', '🐧'],
    ['parrot', '앵무새', '🦜']
  ],

  식물: [
    ['sprout', '새싹', '🌱'],
    ['plant', '화분', '🪴'],
    ['cactus', '선인장', '🌵'],
    ['flower', '꽃', '🌸'],
    ['sunflower', '해바라기', '🌻'],
    ['cherry', '벚꽃', '🌸'],
    ['fourleaf', '네잎클로버', '🍀'],
    ['tree', '나무', '🌳'],
    ['mushroom', '버섯', '🍄']
  ],

  자연: [
    ['cloud', '구름', '☁️'],
    ['sun', '태양', '☀️'],
    ['moon', '달', '🌙'],
    ['star', '별', '⭐'],
    ['rainbow', '무지개', '🌈'],
    ['snow', '눈송이', '❄️'],
    ['raindrop', '빗방울', '💧'],
    ['fire', '불꽃', '🔥']
  ],

  사물: [
    ['bread', '빵', '🍞'],
    ['coffee', '커피', '☕'],
    ['cup', '컵', '🥤'],
    ['book', '책', '📖'],
    ['pencil', '연필', '✏️'],
    ['camera', '카메라', '📷'],
    ['music', '음표', '🎵'],
    ['cookie', '쿠키', '🍪']
  ],

  상상: [
    ['ghost', '유령', '👻'],
    ['alien', '외계인', '👽'],
    ['fairy', '요정', '🧚'],
    ['dragon', '드래곤', '🐉'],
    ['unicorn', '유니콘', '🦄'],
    ['monster', '몬스터', '👾'],
    ['robot', '로봇', '🤖'],
    ['starcreature', '별 생명체', '🌟']
  ]
};

export const CHARACTER_TYPES = Object.entries(groups).flatMap(
  ([category, items]) =>
    items.map(([id, name, emoji]) => ({
      id,
      name,
      emoji,
      category
    }))
);

export const CHARACTER_COLORS = [
  ['cream', '크림', '#FFF4D6'],
  ['yellow', '노랑', '#FFE66D'],
  ['pink', '분홍', '#FFB7C5'],
  ['red', '빨강', '#FF8A80'],
  ['orange', '주황', '#FFB067'],
  ['green', '초록', '#9BE7A5'],
  ['mint', '민트', '#9DE7D7'],
  ['blue', '하늘', '#9FD7FF'],
  ['purple', '보라', '#C7B5FF'],
  ['brown', '갈색', '#C79B75'],
  ['gray', '회색', '#D5D5D5'],
  ['black', '검정', '#333333']
].map(([id, name, value]) => ({
  id,
  name,
  value
}));

export const CHARACTER_ACCESSORIES = [
  ['none', '없음', ''],
  ['ribbon', '리본', '🎀'],
  ['hat', '모자', '🎩'],
  ['glasses', '안경', '👓'],
  ['headphones', '헤드폰', '🎧'],
  ['flower', '꽃', '🌼'],
  ['star', '별', '⭐'],
  ['scarf', '목도리', '🧣'],
  ['backpack', '가방', '🎒'],
  ['crown', '왕관', '👑'],
  ['bow', '나비넥타이', '🦋'],
  ['leaf', '잎사귀', '🍃'],
  ['heart', '하트', '💗'],
  ['sparkle', '반짝이', '✨'],
  ['camera', '카메라', '📷']
].map(([id, name, emoji]) => ({
  id,
  name,
  emoji
}));

export function normalizeCharacter(saved) {
  if (!saved || typeof saved !== 'object' || !saved.type)
    return null;

  const type =
    CHARACTER_TYPES.find(x => x.id === saved.type) ||
    CHARACTER_TYPES[0];

  const aliases = {
    lavender: 'purple',
    sky: 'blue',
    gold: 'yellow',
    rainbow: 'cream'
  };

  const color =
    CHARACTER_COLORS.find(
      x => x.id === (aliases[saved.color] || saved.color)
    ) || CHARACTER_COLORS[0];

  const accessory =
    CHARACTER_ACCESSORIES.find(
      x =>
        x.id ===
        (saved.accessory === 'bandana' ? 'hat' : saved.accessory)
    ) || CHARACTER_ACCESSORIES[0];

  return {
    ...saved,
    type: type.id,
    typeName: type.name,
    emoji: type.emoji,
    color: color.id,
    colorName: color.name,
    colorValue: color.value,
    accessory: accessory.id,
    accessoryName: accessory.name,
    accessoryEmoji: accessory.emoji,
    name:
      typeof saved.name === 'string' && saved.name.trim()
        ? saved.name.trim()
        : type.name
  };
}