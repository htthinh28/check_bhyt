# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import xlrd

path = r'c:\Users\ITPC\OneDrive - TẬP ĐOÀN Y TẾ PHƯƠNG CHÂU\Documents\2026\KHTH\ICD-10\attachfile001\Phu luc 01.xls'
wb = xlrd.open_workbook(path)
sh = wb.sheet_by_name('PL 1 _ Danh mục đầy đủ')
print('PL1 headers:')
for c in range(sh.ncols):
    print(c, repr(sh.cell_value(1, c))[:80])

sh2 = wb.sheet_by_name('PL 2 _ Liệt kê thay đổi')
print('\nPL2 data rows:', sh2.nrows - 2)
sh3 = wb.sheet_by_name('PL 3 _ Các mã huỷ')
print('PL3 data rows:', sh3.nrows - 2)

# count non-empty PL1 rows
n = 0
for r in range(2, sh.nrows):
    ma = str(sh.cell_value(r, 1)).strip()
    if ma and ma != '':
        n += 1
    else:
        break
print('PL1 data rows (until empty ma):', n)

# sample last data row
for r in range(sh.nrows-5, sh.nrows):
    print('row', r, sh.cell_value(r, 1), str(sh.cell_value(r, 3))[:40])
