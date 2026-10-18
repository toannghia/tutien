// Sự kiện nhân quả: lựa chọn thiện / ác để lại nghiệp lực, theo sang kiếp sau.
// Chỉ xuất hiện ở kiếp có hệ nhân quả (cond.karma) để không làm lệch nhịp các kiếp tạo trước đó.
import { c, CULTIVATOR, ev, o } from "./helpers";

export const KARMA_EVENTS = [
  ev("k_treasure", "Bảo vật vô chủ", "Bên vách núi, một tu sĩ trọng thương ôm chặt một chiếc hộp ngọc phát sáng, hơi thở thoi thóp. Xung quanh không một bóng người.", [1, 8], {
    weight: 7, cooldown: 20, cond: { karma: true },
    choices: [
      c("save", "Cứu người", "Thiện nghiệp · có thể bị lừa", [
        o("grateful", 60, "Ngươi truyền linh lực cứu mạng người lạ. Hắn tỉnh lại, cảm kích tặng ngươi một phần bảo vật.", { virtue: 6, resources: 25, luck: 2 }),
        o("kind", 25, "Người ấy qua khỏi rồi lặng lẽ rời đi, chỉ để lại một cái cúi đầu thật sâu.", { virtue: 6, luck: 1 }),
        o("trap", 15, "Kẻ \"trọng thương\" bật dậy đánh lén — một cái bẫy của tà tu. Ngươi thoát được nhưng bị thương.", { virtue: 3, health: -30 }),
      ]),
      c("rob", "Ra tay đoạt bảo", "Ác nghiệp lớn · lợi lớn", [
        o("loot", 75, "Ngươi kết liễu hơi thở cuối cùng của hắn, mở hộp ngọc: linh đan và công pháp quý. Ánh mắt người chết vẫn mở trừng.", { sin: 12, resources: 70, cultivation: 45 }),
        o("curse", 25, "Hộp ngọc mang lời nguyền máu của chủ nhân. Ngươi có được bảo vật, nhưng đêm nào cũng mơ thấy gương mặt ấy.", { sin: 12, resources: 45, health: -25 }),
      ]),
      c("leave", "Lặng lẽ rời đi", "Không dính nhân quả", [o("leave", 1, "Ngươi quay lưng bước đi. Phía sau, tiếng thở yếu dần rồi tắt hẳn.", { sin: 1 })]),
    ],
  }),
  ev("k_blood_art", "Huyết luyện tà pháp", "Trong một hang đá, ngươi tìm thấy cuốn huyết kinh: luyện hóa tinh huyết phàm nhân để tu vi tiến vượt bậc.", [1, 9], {
    weight: 5, cond: { karma: true },
    choices: [
      c("practice", "Luyện theo huyết kinh", "Tu vi tăng vọt · ác nghiệp nặng", [
        o("power", 1, "Một thôn làng dưới chân núi lặng lẽ biến mất. Tu vi của ngươi tăng vọt, đôi mắt thoáng ánh đỏ.", { sin: 16, cultivation: 130, flag: "blood_art" }),
      ]),
      c("destroy", "Thiêu hủy huyết kinh", "Thiện nghiệp", [o("burn", 1, "Ngọn lửa nuốt trọn những trang giấy đẫm máu. Lòng ngươi nhẹ bẫng, đạo tâm thêm vững.", { virtue: 6, comprehension: 3 })]),
      c("study", "Giữ lại nghiên cứu", "Hiểu thêm ma đạo", [o("study", 1, "Ngươi đọc mà không luyện, hiểu thêm đường lối của ma tu. Có điều, tà niệm đã kịp gieo một hạt mầm.", { comprehension: 3, sin: 3 })]),
    ],
  }),
  ev("k_demon_beast", "Yêu thú phá làng", "Một con yêu thú tàn phá thôn làng dưới núi. Dân làng quỳ rạp cầu xin tiên nhân ra tay.", CULTIVATOR, {
    weight: 7, maxPerLife: 2, cooldown: 25, cond: { karma: true },
    choices: [
      c("slay", "Ra tay trừ yêu", "Thiện nghiệp · nguy hiểm", [
        o("win", 70, "Kiếm quang lóe lên, yêu thú đổ gục. Dân làng lập miếu sinh từ thờ ngươi.", { virtue: 7, resources: 15, health: -10 }),
        o("hurt", 25, "Trận chiến ác liệt, ngươi trừ được yêu nhưng mang thương tích nặng.", { virtue: 7, health: -35 }),
        o("die", 5, "Yêu thú mạnh hơn lời đồn. Ngươi ngã xuống giữa thôn làng mình muốn bảo vệ.", { virtue: 7, death: true }, "Hy sinh khi trừ yêu cứu dân"),
      ]),
      c("ignore", "Tu sĩ không màng phàm trần", "Giữ thân · ác nghiệp nhẹ", [o("ignore", 1, "Ngươi ngự kiếm bay qua. Tiếng kêu cứu xa dần sau lưng.", { sin: 3 })]),
    ],
  }),
  ev("k_refugees", "Nạn dân bên đường", "Đoàn nạn dân đói rách lê bước trên đường cái. Một đứa trẻ níu vạt áo ngươi.", [0, 13], {
    weight: 6, maxPerLife: 3, cooldown: 15, minAge: 12, cond: { karma: true },
    choices: [
      c("give", "Chia lương thực, linh thạch", "Thiện nghiệp · tốn của", [o("give", 1, "Ngươi dốc túi chia cho nạn dân. Đứa trẻ cười toe, chạy về khoe mẹ.", { virtue: 4, resources: -15 })]),
      c("pass", "Gỡ tay đứa trẻ, đi tiếp", "Không tốn gì", [o("pass", 1, "Ngươi gỡ bàn tay nhỏ bé ra rồi đi tiếp.", { sin: 1 })]),
    ],
  }),
  ev("k_frame_peer", "Suất nội môn", "Tông môn chỉ còn một suất vào nội môn. Kẻ cạnh tranh duy nhất là một sư đệ hiền lành — chỉ cần một lời vu cáo là xong.", [1, 6], {
    weight: 6, cond: { karma: true, sect: ["member"] },
    choices: [
      c("frame", "Vu cáo sư đệ", "Ác nghiệp · có thể bại lộ", [
        o("success", 70, "Sư đệ bị phế tu vi, đuổi khỏi sơn môn. Ngươi thay hắn bước vào nội môn.", { sin: 10, resources: 40, cultivation: 35 }),
        o("exposed", 30, "Âm mưu bại lộ. Ngươi bị trục xuất, tiếng xấu đồn khắp giới tu chân.", { sin: 10, sect: "outcast", health: -15 }),
      ]),
      c("fair", "Cạnh tranh quang minh", "Thiện nghiệp", [
        o("win", 50, "Ngươi thắng trong trận tỉ thí công bằng, sư đệ tâm phục khẩu phục.", { virtue: 3, cultivation: 25 }),
        o("lose", 50, "Sư đệ thắng. Ngươi chắp tay chúc mừng — từ đó hai người thành tri kỷ.", { virtue: 4, luck: 2 }),
      ]),
    ],
  }),
  ev("k_heart_demon", "Tâm ma quấy nhiễu", "Những gương mặt ngươi từng hại hiện về trong lúc bế quan, gào thét đòi mạng. Tâm ma đã thành hình.", CULTIVATOR, {
    weight: 9, maxPerLife: 3, cooldown: 12, cond: { karma: true, minSin: 18 },
    choices: [
      c("suppress", "Trấn áp tâm ma, sám hối", "Tổn thương · giảm ác nghiệp", [o("suppress", 1, "Ngươi cắn răng chịu đựng, đọc kinh sám hối suốt bốn mươi chín ngày. Tâm ma lùi lại.", { health: -20, comprehension: 2, sin: -6, virtue: 2 })]),
      c("embrace", "Thuận theo ma niệm", "Sức mạnh · ác nghiệp chồng chất", [o("embrace", 1, "Ngươi để ma niệm dẫn đường. Linh lực cuồn cuộn, nhưng khuôn mặt trong gương ngày càng xa lạ.", { cultivation: 70, sin: 6, health: -10 })]),
    ],
  }),
  ev("k_merit_light", "Công đức kim quang", "Thiện duyên tích tụ, một vầng kim quang nhàn nhạt bao quanh thân ngươi. Người đi đường bất giác cúi chào.", CULTIVATOR, {
    weight: 8, maxPerLife: 2, cooldown: 20, cond: { karma: true, minVirtue: 22 }, effects: { luck: 4, health: 15, lifespan: 10, comprehension: 2 },
  }),
];
