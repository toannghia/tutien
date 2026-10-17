// Ngũ Hành tu — kiến thức ngũ hành phổ biến trong văn hoá Á Đông (trình bày như học thuyết truyền thống).
import { q } from "./types";

const SINH = "Vòng tương sinh: Mộc → Hỏa → Thổ → Kim → Thủy → Mộc.";
const KHAC = "Vòng tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc.";
const H = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];
const others = (right: string) => [right, ...H.filter((h) => h !== right).slice(0, 3)];

export const NGUHANH = [
  // ---------- Cấp 1: sinh khắc, phương vị, màu, mùa
  q("nh-sinh-moc", 1, "Theo ngũ hành tương sinh, Mộc sinh ra hành nào?", others("Hỏa"), `Gỗ cháy sinh ra lửa. ${SINH}`),
  q("nh-sinh-hoa", 1, "Theo ngũ hành tương sinh, Hỏa sinh ra hành nào?", others("Thổ"), `Lửa thiêu vạn vật thành tro, tro hóa thành đất. ${SINH}`),
  q("nh-sinh-tho", 1, "Theo ngũ hành tương sinh, Thổ sinh ra hành nào?", others("Kim"), `Kim loại được hình thành trong lòng đất. ${SINH}`),
  q("nh-sinh-kim", 1, "Theo ngũ hành tương sinh, Kim sinh ra hành nào?", others("Thủy"), `Cách giải thích cổ: kim loại lạnh làm hơi nước ngưng tụ. ${SINH}`),
  q("nh-sinh-thuy", 1, "Theo ngũ hành tương sinh, Thủy sinh ra hành nào?", others("Mộc"), `Nước nuôi cây cỏ lớn lên. ${SINH}`),
  q("nh-khac-moc", 1, "Theo ngũ hành tương khắc, Mộc khắc hành nào?", others("Thổ"), `Rễ cây đâm xuyên, hút chất của đất. ${KHAC}`),
  q("nh-khac-tho", 1, "Theo ngũ hành tương khắc, Thổ khắc hành nào?", others("Thủy"), `Đất đắp đê ngăn được nước. ${KHAC}`),
  q("nh-khac-thuy", 1, "Theo ngũ hành tương khắc, Thủy khắc hành nào?", others("Hỏa"), `Nước dập tắt lửa. ${KHAC}`),
  q("nh-khac-hoa", 1, "Theo ngũ hành tương khắc, Hỏa khắc hành nào?", others("Kim"), `Lửa nung chảy kim loại. ${KHAC}`),
  q("nh-khac-kim", 1, "Theo ngũ hành tương khắc, Kim khắc hành nào?", others("Mộc"), `Dao rìu bằng kim loại chặt được cây. ${KHAC}`),
  q("nh-phuong-dong", 1, "Phương Đông ứng với hành nào?", others("Mộc"), "Đông – Mộc, Nam – Hỏa, Tây – Kim, Bắc – Thủy, Trung ương – Thổ. Phương Đông là nơi mặt trời mọc, vạn vật sinh trưởng như cây cỏ."),
  q("nh-phuong-nam", 1, "Phương Nam ứng với hành nào?", others("Hỏa"), "Phương Nam nóng ấm nên ứng với Hỏa."),
  q("nh-phuong-tay", 1, "Phương Tây ứng với hành nào?", others("Kim"), "Phương Tây ứng với Kim, mùa thu, sắc trắng."),
  q("nh-phuong-bac", 1, "Phương Bắc ứng với hành nào?", others("Thủy"), "Phương Bắc lạnh lẽo, ứng với Thủy và mùa đông."),
  q("nh-phuong-trung", 1, "Trung ương (chính giữa) ứng với hành nào?", others("Thổ"), "Thổ ở trung tâm, nâng đỡ bốn hành còn lại."),
  q("nh-mau-hoa", 1, "Màu đỏ ứng với hành nào?", others("Hỏa"), "Ngũ sắc: Mộc xanh, Hỏa đỏ, Thổ vàng, Kim trắng, Thủy đen."),
  q("nh-mau-kim", 1, "Màu trắng ứng với hành nào?", others("Kim"), "Kim ứng với sắc trắng, như ánh bạc của kim loại."),
  q("nh-mau-thuy", 1, "Màu đen (huyền) ứng với hành nào?", others("Thủy"), "Thủy ứng với sắc đen — nước sâu thì tối thẫm."),
  q("nh-mau-moc", 1, "Màu xanh (thanh) ứng với hành nào?", others("Mộc"), "Mộc ứng với sắc xanh của cây cỏ."),
  q("nh-mau-tho", 1, "Màu vàng ứng với hành nào?", others("Thổ"), "Thổ ứng với sắc vàng của đất."),
  q("nh-mua-xuan", 1, "Mùa xuân ứng với hành nào?", others("Mộc"), "Xuân – Mộc, Hạ – Hỏa, Thu – Kim, Đông – Thủy; Thổ vượng vào cuối mỗi mùa."),
  q("nh-mua-dong", 1, "Mùa đông ứng với hành nào?", others("Thủy"), "Mùa đông lạnh giá, vạn vật ẩn tàng — ứng với Thủy."),
  q("nh-mua-thu", 1, "Mùa thu ứng với hành nào?", others("Kim"), "Mùa thu túc sát, lá rụng — ứng với Kim."),
  q("nh-mua-ha", 1, "Mùa hạ ứng với hành nào?", others("Hỏa"), "Mùa hạ nóng bức, ứng với Hỏa."),

  // ---------- Cấp 2: can chi, tứ tượng, ngũ vị, tạng phủ, ứng dụng sinh khắc
  q("nh-can-giapat", 2, "Thiên can Giáp và Ất thuộc hành nào?", others("Mộc"), "Giáp Ất – Mộc, Bính Đinh – Hỏa, Mậu Kỷ – Thổ, Canh Tân – Kim, Nhâm Quý – Thủy."),
  q("nh-can-canhtan", 2, "Thiên can Canh và Tân thuộc hành nào?", others("Kim"), "Canh Tân thuộc Kim (Canh dương Kim, Tân âm Kim)."),
  q("nh-can-nhamquy", 2, "Thiên can Nhâm và Quý thuộc hành nào?", others("Thủy"), "Nhâm Quý thuộc Thủy."),
  q("nh-can-binhdinh", 2, "Thiên can Bính và Đinh thuộc hành nào?", others("Hỏa"), "Bính Đinh thuộc Hỏa."),
  q("nh-can-mauky", 2, "Thiên can Mậu và Kỷ thuộc hành nào?", others("Thổ"), "Mậu Kỷ thuộc Thổ."),
  q("nh-chi-ty", 2, "Địa chi Tý thuộc hành nào?", others("Thủy"), "Hợi Tý – Thủy, Tỵ Ngọ – Hỏa, Dần Mão – Mộc, Thân Dậu – Kim, Thìn Tuất Sửu Mùi – Thổ."),
  q("nh-chi-ngo", 2, "Địa chi Ngọ thuộc hành nào?", others("Hỏa"), "Tỵ Ngọ thuộc Hỏa; giờ Ngọ là giữa trưa, lúc nóng nhất."),
  q("nh-chi-dau", 2, "Địa chi Dậu thuộc hành nào?", others("Kim"), "Thân Dậu thuộc Kim."),
  q("nh-chi-mao", 2, "Địa chi Mão thuộc hành nào?", others("Mộc"), "Dần Mão thuộc Mộc."),
  q("nh-chi-tutho", 2, "Bốn địa chi Thìn, Tuất, Sửu, Mùi cùng thuộc hành nào?", others("Thổ"), "Thìn Tuất Sửu Mùi là tứ khố, thuộc Thổ, nằm ở cuối mỗi mùa."),
  q("nh-thanhlong", 2, "Thanh Long trấn giữ phương nào?", ["Phương Đông", "Phương Tây", "Phương Nam", "Phương Bắc"], "Tứ tượng: Thanh Long – Đông (Mộc), Bạch Hổ – Tây (Kim), Chu Tước – Nam (Hỏa), Huyền Vũ – Bắc (Thủy)."),
  q("nh-bachho", 2, "Bạch Hổ trấn giữ phương nào?", ["Phương Tây", "Phương Đông", "Phương Nam", "Phương Bắc"], "Bạch Hổ ở phương Tây, sắc trắng, thuộc Kim."),
  q("nh-chutuoc", 2, "Chu Tước ứng với hành nào?", others("Hỏa"), "Chu Tước là chim đỏ phương Nam, thuộc Hỏa."),
  q("nh-huyenvu", 2, "Huyền Vũ ứng với hành nào?", others("Thủy"), "Huyền Vũ (rùa – rắn) ở phương Bắc, sắc đen, thuộc Thủy."),
  q("nh-vi-chua", 2, "Trong ngũ vị, vị chua ứng với hành nào?", others("Mộc"), "Ngũ vị: chua – Mộc, đắng – Hỏa, ngọt – Thổ, cay – Kim, mặn – Thủy."),
  q("nh-vi-man", 2, "Trong ngũ vị, vị mặn ứng với hành nào?", others("Thủy"), "Vị mặn ứng với Thủy — như nước biển."),
  q("nh-vi-cay", 2, "Trong ngũ vị, vị cay ứng với hành nào?", others("Kim"), "Vị cay ứng với Kim."),
  q("nh-tang-can", 2, "Theo học thuyết ngũ hành cổ, tạng Can (gan) được phối với hành nào?", others("Mộc"), "Phép phối cổ: Can – Mộc, Tâm – Hỏa, Tỳ – Thổ, Phế – Kim, Thận – Thủy. Đây là học thuyết truyền thống, không phải lời khuyên y khoa."),
  q("nh-tang-phe", 2, "Theo học thuyết ngũ hành cổ, tạng Phế (phổi) được phối với hành nào?", others("Kim"), "Phế được phối với Kim trong học thuyết ngũ hành cổ."),
  q("nh-tang-than", 2, "Theo học thuyết ngũ hành cổ, tạng Thận được phối với hành nào?", others("Thủy"), "Thận được phối với Thủy trong học thuyết ngũ hành cổ."),
  q("nh-tang-tam", 2, "Theo học thuyết ngũ hành cổ, tạng Tâm (tim) được phối với hành nào?", others("Hỏa"), "Tâm được phối với Hỏa trong học thuyết ngũ hành cổ."),
  q("nh-che-hoa", 2, "Hỏa quá vượng, theo lý ngũ hành nên dùng hành nào để chế ngự?", others("Thủy"), `Thủy khắc Hỏa, nên dùng Thủy để kiềm chế Hỏa. ${KHAC}`),
  q("nh-bo-moc", 2, "Mộc suy yếu, theo lý ngũ hành nên dùng hành nào để bồi bổ (sinh cho Mộc)?", others("Thủy"), `Thủy sinh Mộc, nên Thủy là hành nuôi dưỡng Mộc. ${SINH}`),
  q("nh-tiet-tho", 2, "Hành nào làm Thổ hao tổn vì Thổ phải sinh ra nó?", others("Kim"), "Thổ sinh Kim: sinh ra thì hao tổn sức mình, gọi là \"tiết khí\"."),

  // ---------- Cấp 3: ngũ âm, Hà Đồ, ngũ thường, ngũ chí, thiên văn, mẫu – tử
  q("nh-am-cung", 3, "Trong ngũ âm, âm \"Cung\" ứng với hành nào?", others("Thổ"), "Ngũ âm: Cung – Thổ, Thương – Kim, Giốc – Mộc, Chủy – Hỏa, Vũ – Thủy."),
  q("nh-am-vu", 3, "Trong ngũ âm, âm \"Vũ\" ứng với hành nào?", others("Thủy"), "Âm Vũ ứng với Thủy."),
  q("nh-am-giac", 3, "Trong ngũ âm, âm \"Giốc\" ứng với hành nào?", others("Mộc"), "Âm Giốc ứng với Mộc."),
  q("nh-hado-16", 3, "Trong Hà Đồ, cặp số 1 – 6 ứng với hành nào?", others("Thủy"), "Hà Đồ: 1–6 Thủy (Bắc), 2–7 Hỏa (Nam), 3–8 Mộc (Đông), 4–9 Kim (Tây), 5–10 Thổ (Trung ương)."),
  q("nh-hado-27", 3, "Trong Hà Đồ, cặp số 2 – 7 ứng với hành nào?", others("Hỏa"), "Hà Đồ: cặp 2–7 ở phương Nam, thuộc Hỏa."),
  q("nh-hado-38", 3, "Trong Hà Đồ, cặp số 3 – 8 ứng với hành nào?", others("Mộc"), "Hà Đồ: cặp 3–8 ở phương Đông, thuộc Mộc."),
  q("nh-thuong-nghia", 3, "Theo cách phối phổ biến, đức \"Nghĩa\" trong ngũ thường ứng với hành nào?", others("Kim"), "Cách phối phổ biến: Nhân – Mộc, Lễ – Hỏa, Tín – Thổ, Nghĩa – Kim, Trí – Thủy."),
  q("nh-thuong-nhan", 3, "Theo cách phối phổ biến, đức \"Nhân\" trong ngũ thường ứng với hành nào?", others("Mộc"), "Nhân ứng với Mộc — lòng nhân như cây xuân nuôi dưỡng vạn vật."),
  q("nh-chi-no", 3, "Trong ngũ chí, cơn giận (nộ) được phối với hành nào?", others("Mộc"), "Ngũ chí: nộ – Mộc, hỷ – Hỏa, tư – Thổ, bi – Kim, khủng – Thủy."),
  q("nh-chi-khung", 3, "Trong ngũ chí, nỗi sợ (khủng) được phối với hành nào?", others("Thủy"), "Khủng (sợ hãi) được phối với Thủy."),
  q("nh-me-con", 3, "Thổ sinh Kim. Trong quan hệ đó, Thổ được gọi là gì của Kim?", ["Mẫu (mẹ)", "Tử (con)", "Hành khắc Kim", "Hành bị Kim khắc"], "Hành sinh ra mình là \"mẫu\", hành do mình sinh ra là \"tử\". Thổ sinh Kim nên Thổ là mẫu của Kim."),
  q("nh-tuetinh", 3, "Trong thiên văn cổ, \"Tuế tinh\" là tên gọi của sao nào?", ["Sao Mộc", "Sao Kim", "Sao Hỏa", "Sao Thổ"], "Ngũ tinh: Tuế tinh – sao Mộc, Huỳnh Hoặc – sao Hỏa, Trấn tinh – sao Thổ, Thái Bạch – sao Kim, Thần tinh – sao Thủy."),
  q("nh-thaibach", 3, "Trong thiên văn cổ, \"Thái Bạch\" là tên gọi của sao nào?", ["Sao Kim", "Sao Mộc", "Sao Thủy", "Sao Thổ"], "Thái Bạch là sao Kim — ngôi sao sáng trắng lúc chiều tối hoặc rạng sáng."),
  q("nh-khieu-mat", 3, "Theo học thuyết ngũ hành cổ, đôi mắt là \"khiếu\" của tạng nào?", ["Can", "Thận", "Phế", "Tỳ"], "Ngũ khiếu: Can – mắt, Tâm – lưỡi, Tỳ – miệng, Phế – mũi, Thận – tai (học thuyết truyền thống)."),
  q("nh-khieu-tai", 3, "Theo học thuyết ngũ hành cổ, đôi tai là \"khiếu\" của tạng nào?", ["Thận", "Can", "Tâm", "Phế"], "Thận khai khiếu ra tai, theo học thuyết ngũ hành cổ."),
];
