// Tiêu Dao — đường của người thường: không có câu chuyên môn, chỉ đố vui đời sống, Tết, món ăn, tục ngữ, cổ tích.
import { q } from "./types";

export const TIEUDAO = [
  // ---------- Cấp 1: đố vui, đời thường
  q("td-trungthu", 1, "Tết Trung thu, trẻ con thường được ăn bánh gì?", ["Bánh trung thu", "Bánh chưng", "Bánh xèo", "Bánh mì"], "Tết Trung thu (rằm tháng Tám) gắn với bánh nướng, bánh dẻo, đèn ông sao và rước đèn phá cỗ."),
  q("td-banhchung", 1, "Món bánh nào gắn với Tết Nguyên đán và truyền thuyết Lang Liêu?", ["Bánh chưng", "Bánh cuốn", "Bánh bao", "Bánh flan"], "Truyền thuyết kể Lang Liêu làm bánh chưng vuông tượng trưng cho đất, bánh giầy tròn tượng trưng cho trời."),
  q("td-tuan", 1, "Một tuần có mấy ngày?", ["7", "5", "6", "10"], "Thứ Hai đến Chủ nhật: 7 ngày. Câu dễ thì cũng phải ăn mừng chứ!"),
  q("td-chuason", 1, "Con vật nào được gọi là \"chúa sơn lâm\"?", ["Con hổ", "Con voi", "Con gấu", "Con khỉ"], "Hổ được gọi là chúa sơn lâm — vua của núi rừng."),
  q("td-hoadao", 1, "Ngày Tết, miền Bắc hay chưng hoa gì?", ["Hoa đào", "Hoa sen", "Hoa súng", "Hoa phượng"], "Miền Bắc chuộng hoa đào hồng, miền Nam chuộng hoa mai vàng."),
  q("td-uongnuoc", 1, "\"Uống nước nhớ nguồn\" khuyên ta điều gì?", ["Biết ơn người đi trước", "Uống nhiều nước suối", "Đi tìm nguồn nước", "Tiết kiệm nước"], "Câu tục ngữ nhắc ta biết ơn tổ tiên, thầy cô, những người đã tạo nên điều ta đang có."),
  q("td-maisat", 1, "\"Có công mài sắt, có ngày nên kim\" nói về đức tính gì?", ["Kiên trì", "Khéo tay", "Giàu có", "Nhanh nhẹn"], "Chăm chỉ bền bỉ thì việc khó mấy cũng thành."),
  q("td-tygiap", 1, "Con giáp đứng đầu trong 12 con giáp là con gì?", ["Chuột (Tý)", "Trâu (Sửu)", "Rồng (Thìn)", "Hổ (Dần)"], "Thứ tự 12 con giáp: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi."),
  q("td-cauvong", 1, "Cầu vồng thường được kể là có mấy màu?", ["7", "5", "3", "12"], "Đỏ, cam, vàng, lục, lam, chàm, tím."),
  q("td-pho", 1, "Phở là món ăn nổi tiếng của nước nào?", ["Việt Nam", "Nhật Bản", "Thái Lan", "Ý"], "Phở là niềm tự hào ẩm thực Việt, nổi tiếng khắp thế giới."),
  q("td-mattroi", 1, "Mặt trời mọc ở hướng nào?", ["Hướng Đông", "Hướng Tây", "Hướng Nam", "Hướng Bắc"], "Mặt trời mọc đằng Đông, lặn đằng Tây."),
  q("td-cailo", 1, "Đố vui: Cái gì càng lấy đi lại càng to?", ["Cái hố", "Quả bóng", "Cái bánh", "Đống cát"], "Đào đất càng nhiều, cái hố càng to."),
  q("td-tenban", 1, "Đố vui: Cái gì là của bạn nhưng người khác dùng nhiều hơn bạn?", ["Tên của bạn", "Đôi giày", "Cái điện thoại", "Cái ví"], "Người khác gọi tên bạn nhiều hơn chính bạn tự gọi."),
  q("td-quocphuc", 1, "Trang phục truyền thống nổi tiếng của phụ nữ Việt Nam là gì?", ["Áo dài", "Kimono", "Hanbok", "Sari"], "Áo dài thướt tha là biểu tượng duyên dáng của người Việt."),
  q("td-bongda", 1, "Mỗi đội bóng đá có bao nhiêu cầu thủ trên sân?", ["11", "9", "7", "5"], "11 người, kể cả thủ môn."),
  q("td-thieunhi", 1, "Ngày Quốc tế Thiếu nhi là ngày nào?", ["1 tháng 6", "1 tháng 1", "8 tháng 3", "20 tháng 11"], "Ngày 1/6 — ngày vui của các bạn nhỏ."),

  // ---------- Cấp 2: cổ tích, truyền thuyết, quê hương
  q("td-hoguom", 2, "Hồ Gươm gắn với truyền thuyết vua nào trả gươm cho Rùa Vàng?", ["Lê Lợi", "Lý Thái Tổ", "Quang Trung", "Trần Hưng Đạo"], "Sau khi thắng giặc, vua Lê Lợi dạo hồ và trả gươm thần cho Rùa Vàng — hồ được gọi là Hồ Hoàn Kiếm."),
  q("td-giong", 2, "Thánh Gióng cưỡi con vật gì đi đánh giặc?", ["Ngựa sắt", "Voi trắng", "Rồng vàng", "Hổ xám"], "Cậu bé làng Phù Đổng vươn vai thành tráng sĩ, cưỡi ngựa sắt, nhổ tre đánh giặc Ân."),
  q("td-sontinh", 2, "Sính lễ Sơn Tinh mang đến cưới Mị Nương có \"voi chín ngà, gà chín cựa\" và gì nữa?", ["Ngựa chín hồng mao", "Trâu chín sừng", "Cá chín vây", "Chim chín cánh"], "Sơn Tinh đến trước, cưới được Mị Nương; Thủy Tinh tức giận dâng nước — giải thích lũ lụt hằng năm."),
  q("td-tam", 2, "Trong truyện Tấm Cám, Tấm hóa thân vào loài chim nào?", ["Chim vàng anh", "Chim sẻ", "Chim én", "Chim công"], "Tấm lần lượt hóa thân thành chim vàng anh, cây xoan đào, khung cửi rồi quả thị."),
  q("td-cuoi", 2, "Chú Cuội trong truyện cổ tích ngồi dưới gốc cây gì trên cung trăng?", ["Cây đa", "Cây bàng", "Cây tre", "Cây dừa"], "Cây đa thần bay lên trời kéo theo Cuội — nên Tết Trung thu ta vẫn ngắm chú Cuội ngồi gốc đa."),
  q("td-fansipan", 2, "Đỉnh núi cao nhất Việt Nam là đỉnh nào?", ["Fansipan", "Bà Đen", "Ngọc Linh", "Tây Côn Lĩnh"], "Fansipan (Lào Cai) cao hơn 3.100 m, được gọi là \"nóc nhà Đông Dương\"."),
  q("td-danbau", 2, "Đàn bầu — nhạc cụ dân tộc Việt — có mấy dây?", ["1", "2", "3", "16"], "Chỉ một dây mà ngân nga đủ cung bậc — \"Gái chớ nghe đàn bầu\"."),
  q("td-anqua", 2, "Câu tục ngữ nào cùng ý với \"Uống nước nhớ nguồn\"?", ["Ăn quả nhớ kẻ trồng cây", "Ăn cây nào rào cây nấy", "Ăn xổi ở thì", "Ăn vóc học hay"], "Cả hai đều nhắc lòng biết ơn."),
  q("td-nhansu", 2, "Câu đố nổi tiếng: \"Sáng đi bốn chân, trưa đi hai chân, chiều đi ba chân\" là gì?", ["Con người", "Con mèo", "Cái ghế", "Con cua"], "Bé bò bốn chân, lớn đi hai chân, về già chống thêm gậy — câu đố của Nhân sư trong thần thoại Hy Lạp."),
  q("td-caphe", 2, "Món đồ uống nào được xem là \"đặc sản\" của các quán vỉa hè Việt Nam?", ["Cà phê sữa đá", "Trà sữa trân châu", "Nước ép táo", "Sữa nóng"], "Cà phê phin nhỏ giọt với sữa đặc và đá — sáng nào cũng thấy."),
  q("td-banhmi", 2, "Món ăn đường phố Việt nào từng được thêm vào từ điển tiếng Anh với tên gốc?", ["Bánh mì", "Bánh tráng", "Bánh khọt", "Bánh bèo"], "\"Banh mi\" đã được đưa vào từ điển Oxford — ổ bánh mì kẹp đủ thứ ngon."),
  q("td-thorua", 2, "Truyện \"Thỏ và Rùa\" khuyên ta điều gì?", ["Chậm mà chắc, đừng chủ quan", "Chạy càng nhanh càng tốt", "Rùa sống lâu hơn thỏ", "Đừng chơi với thỏ"], "Thỏ nhanh nhưng chủ quan ngủ quên, rùa chậm mà bền bỉ về đích trước."),

  // ---------- Cấp 3: vẫn vui, chỉ hơi khó nhớ hơn
  q("td-ngu", 3, "Người lớn nên ngủ khoảng bao nhiêu tiếng mỗi đêm theo khuyến nghị phổ biến?", ["7–9 tiếng", "3–4 tiếng", "12–14 tiếng", "1–2 tiếng"], "Ngủ đủ giấc giúp minh mẫn — tu tiên cũng phải nghỉ ngơi!"),
  q("td-ruoc-den", 3, "Đèn trung thu hình ngôi sao năm cánh có tên gọi quen thuộc là gì?", ["Đèn ông sao", "Đèn kéo quân", "Đèn lồng đỏ", "Đèn dầu"], "Đèn ông sao làm từ tre và giấy bóng kính — món đồ chơi tuổi thơ."),
  q("td-keoquan", 3, "Chiếc đèn có hình nhân xoay vòng khi thắp nến bên trong gọi là gì?", ["Đèn kéo quân", "Đèn ông sao", "Đèn cù", "Đèn hoa sen"], "Hơi nóng của nến làm tán giấy quay, kéo theo hình người ngựa chạy vòng quanh."),
  q("td-tetnhatbac", 3, "\"Mồng một Tết cha, mồng hai Tết mẹ, mồng ba Tết…\" ai?", ["Thầy", "Bạn", "Hàng xóm", "Ông bà"], "Câu nói dân gian về thứ tự đi chúc Tết: cha, mẹ, rồi thầy."),
  q("td-ngadau", 3, "\"Một con ngựa đau, cả tàu bỏ cỏ\" nói về điều gì?", ["Tình đoàn kết, thương nhau", "Ngựa bị bệnh", "Chăn nuôi khó khăn", "Lười ăn"], "Một người gặp nạn, cả tập thể cùng lo lắng sẻ chia."),
  q("td-cuoi-thuoc", 3, "Theo câu nói vui quen thuộc, \"một nụ cười bằng\" mấy thang thuốc bổ?", ["Mười thang thuốc bổ", "Một bát cơm", "Ba chén trà", "Một giấc ngủ"], "\"Một nụ cười bằng mười thang thuốc bổ\" — đường Tiêu Dao lấy vui làm gốc!"),
];
