// Chuỗi tông môn và đạo lữ: lựa chọn ở đây để lại trạng thái lâu dài (sect / partner).
import { c, CULTIVATOR, ev, LOW, MID, o } from "./helpers";

export const RELATION_EVENTS = [
  // ---------- Tông môn ----------
  ev("sect_invite", "Lời mời nhập tông", "Một tông môn đang tuyển đệ tử tại chân núi. Ngươi đứng trước sơn môn, cân nhắc giữa sự che chở và con đường tự do.", [1, 2], {
    weight: 14, maxPerLife: 2, cooldown: 15, cond: { sect: ["none"] },
    choices: [
      {
        ...c("join", "Dự kỳ khảo hạch nhập môn", "3 câu hỏi · đúng từ 2 câu được nhận", [
          o("accepted", 70, "Ngươi vượt qua khảo nghiệm, trở thành đệ tử ngoại môn. Tông môn cấp pháp quyết cùng linh thạch hằng tháng.", { sect: "member", flag: "joined_sect", resources: 20 }),
          o("rejected", 30, "Khảo nghiệm kết thúc, tên ngươi không có trên bảng. Ngươi lặng lẽ xuống núi.", { luck: -1 }),
        ]),
        trial: {
          title: "Khảo hạch nhập môn",
          count: 3,
          pass: 2,
          onPass: o("accepted", 1, "Trưởng lão khảo hạch gật gù, ghi tên ngươi vào sổ đệ tử. Tông môn cấp pháp quyết cùng linh thạch hằng tháng.", { sect: "member", flag: "joined_sect", resources: 20 }),
          onFail: o("rejected", 1, "Trưởng lão lắc đầu: \"Căn cơ chưa vững, đạo lý chưa thông.\" Ngươi lặng lẽ xuống núi, hẹn ngày trở lại.", { luck: -1 }),
        },
      },
      c("decline", "Tiếp tục làm tán tu", "Tự do, thiếu thốn", [o("free", 1, "Ngươi chắp tay từ biệt, tiếp tục con đường của riêng mình.", { luck: 2 })]),
    ],
  }),
  ev("sect_task", "Nhiệm vụ tông môn", "Tông môn giao nhiệm vụ: hộ tống một đoàn xe chở linh khoáng qua vùng núi hiểm trở.", LOW, {
    weight: 8, maxPerLife: 3, cooldown: 6, cond: { sect: ["member"] },
    choices: [
      c("accept", "Nhận nhiệm vụ", "Điểm cống hiến · nguy hiểm", [
        o("done", 65, "Đoàn xe về đến nơi an toàn. Ngươi được thưởng điểm cống hiến đổi lấy đan dược.", { resources: 30, cultivation: 15 }),
        o("ambush", 30, "Đoàn xe bị phục kích. Ngươi giữ được hàng nhưng thương tích không nhẹ.", { resources: 20, health: -30 }),
        o("die", 5, "Kẻ phục kích là một ma tu Kim Đan. Cả đoàn hộ tống không ai sống sót.", { death: true }, "Hy sinh khi làm nhiệm vụ tông môn"),
      ]),
      c("refuse", "Viện cớ bế quan", "Mất lòng trưởng lão", [o("refuse", 1, "Trưởng lão không vui, cắt bớt phần linh thạch tháng này của ngươi.", { resources: -10, cultivation: 15 })]),
    ],
  }),
  ev("sect_tournament", "Đại bỉ tông môn", "Mười năm một lần, tông môn tổ chức đại bỉ. Mười người đứng đầu được vào nội môn.", LOW, {
    weight: 9, maxPerLife: 2, cooldown: 10, cond: { sect: ["member"] },
    choices: [
      c("fight", "Lên đài tỉ thí", "Vinh quang hoặc bẽ mặt", [
        o("top", 35, "Ngươi thắng liên tiếp bảy trận, lọt vào top mười. Chưởng môn đích thân ban thưởng.", { resources: 50, cultivation: 40, luck: 2 }),
        o("mid", 45, "Ngươi dừng bước ở vòng thứ ba, nhưng học được nhiều điều từ đối thủ.", { cultivation: 15, health: -10 }),
        o("injured", 20, "Đối thủ ra tay tàn độc, ngươi bị phế mất một phần kinh mạch.", { health: -45, cultivation: -20 }),
      ]),
      c("watch", "Ngồi dưới quan sát", "An toàn", [o("watch", 1, "Ngươi quan sát các trận đấu, ghi nhớ chiêu thức của từng người.", { comprehension: 2 })]),
    ],
  }),
  ev("sect_elder", "Tấn phong trưởng lão", "Tu vi của ngươi đã vượt xa các đồng môn. Chưởng môn muốn phong ngươi làm trưởng lão.", MID, {
    weight: 12, cond: { sect: ["member"] },
    choices: [
      c("accept", "Nhận chức trưởng lão", "Quyền lực · trách nhiệm", [o("elder", 1, "Ngươi trở thành trưởng lão, có động phủ riêng và đệ tử hầu hạ. Tài nguyên tông môn mặc ngươi sử dụng.", { sect: "elder", flag: "elder", resources: 60 })]),
      c("decline", "Từ chối, chỉ muốn tu luyện", "Thanh tịnh", [o("decline", 1, "Ngươi khước từ hư danh, tiếp tục bế quan.", { cultivation: 30, comprehension: 2 })]),
    ],
  }),
  ev("sect_betrayal", "Âm mưu trong tông", "Ngươi vô tình nghe được một vị trưởng lão bàn mưu cấu kết ma đạo, định mở hộ sơn đại trận.", [2, 8], {
    weight: 4, cond: { sect: ["member", "elder"] },
    choices: [
      c("expose", "Tố giác với chưởng môn", "Lập công lớn; bị trả thù", [
        o("rewarded", 55, "Âm mưu bị dập tắt. Chưởng môn ban cho ngươi bảo vật trấn tông.", { resources: 80, luck: 3 }),
        o("revenge", 35, "Kẻ phản đồ trốn thoát, sau đó phục kích ngươi để trả thù.", { health: -45, resources: 30 }),
        o("framed", 10, "Kẻ phản đồ ra tay trước, vu cho ngươi là gian tế. Ngươi bị trục xuất khỏi tông môn.", { sect: "outcast", health: -20 }),
      ]),
      c("silent", "Im lặng rời tông môn", "Bảo toàn tính mạng", [o("leave", 1, "Ngươi lấy cớ du lịch rời sơn môn. Mấy năm sau, tông môn bị ma đạo diệt.", { sect: "outcast", luck: -2 })]),
    ],
  }),
  ev("sect_lecture", "Giảng đường tông môn", "Trưởng lão truyền công mở giảng đường. Cuối buổi, người gọi từng đệ tử lên hỏi bài — ai đáp trôi chảy sẽ được ban thưởng.", CULTIVATOR, {
    weight: 9, maxPerLife: 4, cooldown: 10, cond: { sect: ["member", "elder"], hasPath: true },
    trial: {
      title: "Hỏi bài giảng đường",
      count: 3,
      pass: 2,
      onPass: o("praised", 1, "Trưởng lão khen ngợi trước toàn thể đệ tử, ban cho ngươi đan dược và điểm cống hiến.", { resources: 30, cultivation: 25 }),
      onFail: o("scolded", 1, "Trưởng lão nhíu mày, phạt ngươi chép kinh ba tháng. Dù vậy, chép kinh cũng giúp đạo lý thấm sâu hơn.", { comprehension: 1 }),
    },
  }),
  ev("sect_stipend", "Bổng lộc tông môn", "Kỳ phát bổng lộc đến, ngươi lãnh linh thạch cùng đan dược theo phần.", CULTIVATOR, {
    weight: 10, maxPerLife: 99, cooldown: 4, cond: { sect: ["member", "elder"] }, effects: { resources: 20, cultivation: 10 },
  }),

  // ---------- Đạo lữ ----------
  ev("partner_meet", "Duyên gặp gỡ", "Trên đường du lịch, ngươi cùng một tu sĩ khác giới chung sức vượt qua một trận yêu thú bạo động. Ánh mắt hai người chạm nhau rất lâu.", [1, 8], {
    weight: 7, maxPerLife: 2, cooldown: 20, minAge: 18, cond: { partner: ["none"] },
    choices: [
      c("bond", "Kết làm đạo lữ", "Song tu · vướng bận", [
        o("bond", 80, "Hai người kết làm đạo lữ dưới gốc cây đào già. Từ nay tiên lộ không còn cô độc.", { partner: "partner", flag: "partnered", luck: 4 }),
        o("refused", 20, "Người ấy mỉm cười lắc đầu: \"Đạo của ta, phải tự mình đi.\" Hai người chia tay ở ngã ba.", { comprehension: 2 }),
      ]),
      c("part", "Chúc nhau thượng lộ bình an", "Một mình cầu đạo", [o("part", 1, "Hai người chia tay. Nhiều năm sau, ngươi đôi khi vẫn nhớ đến ánh mắt ấy.", { comprehension: 1 })]),
    ],
  }),
  ev("dual_cultivation", "Song tu", "Ngươi cùng đạo lữ bế quan song tu, linh lực hai người hòa vào nhau như nước chảy.", CULTIVATOR, {
    weight: 9, maxPerLife: 99, cooldown: 5, cond: { partner: ["partner"] }, effects: { cultivation: 45, health: 15 },
  }),
  ev("partner_danger", "Đạo lữ gặp nạn", "Tin dữ truyền đến: đạo lữ của ngươi bị kẻ thù vây khốn ở một ma vực xa xôi.", [2, 13], {
    weight: 5, cooldown: 30, cond: { partner: ["partner"] },
    choices: [
      c("rescue", "Lập tức lên đường cứu", "Có thể mất mạng", [
        o("saved", 55, "Ngươi phá vòng vây, đưa được đạo lữ trở về. Tình nghĩa hai người càng thêm sâu nặng.", { health: -30, luck: 4 }),
        o("lost", 30, "Ngươi đến muộn một bước. Chỉ còn lại tàn hồn tiêu tán trong gió.", { partner: "widowed", health: -20, comprehension: 4 }),
        o("both", 15, "Hai người cùng chết trong ma vực, tay vẫn nắm chặt tay.", { death: true }, "Cùng đạo lữ chết trong ma vực"),
      ]),
      c("wait", "Gửi lời cầu viện rồi chờ", "An toàn cho mình", [
        o("ok", 40, "Đạo lữ tự mình thoát ra, nhưng giữa hai người đã có một vết rạn.", { luck: -2 }),
        o("dead", 60, "Viện binh không kịp đến. Đạo lữ của ngươi vĩnh viễn nằm lại nơi ấy.", { partner: "widowed", comprehension: 3, luck: -3 }),
      ]),
    ],
  }),
  ev("partner_grief", "Mộ phần cố nhân", "Mỗi năm vào ngày ấy, ngươi lại đến trước mộ đạo lữ, rót một chén rượu.", CULTIVATOR, {
    weight: 6, maxPerLife: 3, cooldown: 15, cond: { partner: ["widowed"] }, effects: { comprehension: 2, cultivation: 15 },
  }),
];
