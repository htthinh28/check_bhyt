# Triển khai Mô hình A — 3 bệnh viện Phương Châu

Phiên bản: 1.0 · Ngày: 2026-06-12

## Ba tenant

| org_id | Tên | MA_CSKCB |
|--------|-----|----------|
| `phuongchau_soc_trang` | Bệnh viện Quốc tế Phương Châu Sóc Trăng | 94170 |
| `phuongchau_can_tho` | Bệnh viện Quốc tế Phương Châu Cần Thơ | 92114 |
| `phuongchau_sa_dec` | Bệnh viện Phương Châu Sa Đéc | 87189 |

Alias legacy: `phuongchau` → `phuongchau_soc_trang` (migration + Firebase path cũ).

## Build (một repo, nhiều artifact)

```bash
npm run build:tenant:soc-trang   # → dist-phuongchau_soc_trang/
npm run build:tenant:can-tho     # → dist-phuongchau_can_tho/
npm run build:tenant:sa-dec      # → dist-phuongchau_sa_dec/
```

## Vercel — 3 project, 1 repo

| Project | Env |
|---------|-----|
| cdss-phuongchau-soc-trang | `EXPO_PUBLIC_ORG_ID=phuongchau_soc_trang` |
| cdss-phuongchau-can-tho | `EXPO_PUBLIC_ORG_ID=phuongchau_can_tho` |
| cdss-phuongchau-sa-dec | `EXPO_PUBLIC_ORG_ID=phuongchau_sa_dec` |

## Storage

- AsyncStorage/localStorage: `CDSS_ORG_{orgId}_*`
- IndexedDB: `CDSS_HO_SO_DB__{orgId}`, `CDSS_HE_THONG_DB__{orgId}`
- Migration tự động lần đầu mở app

## QA

```bash
npm run qa:tenant-isolation
```
