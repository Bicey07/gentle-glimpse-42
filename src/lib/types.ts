export interface Person {
  id: string;
  name: string;
  bio: string;
  color: string; // hex/CSS color
  recent: SpaceSummary;
}

export interface SpaceSummary {
  mood: string;          // 本周状态：平静 / 想念 / 在恢复 ...
  reading?: { title: string; author: string };
  watching?: { title: string; director: string };
  sentence?: string;     // 一句生活痕迹
}

export interface Room {
  id: string;
  name: string;
  description: string;
  color: string;       // 房间色块
  presence: string;    // 「几个人在这里」类的模糊描述
}

export interface Trace {
  id: string;
  personId: string;
  verb: string;        // 留下了一句话 / 收藏了一本书 / 留下了一张照片
  detail?: string;     // 引用片段，可选
}

export interface BookEntry {
  id: string;
  personId: string;
  title: string;
  author: string;
  cover: string;
  note?: string;
}

export interface MovieEntry {
  id: string;
  personId: string;
  title: string;
  director: string;
  cover: string;
  note?: string;
}

export interface SentenceEntry {
  id: string;
  personId: string;
  text: string;
}

export interface ImageEntry {
  id: string;
  personId: string;
  url: string;
  caption?: string;
}
