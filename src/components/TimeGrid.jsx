import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const START_HOUR = 8;
const END_HOUR = 23;
const displayHours = HOURS.filter(h => h >= START_HOUR && h <= END_HOUR);

export default function TimeGrid({ roomId, session, allSchedules, hasSubmitted }) {
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myUserId = session?.user?.id;

  // 컴포넌트 마운트 및 allSchedules 변경 시 내 시간표 동기화
  useEffect(() => {
    const mySchedule = allSchedules.find(s => s.user_id === myUserId);
    if (mySchedule && mySchedule.selected_slots) {
      setSelectedSlots(new Set(mySchedule.selected_slots));
    }
  }, [allSchedules, myUserId]);

  const getSlotId = (day, hour) => `${day}-${hour}`;

  // 히트맵 계산 로직 (나를 포함한 모든 사람의 스택량)
  const heatmapData = useMemo(() => {
    const counts = {};
    allSchedules.forEach(sched => {
      sched.selected_slots.forEach(slot => {
        counts[slot] = (counts[slot] || 0) + 1;
      });
    });
    return counts;
  }, [allSchedules]);

  const totalParticipants = allSchedules.length || 1;

  const handleMouseDown = (day, hour) => {
    setIsDragging(true);
    const slotId = getSlotId(day, hour);
    const isCurrentlySelected = selectedSlots.has(slotId);
    
    const mode = isCurrentlySelected ? 'deselect' : 'select';
    setDragMode(mode);
    toggleSlot(slotId, mode);
  };

  const handleMouseEnter = (day, hour) => {
    if (!isDragging) return;
    const slotId = getSlotId(day, hour);
    toggleSlot(slotId, dragMode);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const toggleSlot = (id, mode) => {
    setSelectedSlots(prev => {
      const next = new Set(prev);
      if (mode === 'select') {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selectedArray = Array.from(selectedSlots);
      const userName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];

      const { data: existing } = await supabase
        .from('schedules')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', myUserId)
        .single();

      if (existing) {
        // Update
        await supabase
          .from('schedules')
          .update({ selected_slots: selectedArray, updated_at: new Date() })
          .eq('id', existing.id);
      } else {
        // Insert
        await supabase
          .from('schedules')
          .insert([{
            room_id: roomId,
            user_id: myUserId,
            user_name: userName,
            selected_slots: selectedArray
          }]);
      }
      
      alert('시간이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 색상 농도 계산 (0 ~ 1)
  const getBackgroundColor = (slotId, isSelectedByMe) => {
    const count = heatmapData[slotId] || 0;
    
    // 내가 현재 드래그 중인 로컬 상태의 선택은 별도로 시각화
    // 히트맵 시각화 (남들이 선택한 정보)
    // 🎲 내 스케줄을 안 냈으면 남의 정보도 안 보여주는 로직 적용!
    if (!hasSubmitted && !isSelectedByMe) return 'var(--grid-bg-empty)';
    
    if (count === 0 && !isSelectedByMe) return 'var(--grid-bg-empty)';
    
    // 타인이 선택한 개수에 따라 투명도 조절
    const intensity = Math.min(count / totalParticipants, 1);
    
    if (isSelectedByMe) {
      // 내 선택은 항상 가장 또렷한 색이 베이스가 되도록
      return `rgba(99, 102, 241, ${0.4 + (0.6 * intensity)})`;
    } else {
      // 타인만 선택했을 경우 에메랄드/민트 톤으로 표시
      return `rgba(6, 182, 212, ${0.1 + (0.9 * intensity)})`;
    }
  };

  return (
    <div style={{ width: '100%', userSelect: 'none', overflowX: 'auto' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--grid-border)', paddingBottom: '8px', minWidth: '400px' }}>
        <div style={{ width: '60px', flexShrink: 0 }}></div>
        {DAYS.map(day => (
          <div key={day} style={{ flex: 1, textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {day}
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: '400px' }}>
        {displayHours.map(hour => (
          <div key={hour} style={{ display: 'flex' }}>
            <div style={{ 
              width: '60px', 
              flexShrink: 0, 
              textAlign: 'right', 
              paddingRight: '12px', 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              borderRight: '1px solid var(--grid-border)'
            }}>
              {String(hour).padStart(2, '0')}:00
            </div>
            
            {DAYS.map(day => {
              const slotId = getSlotId(day, hour);
              const isSelectedByMe = selectedSlots.has(slotId);
              const count = heatmapData[slotId] || 0;
              
              return (
                <div
                  key={slotId}
                  onMouseDown={() => handleMouseDown(day, hour)}
                  onMouseEnter={() => handleMouseEnter(day, hour)}
                  title={`${day} ${hour}시 (선택: ${count}명)`}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRight: '1px solid var(--grid-border)',
                    borderBottom: '1px solid var(--grid-border)',
                    backgroundColor: getBackgroundColor(slotId, isSelectedByMe),
                    transition: 'background-color 0.15s ease, transform 0.05s ease',
                    transform: isSelectedByMe ? 'scale(0.95)' : 'scale(1)',
                    borderRadius: isSelectedByMe ? '4px' : '0',
                    cursor: 'pointer',
                    margin: isSelectedByMe ? '2px' : '0',
                    boxShadow: isSelectedByMe ? '0 0 0 1px var(--primary)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* 여러 명이 선택한 시간엔 숫자로 표기하여 가시성 강화 (제출한 이후에만 제공) */}
                  {count > 0 && !isSelectedByMe && hasSubmitted && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>{count}</span>}
                  {count > 0 && isSelectedByMe && totalParticipants > 1 && hasSubmitted && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>{count}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--grid-bg-selected)', borderRadius: '2px' }}></div>
            내 선택
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
             <div style={{ width: '12px', height: '12px', background: 'rgba(6, 182, 212, 0.8)', borderRadius: '2px' }}></div>
            타인 일치 (히트맵)
          </div>
        </div>
        
        <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? '저장 중...' : `내 시간 제출하기 (${selectedSlots.size}시간)`}
        </button>
      </div>
    </div>
  );
}
