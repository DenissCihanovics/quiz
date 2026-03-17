import React, { useState } from 'react';
import { getRoomByCode } from '../../services/RoomServices';

const JoinRoom = ({ onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Ievades validācija
    if (!roomCode.trim() || !studentName.trim()) {
      setError('Lūdzu, ievadiet istabas kodu un savu vārdu');
      return;
    }
    
    try {
      const room = await getRoomByCode(roomCode);
      
      if (!room) {
        setError('Istaba nav atrasta vai nav aktīva. Lūdzu, pārbaudiet kodu un mēģiniet vēlreiz.');
        return;
      }
      
      onJoinRoom(room.id, room.testId, studentName);
    } catch (error) {
      console.error('Kļūda, pieslēdzoties istabai:', error);
      setError('Radās kļūda, pieslēdzoties istabai. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  return (
    <div className="join-room">
      <h2>Pievienoties testam</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Istabas kods:</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Ievadiet 5 ciparu kodu"
            maxLength="5"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Jūsu vārds:</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Ievadiet savu vārdu"
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" className="join-btn">
          Pievienoties testam
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;
