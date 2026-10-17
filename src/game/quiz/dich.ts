// Dịch tu — kiến thức Kinh Dịch phổ biến: bát quái, tượng quẻ, phương vị, cấu trúc quẻ.
import { q } from "./types";

const QUAI = ["Càn", "Khôn", "Chấn", "Tốn", "Khảm", "Ly", "Cấn", "Đoài"];
const pickQuai = (right: string, skip = 0) => [right, ...QUAI.filter((x) => x !== right).slice(skip, skip + 3)];
const TUONG = "Bát quái và tượng: Càn – Trời, Khôn – Đất, Chấn – Sấm, Tốn – Gió, Khảm – Nước, Ly – Lửa, Cấn – Núi, Đoài – Đầm (hồ).";
const NHA = "Gia đình bát quái: Càn – cha, Khôn – mẹ, Chấn – trưởng nam, Khảm – trung nam, Cấn – thiếu nam, Tốn – trưởng nữ, Ly – trung nữ, Đoài – thiếu nữ.";
const HAU = "Hậu thiên bát quái (Văn Vương): Ly – Nam, Khảm – Bắc, Chấn – Đông, Đoài – Tây, Càn – Tây Bắc, Khôn – Tây Nam, Cấn – Đông Bắc, Tốn – Đông Nam.";
const PHUONG = ["Nam", "Bắc", "Đông", "Tây", "Tây Bắc", "Tây Nam", "Đông Bắc", "Đông Nam"];
const pickPhuong = (right: string) => [right, ...PHUONG.filter((x) => x !== right).slice(0, 3)];

export const DICH = [
  // ---------- Cấp 1: tượng quẻ, cấu trúc cơ bản
  q("dy-tuong-can", 1, "Quẻ Càn tượng trưng cho gì?", ["Trời", "Đất", "Núi", "Gió"], TUONG),
  q("dy-tuong-khon", 1, "Quẻ Khôn tượng trưng cho gì?", ["Đất", "Trời", "Nước", "Sấm"], TUONG),
  q("dy-tuong-kham", 1, "Quẻ Khảm tượng trưng cho gì?", ["Nước", "Lửa", "Gió", "Núi"], TUONG),
  q("dy-tuong-ly", 1, "Quẻ Ly tượng trưng cho gì?", ["Lửa", "Nước", "Sấm", "Đầm"], TUONG),
  q("dy-tuong-chan", 1, "Quẻ Chấn tượng trưng cho gì?", ["Sấm", "Gió", "Núi", "Trời"], TUONG),
  q("dy-tuong-ton", 1, "Quẻ Tốn tượng trưng cho gì?", ["Gió", "Sấm", "Lửa", "Đất"], TUONG),
  q("dy-tuong-can2", 1, "Quẻ Cấn tượng trưng cho gì?", ["Núi", "Đầm", "Trời", "Nước"], TUONG),
  q("dy-tuong-doai", 1, "Quẻ Đoài tượng trưng cho gì?", ["Đầm (hồ)", "Núi", "Gió", "Lửa"], TUONG),
  q("dy-so-quai", 1, "Bát quái gồm bao nhiêu quẻ đơn?", ["8", "6", "9", "12"], "\"Bát\" là tám: tám quẻ đơn Càn, Khôn, Chấn, Tốn, Khảm, Ly, Cấn, Đoài."),
  q("dy-hao-don", 1, "Mỗi quẻ đơn (kinh quái) gồm mấy hào?", ["3", "2", "6", "4"], "Quẻ đơn gồm ba hào, tượng trưng Thiên – Nhân – Địa."),
  q("dy-hao-kep", 1, "Mỗi quẻ kép (trùng quái) gồm mấy hào?", ["6", "3", "8", "9"], "Quẻ kép do hai quẻ đơn chồng lên nhau nên có sáu hào."),
  q("dy-64", 1, "Kinh Dịch có tất cả bao nhiêu quẻ kép?", ["64", "36", "72", "81"], "Tám quẻ đơn chồng lên nhau theo mọi cách: 8 × 8 = 64 quẻ."),
  q("dy-duong", 1, "Hào dương được vẽ như thế nào?", ["Một vạch liền", "Một vạch đứt ở giữa", "Một vòng tròn", "Hai vạch song song"], "Hào dương là vạch liền (⚊), hào âm là vạch đứt (⚋)."),
  q("dy-am", 1, "Hào âm được vẽ như thế nào?", ["Một vạch đứt ở giữa", "Một vạch liền", "Một dấu chấm", "Một vạch chéo"], "Hào âm là vạch đứt (⚋)."),
  q("dy-can-hao", 1, "Quẻ Càn gồm những hào nào?", ["Ba hào dương", "Ba hào âm", "Hai dương một âm", "Một dương hai âm"], "Càn ☰ thuần dương: ba vạch liền."),
  q("dy-khon-hao", 1, "Quẻ Khôn gồm những hào nào?", ["Ba hào âm", "Ba hào dương", "Hai âm một dương", "Một âm hai dương"], "Khôn ☷ thuần âm: ba vạch đứt."),
  q("dy-dem", 1, "Các hào trong một quẻ được đếm theo thứ tự nào?", ["Từ dưới lên trên", "Từ trên xuống dưới", "Từ giữa ra ngoài", "Không theo thứ tự"], "Hào được đếm từ dưới lên, như sự vật phát triển từ gốc lên ngọn."),

  // ---------- Cấp 2: thái cực sinh bát quái, gia đình, đức tính, ngũ hành, hậu thiên
  q("dy-thaicuc", 2, "Theo Hệ từ truyện, Thái cực sinh ra gì?", ["Lưỡng nghi", "Tứ tượng", "Bát quái", "Ngũ hành"], "\"Dịch hữu Thái cực, thị sinh Lưỡng nghi, Lưỡng nghi sinh Tứ tượng, Tứ tượng sinh Bát quái.\""),
  q("dy-luongnghi", 2, "Lưỡng nghi sinh ra gì?", ["Tứ tượng", "Bát quái", "Thái cực", "Lục hào"], "Lưỡng nghi (âm – dương) sinh Tứ tượng: Thái dương, Thiếu âm, Thiếu dương, Thái âm."),
  q("dy-tutuong", 2, "Tứ tượng sinh ra gì?", ["Bát quái", "Lưỡng nghi", "Ngũ hành", "Sáu mươi tư quẻ"], "Tứ tượng sinh Bát quái — mỗi tượng thêm một hào âm hoặc dương."),
  q("dy-nha-can", 2, "Trong \"gia đình bát quái\", quẻ Càn tượng trưng cho ai?", ["Cha", "Mẹ", "Trưởng nam", "Thiếu nam"], NHA),
  q("dy-nha-khon", 2, "Trong \"gia đình bát quái\", quẻ Khôn tượng trưng cho ai?", ["Mẹ", "Cha", "Trưởng nữ", "Thiếu nữ"], NHA),
  q("dy-nha-chan", 2, "Trong \"gia đình bát quái\", quẻ Chấn tượng trưng cho ai?", ["Trưởng nam", "Trung nam", "Thiếu nam", "Cha"], NHA),
  q("dy-nha-ton", 2, "Trong \"gia đình bát quái\", quẻ Tốn tượng trưng cho ai?", ["Trưởng nữ", "Trung nữ", "Thiếu nữ", "Mẹ"], NHA),
  q("dy-nha-kham", 2, "Trong \"gia đình bát quái\", quẻ Khảm tượng trưng cho ai?", ["Trung nam", "Trưởng nam", "Thiếu nam", "Trung nữ"], NHA),
  q("dy-nha-ly", 2, "Trong \"gia đình bát quái\", quẻ Ly tượng trưng cho ai?", ["Trung nữ", "Trưởng nữ", "Thiếu nữ", "Trung nam"], NHA),
  q("dy-nha-can2", 2, "Trong \"gia đình bát quái\", quẻ Cấn tượng trưng cho ai?", ["Thiếu nam", "Trưởng nam", "Trung nam", "Thiếu nữ"], NHA),
  q("dy-nha-doai", 2, "Trong \"gia đình bát quái\", quẻ Đoài tượng trưng cho ai?", ["Thiếu nữ", "Trưởng nữ", "Trung nữ", "Thiếu nam"], NHA),
  q("dy-duc-can2", 2, "Theo Thuyết quái, đức tính của quẻ Cấn là gì?", ["Dừng lại (chỉ)", "Chuyển động (động)", "Vui vẻ (duyệt)", "Thâm nhập (nhập)"], "Thuyết quái: Càn kiện (mạnh), Khôn thuận, Chấn động, Tốn nhập, Khảm hãm (hiểm), Ly lệ (bám, sáng), Cấn chỉ (dừng), Đoài duyệt (vui)."),
  q("dy-duc-doai", 2, "Theo Thuyết quái, đức tính của quẻ Đoài là gì?", ["Vui vẻ (duyệt)", "Dừng lại (chỉ)", "Hiểm trở (hãm)", "Cương kiện (kiện)"], "Đoài là đầm nước, đức tính là vui vẻ, hòa duyệt."),
  q("dy-duc-kham", 2, "Theo Thuyết quái, đức tính của quẻ Khảm là gì?", ["Hiểm trở (hãm)", "Sáng sủa (lệ)", "Nhu thuận (thuận)", "Vui vẻ (duyệt)"], "Khảm là nước, một hào dương kẹt giữa hai hào âm — tượng hiểm nạn."),
  q("dy-hanh-kim", 2, "Hai quẻ Càn và Đoài cùng thuộc hành nào?", ["Kim", "Thổ", "Mộc", "Thủy"], "Ngũ hành bát quái: Càn, Đoài – Kim; Chấn, Tốn – Mộc; Khôn, Cấn – Thổ; Khảm – Thủy; Ly – Hỏa."),
  q("dy-hanh-moc", 2, "Hai quẻ Chấn và Tốn cùng thuộc hành nào?", ["Mộc", "Kim", "Hỏa", "Thổ"], "Chấn (sấm) và Tốn (gió) thuộc Mộc."),
  q("dy-hanh-tho", 2, "Hai quẻ Khôn và Cấn cùng thuộc hành nào?", ["Thổ", "Kim", "Thủy", "Mộc"], "Khôn (đất) và Cấn (núi) thuộc Thổ."),
  q("dy-hau-ly", 2, "Trong Hậu thiên bát quái, quẻ Ly nằm ở phương nào?", pickPhuong("Nam"), HAU),
  q("dy-hau-kham", 2, "Trong Hậu thiên bát quái, quẻ Khảm nằm ở phương nào?", pickPhuong("Bắc"), HAU),
  q("dy-hau-chan", 2, "Trong Hậu thiên bát quái, quẻ Chấn nằm ở phương nào?", pickPhuong("Đông"), HAU),
  q("dy-hau-doai", 2, "Trong Hậu thiên bát quái, quẻ Đoài nằm ở phương nào?", pickPhuong("Tây"), HAU),

  // ---------- Cấp 3: phương vị phụ, tiên thiên, quẻ kép, thuật ngữ hào, Thuyết quái, Lạc Thư
  q("dy-hau-can", 3, "Trong Hậu thiên bát quái, quẻ Càn nằm ở phương nào?", ["Tây Bắc", "Tây Nam", "Đông Bắc", "Đông Nam"], HAU),
  q("dy-hau-khon", 3, "Trong Hậu thiên bát quái, quẻ Khôn nằm ở phương nào?", ["Tây Nam", "Tây Bắc", "Đông Nam", "Đông Bắc"], HAU),
  q("dy-hau-can2", 3, "Trong Hậu thiên bát quái, quẻ Cấn nằm ở phương nào?", ["Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"], HAU),
  q("dy-hau-ton", 3, "Trong Hậu thiên bát quái, quẻ Tốn nằm ở phương nào?", ["Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc"], HAU),
  q("dy-tien-can", 3, "Trong Tiên thiên bát quái (Phục Hy), quẻ Càn nằm ở phương nào?", pickPhuong("Nam"), "Tiên thiên bát quái: Càn – Nam, Khôn – Bắc, Ly – Đông, Khảm – Tây; trời trên đất dưới, nước lửa đối nhau."),
  q("dy-tien-khon", 3, "Trong Tiên thiên bát quái (Phục Hy), quẻ Khôn nằm ở phương nào?", pickPhuong("Bắc"), "Tiên thiên: Khôn ở phương Bắc, đối diện Càn ở phương Nam."),
  q("dy-que-1", 3, "Quẻ thứ nhất trong Kinh Dịch là quẻ nào?", ["Thuần Càn (Càn vi Thiên)", "Thuần Khôn", "Thủy Lôi Truân", "Sơn Thủy Mông"], "Kinh Dịch mở đầu bằng Càn (1) rồi Khôn (2) — trời đất trước, vạn vật sau."),
  q("dy-que-64", 3, "Quẻ cuối cùng (thứ 64) trong Kinh Dịch là quẻ nào?", ["Hỏa Thủy Vị Tế", "Thủy Hỏa Ký Tế", "Thuần Ly", "Địa Thiên Thái"], "Kinh Dịch kết thúc bằng Vị Tế (chưa xong) — biến hóa không bao giờ dừng."),
  q("dy-que-63", 3, "Quẻ thứ 63, \"đã xong\", có tên là gì?", ["Thủy Hỏa Ký Tế", "Hỏa Thủy Vị Tế", "Thiên Địa Bĩ", "Thuần Khảm"], "Ký Tế: Khảm (nước) trên, Ly (lửa) dưới — mọi hào ở đúng vị, việc đã thành."),
  q("dy-thai", 3, "Quẻ Địa Thiên Thái: quẻ đơn nằm ở trên (ngoại quái) là quẻ nào?", ["Khôn", "Càn", "Cấn", "Khảm"], "Tên quẻ kép đọc quẻ trên trước: Địa (Khôn) trên, Thiên (Càn) dưới. Khí trời bốc lên, khí đất giáng xuống, giao hòa nên \"Thái\" (thông suốt)."),
  q("dy-bi", 3, "Quẻ Thiên Địa Bĩ mang ý nghĩa gì?", ["Bế tắc, không thông", "Hanh thông, thuận lợi", "Khởi đầu gian nan", "Khiêm nhường"], "Trời trên đất dưới nhưng không giao nhau — trên dưới cách trở, nên là \"Bĩ\" (bế tắc)."),
  q("dy-384", 3, "Sáu mươi tư quẻ có tổng cộng bao nhiêu hào?", ["384", "256", "360", "192"], "64 quẻ × 6 hào = 384 hào."),
  q("dy-cuu", 3, "Trong lời hào, hào dương được gọi bằng số nào?", ["Cửu (9)", "Lục (6)", "Thất (7)", "Bát (8)"], "Hào dương gọi là Cửu (số lão dương), hào âm gọi là Lục (số lão âm), ví dụ \"Sơ Cửu\", \"Lục Nhị\"."),
  q("dy-so", 3, "Hào dưới cùng của một quẻ được gọi là gì?", ["Sơ", "Thượng", "Nhị", "Ngũ"], "Sáu hào từ dưới lên: Sơ, Nhị, Tam, Tứ, Ngũ, Thượng."),
  q("dy-thuong", 3, "Hào trên cùng của một quẻ được gọi là gì?", ["Thượng", "Sơ", "Ngũ", "Cửu"], "Hào thứ sáu gọi là Thượng."),
  q("dy-ma", 3, "Theo Thuyết quái, quẻ Càn ứng với con vật nào?", ["Ngựa", "Trâu", "Rồng", "Dê"], "Thuyết quái: Càn – ngựa, Khôn – trâu, Chấn – rồng, Tốn – gà, Khảm – lợn, Ly – chim trĩ, Cấn – chó, Đoài – dê."),
  q("dy-ngu", 3, "Theo Thuyết quái, quẻ Khôn ứng với con vật nào?", ["Trâu", "Ngựa", "Chó", "Gà"], "Khôn nhu thuận, chở nặng như trâu."),
  q("dy-mat", 3, "Theo Thuyết quái, quẻ Ly ứng với bộ phận nào trên cơ thể?", ["Mắt", "Tai", "Miệng", "Tay"], "Thuyết quái: Càn – đầu, Khôn – bụng, Chấn – chân, Tốn – đùi, Khảm – tai, Ly – mắt, Cấn – tay, Đoài – miệng."),
  q("dy-tai", 3, "Theo Thuyết quái, quẻ Khảm ứng với bộ phận nào trên cơ thể?", ["Tai", "Mắt", "Đầu", "Bụng"], "Khảm ứng với tai."),
  q("dy-lacthu", 3, "Trong cửu cung Lạc Thư, con số ở ô chính giữa là bao nhiêu?", ["5", "1", "9", "8"], "Lạc Thư là ma phương 3×3, mọi hàng, cột, đường chéo đều có tổng 15; số 5 nằm giữa."),
  q("dy-phuchy", 3, "Theo truyền thuyết, ai là người vạch ra bát quái?", ["Phục Hy", "Khổng Tử", "Lão Tử", "Hoàng Đế"], "Tương truyền Phục Hy quan sát trời đất mà vạch bát quái; Văn Vương diễn thành 64 quẻ."),
  q("dy-tucuong", 3, "\"Thiên hành kiện, quân tử dĩ tự cường bất tức\" là lời Đại tượng của quẻ nào?", pickQuai("Càn"), "Đại tượng quẻ Càn: trời vận hành mạnh mẽ, người quân tử noi theo mà tự cường không ngừng."),
  q("dy-haoduc", 3, "\"Địa thế khôn, quân tử dĩ hậu đức tải vật\" là lời Đại tượng của quẻ nào?", pickQuai("Khôn"), "Đại tượng quẻ Khôn: thế đất nhu thuận, người quân tử lấy đức dày mà chở vạn vật."),
];
