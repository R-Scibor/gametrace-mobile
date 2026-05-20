import { useState } from 'react';
import {
    useAudioRecorder,
    RecordingPresets,
    AudioModule,
    setAudioModeAsync,
} from 'expo-audio';

export function useVoiceRecord() {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [isRecording, setIsRecording] = useState(false);

    const start = async () => {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
            throw new Error('PERMISSION_DENIED');
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
    };

    const stop = async (): Promise<string> => {
        await recorder.stop();
        setIsRecording(false);
        const uri = recorder.uri;
        if (!uri) throw new Error('NO_RECORDING_URI');
        return uri;
    };

    return { isRecording, start, stop };
}
