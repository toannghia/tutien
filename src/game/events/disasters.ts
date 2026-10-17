// Kiếp nạn không có lựa chọn: tần suất nhân theo độ nguy hiểm của giới diện.
import { CULTIVATOR, ev, IMMORTAL, LOW, MID } from "./helpers";

export const DISASTER_EVENTS = [
  ev("storm", "Linh bạo", "Một trận linh bạo quét qua nơi ngươi dừng chân. Ngươi thoát được, nhưng hành trang thất lạc, thương tích không nhẹ.", CULTIVATOR, {
    weight: 6, maxPerLife: 99, cooldown: 8, effects: { health: -25, resources: -10 },
  }),
  ev("beast_tide", "Thú triều", "Thú triều tràn qua dãy núi. Ngươi cùng các tu sĩ khác cố thủ suốt ba ngày ba đêm.", LOW, {
    weight: 5, maxPerLife: 2, cooldown: 12, effects: { health: -30, resources: 15 },
  }),
  ev("enemy", "Cừu gia tìm đến", "Kẻ thù cũ tìm đến tận động phủ. Trận chiến kéo dài từ đêm đến sáng.", MID, {
    weight: 5, maxPerLife: 3, cooldown: 15, effects: { health: -35, resources: -20 },
  }),
  ev("heart_demon", "Tâm ma quấy nhiễu", "Những chuyện cũ hiện về trong lúc nhập định. Tâm ma khiến ngươi nhiều năm không yên.", MID, {
    weight: 5, maxPerLife: 3, cooldown: 15, effects: { health: -20, cultivation: -20 },
  }),
  ev("space_collapse", "Không gian sụp đổ", "Không gian quanh động phủ đột ngột sụp đổ. Ngươi phải liều mạng xé không gian thoát ra.", [6, 13], {
    weight: 4, maxPerLife: 3, cooldown: 15, effects: { health: -40 },
  }),
  ev("immortal_curse", "Tiên nguyền", "Một lời nguyền cổ xưa từ thời tiên ma đại chiến bám lấy ngươi, bào mòn tiên thể từng ngày.", IMMORTAL, {
    weight: 4, maxPerLife: 2, cooldown: 20, effects: { health: -35, lifespan: -2000 },
  }),
];
