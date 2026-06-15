# Sao chép mã nguồn sang repo Sa Đéc

Repo đích: **https://github.com/htthinh28/bhyt-pc-sadec**

Nguồn: **https://github.com/htthinh28/ung-dung-cdss-bhyt**

## Cách 1 — Import trên GitHub (không cần terminal)

1. Mở: https://github.com/new/import  
2. **Your old repository’s URL:**  
   `https://github.com/htthinh28/ung-dung-cdss-bhyt.git`  
3. **Owner:** `htthinh28`  
4. **Repository name:** `bhyt-pc-sadec`  
5. Chọn **Private** hoặc **Public**  
6. **Begin import**  
7. Đợi GitHub copy xong (vài phút)

Sau import, trên repo mới chuyển nhánh mặc định sang `cursor/tenant-model-a-3bv-e6c3` (có Mô hình A + profile Sa Đéc MA_CSKCB `87189`):

- Repo → branch dropdown → `cursor/tenant-model-a-3bv-e6c3`  
- **Settings** → **General** → **Default branch** → đổi sang nhánh đó

## Cách 2 — Git trên máy local

```bash
git clone https://github.com/htthinh28/ung-dung-cdss-bhyt.git
cd ung-dung-cdss-bhyt
git checkout cursor/tenant-model-a-3bv-e6c3

git remote add sadec https://github.com/htthinh28/bhyt-pc-sadec.git
git push -u sadec cursor/tenant-model-a-3bv-e6c3:main
```

Nếu repo đích đã có commit:

```bash
git push -u sadec cursor/tenant-model-a-3bv-e6c3:main --force
```

Hoặc chạy script:

```bash
REMOTE_URL=https://github.com/htthinh28/bhyt-pc-sadec.git ./scripts/push_to_bhyt_pc_sadec.sh
```

## Kiểm tra sau copy

Repo `bhyt-pc-sadec` phải có:

- `ma_nguon/`, `config/tenants/phuongchau_sa_dec/profile.json`
- `MA_CSKCB`: `87189`
- `app.config.js`, `tenant_context.jsx`

## Build riêng Sa Đéc

```bash
EXPO_PUBLIC_ORG_ID=phuongchau_sa_dec npm run vercel:build
# hoặc
npm run build:tenant:sa-dec
```
