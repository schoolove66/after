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

  // 이용약관 및 개인정보처리방침 모달 상태
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
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
      <div className="gate-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-md)' }}>
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

        {/* Gate Footer */}
        <footer style={{ 
          marginTop: 'var(--spacing-xl)', 
          padding: 'var(--spacing-md)', 
          textAlign: 'center', 
          fontSize: '14px', 
          color: 'rgba(0, 0, 0, 0.6)',
          width: '100%',
          maxWidth: '850px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontWeight: 700 }}>
            <button 
              onClick={() => setIsTermsOpen(true)} 
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '14px', color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              이용약관
            </button>
            <span style={{ color: 'var(--hairline)' }}>|</span>
            <button 
              onClick={() => setIsPrivacyOpen(true)} 
              style={{ background: 'none', border: 'none', padding: 0, fontSize: '14px', color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              개인정보처리방침
            </button>
          </div>
          <div style={{ marginTop: '4px' }}>
            <span>© 2026 정영윤 (서울염리초등학교). All rights reserved.</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            <span>정보관리책임자: 정영윤 교사 | 문의: 02-713-7513</span>
          </div>
        </footer>

        {/* Modals rendering inside gate */}
        {renderModals()}
      </div>
    );
  }

  // Modals render helper
  function renderModals() {
    return (
      <>
        {/* 이용약관 모달 */}
        <div className={`modal-overlay ${isTermsOpen ? 'open' : ''}`} style={{ zIndex: 3000 }}>
          <div className="color-block-section navy secret-modal" style={{ maxWidth: '700px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative', textAlign: 'left', padding: 'var(--spacing-xl)' }}>
            <button className="close-btn" onClick={() => setIsTermsOpen(false)} style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
            <h2>이용약관</h2>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: 'var(--spacing-md) 0' }} />
            <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p><strong>본 이용약관(이하 '약관')은 정영윤 교사(서울염리초등학교)(이하 '서비스 제공자')가 제공하는 교육용 웹 애플리케이션 서비스 '랜덤 발표자 뽑기'(이하 '본 서비스')의 이용에 관한 사항을 규정합니다.</strong></p>
              <br/>
              <h4>제1조 (목적)</h4>
              <p>이 약관은 서비스 제공자가 제공하는 무료 교육용 웹 애플리케이션 서비스(이하 '서비스')를 이용함에 있어 서비스 제공자와 이용자의 권리의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              <br/>
              <h4>제2조 (정의)</h4>
              <p>1. '서비스'란 본 플랫폼에서 제공하는 발표자 랜덤 추출 웹 애플리케이션을 말합니다.<br/>
              2. '이용자'란 본 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 회원(학생) 및 비회원(교사, 학부모 등)을 말합니다.<br/>
              3. '회원'이란 브라우저 내에 학생 정보를 등록하여 저장 기능을 활용하며 서비스를 상시 이용하는 자를 말합니다.</p>
              <br/>
              <h4>제3조 (약관의 명시와 개정)</h4>
              <p>1. 서비스 제공자는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 진입 화면 또는 하단 링크에 게시합니다.<br/>
              2. 서비스 제공자는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
              <br/>
              <h4>제4조 (서비스의 제공 및 이용 요금)</h4>
              <p>1. 본 서비스는 교육 목적의 무료 웹 애플리케이션입니다.<br/>
              2. 서비스의 모든 기능 이용은 완전히 무료이며, 별도의 광고 시청이나 유료 결제를 일절 요구하지 않습니다.<br/>
              3. 본 서비스는 초등학교 교실 및 학급 활동 지원을 목적으로 제작되었으며, 상업적인 목적으로 운영되거나 이용될 수 없습니다.</p>
              <br/>
              <h4>제5조 (서비스의 중단)</h4>
              <p>1. 서비스 제공자는 서버 점검, 시스템 개선, 네트워크 장애 또는 호스팅 플랫폼의 긴급 장애 등이 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.<br/>
              2. 본 서비스는 무료 교육 지원 도구이므로, 일시적인 서비스 장애나 중단에 대해 어떠한 금전적 보상이나 책임도 지지 않습니다.</p>
              <br/>
              <h4>제6조 (이용 신청 및 만 14세 미만 아동의 동의)</h4>
              <p>1. 이용자는 서비스의 '윤리 핵심가이드' 내용을 정독하고 이에 동의함으로써 가입/로그인 없이 즉시 서비스를 이용할 수 있습니다.<br/>
              2. 만 14세 미만의 초등학생 아동이 본 서비스를 수업 외 개인적으로 지속 이용하는 경우, 교무실 또는 가정통신문 등을 통해 보호자(법정대리인)의 안내 및 동의 하에 지도받는 것을 권장합니다.</p>
              <br/>
              <h4>제7조 (이용자의 의무 및 윤리 가이드 준수)</h4>
              <p>1. 이용자는 서비스를 이용할 때 본 약관의 규정 및 서비스 화면에 제시된 '생성형 AI 윤리 핵심가이드' 6대 원칙을 성실히 준수하여야 합니다.<br/>
              - <strong>활용 목적</strong>: 단순히 내 생각을 회피하고 대신하게 하려는 것이 아니라, 학습을 돕는 보조 도구로 생각하고 활용합니다.<br/>
              - <strong>주도적 학습</strong>: 스스로 먼저 고민하고 나의 아이디어를 메모한 뒤에 도구를 사용합니다.<br/>
              - <strong>비판적 검증</strong>: 정보가 맞는지 비판적으로 재확인하고 검증합니다.<br/>
              - <strong>사고의 확장</strong>: 상상력을 넓히고 나만의 색깔을 더해 최종 결과물을 만듭니다.<br/>
              - <strong>안전과 관계</strong>: 이름, 주소, 연락처 등 개인정보나 사생활 비밀을 입력하지 않습니다.<br/>
              - <strong>투명성·윤리</strong>: 도움을 받은 부분을 숨기지 않고 투명하고 정직하게 이야기합니다.<br/>
              2. 이용자는 본 서비스의 무작위 추첨 기능을 조작하여 타인에게 불이익을 주거나 부정한 목적으로 이용해서는 안 되며, 공정하게 참여해야 합니다.</p>
              <br/>
              <h4>제8조 (책임의 제한)</h4>
              <p>1. 서비스 제공자는 본 서비스 내에 입력된 정보(학생 이름 등)의 무결성이나 보안에 대해 일체 관여하지 않으며, 해당 정보는 전적으로 이용자 로컬 기기 내 브라우저에서 제어됩니다.<br/>
              2. 서비스 제공자는 천재지변, 플랫폼 불가항력적 사유, 또는 이용자의 기기 설정 문제 등으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
              <br/>
              <h4>제9조 (분쟁의 해결)</h4>
              <p>본 서비스 이용과 관련하여 서비스 제공자와 이용자 간에 발생한 분쟁에 대해서는 대한민국의 관련 법령을 적용하며, 상호 성실히 소통하여 원만하게 해결하도록 합니다.</p>
              <br/>
              <p style={{ fontSize: '13px', opacity: 0.7 }}>시행일자: 본 약관은 2026년 6월 27일부터 적용됩니다.</p>
            </div>
          </div>
        </div>

        {/* 개인정보처리방침 모달 */}
        <div className={`modal-overlay ${isPrivacyOpen ? 'open' : ''}`} style={{ zIndex: 3000 }}>
          <div className="color-block-section navy secret-modal" style={{ maxWidth: '700px', width: '90%', maxHeight: '80vh', overflowY: 'auto', position: 'relative', textAlign: 'left', padding: 'var(--spacing-xl)' }}>
            <button className="close-btn" onClick={() => setIsPrivacyOpen(false)} style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>×</button>
            <h2>개인정보처리방침</h2>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: 'var(--spacing-md) 0' }} />
            <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p><strong>정영윤 교사 / 서울염리초등학교(이하 '본 서비스')은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.</strong></p>
              <br/>
              <h4>제1조 (개인정보의 처리 목적)</h4>
              <p>본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.<br/>
              - <strong>학습 활동 및 발표자 선정</strong>: 학급 구성원 이름을 입력하여 발표자를 공정하게 무작위로 추출 및 관리하기 위함입니다.<br/>
              - <strong>로컬 저장 기능</strong>: 이용자가 매번 명단을 입력하지 않도록 웹 브라우저의 로컬 스토리지(LocalStorage)에 학생 명단 정보를 유지하기 위함입니다.</p>
              <br/>
              <h4>제2조 (개인정보의 처리 및 보유기간)</h4>
              <p>1. 본 서비스는 서버나 데이터베이스(DB)를 사용하지 않는 클라이언트 사이드 웹 애플리케이션입니다. 따라서 정보주체의 어떠한 개인정보도 별도의 서버로 수집·전송·보관하지 않습니다.<br/>
              2. 개인정보의 보유 및 이용 기간은 다음과 같습니다.<br/>
              - <strong>보유 장소</strong>: 이용자의 웹 브라우저 로컬 스토리지(LocalStorage)<br/>
              - <strong>보유 기간</strong>: 이용자가 직접 브라우저 데이터를 삭제하거나, 웹앱 내 명단 관리 화면에서 학생 정보를 삭제할 때까지 보관됩니다.</p>
              <br/>
              <h4>제3조 (처리하는 개인정보 항목)</h4>
              <p>본 서비스는 발표자 추첨 기능을 제공하기 위해 필요한 최소한의 정보만을 처리하며, 별도의 회원가입 절차 없이 비회원제로 운영됩니다.<br/>
              - <strong>수집 및 처리 항목</strong>: 사용자가 직접 등록한 학생 이름(또는 닉네임)<br/>
              - <strong>수집하지 않는 항목</strong>: 주민등록번호, 주소, 이메일, 전화번호, 비밀번호 등 불필요한 민감 정보 및 식별 정보</p>
              <br/>
              <h4>제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)</h4>
              <p>1. 본 서비스는 서버로 개인정보를 수집하지 않고 브라우저 로컬에만 저장하므로 실제 가입이나 아동 정보의 외부 유출 위험이 없습니다.<br/>
              2. 다만, 초등학생(만 14세 미만)이 수업 또는 가정에서 본 서비스를 이용할 때에는 사전에 학교 가정통신문 또는 교사/보호자의 안내 및 지도 하에 안전하게 이용할 수 있도록 권장합니다.</p>
              <br/>
              <h4>제5조 (개인정보의 파기 절차 및 방법)</h4>
              <p>이용자가 입력한 모든 정보는 브라우저 내부 저장소에 기록되므로 아래와 같은 방법으로 즉시 영구 파기할 수 있습니다.<br/>
              - 웹앱 내 '명단 관리'에서 학생 이름 옆의 삭제 버튼(×)을 눌러 개별 삭제<br/>
              - 브라우저 쿠키 및 사이트 데이터(LocalStorage)를 초기화/삭제하여 전체 삭제</p>
              <br/>
              <h4>제6조 (개인정보의 안전성 확보조치)</h4>
              <p>본 서비스는 서버를 거치지 않고 이용자 개인의 기기(로컬 브라우저)에만 정보를 기록하므로 서버 해킹 등에 따른 유출 위험은 없으나, 로컬 데이터 보안을 위해 다음의 안전 조치를 취하고 있습니다.<br/>
              - <strong>통신 암호화</strong>: 전 구간 보안 통신(HTTPS) 환경에서 동작하여 데이터 전송 경로의 유출을 차단합니다.<br/>
              - <strong>정보 유출 방지</strong>: 백엔드 데이터베이스를 구축하지 않음으로써 데이터 대량 유출 위험을 근본적으로 방지합니다.</p>
              <br/>
              <h4>제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)</h4>
              <p>정보주체(학생) 및 법정대리인은 언제든지 브라우저 내 등록된 이름을 수정 또는 삭제함으로써 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 직접 행사할 수 있습니다.</p>
              <br/>
              <h4>제8조 (개인정보 보호책임자)</h4>
              <p>본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br/>
              - <strong>성명</strong>: 정영윤 (개발자)<br/>
              - <strong>소속</strong>: 서울염리초등학교<br/>
              - <strong>직위</strong>: 교사<br/>
              - <strong>연락처</strong>: 02-713-7513 (학교 교무실 내선 번호)<br/>
              * (※ 교사의 개인 휴대전화 번호 및 이메일 주소는 개인정보 보호를 위해 공개하지 않으며, 문의 사항은 학교 유선전화로 연락 바랍니다.)</p>
              <br/>
              <p style={{ fontSize: '13px', opacity: 0.7 }}>이 개인정보 처리방침은 2026년 6월 27일부터 적용됩니다.</p>
            </div>
          </div>
        </div>
      </>
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

      {/* Main Footer */}
      <footer style={{ 
        marginTop: 'var(--spacing-xl)', 
        padding: 'var(--spacing-md)', 
        textAlign: 'center', 
        fontSize: '14px', 
        color: 'rgba(0, 0, 0, 0.6)',
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontWeight: 700 }}>
          <button 
            onClick={() => setIsTermsOpen(true)} 
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '14px', color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            이용약관
          </button>
          <span style={{ color: 'var(--hairline)' }}>|</span>
          <button 
            onClick={() => setIsPrivacyOpen(true)} 
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '14px', color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            개인정보처리방침
          </button>
        </div>
        <div style={{ marginTop: '4px' }}>
          <span>© 2026 정영윤 (서울염리초등학교). All rights reserved.</span>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          <span>정보관리책임자: 정영윤 교사 | 문의: 02-713-7513</span>
        </div>
      </footer>

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

      {/* Modals rendering inside main */}
      {renderModals()}
    </>
  );
}

export default App;
