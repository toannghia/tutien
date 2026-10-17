// Phật tu — kiến thức Phật giáo phổ thông, dễ, trình bày tôn trọng. Chỉ hỏi điều phổ biến, ít tranh cãi.
import { q } from "./types";

const TAM_BAO = "Tam Bảo là ba ngôi báu: Phật (bậc giác ngộ), Pháp (giáo lý), Tăng (đoàn thể người tu).";
const NGU_GIOI = "Ngũ giới của người Phật tử tại gia: không sát sinh, không trộm cắp, không tà dâm, không nói dối, không uống rượu và dùng chất gây say.";
const TU_DE = "Tứ Diệu Đế gồm: Khổ đế (sự khổ), Tập đế (nguyên nhân của khổ), Diệt đế (sự chấm dứt khổ), Đạo đế (con đường chấm dứt khổ).";

export const PHAT = [
  // ---------- Cấp 1
  q("ph-tamphat", 1, "Tam Bảo trong Phật giáo gồm những gì?", ["Phật, Pháp, Tăng", "Trời, Đất, Người", "Tinh, Khí, Thần", "Giới, Định, Tuệ"], TAM_BAO),
  q("ph-bodhi", 1, "Theo truyền thống, Đức Phật thành đạo dưới gốc cây gì?", ["Cây Bồ-đề", "Cây đa", "Cây sen", "Cây tùng"], "Thái tử Tất-đạt-đa ngồi thiền dưới cội Bồ-đề và giác ngộ. Cây Bồ-đề vì thế trở thành biểu tượng của sự tỉnh thức."),
  q("ph-sen", 1, "Loài hoa nào thường được dùng làm biểu tượng của Phật giáo?", ["Hoa sen", "Hoa hồng", "Hoa cúc", "Hoa mai"], "Hoa sen mọc từ bùn mà không nhiễm mùi bùn — tượng trưng cho tâm thanh tịnh giữa đời thường."),
  q("ph-adida", 1, "Câu niệm \"Nam mô A Di Đà Phật\" hướng về vị Phật nào?", ["Phật A Di Đà", "Phật Di Lặc", "Phật Dược Sư", "Phật Nhiên Đăng"], "Phật A Di Đà gắn với cõi Tây phương Cực Lạc; niệm danh hiệu Ngài là pháp môn phổ biến của Tịnh độ tông."),
  q("ph-quanam", 1, "Bồ Tát nào được xem là biểu tượng của lòng từ bi, \"nghe tiếng kêu cứu của chúng sinh\"?", ["Quán Thế Âm", "Văn Thù", "Phổ Hiền", "Địa Tạng"], "Quán Thế Âm (Quan Âm) nghĩa là \"lắng nghe âm thanh của thế gian\" — biểu tượng của từ bi cứu khổ."),
  q("ph-dilac", 1, "Vị Phật có hình tượng bụng to, miệng cười hoan hỷ thường là ai?", ["Phật Di Lặc", "Phật Thích Ca", "Phật A Di Đà", "Phật Dược Sư"], "Phật Di Lặc được xem là vị Phật tương lai; hình tượng cười hoan hỷ tượng trưng cho niềm vui và sự bao dung."),
  q("ph-nguggioi", 1, "Điều nào sau đây thuộc Ngũ giới của Phật tử?", ["Không nói dối", "Không ăn cơm tối", "Không đi xa nhà", "Không cắt tóc"], NGU_GIOI),
  q("ph-satsinh", 1, "Giới đầu tiên trong Ngũ giới là gì?", ["Không sát sinh", "Không trộm cắp", "Không nói dối", "Không uống rượu"], NGU_GIOI),
  q("ph-tamdoc", 1, "\"Tam độc\" làm tâm người phiền não gồm những gì?", ["Tham, sân, si", "Ăn, ngủ, chơi", "Nóng, lạnh, đói", "Sợ, buồn, lo"], "Tham (ham muốn), sân (giận dữ), si (mê muội) là ba gốc rễ của khổ đau theo giáo lý nhà Phật."),
  q("ph-vulan", 1, "Lễ Vu Lan báo hiếu thường diễn ra vào ngày nào?", ["Rằm tháng Bảy âm lịch", "Mùng một Tết", "Rằm tháng Giêng", "Rằm tháng Tám"], "Vu Lan gắn với tích Bồ Tát Mục Kiền Liên cứu mẹ — dịp tưởng nhớ công ơn cha mẹ."),
  q("ph-dan", 1, "Ngày lễ mừng Đức Phật ra đời gọi là gì?", ["Lễ Phật Đản", "Lễ Vu Lan", "Lễ Thành Đạo", "Lễ Niết Bàn"], "Lễ Phật Đản (Vesak) kỷ niệm ngày Đức Phật đản sinh, thường vào rằm tháng Tư âm lịch."),
  q("ph-motcot", 1, "Ngôi chùa có kiến trúc như bông sen trên một trụ đá ở Hà Nội là chùa nào?", ["Chùa Một Cột", "Chùa Trấn Quốc", "Chùa Hương", "Chùa Bái Đính"], "Chùa Một Cột (Diên Hựu tự) dựng từ thời Lý, hình dáng như đóa sen nở trên mặt hồ."),
  q("ph-ni", 1, "Người phụ nữ xuất gia tu hành trong Phật giáo được gọi là gì?", ["Ni (sư cô)", "Đạo cô", "Tiên cô", "Thánh nữ"], "Tăng là nam xuất gia, Ni là nữ xuất gia."),
  q("ph-bothi", 1, "\"Bố thí\" trong Phật giáo nghĩa là gì?", ["Cho đi, chia sẻ với người khác", "Cầu xin của cải", "Ăn chay trường", "Đọc kinh cả ngày"], "Bố thí là chia sẻ của cải, kiến thức hay sự an lòng cho người khác mà không mong đền đáp."),
  q("ph-nhanqua", 1, "Câu \"gieo nhân nào gặt quả nấy\" nói về điều gì trong đạo Phật?", ["Luật nhân quả", "Phép thần thông", "Cách trồng lúa", "Số mệnh định sẵn"], "Nhân quả: hành động (nghiệp) tốt hay xấu sẽ đem lại kết quả tương ứng."),

  // ---------- Cấp 2
  q("ph-ten", 2, "Tên thật của Đức Phật lịch sử là gì?", ["Tất-đạt-đa Cồ-đàm", "A-nan-đà", "Ca-diếp", "Xá-lợi-phất"], "Thái tử Tất-đạt-đa (Siddhartha) thuộc dòng họ Cồ-đàm (Gautama), sau thành Phật Thích Ca Mâu Ni."),
  q("ph-thichca", 2, "Danh hiệu \"Thích Ca Mâu Ni\" có nghĩa là gì?", ["Bậc thánh của dòng tộc Thích-ca", "Vị vua giàu nhất", "Người sinh dưới gốc cây", "Đứa trẻ bằng vàng"], "\"Thích Ca\" là tên dòng tộc Shakya, \"Mâu Ni\" nghĩa là bậc hiền thánh, người tịch lặng."),
  q("ph-lamtyni", 2, "Theo truyền thống, Đức Phật đản sinh tại đâu?", ["Vườn Lâm-tỳ-ni", "Vườn Lộc Uyển", "Thành Câu-thi-na", "Núi Linh Thứu"], "Vườn Lâm-tỳ-ni (Lumbini) nay thuộc Nepal là nơi Thái tử ra đời."),
  q("ph-locuyen", 2, "Bài pháp đầu tiên của Đức Phật được giảng ở đâu?", ["Vườn Lộc Uyển", "Vườn Lâm-tỳ-ni", "Bồ-đề Đạo Tràng", "Thành Ca-tỳ-la-vệ"], "Tại vườn Lộc Uyển (Sarnath), Đức Phật giảng Tứ Diệu Đế cho năm anh em Kiều Trần Như — gọi là lần \"chuyển Pháp luân\" đầu tiên."),
  q("ph-tude", 2, "\"Tứ Diệu Đế\" gồm mấy chân lý?", ["4", "3", "5", "8"], TU_DE),
  q("ph-tude-dao", 2, "Trong Tứ Diệu Đế, \"Đạo đế\" nói về điều gì?", ["Con đường chấm dứt khổ", "Nguyên nhân của khổ", "Sự khổ trong đời", "Cõi trời an lạc"], TU_DE),
  q("ph-batchanh", 2, "\"Bát Chánh Đạo\" gồm bao nhiêu nhánh?", ["8", "4", "6", "10"], "Bát Chánh Đạo: chánh kiến, chánh tư duy, chánh ngữ, chánh nghiệp, chánh mạng, chánh tinh tấn, chánh niệm, chánh định."),
  q("ph-chanhngu", 2, "\"Chánh ngữ\" trong Bát Chánh Đạo là gì?", ["Lời nói chân thật, hòa nhã", "Đọc kinh to rõ", "Nói nhiều thứ tiếng", "Im lặng mãi mãi"], "Chánh ngữ là nói lời chân thật, không nói dối, không nói lời chia rẽ, thô ác hay vô ích."),
  q("ph-tuvoluong", 2, "\"Tứ vô lượng tâm\" gồm những gì?", ["Từ, Bi, Hỷ, Xả", "Tham, Sân, Si, Mạn", "Giới, Định, Tuệ, Giải thoát", "Xuân, Hạ, Thu, Đông"], "Từ (ban vui), Bi (cứu khổ), Hỷ (vui với niềm vui người khác), Xả (buông bỏ, không thiên vị)."),
  q("ph-vanthu", 2, "Bồ Tát Văn Thù thường tượng trưng cho điều gì?", ["Trí tuệ", "Sức mạnh", "Giàu sang", "Sống lâu"], "Văn Thù Sư Lợi tượng trưng trí tuệ; thường cầm kiếm để chặt đứt vô minh."),
  q("ph-trannhantong", 2, "Thiền phái Trúc Lâm Yên Tử của Việt Nam do ai sáng lập?", ["Vua Trần Nhân Tông", "Vua Lý Thái Tổ", "Thiền sư Vạn Hạnh", "Vua Lê Thánh Tông"], "Vua Trần Nhân Tông nhường ngôi, lên núi Yên Tử tu hành và lập nên Thiền phái Trúc Lâm — dòng thiền thuần Việt."),
  q("ph-trangho", 2, "Chuỗi tràng hạt của Phật giáo thường có bao nhiêu hạt?", ["108", "100", "99", "12"], "108 hạt thường được giải thích là tượng trưng cho 108 phiền não cần vượt qua."),
  q("ph-quyy", 2, "\"Quy y Tam Bảo\" nghĩa là gì?", ["Nương tựa vào Phật, Pháp, Tăng", "Xây ba ngôi chùa", "Ăn chay ba ngày", "Đi hành hương ba nơi"], "Quy y là quay về nương tựa — người quy y Tam Bảo chính thức trở thành Phật tử."),

  // ---------- Cấp 3
  q("ph-boddhgaya", 3, "Nơi Đức Phật thành đạo ngày nay gọi là gì?", ["Bồ-đề Đạo Tràng", "Lộc Uyển", "Lâm-tỳ-ni", "Câu-thi-na"], "Bồ-đề Đạo Tràng (Bodh Gaya) ở Ấn Độ là một trong bốn thánh tích quan trọng nhất của Phật giáo."),
  q("ph-nietban", 3, "Theo truyền thống, Đức Phật nhập Niết-bàn tại đâu?", ["Câu-thi-na", "Lộc Uyển", "Bồ-đề Đạo Tràng", "Lâm-tỳ-ni"], "Bốn thánh tích: Lâm-tỳ-ni (đản sinh), Bồ-đề Đạo Tràng (thành đạo), Lộc Uyển (chuyển Pháp luân), Câu-thi-na (nhập Niết-bàn)."),
  q("ph-xuatgia", 3, "Theo truyền thống phổ biến, Thái tử Tất-đạt-đa xuất gia năm bao nhiêu tuổi?", ["29 tuổi", "19 tuổi", "35 tuổi", "40 tuổi"], "Truyền thống phổ biến kể Thái tử xuất gia năm 29 tuổi và thành đạo năm 35 tuổi."),
  q("ph-chame", 3, "Phụ vương của Thái tử Tất-đạt-đa là ai?", ["Vua Tịnh Phạn", "Vua A-dục", "Vua Ba-tư-nặc", "Vua Tần-bà-sa-la"], "Vua Tịnh Phạn (Suddhodana) và hoàng hậu Ma-da là cha mẹ của Thái tử."),
  q("ph-lucdo", 3, "\"Lục độ\" (sáu ba-la-mật) gồm: bố thí, trì giới, nhẫn nhục, tinh tấn, thiền định và gì nữa?", ["Trí tuệ", "Thần thông", "Giàu có", "Trường thọ"], "Lục độ: bố thí, trì giới, nhẫn nhục, tinh tấn, thiền định, trí tuệ — sáu hạnh đưa người qua bờ giác."),
  q("ph-sackhong", 3, "Câu \"Sắc tức thị không, không tức thị sắc\" nằm trong bộ kinh nào?", ["Bát Nhã Tâm Kinh", "Kinh Pháp Hoa", "Kinh A Di Đà", "Kinh Kim Cương"], "Bát Nhã Tâm Kinh ngắn gọn nhưng nổi tiếng nhất, nói về tính Không của vạn pháp."),
  q("ph-giaidinhtue", 3, "\"Tam vô lậu học\" — ba môn học giúp giải thoát — gồm những gì?", ["Giới, Định, Tuệ", "Văn, Tư, Tu", "Thân, Khẩu, Ý", "Phật, Pháp, Tăng"], "Giữ giới giúp tâm yên, tâm yên sinh định, định sinh trí tuệ."),
  q("ph-anan", 3, "Vị đệ tử nổi tiếng \"đa văn\", thị giả bên Đức Phật nhiều năm là ai?", ["A-nan-đà", "Xá-lợi-phất", "Mục-kiền-liên", "Ca-diếp"], "A-nan-đà (Ananda) nghe và nhớ nhiều lời Phật dạy nhất; nhiều kinh mở đầu bằng \"Tôi nghe như vầy\"."),
];
