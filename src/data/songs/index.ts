import { SongMeta } from '@/types'

// ===================
// 曲库数据 - 50首小提琴曲目
// ===================

export const songLibrary: SongMeta[] = [
  // =====================================================
  // 第一阶段 - 入门 (10首, difficulty: 1)
  // =====================================================

  // 1. G大调音阶(一个八度)
  {
    id: 'scale-g-major-1oct',
    title: 'G大调音阶',
    titleEn: 'G Major Scale (1 Octave)',
    composer: '基础练习',
    difficulty: 1,
    duration: 30,
    category: 'scale',
    tags: ['音阶', '入门', 'G大调', '一个八度'],
    xpReward: 15,
    musicXmlUrl: '/scores/scale/scale-g-major-1oct.xml',
  },

  // 2. D大调音阶(一个八度)
  {
    id: 'scale-d-major-1oct',
    title: 'D大调音阶',
    titleEn: 'D Major Scale (1 Octave)',
    composer: '基础练习',
    difficulty: 1,
    duration: 30,
    category: 'scale',
    tags: ['音阶', '入门', 'D大调', '一个八度'],
    xpReward: 15,
    musicXmlUrl: '/scores/scale/scale-d-major-1oct.xml',
  },

  // 3. A大调音阶(一个八度)
  {
    id: 'scale-a-major-1oct',
    title: 'A大调音阶',
    titleEn: 'A Major Scale (1 Octave)',
    composer: '基础练习',
    difficulty: 1,
    duration: 30,
    category: 'scale',
    tags: ['音阶', '入门', 'A大调', '一个八度'],
    xpReward: 15,
    musicXmlUrl: '/scores/scale/scale-a-major-1oct.xml',
  },

  // 4. 空弦练习
  {
    id: 'open-strings',
    title: '空弦练习',
    titleEn: 'Open String Exercise',
    composer: '基础练习',
    difficulty: 1,
    duration: 45,
    category: 'etude',
    tags: ['空弦', '入门', '运弓', '基础'],
    xpReward: 20,
    musicXmlUrl: '/scores/etude/open-strings.xml',
  },

  // 5. 长弓练习
  {
    id: 'long-bow',
    title: '长弓练习',
    titleEn: 'Long Bow Exercise',
    composer: '基础练习',
    difficulty: 1,
    duration: 60,
    category: 'etude',
    tags: ['长弓', '入门', '运弓', '音色'],
    xpReward: 20,
    musicXmlUrl: '/scores/etude/long-bow.xml',
  },

  // 6. 小星星
  {
    id: 'twinkle-star',
    title: '小星星',
    titleEn: 'Twinkle Twinkle Little Star',
    composer: '莫扎特 (改编)',
    difficulty: 1,
    duration: 45,
    category: 'piece',
    tags: ['儿歌', '入门', '铃木', '经典'],
    xpReward: 25,
    musicXmlUrl: '/scores/piece/twinkle-star.xml',
  },

  // 7. 玛丽有只小羊羔
  {
    id: 'mary-lamb',
    title: '玛丽有只小羊羔',
    titleEn: 'Mary Had a Little Lamb',
    composer: '美国民谣',
    difficulty: 1,
    duration: 35,
    category: 'piece',
    tags: ['儿歌', '入门', '简单', '经典'],
    xpReward: 20,
    musicXmlUrl: '/scores/piece/mary-lamb.xml',
  },

  // 8. 生日快乐
  {
    id: 'happy-birthday',
    title: '生日快乐',
    titleEn: 'Happy Birthday',
    composer: 'Patty Hill',
    difficulty: 1,
    duration: 25,
    category: 'piece',
    tags: ['庆祝', '入门', '简单', '经典'],
    xpReward: 20,
    musicXmlUrl: '/scores/piece/happy-birthday.xml',
  },

  // 9. 铃儿响叮当
  {
    id: 'jingle-bells',
    title: '铃儿响叮当',
    titleEn: 'Jingle Bells',
    composer: 'James Pierpont',
    difficulty: 1,
    duration: 40,
    category: 'piece',
    tags: ['圣诞', '入门', '欢快', '节日'],
    xpReward: 25,
    musicXmlUrl: '/scores/piece/jingle-bells.xml',
  },

  // 10. 两只老虎
  {
    id: 'two-tigers',
    title: '两只老虎',
    titleEn: 'Two Tigers (Frère Jacques)',
    composer: '法国民谣',
    difficulty: 1,
    duration: 35,
    category: 'piece',
    tags: ['儿歌', '入门', '轮唱', '法国'],
    xpReward: 20,
    musicXmlUrl: '/scores/piece/two-tigers.xml',
  },

  // =====================================================
  // 第二阶段 - 初级 (15首, difficulty: 2)
  // =====================================================

  // 11. G大调音阶(两个八度)
  {
    id: 'scale-g-major-2oct',
    title: 'G大调音阶 (两个八度)',
    titleEn: 'G Major Scale (2 Octaves)',
    composer: '基础练习',
    difficulty: 2,
    duration: 45,
    category: 'scale',
    tags: ['音阶', '初级', 'G大调', '两个八度'],
    xpReward: 25,
    musicXmlUrl: '/scores/scale/scale-g-major-2oct.xml',
  },

  // 12. D大调音阶(两个八度)
  {
    id: 'scale-d-major-2oct',
    title: 'D大调音阶 (两个八度)',
    titleEn: 'D Major Scale (2 Octaves)',
    composer: '基础练习',
    difficulty: 2,
    duration: 45,
    category: 'scale',
    tags: ['音阶', '初级', 'D大调', '两个八度'],
    xpReward: 25,
    musicXmlUrl: '/scores/scale/scale-d-major-2oct.xml',
  },

  // 13. A大调音阶(两个八度)
  {
    id: 'scale-a-major-2oct',
    title: 'A大调音阶 (两个八度)',
    titleEn: 'A Major Scale (2 Octaves)',
    composer: '基础练习',
    difficulty: 2,
    duration: 45,
    category: 'scale',
    tags: ['音阶', '初级', 'A大调', '两个八度'],
    xpReward: 25,
    musicXmlUrl: '/scores/scale/scale-a-major-2oct.xml',
  },

  // 14. G大调琶音
  {
    id: 'arpeggio-g-major',
    title: 'G大调琶音',
    titleEn: 'G Major Arpeggio',
    composer: '基础练习',
    difficulty: 2,
    duration: 30,
    category: 'scale',
    tags: ['琶音', '初级', 'G大调', '和弦'],
    xpReward: 20,
    musicXmlUrl: '/scores/scale/arpeggio-g-major.xml',
  },

  // 15. D大调琶音
  {
    id: 'arpeggio-d-major',
    title: 'D大调琶音',
    titleEn: 'D Major Arpeggio',
    composer: '基础练习',
    difficulty: 2,
    duration: 30,
    category: 'scale',
    tags: ['琶音', '初级', 'D大调', '和弦'],
    xpReward: 20,
    musicXmlUrl: '/scores/scale/arpeggio-d-major.xml',
  },

  // 16. 欢乐颂
  {
    id: 'ode-to-joy',
    title: '欢乐颂',
    titleEn: 'Ode to Joy',
    composer: '贝多芬',
    difficulty: 2,
    duration: 50,
    category: 'piece',
    tags: ['古典', '初级', '贝多芬', '经典'],
    xpReward: 30,
    musicXmlUrl: '/scores/piece/ode-to-joy.xml',
  },

  // 17. 小步舞曲
  {
    id: 'minuet-no1',
    title: '小步舞曲 No.1',
    titleEn: 'Minuet No.1',
    composer: '巴赫',
    difficulty: 2,
    duration: 60,
    category: 'piece',
    tags: ['巴洛克', '初级', '巴赫', '舞曲'],
    xpReward: 35,
    musicXmlUrl: '/scores/piece/minuet-no1.xml',
  },

  // 18. 茉莉花
  {
    id: 'jasmine-flower',
    title: '茉莉花',
    titleEn: 'Jasmine Flower',
    composer: '中国民歌',
    difficulty: 2,
    duration: 55,
    category: 'piece',
    tags: ['中国', '初级', '民歌', '抒情'],
    xpReward: 30,
    musicXmlUrl: '/scores/piece/jasmine-flower.xml',
  },

  // 19. 送别
  {
    id: 'farewell',
    title: '送别',
    titleEn: 'Farewell',
    composer: '李叔同',
    difficulty: 2,
    duration: 50,
    category: 'piece',
    tags: ['中国', '初级', '抒情', '经典'],
    xpReward: 30,
    musicXmlUrl: '/scores/piece/farewell.xml',
  },

  // 20. 康康舞曲
  {
    id: 'can-can',
    title: '康康舞曲',
    titleEn: 'Can-Can',
    composer: '奥芬巴赫',
    difficulty: 2,
    duration: 45,
    category: 'piece',
    tags: ['欢快', '初级', '舞曲', '法国'],
    xpReward: 30,
    musicXmlUrl: '/scores/piece/can-can.xml',
  },

  // 21. 小夜曲
  {
    id: 'serenade-simple',
    title: '小夜曲 (简化版)',
    titleEn: 'Serenade (Simplified)',
    composer: '海顿',
    difficulty: 2,
    duration: 65,
    category: 'piece',
    tags: ['古典', '初级', '海顿', '抒情'],
    xpReward: 35,
    musicXmlUrl: '/scores/piece/serenade-simple.xml',
  },

  // 22. 摇篮曲
  {
    id: 'lullaby-brahms',
    title: '摇篮曲',
    titleEn: 'Lullaby',
    composer: '勃拉姆斯',
    difficulty: 2,
    duration: 55,
    category: 'piece',
    tags: ['古典', '初级', '勃拉姆斯', '抒情'],
    xpReward: 30,
    musicXmlUrl: '/scores/piece/lullaby-brahms.xml',
  },

  // 23. 小蜜蜂
  {
    id: 'little-bee',
    title: '小蜜蜂',
    titleEn: 'Little Bee',
    composer: '德国民谣',
    difficulty: 2,
    duration: 30,
    category: 'piece',
    tags: ['儿歌', '初级', '德国', '活泼'],
    xpReward: 25,
    musicXmlUrl: '/scores/piece/little-bee.xml',
  },

  // 24. 粉刷匠
  {
    id: 'painter',
    title: '粉刷匠',
    titleEn: 'The Painter',
    composer: '波兰民歌',
    difficulty: 2,
    duration: 35,
    category: 'piece',
    tags: ['儿歌', '初级', '波兰', '活泼'],
    xpReward: 25,
    musicXmlUrl: '/scores/piece/painter.xml',
  },

  // 25. 新年好
  {
    id: 'happy-new-year',
    title: '新年好',
    titleEn: 'Happy New Year',
    composer: '英国民谣',
    difficulty: 2,
    duration: 30,
    category: 'piece',
    tags: ['节日', '初级', '新年', '欢快'],
    xpReward: 25,
    musicXmlUrl: '/scores/piece/happy-new-year.xml',
  },

  // =====================================================
  // 第三阶段 - 中级 (15首, difficulty: 3-4)
  // =====================================================

  // 26. 加沃特舞曲
  {
    id: 'gavotte-gossec',
    title: '加沃特舞曲',
    titleEn: 'Gavotte',
    composer: 'Gossec',
    difficulty: 3,
    duration: 90,
    category: 'piece',
    tags: ['巴洛克', '中级', '舞曲', '经典'],
    xpReward: 45,
    musicXmlUrl: '/scores/piece/gavotte-gossec.xml',
  },

  // 27. 幽默曲
  {
    id: 'humoresque',
    title: '幽默曲',
    titleEn: 'Humoresque',
    composer: '德沃夏克',
    difficulty: 3,
    duration: 120,
    category: 'piece',
    tags: ['浪漫', '中级', '德沃夏克', '优美'],
    xpReward: 50,
    musicXmlUrl: '/scores/piece/humoresque.xml',
  },

  // 28. 猎人合唱
  {
    id: 'hunters-chorus',
    title: '猎人合唱',
    titleEn: "Hunter's Chorus",
    composer: '韦伯',
    difficulty: 3,
    duration: 85,
    category: 'piece',
    tags: ['歌剧', '中级', '韦伯', '活力'],
    xpReward: 45,
    musicXmlUrl: '/scores/piece/hunters-chorus.xml',
  },

  // 29. 圣母颂
  {
    id: 'ave-maria-gounod',
    title: '圣母颂',
    titleEn: 'Ave Maria',
    composer: '古诺/巴赫',
    difficulty: 3,
    duration: 150,
    category: 'piece',
    tags: ['宗教', '中级', '抒情', '古诺'],
    xpReward: 55,
    musicXmlUrl: '/scores/piece/ave-maria-gounod.xml',
  },

  // 30. 野蜂飞舞 (简化版)
  {
    id: 'flight-bumblebee-easy',
    title: '野蜂飞舞 (简化版)',
    titleEn: 'Flight of the Bumblebee (Easy)',
    composer: '里姆斯基-科萨科夫',
    difficulty: 3,
    duration: 70,
    category: 'piece',
    tags: ['炫技', '中级', '快速', '俄罗斯'],
    xpReward: 50,
    musicXmlUrl: '/scores/piece/flight-bumblebee-easy.xml',
  },

  // 31. G小调音阶(两个八度)
  {
    id: 'scale-g-minor-2oct',
    title: 'G小调音阶 (两个八度)',
    titleEn: 'G Minor Scale (2 Octaves)',
    composer: '基础练习',
    difficulty: 3,
    duration: 50,
    category: 'scale',
    tags: ['音阶', '中级', 'G小调', '两个八度'],
    xpReward: 30,
    musicXmlUrl: '/scores/scale/scale-g-minor-2oct.xml',
  },

  // 32. D小调音阶(两个八度)
  {
    id: 'scale-d-minor-2oct',
    title: 'D小调音阶 (两个八度)',
    titleEn: 'D Minor Scale (2 Octaves)',
    composer: '基础练习',
    difficulty: 3,
    duration: 50,
    category: 'scale',
    tags: ['音阶', '中级', 'D小调', '两个八度'],
    xpReward: 30,
    musicXmlUrl: '/scores/scale/scale-d-minor-2oct.xml',
  },

  // 33. 塔兰泰拉舞曲
  {
    id: 'tarantella',
    title: '塔兰泰拉舞曲',
    titleEn: 'Tarantella',
    composer: '意大利民间',
    difficulty: 3,
    duration: 100,
    category: 'piece',
    tags: ['舞曲', '中级', '意大利', '快速'],
    xpReward: 50,
    musicXmlUrl: '/scores/piece/tarantella.xml',
  },

  // 34. 渔舟唱晚
  {
    id: 'fishermans-song',
    title: '渔舟唱晚',
    titleEn: "Fisherman's Song at Dusk",
    composer: '中国古曲',
    difficulty: 3,
    duration: 180,
    category: 'piece',
    tags: ['中国', '中级', '古曲', '意境'],
    xpReward: 60,
    musicXmlUrl: '/scores/piece/fishermans-song.xml',
  },

  // 35. 梁祝主题
  {
    id: 'butterfly-lovers-theme',
    title: '梁祝主题',
    titleEn: 'Butterfly Lovers Theme',
    composer: '何占豪/陈钢',
    difficulty: 4,
    duration: 200,
    category: 'piece',
    tags: ['中国', '中高级', '协奏曲', '经典'],
    xpReward: 70,
    musicXmlUrl: '/scores/piece/butterfly-lovers-theme.xml',
  },

  // 36. Wohlfahrt 练习曲 Op.45 No.1
  {
    id: 'wohlfahrt-op45-no1',
    title: 'Wohlfahrt 练习曲 Op.45 No.1',
    titleEn: 'Wohlfahrt Etude Op.45 No.1',
    composer: 'Franz Wohlfahrt',
    difficulty: 3,
    duration: 90,
    category: 'etude',
    tags: ['练习曲', '中级', '换弦', '音准'],
    xpReward: 40,
    musicXmlUrl: '/scores/etude/wohlfahrt-op45-no1.xml',
  },

  // 37. Wohlfahrt 练习曲 Op.45 No.2
  {
    id: 'wohlfahrt-op45-no2',
    title: 'Wohlfahrt 练习曲 Op.45 No.2',
    titleEn: 'Wohlfahrt Etude Op.45 No.2',
    composer: 'Franz Wohlfahrt',
    difficulty: 3,
    duration: 85,
    category: 'etude',
    tags: ['练习曲', '中级', '连弓', '歌唱'],
    xpReward: 40,
    musicXmlUrl: '/scores/etude/wohlfahrt-op45-no2.xml',
  },

  // 38. Kayser 练习曲 Op.20 No.1
  {
    id: 'kayser-op20-no1',
    title: 'Kayser 练习曲 Op.20 No.1',
    titleEn: 'Kayser Etude Op.20 No.1',
    composer: 'Heinrich Ernst Kayser',
    difficulty: 4,
    duration: 100,
    category: 'etude',
    tags: ['练习曲', '中高级', '分弓', '技巧'],
    xpReward: 50,
    musicXmlUrl: '/scores/etude/kayser-op20-no1.xml',
  },

  // 39. Kayser 练习曲 Op.20 No.2
  {
    id: 'kayser-op20-no2',
    title: 'Kayser 练习曲 Op.20 No.2',
    titleEn: 'Kayser Etude Op.20 No.2',
    composer: 'Heinrich Ernst Kayser',
    difficulty: 4,
    duration: 95,
    category: 'etude',
    tags: ['练习曲', '中高级', '连顿弓', '技巧'],
    xpReward: 50,
    musicXmlUrl: '/scores/etude/kayser-op20-no2.xml',
  },

  // 40. Sevcik 弓法练习 Op.2 No.1
  {
    id: 'sevcik-op2-no1',
    title: 'Sevcik 弓法练习 Op.2 No.1',
    titleEn: 'Sevcik Bowing Exercise Op.2 No.1',
    composer: 'Otakar Sevcik',
    difficulty: 3,
    duration: 60,
    category: 'etude',
    tags: ['练习曲', '中级', '弓法', '基础'],
    xpReward: 35,
    musicXmlUrl: '/scores/etude/sevcik-op2-no1.xml',
  },

  // =====================================================
  // 第四阶段 - 考级 (10首, difficulty: 2-4)
  // =====================================================

  // 41. 英皇一级 - 乡村舞曲
  {
    id: 'abrsm-g1-country-dance',
    title: '乡村舞曲',
    titleEn: 'Country Dance',
    composer: 'ABRSM Grade 1',
    difficulty: 2,
    duration: 45,
    category: 'exam',
    tags: ['英皇', '一级', '考级', '舞曲'],
    grade: 'ABRSM Grade 1',
    xpReward: 35,
    musicXmlUrl: '/scores/exam/abrsm-g1-country-dance.xml',
  },

  // 42. 英皇一级 - 小步舞曲
  {
    id: 'abrsm-g1-minuet',
    title: '小步舞曲',
    titleEn: 'Minuet',
    composer: 'ABRSM Grade 1',
    difficulty: 2,
    duration: 50,
    category: 'exam',
    tags: ['英皇', '一级', '考级', '巴洛克'],
    grade: 'ABRSM Grade 1',
    xpReward: 35,
    musicXmlUrl: '/scores/exam/abrsm-g1-minuet.xml',
  },

  // 43. 英皇二级 - 布列舞曲
  {
    id: 'abrsm-g2-bourree',
    title: '布列舞曲',
    titleEn: 'Bourrée',
    composer: 'ABRSM Grade 2',
    difficulty: 2,
    duration: 55,
    category: 'exam',
    tags: ['英皇', '二级', '考级', '巴洛克'],
    grade: 'ABRSM Grade 2',
    xpReward: 40,
    musicXmlUrl: '/scores/exam/abrsm-g2-bourree.xml',
  },

  // 44. 英皇二级 - 船歌
  {
    id: 'abrsm-g2-barcarolle',
    title: '船歌',
    titleEn: 'Barcarolle',
    composer: 'ABRSM Grade 2',
    difficulty: 2,
    duration: 60,
    category: 'exam',
    tags: ['英皇', '二级', '考级', '抒情'],
    grade: 'ABRSM Grade 2',
    xpReward: 40,
    musicXmlUrl: '/scores/exam/abrsm-g2-barcarolle.xml',
  },

  // 45. 英皇三级 - 加沃特舞曲
  {
    id: 'abrsm-g3-gavotte',
    title: '加沃特舞曲',
    titleEn: 'Gavotte',
    composer: 'ABRSM Grade 3',
    difficulty: 3,
    duration: 75,
    category: 'exam',
    tags: ['英皇', '三级', '考级', '巴洛克'],
    grade: 'ABRSM Grade 3',
    xpReward: 50,
    musicXmlUrl: '/scores/exam/abrsm-g3-gavotte.xml',
  },

  // 46. 央音一级 - 摇篮曲
  {
    id: 'ccom-g1-lullaby',
    title: '摇篮曲',
    titleEn: 'Lullaby',
    composer: '央音一级',
    difficulty: 2,
    duration: 50,
    category: 'exam',
    tags: ['央音', '一级', '考级', '抒情'],
    grade: '央音 Grade 1',
    xpReward: 35,
    musicXmlUrl: '/scores/exam/ccom-g1-lullaby.xml',
  },

  // 47. 央音二级 - 小步舞曲
  {
    id: 'ccom-g2-minuet',
    title: '小步舞曲',
    titleEn: 'Minuet',
    composer: '央音二级',
    difficulty: 2,
    duration: 55,
    category: 'exam',
    tags: ['央音', '二级', '考级', '舞曲'],
    grade: '央音 Grade 2',
    xpReward: 40,
    musicXmlUrl: '/scores/exam/ccom-g2-minuet.xml',
  },

  // 48. 央音三级 - 北风吹
  {
    id: 'ccom-g3-north-wind',
    title: '北风吹',
    titleEn: 'North Wind Blows',
    composer: '央音三级',
    difficulty: 3,
    duration: 70,
    category: 'exam',
    tags: ['央音', '三级', '考级', '中国'],
    grade: '央音 Grade 3',
    xpReward: 50,
    musicXmlUrl: '/scores/exam/ccom-g3-north-wind.xml',
  },

  // 49. 央音四级 - 新疆之春
  {
    id: 'ccom-g4-xinjiang-spring',
    title: '新疆之春',
    titleEn: 'Spring of Xinjiang',
    composer: '央音四级',
    difficulty: 4,
    duration: 120,
    category: 'exam',
    tags: ['央音', '四级', '考级', '中国', '新疆'],
    grade: '央音 Grade 4',
    xpReward: 65,
    musicXmlUrl: '/scores/exam/ccom-g4-xinjiang-spring.xml',
  },

  // 50. 央音五级 - 渔舟唱晚
  {
    id: 'ccom-g5-fisherman',
    title: '渔舟唱晚',
    titleEn: "Fisherman's Song at Evening",
    composer: '央音五级',
    difficulty: 4,
    duration: 180,
    category: 'exam',
    tags: ['央音', '五级', '考级', '中国', '古曲'],
    grade: '央音 Grade 5',
    xpReward: 75,
    musicXmlUrl: '/scores/exam/ccom-g5-fisherman.xml',
  },
]

// ===================
// 辅助函数
// ===================

/**
 * 获取所有曲目
 */
export function getAllSongs(): SongMeta[] {
  return songLibrary
}

/**
 * 根据ID获取曲目
 */
export function getSongById(id: string): SongMeta | undefined {
  return songLibrary.find((song) => song.id === id)
}

/**
 * 根据分类筛选曲目
 */
export function getSongsByCategory(category: SongMeta['category']): SongMeta[] {
  return songLibrary.filter((song) => song.category === category)
}

/**
 * 根据难度筛选曲目
 */
export function getSongsByDifficulty(level: 1 | 2 | 3 | 4 | 5): SongMeta[] {
  return songLibrary.filter((song) => song.difficulty === level)
}

/**
 * 根据标签筛选曲目
 */
export function getSongsByTag(tag: string): SongMeta[] {
  return songLibrary.filter((song) => song.tags.includes(tag))
}

/**
 * 根据考级级别筛选曲目
 */
export function getSongsByGrade(grade: string): SongMeta[] {
  return songLibrary.filter((song) => song.grade === grade)
}

/**
 * 搜索曲目（按标题、作曲家、标签）
 */
export function searchSongs(query: string): SongMeta[] {
  const lowerQuery = query.toLowerCase()
  return songLibrary.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.titleEn?.toLowerCase().includes(lowerQuery) ||
      song.composer?.toLowerCase().includes(lowerQuery) ||
      song.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * 获取曲目统计信息
 */
export function getSongStats() {
  return {
    total: songLibrary.length,
    byCategory: {
      scale: getSongsByCategory('scale').length,
      etude: getSongsByCategory('etude').length,
      piece: getSongsByCategory('piece').length,
      exam: getSongsByCategory('exam').length,
    },
    byDifficulty: {
      1: getSongsByDifficulty(1).length,
      2: getSongsByDifficulty(2).length,
      3: getSongsByDifficulty(3).length,
      4: getSongsByDifficulty(4).length,
      5: getSongsByDifficulty(5).length,
    },
  }
}

/**
 * 获取推荐曲目（根据难度和分类）
 */
export function getRecommendedSongs(
  currentLevel: number,
  limit: number = 5
): SongMeta[] {
  // 推荐比当前等级稍高的曲目
  const targetDifficulty = Math.min(Math.ceil(currentLevel / 4) + 1, 5) as 1 | 2 | 3 | 4 | 5
  const songs = getSongsByDifficulty(targetDifficulty)

  // 随机打乱并返回指定数量
  return songs.sort(() => Math.random() - 0.5).slice(0, limit)
}

// ===================
// 默认导出
// ===================

export default songLibrary
