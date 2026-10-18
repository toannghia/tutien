export type SectStatus = "none" | "member" | "elder" | "outcast";
export type PartnerStatus = "none" | "partner" | "widowed";

export type Effects = {
  cultivation?: number; // điểm tu vi (một tiểu cảnh giới = 100)
  health?: number; // 0..100
  resources?: number; // linh tài, tự nhân theo cảnh giới
  luck?: number;
  comprehension?: number;
  lifespan?: number; // năm thọ cộng thêm
  sect?: SectStatus;
  partner?: PartnerStatus;
  flag?: string; // đánh dấu cho thành tựu / chuỗi sự kiện
  death?: boolean;
  virtue?: number; // thiện nghiệp (nhân quả, theo sang kiếp sau)
  sin?: number; // ác nghiệp
};

export type Condition = {
  sect?: SectStatus[];
  partner?: PartnerStatus[];
  minResources?: number;
  flag?: string;
  notFlag?: string;
  rootless?: boolean; // chỉ cho người không có linh căn
  hasPath?: boolean; // đã chọn đạo đồ (mới có khảo hạch)
  karma?: boolean; // chỉ kiếp có hệ nhân quả (kiếp tạo sau khi có tính năng) — giữ nguyên nhịp các kiếp cũ
  minVirtue?: number;
  minSin?: number;
  path?: string; // đúng đạo đồ này
};

// Khảo hạch: một chuỗi câu hỏi trắc nghiệm theo đạo đồ của người chơi
export type Trial = {
  title: string;
  count: number; // số câu
  pass: number; // số câu đúng tối thiểu để đạt
  onPass: Outcome;
  onFail: Outcome;
  level?: number; // ép độ khó (1..3); mặc định theo cảnh giới
};

export type Outcome = { id: string; weight: number; text: string; effects: Effects; reason?: string; risky?: boolean };
export type Choice = { id: string; text: string; hint?: string; cond?: Condition; outcomes: Outcome[]; trial?: Trial };

export type GameEvent = {
  id: string;
  title: string;
  text: string;
  weight: number;
  realms: [number, number];
  minAge?: number;
  maxAge?: number;
  maxPerLife: number;
  cooldown?: number; // số lượt (tick) tối thiểu giữa hai lần xuất hiện
  cond?: Condition;
  effects?: Effects;
  choices?: Choice[];
  trial?: Trial; // sự kiện chỉ gồm khảo hạch
};
