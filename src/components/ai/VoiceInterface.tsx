'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DaisyButton } from '@/components/ui/DaisyButton';
import { DaisyCard, DaisyCardBody, DaisyCardTitle } from '@/components/ui/DaisyCard';
import { DaisyBadge } from '@/components/ui/DaisyBadge';
import { DaisySlider } from '@/components/ui/DaisySlider';
import { DaisySwitch } from '@/components/ui/DaisySwitch';
import { CommunicationIcons, StatusIcons, ActionIcons, NavigationIcons } from '@/components/icons/IconLibrary';

// Voice interface configuration
interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  threshold: number;
  autoSend: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  voiceId: string;
}

interface VoiceInterfaceProps {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onSpeech: (text: string) => void;
  isEnabled?: boolean;
  className?: string;
}

// Supported languages for speech recognition
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' }
];

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscript,
  onSpeech,
  isEnabled = true,
  className = ''
}) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 3,
    threshold: 0.7,
    autoSend: false,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 1.0,
    voiceId: ''
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      setupSpeechRecognition();
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      loadVoices();
      
      // Load voices when they become available
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    };

  return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Setup speech recognition configuration
  const setupSpeechRecognition = useCallback(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = settings.continuous;
    recognition.interimResults = settings.interimResults;
    recognition.lang = settings.language;
    recognition.maxAlternatives = settings.maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript('');
      setConfidence(0);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setCurrentTranscript(fullTranscript);
      setConfidence(maxConfidence || 0.5);

      // Send transcript to parent component
      if (finalTranscript) {
        onTranscript(finalTranscript, true);
        if (settings.autoSend && maxConfidence >= settings.threshold) {
          // Auto-send if confidence threshold is met
          setTimeout(() => {
            setCurrentTranscript('');
          }, 1000);
        }
      } else if (interimTranscript) {
        onTranscript(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      // console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          setCurrentTranscript('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setCurrentTranscript('Microphone access denied or not available.');
          break;
        case 'not-allowed':
          setCurrentTranscript('Microphone permission denied.');
          break;
        default:
          setCurrentTranscript(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (settings.continuous && isListening) {
        // Restart if continuous mode is enabled
        setTimeout(() => startListening(), 100);
      }
    };
  }, [settings, isListening, onTranscript]);

  // Update recognition settings when they change
  useEffect(() => {
    setupSpeechRecognition();
  }, [setupSpeechRecognition]);

  // Load available voices
  const loadVoices = useCallback(() => {
    if (synthesisRef.current) {
      const voices = synthesisRef.current.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice if not already set
      if (!settings.voiceId && voices.length > 0) {
        const defaultVoice = voices.find(voice => voice.default) || voices[0];
        setSettings(prev => ({ ...prev, voiceId: defaultVoice.name }));
      }
    }
  }, [settings.voiceId]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported || !isEnabled) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      // console.error('Failed to start speech recognition:', error);
    }
  }, [isSupported, isEnabled]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Speak text using text-to-speech
  const speakText = useCallback((text: string) => {
    if (!synthesisRef.current || !text.trim()) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find and set the selected voice
    const selectedVoice = availableVoices.find(voice => voice.name === settings.voiceId);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Configure speech parameters
    utterance.rate = settings.speechRate;
    utterance.pitch = settings.speechPitch;
    utterance.volume = settings.speechVolume;

    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      // console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    synthesisRef.current.speak(utterance);
    onSpeech(text);
  }, [availableVoices, settings, onSpeech]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Update settings
  const updateSetting = useCallback((key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  if (!isSupported) {
    return (
      <DaisyCard className={className} >
  <DaisyCardBody className="p-4" >
  </DaisyCard>
</DaisyCardBody>
          <div className="text-center text-gray-500">
            <StatusIcons.XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Voice interface is not supported in this browser</p>
          </div>
        </DaisyCardBody>
      </DaisyCard>
    );
  };

  return (
    <DaisyCard className={className} >
  <DaisyCardBody className="pb-3" >
</DaisyCard>
        <div className="flex items-center justify-between">
          <DaisyCardTitle className="text-lg font-semibold flex items-center space-x-2" >
  <CommunicationIcons.Bell className="h-5 w-5" />
</DaisyCardTitle>
            <span>Voice Interface</span>
          </DaisyCardTitle>
          <div className="flex items-center space-x-2">
            <DaisyBadge variant={isListening ? 'destructive' : 'secondary'} >
  {isListening ? 'Listening' : 'Ready'}
</DaisyBadge>
            </DaisyBadge>
            <DaisyButton
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)} />
              <ActionIcons.Settings className="h-4 w-4" />
            </DaisyButton>
          </div>
        </div>
      

      <DaisyCardBody className="space-y-4" >
  {/* Main controls */}
</DaisyCardBody>
        <div className="flex items-center space-x-4">
          <DaisyButton
            onClick={toggleListening}
            disabled={!isEnabled}
            variant={isListening ? 'destructive' : 'default'}
            className="flex-1">
          {isListening ? (

        </DaisyButton>
              <>
                <CommunicationIcons.MicrophoneOff className="h-4 w-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <CommunicationIcons.Microphone className="h-4 w-4 mr-2" />
                Start Listening
              </>
            )}
          </DaisyButton>

          {isSpeaking && (
            <DaisyButton
              onClick={stopSpeaking}
              variant="outline"
              className="flex-1" >
  <StatusIcons.X className="h-4 w-4 mr-2" />
</DaisyButton>
              Stop Speaking
            </DaisyButton>
          )}
        </div>

        {/* Current transcript */}
        {currentTranscript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Transcript:</span>
              {confidence > 0 && (
                <DaisyBadge variant="outline" className="text-xs" >
  {Math.round(confidence * 100)}% confident
</DaisyBadge>
                </DaisyBadge>
              )}
            </div>
            <p className="text-sm text-gray-700">{currentTranscript}</p>
          </div>
        )}

        {/* Language selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Language:</span>
          <select
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="flex-1 p-2 border rounded-md text-sm"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Expanded settings */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Recognition settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recognition Settings</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Continuous listening</span>
                <DaisySwitch
                  checked={settings.continuous}
                  onCheckedChange={(checked) = />
updateSetting('continuous', checked)} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Show interim results</span>
                <DaisySwitch
                  checked={settings.interimResults}
                  onCheckedChange={(checked) = />
updateSetting('interimResults', checked)} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-send on confidence</span>
                <DaisySwitch
                  checked={settings.autoSend}
                  onCheckedChange={(checked) = />
updateSetting('autoSend', checked)} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence threshold</span>
                  <span className="text-sm text-gray-500">{Math.round(settings.threshold * 100)}%</span>
                </div>
                <DaisySlider
                  value={[settings.threshold]}
                  onValueChange={([value]) => updateSetting('threshold', value)}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  className="w-full" />
              </div>
            </div>

            {/* Speech synthesis settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Speech Settings</h4>
              
              <div className="space-y-2">
                <span className="text-sm">Voice</span>
                <select
                  value={settings.voiceId}
                  onChange={(e) => updateSetting('voiceId', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  {availableVoices
                    .filter(voice => voice.lang.startsWith(settings.language.split('-')[0]))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Speech rate</span>
                  <span className="text-sm text-gray-500">{settings.speechRate.toFixed(1)}x</span>
                </div>
                <DaisySlider
                  value={[settings.speechRate]}
                  onValueChange={([value]) => updateSetting('speechRate', value)}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  className="w-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pitch</span>
                  <span className="text-sm text-gray-500">{settings.speechPitch.toFixed(1)}</span>
                </div>
                <DaisySlider
                  value={[settings.speechPitch]}
                  onValueChange={([value]) => updateSetting('speechPitch', value)}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  className="w-full" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Volume</span>
                  <span className="text-sm text-gray-500">{Math.round(settings.speechVolume * 100)}%</span>
                </div>
                <DaisySlider
                  value={[settings.speechVolume]}
                  onValueChange={([value]) => updateSetting('speechVolume', value)}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full" />
              </div>

              {/* Test speech */}
              <DaisyButton
                onClick={() => speakText('Hello! This is a test of the voice interface.')}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isSpeaking} />
                <CommunicationIcons.Volume className="h-4 w-4 mr-2" />
                Test Voice
              </DaisySwitch>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              <span>Microphone</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
              <span>Speaker</span>
            </div>
          </div>
          <span>Voice AI Ready</span>
        </div>
      </DaisyCardBody>
    </DaisyCard>
  );
};