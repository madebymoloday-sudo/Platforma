import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Square, 
  MessageCircle, Send, X, Copy, Check,
  FileText, Bot
} from 'lucide-react';

interface Conference {
  id: string;
  link: string;
  title?: string;
  createdBy: string;
  participants: Array<{
    id: string;
    userId: string;
    isMuted: boolean;
    isVideoOff: boolean;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

interface ConferenceMessage {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ConferenceSummary {
  id?: string;
  autoSummary?: string;
  manualSummary?: string;
  date: string;
}

export default function Conference({ conferenceId, onClose }: { conferenceId: string; onClose: () => void }) {
  const [conference, setConference] = useState<Conference | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [blurBackground, setBlurBackground] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ConferenceMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<ConferenceSummary | null>(null);
  const [manualSummary, setManualSummary] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [reactions, setReactions] = useState<Map<string, string>>(new Map());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { user } = useAuthStore();

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    loadConference();
    initializeSocket();
    startLocalStream();

    return () => {
      cleanup();
    };
  }, [conferenceId]);

  const loadConference = async () => {
    try {
      const response = await api.get(`/conference/${conferenceId}`);
      setConference(response.data);
      
      const messagesRes = await api.get(`/conference/${conferenceId}/messages`);
      setMessages(messagesRes.data);
      
      const summaryRes = await api.get(`/conference/${conferenceId}/summary`);
      if (summaryRes.data.id) {
        setSummary(summaryRes.data);
        setManualSummary(summaryRes.data.manualSummary || '');
      }
    } catch (error) {
      console.error('Error loading conference:', error);
    }
  };

  const initializeSocket = () => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001');
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('conference-join', { conferenceId, userId: user?.id });

    socket.on('user-joined', async (data: { userId: string }) => {
      if (data.userId !== user?.id) {
        await createOffer(data.userId);
      }
    });

    socket.on('user-left', (data: { userId: string }) => {
      peerConnectionsRef.current.get(data.userId)?.close();
      peerConnectionsRef.current.delete(data.userId);
      remoteStreams.delete(data.userId);
      setRemoteStreams(new Map(remoteStreams));
    });

    socket.on('conference-offer', async (data: { offer: RTCSessionDescriptionInit; fromId: string }) => {
      await handleOffer(data.offer, data.fromId);
    });

    socket.on('conference-answer', async (data: { answer: RTCSessionDescriptionInit; fromId: string }) => {
      await handleAnswer(data.answer, data.fromId);
    });

    socket.on('conference-ice-candidate', async (data: { candidate: RTCIceCandidateInit; fromId: string }) => {
      await handleIceCandidate(data.candidate, data.fromId);
    });

    socket.on('conference-reaction', (data: { userId: string; reaction: string }) => {
      setReactions(prev => new Map(prev).set(data.userId, data.reaction));
      setTimeout(() => {
        setReactions(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }, 3000);
    });
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = (userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(configuration);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStreams(prev => new Map(prev).set(userId, stream));
      
      setTimeout(() => {
        const video = remoteVideosRef.current.get(userId);
        if (video) {
          video.srcObject = stream;
        }
      }, 100);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('conference-ice-candidate', {
          conferenceId,
          candidate: event.candidate,
          targetId: userId,
          fromId: user?.id
        });
      }
    };

    return pc;
  };

  const createOffer = async (userId: string) => {
    const pc = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socketRef.current) {
      socketRef.current.emit('conference-offer', {
        conferenceId,
        offer,
        targetId: userId,
        fromId: user?.id
      });
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, fromId: string) => {
    const pc = createPeerConnection(fromId);
    peerConnectionsRef.current.set(fromId, pc);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('conference-answer', {
        conferenceId,
        answer,
        targetId: fromId,
        fromId: user?.id
      });
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit, fromId: string) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit, fromId: string) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const toggleMute = async () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      await api.put(`/conference/${conferenceId}/participant`, { isMuted: !isMuted });
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
      await api.put(`/conference/${conferenceId}/participant`, { isVideoOff: !isVideoOff });
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        if (localStream) {
          const sender = peerConnectionsRef.current.values().next().value?.getSenders()
            .find((s: RTCRtpSender) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        videoTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnectionsRef.current.values().next().value?.getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
      setIsScreenSharing(false);
    }
  };

  const startRecording = async () => {
    if (localStream) {
      const recorder = new MediaRecorder(localStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conference-${conferenceId}-${Date.now()}.webm`;
        a.click();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post(`/conference/${conferenceId}/messages`, {
        content: newMessage,
        type: 'text'
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendReaction = (reaction: string) => {
    if (socketRef.current) {
      socketRef.current.emit('conference-reaction', {
        conferenceId,
        reaction,
        userId: user?.id
      });
    }
  };

  const copyLink = () => {
    if (conference) {
      const link = `${window.location.origin}/conference/${conference.link}`;
      navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const generateAutoSummary = async () => {
    try {
      const response = await api.post(`/conference/${conferenceId}/summary/auto`);
      setSummary(response.data);
      loadConference();
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const saveManualSummary = async () => {
    try {
      await api.put(`/conference/${conferenceId}/summary/manual`, {
        manualSummary
      });
      alert('Резюме сохранено');
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    if (socketRef.current) {
      socketRef.current.emit('conference-leave', { conferenceId, userId: user?.id });
      socketRef.current.disconnect();
    }
    if (mediaRecorderRef.current) {
      stopRecording();
    }
  };

  const reactionsList = ['👍', '👎', '❤️', '😂', '😮', '👏', '🔥'];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10000
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        background: '#2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: 'white', margin: 0 }}>{conference?.title || 'Видеоконференция'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <button
              onClick={copyLink}
              style={{
                padding: '6px 12px',
                background: '#3a3a3a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {linkCopied ? <Check size={14} /> : <Copy size={14} />}
              {linkCopied ? 'Скопировано' : 'Скопировать ссылку'}
            </button>
            <span style={{ color: '#999', fontSize: '12px' }}>
              {conference?.participants.length || 0} участников
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: remoteStreams.size > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
          gap: '16px',
          padding: '16px',
          overflow: 'auto'
        }}>
          {/* Local video */}
          <div style={{
            position: 'relative',
            background: '#2a2a2a',
            borderRadius: '12px',
            overflow: 'hidden',
            aspectRatio: '16/9'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: blurBackground ? 'blur(15px) brightness(0.7)' : 'none',
                transition: 'filter 0.3s'
              }}
            />
            {blurBackground && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px'
              }}>
                {user?.name}
              </div>
            )}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {user?.name} (Вы)
            </div>
            {reactions.get(user?.id || '') && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '48px',
                pointerEvents: 'none'
              }}>
                {reactions.get(user?.id || '')}
              </div>
            )}
          </div>

          {/* Remote videos */}
          {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
            const participant = conference?.participants.find(p => p.userId === userId);
            return (
              <div
                key={userId}
                style={{
                  position: 'relative',
                  background: '#2a2a2a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  aspectRatio: '16/9'
                }}
              >
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideosRef.current.set(userId, el);
                      el.srcObject = stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {participant?.user.name}
                </div>
                {reactions.get(userId) && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '48px',
                    pointerEvents: 'none'
                  }}>
                    {reactions.get(userId)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div style={{
            width: '350px',
            background: '#2a2a2a',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #3a3a3a'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #3a3a3a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: 'white', margin: 0 }}>Чат</h3>
              <button
                onClick={() => setShowSummary(!showSummary)}
                style={{
                  padding: '6px 12px',
                  background: '#3a3a3a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <FileText size={14} />
              </button>
            </div>

            {showSummary ? (
              <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={generateAutoSummary}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Bot size={16} />
                    Создать резюме (бот)
                  </button>
                </div>

                {summary?.autoSummary && (
                  <div style={{
                    padding: '12px',
                    background: '#3a3a3a',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>
                      Автоматическое резюме:
                    </div>
                    <div style={{ color: 'white', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                      {summary.autoSummary}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ color: 'white', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Ручное резюме:
                  </label>
                  <textarea
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                    placeholder="Заполните резюме встречи..."
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: '12px',
                      background: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    onClick={saveManualSummary}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    Сохранить резюме
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: '12px',
                        padding: '8px',
                        background: msg.user.id === user?.id ? '#6366f1' : '#3a3a3a',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>
                        {msg.user.name}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: '16px',
                  borderTop: '1px solid #3a3a3a',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Написать сообщение..."
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    style={{
                      padding: '10px',
                      background: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        padding: '16px',
        background: '#2a2a2a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={toggleMute}
          style={{
            padding: '12px',
            background: isMuted ? '#ef4444' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            padding: '12px',
            background: isVideoOff ? '#ef4444' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          onClick={() => setBlurBackground(!blurBackground)}
          style={{
            padding: '12px',
            background: blurBackground ? '#6366f1' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Размыть фон"
        >
          🎨
        </button>

        <button
          onClick={toggleScreenShare}
          style={{
            padding: '12px',
            background: isScreenSharing ? '#6366f1' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Демонстрация экрана"
        >
          <Monitor size={20} />
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: '12px',
            background: isRecording ? '#ef4444' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Запись"
        >
          {isRecording ? <Square size={20} /> : '🔴'}
        </button>

        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: '#3a3a3a',
          borderRadius: '24px'
        }}>
          {reactionsList.map((reaction) => (
            <button
              key={reaction}
              onClick={() => sendReaction(reaction)}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              {reaction}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            padding: '12px',
            background: showChat ? '#6366f1' : '#3a3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MessageCircle size={20} />
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '12px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
