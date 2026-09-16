import { emotionClauses, keywordMatches } from './EmotionText';

// Curated extensions supplement, rather than replace, the existing emotion vocabulary.
export const EMOTION_VOCABULARY = {
  happy: '기쁘|유쾌|흐뭇|희열|황홀|희희낙락|행복감|기분이날아갈|입꼬리가올라|웃음이나|신났|기분좋음|개좋|존좋',
  excitement: '설렘|설렌|짜릿|호기롭|흥미진진|흥미가생|흥미롭|기대된다|기대됩니다',
  calm: '괜찮아|괜찮네|괜찮다|괜찮음|괜찮습니다|평정심|평안|안온|평온무사|마음이편해|마음이편하|차분해졌|긴장하지않|걱정이없|걱정없|불안하지않|불안하진않',
  boredom: '따분|지겹|염증이느껴|권태롭|단조롭|흥미를잃|시간이안감|노잼|현타',
  tired: '지치|고단|노곤|나른|기진맥진|탈진|기력이고갈|기력없|체력이바닥|진빠|졸리|잠이부족|기운이없|기운없|힘이없|체력이딸|피로|몸이천근만근',
  frustration: '울분|갑갑|심란|애가타|속이터지|속터|막막|옴짝달싹못|진퇴양난|진절머리|멘붕|스트래스|스트레쓰',
  loneliness: '고독|적적|적막|외톨이|소외감|고립감|홀로남|마음붙일곳이없|기댈곳이없|말동무가없',
  sadness: '비통|비애|애통|침울|비탄|애잔|서글프|서럽|울적|울먹|울었|울었다|울었어|울어요|울고있|울음이나|마음이저려|가슴이미어|눈시울이붉어',
  anxiety: '염려|근심|노심초사|좌불안석|전전긍긍|조바심|불안감|긴장감|조마조마|초조감|걱정됨|걱정되|두렵|무섭|겁난|안절부절못',
  overload: '무기력감|의욕이없|의욕없|의욕이안나|의욕이안생|버겁|과중|과부하|중압감|압도당|탈력감|손에안잡|손에잡히지않|아무것도하기싫|꼼짝하기싫|감당할수없|부담스럽',
  anger: '격분|격노|분개|분통|노여움|울화통|치가떨|이가갈|화남|화난|화낼|화났|열뻗|빡치|빡침|빡쳤|개빡|분하',
  pride: '대견|뿌듯|긍지|자긍심|성취했|해냈|해냄|자랑스럽',
  gratitude: '고맙|감격|감사한마음|고마움|감사함',
  relief: '안심|홀가분|가슴을쓸어내|한시름놓|십년감수|한숨돌리|한숨돌렸|마음이놓이|마음이놓였',
  disappointment: '낙담|낙심|기대이하|허망|실의|김빠|허탈|아쉬움|아쉽',
  regret: '회한|회오|뉘우|후회막급|안했어야|하지말았어야|말았어야했|했어야했|할걸그랬',
  embarrassment: '당혹|당황|낯뜨거|부끄럽|민망함|쑥스럽',
  confusion: '혼돈|착잡|혼미|혼란스럽|갈팡질팡|우왕좌왕|오리무중|갈피를못잡|감정을모르|마음을모르|뭘느끼는지모르',
  nostalgia: '그립|향수에젖|사무치게보고싶|옛날이생각나',
  envy: '부럽|시샘|선망|질시|배가아플만큼부럽',
  touched: '감명|감화|뭉클|뭉근한감동|가슴이벅차올|눈물겹',
  contentment: '흡족|충족감|만족스럽|충만감',
  hope: '낙관|희망적|한줄기빛|용기가생|다시일어설|해낼수있|잘될거|나아질거',
  affection: '애틋|애착|연모|다정|소중하|소중함',
  guilt: '송구|면목이없|죄스러|양심의가책|미안함|죄책',
  shame: '자괴감|자기혐오|모멸감|자학|수치심|자기비하|한심하|한심해',
  insecurity: '위축|열등감|자격지심|자신없|자신이없|확신이없|주눅|초라|의기소침',
  emptiness: '허무감|허무하|허무해|허무함|공허감|상실감|허전함|무감흥|무감각|무상함|덧없|허전하',
  resentment: '분하다|섭섭|원통|서러움|원망스럽|배신감',
  disgust: '역겹|역겨|거북하|거북해|진저리|정떨어|거부감|혐오감',
  awe: '경탄|경이롭|경외|신비롭|장엄|감탄스럽',
  anticipation: '손꼽아기다|기다려지|기다려져|기다려짐',
  irritation: '성가시|거슬리|신경질적|짜증남|짜증난|짜증났|짜증나요',
  vulnerability: '예민해졌|마음이여려|마음이약해졌|상처받았|상처받음',
  distress: '괴롭|고통스럽|비참|참담|참척|힘겹|견디기어렵|견딜수없|견딜수도없',
};

export const NEED_VOCABULARY = {
  rest: '쉬고싶|쉬고싶음|쉬고싶네|쉬고싶다|쉬려|쉬려고|휴식이필요|휴식을취하고싶|쉬었으면|누워있고싶|잠좀자|푹자고싶|재충전하고싶',
  alone: '혼자있고싶|혼자있으려|혼자시간|혼자만의시간|사람을만나기싫|친구를만나기싫|연락하고싶지않|혼자쉬고싶',
  connection: '친구를만나고싶|사람을만나고싶|만나고싶|얘기하고싶|이야기하고싶|말동무|수다떨고싶|함께있고싶|소통하고싶',
  new: '도전하고싶|배우고싶|탐구하고싶|탐험하고싶|체험하고싶|시도하고싶',
  organize: '생각을정리|마음을정리|우선순위|정돈하고싶',
  comfort: '위로해줬으면|안아줬으면|이해받고싶|토닥여줬으면',
  release: '발산하고싶|털어버리고싶|해소하고싶',
};

export const ACTIVITY_VOCABULARY = {
  creative: '그려|그렸|그림을그리|그림그리|드로잉|스케치|뜨개질|뜨개|뜨개질했|자수|도예|작곡|작사|연주|피아노|기타를치|노래를부르|노래불렀|춤췄|춤추|베이킹|글을써|글썼|일기를썼|일기썼|사진촬영|사진을촬영|사진찍|사진을찍|요리했|요리하',
  exercise: '걷습|걸으|걸을|걸어|걸었|걷고|걷는|걷겠다|걷다|걷기|뛰고|뛰었|뛰는|달려|달렸|러닝|런닝|조깅|클라이밍|필라테스|스쿼트|웨이트|홈트|자전거탔|자전거를탔|자전거타|수영했|배드민턴쳤|산책했|산책하',
  learning: '읽었|읽고|읽는|읽겠|독서했|공부했|공부하|배워|배웠|학습|탐구|탐독|정독|수강|문제풀|문제를풀|문제를풀었|암기|복습했|코딩|프로그래밍|외국어',
  social: '만났|만나고|만나려|만날|만남|대화하|대화했|이야기했|얘기하|얘기했|수다|담소|통화하|통화했|연락하|연락했|친목|회식|동아리|봉사|상담받',
  rest: '쉬어|쉬었|쉬는|쉬겠|쉬려|쉬고|휴식|휴양|명상|호흡연습|누웠|누워|잠잤|잠을잤|잠자|잠을자|숙면|낮잠|멍때|멍때리|휴식취',
  nature: '트레킹|트래킹|하이킹|삼림욕|산림욕|숲길|해변|해돋이|일몰|나들이|소풍|꽃구경|별을보|풍경감상',
  food: '먹었|먹고|먹는|먹겠|먹으려|먹을|맛봤|마셨|마시고|마시는|식사했|식사하|외식|브런치|차한잔|차를마|맛집',
  digital: '게임했|게임하|플레이했|정주행|시청|영화를봤|영화봤|드라마봤|영상봤|웹툰|팟캐스트|오디오북',
  work: '일하|일했|작업|야근|보고서|발표준비|시험준비|과제했|숙제했|설거지했|정돈|청소하|청소했|정리하|정리했|빨래|집안일',
  shopping: '장보기|장봤|장을봤|샀|구입|쇼핑했|장만|구매했',
};

export function extendedWords(table, id, original = []) {
  return [...original, ...(table[id] || '').split('|').filter(Boolean)];
}

// Keep observations separate from emotions: going for a walk does not prove happiness.
export function recognizeActivities(input, rules) {
  const mentions = [];
  for (const clause of emotionClauses(input)) {
    const hits = rules.flatMap(rule => keywordMatches(clause,
      extendedWords(ACTIVITY_VOCABULARY, rule.id, rule.patterns), true).map(match => ({ rule, match })));
    for (const { rule, match } of hits) {
      const nextStart = Math.min(clause.text.length, ...hits.filter(h => h.match.start >= match.end).map(h => h.match.start));
      const tail = clause.text.slice(match.end, Math.min(nextStart, match.end + 28));
      const deniesDislike = /^(?:하|을|를|는|은|기|하기)*싫(?:지|진|지는)않/.test(tail);
      const denied = !deniesDislike && (match.negated || /^(?:하|을|를|는|은|기|하기|고싶|하고싶|고싶지|하고싶지)*(?:싫|않|못|안했|안하)/.test(tail));
      const status = clause.weight === 0 ? 'reported' : denied ? 'avoided' :
        clause.weight < 1 ? (clause.reason === '과거의 상태' ? 'completed' : 'hypothetical') :
        /싶|려고|려해|할예정|할계획|할까|해볼|가볼|할래|갈래|을래|겠/.test(tail) || /려$|겠$|을$|할$/.test(match.phrase) ? 'planned' :
        /했|왔|갔|봤|었|았|났|췄|샀|탔|썼/.test(match.phrase + tail.slice(0, 5)) ? 'completed' : 'mentioned';
      mentions.push({ id: rule.id, name: rule.name, emoji: rule.emoji, status, phrase: match.phrase });
    }
  }
  const unique = [...new Map(mentions.map(m => [`${m.id}:${m.status}`, m])).values()];
  const active = unique.filter(m => ['planned', 'completed', 'mentioned'].includes(m.status));
  return { mentions: unique, activities: [...new Map(active.map(({ id, name, emoji }) => [id, { id, name, emoji }])).values()] };
}
