import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Info, Users, Link, Check, Lock } from 'lucide-react';
import TimeGrid from '../components/TimeGrid';
import { supabase } from '../lib/supabaseClient';

export default function Room({ session }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // 패스워드 인증 로직 (대시보드를 거치지 않고 다이렉트 링크로 온 경우 보호)
  const [isVerified, setIsVerified] = useState(location.state?.verified || false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const hasSubmitted = schedules.some(s => s.user_id === session?.user?.id);

  const fetchSchedules = async () => {
    const { data: scheduleData } = await supabase
      .from('schedules')
      .select('*')
      .eq('room_id', roomId);
      
    if (scheduleData) setSchedules(scheduleData);
  };

  useEffect(() => {
    // 1. 방 정보 로드
    const fetchRoomData = async () => {
      try {
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) throw new Error('방을 찾을 수 없습니다.');
        setRoom(roomData);
        
        // 2. 스케줄 로드
        await fetchSchedules();
      } catch (err) {
        alert(err.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();

    // 3. 실시간 업데이트 구독
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules', filter: `room_id=eq.${roomId}` }, (payload) => {
        // 스케줄 변경 시 전체 최신화
        supabase.from('schedules').select('*').eq('room_id', roomId).then(({ data }) => {
          if (data) setSchedules(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, navigate]);

  const copyRoomLink = () => {
    // 현재 URL(도메인/room/UUID)을 복사하여 공유하기 쉽게 만듭니다.
    const inviteLink = window.location.origin + `/room/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyPasswordAndEnter = () => {
    if (inputPassword === room.password) {
      setIsVerified(true);
      setPasswordError('');
    } else {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // 아직 비밀번호를 입력하지 않은 공유 링크 접속자용 화면
  if (!isVerified && room) {
    return (
      <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px' }}>
        <div className="glass-panel" style={{ padding: '48px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <Lock size={48} color="var(--primary)" style={{ marginBottom: '24px' }} />
          <h2 style={{ marginBottom: '8px' }}>비공개 방 잠금 해제</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            [{room.name}] 방에 참가하려면 비밀번호를 입력해주세요.
          </p>
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <input 
              type="password" 
              className="input-field" 
              value={inputPassword} 
              onChange={e => setInputPassword(e.target.value)} 
              placeholder="방 비밀번호" 
              onKeyDown={e => e.key === 'Enter' && verifyPasswordAndEnter()}
            />
            {passwordError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '8px' }}>{passwordError}</p>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ flex: 1 }}>취소</button>
            <button onClick={verifyPasswordAndEnter} className="btn btn-primary" style={{ flex: 1 }}>입장하기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ margin: 0, flex: 1, wordBreak: 'keep-all' }}>{room.name}</h1>
        <button onClick={copyRoomLink} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          {copied ? <Check size={16} color="var(--accent)" /> : <Link size={16} />} 
          {copied ? '복사됨!' : '초대 링크 복사'}
        </button>
      </header>

      {room.notice && (
        <div className="glass-panel" style={{ 
          padding: '16px 20px', 
          marginBottom: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          borderLeft: '4px solid var(--accent)'
        }}>
          <Info size={20} color="var(--accent)" />
          <p style={{ margin: 0, fontWeight: 500 }}>{room.notice}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '32px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 style={{ marginBottom: '8px' }}>가능한 시간 선택 (드래그)</h2>
          {!hasSubmitted && (
             <p style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 500 }}>
               ✨ 내 일정을 먼저 제출해야 다른 사람들의 시간표 흐름(히트맵)을 볼 수 있습니다!
             </p>
          )}
          <TimeGrid 
            roomId={roomId} 
            session={session} 
            allSchedules={schedules}
            hasSubmitted={hasSubmitted}
            onSaveSuccess={fetchSchedules}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> 참여자 목록 ({new Set(schedules.map(s => s.user_id)).size || 0}명)
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {schedules.map((sched) => (
                <li key={sched.id} style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid var(--grid-border)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '12px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', 
                      borderRadius: '50%', 
                      background: sched.user_id === session.user.id ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'var(--input-bg)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: 'white', fontWeight: 'bold', fontSize: '0.8rem'
                    }}>
                      {sched.user_name.substring(0, 1).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: sched.user_id === session.user.id ? 'bold' : 'normal', color: sched.user_id === session.user.id ? 'var(--primary)' : 'var(--text-primary)'}}>
                      {sched.user_name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                     {sched.selected_slots.length}시간
                  </span>
                </li>
              ))}
              {schedules.filter(s => s.user_id === session.user.id).length === 0 && (
                 <li style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)' }}>
                   시간표를 제출하여 참여하세요!
                 </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
