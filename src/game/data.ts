// Dữ liệu nền: cảnh giới, tư chất, xuất thân, giới diện, thành tựu.

export type Realm = { id: string; name: string; lifespan: number; stages: string[]; tribulation?: boolean; immortal?: boolean };

const S3 = ["Sơ kỳ", "Trung kỳ", "Hậu kỳ"];
const LQ = ["Tầng 1", "Tầng 2", "Tầng 3", "Tầng 4", "Tầng 5", "Tầng 6", "Tầng 7", "Tầng 8", "Tầng 9"];

export const REALMS: Realm[] = [
  { id: "mortal", name: "Phàm nhân", lifespan: 0, stages: [""] },
  { id: "qi_refining", name: "Luyện Khí", lifespan: 120, stages: LQ },
  { id: "foundation", name: "Trúc Cơ", lifespan: 220, stages: S3 },
  { id: "golden_core", name: "Kim Đan", lifespan: 480, stages: S3 },
  { id: "nascent_soul", name: "Nguyên Anh", lifespan: 950, stages: S3 },
  { id: "spirit_transformation", name: "Hóa Thần", lifespan: 1900, stages: S3, tribulation: true },
  { id: "void_refining", name: "Luyện Hư", lifespan: 3600, stages: S3 },
  { id: "body_integration", name: "Hợp Thể", lifespan: 6500, stages: S3 },
  { id: "mahayana", name: "Đại Thừa", lifespan: 11000, stages: S3 },
  { id: "true_immortal", name: "Chân Tiên", lifespan: 25000, stages: S3, tribulation: true, immortal: true },
  { id: "golden_immortal", name: "Kim Tiên", lifespan: 40000, stages: S3, immortal: true },
  { id: "mystic_immortal", name: "Huyền Tiên", lifespan: 65000, stages: S3, immortal: true },
  { id: "immortal_king", name: "Tiên Vương", lifespan: 100000, stages: S3, immortal: true },
  { id: "immortal_emperor", name: "Tiên Đế", lifespan: 160000, stages: S3, tribulation: true, immortal: true },
];

export const ROOTS = [
  { id: "none", name: "Phàm căn", score: 0, weight: 14, desc: "Không thể dẫn khí nhập thể. Một đời phàm nhân, trừ khi gặp kỳ ngộ." },
  { id: "five", name: "Ngũ linh căn", score: 22, weight: 27, desc: "Linh căn tạp, tu luyện chậm chạp, bình cảnh dày đặc." },
  { id: "four", name: "Tứ linh căn", score: 35, weight: 24, desc: "Hơn ngũ linh căn đôi chút, vẫn là tư chất hạ đẳng." },
  { id: "three", name: "Tam linh căn", score: 48, weight: 18, desc: "Tư chất trung bình, đủ để tông môn nhỏ thu nhận." },
  { id: "two", name: "Song linh căn", score: 68, weight: 10, desc: "Tư chất thượng đẳng, được các đại tông tranh giành." },
  { id: "heaven", name: "Thiên linh căn", score: 92, weight: 4, desc: "Đơn linh căn thuần khiết, ngàn năm khó gặp." },
  { id: "mutant", name: "Biến dị linh căn", score: 100, weight: 2, desc: "Lôi, băng, phong… linh căn dị biến, tu luyện thần tốc." },
];

export const PHYSIQUES = [
  { id: "common", name: "Thể chất thường", weight: 70, speed: 1, guard: 1, regen: 1, breakthrough: 0, desc: "Thân thể bình thường, không ưu không khuyết." },
  { id: "frail", name: "Thể nhược", weight: 8, speed: 1, guard: 1.3, regen: 0.6, breakthrough: -0.05, desc: "Bẩm sinh yếu ớt, dễ bị thương, hồi phục chậm." },
  { id: "verdant", name: "Thanh Linh Thể", weight: 8, speed: 1.25, guard: 1, regen: 1.2, breakthrough: 0, desc: "Thân thể thân cận linh khí, tu luyện nhanh hơn người." },
  { id: "diamond", name: "Kim Cương Thể", weight: 6, speed: 1, guard: 0.6, regen: 1.5, breakthrough: 0, desc: "Thân thể cứng như kim thạch, khó bị thương." },
  { id: "thunder", name: "Lôi Linh Thể", weight: 5, speed: 1.1, guard: 0.9, regen: 1, breakthrough: 0.1, desc: "Trời sinh thân cận lôi đình, thiên kiếp bớt hiểm." },
  { id: "dao", name: "Tiên Thiên Đạo Thể", weight: 1, speed: 1.4, guard: 0.7, regen: 1.4, breakthrough: 0.12, desc: "Đạo thể bẩm sinh, vạn năm hiếm thấy." },
];

// Xuất thân: bốc lúc tạo kiếp. resources = linh tài khởi đầu, sect = lớn lên trong tông môn,
// bonus = chỉ số cộng lúc chào đời (chỉ xuất thân mới có; 6 xuất thân gốc giữ nguyên để kiếp cũ phát lại đúng).
export type OriginBonus = { luck?: number; comprehension?: number; lifespan?: number; virtue?: number; sin?: number };
export type Origin = { id: string; name: string; weight: number; resources: number; sect: "none" | "member"; text: string; desc: string; bonus?: OriginBonus };

export const ORIGINS: Origin[] = [
  { id: "village", name: "Con nhà nông nơi sơn thôn", weight: 30, resources: 5, sect: "none",
    text: "Ngươi sinh ra trong một mái nhà tranh dưới chân núi. Tiếng gà gáy và mùi lúa mới là những ký ức đầu tiên.",
    desc: "Xuất thân phổ biến nhất. Tuổi thơ lam lũ, tay trắng bước vào đời — mọi thứ phải tự mình giành lấy." },
  { id: "merchant", name: "Con nhà thương hộ", weight: 17, resources: 30, sect: "none",
    text: "Ngươi sinh ra trong nhà buôn ở trấn lớn. Bạc tiền không thiếu, nhưng cha mẹ luôn mong ngươi được tiên nhân để mắt.",
    desc: "Túi tiền rủng rỉnh: đủ linh tài để hộ pháp sớm khi đột phá, hoặc thuê người đi thay khi có lệnh trưng binh." },
  { id: "orphan", name: "Cô nhi nơi phố chợ", weight: 10, resources: 0, sect: "none",
    text: "Ngươi không nhớ mặt cha mẹ. Phố chợ ồn ã là nơi ngươi lớn lên, học cách tự sống từ rất sớm.",
    desc: "Khởi đầu khó nhất: không một đồng linh tài, không chỗ dựa. Bù lại, mọi cơ duyên đều là của riêng ngươi." },
  { id: "clan", name: "Tu tiên thế gia", weight: 12, resources: 45, sect: "none",
    text: "Ngươi chào đời trong một gia tộc tu tiên. Kỳ vọng đặt lên ngươi từ ngày đầu, dù linh căn còn chưa rõ.",
    desc: "Gia tộc có sẵn linh thạch, đan dược. Nhiều linh tài khởi đầu giúp vượt các bình cảnh đầu nhẹ nhàng hơn." },
  { id: "sect_servant", name: "Con nhà tạp dịch tông môn", weight: 10, resources: 10, sect: "member",
    text: "Cha mẹ ngươi làm tạp dịch trong một tông môn. Ngươi lớn lên giữa sơn môn, nhìn các đệ tử ngự kiếm qua đầu.",
    desc: "Lớn lên trong tông môn: là đệ tử ngay từ đầu (tu luyện nhanh hơn 5%, có bổng lộc), không cần qua khảo hạch nhập môn." },
  { id: "noble", name: "Hậu duệ vương phủ", weight: 7, resources: 60, sect: "none",
    text: "Ngươi sinh ra trong vương phủ, gấm vóc từ nhỏ. Nhưng trong mắt tiên nhân, quyền thế phàm gian chẳng đáng là bao.",
    desc: "Giàu nhất trong các xuất thân phàm tục. Linh tài dồi dào, nhưng quyền thế phàm gian không mua được linh căn." },
  // ---- Xuất thân bổ sung (bonus cộng lúc chào đời)
  { id: "physician", name: "Con nhà lang y", weight: 8, resources: 20, sect: "none",
    text: "Ngươi lớn lên giữa mùi thuốc bắc và tiếng chày giã thuốc. Từ bé đã quen bắt mạch, phân biệt trăm loại thảo dược.",
    desc: "Hiểu dược tính, biết dưỡng sinh: thọ nguyên phàm thể dài hơn, ngộ tính nhỉnh hơn người.",
    bonus: { lifespan: 8, comprehension: 3 } },
  { id: "scholar", name: "Con nhà thư hương", weight: 8, resources: 15, sect: "none",
    text: "Cha ngươi là thầy đồ có tiếng trong huyện. Ngươi biết chữ trước khi biết leo cây, thuộc lòng kinh sử từ thuở nhỏ.",
    desc: "Đọc nhiều hiểu rộng: ngộ tính cao hơn rõ rệt — hợp với các đạo đồ nặng khảo hạch.",
    bonus: { comprehension: 7 } },
  { id: "temple", name: "Tiểu đạo đồng nơi cổ quán", weight: 6, resources: 5, sect: "none",
    text: "Ngươi bị bỏ trước cổng một đạo quán cổ, được lão đạo sĩ nuôi lớn bằng cháo loãng và tiếng chuông sớm chiều.",
    desc: "Lớn lên trong tiếng kinh: tâm tính thuần hậu, mang sẵn chút thiện nghiệp và ngộ tính.",
    bonus: { comprehension: 3, virtue: 6, luck: 2 } },
  { id: "hunter", name: "Con nhà thợ săn rừng thiêng", weight: 7, resources: 10, sect: "none",
    text: "Ngươi theo cha vào rừng từ năm lên sáu, quen với tiếng sói tru và dấu chân yêu thú trên tuyết.",
    desc: "Thân thể rắn rỏi, gan dạ: thọ nguyên phàm thể dài hơn, khí vận khá — sinh tồn giỏi ở các giới hiểm ác.",
    bonus: { lifespan: 6, luck: 3 } },
  { id: "fallen_clan", name: "Hậu duệ thế gia sa sút", weight: 5, resources: 20, sect: "none",
    text: "Tổ tiên ngươi từng là tu tiên thế gia lừng lẫy, nay chỉ còn tòa nhà cũ và một cuốn gia phả rách nát.",
    desc: "Huyết mạch cũ còn sót lại chút khí vận và ngộ tính; linh tài không nhiều như thời hoàng kim.",
    bonus: { luck: 4, comprehension: 3 } },
  { id: "demonic", name: "Con của ma tu", weight: 4, resources: 40, sect: "none",
    text: "Ngươi sinh ra trong hang ổ của một ma tu. Thứ đầu tiên ngươi nhớ là ánh lửa đỏ và tiếng tụng chú lạnh lẽo.",
    desc: "Linh tài dồi dào nhưng mang sẵn ác nghiệp từ thuở lọt lòng — dễ sinh tâm ma nếu đi tiếp đường tà.",
    bonus: { sin: 8, luck: -2 } },
  { id: "omen", name: "Sinh ra có dị tượng", weight: 3, resources: 10, sect: "none",
    text: "Đêm ngươi chào đời, trăm chim bay quanh mái nhà và một luồng tử khí từ phương đông kéo đến. Thầy tướng số lặng người hồi lâu.",
    desc: "Hiếm nhất: trời sinh khí vận và ngộ tính hơn người. Người ta đồn ngươi là tiên nhân chuyển thế.",
    bonus: { luck: 8, comprehension: 5 } },
];


// Đạo đồ: chọn khi thức tỉnh linh căn. Mỗi đạo đồ có ngân hàng câu hỏi và lợi thế riêng.
export const PATHS = [
  {
    id: "nguhanh", name: "Ngũ Hành tu", glyph: "五",
    desc: "Lấy sinh – khắc của Kim, Mộc, Thủy, Hỏa, Thổ làm gốc. Khảo hạch về ngũ hành, phương vị, can chi.",
    perk: "Tu luyện nhanh hơn 6%. Mỗi câu trả lời đúng: +15 tu vi.",
    reward: { cultivation: 15 },
  },
  {
    id: "dich", name: "Dịch tu", glyph: "易",
    desc: "Quan sát biến hóa qua bát quái và sáu mươi tư quẻ. Khảo hạch về Kinh Dịch, tượng quẻ, phương vị.",
    perk: "Ít gặp kết cục xấu hơn 15%. Mỗi câu trả lời đúng: +2 khí vận.",
    reward: { luck: 2 },
  },
  {
    id: "daoluan", name: "Đạo Luận tu", glyph: "道",
    desc: "Nghiền ngẫm điển tịch tu chân và lẽ Đạo gia. Khảo hạch về cảnh giới, giới diện, thuật ngữ tu tiên, Lão – Trang.",
    perk: "Đột phá dễ hơn 3%. Mỗi câu trả lời đúng: +2 ngộ tính.",
    reward: { comprehension: 2 },
  },
  {
    id: "phat", name: "Phật tu", glyph: "佛",
    desc: "Lấy từ bi và trí tuệ làm gốc. Khảo hạch về Phật giáo phổ thông: cuộc đời Đức Phật, Tam Bảo, Ngũ giới, lễ hội, chùa chiền.",
    perk: "Từ bi hộ thân: thương tích nhận vào giảm 10%. Mỗi câu trả lời đúng: +10 thể trạng.",
    reward: { health: 10 },
  },
  {
    id: "tieudao", name: "Tiêu Dao", glyph: "遙",
    desc: "Sống như người thường, vui là chính. Không có câu chuyên môn — chỉ đố vui đời sống, Tết, món ăn, tục ngữ, cổ tích.",
    perk: "Sống vui sống khỏe: thể trạng hồi nhanh hơn 20%. Mỗi câu trả lời đúng: +1 khí vận, +10 linh tài.",
    reward: { luck: 1, resources: 10 },
  },
] as const;

// Tên gọi: họ chung, tên theo giới tính
export const SURNAMES = ["Lý", "Trần", "Hàn", "Lâm", "Tô", "Mộ Dung", "Bạch", "Vân", "Diệp", "Thẩm", "Tiêu", "Liễu", "Cố", "Đường", "Thượng Quan", "Hoa", "Tần", "Lạc"];
export const GIVEN_NAMES = {
  male: ["Trường Phong", "Thanh Vân", "Lập", "Thiên Hành", "Mặc", "Tử Thần", "Viễn Sơn", "Kiếm Minh", "Cảnh Hạo", "Vô Kỵ", "Huyền", "Dật Phàm", "Thừa Ân", "Nhược Hư"],
  female: ["Thanh Tuyết", "Uyển Nhi", "Nguyệt Hoa", "Tịch Dao", "Linh Lung", "Mộng Khê", "Ngọc Hành", "Tử Yên", "Vũ Đồng", "Như Yên", "Thanh Ca", "Sương Nguyệt", "Hàm Yên", "Lạc Anh"],
};

export const WORLDS = [
  { id: "peaceful", name: "Thanh Bình Giới", danger: 0.7, fortune: 1.0, desc: "Thế đạo yên ổn, hiểm họa ít, cơ duyên vừa phải." },
  { id: "abundant", name: "Linh Thịnh Giới", danger: 1.0, fortune: 1.3, desc: "Linh khí dồi dào, tu luyện nhanh hơn hẳn." },
  { id: "turmoil", name: "Loạn Thiên Giới", danger: 1.35, fortune: 1.1, desc: "Chiến loạn liên miên, nguy cơ và cơ duyên cùng lớn." },
  { id: "wild", name: "Hung Hoang Giới", danger: 1.45, fortune: 1.15, desc: "Yêu thú hoành hành, người tu phải đổi máu lấy đạo." },
  { id: "declining", name: "Mạt Pháp Giới", danger: 0.9, fortune: 0.7, desc: "Linh khí suy kiệt, mỗi bước tu hành đều gian nan." },
  { id: "hidden", name: "Ẩn Tiên Giới", danger: 1.0, fortune: 1.2, desc: "Tiên tích ẩn khắp nơi, kỳ ngộ nhiều hơn tai ương." },
  { id: "blood", name: "Huyết Sát Giới", danger: 1.6, fortune: 1.0, desc: "Ma đạo thịnh hành, kẻ yếu khó sống sót." },
  { id: "shattered", name: "Tàn Thiên Giới", danger: 1.4, fortune: 0.9, desc: "Thiên địa rạn vỡ, không gian bất ổn, mất mạng chỉ trong chớp mắt." },
];

// Thế mạnh môn phái (áp khi là đệ tử/trưởng lão, kiếp tạo từ phiên bản môn phái 3):
// speed: hệ số tu luyện · guard: hệ số thương tích nhận vào · regen: hệ số hồi phục · breakthrough: cộng tỉ lệ đột phá
// tribulation: hệ số nguy cơ chết khi độ kiếp · bad: hệ số khả năng gặp kết cục xấu · quiz: hệ số thưởng khảo hạch
// resources: hệ số linh tài nhận được · lifespan: % thọ nguyên của cảnh giới mới cộng thêm mỗi lần đột phá thành công
export type SectFx = { speed?: number; guard?: number; regen?: number; breakthrough?: number; tribulation?: number; bad?: number; quiz?: number; resources?: number; lifespan?: number; comprehension?: number };
// exam: số câu (trên 3) phải đúng khi khảo hạch nhập môn · align: chính đạo / trung lập / ma đạo (quyết định có nhận phản đồ, người nặng ác nghiệp)
export type SectAlign = "chinh" | "trung" | "ta";
export type Sect = { id: string; world: string; name: string; glyph: string; desc: string; since: number; perk: string; fx: SectFx; exam: number; align: SectAlign };

const pctTxt = (x: number) => `${Math.round(Math.abs(x) * 100)}%`;
/** Mô tả thế mạnh sinh từ số liệu — chữ luôn khớp luật. */
export function sectPerkText(fx: SectFx): string {
  const t: string[] = [];
  if (fx.speed) t.push(`tu luyện ${fx.speed > 1 ? "nhanh" : "chậm"} hơn ${pctTxt(fx.speed - 1)}`);
  if (fx.breakthrough) t.push(`đột phá ${fx.breakthrough > 0 ? "+" : "−"}${pctTxt(fx.breakthrough)}`);
  if (fx.quiz) t.push(`thưởng khảo hạch ×${String(fx.quiz).replace(".", ",")}`);
  if (fx.comprehension) t.push(`mỗi câu khảo hạch đúng +${fx.comprehension} ngộ tính`);
  if (fx.guard) t.push(`thương tích ${fx.guard < 1 ? "giảm" : "tăng"} ${pctTxt(fx.guard - 1)}`);
  if (fx.regen) t.push(`hồi phục thể trạng ${fx.regen > 1 ? "nhanh" : "chậm"} hơn ${pctTxt(fx.regen - 1)}`);
  if (fx.tribulation) t.push(`nguy cơ chết khi độ kiếp ${fx.tribulation < 1 ? "giảm" : "tăng"} ${pctTxt(fx.tribulation - 1)}`);
  if (fx.bad) t.push(`${fx.bad < 1 ? "ít" : "dễ"} gặp kết cục xấu ${fx.bad < 1 ? "hơn" : "hơn"} ${pctTxt(fx.bad - 1)}`);
  if (fx.resources) t.push(`linh tài nhận được +${pctTxt(fx.resources - 1)}`);
  if (fx.lifespan) t.push(`mỗi lần đột phá thêm ${pctTxt(fx.lifespan)} thọ nguyên`);
  const s = t.join("; ");
  return s ? s[0].toUpperCase() + s.slice(1) + "." : "";
}

// Thế mạnh từng phái — giá trị cân nhau, mỗi phái một lối chơi
const SECT_FX: Record<string, SectFx> = {
  thanhvan: { breakthrough: 0.03, bad: 0.95 }, // kiếm tu chính đạo: căn cơ vững
  bachthao: { regen: 1.3, resources: 1.1 }, // luyện đan: hồi phục, đan dược
  vanha: { quiz: 1.3, breakthrough: 0.01 }, // thư viện: kinh điển, luận đạo
  linhtieu: { speed: 1.08 }, // linh mạch lớn nhất giới
  vanlinh: { resources: 1.25 }, // đệ tử đông, tài nguyên dồi dào
  tutruc: { lifespan: 0.03, regen: 1.1 }, // tu tâm dưỡng tính: trường thọ
  thienkiem: { speed: 1.05, bad: 0.92, guard: 1.1 }, // lấy chiến dưỡng chiến: liều mà lợi, nhưng chịu đòn nặng
  chienthan: { guard: 0.8 }, // luyện thể thành thần
  huyenco: { tribulation: 0.8 }, // trận pháp hộ kiếp
  manhoang: { guard: 0.85, regen: 1.15 }, // thân thể cứng như sắt
  ngthu: { bad: 0.88 }, // yêu thú hộ chủ
  huyetlang: { resources: 1.2, guard: 0.95 }, // săn yêu đổi linh tài
  codao: { speed: 1.1 }, // giữ lửa tu hành thời mạt pháp: bù linh khí cạn
  tannguyet: { regen: 1.2, tribulation: 0.9 }, // tịnh pháp
  thukinh: { quiz: 1.25, breakthrough: 0.02 }, // kinh thư thượng cổ
  antien: { bad: 0.85 }, // ẩn trong mây, ít gặp hiểm
  bonglai: { resources: 1.15, lifespan: 0.025 }, // tiên đảo đầy cơ duyên
  tieudao: { regen: 1.25, bad: 0.95 }, // tự tại tiêu dao
  quychan: { quiz: 1.5, comprehension: 1, breakthrough: 0.04 }, // huyền học
  huyetma: { speed: 1.12, tribulation: 1.15 }, // lấy huyết luyện công: tiến nhanh, kiếp nạn nặng
  uminh: { lifespan: 0.05, regen: 0.9 }, // quỷ đạo: thọ nguyên dài, thân âm lạnh
  chinhkhi: { tribulation: 0.85, bad: 0.95 }, // chính khí hộ thân
  bothien: { tribulation: 0.75 }, // vá trời: am hiểu thiên đạo
  hukhong: { guard: 0.85, regen: 1.1 }, // chùa giữa hư không
  tinhha: { breakthrough: 0.04 }, // kiếm khí chém nát hư không
};

// Môn phái: mỗi giới diện 3 phái. Được tông môn nhận thì vào một phái của giới mình.
export const SECTS: Sect[] = (
  [
    ["thanhvan", "peaceful", "Thanh Vân Tông", "劍", "Kiếm tu chính đạo, môn quy nghiêm minh."],
    ["bachthao", "peaceful", "Bách Thảo Cốc", "藥", "Thung lũng trăm loài linh thảo, giỏi luyện đan."],
    ["vanha", "peaceful", "Vân Hà Thư Viện", "書", "Thư viện trên mây, trọng kinh điển và luận đạo."],
    ["linhtieu", "abundant", "Linh Tiêu Bảo Điện", "霄", "Điện các trên linh mạch lớn nhất giới."],
    ["vanlinh", "abundant", "Vạn Linh Tông", "靈", "Thu nhận vạn loại linh căn, đệ tử đông đảo."],
    ["tutruc", "abundant", "Tử Trúc Lâm", "竹", "Rừng trúc tím, tu tâm dưỡng tính."],
    ["thienkiem", "turmoil", "Thiên Kiếm Môn", "鋒", "Lấy chiến dưỡng chiến, kiếm ra là thấy máu."],
    ["chienthan", "turmoil", "Chiến Thần Điện", "戰", "Luyện thể thành thần, trăm trận không lui."],
    ["huyenco", "turmoil", "Huyền Cơ Các", "機", "Tinh thông trận pháp và cơ quan thuật."],
    ["manhoang", "wild", "Man Hoang Bộ", "蠻", "Bộ tộc hoang dã, thân thể cứng như sắt."],
    ["ngthu", "wild", "Ngự Thú Tông", "獸", "Thuần phục yêu thú làm bạn chiến đấu."],
    ["huyetlang", "wild", "Huyết Lang Trại", "狼", "Sơn trại giữa rừng sâu, sống bằng săn yêu."],
    ["codao", "declining", "Cổ Đạo Quan", "觀", "Đạo quán cổ giữ lửa tu hành thời mạt pháp."],
    ["tannguyet", "declining", "Tàn Nguyệt Am", "月", "Am nhỏ dưới vầng trăng khuyết, tu tịnh pháp."],
    ["thukinh", "declining", "Thủ Kinh Các", "經", "Canh giữ kinh thư thượng cổ còn sót lại."],
    ["antien", "hidden", "Ẩn Tiên Cốc", "隱", "Thung lũng ẩn trong mây, ít khi lộ diện."],
    ["bonglai", "hidden", "Bồng Lai Đảo", "島", "Tiên đảo ngoài biển khơi, đầy cơ duyên."],
    ["tieudao", "hidden", "Tiêu Dao Phái", "遙", "Tự tại tiêu dao, không màng thế sự."],
    ["huyetma", "blood", "Huyết Ma Giáo", "魔", "Ma giáo hùng mạnh nhất, lấy huyết luyện công."],
    ["uminh", "blood", "U Minh Điện", "冥", "Điện thờ u minh, tu quỷ đạo."],
    ["chinhkhi", "blood", "Chính Khí Minh", "義", "Liên minh chính đạo cuối cùng chống ma."],
    ["bothien", "shattered", "Bổ Thiên Các", "補", "Thề vá lại bầu trời rạn vỡ."],
    ["hukhong", "shattered", "Hư Không Tự", "空", "Ngôi chùa trôi giữa các mảnh không gian."],
    ["tinhha", "shattered", "Tinh Hà Kiếm Phái", "星", "Kiếm khí như dải ngân hà, chém nát hư không."],
  ] as const
).map(([id, world, name, glyph, desc]): Sect => ({ id, world, name, glyph, desc, since: 0, perk: "", fx: {}, exam: 2, align: "trung" }));

// Phái thêm sau: chỉ kiếp tạo từ phiên bản môn phái `since` trở đi mới được nhận vào (kiếp cũ giữ nguyên phái khi phát lại)
SECTS.push({
  id: "quychan", world: "hidden", name: "Quy Chân Các", glyph: "玄",
  desc: "Các lâu ẩn giữa mây mù, chuyên tinh huyền học: dịch lý, ngũ hành, phong thủy, mệnh lý — lấy hiểu đạo làm gốc tu hành.",
  since: 2,
  perk: "",
  fx: {},
  exam: 2,
  align: "chinh",
});
// Đại tông môn: khảo hạch nhập môn phải đúng cả 3 câu
const HARD_EXAM = new Set(["thanhvan", "linhtieu", "huyenco", "ngthu", "thukinh", "quychan", "huyetma", "bothien"]);
const ALIGN: Record<string, SectAlign> = {
  thanhvan: "chinh", bachthao: "chinh", vanha: "chinh", tutruc: "chinh", codao: "chinh", tannguyet: "chinh", chinhkhi: "chinh", hukhong: "chinh", bothien: "chinh", quychan: "chinh", antien: "chinh",
  huyetma: "ta", uminh: "ta", huyetlang: "ta",
};
for (const x of SECTS) {
  x.fx = SECT_FX[x.id] ?? {};
  x.perk = sectPerkText(x.fx);
  x.exam = HARD_EXAM.has(x.id) ? 3 : 2;
  x.align = ALIGN[x.id] ?? "trung";
}
export const ALIGN_NAME: Record<SectAlign, string> = { chinh: "Chính đạo", trung: "Trung lập", ta: "Ma đạo" };
/** Phái có nhận người này không (theo ác nghiệp): chính đạo từ chối kẻ nặng ác nghiệp, ma đạo thì hoan nghênh. */
export const sectAccepts = (x: Sect, sin: number) => (x.align === "chinh" ? sin < 15 : x.align === "trung" ? sin < 30 : true);
// 3: mọi môn phái có thế mạnh riêng (kiếp tạo trước đó chỉ Quy Chân Các có)
// 4: tự chọn phái khi nhập môn, chiêu mộ / phản xuất sư môn, thu nhận phản đồ, tiền duyên sư môn
export const SECT_VERSION = 4;

export type AchievementCtx = { realm: number; age: number; flags: string[]; endingReason: string; ascended: boolean; died: boolean; rootless: boolean };

export const ACHIEVEMENTS: { id: string; name: string; desc: string; test: (c: AchievementCtx) => boolean }[] = [
  { id: "awaken", name: "Dẫn khí nhập thể", desc: "Bước vào Luyện Khí.", test: (c) => c.realm >= 1 },
  { id: "foundation", name: "Trúc Cơ thành", desc: "Đạt Trúc Cơ.", test: (c) => c.realm >= 2 },
  { id: "core", name: "Kết Kim Đan", desc: "Đạt Kim Đan.", test: (c) => c.realm >= 3 },
  { id: "soul", name: "Nguyên Anh xuất khiếu", desc: "Đạt Nguyên Anh.", test: (c) => c.realm >= 4 },
  { id: "spirit", name: "Hóa Thần", desc: "Vượt thiên kiếp đầu tiên, đạt Hóa Thần.", test: (c) => c.realm >= 5 },
  { id: "mahayana", name: "Đại Thừa", desc: "Đạt Đại Thừa.", test: (c) => c.realm >= 8 },
  { id: "immortal", name: "Phi thăng", desc: "Độ kiếp thành Chân Tiên.", test: (c) => c.realm >= 9 },
  { id: "king", name: "Tiên Vương", desc: "Đạt Tiên Vương.", test: (c) => c.realm >= 12 },
  { id: "dao", name: "Chứng đạo", desc: "Vượt bình cảnh cuối cùng ở đỉnh Tiên Đế.", test: (c) => c.ascended },
  { id: "mortal_life", name: "Một đời bình an", desc: "Làm phàm nhân và sống quá 80 tuổi.", test: (c) => c.rootless && c.age >= 80 },
  { id: "short", name: "Hồng nhan bạc mệnh", desc: "Qua đời trước 30 tuổi.", test: (c) => c.died && c.age < 30 },
  { id: "millennium", name: "Thiên niên", desc: "Sống quá 1.000 năm.", test: (c) => c.age >= 1000 },
  { id: "myriad", name: "Vạn tải", desc: "Sống quá 10.000 năm.", test: (c) => c.age >= 10000 },
  { id: "partner", name: "Kết đạo lữ", desc: "Cùng một người đi trên tiên lộ.", test: (c) => c.flags.includes("partnered") },
  { id: "sect", name: "Đệ tử chân truyền", desc: "Được tông môn phong làm trưởng lão.", test: (c) => c.flags.includes("elder") },
  { id: "rogue", name: "Tán tu một đời", desc: "Đạt Kim Đan mà chưa từng gia nhập tông môn.", test: (c) => c.realm >= 3 && !c.flags.includes("joined_sect") },
  { id: "late_bloomer", name: "Đại khí vãn thành", desc: "Từ phàm căn mà bước được vào tiên lộ.", test: (c) => c.flags.includes("root_awakened") },
  { id: "reckless", name: "Liều mạng cầu đạo", desc: "Bỏ mạng vì một lựa chọn mạo hiểm.", test: (c) => c.flags.includes("died_risky") },
  { id: "scholar", name: "Bác thông kinh điển", desc: "Trả lời đúng 8 câu khảo hạch liên tiếp trong một kiếp.", test: (c) => c.flags.includes("streak8") },
  { id: "perfect", name: "Khảo hạch toàn đúng", desc: "Đạt điểm tuyệt đối trong một kỳ khảo hạch nhiều câu.", test: (c) => c.flags.includes("perfect_trial") },
  { id: "heart", name: "Đạo tâm kiên định", desc: "Vượt qua 5 lần vấn tâm trước bình cảnh trong một kiếp.", test: (c) => c.flags.includes("heart5") },
  { id: "tribulation", name: "Thân qua lôi kiếp", desc: "Sống sót qua một lần thiên kiếp thất bại.", test: (c) => c.flags.includes("survived_tribulation") },
  // Nhân quả luân hồi
  { id: "saint", name: "Đại thiện nhân", desc: "Tích 40 thiện nghiệp trong một kiếp.", test: (c) => c.flags.includes("great_virtue") },
  { id: "demon", name: "Ma đầu một cõi", desc: "Gánh 40 ác nghiệp trong một kiếp.", test: (c) => c.flags.includes("great_sin") },
  { id: "heir", name: "Kế thừa tiền kiếp", desc: "Mở động phủ do chính mình kiếp trước để lại.", test: (c) => c.flags.includes("legacy_claimed") },
  { id: "obsession", name: "Chấp niệm tiêu tan", desc: "Vượt qua cảnh giới mà kiếp trước gục ngã.", test: (c) => c.flags.includes("obsession_resolved") },
  { id: "rebond", name: "Tiền duyên tái tục", desc: "Nối lại duyên đạo lữ từ kiếp trước.", test: (c) => c.flags.includes("bond_renewed") },
  { id: "redeem", name: "Oán thù hóa giải", desc: "Hóa giải oan gia từ kiếp trước mà không đổ máu.", test: (c) => c.flags.includes("feud_resolved") },
];
