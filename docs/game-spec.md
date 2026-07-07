# Tài liệu Đặc tả Game: Bone Thief (Ai Lấy Xương?)

## 1. Mục tiêu & Cốt truyện
`Bone Thief` (hay `Ai Lấy Xương?`) là một trò chơi suy luận xã hội multiplayer thời gian thực (realtime) lấy cảm hứng từ cơ chế của board game *Cheese Thief*. 

**Cốt truyện:**
Vào ban đêm, tất cả các chú chó trong sân chơi (`Yard`) đều đi ngủ trong chuồng riêng của mình (`Kennel`). Tuy nhiên, có một chú chó nghịch ngợm đã lén lấy trộm chiếc xương (`Bone`) của cả bầy. Khi bình minh lên, đàn chó phát hiện chiếc xương đã biến mất. Họ phải cùng nhau thảo luận, bỏ phiếu để tìm ra kẻ trộm xương (`Bone Thief`). Ngược lại, kẻ trộm xương cùng những chú chó bị hắn lôi kéo (`Packmate`) sẽ tìm cách che giấu thân phận và đổ tội cho những chú chó vô tội khác.

---

## 2. Thuật ngữ & Khái niệm Theme mới

| Thuật ngữ gốc | Thuật ngữ mới (Tiếng Việt) | Ý nghĩa trong game |
| :--- | :--- | :--- |
| **Dog** | Chú chó / Nguời chơi | Đại diện cho một người chơi tham gia game. |
| **Bone** | Xương / Khúc xương | Vật mục tiêu cần bảo vệ hoặc bị trộm trong đêm. |
| **Bone Thief** | Chó Trộm Xương (Thief) | Vai trò bí mật thuộc phe Trộm, có nhiệm vụ trộm xương và lẩn trốn. |
| **Yard Dog** | Chó Canh Sân (Sleepyhead) | Vai trò bí mật thuộc phe Sân, có nhiệm vụ tìm ra Chó Trộm Xương. |
| **White Dog** | Chó Trắng | Vai trò đặc biệt. Chó Trắng sẽ thắng một mình nếu bị cả đàn vote treo cổ. Có thể trở thành đồng bọn của Chó Trộm Xương. |
| **Packmate** | Đồng Bọn Trộm Xương | Chú chó bị lôi kéo về phe Trộm Xương trong đêm (tùy số lượng người chơi). |
| **Yard** | Sân chơi (Public State) | Không gian hiển thị chung: danh sách người chơi, phase hiện tại, kết quả vote công khai. |
| **Kennel** | Chuồng riêng (Private State) | Giao diện riêng tư của từng người: vai trò bí mật, giờ thức dậy, kết quả soi dấu vết. |
| **Thief Pack** | Phe Trộm Xương (Thief Bone) | Nhóm gồm Chó Trộm Xương và các Đồng Bọn Trộm Xương (nếu có). |
| **Yard Pack** | Phe Canh Sân (Yard Dogs) | Nhóm gồm các Chó Canh Sân trung thành bảo vệ chiếc xương. |

---

## 3. Thiết lập số lượng người chơi và Cấu hình vai trò
Trò chơi hỗ trợ từ **4 đến 8 người chơi**. Cấu hình đồng đội và phe phái thay đổi tùy theo số lượng người tham gia như sau:

| Số người chơi | Số Chó Trộm Xương | Số Chó Canh Sân | Số Đồng Bọn Trộm Xương (Packmate) | Cơ chế thu phục Đồng Bọn |
| :--- | :---: | :---: | :---: | :--- |
| **4 người** | 1 | 3 | 0 | Không có Đồng Bọn. Mỗi người chơi nhận 2 xúc xắc (2 giờ thức trong đêm). |
| **5 người** | 1 | 4 | Tối đa 1 | **Thu phục trong đêm:** Nếu Chó Trộm Xương lấy xương trước mặt Chó Canh Sân (thức cùng giờ):<br>- Nếu chỉ có 1 nhân chứng: Người đó tự động trở thành Đồng Bọn Trộm Xương.<br>- Nếu có nhiều nhân chứng: Chó Trộm Xương được chọn 1 người làm Đồng Bọn Trộm Xương.<br>*(Nếu không ai thức cùng giờ lúc trộm xương, game 5 người sẽ không có Đồng Bọn Trộm Xương).* |
| **6 người** | 1 | 5 | 1 | **Chọn cuối đêm:** Sau giờ thứ 6, Chó Trộm Xương bắt buộc chọn 1 người làm Đồng Bọn Trộm Xương. Chó Trộm Xương và Đồng Bọn Trộm Xương biết mặt nhau qua private state. |
| **7 người** | 1 | 6 | 2 | **Chọn cuối đêm:** Sau giờ thứ 6, Chó Trộm Xương chọn 2 người làm Đồng Bọn Trộm Xương. Hai Đồng Bọn Trộm Xương biết mặt nhau nhưng **không biết** ai là Chó Trộm Xương. |
| **8 người** | 1 | 7 | 2 | **Chọn cuối đêm:** Sau giờ thứ 6, Chó Trộm Xương chọn 2 người làm Đồng Bọn Trộm Xương. Cả 3 người (Chó Trộm Xương và 2 Đồng Bọn Trộm Xương) đều biết mặt nhau. |

---

## 4. Luật chơi chi tiết theo các Phase

### Phase 1: Sân chờ (Lobby)
- Tất cả người chơi vào phòng bằng mã phòng (`roomCode`).
- Người tạo phòng (Host) cấu hình số lượng người chơi tối đa (4-8 người).
- Mỗi người chơi chọn nickname. Khi tất cả đã sẵn sàng (Ready), Host bấm bắt đầu game.
- Backend thực hiện:
  1. Phân chia vai trò ngẫu nhiên (1 Chó Trộm Xương, còn lại là Chó Canh Sân).
  2. Gieo xúc xắc ngẫu nhiên từ 1 đến 6 để quyết định giờ thức dậy (`wakeTimes`).
     - Đối với game 5-8 người: Mỗi người nhận 1 giờ thức dậy.
     - Đối với game 4 người: Mỗi người nhận 2 giờ thức dậy.
     - Khi random xúc xắc, backend phải giới hạn số Dog có thể thức cùng một giờ theo công thức: `số Dog thức cùng giờ < số người chơi - số Đồng Bọn Trộm Xương`. Với 8 người có 2 Đồng Bọn Trộm Xương, số Dog thức cùng giờ tối đa là 5.
     - Với game 5 người, dùng 1 Đồng Bọn Trộm Xương tiềm năng để tính giới hạn vì Đồng Bọn Trộm Xương có thể phát sinh trong đêm.

---

### Phase 2: Đêm trong chuồng (Night Phase)
Đêm diễn ra qua 6 khung giờ, từ **1:00 đến 6:00**. Tại mỗi giờ, hệ thống sẽ đánh thức các chú chó có giờ thức tương ứng với giờ hiện tại.
- Hệ thống luôn gọi đủ cả 6 khung giờ theo thứ tự `1:00pm` đến `6:00pm` để tránh lộ thông tin. Mỗi khung giờ kéo dài đúng thời gian cấu hình, mặc định **10 giây**, kể cả khi không có Dog nào thức hoặc người chơi đã bấm `Đợi` / `Lấy xương`.

#### Cơ chế hoạt động của các vai trò trong đêm:

1. **Chó Trộm Xương (Bone Thief):**
   - Khi đến giờ thức dậy của mình, Chó Trộm Xương có nút hành động `Lấy xương` (`TAKE_BONE`) nếu chiếc xương chưa bị lấy. Lúc thực hiện hành động `Lấy xương` (`TAKE_BONE`) hiển thị thông báo cho các con chó dậy cùng giờ biết.
   - Chó Trộm Xương bắt buộc phải lấy xương trước khi đêm kết thúc. (Đến giây cuối cùng tránh lỗi game hệ thống sẽ tự động lấy xương về cho Chó Trộm Xương)
   - Đối với game 4 người (có 2 giờ thức): Chó Trộm Xương có thể chọn `Đợi` (`WAIT`) ở giờ thức đầu tiên để dành hành động lấy xương cho giờ thức thứ hai nhằm tránh bị phát hiện (chỉ bắt buộc lấy ở giờ thức cuối cùng của mình nếu chưa lấy).

2. **Chó Canh Sân (Yard Dog):**
   - **Xem dấu vết (Peek):** Chỉ áp dụng cho game từ 5-8 người. Nếu một Chó Canh Sân thức dậy **một mình** trong giờ đó (and Chó Trộm Xương không thức cùng giờ), chú chó này được quyền soi dấu vết bằng cách chọn 1 người chơi khác để xem giờ thức dậy bí mật của người đó. Kết quả soi chỉ hiển thị trong chuồng riêng (`Kennel`) của người soi. Chó Trộm Xương không được quyền **Xem dấu vết (Peek):**
   - **Thức chung:** Nếu có từ 2 chú chó trở lên cùng thức dậy trong một giờ, không ai được soi dấu vết. Trên giao diện private của họ sẽ hiển thị danh sách những chú chó đang thức cùng mình để họ tự ghi nhớ và suy luận.
   - Những lần thức chung sẽ được lưu lại trong `Kennel` riêng của từng người đến cuối ván để tránh quên.
   - **Hành động Đợi (Wait):** Người chơi bấm `Đợi` để hoàn thành lượt thức của mình.

3. **Cơ chế chọn giờ thức ở game 4 người:**
   - Theo luật, Chó Canh Sân chỉ được phép thức dậy **đúng 1 lần** trong đêm.
   - Khi bắt đầu đêm, mỗi Chó Canh Sân nhận được kết quả gieo 2 xúc xắc bí mật. Họ phải chọn **1 trong 2** giờ thức đó để làm giờ thức dậy thực tế trong đêm. Giờ còn lại sẽ bị bỏ qua.
   - Chó Trộm Xương sẽ thức dậy ở cả 2 giờ (nếu 2 xúc xắc ra kết quả khác nhau).
   - **Xem dấu vết (Peek):** Nếu một Chó Canh Sân thức dậy **một mình** trong giờ đó (and Chó Trộm Xương không thức cùng giờ), chú chó này được quyền soi dấu vết bằng cách chọn 1 người chơi khác để xem giờ thức dậy bí mật của người đó (Với game 4 người sẽ được biết cả 2 xúc xắc bí mật). Kết quả soi chỉ hiển thị trong chuồng riêng (`Kennel`) của người soi. Chó Trộm Xương không được quyền **Xem dấu vết (Peek):**

---

### Phase 3: Chọn đồng bọn (Pack Selection)
- Đối với game từ 6-8 người, sau khi kết thúc giờ 6:00, game sẽ tạm dừng để Chó Trộm Xương chọn Đồng Bọn Trộm Xương theo số lượng quy định.
- Hành động này hoàn toàn bí mật, chỉ có Chó Trộm Xương nhìn thấy danh sách lựa chọn trong `Kennel` của mình. Sau khi chọn xong, vai trò của những người bị chọn sẽ đổi thành `PACKMATE`.
- Đối với game 5 người, nếu Chó Trộm Xương trộm xương trước mặt nhiều nhân chứng, phase này cũng được kích hoạt bí mật để Chó Trộm Xương chọn 1 trong các nhân chứng đó làm Đồng Bọn Trộm Xương.
- **Quy tắc bảo mật:** Trong suốt thời gian diễn ra chọn đồng bọn trong đêm (đặc biệt là game 5 người), public phase hiển thị trên Yard vẫn phải giữ nguyên là `NIGHT_HOUR` (hoặc không tiết lộ chi tiết việc đang chọn đồng bọn) để tránh rò rỉ thông tin chiếc xương đã bị trộm ở giờ nào.

---

### Phase 4: Cả sân thảo luận (Discussion)
- Khi trời sáng, tất cả người chơi mở mắt. Hệ thống sẽ thông báo công khai trên Yard rằng chiếc xương đã bị mất.
- Mọi người tiến hành thảo luận tự do ngoài app hoặc qua kênh chat. Không ai được phép lật thẻ bài hay chụp màn hình chuồng riêng của mình.

---

### Phase 5: Bỏ phiếu (Voting)
- Mỗi chú chó chọn 1 chú chó khác mà mình nghi ngờ là Chó Trộm Xương (không được tự vote chính mình).
- Kết quả vote được giữ bí mật cho đến khi tất cả mọi người hoàn thành lượt vote của mình.

---

### Phase 6: Kết quả chung cuộc (Result)
Sau khi tất cả đã vote, hệ thống tiết lộ bảng vote chi tiết và tìm ra người có số phiếu cao nhất (Nếu số vote bằng nhau mà trong số những người cao nhất có Chó Trộm Xương thì phe Chó Canh Sân sẽ thắng).
- Người/những người có số phiếu cao nhất sẽ bị lật bài tiết lộ vai trò thật sự.
- **Điều kiện thắng:**
  - **Phe Canh Sân (Yard Dogs) thắng:** Nếu Chó Trộm Xương nằm trong số những người có phiếu bầu cao nhất (bị reveal), và Chó Trắng không phải là người bị vote cao nhất.
  - **Phe Trộm Xương (Thief Bone) thắng:** Nếu Chó Trộm Xương **không** nằm trong số những người có phiếu bầu cao nhất, và Chó Trắng không phải là người bị vote cao nhất.
  - **Chó Trắng (White Dog) thắng:**
    - *Ưu tiên số 1:* Thắng một mình nếu Chó Trắng nhận số phiếu bầu cao nhất (bị cả đàn vote treo cổ).
    - *Ưu tiên số 2 (Nếu bị Chó Trộm Xương thu phục làm Đồng bọn):* Vẫn thắng một mình khi bị vote treo cổ, HOẶC thắng chung cùng Phe Trộm Xương khi Chó Trộm Xương không bị phát hiện.
- Kết thúc game, Host có nút `Chơi lại` để reset phòng về Sân chờ mà không cần tạo phòng mới.

---

## 5. Các Ràng buộc về Bảo mật & Logic hiển thị (Sanitization)

Để đảm bảo tính công bằng và không thể gian lận (cheat), hệ thống cần đảm bảo:
1. **Bảo mật Player ID:** `playerId` là mã định danh bí mật (như một token phiên chơi) của mỗi người chơi. Không được trả về `playerId` thực tế trong danh sách người chơi công khai của `PublicRoomDto`. Danh sách người chơi công khai chỉ chứa thông tin hiển thị (nickname, host status, ready status, hasVoted) và một định danh hiển thị không trùng với `playerId`.
2. **Không rò rỉ phase ẩn:** Ở game 5 người, việc chọn đồng bọn khi có nhiều nhân chứng không được chuyển public phase thành `PACK_SELECTION` công khai trên client của những người đang ngủ.
3. **Bảo mật thông tin trong đêm:** Các API/WebSocket công khai tuyệt đối không được chứa bất kỳ thông tin nào về role bí mật, wakeTimes, kết quả peek hay danh tính đồng bọn trước khi game kết thúc (Phase RESULT).

---

## 6. Quy định về Thời gian (Timer Settings)

Hệ thống hỗ trợ cơ chế đếm ngược thời gian tự động (Timer) cho các phase để tránh việc game bị treo và tối ưu hóa trải nghiệm chơi game realtime:

1. **Thời gian Thảo luận (Discussion Timer):**
   - Công thức tính: `Số phút thảo luận = Số người chơi hiện tại - 1 phút`.
   - Ví dụ: Game 5 người chơi -> 4 phút thảo luận; Game 8 người chơi -> 7 phút thảo luận.
   - Khi hết thời gian đếm ngược thảo luận, game sẽ tự động chuyển sang Phase Bỏ phiếu (Voting).

2. **Thời gian Bỏ phiếu (Voting Timer):**
   - Thời gian mặc định là **1 phút (60 giây)**.
   - Sau khi hết 1 phút thảo luận và tự động chuyển sang Phase Bỏ phiếu, người chơi có tối đa 1 phút để vote.
   - Nếu hết 1 phút mà vẫn còn người chơi chưa vote, hệ thống sẽ tự động khóa sổ. Những người chưa vote sẽ bị coi là bỏ phiếu trắng.

3. **Thời gian trong đêm (Night Hour Timer):**
   - Thời gian mặc định cho mỗi canh giờ (từ 1:00 đến 6:00) là **10 giây**.
   - Hết 10 giây, hệ thống mới chuyển sang canh giờ kế tiếp. Nếu người chơi đang thức không thực hiện hành động gì, hệ thống sẽ tự động bỏ qua lượt thức của họ (tương đương với hành động `Đợi`).
   - Đối với Chó Trộm Xương: Nếu đến canh giờ cuối cùng của mình thức mà vẫn chưa thực hiện `Lấy xương`, hệ thống sẽ tự động thực hiện hành động `TAKE_BONE` ở giây cuối cùng của giờ thức đó để tránh lỗi game/treo game.
   - Chủ phòng (Host) có thể thay đổi thời gian mặc định này trong phần cấu hình cài đặt phòng (Room Settings) trước khi bắt đầu.

4. **Thời gian Chọn đồng bọn (Pack Selection Timer):**
   - Thời gian mặc định là **10 giây**.
   - Chó Trộm Xương có tối đa 10 giây để chọn Đồng Bọn Trộm Xương.
   - Nếu hết 10 giây mà Chó Trộm Xương chưa chọn xong, backend sẽ tự động chọn ngẫu nhiên từ danh sách ứng cử viên hợp lệ để tránh treo game.
   - Chủ phòng (Host) có thể thay đổi thời gian mặc định này trong phần cấu hình cài đặt phòng (Room Settings) trước khi bắt đầu.
