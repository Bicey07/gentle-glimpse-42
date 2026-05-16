import type { Friend, Post } from "../lib/types";

export const me: Friend = {
  id: "me",
  name: "你",
  avatar: "你",
  bio: "在城里慢慢生活。",
  color: "#B8C9B0",
};

export const friends: Friend[] = [
  { id: "linyi", name: "林一", avatar: "林", bio: "写一点字，散一点步。", color: "#C9D3DE" },
  { id: "xiaoman", name: "小满", avatar: "满", bio: "猫,茶,旧书。", color: "#D7C9B8" },
  { id: "aye", name: "阿野", avatar: "野", bio: "在郊外做木工。", color: "#B8C9B0" },
  { id: "qingyu", name: "青羽", avatar: "羽", bio: "晚睡早起的拉拉杂杂。", color: "#CFC2D6" },
  { id: "muzi", name: "木子", avatar: "木", bio: "看电影，写信，发呆。", color: "#D6C2C2" },
  { id: "an", name: "安安", avatar: "安", bio: "做饭，写日记。", color: "#BFD0C8" },
];

export const allPeople: Friend[] = [me, ...friends];

const hour = 1000 * 60 * 60;
const day = hour * 24;
const now = Date.now();
const ago = (h: number) => new Date(now - h * hour).toISOString();

export const mockPosts: Post[] = [
  {
    id: "p1",
    authorId: "linyi",
    type: "sentence",
    text: "下午的光照到桌角，什么都没有发生，也很好。",
    createdAt: ago(2),
  },
  {
    id: "p2",
    authorId: "xiaoman",
    type: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=70",
    caption: "今天的窗外。",
    createdAt: ago(5),
  },
  {
    id: "p3",
    authorId: "aye",
    type: "status",
    mood: "平静",
    note: "做了一整天的木头。",
    createdAt: ago(8),
  },
  {
    id: "p4",
    authorId: "qingyu",
    type: "book",
    title: "夜航西飞",
    author: "柏瑞尔·马卡姆",
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=70",
    note: "在飞机上读，觉得世界很大也很轻。",
    createdAt: ago(20),
  },
  {
    id: "p5",
    authorId: "muzi",
    type: "movie",
    title: "海上钢琴师",
    director: "朱塞佩·托纳多雷",
    cover:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=70",
    note: "又看了一遍。",
    createdAt: ago(26),
  },
  {
    id: "p6",
    authorId: "an",
    type: "sentence",
    text: "今天给自己煮了一碗面，加了一个荷包蛋。",
    createdAt: ago(30),
    replies: [{ author: "林一", text: "听起来很好。" }],
  },
  {
    id: "p7",
    authorId: "linyi",
    type: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=70",
    caption: "路过的一束花。",
    createdAt: ago(40),
  },
  {
    id: "p8",
    authorId: "xiaoman",
    type: "status",
    mood: "想念",
    createdAt: ago(50),
  },
  {
    id: "p9",
    authorId: "aye",
    type: "sentence",
    text: "锯木头的声音，像一种很慢的呼吸。",
    createdAt: ago(60),
  },
  {
    id: "p10",
    authorId: "muzi",
    type: "image",
    imageUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=70",
    caption: "夜里出门走了一会儿。",
    createdAt: ago(72),
  },
  {
    id: "p11",
    authorId: "me",
    type: "sentence",
    text: "把窗户开了一会儿，让风进来。",
    createdAt: ago(3),
  },
  {
    id: "p12",
    authorId: "me",
    type: "status",
    mood: "在恢复",
    createdAt: ago(50),
  },
  {
    id: "p13",
    authorId: "me",
    type: "book",
    title: "枕草子",
    author: "清少纳言",
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=70",
    note: "睡前读几页，安静下来。",
    createdAt: ago(96),
  },
];

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / hour);
  if (h < 1) return "刚刚";
  if (h < 6) return `${h} 小时前`;
  if (h < 24) {
    const hr = new Date(iso).getHours();
    if (hr < 6) return "凌晨";
    if (hr < 11) return "今天上午";
    if (hr < 14) return "今天中午";
    if (hr < 18) return "今天下午";
    return "今天傍晚";
  }
  const d = Math.floor(diff / day);
  if (d === 1) return "昨天";
  if (d < 7) return `${d} 天前`;
  if (d < 30) return `${Math.floor(d / 7)} 周前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function findPerson(id: string): Friend | undefined {
  return allPeople.find((p) => p.id === id);
}
