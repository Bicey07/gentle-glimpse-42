export type PostType = "sentence" | "image" | "book" | "movie" | "status";

export interface Friend {
  id: string;
  name: string;
  avatar: string; // initial or color seed
  bio: string;
  color: string; // hex for avatar bg
}

export interface BasePost {
  id: string;
  authorId: string;
  createdAt: string; // ISO
  type: PostType;
  replies?: { author: string; text: string }[];
}

export interface SentencePost extends BasePost {
  type: "sentence";
  text: string;
}
export interface ImagePost extends BasePost {
  type: "image";
  imageUrl: string;
  caption?: string;
}
export interface BookPost extends BasePost {
  type: "book";
  title: string;
  author: string;
  cover: string;
  note?: string;
}
export interface MoviePost extends BasePost {
  type: "movie";
  title: string;
  director: string;
  cover: string;
  note?: string;
}
export interface StatusPost extends BasePost {
  type: "status";
  mood: string; // 平静 / 想念 / 在恢复 ...
  note?: string;
}

export type Post =
  | SentencePost
  | ImagePost
  | BookPost
  | MoviePost
  | StatusPost;
