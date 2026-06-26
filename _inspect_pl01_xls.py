# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'c:\Users\ITPC\OneDrive - TẬP ĐOÀN Y TẾ PHƯƠNG CHÂU\Documents\2026\KHTH\ICD-10\attachfile001\Phu luc 01.xls'

try:
    import xlrd
    wb = xlrd.open_workbook(path)
    print('sheets:', wb.sheet_names())
    for name in wb.sheet_names():
        sh = wb.sheet_by_name(name)
        print(f'\n=== {name} rows={sh.nrows} cols={sh.ncols} ===')
        for r in range(min(8, sh.nrows)):
            row = [str(sh.cell_value(r, c))[:60] for c in range(min(sh.ncols, 15))]
            print(r, row)
except ImportError:
    print('no xlrd')
    import pandas as pd
    xl = pd.ExcelFile(path)
    print('sheets:', xl.sheet_names)
