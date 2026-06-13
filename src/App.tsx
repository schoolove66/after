import { useState, useEffect, useRef } from 'react';

// 로컬 스토리지 키
const STORAGE_KEY_STUDENTS = 'random_speaker_students';
const STORAGE_KEY_SECRET_QUEUE = 'random_speaker_secret_queue';

function App() {
  // 상태 관리
  const [students, setStudents] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [extractCount, setExtractCount] = useState<number>(1);
  
  // 결과 및 애니메이션 상태
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  
  // 비밀 기능 관련 상태
  const [secretQueue, setSecretQueue] = useState<string[]>([]);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<number | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    const savedStudents = localStorage.getItem(STORAGE_KEY_STUDENTS);
    const savedSecretQueue = localStorage.getItem(STORAGE_KEY_SECRET_QUEUE);
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
    if (savedSecretQueue) {
      setSecretQueue(JSON.parse(savedSecretQueue));
    }
  }, []);

  // 데이터 저장 훅
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SECRET_QUEUE, JSON.stringify(secretQueue));
  }, [secretQueue]);

  // 학생 추가
  const handleAddStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    
    // 쉼표나 띄어쓰기로 여러명 추가
    const newNames = inputValue
      .split(/[,]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0 && !students.includes(name));
      
    if (newNames.length > 0) {
      setStudents(prev => [...prev, ...newNames]);
    }
    setInputValue('');
  };

  // 학생 삭제
  const handleRemoveStudent = (nameToRemove: string) => {
    setStudents(prev => prev.filter(name => name !== nameToRemove));
  };

  // 비밀 기능 트리거 (3연속 클릭)
  const handleSecretTrigger = () => {
    clickCountRef.current += 1;
    
    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 1000); // 1초 내에 연타
    
    if (clickCountRef.current >= 3) {
      setIsSecretModalOpen(true);
      clickCountRef.current = 0;
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    }
  };

  // 비밀 큐 추가
  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput.trim()) {
      setSecretQueue(prev => [...prev, secretInput.trim()]);
      setSecretInput('');
    }
  };

  // 비밀 큐 삭제
  const handleRemoveSecret = (indexToRemove: number) => {
    setSecretQueue(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 뽑기 로직
  const handleExtract = () => {
    if (students.length === 0) {
      alert("학생 명단을 먼저 추가해주세요!");
      return;
    }
    
    let count = Math.min(extractCount, students.length);
    if (count < 1) count = 1;
    
    const selectedWinners: string[] = [];
    const newSecretQueue = [...secretQueue];
    
    // 1. 비밀 큐에서 먼저 추출
    while (selectedWinners.length < count && newSecretQueue.length > 0) {
      selectedWinners.push(newSecretQueue.shift()!);
    }
    
    // 2. 남은 인원은 랜덤 추출
    if (selectedWinners.length < count) {
      const remainingStudents = students.filter(s => !selectedWinners.includes(s));
      // Shuffle remaining
      for (let i = remainingStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingStudents[i], remainingStudents[j]] = [remainingStudents[j], remainingStudents[i]];
      }
      
      const needed = count - selectedWinners.length;
      for (let i = 0; i < needed && i < remainingStudents.length; i++) {
        selectedWinners.push(remainingStudents[i]);
      }
    }
    
    // 상태 업데이트 및 애니메이션 시작
    setSecretQueue(newSecretQueue);
    setWinners(selectedWinners);
    setIsAnimating(true);
    setShowResultPopup(false);
    
    // 애니메이션 시퀀스 타이밍
    setTimeout(() => {
      setShowResultPopup(true);
    }, 2000); // 애니메이션 킥/골 시간 고려
  };

  const closeAnimation = () => {
    setIsAnimating(false);
    setShowResultPopup(false);
  };

  return (
    <>
      <div className="glass-panel">
        <h1>축구공 랜덤 뽑기 ⚽</h1>
        
        {/* 학생 관리 영역 */}
        <div className="input-group">
          <h2>명단 관리 ({students.length}명)</h2>
          <form onSubmit={handleAddStudent} className="input-row">
            <input 
              type="text" 
              placeholder="이름 입력 (쉼표로 여러 명 추가 가능)" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn-primary">추가</button>
          </form>
          
          <div className="student-list">
            {students.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic', padding: '0.5rem' }}>학생을 추가해주세요...</p>
            ) : (
              students.map(student => (
                <div key={student} className="student-badge">
                  {student}
                  <button onClick={() => handleRemoveStudent(student)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />

        {/* 추출 설정 영역 */}
        <div className="input-group">
          <h2>몇 명을 뽑을까요?</h2>
          <div className="input-row" style={{ alignItems: 'center' }}>
            <input 
              type="number" 
              min="1" 
              max={Math.max(1, students.length)}
              value={extractCount}
              onChange={(e) => setExtractCount(parseInt(e.target.value) || 1)}
              style={{ width: '100px', fontSize: '1.2rem', textAlign: 'center' }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>명</span>
          </div>
        </div>

        <button className="btn-large pulse" onClick={handleExtract}>
          뽑기 시작! 🥅
        </button>
      </div>

      {/* 비밀 트리거 영역 */}
      <div 
        className="secret-trigger" 
        onClick={handleSecretTrigger}
        title="Secret Trigger"
      ></div>

      {/* 비밀 모달 */}
      <div className={`modal-overlay ${isSecretModalOpen ? 'open' : ''}`}>
        <div className="secret-modal">
          <button className="close-btn" onClick={() => setIsSecretModalOpen(false)}>×</button>
          <h2>비밀 설정창 🤫</h2>
          <p style={{ marginBottom: '1rem', color: '#b2bec3', fontSize: '0.9rem' }}>
            다음에 무조건 당첨될 학생 이름을 순서대로 미리 넣어두세요.
          </p>
          
          <form onSubmit={handleAddSecret} className="input-row" style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="당첨될 학생 이름" 
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
            />
            <button type="submit" className="btn-primary">예약</button>
          </form>

          <div className="student-list" style={{ background: 'rgba(0,0,0,0.3)', maxHeight: '150px' }}>
            {secretQueue.length === 0 ? (
              <p style={{ color: '#636e72', fontSize: '0.9rem' }}>예약된 학생이 없습니다.</p>
            ) : (
              secretQueue.map((name, idx) => (
                <div key={`${name}-${idx}`} className="student-badge" style={{ background: '#2d3436', color: '#fff' }}>
                  {idx + 1}. {name}
                  <button onClick={() => handleRemoveSecret(idx)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 애니메이션 오버레이 */}
      {isAnimating && (
        <div className={`animation-overlay animate-kick`}>
          <div className="goalpost">🥅</div>
          <div className="goalkeeper">🧤</div>
          <div className="player">🏃‍♂️</div>
          <div className="ball-container">
            {students.map((student, idx) => {
              const isWinner = winners.includes(student);
              const loserClass = `loser-ball-${(idx % 3) + 1}`;
              const animationClass = isWinner ? 'winner-ball' : loserClass;
              
              // 약간의 오프셋을 주어 공들이 겹쳐서 자연스럽게 퍼지도록 함
              const style = {
                transform: `translateX(${(idx % 5) * 5 - 10}px) translateY(${(idx % 3) * 5 - 5}px)`
              };

              return (
                <div key={student} className={`custom-ball ${animationClass}`} style={style}>
                  {student}
                </div>
              );
            })}
          </div>
          
          {showResultPopup && (
            <div className="result-popup">
              <p>🎉 축하합니다! 🎉</p>
              <div className="winners-list">
                {winners.map(winner => (
                  <div key={winner} className="winner-item">
                    {winner}
                  </div>
                ))}
              </div>
              <button className="btn-secondary close-result-btn" onClick={closeAnimation}>
                확인
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
