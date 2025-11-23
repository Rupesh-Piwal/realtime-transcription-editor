// client/src/components/DeviceSelector.tsx
import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

interface DeviceSelectorProps {
  onDeviceSelect: (deviceId: string) => void;
  disabled: boolean;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ onDeviceSelect, disabled }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        // Request permission to access media devices, which is necessary to get device labels.
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = allDevices.filter(device => device.kind === 'audioinput');
        setDevices(audioDevices);
        if (audioDevices.length > 0) {
          // Set a default device
          const defaultDevice = audioDevices[0].deviceId;
          setSelectedDevice(defaultDevice);
          onDeviceSelect(defaultDevice);
        }
      } catch (error) {
        console.error("Error enumerating audio devices:", error);
        // You might want to show an error message to the user here
      }
    };

    getAudioDevices();
  }, [onDeviceSelect]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = event.target.value;
    setSelectedDevice(deviceId);
    onDeviceSelect(deviceId);
  };

  if (devices.length === 0) {
    return <div><Mic size={16} /> Loading audio devices...</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label htmlFor="device-selector"><Mic size={18} /></label>
      <select 
        id="device-selector"
        className="select"
        value={selectedDevice} 
        onChange={handleChange}
        disabled={disabled}
      >
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${devices.indexOf(device) + 1}`}
          </option>
        ))}
      </select>
    </div>
  );
};
