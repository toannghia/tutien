// Tuổi thơ (trước khi thức tỉnh linh căn) và cuộc đời của người phàm căn.
import { c, ev, MORTAL, o } from "./helpers";

export const MORTAL_EVENTS = [
  // ---------- Tuổi thơ: ai cũng có thể gặp ----------
  ev("child_fever", "Trận sốt mùa đông", "Năm ấy tuyết rơi dày, ngươi lên cơn sốt mê man suốt ba ngày. Cả nhà thay nhau thức trắng bên giường.", MORTAL, {
    minAge: 2, maxAge: 12, weight: 8, effects: { health: -15 },
  }),
  ev("child_river", "Đứa trẻ rơi xuống sông", "Đang chơi bên bờ sông, ngươi thấy một đứa trẻ trượt chân rơi xuống dòng nước xiết.", MORTAL, {
    minAge: 6, maxAge: 15, weight: 6,
    choices: [
      c("jump", "Nhảy xuống cứu", "Có thể được báo đáp; cũng có thể chết đuối", [
        o("saved", 60, "Ngươi kéo được đứa trẻ vào bờ. Gia đình nó là nhà khá giả, mang lễ vật đến tạ ơn.", { resources: 20, luck: 3, virtue: 5 }),
        o("struggle", 32, "Nước cuốn cả hai đi một đoạn dài. Ngươi cứu được người nhưng ốm nặng suốt một tháng.", { health: -30, luck: 4, virtue: 5 }),
        o("drown", 8, "Dòng nước quá xiết. Người ta tìm thấy hai đứa trẻ ở hạ lưu vào sáng hôm sau.", { death: true, virtue: 5 }, "Chết đuối khi cứu người"),
      ]),
      c("shout", "Chạy đi gọi người lớn", "An toàn", [
        o("helped", 70, "Người lớn chạy đến kịp lúc. Đứa trẻ được cứu, ai cũng khen ngươi nhanh trí.", { luck: 1, virtue: 2 }),
        o("late", 30, "Khi người lớn đến nơi thì đã muộn. Hình ảnh ấy theo ngươi rất nhiều năm.", { luck: -2 }),
      ]),
    ],
  }),
  ev("child_old_man", "Lão nhân bên đường", "Một lão nhân rách rưới xin ngươi bát nước. Ánh mắt lão sáng lạ thường, không giống kẻ ăn mày.", MORTAL, {
    minAge: 5, maxAge: 15, weight: 5,
    choices: [
      c("give", "Mời lão vào nhà ăn bữa cơm", "Lòng tốt", [
        o("blessing", 45, "Lão ăn xong, xoa đầu ngươi rồi cười: \"Đứa nhỏ này có duyên.\" Ngươi thấy người nhẹ hẳn đi.", { luck: 6, health: 10, virtue: 3 }),
        o("token", 25, "Lúc đi, lão để lại một khối ngọc bội ấm áp. Về sau ngươi mới biết đó là linh ngọc.", { resources: 30, luck: 2, virtue: 3 }),
        o("nothing", 30, "Lão ăn xong rồi lặng lẽ rời đi. Có lẽ chỉ là một lão nhân bình thường.", { luck: 1, virtue: 3 }),
      ]),
      c("ignore", "Lắc đầu đi tiếp", "Không mất gì", [o("pass", 1, "Ngươi đi tiếp. Khi ngoảnh lại, lão nhân đã không còn ở đó.", {})]),
    ],
  }),
  ev("child_books", "Sách cũ trên gác", "Dọn gác xép, ngươi tìm thấy một chồng sách ố vàng. Có quyển vẽ những đường kinh mạch kỳ lạ.", MORTAL, {
    minAge: 6, maxAge: 15, weight: 6, effects: { comprehension: 4, cultivation: 10 },
  }),
  ev("child_bully", "Đám trẻ đầu làng", "Đám trẻ lớn hơn chặn đường, đòi ngươi nộp số tiền đi chợ.", MORTAL, {
    minAge: 7, maxAge: 14, weight: 6,
    choices: [
      c("fight", "Đánh trả", "Có thể bị thương", [
        o("win", 40, "Ngươi liều mạng đánh trả. Chúng bỏ chạy, từ đó không ai dám bắt nạt ngươi.", { health: -5, luck: 2 }),
        o("lose", 60, "Ngươi bị đánh bầm dập, tiền cũng mất. Nhưng trong lòng có thứ gì đó cứng cỏi hơn.", { health: -15, resources: -3 }),
      ]),
      c("pay", "Đưa tiền cho xong", "Mất ít tiền", [o("paid", 1, "Ngươi đưa tiền rồi đi về. Bữa tối hôm ấy chỉ có cháo loãng.", { resources: -5 })]),
    ],
  }),
  ev("child_flood", "Lũ lớn tràn về", "Mưa liên tục nửa tháng, nước sông dâng tràn vào làng.", MORTAL, {
    minAge: 3, maxAge: 16, weight: 4, effects: { resources: -10, health: -10 },
  }),
  ev("child_teacher", "Thầy đồ trong trấn", "Thầy đồ trong trấn nhận ngươi làm học trò. Ông nói ngươi học một biết mười.", MORTAL, {
    minAge: 5, maxAge: 15, weight: 6, effects: { comprehension: 3, luck: 1 },
  }),

  // ---------- Người phàm căn: một đời giữa nhân gian ----------
  ev("mortal_trade", "Học nghề", "Không có linh căn, ngươi phải tìm một nghề để sống. Mấy người trong trấn đều muốn nhận ngươi làm học việc.", MORTAL, {
    minAge: 14, maxAge: 22, weight: 25, cond: { rootless: true },
    choices: [
      c("smith", "Theo nghề rèn", "Vất vả, sức khỏe tốt", [o("smith", 1, "Tiếng búa sắt vang suốt những năm tuổi trẻ. Cánh tay ngươi rắn chắc, đủ nuôi sống bản thân.", { health: 15, resources: 15 })]),
      c("doctor", "Học làm thầy thuốc", "Hiểu biết, có lòng người", [o("doctor", 1, "Ngươi học bốc thuốc, xem mạch. Người trong vùng đều quý trọng ngươi.", { comprehension: 5, luck: 3, resources: 10, virtue: 4 })]),
      c("trader", "Theo đoàn buôn", "Nhiều tiền, nhiều rủi ro", [
        o("rich", 55, "Mấy chuyến buôn suôn sẻ, ngươi tích được một khoản không nhỏ.", { resources: 40 }),
        o("robbed", 40, "Đoàn buôn gặp cướp giữa đường, ngươi trắng tay trở về.", { resources: -10, health: -20 }),
        o("killed", 5, "Đoàn buôn bị sơn tặc tập kích. Ngươi không về được nữa.", { death: true }, "Bỏ mạng dưới tay sơn tặc"),
      ]),
    ],
  }),
  ev("mortal_marriage", "Mối lương duyên", "Bà mối đến nhà, nói có người con nhà tử tế ở làng bên ưng ngươi.", MORTAL, {
    minAge: 18, maxAge: 35, weight: 20, cond: { rootless: true, partner: ["none"] },
    choices: [
      c("marry", "Đồng ý thành thân", "Gia đình, an ổn", [o("married", 1, "Ngày cưới pháo nổ rộn ràng. Từ đó ngươi có một mái nhà để trở về.", { partner: "partner", flag: "partnered", luck: 3, health: 10 })]),
      c("refuse", "Từ chối, sống một mình", "Tự do", [o("alone", 1, "Ngươi cảm ơn rồi từ chối. Những năm sau ngươi sống một mình, thanh thản theo cách riêng.", { comprehension: 2 })]),
    ],
  }),
  ev("mortal_child", "Tiếng khóc trẻ thơ", "Đứa con đầu lòng chào đời trong một đêm mưa. Ngươi bế nó trên tay, lặng người rất lâu.", MORTAL, {
    minAge: 20, maxAge: 45, weight: 14, cond: { rootless: true, partner: ["partner"] }, effects: { luck: 4, flag: "parent" },
  }),
  ev("mortal_war", "Lệnh trưng binh", "Triều đình ban lệnh trưng binh, mỗi nhà phải đưa một người ra trận.", MORTAL, {
    minAge: 18, maxAge: 45, weight: 6, cond: { rootless: true },
    choices: [
      c("go", "Ra trận", "Có thể lập công; có thể không trở về", [
        o("hero", 30, "Ngươi lập công nơi biên ải, được ban thưởng ruộng đất.", { resources: 50, health: -15 }),
        o("wounded", 50, "Ba năm chinh chiến, ngươi trở về với một vết thương không bao giờ lành hẳn.", { health: -40 }),
        o("fallen", 20, "Tin báo tử về làng vào cuối thu. Ngươi nằm lại nơi chiến trường xa.", { death: true }, "Tử trận nơi biên ải"),
      ]),
      c("pay", "Bỏ bạc thuê người đi thay", "Tốn kém", [o("paid", 1, "Ngươi dốc gần hết tích lũy để thuê người đi thay.", { resources: -40 })], { minResources: 30 }),
      c("hide", "Trốn lên núi", "Mạo hiểm", [
        o("safe", 60, "Ngươi trốn trong núi hai năm, đến khi chiến sự lắng xuống mới dám về.", { resources: -10, health: -10 }),
        o("caught", 40, "Quan binh bắt được ngươi, đánh trượng rồi bắt đi lao dịch.", { health: -35 }),
      ]),
    ],
  }),
  ev("mortal_famine", "Năm mất mùa", "Hạn hán kéo dài, ruộng đồng nứt nẻ. Cả vùng lâm vào cảnh đói kém.", MORTAL, {
    minAge: 16, weight: 6, maxPerLife: 2, cooldown: 10, cond: { rootless: true }, effects: { resources: -20, health: -15 },
  }),
  ev("mortal_harvest", "Được mùa", "Mưa thuận gió hòa, lúa trĩu bông. Cả nhà có một cái Tết no đủ.", MORTAL, {
    minAge: 16, weight: 10, maxPerLife: 4, cooldown: 4, cond: { rootless: true }, effects: { resources: 15, health: 5 },
  }),
  ev("mortal_hermit", "Ẩn sĩ trong núi", "Vào núi hái thuốc, ngươi gặp một ẩn sĩ đang đánh cờ một mình. Ông mời ngươi ngồi xuống.", MORTAL, {
    minAge: 20, weight: 4, cond: { rootless: true },
    choices: [
      c("play", "Ngồi xuống đánh một ván", "Duyên phận khó lường", [
        o("awaken", 12, "Ván cờ kéo dài như một giấc mộng. Khi tỉnh lại, ngươi cảm nhận được linh khí chảy trong kinh mạch — linh căn đã được khai mở!", { flag: "root_awakened" }),
        o("wisdom", 50, "Ván cờ khiến ngươi ngộ ra nhiều điều. Từ đó ngươi sống chậm rãi, ít bệnh tật.", { comprehension: 6, lifespan: 8, health: 10 }),
        o("time", 38, "Ngươi đánh xong ván cờ, xuống núi thì đã qua ba năm. Người nhà tưởng ngươi đã chết.", { lifespan: 5 }),
      ]),
      c("leave", "Cúi chào rồi xuống núi", "Bình thường", [o("leave", 1, "Ngươi xuống núi. Lần sau quay lại, chẳng còn thấy bàn cờ đâu nữa.", {})]),
    ],
  }),
  ev("mortal_illness", "Bệnh nặng tuổi già", "Tuổi đã cao, một trận bệnh khiến ngươi nằm liệt giường suốt mùa đông.", MORTAL, {
    minAge: 55, weight: 8, maxPerLife: 2, cooldown: 6, cond: { rootless: true }, effects: { health: -30 },
  }),
  ev("mortal_grandchild", "Con cháu đầy nhà", "Con cháu quây quần bên mâm cơm ngày Tết. Ngươi nhìn mái tóc bạc trong gương, mỉm cười.", MORTAL, {
    minAge: 50, weight: 12, cond: { rootless: true, flag: "parent" }, effects: { luck: 3, health: 10, lifespan: 3 },
  }),
];
