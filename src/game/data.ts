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

export const ORIGINS = [
  { id: "village", name: "Con nhà nông nơi sơn thôn", weight: 34, resources: 5, sect: "none", text: "Ngươi sinh ra trong một mái nhà tranh dưới chân núi. Tiếng gà gáy và mùi lúa mới là những ký ức đầu tiên." },
  { id: "merchant", name: "Con nhà thương hộ", weight: 20, resources: 30, sect: "none", text: "Ngươi sinh ra trong nhà buôn ở trấn lớn. Bạc tiền không thiếu, nhưng cha mẹ luôn mong ngươi được tiên nhân để mắt." },
  { id: "orphan", name: "Cô nhi nơi phố chợ", weight: 12, resources: 0, sect: "none", text: "Ngươi không nhớ mặt cha mẹ. Phố chợ ồn ã là nơi ngươi lớn lên, học cách tự sống từ rất sớm." },
  { id: "clan", name: "Tu tiên thế gia", weight: 14, resources: 45, sect: "none", text: "Ngươi chào đời trong một gia tộc tu tiên. Kỳ vọng đặt lên ngươi từ ngày đầu, dù linh căn còn chưa rõ." },
  { id: "sect_servant", name: "Con nhà tạp dịch tông môn", weight: 12, resources: 10, sect: "member", text: "Cha mẹ ngươi làm tạp dịch trong một tông môn. Ngươi lớn lên giữa sơn môn, nhìn các đệ tử ngự kiếm qua đầu." },
  { id: "noble", name: "Hậu duệ vương phủ", weight: 8, resources: 60, sect: "none", text: "Ngươi sinh ra trong vương phủ, gấm vóc từ nhỏ. Nhưng trong mắt tiên nhân, quyền thế phàm gian chẳng đáng là bao." },
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
    perk: "Ít gặp kết cục xấu hơn 10%. Mỗi câu trả lời đúng: +2 khí vận.",
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

export type Sect = { id: string; world: string; name: string; glyph: string; desc: string; since: number; perk: string };

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
).map(([id, world, name, glyph, desc]): Sect => ({ id, world, name, glyph, desc, since: 0, perk: "" }));

// Phái thêm sau: chỉ kiếp tạo từ phiên bản môn phái `since` trở đi mới được nhận vào (kiếp cũ giữ nguyên phái khi phát lại)
SECTS.push({
  id: "quychan", world: "hidden", name: "Quy Chân Các", glyph: "玄",
  desc: "Các lâu ẩn giữa mây mù, chuyên tinh huyền học: dịch lý, ngũ hành, phong thủy, mệnh lý — lấy hiểu đạo làm gốc tu hành.",
  since: 2,
  perk: "Thế mạnh huyền học: mỗi câu khảo hạch đúng nhận thưởng ×1,5 và +1 ngộ tính; đột phá +4%.",
});
export const SECT_VERSION = 2;

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
];
