import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  
  // Create Room State
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join Room State
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // My Rooms State
  const [myRooms, setMyRooms] = useState([]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchMyRooms = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, name, created_at')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setMyRooms(data);
    };
    fetchMyRooms();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          { 
            name: roomName, 
            password: password, 
            notice: notice,
            creator_id: session.user.id
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // 생성된 방은 내가 만든것이므로 바로 인가 처리
      navigate(`/room/${data.id}`, { state: { verified: true } });
    } catch (error) {
      alert('방 생성에 실패했습니다: ' + error.message);
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setJoinError('');
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, password')
        .eq('id', joinCode)
        .single();
        
      if (error) throw new Error('방을 찾을 수 없습니다. 참여 코드를 확인해주세요.');
      
      if (data.password !== joinPassword) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }
      
      // 비밀번호 일치시 인가 상태를 들고 이동
      navigate(`/room/${data.id}`, { state: { verified: true } });
    } catch (error) {
      setJoinError(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>timeMatch</span> Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>환영합니다, {session?.user?.user_metadata?.full_name || session?.user?.email}님</p>
        </div>
        <button onClick={handleSignOut} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <LogOut size={16} /> 로그아웃
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '8px', display: 'flex', borderRadius: 'var(--border-radius-lg)', marginBottom: '24px' }}>
          <button 
            className={`btn ${activeTab === 'create' ? 'btn-primary' : ''}`}
            style={{ flex: 1, background: activeTab === 'create' ? '' : 'transparent', boxShadow: 'none' }}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={18} /> 새 일정 만들기
          </button>
          <button 
            className={`btn ${activeTab === 'join' ? 'btn-primary' : ''}`}
            style={{ flex: 1, background: activeTab === 'join' ? '' : 'transparent', boxShadow: 'none' }}
            onClick={() => setActiveTab('join')}
          >
            <LogIn size={18} /> 코드로 참여하기
          </button>
        </div>

        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom} className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>방 생성</h2>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">방 이름</label>
              <input type="text" className="input-field" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="예: 팀 프로젝트 회의 조율" required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">출입 비밀번호</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} placeholder="참여자가 입장할 때 사용할 비밀번호" required />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label className="input-label">공지사항 (옵션)</label>
              <input type="text" className="input-field" value={notice} onChange={e => setNotice(e.target.value)} placeholder="캘린더 화면 상단에 표시될 짧은 문구" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isCreating}>
              {isCreating ? '생성 중...' : '방 만들기'}
            </button>
            <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
              💡 무분별한 낭비를 막기 위해, <strong style={{color: 'var(--danger)'}}>2주 동안 아무도 일정을 수정하거나 새로 접속하지 않는 방은 자동으로 삭제</strong>됩니다.
            </p>
          </form>
        )}

        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom} className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>방 참여</h2>
            {joinError && (
              <div style={{ padding: '12px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--border-radius-sm)' }}>
                {joinError}
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">참여 코드 (Room ID, 생성 시 URL 참고)</label>
              <input type="text" className="input-field" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="예: 123e4567-e89b-12d3... (UUID)" required />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label className="input-label">비밀번호</label>
              <input type="password" className="input-field" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} placeholder="방 비밀번호 입력" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isJoining}>
               {isJoining ? '입장 중...' : '입장하기'}
            </button>
          </form>
        )}

        {/* 내가 만든 방 목록 표출 영역 */}
        {myRooms.length > 0 && (
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', marginTop: '8px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>내가 만든 일정 방</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {myRooms.map(room => (
                <li key={room.id} style={{ 
                  padding: '16px 0', 
                  borderBottom: '1px solid var(--grid-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {room.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(room.created_at).toLocaleDateString()} 생성됨
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/room/${room.id}`, { state: { verified: true } })}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem', flexShrink: 0 }}
                  >
                    바로 입장
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
