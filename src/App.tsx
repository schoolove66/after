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
  
  // 윤리 핵심가이드 게이트 상태
  const [showGate, setShowGate] = useState(() => {
    return localStorage.getItem('ethical_agreed') !== 'true';
  });
  const [isAgreed, setIsAgreed] = useState(false);
  
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const handleStartGame = () => {
    if (!isAgreed) return;
    localStorage.setItem('ethical_agreed', 'true');
    setShowGate(false);
  };

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

  if (showGate) {
    return (
      <div className="gate-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 'var(--spacing-md)' }}>
        <div className="color-block-section navy gate-card" style={{ maxWidth: '850px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', alignItems: 'center', textAlign: 'center' }}>
            <p className="eyebrow" style={{ color: 'var(--block-lime)', letterSpacing: '2px', fontWeight: 700, margin: 0 }}>
              GENERATIVE AI ETHICS & INTEGRITY GUIDE
            </p>
            <h1 className="gate-title" style={{ color: 'var(--inverse-ink)', margin: 'var(--spacing-xs) 0', fontSize: '38px', fontWeight: 700 }}>
              생성형 AI 윤리 핵심가이드
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', maxWidth: '650px', margin: '0 auto var(--spacing-md) auto', lineHeight: 1.5 }}>
              본 프로그램을 이용하기 전에 아래의 6가지 윤리 핵심가이드를 확인해 주세요.<br/>
              학생 여러분이 스스로 윤리원칙을 지키며 주도적으로 학습할 수 있도록 내용을 준수해 주세요.
            </p>
          </div>

          <div className="gate-rules" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', margin: 'var(--spacing-md) 0' }}>
            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>01</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 1. 활용 목적</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>생성형 AI를 쓰기 전, '왜' 쓰는지 말할 수 있어야 해요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  생성형 AI를 사용하기 전에 '지금 내가 왜 쓰려고 하지?'라고 스스로 물어보세요. 생성형 AI는 내 생각을 대신해주는 게 아니라, 내 생각을 도와주는 도구임을 기억하세요. 모든 공부에 생성형 AI가 필요한 것은 아니므로, 지금 하는 활동에 생성형 AI를 사용하는 것이 나의 학습에 정말 도움이 될지 먼저 고민해요.
                </p>
              </div>
            </div>

            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>02</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 2. 주도적 학습</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>생성형 AI에게 물어보기 전, 내 생각을 먼저 말해요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  막막할 때 바로 생성형 AI에게 묻고 싶은 마음이 들 수 있지만, 먼저 스스로 시도해 보아야 나의 성장에 도움이 돼요. 주제에 대해 내가 아는 것과 내 아이디어를 먼저 공책에 적거나 정리한 뒤에 생성형 AI를 활용하세요.
                </p>
              </div>
            </div>

            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>03</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 3. 비판적 검증</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>생성형 AI가 틀릴 수 있다는 점을 알아요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  생성형 AI는 틀린 정보를 마치 사실인 것처럼 제시하기도 하므로, 알려준 내용은 항상 '정말 맞을까?' 하고 한 번 더 확인하는 습관을 가져요. 중요한 내용일수록 책을 찾아보거나 선생님께 여쭤보는 등 다른 방법으로도 꼭 다시 확인하세요.
                </p>
              </div>
            </div>

            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>04</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 4. 사고의 확장</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>생성형 AI와 함께 상상하며 내 생각을 더 크게 키워요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  생성형 AI를 내 생각의 범위를 넓혀주는 도구로 사용해보세요. 생성형 AI의 결과물을 그대로 사용하지 않고, 나의 경험과 생각을 더하여 나만의 색깔을 담은 최종 결과물을 만들어요.
                </p>
              </div>
            </div>

            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>05</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 5. 안전과 관계</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>나의 정보와 비밀을 말하지 않아요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  내가 입력한 정보는 어디서 어떻게 사용될지 모르기 때문에 이름, 주소, 학교, 전화번호 같은 개인정보는 생성형 AI에게 알려주면 안돼요. 생성형 AI는 계산된 답변을 내놓는 프로그램이라 감정이 없어요. 나의 고민을 털어놓으며 지나치게 의지하기보다, 친구나 부모님, 선생님과의 실제 대화를 통해 마음을 나누어요.
                </p>
              </div>
            </div>

            <div className="gate-rule-item" style={{ display: 'flex', gap: 'var(--spacing-md)', background: 'rgba(255,255,255,0.05)', padding: 'var(--spacing-md)', borderRadius: 'var(--rounded-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="rule-number" style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--block-lime)', fontWeight: 700 }}>06</div>
              <div className="rule-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)', marginBottom: '6px' }}>가이드 6. 투명성·윤리</h3>
                <h4 style={{ fontSize: '15px', color: 'var(--block-lime)', marginBottom: '8px', fontWeight: 600 }}>생성형 AI의 도움을 받았다면 숨기지 않고 정직하게 이야기해요.</h4>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  어느 부분이 생성형 AI의 것이고 어느 부분이 나의 것인지 명확히 밝히는 것은 나 자신을 속이지 않는 정직한 태도예요. 생성형 AI를 쓴 사실을 정직하게 밝힐 때 나의 노력이 더 빛나고 가치 있게 인정받을 수 있어요.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <label className="gate-agreement-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}>
              <input 
                type="checkbox" 
                checked={isAgreed} 
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--block-lime)' }}
              />
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--inverse-ink)' }}>
                이 윤리 핵심가이드를 빠짐없이 읽고 이를 지키겠습니다.
              </span>
            </label>

            <button 
              onClick={handleStartGame} 
              className="btn-primary" 
              style={{ 
                backgroundColor: isAgreed ? 'var(--block-lime)' : '#485460', 
                color: isAgreed ? '#000000' : 'rgba(255,255,255,0.4)', 
                cursor: isAgreed ? 'pointer' : 'not-allowed',
                width: '200px',
                height: '48px',
                marginTop: '12px',
                fontSize: '18px',
                fontWeight: 700,
                borderRadius: 'var(--rounded-pill)',
                transition: 'all 0.2s ease'
              }}
              disabled={!isAgreed}
            >
              시작 하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="color-block-section">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
          <h1 style={{ marginBottom: 0 }}>랜덤 발표자 뽑기</h1>
          <button 
            onClick={() => {
              setIsAgreed(false);
              setShowGate(true);
            }} 
            className="btn-secondary" 
            style={{ padding: '6px 16px', fontSize: '14px', height: 'auto', borderRadius: 'var(--rounded-pill)', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
          >
            🛡️ 윤리 가이드 다시 보기
          </button>
        </div>
        <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          Fair & Random Selection
        </p>
        
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
            <button type="submit" className="btn-secondary">추가</button>
          </form>
          
          <div className="student-list">
            {students.length === 0 ? (
              <p style={{ color: 'rgba(0,0,0,0.5)', padding: '8px' }}>학생을 추가해주세요...</p>
            ) : (
              students.map(student => (
                <div key={student} className="student-badge">
                  {student}
                  <button onClick={() => handleRemoveStudent(student)}>
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--hairline)', margin: 'var(--spacing-md) 0' }} />

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
              style={{ width: '120px', fontSize: '20px', textAlign: 'center' }}
            />
            <span style={{ fontSize: '20px', fontWeight: 500 }}>명</span>
          </div>
        </div>

        <button className="btn-primary" onClick={handleExtract} style={{ alignSelf: 'flex-start', marginTop: 'var(--spacing-md)' }}>
          뽑기 시작! ⚽
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
        <div className="color-block-section navy secret-modal">
          <button className="close-btn" onClick={() => setIsSecretModalOpen(false)}>×</button>
          <h2>비밀 설정창</h2>
          <p className="eyebrow" style={{ color: 'var(--inverse-ink)', opacity: 0.8 }}>
            다음 당첨자 강제 지정
          </p>
          
          <form onSubmit={handleAddSecret} className="input-row" style={{ marginBottom: 'var(--spacing-md)' }}>
            <input 
              type="text" 
              placeholder="학생 이름" 
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              style={{ backgroundColor: 'var(--inverse-canvas)', color: 'var(--inverse-ink)', border: '1px solid #485460' }}
            />
            <button type="submit" className="btn-primary" style={{ backgroundColor: 'var(--canvas)', color: 'var(--inverse-canvas)' }}>예약</button>
          </form>

          <div className="student-list" style={{ background: 'rgba(0,0,0,0.3)', maxHeight: '150px' }}>
            {secretQueue.length === 0 ? (
              <p style={{ color: '#636e72', fontSize: '14px' }}>예약된 학생이 없습니다.</p>
            ) : (
              secretQueue.map((name, idx) => (
                <div key={`${name}-${idx}`} className="student-badge" style={{ background: '#2d3436', color: '#fff', border: 'none' }}>
                  {idx + 1}. {name}
                  <button onClick={() => handleRemoveSecret(idx)} style={{ color: '#ff7675' }}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 애니메이션 오버레이 */}
      {isAnimating && (
        <div className={`animation-overlay animate-kick`}>
          <div className="goalkeeper ai-element"></div>
          <div className="player ai-element"></div>
          
          <div className="ball-container">
            {students.map((student, idx) => {
              const isWinner = winners.includes(student);
              const loserClass = `loser-ball-${(idx % 3) + 1}`;
              const animationClass = isWinner ? 'winner-ball' : loserClass;
              
              const style = {
                transform: `translateX(${(idx % 5) * 5 - 10}px) translateY(${(idx % 3) * 5 - 5}px)`
              };

              return (
                <div key={student} className={`custom-ball ${animationClass}`} style={style}>
                  <span>{student}</span>
                </div>
              );
            })}
          </div>
          
          {showResultPopup && (
            <div className="result-popup color-block-section lilac">
              <p className="eyebrow" style={{ textAlign: 'center' }}>🎉 Winner Selected 🎉</p>
              <h2>축하합니다!</h2>
              <div className="winners-list">
                {winners.map(winner => (
                  <div key={winner} className="winner-item">
                    {winner}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-xl)' }}>
                <button className="btn-primary" onClick={closeAnimation}>
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
