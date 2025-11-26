// scripts/merge_schools.js
const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/lib/sync');

// ---------------------
// 경로 설정
// ---------------------
const INPUT_DIR = path.join(__dirname, 'raw_schools'); // CSV 파일 폴더
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'schools.json');

// ---------------------
// CSV -> JSON 변환 함수
// ---------------------
function isHighSchool(row) {
  // CSV 컬럼명에 따라 조정 가능 (예: 학교종류명)
  return row['학교종류명'] && row['학교종류명'].includes('고등학교');
}

function normalizeSchool(row) {
  return {
    school_id: row['표준학교코드'] || row['학교코드'] || Date.now().toString(),
    name: row['학교명'],
    type: row['설립구분'] + ' ' + row['학교종류명'],
    address: row['도로명주소'] || row['주소'],
    district: row['관할조직명'] || ''
  };
}

// ---------------------
// 메인
// ---------------------
function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('raw_schools 폴더가 없습니다!');
    process.exit(1);
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'));
  const schools = [];
  const seen = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf8');
    const records = csvParse(content, { columns: true, skip_empty_lines: true });

    for (const row of records) {
      if (isHighSchool(row)) {
        const s = normalizeSchool(row);
        if (!seen.has(s.school_id)) {
          schools.push(s);
          seen.add(s.school_id);
        }
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schools, null, 2), 'utf8');
  console.log(`✅ 총 ${schools.length}개 고등학교 데이터를 ${OUTPUT_FILE}에 저장했습니다.`);
}

main();
