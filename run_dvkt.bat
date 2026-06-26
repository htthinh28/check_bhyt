@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Danh muc DVKT - Python Web App ===
python -m pip install -q -r dvkt_app\requirements.txt
python _build_dvkt_web.py
python _sync_duoc_thu_static.py
if not exist "dvkt_app\data\pl1.json.gz" (
  echo Extracting data from HTML...
  python _extract_dvkt_data.py
)
echo Merging BHXH pham vi hanh nghe (toan bo danh muc)...
python _merge_bhxh_phamvi.py
echo Merging Quy trinh ky thuat BYT...
set QTKT_MAX_MB=28
python _merge_qtkt_mapping.py
echo.
echo Dung server cu tren cong 5050 neu co...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5050" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul
echo Starting server http://127.0.0.1:5050
python dvkt_app\app.py
pause
