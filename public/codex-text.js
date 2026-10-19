// Văn bản Cẩm nang: giải thích chi tiết từng mục cho người chơi. Chỉ để hiển thị — số liệu lấy từ codex máy chủ.

export const REALM_LORE = {
  mortal: {
    lore: "Thân xác phàm tục, chưa cảm nhận được linh khí. Tuổi thọ chừng bảy, tám mươi năm như người thường.",
    play: "Ai cũng bắt đầu ở đây. Có linh căn thì khoảng 8–14 tuổi sẽ thức tỉnh. Phàm căn sống trọn đời người thường (học nghề, lập gia đình, con cháu…) — trừ khi gặp ẩn sĩ khai mở linh căn.",
  },
  qi_refining: {
    lore: "Dẫn linh khí trời đất vào kinh mạch, tôi luyện thân thể. Chín tầng luyện khí là nền móng của mọi con đường tu tiên.",
    play: "Ngay khi bước vào phải chọn đạo đồ. Đây là lúc dễ gặp lời mời nhập tông, nên cân nhắc gia nhập để tu luyện nhanh hơn. Đột phá lên Trúc Cơ khá dễ; có Trúc Cơ Đan thì +20%.",
  },
  foundation: {
    lore: "Linh khí ngưng tụ thành đạo cơ trong đan điền — từ đây mới thật sự bước chân vào giới tu chân.",
    play: "Thọ nguyên lên ~220 năm. Nhiệm vụ và đại bỉ tông môn xuất hiện nhiều. Bắt đầu tích linh tài để hộ pháp cho các bình cảnh sau.",
  },
  golden_core: {
    lore: "Đạo cơ cô đọng thành một viên kim đan — tu sĩ Kim Đan đã được xem là cao thủ một phương.",
    play: "Đạt Kim Đan thì khi tọa hóa sẽ để lại động phủ cho kiếp sau. Từ đây tu luyện bắt đầu chậm dần theo độ dốc độ khó.",
  },
  nascent_soul: {
    lore: "Kim đan vỡ ra, thai nghén thành Nguyên Anh — một tiểu nhân ngồi thiền trong đan điền, nhục thân chết đi vẫn có thể đoạt xá.",
    play: "Thọ nguyên gần nghìn năm. Có thể được phong trưởng lão tông môn. Hãy dưỡng thể trạng thật tốt: bình cảnh kế tiếp là thiên kiếp đầu tiên.",
  },
  spirit_transformation: {
    lore: "Nguyên Anh hóa thành nguyên thần, cảm ứng pháp tắc thiên địa. Trời đất không dung, giáng thiên kiếp thử thách.",
    play: "Phải độ thiên kiếp: thất bại có thể hồn phi phách tán. Thể trạng dưới 60 làm tăng nguy cơ chết ×1,5. Lôi Linh Thể, thiện nghiệp cao giúp đỡ hiểm.",
  },
  void_refining: {
    lore: "Luyện hóa hư không, nguyên thần du hành giữa các tầng không gian.",
    play: "Bình cảnh dày lên rõ rệt. Đây là chặng đa số tu sĩ dừng bước — tận dụng vấn tâm (+10%) và hộ pháp (+10%).",
  },
  body_integration: {
    lore: "Nguyên thần và nhục thân hợp nhất, một ý niệm có thể dời non lấp biển.",
    play: "Thọ nguyên ~6.500 năm. Tu luyện còn khoảng một phần ba tốc độ ban đầu — kiên nhẫn và giữ mạng là chính.",
  },
  mahayana: {
    lore: "Đại Thừa viên mãn, đứng trên đỉnh nhân giới, chỉ còn một bước là phi thăng.",
    play: "Bình cảnh kế tiếp là thiên kiếp phi thăng, khó hơn hẳn. Đây là cảnh giới cao nhất phần lớn người chơi đạt được trong một kiếp.",
  },
  true_immortal: {
    lore: "Vượt lôi kiếp phi thăng, thoát khỏi phàm thai, chính thức thành tiên.",
    play: "Thiên kiếp thứ hai, hung hơn Hóa Thần. Đạt được là thành tựu \"Phi thăng\". Từ đây là tiên giới — thọ nguyên hàng vạn năm.",
  },
  golden_immortal: {
    lore: "Tiên thể kim thân bất hoại, vạn kiếp khó tổn.",
    play: "Tỉ lệ đột phá cơ bản đã rất thấp; linh căn, ngộ tính, phúc báo, túc tuệ và pháp bảo tiền kiếp trở nên quyết định.",
  },
  mystic_immortal: {
    lore: "Thấu hiểu huyền diệu của đại đạo, một niệm sinh một phương thế giới.",
    play: "Mỗi lần thất bại đều tốn nhiều năm tu luyện lại — hãy chắc chắn trước khi thử.",
  },
  immortal_king: {
    lore: "Vương giả trong tiên giới, thống lĩnh một phương tiên vực.",
    play: "Cực hiếm. Thường là thành quả của nhiều kiếp tích lũy nhân quả.",
  },
  immortal_emperor: {
    lore: "Chí tôn vạn giới. Trên nữa chỉ còn đại đạo.",
    play: "Ở đỉnh Tiên Đế còn một bình cảnh cuối cùng: vượt qua là chứng đạo bất hủ, thất bại là tan biến. Thiên kiếp hung nhất.",
  },
};

export const ROOT_LORE = {
  none: "Kinh mạch bế tắc, không cảm ứng được linh khí. Sống đời người thường; có một tia hy vọng mong manh nếu gặp kỳ nhân khai mở.",
  five: "Kim, Mộc, Thủy, Hỏa, Thổ đều có nhưng đều mỏng — linh khí hút vào bị chia năm xẻ bảy.",
  four: "Bốn hệ linh căn, vẫn tạp nhưng đỡ hơn. Chịu khó vẫn có thể đi xa.",
  three: "Tư chất trung bình. Phần lớn tu sĩ trong giới mang tam linh căn.",
  two: "Hai hệ thuần, tu luyện nhanh, đột phá thuận lợi. Đại tông môn tranh nhau thu nhận.",
  heaven: "Một hệ duy nhất, tinh thuần tuyệt đối. Tu luyện nhanh gấp rưỡi người thường.",
  mutant: "Linh căn dị biến (lôi, băng, phong…), mạnh nhất trong các loại linh căn.",
};

export const PHYSIQUE_LORE = {
  common: "Đa số người đều như vậy. Không cộng không trừ.",
  frail: "Bệnh tật từ nhỏ: chịu thương nặng hơn, hồi phục chậm, đột phá khó hơn. Nên chọn Phật tu (giảm thương tích) hoặc Tiêu Dao (hồi phục nhanh).",
  verdant: "Thân cận cỏ cây linh khí: tu luyện nhanh hơn rõ rệt, hồi phục khá.",
  diamond: "Da thịt như kim thạch: thương tích chỉ còn 60%, hồi phục nhanh — rất hợp lối chơi dám liều.",
  thunder: "Trời sinh thân cận lôi đình: đột phá dễ hơn, đặc biệt <b>nguy cơ chết khi độ kiếp chỉ còn 60%</b>.",
  dao: "Đạo thể bẩm sinh: tu luyện nhanh, khó bị thương, hồi phục nhanh, đột phá dễ. Hiếm nhất — vạn năm có một.",
};

export const WORLD_LORE = {
  peaceful: "Thế đạo thái bình, triều đình vững, yêu ma ít. Rất hợp người mới: ít chết oan, nhưng cơ duyên cũng ở mức vừa.",
  abundant: "Linh mạch chằng chịt khắp nơi — tu luyện nhanh nhất vạn giới mà hiểm họa chỉ ở mức thường. Giới diện \"thuận gió\".",
  turmoil: "Các thế lực tranh hùng, chiến loạn không dứt. Nguy hiểm cao nhưng cơ duyên cũng dồi dào.",
  wild: "Rừng thiêng nước độc, yêu thú hoành hành. Muốn mạnh phải đổi máu lấy đạo.",
  declining: "Thời mạt pháp, linh khí cạn kiệt: tu luyện chậm nhất vạn giới. Bù lại ít hiểm họa — đi chậm mà chắc.",
  hidden: "Tiên tích ẩn mình trong mây núi, kỳ ngộ nhiều hơn tai ương. Quê hương của Quy Chân Các và Bồng Lai Đảo.",
  blood: "Ma đạo làm chủ, giết người đoạt bảo là chuyện thường. Hiểm ác nhất vạn giới — chỉ dành cho kẻ bản lĩnh.",
  shattered: "Bầu trời rạn vỡ, không gian chập chờn. Nguy hiểm cao mà linh khí lại kém — giới diện khắc nghiệt.",
};

export const PATH_DETAIL = {
  nguhanh: {
    fit: "Người thích tu luyện đều đặn, muốn tiến nhanh. Hợp với linh căn tốt.",
    topics: "Ngũ hành sinh khắc, phương vị, thiên can địa chi, màu sắc – mùa – tạng phủ theo ngũ hành.",
  },
  dich: {
    fit: "Người thích né họa, chơi an toàn mà vẫn muốn đi xa. Khí vận cao còn giúp đột phá dễ hơn.",
    topics: "Bát quái, 64 quẻ, tượng quẻ, Hà Đồ – Lạc Thư, phương vị tiên thiên – hậu thiên.",
  },
  daoluan: {
    fit: "Người đáp khảo hạch giỏi: ngộ tính tăng nhanh nhất, cộng sẵn +3% mọi lần đột phá — mạnh nhất về lâu dài.",
    topics: "Thuật ngữ tu tiên, cảnh giới, Đạo Đức Kinh, Nam Hoa Kinh (Trang Tử), điển tích Đạo gia.",
  },
  phat: {
    fit: "Người hay gặp nạn, thể chất yếu hoặc thích chọn liều: giảm 10% thương tích, mỗi câu đúng hồi thể trạng. Có thể siêu độ oan gia.",
    topics: "Cuộc đời Đức Phật, Tam Bảo, Ngũ giới, Tứ diệu đế ở mức phổ thông, lễ hội, chùa chiền Việt Nam.",
  },
  tieudao: {
    fit: "Người muốn chơi vui, không cần kiến thức chuyên môn. Hồi phục nhanh, vừa có khí vận vừa có linh tài.",
    topics: "Đố vui đời sống, Tết, món ăn, tục ngữ ca dao, truyện cổ tích Việt Nam.",
  },
};

// Hướng dẫn chung về môn phái (hiện đầu tab Môn phái)
export const SECT_GUIDE = `
  <p><b>Gia nhập — tự chọn sơn môn:</b> ở Luyện Khí – Trúc Cơ sẽ có <i>kỳ thu nhận đệ tử</i>. Ngươi xem thế mạnh từng phái của giới diện mình rồi chọn phái muốn bái nhập. Mỗi phái khảo hạch 3 câu: phái thường cần đúng <b>2/3</b>, <b>đại tông</b> (Thanh Vân Tông, Linh Tiêu Bảo Điện, Huyền Cơ Các, Ngự Thú Tông, Thủ Kinh Các, Quy Chân Các, Huyết Ma Giáo, Bổ Thiên Các) cần đúng cả <b>3/3</b>. Trượt thì xuống núi, lần thu nhận sau có thể chọn lại. Chỉ chọn được phái trong giới diện mình sinh ra. Xuất thân <i>con nhà tạp dịch tông môn</i> là đệ tử từ đầu.</p>
  <p><b>Thế mạnh riêng:</b> mỗi phái có một sở trường thật sự trong game (tu luyện nhanh, đột phá dễ, ít bị thương, độ kiếp an toàn, nhiều linh tài, trường thọ, thưởng khảo hạch…) — ghi ngay dưới tên phái. Thế mạnh chỉ có hiệu lực khi ngươi là đệ tử hoặc trưởng lão; bị trục xuất là mất.</p>
  <p><b>Quyền lợi:</b> đệ tử tu luyện nhanh hơn 5%, trưởng lão nhanh hơn 15%; lĩnh bổng lộc định kỳ; được nghe giảng (khảo hạch có thưởng), nhận nhiệm vụ, dự đại bỉ tông môn. Tu vi đủ cao có thể được phong trưởng lão.</p>
  <p><b>Đổi phái — không tự do, phải trả giá:</b></p>
  <ul>
    <li><b>Lời chiêu mộ:</b> từ Nguyên Anh, phái khác cùng giới có thể bí mật lôi kéo. <i>Phản xuất sư môn</i> để theo về: mất chức trưởng lão (nếu có), +5 ác nghiệp, và về sau sư môn cũ sẽ <b>truy sát</b> (liều chết hoặc quỳ xin tha, mất linh tài và tu vi). <i>Ở lại</i>: thiện nghiệp, khí vận, được thưởng.</li>
    <li><b>Thu nhận phản đồ:</b> bị trục xuất vẫn có cơ hội được phái khác nhận làm <i>đệ tử ký danh</i>. Phái <b>chính đạo</b> không nhận người có từ 15 ác nghiệp, phái trung lập từ chối người từ 30 ác nghiệp, còn <b>ma đạo</b> (Huyết Ma Giáo, U Minh Điện, Huyết Lang Trại) nhận tất cả — kẻ nặng ác nghiệp còn được ma đạo để mắt trước.</li>
    <li><b>Chức vị không theo người đổi phái:</b> rời phái là mất điểm tỷ võ và ghế chưởng môn (nếu có).</li>
  </ul>
  <p><b>Tiền duyên sư môn:</b> kiếp trước là <b>trưởng lão hoặc chưởng môn</b> của phái nào, kiếp sau nếu sinh cùng giới diện, phái ấy sẽ tìm đến mời về — không cần khảo hạch. Muốn đi đường khác thì cứ từ chối.</p>
  <p><b>Rủi ro:</b> gặp âm mưu trong tông, vu cáo đồng môn bị bại lộ… có thể bị <i>trục xuất</i>.</p>
  <p><b>Chính sự (người chơi thật):</b> đệ tử thắng luận đạo xếp hạng được điểm tỷ võ cho phái (thắng +3, hòa +1). Ghế chưởng môn trống thì mở <i>đại bỉ</i> → 3 người nhiều điểm nhất ứng cử → toàn phái <i>bỏ phiếu</i>. Danh vị gắn với nhân vật của kiếp này — nhân vật tọa hóa thì ghế bỏ trống. <a href="#/sects">Xem các môn phái ›</a></p>`;
