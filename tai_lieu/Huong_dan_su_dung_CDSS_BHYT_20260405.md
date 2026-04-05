# HƯỚNG DẪN SỬ DỤNG CHI TIẾT CDSS BHYT

Phiên bản tài liệu: 2.0  
Ngày cập nhật: 05/04/2026  
Đối tượng sử dụng: người dùng vận hành, quản trị dữ liệu, quản trị hệ thống và đội hỗ trợ triển khai

## 1. Mục tiêu tài liệu

Tài liệu này hướng dẫn thao tác chi tiết với hệ thống CDSS BHYT theo giao diện và luồng hiện hành trong mã nguồn. Mục tiêu là giúp người dùng mới có thể sử dụng đúng quy trình, đồng thời giúp quản trị viên vận hành được các chức năng đồng bộ, sao lưu, phân quyền và kiểm tra hệ thống.

## 2. Đối tượng người dùng

- Người nhập liệu hoặc rà soát hồ sơ XML BHYT.
- Bác sĩ hoặc điều dưỡng được giao kiểm tra lỗi hồ sơ.
- Nhân sự quản lý kho hồ sơ và dữ liệu thống kê.
- Quản trị viên phân quyền, danh mục, luật và đồng bộ dữ liệu.
- Đội IT triển khai nội bộ.

## 3. Chuẩn bị trước khi sử dụng

### 3.1. Yêu cầu tối thiểu

- Có tài khoản truy cập hợp lệ.
- Có quyền tương ứng với phân hệ cần dùng.
- Có tệp XML BHYT đúng định dạng nếu thực hiện nhập hồ sơ.
- Nếu dùng Firebase hoặc Python service, cần có cấu hình hợp lệ trong `app.json` hoặc runtime.

### 3.2. Chuẩn bị cho môi trường kỹ thuật

Nếu chạy từ mã nguồn, thực hiện:

```bash
npm install
npm run start
```

Nếu dùng trên web:

```bash
npm run web
```

Nếu cần Python service:

```bash
npm run py:install
npm run py:start
```

## 4. Đăng nhập hệ thống

### 4.1. Cách vào màn hình đăng nhập

- Mở ứng dụng.
- Hệ thống sẽ hiển thị `DangNhap` nếu chưa có phiên làm việc hợp lệ.

### 4.2. Thao tác đăng nhập

1. Nhập email hoặc thông tin tài khoản theo cơ chế đơn vị đang áp dụng.
2. Nhập mật khẩu nếu hệ thống yêu cầu.
3. Nhấn nút đăng nhập.
4. Nếu thành công, hệ thống chuyển sang màn hình `TongQuan`.

### 4.3. Lưu ý khi đăng nhập

- Nếu mở ứng dụng từ deep link nhưng chưa đăng nhập, hệ thống sẽ tự đưa về `DangNhap`.
- Nếu tài khoản có phiên cũ còn hiệu lực, hệ thống có thể khôi phục route gần nhất hoặc đưa thẳng về dashboard.
- Nếu không đủ quyền, người dùng vẫn có thể đăng nhập nhưng bị chặn khi vào màn hình không được phép.

## 5. Tổng quan màn hình chính

`TongQuan` là nơi tập trung các phân hệ của ứng dụng. Từ đây người dùng sẽ mở được các module theo quyền hiện có.

Các nhóm phân hệ thường gặp:

- Nhập và kiểm tra hồ sơ XML.
- Kho lưu trữ.
- Báo cáo và thống kê.
- Quản lý luật và quy tắc ON/OFF.
- Quản lý danh mục.
- Danh mục Bộ Y tế.
- Quản lý chuyên môn.
- Helper hệ thống.
- Phân quyền truy cập.

## 6. Quy trình thao tác chuẩn hằng ngày

Đây là quy trình vận hành khuyến nghị cho người dùng nghiệp vụ.

1. Đăng nhập hệ thống.
2. Vào `DocXML` để nhập hồ sơ mới.
3. Kiểm tra kết quả cảnh báo và rà soát từng lỗi.
4. Nếu cần, mở `ChiTiet` hoặc `SuaFileXML` để kiểm tra/chỉnh sửa.
5. Lưu hồ sơ vào `KhoLuuTru`.
6. Cuối ngày hoặc cuối ca, mở `BaoCaoVaThongKe` để xem tỷ lệ lỗi và tổng hợp nhanh.

## 7. Hướng dẫn chi tiết theo từng phân hệ

## 7.1. Màn hình `DocXML`

### Mục đích

- Nhập một hoặc nhiều hồ sơ XML BHYT.
- Chạy kiểm tra rule engine ngay sau khi nạp dữ liệu.

### Các bước thực hiện

1. Vào `DocXML` từ dashboard.
2. Chọn chức năng nhập file.
3. Chọn một hoặc nhiều tệp XML từ máy.
4. Chờ hệ thống đọc dữ liệu và bóc tách XML1 đến XML6.
5. Xem danh sách cảnh báo, lỗi hoặc thông tin giám định hiển thị trên màn hình.

### Kết quả mong đợi

- Hồ sơ được phân tích thành các bảng XML nội bộ.
- Các lỗi phát hiện được gắn theo rule và mức độ.
- Người dùng có thể quyết định lưu hồ sơ, sửa hồ sơ hoặc bỏ qua.

### Lưu ý nghiệp vụ

- Nếu nhập nhiều hồ sơ, nên kiểm tra các lỗi nghiêm trọng trước.
- Với hồ sơ không có lỗi nhưng cần lưu trữ phục vụ thống kê, vẫn nên đưa vào kho.

## 7.2. Màn hình `ChiTiet`

### Mục đích

- Xem chi tiết một hồ sơ theo `MA_LK`.
- Rà soát dữ liệu đầu vào và các cảnh báo đã sinh ra.

### Cách sử dụng

1. Mở hồ sơ từ danh sách nhập mới hoặc từ kho lưu trữ.
2. Chọn hồ sơ cần xem.
3. Quan sát các thông tin tổng hợp, bảng XML liên quan và danh sách lỗi.
4. Nếu cần chỉnh sửa, chuyển sang `SuaFileXML`.

## 7.3. Màn hình `SuaFileXML`

### Mục đích

- Hiệu chỉnh hồ sơ XML sau khi phát hiện lỗi.
- Chạy kiểm tra lại trước khi lưu.

### Quy trình khuyến nghị

1. Từ `ChiTiet`, chọn chỉnh sửa hồ sơ.
2. Cập nhật trường dữ liệu cần sửa.
3. Lưu tạm.
4. Chạy lại kiểm tra.
5. Chỉ lưu chính thức khi lỗi nghiêm trọng đã được xử lý hoặc đã xác định rõ lý do giữ nguyên.

### Lưu ý

- Không nên chỉnh hàng loạt mà không có đối chiếu nguồn gốc hồ sơ.
- Với các lỗi liên quan pháp lý hoặc quyền lợi BHYT, nên có bước xác nhận nội bộ trước khi sửa.

## 7.4. Màn hình `KhoLuuTru`

### Mục đích

- Quản lý toàn bộ hồ sơ đã nhập vào hệ thống.
- Tìm kiếm và truy xuất hồ sơ cho báo cáo hoặc kiểm tra lại.

### Cách sử dụng

1. Vào `KhoLuuTru`.
2. Tìm hồ sơ theo `MA_LK` hoặc tiêu chí hiển thị có sẵn.
3. Chọn hồ sơ cần mở.
4. Vào `ChiTiet` hoặc tái sử dụng hồ sơ cho báo cáo.

### Thực hành tốt

- Nên chuẩn hóa quy trình đặt tên hoặc đối chiếu `MA_LK` trước khi lưu kho.
- Không xóa hồ sơ khỏi kho nếu còn phục vụ thống kê hoặc hậu kiểm.

## 7.5. Màn hình `BaoCaoVaThongKe`

### Mục đích

- Tổng hợp chất lượng hồ sơ trong kho.
- Thống kê lỗi theo thời gian, khoa, bác sĩ và quy tắc.

### Quy trình sử dụng

1. Vào `BaoCaoVaThongKe`.
2. Chờ hệ thống tải toàn bộ dữ liệu kho.
3. Chọn khoảng thời gian nhanh hoặc khoảng tùy chỉnh.
4. Nếu cần, chọn nhóm lỗi cụ thể.
5. Theo dõi KPI đầu vào và đầu ra.
6. Xem từng tab phân tích.
7. Xuất Excel nếu cần báo cáo cho quản lý.

### Ý nghĩa các nhóm thông tin

- Hồ sơ trong kho: toàn bộ dữ liệu hiện có.
- Hồ sơ trong kỳ: dữ liệu thuộc khoảng thời gian đang lọc.
- Hồ sơ có lỗi: số hồ sơ có ít nhất một lỗi sau khi lọc.
- Tổng lỗi: tổng số lần vi phạm.
- Tỷ lệ lỗi hồ sơ: mức độ sai lỗi theo hồ sơ.
- Chi phí ước tính: giá trị nội bộ để ưu tiên xử lý, không phải quyết toán chính thức.

### Các tab quan trọng

- Tổng quan.
- Theo khoa.
- Theo bác sĩ.
- Theo quy tắc.
- Xu hướng.

### Khi nào nên dùng báo cáo

- Cuối ngày để rà soát chất lượng nhập liệu.
- Cuối tuần để phát hiện khoa hoặc bác sĩ có tỷ lệ lỗi cao.
- Trước khi làm báo cáo quản trị nội bộ.

## 7.6. Màn hình `QuanLyLuat`

### Mục đích

- Quản trị bộ luật đang dùng trong hệ thống.
- Theo dõi trạng thái rule, nội dung cảnh báo và điều kiện.

### Khi sử dụng

- Khi cần kiểm tra vì sao một lỗi được sinh ra.
- Khi cần rà soát rule mới hoặc xác minh bộ seed hiện hành.

### Lưu ý

- Chỉ nhân sự được phân quyền mới nên sửa rule.
- Với rule sinh từ Excel hoặc thuộc nhóm hardcoded, phải tuân thủ quy trình thay đổi trước khi can thiệp.

## 7.7. Màn hình `QuanLyQuyTacOnOff`

### Mục đích

- Bật hoặc tắt từng nhóm quy tắc mà không sửa trực tiếp mã nguồn hoặc artefact.

### Cách dùng an toàn

1. Xác định rule hoặc nhóm rule cần giảm nhiễu.
2. Đánh giá ảnh hưởng nghiệp vụ.
3. Đổi trạng thái ON/OFF.
4. Chạy lại kiểm thử hoặc audit mẫu để xác nhận không làm lệch kết quả ngoài ý muốn.

## 7.8. Màn hình `QuanLyDanhMuc` và `DanhMucBYTMain`

### Mục đích

- Quản lý danh mục nội bộ và danh mục chuẩn tham chiếu.
- Hỗ trợ đối chiếu mã dịch vụ, thuốc, vật tư và danh mục liên quan.

### Khuyến nghị sử dụng

- Chỉ cập nhật khi có nguồn danh mục đã được phê duyệt.
- Ghi nhận thời điểm và người cập nhật khi thay đổi dữ liệu tham chiếu.

## 7.9. Màn hình `QuanLyChuyenMon`

### Mục đích

- Quản lý nội dung chuyên môn, phác đồ hoặc quy trình hỗ trợ giám định.

### Khuyến nghị

- Chỉ đội chuyên môn hoặc quản trị viên được phép chỉnh sửa.
- Mọi cập nhật nên có tài liệu tham chiếu đi kèm.

## 7.10. Các màn hình `XML1` đến `XML6`

### Mục đích

- Xem và quản lý dữ liệu chi tiết theo từng bảng XML.
- Hỗ trợ đối chiếu cấu trúc trường dữ liệu.

### Khi sử dụng

- Khi cần kiểm tra đúng/sai của từng trường cụ thể.
- Khi cần giải thích vì sao rule engine đọc ra một giá trị nào đó.

## 7.11. Màn hình `Helper`

### Mục đích

- Cung cấp công cụ vận hành cho quản trị viên.

### Các thao tác thường dùng

- Kiểm tra Firebase đang bật hay tắt.
- Đồng bộ dataset lên Firebase.
- Tải dataset từ Firebase về máy.
- Sao lưu dữ liệu hệ thống.
- Phục hồi dữ liệu từ file backup.
- Kiểm tra hoặc dọn dữ liệu cloud lỗi.

### Khuyến nghị thao tác

- Sao lưu trước khi thay đổi dữ liệu rule hoặc danh mục.
- Chỉ đồng bộ cloud sau khi đã kiểm tra dữ liệu local ổn định.

## 7.12. Màn hình `PhanQuyenTruyCap`

### Mục đích

- Tạo tài khoản.
- Gán quyền cho người dùng.
- Khóa/mở khóa tài khoản.

### Quy trình gợi ý

1. Tạo tài khoản bằng email chuẩn.
2. Gán vai trò phù hợp.
3. Kiểm tra quyền màn hình theo nhu cầu thực tế.
4. Đăng nhập thử bằng tài khoản đó nếu cần xác minh.

## 8. Hướng dẫn cho quản trị viên hệ thống

## 8.1. Sao lưu dữ liệu

Thực hiện định kỳ:

1. Vào `Helper`.
2. Chọn chức năng xuất backup.
3. Lưu file vào vị trí an toàn.
4. Đặt tên file theo ngày và môi trường.

Khuyến nghị:

- Sao lưu trước mỗi lần cập nhật dataset luật.
- Sao lưu hằng ngày nếu đơn vị thao tác nhiều hồ sơ.

## 8.2. Phục hồi dữ liệu

1. Mở `Helper`.
2. Chọn chức năng nhập backup.
3. Chọn đúng file sao lưu.
4. Xác nhận phục hồi.
5. Kiểm tra lại danh mục, luật, kho hồ sơ và phân quyền sau khi phục hồi.

## 8.3. Đồng bộ Firebase

Điều kiện:

- `firebase.enabled` đã bật.
- Cấu hình kết nối hợp lệ.
- Tài khoản cloud đủ quyền.

Các bước:

1. Vào `Helper`.
2. Chọn chức năng đồng bộ mong muốn.
3. Chờ hệ thống hoàn tất quá trình chunk và ghi cloud.
4. Theo dõi thông báo thành công/thất bại.

## 8.4. Chạy Python service

Khi cần audit lai hoặc smoke test:

```bash
npm run py:start
npm run qa:python-service
```

Kiểm tra kết quả:

- Service phản hồi `GET /health`.
- Smoke test trả PASS cho các kịch bản đã cài sẵn.

## 8.5. Phân quyền người dùng mới

Quy trình đề xuất:

1. Tạo tài khoản mới.
2. Gán role nền.
3. Gán quyền màn hình bổ sung nếu cần.
4. Kiểm tra tài khoản không nhìn thấy các phân hệ ngoài phạm vi.

## 9. Xử lý các tình huống thường gặp

## 9.1. Không đăng nhập được

Kiểm tra:

- Tài khoản có tồn tại không.
- Phiên cũ có bị lỗi hay không.
- Người dùng có bị khóa không.
- Cấu hình xác thực cloud có đang gây lỗi ngoài ý muốn hay không.

## 9.2. Nhập XML nhưng không thấy kết quả

Kiểm tra:

- File XML có đúng định dạng không.
- File có bị rỗng hoặc mã hóa lỗi không.
- Rule engine có bị tắt hàng loạt do cấu hình ON/OFF không.

## 9.3. Hồ sơ không xuất hiện trong kho

Kiểm tra:

- Người dùng đã bấm lưu hồ sơ chưa.
- `MA_LK` có bị trùng với hồ sơ cũ không.
- Trình duyệt có chặn IndexedDB hay không.

## 9.4. Báo cáo không có dữ liệu

Kiểm tra:

- Kho lưu trữ đã có hồ sơ chưa.
- Bộ lọc thời gian có quá hẹp không.
- Hồ sơ có `NGAY_VAO` hợp lệ không.

## 9.5. Không đồng bộ được Firebase

Kiểm tra:

- `firebase.enabled`.
- `projectId`, `apiKey`, `appId`.
- Chế độ auth đang là anonymous hay email/password.
- Quyền role cloud của tài khoản.
- Kết nối mạng.

## 9.6. Python service không phản hồi

Kiểm tra:

- Service đã chạy cổng `8000` chưa.
- `expo.extra.pythonService.baseUrl` có đúng không.
- Có firewall hoặc chặn mạng nội bộ không.

## 10. Thực hành tốt khi vận hành

- Chỉ bật/tắt rule sau khi có đánh giá tác động.
- Không chỉnh trực tiếp dữ liệu rule production mà không sao lưu.
- Nên kiểm tra một lô mẫu sau mỗi thay đổi danh mục hoặc rule.
- Định kỳ xem tab xu hướng để phát hiện lỗi tăng bất thường.
- Với lỗi nghiêm trọng liên quan quyền lợi BHYT, cần có bước xác nhận chuyên môn trước khi chốt hồ sơ.

## 11. Checklist vận hành đề xuất

## 11.1. Checklist đầu ngày

1. Đăng nhập và kiểm tra ứng dụng chạy ổn định.
2. Xác nhận có thể mở `DocXML`, `KhoLuuTru`, `BaoCaoVaThongKe`.
3. Nếu có dùng cloud, kiểm tra nhanh Firebase/Python service.

## 11.2. Checklist trong ngày

1. Nhập hồ sơ XML theo đợt.
2. Xử lý lỗi nghiêm trọng trước.
3. Lưu hồ sơ đã rà soát vào kho.
4. Ghi nhận các bất thường chưa thể xử lý để theo dõi tiếp.

## 11.3. Checklist cuối ngày

1. Mở `BaoCaoVaThongKe` và xem KPI chính.
2. Xác định khoa, bác sĩ hoặc rule có xu hướng tăng lỗi.
3. Sao lưu dữ liệu nếu khối lượng thay đổi lớn.

## 11.4. Checklist hằng tuần cho quản trị viên

1. Rà soát tài khoản và quyền truy cập.
2. Kiểm tra tình trạng đồng bộ cloud.
3. Kiểm tra danh mục và trạng thái rule ON/OFF.
4. Chạy smoke test Python service nếu đang dùng mô hình lai.

## 12. Câu hỏi thường gặp

### Hỏi: Có thể dùng hệ thống khi mất mạng không?

Trả lời: Có. Hệ thống được thiết kế local-first. Các chức năng nhập hồ sơ, kiểm tra và lưu kho chủ yếu làm việc cục bộ. Các chức năng cloud chỉ cần khi đồng bộ hoặc phục hồi dữ liệu.

### Hỏi: Có bắt buộc mở Python service không?

Trả lời: Không. Python service là lớp mở rộng. Luồng cơ bản của ứng dụng vẫn chạy được mà không cần service này.

### Hỏi: Tại sao cùng một rule nhưng kết quả thay đổi sau khi cập nhật seed?

Trả lời: Vì seed luật và migration seed có thể thay đổi biểu thức hoặc dữ liệu rule. Khi có cập nhật seed, dữ liệu đã lưu cũ cũng có thể được cập nhật theo cơ chế migration.

### Hỏi: Vì sao tài khoản vào được dashboard nhưng không vào được một màn hình cụ thể?

Trả lời: Người dùng đã đăng nhập nhưng không có quyền cho màn hình đó trong RBAC. Hệ thống sẽ tự đưa về `TongQuan`.

## 13. Kết luận

Hệ thống CDSS BHYT được thiết kế để phục vụ quy trình kiểm tra hồ sơ XML BHYT theo hướng thực dụng: nhập liệu, phát hiện lỗi, chỉnh sửa, lưu kho, thống kê và đồng bộ khi cần. Người dùng nghiệp vụ nên tuân thủ luồng chuẩn nhập XML, rà soát lỗi, lưu kho và theo dõi báo cáo. Quản trị viên cần tập trung vào 4 nhiệm vụ chính: phân quyền đúng, sao lưu định kỳ, kiểm soát rule/danh mục, và xác nhận các tích hợp ngoài luôn ở trạng thái ổn định.