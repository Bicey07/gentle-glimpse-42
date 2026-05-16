## 方向修正

把首页从「朋友 feed」改成「生活空间系统」。每个人是一个房间，首页是穿过这些房间的走廊。删除所有像社交媒体 post 的卡片结构。

## 信息架构

- `/` —— **Space**（首页/走廊，全新结构）
- `/me` —— My Space（个人房间，重写为空间摘要而非时间线）
- `/friends` —— Friends（所有朋友空间的网格目录）
- `/friend/$id` —— Friend Space（朋友房间，与 Me 同结构）
- `/rooms` —— Shared Rooms 列表（小世界入口）
- `/room/$id` —— 单个 Room 详情页（第一版仅视觉）
- `/add` —— Add（保留，但减少"发布"语气，改为"留下一点痕迹"）

底部导航改为五项：**Space · Add · Friends · Rooms · Me**

## 新首页 `/` 结构（自上而下）

```text
┌─────────────────────────────────┐
│ QUIET · SPACE                    │   极小字号标识
│ 一个没有点赞和比较的生活空间。     │   衬线一句话
├─────────────────────────────────┤
│  My Space                        │   小节标题
│  ┌───────────────────────────┐   │
│  │ [房间感卡片]               │   │  大卡片，像一扇门
│  │ 本周：在恢复               │   │
│  │ 在读：枕草子               │   │
│  │ 在看：海上钢琴师           │   │
│  │ 随记：把窗户开了一会儿…    │   │
│  │                  进入 →   │   │
│  └───────────────────────────┘   │
├─────────────────────────────────┤
│  Friends' Spaces                 │
│  ┌──────────┐ ┌──────────┐       │  2 列网格，3-4 张
│  │ 林一     │ │ 小满     │       │  每张是空间摘要卡
│  │ 平静     │ │ 想念     │       │  不显示时间、无回应按钮
│  │ 在读…    │ │ 在看…    │       │
│  │ 「下午…」│ │ 「窗外…」│       │
│  └──────────┘ └──────────┘       │
│  查看所有朋友 →                  │
├─────────────────────────────────┤
│  Shared Rooms                    │
│  · 周末有人想去展览              │   极简列表，每行一个小世界
│  · 东京生活                      │   左侧一个柔色方块作为房间色
│  · 最近在读书的人                │
│  · 安静的早晨                    │
├─────────────────────────────────┤
│  最近的回声                       │   弱化标题
│  · 阿野「锯木头的声音…」          │   单行文字 + 名字，无头像无时间排序感
│  · 小满 留下了一张窗外的照片      │   最多 3 条，文字描述代替卡片
│  · 林一 在读《夜航西飞》          │
└─────────────────────────────────┘
```

关键差异：
- 没有 avatar + name + time + reply 的 post 卡
- 没有按时间排序的长流
- 朋友以**空间摘要**呈现，不是"动态"
- Recent Traces 用单行叙述句，没有互动按钮

## 卡片重设计

**MySpaceCard**（首页+/me 同款，尺寸不同）
- 大圆角矩形，米白底 + 一道极淡边
- 顶部一行：人名 + 一行 bio
- 四个小模块横排或竖排：本周状态 / 在读 / 在看 / 一句随记
- 没有头像堆叠、没有时间、没有数字
- 右下一个文字按钮"进入 →"

**FriendSpaceCard**（首页网格 + /friends 网格）
- 比 MySpaceCard 小、更纵向
- 顶部：朋友名（衬线）+ 一行 bio
- 中部：本周状态色块（小）+ 在读/在看一行 + 一句最新随记（引文样式）
- 整张卡片可点击进入该朋友 Space

**RoomCard**（Shared Rooms）
- 极简列表行：左侧一个 8×8 柔色方块（房间色调）+ 房间名 + 一行小描述（如「3 个人在这里」但不显示具体数字，用"几个人在这里"）
- 第一版无内容页，点击进 `/room/$id` 显示一个安静占位页（"这里还很安静，过几天再来"）

**TraceLine**（Recent Traces）
- 单行：「{名字} {动词短语}」，例：「阿野 留下了一句话」「小满 收藏了一本书」
- 灰色细字，无背景、无按钮、无时间戳精度
- 点击跳到对应朋友 Space

## 页面改造

**`/me`** —— 个人房间
- 顶部头像 + 名字 + bio（保留，但更安静）
- 一个大的 MySpaceCard 风格摘要（本周/在读/在看/随记）
- 下方用「房间里的角落」三个分区：书架、影集、随记
  - 每个分区是横向滚动或简单堆叠的小条目，不是 PostCard 时间线
- 移除现有的 PostCard compact 流

**`/friend/$id`** —— 朋友房间
- 与 /me 同结构
- 右上"轻轻打个招呼"保留
- 不显示回应输入框

**`/friends`** —— 所有朋友空间
- 单纯的 FriendSpaceCard 2 列网格

**`/rooms`** —— Shared Rooms 列表
- RoomCard 列表
- 顶部一句话："一些小世界，里面有几个人在安静地待着。"

**`/room/$id`** —— 单个 Room（仅视觉）
- 顶部 room 标题 + 一句描述
- 中间一段占位文字（如"这里还很安静"）
- 几个柔色方块代表"在这里的人"，但不显示数字

**`/add`** —— 保留现有逻辑
- 顶部文案微调：「在自己的空间里留下一点痕迹。」
- 强调"留给自己"而非"发布"

## 数据扩展

`mockData.ts` 增补：
- 每个人增加 `recent: { mood, reading, watching, sentence }` 字段，作为空间摘要的数据源（从已有 posts 派生或直接写好）
- 新增 `rooms: Room[]`，4-5 个小世界：「周末有人想去展览」「东京生活」「最近在读书的人」「安静的早晨」「夜里写字的人」，每个带 `id, name, description, color`
- `traces: Trace[]`（或从 posts 派生 3 条），含 `personId, verb, target`

类型补充到 `src/lib/types.ts`：`Space`、`Room`、`Trace`。

## 组件改动

**新增**
- `src/components/MySpaceCard.tsx`
- `src/components/FriendSpaceCard.tsx`
- `src/components/RoomCard.tsx`
- `src/components/TraceLine.tsx`
- `src/components/SectionTitle.tsx`（统一小节标题样式）

**修改**
- `src/components/BottomNav.tsx` —— 5 项：Space / Add / Friends / Rooms / Me，字符 glyph 改为更克制的符号（如 ⌂ · ＋ · ◍ · ▢ · ·）
- `src/routes/index.tsx` —— 完全重写为上文结构
- `src/routes/me.tsx` —— 重写为房间结构
- `src/routes/friend.$id.tsx` —— 重写为房间结构
- `src/routes/add.tsx` —— 文案微调

**新增路由**
- `src/routes/friends.tsx`
- `src/routes/rooms.tsx`
- `src/routes/room.$id.tsx`

**可删除/不再使用**
- `src/components/PostCard.tsx`：从首页和个人空间移除引用。是否物理删除取决于 Add 是否还用——本次也不用了，删除该文件。

## 视觉收紧

- 首页整体增加段间距（每个 section 之间 64px 以上）
- 小节标题用 `text-xs tracking-[0.25em] uppercase text-quiet`，标题后细横线分隔
- 卡片用极淡边框 `border border-[var(--border)]`，不使用阴影
- MySpaceCard 用比页面背景略浅一档的 `--card`，营造"门"的层次
- FriendSpaceCard 用同色卡片 + 一个微小色点（朋友主色）作为身份识别，而非头像缩略图

## 范围之外

- Shared Rooms 的真实加入/聊天功能
- 任何持久化、登录、后端
- 数字徽章、未读提示、推送

写完后我会在 714 宽视口截图核对首页是否消除了 feed 感。