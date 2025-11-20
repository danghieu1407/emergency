## Ứng dụng cầu cứu lũ lụt

Webapp Next.js giúp người dân gửi tín hiệu cầu cứu kèm toạ độ GPS và cho đội cứu hộ theo dõi danh sách yêu cầu theo thời gian thực.

### 1. Thiết lập môi trường

1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Tạo Supabase project (hoặc Postgres tương thích) và chạy lệnh SQL để tạo bảng:
   ```sql
   create table if not exists public.rescue_requests (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     full_name text not null,
  phone_number text,
     status text not null,
     notes text,
  address text,
     latitude double precision,
     longitude double precision,
     accuracy double precision,
     manual_override boolean default false,
     source text
   );
   ```
3. Tạo file `.env.local` và điền thông tin:
   ```bash
   SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=... # chỉ dùng phía server
NEXT_PUBLIC_SUPABASE_ANON_KEY=... # (tuỳ chọn) cho client read-only
GEOCODER_USER_AGENT=FloodRescue/1.0 (contact@example.com) # tuỳ chọn
   ```

### 2. Chạy dự án

```bash
npm run dev
```

Truy cập `http://localhost:3000` để mở giao diện người dân gửi cầu cứu và `http://localhost:3000/requests` cho trang tổng hợp của đội cứu hộ.

### 3. Tính năng chính

- **Gửi cầu cứu:** nhập họ tên (bắt buộc), số điện thoại (tuỳ chọn), tình trạng, mô tả; hệ thống tự xác định GPS (có thể chạm lên bản đồ hoặc nhập địa chỉ để đặt thủ công).
- **Lưu vào database:** khi bấm “Lưu & chia sẻ”, dữ liệu được lưu vào bảng `rescue_requests` rồi kích hoạt Web Share API (hoặc sao chép nội dung).
- **Bản đồ tương tác:** hiển thị marker và vòng tròn sai số; cho phép chọn lại vị trí nếu GPS chưa chính xác.
- **Danh sách cứu hộ:** trang `/requests` hiển thị bảng có tìm kiếm, lọc tình trạng, sắp xếp, liên kết mở Google Maps, kèm địa chỉ mô tả.

### 4. Ghi chú triển khai

- Ứng dụng yêu cầu chạy trên HTTPS (hoặc `localhost`) để truy cập GPS chính xác.
- Supabase service role key phải được giữ kín, chỉ sử dụng trong API route (`/api/requests`).
- Có thể triển khai trên Vercel hoặc bất kỳ hosting hỗ trợ Next.js App Router.

