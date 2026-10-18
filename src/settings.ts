// Cấu hình game chỉnh được từ trang admin.
// Nhóm "game" được chụp vào hồ sơ mỗi kiếp lúc tạo → chỉ áp dụng cho kiếp MỚI, kiếp cũ vẫn phát lại đúng.
// Nhóm "duel" áp dụng cho trận mới. Nhóm "system" áp dụng ngay.

export type SettingSpec = {
  key: string;
  group: "game" | "duel" | "system";
  label: string;
  help: string;
  type: "number" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean;
};

export const SETTINGS: SettingSpec[] = [
  { key: "growth", group: "game", label: "Tốc độ tu luyện", help: "Hệ số nhân tốc độ tăng tu vi mỗi lượt. 1 = mặc định.", type: "number", min: 0.5, max: 2, step: 0.05, default: 1 },
  { key: "eventRate", group: "game", label: "Tần suất sự kiện", help: "Xác suất xảy ra sự kiện mỗi lượt (người tu hành). Phàm nhân theo tỉ lệ tương ứng.", type: "number", min: 0.2, max: 0.7, step: 0.05, default: 0.4 },
  { key: "breakthroughBonus", group: "game", label: "Cộng tỉ lệ đột phá (%)", help: "Cộng/trừ thẳng vào tỉ lệ thành công khi đột phá. 0 = mặc định.", type: "number", min: -20, max: 20, step: 1, default: 0 },
  { key: "realmCurve", group: "game", label: "Độ dốc độ khó theo cảnh giới", help: "Càng lên cao càng khó: tu luyện chậm dần, bình cảnh dày hơn, thiên kiếp hung hơn. 0 = như bản gốc. Chỉ áp cho kiếp tạo sau khi đổi.", type: "number", min: 0, max: 2, step: 0.1, default: 0.7 },
  { key: "tribulationDeath", group: "game", label: "Tỉ lệ vong mạng khi độ kiếp thất bại", help: "Xác suất chết khi thất bại ở thiên kiếp (trước khi tính thể trạng, thể chất).", type: "number", min: 0, max: 0.8, step: 0.05, default: 0.4 },
  { key: "quizReward", group: "game", label: "Hệ số thưởng câu đúng", help: "Nhân phần thưởng mỗi câu khảo hạch trả lời đúng. 0 = không thưởng.", type: "number", min: 0, max: 3, step: 0.25, default: 1 },
  { key: "pityLimit", group: "game", label: "Ngưỡng bảo hiểm số mệnh", help: "Số kiếp xấu liên tiếp trước khi chắc chắn được linh căn tốt.", type: "number", min: 3, max: 10, step: 1, default: 5 },
  { key: "duelQuestions", group: "duel", label: "Số câu mỗi trận", help: "Số câu hỏi trong một trận luận đạo.", type: "number", min: 3, max: 10, step: 1, default: 5 },
  { key: "duelAnswerSec", group: "duel", label: "Thời gian mỗi câu (giây)", help: "Thời gian trả lời một câu.", type: "number", min: 8, max: 30, step: 1, default: 15 },
  { key: "botWaitMin", group: "duel", label: "Chờ tối thiểu trước khi ghép bot (giây)", help: "Thời gian tìm người thật tối thiểu.", type: "number", min: 3, max: 30, step: 1, default: 6 },
  { key: "botWaitMax", group: "duel", label: "Chờ tối đa trước khi ghép bot (giây)", help: "Phải ≥ thời gian chờ tối thiểu.", type: "number", min: 4, max: 60, step: 1, default: 12 },
  { key: "eloK", group: "duel", label: "Hệ số Elo (K)", help: "Mức Đạo vị thay đổi tối đa mỗi trận.", type: "number", min: 8, max: 64, step: 1, default: 32 },
  { key: "botLabel", group: "duel", label: "Gắn nhãn \"tàn ảnh\" cho bot", help: "Bật để người chơi biết đối thủ là bot.", type: "boolean", default: false },
  { key: "sectContestHours", group: "duel", label: "Thời gian đại bỉ môn phái (giờ)", help: "Khi ghế chưởng môn trống: đệ tử thi đấu lấy điểm trong khoảng này, 3 người dẫn đầu thành ứng viên.", type: "number", min: 1, max: 168, step: 1, default: 24 },
  { key: "sectVoteHours", group: "duel", label: "Thời gian bỏ phiếu chưởng môn (giờ)", help: "Đệ tử đang sống bỏ phiếu chọn một trong các ứng viên.", type: "number", min: 1, max: 72, step: 1, default: 12 },
  { key: "leaderIdleDays", group: "duel", label: "Chưởng môn bế quan tối đa (ngày)", help: "Nhân vật chưởng môn không được chơi tiếp quá số ngày này thì mất ghế.", type: "number", min: 1, max: 60, step: 1, default: 7 },
  { key: "guestTtlDays", group: "system", label: "Giữ tài khoản khách (ngày)", help: "Tài khoản khách không hoạt động quá số ngày này sẽ bị xoá.", type: "number", min: 7, max: 365, step: 1, default: 90 },
];

export type Settings = Record<string, number | boolean>;
export const DEFAULTS: Settings = Object.fromEntries(SETTINGS.map((s) => [s.key, s.default]));

let cache: { at: number; value: Settings } | null = null;

/** Đọc cấu hình (cache 30 giây trong mỗi isolate). */
export async function getSettings(db: D1Database): Promise<Settings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const { results } = await db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  const value: Settings = { ...DEFAULTS };
  for (const r of results) {
    if (!(r.key in DEFAULTS)) continue;
    try {
      value[r.key] = JSON.parse(r.value);
    } catch {}
  }
  cache = { at: Date.now(), value };
  return value;
}

export function clearSettingsCache() {
  cache = null;
}

/** Kiểm tra & chuẩn hoá giá trị gửi lên. Trả về lỗi theo khoá (tiếng Việt) nếu không hợp lệ. */
export function validateSettings(input: Record<string, unknown>): { values: Settings; errors: Record<string, string> } {
  const values: Settings = {};
  const errors: Record<string, string> = {};
  for (const spec of SETTINGS) {
    if (!(spec.key in input)) continue;
    const v = input[spec.key];
    if (spec.type === "boolean") {
      if (typeof v !== "boolean") errors[spec.key] = "Phải là bật/tắt";
      else values[spec.key] = v;
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) errors[spec.key] = "Phải là số";
    else if (n < spec.min! || n > spec.max!) errors[spec.key] = `Trong khoảng ${spec.min}–${spec.max}`;
    else values[spec.key] = Number((Math.round(n / spec.step!) * spec.step!).toFixed(4));
  }
  const min = Number(values.botWaitMin ?? DEFAULTS.botWaitMin);
  const max = Number(values.botWaitMax ?? DEFAULTS.botWaitMax);
  if (max < min) errors.botWaitMax = "Phải ≥ thời gian chờ tối thiểu";
  return { values, errors };
}

/** Phần cấu hình chụp vào hồ sơ mỗi kiếp. */
export const gameConfigOf = (s: Settings) => ({
  growth: Number(s.growth),
  eventRate: Number(s.eventRate),
  breakthroughBonus: Number(s.breakthroughBonus),
  tribulationDeath: Number(s.tribulationDeath),
  quizReward: Number(s.quizReward),
  realmCurve: Number(s.realmCurve),
});
