import React, { useState, useEffect, useCallback } from 'react';
import TestCreator from './TestCreator';
import RoomCreator from './RoomCreator';
import Results from './Results';
import Statistics from './Statistics';
import { getAllRooms } from '../../services/RoomServices';
import { getAllTests } from '../../services/testService';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [currentTestId, setCurrentTestId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [tests, setTests] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchRoomsAndTests = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const [roomsData, testsData] = await Promise.all([
        getAllRooms(),
        getAllTests()
      ]);
      setRooms(roomsData || []);
      setTests(testsData || []);
    } catch (err) {
      console.error('Neizdevās ielādēt istabas:', err);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRoomsAndTests();
  }, [fetchRoomsAndTests]);

  const getTestTitle = (testId) => {
    const t = tests.find((item) => item.id === testId);
    return t ? t.title : testId;
  };

  const handleTestCreated = (testId) => {
    setCurrentTestId(testId);
    setActiveTab('room');
    fetchRoomsAndTests();
  };

  const handleRoomCreated = (roomId, code) => {
    setCurrentRoomId(roomId);
    setRoomCode(code);
    setActiveTab('results');
    fetchRoomsAndTests();
  };

  const handleSelectRoom = (e) => {
    const roomId = e.target.value;
    if (!roomId) {
      setCurrentRoomId(null);
      setRoomCode(null);
      return;
    }
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      setCurrentRoomId(room.id);
      setRoomCode(room.code);
    }
  };

  const showRoomSelector = (activeTab === 'results' || activeTab === 'statistics') && rooms.length > 0;

  return (
    <div className="teacher-dashboard">
      <div className="tabs">
        <button 
          className={activeTab === 'create' ? 'active' : ''} 
          onClick={() => setActiveTab('create')}
        >
          Izveidot testu
        </button>
        <button 
          className={activeTab === 'room' ? 'active' : ''}
          onClick={() => setActiveTab('room')}
          disabled={!currentTestId}
        >
          Izveidot istabu
        </button>
        <button 
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
        >
          Rezultāti
        </button>
        <button 
          className={activeTab === 'statistics' ? 'active' : ''}
          onClick={() => setActiveTab('statistics')}
        >
          Statistika
        </button>
      </div>

      {showRoomSelector && (
        <div className="room-selector">
          <label htmlFor="room-select">Izvēlieties istabu:</label>
          <select
            id="room-select"
            value={currentRoomId || ''}
            onChange={handleSelectRoom}
          >
            <option value="">— Izvēlieties —</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} — {getTestTitle(room.testId)}
                {room.active ? '' : ' (neaktīva)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="tab-content">
        {activeTab === 'create' && (
          <TestCreator onTestCreated={handleTestCreated} />
        )}
        {activeTab === 'room' && (
          <RoomCreator testId={currentTestId} onRoomCreated={handleRoomCreated} />
        )}
        {activeTab === 'results' && (
          currentRoomId
            ? <Results roomId={currentRoomId} roomCode={roomCode} />
            : !loadingRooms && <div className="empty-state">Izvēlieties istabu, lai skatītu rezultātus.</div>
        )}
        {activeTab === 'statistics' && (
          currentRoomId
            ? <Statistics roomId={currentRoomId} roomCode={roomCode} />
            : !loadingRooms && <div className="empty-state">Izvēlieties istabu, lai skatītu statistiku.</div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
