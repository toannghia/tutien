// Sự kiện tu luyện lặp lại và kiếp nạn chung cho người tu hành.
import { c, CULTIVATOR, ev, IMMORTAL, LOW, MID, MORTAL_TIER, o } from "./helpers";

export const CULTIVATION_EVENTS = [
  // ---------- Thường nhật, lặp lại ----------
  ev("seclusion", "Bế quan dưỡng đạo", "Ngươi khép cửa tĩnh thất, chuyên tâm vận chuyển pháp quyết. Khi xuất quan, cảnh vật đã đổi khác.", CULTIVATOR, {
    weight: 14, maxPerLife: 99, cooldown: 3, effects: { cultivation: 30, health: 10 },
  }),
  ev("moon_meditate", "Tĩnh tọa dưới trăng", "Một đêm trăng sáng, ngươi tĩnh tọa nhìn lại pháp quyết đã học. Một điểm khúc mắc được tháo gỡ.", CULTIVATOR, {
    weight: 10, maxPerLife: 99, cooldown: 4, effects: { cultivation: 20, comprehension: 1 },
  }),
  ev("market", "Phường thị tấp nập", "Ngươi bày quầy ở phường thị, đổi vật liệu thừa lấy đan dược cần dùng.", LOW, {
    weight: 9, maxPerLife: 99, cooldown: 4, effects: { resources: 15 },
  }),
  ev("pill_refine", "Luyện đan", "Ngươi thử luyện một lò Tụ Khí Đan theo đan phương cũ.", LOW, {
    weight: 6, maxPerLife: 3, cooldown: 6,
    choices: [
      c("self", "Tự mình luyện", "Tiết kiệm, có thể nổ lò", [
        o("good", 50, "Lửa vừa độ, đan thành bảy viên tròn trịa. Ngươi dùng một phần, bán đi phần còn lại.", { cultivation: 25, resources: 15 }),
        o("bad", 40, "Đan thành nhưng tạp chất nhiều, dược lực chỉ còn một nửa.", { cultivation: 8 }),
        o("explode", 10, "Lò đan nổ tung, khói đen mù mịt. Ngươi bị bỏng khắp tay.", { health: -25, resources: -10 }),
      ]),
      c("buy", "Mua đan có sẵn", "Tốn linh tài, chắc chắn", [o("bought", 1, "Ngươi bỏ linh tài mua đan của đan sư có tiếng. Dược lực tinh thuần, tu vi tiến nhanh.", { resources: -20, cultivation: 30 })], { minResources: 20 }),
    ],
  }),
  ev("beast_hunt", "Săn yêu thú", "Một con yêu thú cấp thấp quấy nhiễu thôn trang gần đó. Dân làng treo thưởng cho ai trừ được nó.", LOW, {
    weight: 7, maxPerLife: 3, cooldown: 5,
    choices: [
      c("hunt", "Nhận lời trừ yêu", "Có thưởng, có thương tích", [
        o("win", 60, "Sau một trận ác chiến, ngươi chém được yêu thú. Dân làng mang lễ vật đến tạ.", { resources: 25, health: -10, luck: 1 }),
        o("hurt", 35, "Yêu thú hung hãn hơn lời đồn. Ngươi giết được nó nhưng thương tích nặng.", { resources: 15, health: -35 }),
        o("die", 5, "Yêu thú phản kích bất ngờ. Ngươi gục xuống giữa rừng sâu.", { death: true }, "Chết dưới nanh vuốt yêu thú"),
      ]),
      c("skip", "Không xen vào", "An toàn", [o("skip", 1, "Ngươi tiếp tục tu luyện. Vài hôm sau nghe nói có tán tu khác đã nhận việc.", {})]),
    ],
  }),
  ev("qi_deviation", "Tẩu hỏa nhập ma", "Đang vận công thì tâm ma trỗi dậy, linh lực chạy loạn trong kinh mạch.", CULTIVATOR, {
    weight: 4, maxPerLife: 2, cooldown: 15,
    choices: [
      c("force", "Cưỡng ép áp chế", "Có thể đột nhiên tinh tiến; có thể phản phệ", [
        o("break", 35, "Ngươi cắn răng áp chế tâm ma. Khi linh lực quy vị, tu vi lại tinh tiến một bậc.", { cultivation: 50, health: -15 }),
        o("backlash", 55, "Linh lực phản phệ, ngươi phun ra một ngụm máu tươi.", { health: -40, cultivation: -20 }),
        o("die", 10, "Tâm ma nuốt trọn thần trí. Kinh mạch đứt đoạn, ngươi ngã xuống trong tĩnh thất.", { death: true }, "Tẩu hỏa nhập ma"),
      ]),
      c("stop", "Tán công, dừng lại", "Mất tu vi, giữ mạng", [o("stop", 1, "Ngươi tán đi linh lực đang chạy loạn. Tu vi tụt lại, nhưng tính mạng được giữ.", { cultivation: -40, health: -10 })]),
    ],
  }),
  ev("injury_heal", "Tĩnh dưỡng", "Thương tích tích tụ lâu ngày, ngươi tìm một nơi yên tĩnh để điều dưỡng.", CULTIVATOR, {
    weight: 6, maxPerLife: 99, cooldown: 5, effects: { health: 30 },
  }),

  // ---------- Khảo hạch theo đạo đồ ----------
  ev("sage_riddle", "Lão nhân ra đề", "Bên bờ suối, một lão nhân câu cá không mồi. Lão cười: \"Đáp được câu này, lão phu tặng ngươi một cơ duyên.\"", CULTIVATOR, {
    weight: 4, maxPerLife: 3, cooldown: 25, cond: { hasPath: true },
    trial: {
      title: "Lão nhân ra đề",
      count: 1,
      pass: 1,
      level: 3,
      onPass: o("gift", 1, "Lão nhân vuốt râu cười lớn, búng vào trán ngươi một đạo linh quang. Bao nhiêu khúc mắc bỗng thông suốt.", { cultivation: 80, comprehension: 3 }),
      onFail: o("leave", 1, "Lão nhân thu cần câu, lắc đầu bỏ đi. Khi ngươi ngoảnh lại, bờ suối chỉ còn sương mù.", {}),
    },
  }),
  ev("path_elder", "Tiền bối cùng đạo", "Ngươi gặp một vị tiền bối tu cùng đạo đồ. Người muốn thử xem sở học của hậu bối đến đâu trước khi truyền thụ.", [2, 13], {
    weight: 5, maxPerLife: 2, cooldown: 30, cond: { hasPath: true },
    trial: {
      title: "Tiền bối khảo vấn",
      count: 2,
      pass: 2,
      onPass: o("teach", 1, "Tiền bối hài lòng, truyền cho ngươi tâm đắc cả đời. Tu vi tiến một bước dài.", { cultivation: 90, luck: 2 }),
      onFail: o("later", 1, "Tiền bối chỉ dặn ngươi về đọc lại kinh điển, khi nào thông suốt hãy tìm người.", { comprehension: 1 }),
    },
  }),

  // ---------- Kỳ ngộ ----------
  ev("cave", "Động phủ vô danh", "Giữa sơn cốc phủ sương, ngươi phát hiện một động phủ cổ. Linh khí cuồn cuộn sau cửa đá, nhưng cấm chế vẫn chưa tan.", MORTAL_TIER, {
    weight: 5, cooldown: 30,
    choices: [
      c("enter", "Phá phong ấn", "Cơ duyên lớn; có thể trọng thương hoặc tử vong", [
        o("treasure", 45, "Vượt qua tầng cấm chế, ngươi tìm thấy cổ thư còn nguyên vẹn. Pháp môn bên trong giúp tu vi tiến triển rõ rệt.", { cultivation: 70, resources: 35 }),
        o("injury", 43, "Trận pháp bất ngờ thức tỉnh, ngươi trọng thương mới thoát ra được.", { health: -45 }),
        o("death", 12, "Cấm chế bùng nổ, nuốt trọn thân ảnh ngươi.", { death: true }, "Bỏ mạng trong động phủ cổ"),
      ]),
      c("study", "Nghiên cứu cấm chế vài năm", "Chậm mà chắc", [
        o("slow", 70, "Mất mấy năm dò xét, ngươi mở được một góc động phủ, lấy ra ít bảo vật.", { resources: 25, comprehension: 3 }),
        o("taken", 30, "Khi ngươi quay lại, động phủ đã bị kẻ khác phá mở và vét sạch.", { luck: -2 }),
      ]),
      c("leave", "Ghi nhớ vị trí rồi rời đi", "An toàn", [o("leave", 1, "Ngươi rời sơn cốc, trong lòng còn chút tiếc nuối.", {})]),
    ],
  }),
  ev("spirit_herb", "Linh dược ngàn năm", "Trên vách đá hiểm trở mọc một gốc linh dược tỏa hương. Bên dưới, một con mãng xà đang cuộn mình canh giữ.", MORTAL_TIER, {
    weight: 5, cooldown: 20, maxPerLife: 2,
    choices: [
      c("steal", "Lén leo lên hái", "Cần may mắn", [
        o("got", 50, "Ngươi hái được linh dược trong lúc mãng xà ngủ say. Dùng xong, tu vi tăng vọt.", { cultivation: 60, health: 20 }),
        o("chased", 42, "Mãng xà tỉnh giấc. Ngươi bỏ chạy thục mạng, mất gần hết đồ đạc.", { health: -30, resources: -15 }),
        o("eaten", 8, "Mãng xà tỉnh dậy đúng lúc ngươi với tay. Không ai thấy ngươi trở về.", { death: true }, "Bị yêu xà nuốt chửng"),
      ]),
      c("leave", "Không đáng mạo hiểm", "An toàn", [o("leave", 1, "Ngươi lặng lẽ lùi lại. Có những cơ duyên không thuộc về mình.", {})]),
    ],
  }),
  ev("mentor", "Tàn hồn trong ngọc bội", "Chiếc ngọc bội mua ở sạp ven đường bỗng phát sáng. Một giọng nói già nua vang lên: \"Tiểu tử, nhận ta làm sư phụ chăng?\"", LOW, {
    weight: 3,
    choices: [
      c("accept", "Bái sư", "Được truyền thụ; có thể bị đoạt xá", [
        o("teach", 70, "Tàn hồn là một vị đại năng thời thượng cổ. Dưới sự chỉ dạy của người, ngươi tiến bộ thần tốc.", { cultivation: 80, comprehension: 8, flag: "mentor" }),
        o("possess", 30, "Tàn hồn lộ nguyên hình, muốn đoạt xá thân thể ngươi. Ngươi liều mạng đập vỡ ngọc bội, thần hồn tổn thương nặng.", { health: -50, comprehension: 3 }),
      ]),
      c("smash", "Đập vỡ ngọc bội", "Thận trọng", [o("smash", 1, "Ngươi không tin lời của kẻ lạ. Ngọc bội vỡ vụn, giọng nói tắt lịm.", { luck: -1 })]),
    ],
  }),
  ev("auction", "Đấu giá hội", "Đấu giá hội lớn nhất vùng mở cửa. Trên đài là một viên Trúc Cơ Đan, ánh mắt của hàng trăm tu sĩ đều đổ dồn vào nó.", [1, 2], {
    weight: 6,
    choices: [
      c("bid", "Dốc túi tranh giá", "Tốn nhiều linh tài", [o("won", 1, "Ngươi trả giá cao nhất. Dược lực của viên đan giúp con đường phía trước rộng mở hơn.", { resources: -50, cultivation: 60, flag: "pill" })], { minResources: 50 }),
      c("rob", "Phục kích kẻ thắng giá", "Đắc tội người khác", [
        o("success", 40, "Ngươi đoạt được bảo vật trong đêm tối. Không ai biết là ngươi.", { cultivation: 60, flag: "pill" }),
        o("fail", 50, "Kẻ thắng giá là đệ tử đại tông, hộ vệ đi theo đánh ngươi trọng thương.", { health: -45, luck: -3 }),
        o("die", 10, "Kẻ thắng giá cố tình dụ ngươi vào bẫy. Ngươi không thoát ra được.", { death: true }, "Trúng bẫy sau đấu giá hội"),
      ]),
      c("watch", "Chỉ đứng xem", "Không tốn gì", [o("watch", 1, "Ngươi xem xong cuộc đấu giá, mở mang tầm mắt.", { comprehension: 1 })]),
    ],
  }),
  ev("bandits", "Tà tu chặn đường", "Ba tà tu chặn ngươi giữa đèo, đòi giao ra túi trữ vật.", LOW, {
    weight: 6, maxPerLife: 2, cooldown: 10,
    choices: [
      c("fight", "Rút kiếm nghênh chiến", "Thắng được của cải; thua mất mạng", [
        o("win", 55, "Kiếm quang lóe lên, tà tu tháo chạy để lại chiến lợi phẩm.", { resources: 40, health: -10 }),
        o("hurt", 35, "Ngươi đẩy lùi được bọn chúng nhưng thương tích đầy mình.", { health: -35 }),
        o("die", 10, "Một nhát chưởng sau lưng khiến ngươi gục xuống giữa đèo.", { death: true }, "Chết dưới tay tà tu"),
      ]),
      c("flee", "Đốt phù độn thổ", "Mất phù lục, có thể thoát", [
        o("escaped", 75, "Ngươi đốt tấm độn thổ phù cuối cùng, thoát ra ngoài mười dặm.", { resources: -10 }),
        o("caught", 25, "Phù lục bị phá giữa chừng. Ngươi bị đánh trọng thương, túi trữ vật cũng mất.", { health: -30, resources: -30 }),
      ]),
      c("pay", "Giao túi trữ vật", "Mất của, giữ mạng", [o("paid", 1, "Ngươi mất phần lớn tích lũy, nhưng còn giữ được mạng.", { resources: -40 })]),
    ],
  }),
  ev("secret_realm", "Bí cảnh khai mở", "Không gian rạn nứt, một bí cảnh thượng cổ hiện ra. Tu sĩ khắp nơi đổ về, ai cũng muốn chia một phần.", [2, 6], {
    weight: 5, maxPerLife: 2, cooldown: 25,
    choices: [
      c("deep", "Xông vào tầng sâu nhất", "Cơ duyên cực lớn, nguy hiểm cực lớn", [
        o("legacy", 35, "Ở tầng sâu nhất, ngươi nhận được truyền thừa của chủ nhân bí cảnh.", { cultivation: 120, comprehension: 6, resources: 40 }),
        o("trapped", 50, "Ngươi mắc kẹt trong mê trận nhiều năm, khi thoát ra thì thân tàn lực kiệt.", { health: -50, resources: 20 }),
        o("die", 15, "Bí cảnh sụp đổ khi ngươi còn ở tầng sâu. Không ai thấy ngươi bước ra.", { death: true }, "Mất tích trong bí cảnh sụp đổ"),
      ]),
      c("edge", "Chỉ thu nhặt ở vòng ngoài", "Ít lợi, ít hại", [
        o("some", 80, "Ngươi thu được không ít linh thảo ở vòng ngoài, đủ dùng một thời gian.", { resources: 35, cultivation: 20 }),
        o("fight", 20, "Tranh giành với tu sĩ khác, ngươi bị thương nhẹ.", { resources: 15, health: -20 }),
      ]),
      c("skip", "Không tham gia", "An toàn", [o("skip", 1, "Ngươi đứng ngoài nhìn dòng người đổ vào. Nhiều kẻ không bao giờ trở ra.", { comprehension: 1 })]),
    ],
  }),
  ev("dao_debate", "Luận đạo trên núi", "Một vị cao nhân mở hội luận đạo. Tu sĩ bốn phương tụ về, mỗi người nói lên đạo của mình.", MID, {
    weight: 5, maxPerLife: 2, cooldown: 20,
    choices: [
      c("speak", "Đứng lên trình bày đạo của mình", "Có thể đốn ngộ; có thể bẽ mặt", [
        o("enlighten", 45, "Lời ngươi khiến cả hội trầm ngâm. Trong khoảnh khắc ấy, chính ngươi cũng đốn ngộ.", { cultivation: 90, comprehension: 5 }),
        o("refuted", 55, "Đạo của ngươi bị một lão quái phản bác đến cứng họng. Tâm cảnh dao động nhiều năm.", { comprehension: 2, health: -10 }),
      ]),
      c("listen", "Ngồi nghe", "Lĩnh hội từ từ", [o("listen", 1, "Ngươi ngồi lặng lẽ nghe suốt bảy ngày, thu hoạch không ít.", { cultivation: 40, comprehension: 2 })]),
    ],
  }),
  ev("demon_war", "Ma đạo xâm lấn", "Ma đạo liên quân tràn qua biên giới, các chính đạo tông môn phát lệnh triệu tập tu sĩ chống giữ.", MID, {
    weight: 4, cooldown: 40,
    choices: [
      c("defend", "Ra tiền tuyến", "Lập công lớn hoặc vong mạng", [
        o("hero", 40, "Ngươi chém giết vô số ma tu, danh tiếng vang khắp chính đạo.", { resources: 80, luck: 4, health: -20 }),
        o("wounded", 45, "Trận chiến kéo dài trăm năm, ngươi sống sót nhưng đạo cơ bị tổn hại.", { health: -50, cultivation: -30 }),
        o("die", 15, "Ngươi bỏ mình giữa vòng vây ma tu, nhưng đã giữ được cửa ải.", { death: true }, "Hy sinh trong trận chiến chính – ma"),
      ]),
      c("hide", "Ẩn cư chờ yên", "Mất danh tiếng", [o("hide", 1, "Ngươi đóng cửa động phủ, mặc kệ thế gian loạn lạc.", { luck: -3, cultivation: 20 })]),
    ],
  }),
  ev("void_rift", "Khe nứt hư không", "Một khe nứt hư không mở ra ngay trước mặt. Bên kia là ánh sáng của một thế giới lạ.", [6, 8], {
    weight: 4, cooldown: 40,
    choices: [
      c("enter", "Bước vào khe nứt", "Cơ duyên dị giới; có thể lạc mất", [
        o("fortune", 50, "Thế giới bên kia linh khí dồi dào gấp trăm lần. Ngươi tu hành ở đó vài trăm năm rồi mới trở về.", { cultivation: 150, lifespan: 200 }),
        o("lost", 38, "Ngươi lạc giữa hư không suốt nhiều năm, thân thể bị không gian chi lực mài mòn.", { health: -55 }),
        o("die", 12, "Khe nứt khép lại khi ngươi còn ở giữa. Không gian xé nát thân thể ngươi.", { death: true }, "Bị hư không nghiền nát"),
      ]),
      c("seal", "Phong ấn khe nứt", "Tích công đức", [o("seal", 1, "Ngươi dốc sức phong ấn khe nứt, tránh cho phàm gian một trận tai ương.", { luck: 5, resources: -20 })]),
    ],
  }),
  ev("old_friend", "Cố nhân", "Ngươi tình cờ gặp lại một người bạn cũ thời Luyện Khí. Tóc người ấy đã bạc trắng, thọ nguyên sắp cạn.", MID, {
    weight: 4,
    choices: [
      c("help", "Tặng đan kéo dài thọ nguyên", "Tốn linh tài, được nhân quả tốt", [o("help", 1, "Người bạn rưng rưng nhận đan. Nhân quả tốt đẹp này khiến tâm cảnh ngươi viên mãn hơn.", { resources: -40, luck: 5, comprehension: 2 })], { minResources: 40 }),
      c("talk", "Ngồi uống với nhau một bữa rượu", "Nhớ về ngày cũ", [o("talk", 1, "Hai người ôn lại chuyện xưa đến sáng. Vài năm sau, ngươi nghe tin người ấy đã tọa hóa.", { comprehension: 2 })]),
    ],
  }),

  // ---------- Tiên giới ----------
  ev("immortal_pool", "Tiên trì tẩy phàm", "Bên tiên trì, ngươi gột sạch tàn dư phàm khí trong kinh mạch. Tiên lực dần ổn định.", IMMORTAL, {
    weight: 8, maxPerLife: 3, cooldown: 10, effects: { cultivation: 40, health: 20 },
  }),
  ev("immortal_war", "Tiên giới đại chiến", "Hai đại tiên triều khai chiến, tinh hà vỡ vụn. Cả hai bên đều chiêu mộ ngươi.", IMMORTAL, {
    weight: 5, cooldown: 30,
    choices: [
      c("join", "Gia nhập một phe", "Phong thưởng lớn; có thể vẫn lạc", [
        o("win", 45, "Phe ngươi đại thắng. Ngươi được phong một vùng tinh vực làm đạo trường.", { resources: 120, cultivation: 80 }),
        o("lose", 40, "Phe ngươi bại trận, ngươi phải trốn chạy qua vô số tinh vực.", { health: -50, resources: -60 }),
        o("die", 15, "Một đòn của Tiên Vương địch quân xóa sổ cả chiến trường nơi ngươi đứng.", { death: true }, "Vẫn lạc trong tiên giới đại chiến"),
      ]),
      c("neutral", "Đứng ngoài thế cục", "An toàn, bị hai bên nghi kỵ", [o("neutral", 1, "Ngươi bế quan ở một góc tinh không, mặc cho chiến hỏa thiêu đốt.", { cultivation: 40, luck: -2 })]),
    ],
  }),
  ev("dao_fruit", "Đạo quả chín", "Cây đạo quả trong cấm địa vạn năm mới kết trái, nay đã chín. Không chỉ mình ngươi biết chuyện này.", [10, 13], {
    weight: 4,
    choices: [
      c("take", "Tranh đoạt đạo quả", "Có thể đốn ngộ đại đạo", [
        o("got", 40, "Ngươi đoạt được đạo quả. Ăn vào, đại đạo pháp tắc hiện rõ trước mắt.", { cultivation: 200, comprehension: 8 }),
        o("hurt", 50, "Ngươi bị ba vị tiên nhân liên thủ đánh lui, đạo thể nứt vỡ.", { health: -60 }),
        o("die", 10, "Cấm địa thức tỉnh, nuốt trọn tất cả kẻ tranh đoạt.", { death: true }, "Vẫn lạc trong cấm địa đạo quả"),
      ]),
      c("leave", "Nhường lại", "Kết thiện duyên", [o("leave", 1, "Ngươi quay người rời đi. Có vị tiên nhân nhớ ân này, sau gửi tặng một kiện bảo vật.", { resources: 60, luck: 3 })]),
    ],
  }),
];
