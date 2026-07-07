# Bone Thief

Web game multiplayer theo phòng, theme các chú chó trong sân tìm ra ai đã lấy xương.

- Frontend: React + Vite + TypeScript.
- Backend: Spring Boot 3.x, Java 21.
- Realtime: WebSocket/STOMP.
- Storage MVP: in-memory `ConcurrentHashMap`.

## Cấu trúc

```text
backend/   Spring Boot REST + STOMP server
frontend/  React Vite client
docs/      gameplay spec và technical design
image/     asset gốc bạn thêm vào workspace
```

## Chạy local

### Backend

Cần Java 21 trở lên và Maven có trong `PATH`.

```bash
cd backend
./mvnw spring-boot:run
```

Trên PowerShell Windows có thể dùng:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend mặc định chạy ở `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy ở `http://localhost:5173`.

## Build

Backend:

```bash
cd backend
./mvnw package
```

Frontend:

```bash
cd frontend
npm run build
```

Output frontend nằm trong `frontend/dist`.

## Cấu hình URL backend

Frontend đọc biến môi trường Vite:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
VITE_WS_BASE_URL=wss://your-backend.example.com/ws
```

Nếu không đặt biến môi trường:

- `VITE_API_BASE_URL` mặc định là `http://localhost:8080`
- `VITE_WS_BASE_URL` tự suy ra là `ws://localhost:8080/ws`

Với Vercel, đặt các biến này trong Project Settings. Với GitHub Pages, đặt biến khi build bằng workflow hoặc file môi trường trước lúc chạy `npm run build`.

## Deploy frontend

### Vercel

1. Import project.
2. Chọn root là `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Đặt `VITE_API_BASE_URL` và `VITE_WS_BASE_URL` trỏ tới backend đã deploy.

### GitHub Pages

1. Chạy `npm run build` trong `frontend`.
2. Publish thư mục `frontend/dist`.
3. Nếu deploy dưới subpath của repo, cấu hình thêm `base` trong `frontend/vite.config.ts` trước khi build.
4. Đặt URL backend qua biến môi trường trong workflow build.

## Gameplay MVP

- Tạo phòng và join phòng bằng mã.
- Có password phòng tùy chọn.
- Host cấu hình 4-8 Dog.
- Host cấu hình ngôn ngữ, thời gian mỗi canh giờ đêm, thời gian chọn đồng bọn.
- Mỗi người chơi có thể đổi tên hiển thị trong lobby.
- Host bắt đầu khi đủ người và tất cả sẵn sàng.
- Backend chia vai, giờ thức, phase đêm, chọn đồng bọn, thảo luận, vote và kết quả.
- Timer server-side:
  - Đêm: mặc định 10 giây mỗi canh giờ.
  - Chọn đồng bọn: mặc định 10 giây.
  - Thảo luận: số phút = số người chơi - 1.
  - Vote: 60 giây.
- Public state không chứa role, giờ thức, peek result, target vote trước Result.
- Public state chỉ dùng public id kiểu `DOG1`, không lộ `playerId` phiên của người khác.
- Private state gửi riêng cho từng `playerId` qua `/user/queue/private-state`.
- Có nút chơi lại trong cùng phòng sau Result.

## Ghi chú asset

Ảnh `image/boner-thief.png` được copy nguyên tấm vào `frontend/public/boner-thief.png` để dùng làm artwork phụ. MVP không cần cắt ảnh thành từng lá.
