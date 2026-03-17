import React, { useState } from 'react';
import { createRoom, activateRoom } from '../../services/RoomServices';

const RoomCreator = ({ testId, onRoomCreated }) => {
  const [roomData, setRoomData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const handleCreateRoom = async () => {
    try {
      console.log('Izveidojam istabu testam ar ID:', testId);

      if (!testId) {
        alert('Kļūda: testa ID nav norādīts. Lūdzu, vispirms izveidojiet testu.');
        return;
      }

      const { id, code } = await createRoom(testId);
      console.log('Istaba izveidota ar ID:', id, 'un kodu:', code);

      setRoomData({ id, code });
      alert(`Istaba izveidota! Istabas kods: ${code}`);
    } catch (error) {
      console.error('Kļūda izveidojot istabu:', error);
      alert('Neizdevās izveidot istabu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  const handleStartTest = async () => {
    try {
      await activateRoom(roomData.id);
      setIsStarted(true);
      alert('Tests ir sākts! Skolēni tagad var pievienoties.');
      onRoomCreated(roomData.id, roomData.code);
    } catch (error) {
      console.error('Kļūda sākot testu:', error);
      alert('Neizdevās sākt testu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  React.useEffect(() => {
    console.log('RoomCreator ielādēts ar testId:', testId);
  }, [testId]);

  return (
    <div className="room-creator">
      <h2>Izveidot testam istabu</h2>
      <p>Noklikšķiniet uz pogas zemāk, lai ģenerētu istabas kodu. Skolēni izmantos šo kodu, lai pievienotos testam.</p>

      {!roomData ? (
        <button onClick={handleCreateRoom} className="create-room-btn">
          Ģenerēt istabas kodu
        </button>
      ) : (
        <div className="room-info">
          <h3>Istabas kods: <span className="room-code">{roomData.code}</span></h3>
          <p>Dalieties ar šo kodu ar skolēniem, lai viņi varētu pievienoties testam.</p>

          {!isStarted && (
            <button onClick={handleStartTest} className="start-test-btn">
              Sākt testu
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomCreator;
