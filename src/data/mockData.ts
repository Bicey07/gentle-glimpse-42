import type {
  Person,
  Room,
  Trace,
  BookEntry,
  MovieEntry,
  SentenceEntry,
  ImageEntry,
} from "../lib/types";

export const me: Person = {
  id: "me",
  name: "你",
  bio: "在城里慢慢生活。",
  color: "#B8C9B0",
  recent: {
    mood: "在恢复",
    reading: { title: "枕草子", author: "清少纳言" },
    watching: { title: "小森林", director: "森淳一" },
    sentence: "把窗户开了一会儿，让风进来。",
  },
};

export const friends: Person[] = [
  {
    id: "linyi",
    name: "林一",
    bio: "写一点字，散一点步。",
    color: "#C9D3DE",
    recent: {
      mood: "平静",
      reading: { title: "夜航西飞", author: "柏瑞尔·马卡姆" },
      sentence: "下午的光照到桌角，什么都没有发生，也很好。",
    },
  },
  {
    id: "xiaoman",
    name: "小满",
    bio: "猫，茶，旧书。",
    color: "#D7C9B8",
    recent: {
      mood: "想念",
      watching: { title: "海街日记", director: "是枝裕和" },
      sentence: "今天的窗外。",
    },
  },
  {
    id: "aye",
    name: "阿野",
    bio: "在郊外做木工。",
    color: "#B8C9B0",
    recent: {
      mood: "缓慢",
      reading: { title: "瓦尔登湖", author: "梭罗" },
      sentence: "锯木头的声音，像一种很慢的呼吸。",
    },
  },
  {
    id: "qingyu",
    name: "青羽",
    bio: "晚睡早起的拉拉杂杂。",
    color: "#CFC2D6",
    recent: {
      mood: "明亮",
      watching: { title: "海上钢琴师", director: "托纳多雷" },
      sentence: "走了很远的路才回到家。",
    },
  },
  {
    id: "muzi",
    name: "木子",
    bio: "看电影，写信，发呆。",
    color: "#D6C2C2",
    recent: {
      mood: "有点累",
      reading: { title: "局外人", author: "加缪" },
      sentence: "夜里出门走了一会儿。",
    },
  },
  {
    id: "an",
    name: "安安",
    bio: "做饭，写日记。",
    color: "#BFD0C8",
    recent: {
      mood: "平静",
      sentence: "今天给自己煮了一碗面，加了一个荷包蛋。",
    },
  },
];

export const allPeople: Person[] = [me, ...friends];

export function findPerson(id: string): Person | undefined {
  return allPeople.find((p) => p.id === id);
}

export const rooms: Room[] = [
  {
    id: "exhibition",
    name: "周末有人想去展览",
    description: "看画，发呆，慢慢走。",
    color: "#C9D3DE",
    presence: "几个人在这里",
  },
  {
    id: "tokyo",
    name: "东京生活",
    description: "在另一座城市里慢慢生活。",
    color: "#D7C9B8",
    presence: "三五个人在这里",
  },
  {
    id: "reading",
    name: "最近在读书的人",
    description: "一起把书慢慢看完。",
    color: "#B8C9B0",
    presence: "一些人在这里",
  },
  {
    id: "morning",
    name: "安静的早晨",
    description: "天还没亮的时候醒来。",
    color: "#CFC2D6",
    presence: "几个人在这里",
  },
  {
    id: "night-writers",
    name: "夜里写字的人",
    description: "灯还亮着的房间。",
    color: "#D6C2C2",
    presence: "两三个人在这里",
  },
];

export const traces: Trace[] = [
  { id: "t1", personId: "aye", verb: "留下了一句话", detail: "锯木头的声音…" },
  { id: "t2", personId: "xiaoman", verb: "留下了一张窗外的照片" },
  { id: "t3", personId: "linyi", verb: "在读《夜航西飞》" },
];

// 个人房间里的"角落"内容（书架/影集/随记）
export const books: BookEntry[] = [
  { id: "b1", personId: "me", title: "枕草子", author: "清少纳言", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=70", note: "睡前读几页。" },
  { id: "b2", personId: "linyi", title: "夜航西飞", author: "柏瑞尔·马卡姆", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=70" },
  { id: "b3", personId: "aye", title: "瓦尔登湖", author: "梭罗", cover: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=300&q=70" },
  { id: "b4", personId: "muzi", title: "局外人", author: "加缪", cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=300&q=70" },
];

export const movies: MovieEntry[] = [
  { id: "m1", personId: "me", title: "小森林", director: "森淳一", cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=70" },
  { id: "m2", personId: "qingyu", title: "海上钢琴师", director: "托纳多雷", cover: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=70" },
  { id: "m3", personId: "xiaoman", title: "海街日记", director: "是枝裕和", cover: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=400&q=70" },
];

export const sentences: SentenceEntry[] = [
  { id: "s1", personId: "me", text: "把窗户开了一会儿，让风进来。" },
  { id: "s2", personId: "me", text: "今天没有做什么，也很好。" },
  { id: "s3", personId: "linyi", text: "下午的光照到桌角。" },
  { id: "s4", personId: "aye", text: "锯木头的声音，像一种很慢的呼吸。" },
  { id: "s5", personId: "an", text: "今天给自己煮了一碗面。" },
];

export const images: ImageEntry[] = [
  { id: "i1", personId: "me", url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=70", caption: "窗外。" },
  { id: "i2", personId: "xiaoman", url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=70", caption: "路过的一束花。" },
  { id: "i3", personId: "muzi", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=70" },
];

export function personEntries(personId: string) {
  return {
    books: books.filter((b) => b.personId === personId),
    movies: movies.filter((m) => m.personId === personId),
    sentences: sentences.filter((s) => s.personId === personId),
    images: images.filter((i) => i.personId === personId),
  };
}
