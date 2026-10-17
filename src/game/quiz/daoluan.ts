// Đạo Luận tu — điển tịch của chính thế giới này (cảnh giới, giới diện, thể chất…), thuật ngữ tu tiên và Đạo gia.
// Câu nào dựa trên số liệu game (thọ nguyên, số tầng…) phải khớp src/game/data.ts.
import { q } from "./types";

const ORDER = "Thứ tự cảnh giới: Phàm nhân → Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Hợp Thể → Đại Thừa → Chân Tiên → Kim Tiên → Huyền Tiên → Tiên Vương → Tiên Đế.";

export const DAOLUAN = [
  // ---------- Cấp 1: thứ tự cảnh giới, thuật ngữ cơ bản
  q("dl-sau-pham", 1, "Cảnh giới đầu tiên khi rời thân phận phàm nhân là gì?", ["Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh"], ORDER),
  q("dl-sau-luyenkhi", 1, "Cảnh giới nào đứng ngay sau Luyện Khí?", ["Trúc Cơ", "Kim Đan", "Hóa Thần", "Nguyên Anh"], ORDER),
  q("dl-sau-trucco", 1, "Cảnh giới nào đứng ngay sau Trúc Cơ?", ["Kim Đan", "Luyện Khí", "Nguyên Anh", "Luyện Hư"], ORDER),
  q("dl-sau-kimdan", 1, "Cảnh giới nào đứng ngay sau Kim Đan?", ["Nguyên Anh", "Hóa Thần", "Trúc Cơ", "Hợp Thể"], ORDER),
  q("dl-sau-nguyenanh", 1, "Cảnh giới nào đứng ngay sau Nguyên Anh?", ["Hóa Thần", "Luyện Hư", "Kim Đan", "Đại Thừa"], ORDER),
  q("dl-tang", 1, "Luyện Khí có bao nhiêu tầng?", ["9", "3", "7", "12"], "Luyện Khí chia làm chín tầng; từ Trúc Cơ trở đi mỗi cảnh giới chia Sơ kỳ, Trung kỳ, Hậu kỳ."),
  q("dl-cao-nhat", 1, "Cảnh giới cao nhất của tiên lộ là gì?", ["Tiên Đế", "Tiên Vương", "Đại Thừa", "Huyền Tiên"], ORDER),
  q("dl-pham-can", 1, "Người mang Phàm căn thì sao?", ["Không thể dẫn khí nhập thể, trừ khi gặp kỳ ngộ", "Tu luyện nhanh nhất", "Chỉ tu được đến Trúc Cơ", "Không bao giờ gặp tai ương"], "Phàm căn không có linh căn để dẫn khí; chỉ kỳ ngộ hiếm hoi mới khai mở được tiên lộ."),
  q("dl-tan-tu", 1, "\"Tán tu\" là gì?", ["Tu sĩ không thuộc tông môn nào", "Đệ tử nội môn", "Người đã phi thăng", "Tu sĩ chuyên luyện đan"], "Tán tu tự do nhưng thiếu tài nguyên và sự che chở của tông môn."),
  q("dl-dao-lu", 1, "\"Đạo lữ\" là gì?", ["Người bạn đời cùng tu đạo", "Sư phụ truyền pháp", "Kẻ thù truyền kiếp", "Đồ đệ thân truyền"], "Đạo lữ cùng nhau song tu, chia sẻ tiên lộ."),
  q("dl-be-quan", 1, "\"Bế quan\" nghĩa là gì?", ["Đóng cửa tĩnh tu, cắt đứt liên hệ bên ngoài", "Rời khỏi tông môn", "Phong ấn một động phủ", "Từ bỏ tu luyện"], "Bế quan là khép cửa tĩnh thất để chuyên tâm tu luyện, có khi kéo dài nhiều năm."),
  q("dl-tau-hoa", 1, "\"Tẩu hỏa nhập ma\" là gì?", ["Linh lực chạy loạn, tâm ma xâm nhập khi tu luyện", "Phép luyện đan bằng lửa", "Một loại pháp bảo", "Cách đột phá an toàn"], "Tẩu hỏa nhập ma là tai họa khi vận công sai hoặc tâm cảnh bất ổn."),
  q("dl-dong-phu", 1, "\"Động phủ\" là gì?", ["Nơi tu sĩ cư ngụ và tu luyện", "Kho báu của tông môn", "Một loại đan dược", "Tên một cảnh giới"], "Động phủ thường đặt nơi linh mạch, có trận pháp bảo hộ."),
  q("dl-linhcan-tot", 1, "Trong các linh căn sau, loại nào có tư chất tốt nhất?", ["Song linh căn", "Tam linh căn", "Tứ linh căn", "Ngũ linh căn"], "Linh căn càng ít hệ càng thuần: Song > Tam > Tứ > Ngũ linh căn."),
  q("dl-phi-thang", 1, "\"Phi thăng\" nghĩa là gì?", ["Rời hạ giới, bay lên tiên giới", "Rơi xuống cảnh giới thấp hơn", "Đổi sang tông môn khác", "Luyện thành pháp bảo"], "Ở thế giới này, độ kiếp từ Đại Thừa thành Chân Tiên chính là phi thăng."),

  // ---------- Cấp 2: luật của thế giới này
  q("dl-gioi-linh", 2, "Giới diện nào có linh khí dồi dào nhất, tu luyện nhanh nhất?", ["Linh Thịnh Giới", "Mạt Pháp Giới", "Thanh Bình Giới", "Tàn Thiên Giới"], "Linh Thịnh Giới có hệ số cơ duyên cao nhất (×1,3)."),
  q("dl-gioi-hiem", 2, "Giới diện nào nguy hiểm nhất?", ["Huyết Sát Giới", "Thanh Bình Giới", "Ẩn Tiên Giới", "Linh Thịnh Giới"], "Huyết Sát Giới có hệ số hiểm họa cao nhất (×1,6): ma đạo thịnh hành, kẻ yếu khó sống."),
  q("dl-mat-phap", 2, "Mạt Pháp Giới có đặc điểm gì?", ["Linh khí suy kiệt, tu hành gian nan", "Yêu thú hoành hành", "Không gian rạn vỡ", "Tiên tích ẩn khắp nơi"], "Mạt Pháp Giới là thời kỳ linh khí cạn dần; mỗi bước tu hành đều khó."),
  q("dl-loi-the", 2, "Thể chất nào giúp thiên kiếp bớt hiểm nguy?", ["Lôi Linh Thể", "Kim Cương Thể", "Thanh Linh Thể", "Thể nhược"], "Lôi Linh Thể trời sinh thân cận lôi đình, giảm nguy cơ vong mạng dưới thiên kiếp."),
  q("dl-kimcuong", 2, "Thể chất nào cứng như kim thạch, khó bị thương?", ["Kim Cương Thể", "Lôi Linh Thể", "Thanh Linh Thể", "Thể chất thường"], "Kim Cương Thể giảm mạnh thương tích nhận vào và hồi phục nhanh."),
  q("dl-daothe", 2, "Thể chất nào hiếm có nhất?", ["Tiên Thiên Đạo Thể", "Kim Cương Thể", "Lôi Linh Thể", "Thanh Linh Thể"], "Tiên Thiên Đạo Thể vạn năm khó gặp, ưu thế ở mọi mặt."),
  q("dl-ho-phap", 2, "Dùng linh tài hộ pháp khi đột phá có tác dụng gì?", ["Tăng khả năng đột phá thành công", "Kéo dài thọ nguyên", "Tránh hoàn toàn thiên kiếp", "Tăng khí vận vĩnh viễn"], "Linh tài hộ pháp tăng đáng kể tỉ lệ thành công của lần đột phá đó."),
  q("dl-cho-thoi", 2, "Chọn \"chưa vội đột phá\" thì điều gì xảy ra?", ["Hồi phục thể trạng, nhưng thọ nguyên vẫn trôi", "Tu vi tăng gấp đôi", "Mất toàn bộ tu vi", "Được miễn thiên kiếp"], "Tích lũy giúp thể trạng hồi phục; nhưng chờ quá lâu có thể hết thọ nguyên ngay trước bình cảnh."),
  q("dl-the-trang", 2, "Thể trạng thấp ảnh hưởng thế nào khi đột phá?", ["Giảm khả năng thành công", "Tăng khả năng thành công", "Không ảnh hưởng gì", "Bắt buộc phải độ kiếp"], "Thân thể thương tổn khiến đột phá dễ thất bại; vượt thiên kiếp khi thể trạng yếu càng dễ vong mạng."),
  q("dl-tho-trucco", 2, "Thọ nguyên của tu sĩ Trúc Cơ vào khoảng bao nhiêu năm?", ["220", "120", "480", "950"], "Thọ nguyên: Luyện Khí ~120, Trúc Cơ ~220, Kim Đan ~480, Nguyên Anh ~950 năm."),
  q("dl-tho-kimdan", 2, "Thọ nguyên của tu sĩ Kim Đan vào khoảng bao nhiêu năm?", ["480", "220", "950", "1.900"], "Kết Kim Đan nâng thọ nguyên lên khoảng 480 năm."),
  q("dl-giua-hopthe", 2, "Cảnh giới nào nằm giữa Luyện Hư và Đại Thừa?", ["Hợp Thể", "Hóa Thần", "Chân Tiên", "Nguyên Anh"], ORDER),
  q("dl-sau-hoathan", 2, "Cảnh giới nào đứng ngay sau Hóa Thần?", ["Luyện Hư", "Hợp Thể", "Đại Thừa", "Nguyên Anh"], ORDER),
  q("dl-sau-chantien", 2, "Cảnh giới nào đứng ngay sau Chân Tiên?", ["Kim Tiên", "Huyền Tiên", "Tiên Vương", "Đại Thừa"], ORDER),
  q("dl-truoc-tiende", 2, "Cảnh giới nào đứng ngay trước Tiên Đế?", ["Tiên Vương", "Huyền Tiên", "Kim Tiên", "Chân Tiên"], ORDER),
  q("dl-truong-lao", 2, "Đệ tử có tu vi vượt xa đồng môn có thể được tông môn phong làm gì?", ["Trưởng lão", "Tạp dịch", "Ngoại môn đệ tử", "Hộ pháp tán tu"], "Trưởng lão có động phủ riêng và tài nguyên tông môn, tu luyện nhanh hơn."),
  q("dl-tiem-ky", 2, "Từ Trúc Cơ trở đi, mỗi đại cảnh giới chia thành mấy tiểu cảnh giới?", ["3", "9", "4", "2"], "Sơ kỳ, Trung kỳ, Hậu kỳ."),
  q("dl-trac-linh", 2, "Trong truyện tu tiên, vật dùng để đo linh căn của trẻ nhỏ thường là gì?", ["Đá (ngọc) trắc linh", "Kính chiếu yêu", "Hồ lô tử kim", "Phù truyền tống"], "Lễ trắc linh dùng đá hoặc ngọc trắc linh: linh căn càng thuần, ánh sáng càng rõ."),

  // ---------- Cấp 3: thiên kiếp, cấu trúc thế giới, Đạo gia
  q("dl-kiep-dau", 3, "Thiên kiếp đầu tiên xuất hiện khi bước vào cảnh giới nào?", ["Hóa Thần", "Nguyên Anh", "Kim Đan", "Luyện Hư"], "Bước vào Hóa Thần, Chân Tiên, Tiên Đế và lúc chứng đạo đều phải độ thiên kiếp; Hóa Thần là lần đầu."),
  q("dl-kiep-khong", 3, "Bước vào cảnh giới nào sau đây KHÔNG phải độ thiên kiếp?", ["Nguyên Anh", "Hóa Thần", "Chân Tiên", "Tiên Đế"], "Các cửa thiên kiếp: Hóa Thần, Chân Tiên, Tiên Đế, và bình cảnh chứng đạo cuối cùng."),
  q("dl-14", 3, "Tính cả Phàm nhân, tiên lộ có tất cả bao nhiêu đại cảnh giới?", ["14", "9", "12", "10"], ORDER),
  q("dl-bao-hiem", 3, "Rút phải số mệnh xấu liên tiếp bao nhiêu lần thì kiếp sau chắc chắn có linh căn tốt?", ["5", "3", "10", "7"], "Thiên đạo có lúc rủ lòng: sau 5 kiếp số mệnh kém liên tiếp, kiếp kế tiếp chắc chắn mang ít nhất Tam linh căn."),
  q("dl-linhcan-cao", 3, "Linh căn nào có điểm tư chất cao nhất?", ["Biến dị linh căn", "Thiên linh căn", "Song linh căn", "Tam linh căn"], "Biến dị linh căn (lôi, băng, phong…) còn hiếm hơn cả Thiên linh căn."),
  q("dl-tam-bao", 3, "\"Tam bảo\" của người tu đạo theo quan niệm Đạo gia gồm những gì?", ["Tinh – Khí – Thần", "Kim – Mộc – Thủy", "Thiên – Địa – Nhân", "Đan – Phù – Trận"], "Đạo gia coi Tinh, Khí, Thần là ba báu vật của thân người; luyện tinh hóa khí, luyện khí hóa thần."),
  q("dl-dan-dien", 3, "Theo quan niệm khí công truyền thống, hạ đan điền nằm ở đâu?", ["Vùng bụng dưới rốn", "Giữa hai lông mày", "Giữa ngực", "Đỉnh đầu"], "Hạ đan điền ở dưới rốn, trung đan điền ở giữa ngực, thượng đan điền ở giữa hai lông mày (quan niệm truyền thống)."),
  q("dl-nguyen-anh", 3, "Trong truyện tu tiên, \"Nguyên Anh\" thường được hiểu là gì?", ["Kim đan hóa thành hài nhi, có thể xuất khiếu", "Một loại yêu thú", "Tên một tông môn", "Pháp bảo hộ thân"], "Kim đan vỡ ra hóa thành nguyên anh — như linh hồn thứ hai, có thể rời thân thể."),
  q("dl-truc-co", 3, "\"Trúc Cơ\" theo nghĩa đen là gì?", ["Xây nền móng", "Luyện thành kim đan", "Mở thiên nhãn", "Tẩy tủy phạt mao"], "Trúc (筑) là xây, cơ (基) là nền: đặt nền móng vững chắc cho đại đạo."),
  q("dl-ngu-linh", 3, "Vì sao Ngũ linh căn bị xem là tư chất kém?", ["Linh căn quá tạp, linh khí phân tán", "Không có linh căn nào", "Chỉ hợp tu ma đạo", "Thọ nguyên quá ngắn"], "Năm hệ cùng tồn tại khiến linh khí hấp thu bị chia nhỏ, tu luyện chậm."),
  q("dl-lao-tu", 3, "Đạo Đức Kinh tương truyền do ai soạn?", ["Lão Tử", "Trang Tử", "Khổng Tử", "Mạnh Tử"], "Tương truyền Lão Tử viết Đạo Đức Kinh trước khi ra khỏi cửa ải Hàm Cốc."),
  q("dl-dao-kha", 3, "\"Đạo khả đạo, phi thường đạo\" là câu mở đầu của tác phẩm nào?", ["Đạo Đức Kinh", "Nam Hoa Kinh", "Luận Ngữ", "Kinh Dịch"], "Câu mở đầu Đạo Đức Kinh: Đạo mà nói ra được thì không phải là Đạo thường hằng."),
  q("dl-trang-mong", 3, "Trang Tử nổi tiếng với giấc mộng hóa thành con vật nào?", ["Bướm", "Cá côn", "Chim bằng", "Hạc"], "\"Trang Chu mộng điệp\": tỉnh dậy, Trang Tử không biết mình mơ thành bướm hay bướm mơ thành mình."),
  q("dl-vo-vi", 3, "\"Vô vi\" trong Đạo gia có nghĩa là gì?", ["Thuận theo tự nhiên, không cưỡng cầu", "Không làm gì cả, lười biếng", "Từ bỏ mọi tu luyện", "Chỉ tu tâm, không tu thân"], "Vô vi là hành động thuận theo lẽ tự nhiên, không gượng ép — không phải là không làm gì."),
  q("dl-thuong-thien", 3, "\"Thượng thiện nhược thủy\" — bậc thiện cao nhất được ví với gì?", ["Nước", "Núi", "Lửa", "Gió"], "Đạo Đức Kinh: nước làm lợi cho vạn vật mà không tranh, ở chỗ thấp mà gần với Đạo."),
];
