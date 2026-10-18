# Tu Tiên Lộ

Game mô phỏng một đời tu tiên. Chạy trên Cloudflare Workers + D1, dùng Better Auth để quản lý tài khoản.

## Lối chơi

- **Gieo số mệnh:** mỗi kiếp bốc ngẫu nhiên giới diện (8), xuất thân (6), linh căn (7), thể chất (6), tư chất, ngộ tính, khí vận và giới tính, kèm tên. Rút phải số mệnh xấu 5 lần liền thì kiếp sau chắc chắn có linh căn tốt.
- **14 cảnh giới**, từ Phàm nhân đến Tiên Đế. Cảnh giới càng cao tu luyện càng chậm. Người phàm căn sống một đời phàm nhân, trừ khi gặp kỳ ngộ khai mở linh căn.
- **Bình cảnh:** người chơi tự chọn thử đột phá, dùng linh tài hộ pháp hoặc tích lũy thêm. Giao diện hiện tỉ lệ thành công. Khi bước vào Hóa Thần, Chân Tiên, và ở bước chứng đạo cuối cùng phải độ thiên kiếp, thất bại có thể mất mạng.
- **Sự kiện** (`src/game/events/`): tuổi thơ, đời phàm nhân, tu luyện, kỳ ngộ, kiếp nạn, chuỗi tông môn (đệ tử → trưởng lão, bị trục xuất) và đạo lữ (song tu, gặp nạn, tử biệt). Lựa chọn ở đây để lại trạng thái lâu dài.
- **19 thành tựu**, bảng xếp hạng theo cảnh giới hoặc tuổi thọ (mỗi người chỉ tính kiếp tốt nhất), lịch sử để đọc lại từng kiếp, cẩm nang, ảnh chia sẻ, giao diện sáng/tối, hiển thị được trên điện thoại.
- **Phát lại:** các mốc đời hiện lần lượt với tốc độ x1, x2, x4. Có nút tạm dừng, hiện hết, và chế độ "Để số mệnh tự quyết".

## Đạo đồ & khảo hạch

- Khi thức tỉnh linh căn, người chơi chọn một trong ba **đạo đồ**: Ngũ Hành tu, Dịch tu, Đạo Luận tu. Mỗi đạo đồ có ngân hàng câu hỏi trắc nghiệm riêng (`src/game/quiz/`, hiện 172 câu, 3 cấp độ) và một lợi thế riêng.
- **Khảo hạch** xuất hiện ở bốn nơi:
  - thi nhập môn tông môn (3 câu, đúng từ 2 câu thì được nhận),
  - giảng đường tông môn,
  - vấn tâm trước mỗi bình cảnh (đáp đúng: +10% tỉ lệ đột phá),
  - kỳ nhân ra đề.

  Trung bình mỗi kiếp có khoảng 10–13 câu.
- Trả lời đúng thì được thưởng theo đạo đồ, sai hoặc bỏ qua thì chỉ không có thưởng, không bao giờ gây chết. Sau mỗi câu đều có lời giảng giải. Chế độ "tự quyết" luôn bỏ qua câu hỏi.
- **Chống gian lận:** đáp án và lời giảng chỉ nằm trên máy chủ. Client chỉ nhận đề và id phương án dạng băm, đã xáo thứ tự theo seed. Mỗi câu chỉ được trả lời một lần.
- **Thêm câu hỏi:** dùng `q(id, cấp, đề, [đúng, sai, sai, sai], giảng giải)`, **chỉ thêm, không sửa hay xoá id cũ**. Kiếp đang dở bị lệch nhịp do thay đổi ngân hàng câu hỏi sẽ được tự khép lại.
- `npm run balance` có thêm kiểu người chơi `scholar` (luôn đáp đúng) để đo lợi ích tối đa của khảo hạch.

## Luận đạo (đấu trực tiếp)

- **Ghép cặp** (`src/duel/matchmaker.ts`, Durable Object toàn cục):
  - Người chơi giữ một WebSocket trong hàng chờ và được ghép với người có điểm Đạo vị gần nhất. Biên độ điểm nới rộng dần: 150 + 40 điểm mỗi giây chờ.
  - Chờ 6–12 giây mà không có ai thì được ghép với bot. Bot có tên, cảnh giới, Đạo vị gần với người chơi.
- **Trận đấu** (`src/duel/room.ts`, mỗi trận một Durable Object):
  - 5 câu lấy từ cả ba ngân hàng, độ khó tăng dần, mỗi câu 15 giây.
  - Trả lời đúng được 100 điểm, cộng tối đa 50 điểm nếu trả lời nhanh. Máy chủ giữ đáp án, đồng hồ và điểm.
  - Rớt mạng thì client tự vào lại phòng. Người chơi bỏ đi thì các câu còn lại tính là hết giờ.
- **Bot** (`src/duel/logic.ts`) trả lời như người: tỉ lệ đúng theo độ khó và Đạo vị, câu biết thì trả lời nhanh, câu đoán thì chậm, thỉnh thoảng để hết giờ.
  - Mặc định bot trông như người thật. Đặt `DUEL_BOT_LABEL=1` trong `wrangler.jsonc` để hiện nhãn "tàn ảnh".
  - Bot không bao giờ lên bảng xếp hạng.
- **Đạo vị (Elo, K = 32)** chỉ áp dụng cho tài khoản đã đăng ký. Khách được đấu thử nhưng không được tính điểm. Bậc danh hiệu: Sơ học → Nhập thất → Chân truyền → Tông sư → Đạo tôn.
- **Deploy:** Durable Objects được tạo tự động khi `wrangler deploy` (migration `v1` trong `wrangler.jsonc`). Chạy thêm `npm run db:migrate:remote` để tạo bảng `ratings`, `duels`.

## Bản đồ vạn giới

`/#/world`: mỗi giới diện có số tu sĩ, số kiếp, số người đang tu hành, tuổi thọ trung bình và cao nhất, cùng cao thủ của giới. Mỗi giới có 3 môn phái, xếp hạng theo thế lực = tổng (cảnh giới + 1)² của kiếp tốt nhất mỗi đệ tử, và hiện người mạnh nhất mỗi phái. API `/api/world` được cache 60 giây.

## Quản trị

`/#/admin` chỉ dành cho tài khoản **đã đăng ký** có email nằm trong `ADMIN_EMAILS` (`wrangler.jsonc`; khi chạy local thì đặt trong `.dev.vars`).

- **Báo cáo:** người chơi (đăng ký/khách), số người hoạt động trong 24 giờ / 7 ngày / 30 ngày, biểu đồ theo ngày (người hoạt động, người mới, kiếp mới, trận luận đạo), phân bố cảnh giới / giới diện / đạo đồ / kết cục, và cao thủ.
- **Cấu hình chỉ số** (`src/settings.ts`), gồm 3 nhóm:
  - lối chơi: tốc độ tu luyện, tần suất sự kiện, cộng tỉ lệ đột phá, tỉ lệ vong mạng khi độ kiếp, thưởng câu đúng, ngưỡng bảo hiểm;
  - luận đạo: số câu, thời gian mỗi câu, thời gian chờ bot, hệ số Elo, nhãn bot;
  - hệ thống: số ngày giữ tài khoản khách.
- Cấu hình lối chơi được **chụp vào mỗi kiếp lúc tạo**, nên đổi chỉ số chỉ ảnh hưởng kiếp mới; các kiếp đang chơi vẫn phát lại đúng.

## Quản lý câu hỏi (admin)

Tab **Câu hỏi** trong `/#/admin`:
- lọc theo đạo đồ, cấp độ, nội dung; thêm / sửa / xoá / khôi phục câu hỏi (2–6 phương án, lời giảng);
- xuất và nhập JSON (`{ "items": [{ path, level, prompt, options: [...], answer: <chỉ số>, explain }] }`). Khi nhập, chỉ cần một câu lỗi là không câu nào được nhập.

**Ngân hàng câu hỏi nằm trong D1 và có phiên bản** (`questions`, `quiz_meta`; migration 0005 đưa các câu trong code vào làm phiên bản 1):
- Mỗi thay đổi tạo một phiên bản mới, dòng cũ không bao giờ bị ghi đè: sửa = ẩn dòng cũ và thêm dòng mới cùng `family` và `ord`; xoá = ẩn.
- Mỗi kiếp lưu `profile.qv` (phiên bản lúc tạo) và luôn phát lại bằng đúng ngân hàng đó, nên sửa câu hỏi không làm hỏng kiếp đang chơi. Kiếp cũ chưa có `qv` thì dùng ngân hàng trong code.
- Trận luận đạo lưu nguyên câu hỏi trong phòng đấu.
- Mỗi đạo đồ phải giữ tối thiểu 6 câu.

Các file `src/game/quiz/*.ts` giờ chỉ còn là dữ liệu gốc (phiên bản 1) và ngân hàng dự phòng cho kiếp cũ. **Muốn thêm câu hỏi, hãy dùng trang admin**, không sửa các file này.

## Thêm nội dung

Mỗi sự kiện được khai báo bằng `ev(id, tiêu đề, mô tả, [cảnh giới min, max], { weight, maxPerLife, cooldown, cond, effects | choices })`. Hiệu ứng `resources` tự nhân theo cảnh giới. Sau khi thêm hoặc sửa sự kiện, chạy:

```bash
npm test          # tất định, mọi kiếp đều khép lại
npm run balance   # phân bố cảnh giới cuối, kết cục, số lựa chọn mỗi kiếp
```

Đổi nội dung có thể làm lựa chọn cũ của một kiếp đang dở không còn khớp. Khi đó máy chủ khép kiếp ấy lại ("Thiên đạo biến đổi") thay vì báo lỗi mãi. Trang lịch sử phát lại kiếp tới lựa chọn cuối còn hợp lệ.

## Luồng tài khoản

1. Lần đầu mở game, client gọi `POST /api/auth/sign-in/anonymous` → máy chủ tạo ngay một **tài khoản khách**. Mọi kiếp chơi đều được lưu trên máy chủ ngay từ đầu.
2. Khi khách đăng ký (`/api/auth/sign-up/email`) hoặc đăng nhập (`/api/auth/sign-in/email`, Google), plugin `anonymous` gọi hook `onLinkAccount` → hàm [`mergeGuestInto`](src/merge.ts) chuyển toàn bộ dữ liệu sang tài khoản thật, rồi Better Auth xoá user khách.
   - **Tài khoản mới:** dữ liệu khách chuyển nguyên sang.
   - **Tài khoản đã có dữ liệu:** gộp lịch sử các kiếp, đánh số kiếp lại theo thời gian chơi, kỷ lục lấy giá trị cao nhất, thành tựu gộp chung. Nếu cả hai bên đều có kiếp dở, giữ kiếp dở của phiên khách.
   - Toàn bộ thao tác chạy trong một `db.batch` (một transaction).
3. Cron chạy hằng ngày, xoá tài khoản khách không hoạt động quá 90 ngày.

## Chống gian lận

Client chỉ gửi **lựa chọn** (`step`, `eventId`, `choiceId`). Máy chủ giữ `seed` và dựng lại cả kiếp bằng [`replay()`](src/game/engine.ts), một hàm tất định. Lựa chọn không khớp sự kiện đang chờ sẽ bị trả lỗi 400. Gửi lại cùng một `step` thì được trả lại trạng thái cũ (idempotent), nên mạng chập chờn không làm hỏng kiếp.

## Chạy local

```bash
npm install
cp .dev.vars.example .dev.vars   # rồi điền BETTER_AUTH_SECRET
npm run db:migrate:local
npm run dev                      # http://localhost:8787
npm test
```

## Bản đang chạy

https://tutien.nghia-code.workers.dev (Cloudflare Workers, D1 `tutien-db` ở APAC)

Deploy lại sau khi sửa code:

```bash
npm run db:migrate:remote   # chỉ khi có migration mới
npm run deploy
```

## Deploy lần đầu (tài khoản Cloudflare mới)

```bash
npx wrangler d1 create tutien-db          # chép database_id vào wrangler.jsonc
npm run db:migrate:remote
npx wrangler secret put BETTER_AUTH_SECRET
npm run deploy
```

Sau khi deploy, sửa `BETTER_AUTH_URL` trong `wrangler.jsonc` thành domain thật. Muốn bật đăng nhập Google thì đặt thêm hai secret `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.

## Cấu trúc

| File | Vai trò |
|---|---|
| `src/index.ts` | Route Hono: auth, API game, bảng xếp hạng, cron dọn khách |
| `src/auth.ts` | Cấu hình Better Auth + plugin anonymous |
| `src/merge.ts` | Gộp dữ liệu khách → tài khoản thật |
| `src/game/engine.ts` | Engine mô phỏng tất định (seed + lựa chọn → kiếp) |
| `src/game/data.ts` | Cảnh giới, linh căn, thể chất, xuất thân, giới diện, tên, thành tựu |
| `src/game/events/` | Sự kiện theo nhóm |
| `src/duel/` | Luận đạo: ghép cặp, phòng đấu, bot, Elo |
| `scripts/balance.ts` | Mô phỏng hàng loạt để cân bằng độ khó |
| `migrations/0001_init.sql` | Schema D1 |
| `public/` | Giao diện (HTML/CSS/JS thuần, không cần build) |
