import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Plus, Send, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { io, Socket } from 'socket.io-client';
import Conference from '../components/Conference';

interface Chat {
  id: string;
  name?: string;
  type: string;
  members: Array<{ id: string; name: string; avatar?: string }>;
  lastMessage?: {
    content?: string;
    createdAt: string;
  };
}

interface Message {
  id: string;
  content?: string;
  type: string;
  mediaUrl?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function Chat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'group' | 'private'>('group');
  const [showCreateConference, setShowCreateConference] = useState(false);
  const [newConferenceTitle, setNewConferenceTitle] = useState('');
  const [activeConference, setActiveConference] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadChats();
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL.replace('/api', '') || 'http://localhost:3001';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('receive-message', (data: Message & { chatId?: string }) => {
      if (data.chatId === selectedChat) {
        setMessages(prev => [...prev, data]);
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (selectedChat && socket) {
      socket.emit('join-room', selectedChat);
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const response = await api.get('/chat');
      setChats(response.data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const response = await api.post(`/chat/${selectedChat}/messages`, {
        content: newMessage,
        type: 'text'
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
      
      if (socket) {
        socket.emit('send-message', {
          roomId: selectedChat,
          chatId: selectedChat,
          ...response.data
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createChat = async () => {
    if (newChatType === 'group' && !newChatName.trim()) {
      alert('Введите название группы');
      return;
    }

    try {
      const response = await api.post('/chat', {
        name: newChatName,
        type: newChatType,
        memberIds: []
      });
      setChats([response.data, ...chats]);
      setSelectedChat(response.data.id);
      setShowCreateChat(false);
      setNewChatName('');
      loadChats();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const createConference = async () => {
    if (!newConferenceTitle.trim()) {
      alert('Введите название конференции');
      return;
    }

    try {
      const response = await api.post('/conference', {
        chatId: selectedChat,
        title: newConferenceTitle
      });
      setActiveConference(response.data.id);
      setShowCreateConference(false);
      setNewConferenceTitle('');
    } catch (error) {
      console.error('Error creating conference:', error);
    }
  };

  const currentChat = chats.find(c => c.id === selectedChat);
  const otherMembers = currentChat?.members.filter(m => m.id !== user?.id) || [];

  if (activeConference) {
    return (
      <Conference
        conferenceId={activeConference}
        onClose={() => {
          setActiveConference(null);
          api.post(`/conference/${activeConference}/leave`);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)' }}>
      <div style={{
        width: '300px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Чаты</h2>
          <button
            onClick={() => setShowCreateChat(true)}
            style={{
              padding: '8px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {showCreateChat && (
          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <select
              value={newChatType}
              onChange={(e) => setNewChatType(e.target.value as 'group' | 'private')}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              <option value="group">Группа</option>
              <option value="private">Личный чат</option>
            </select>
            {newChatType === 'group' && (
              <input
                type="text"
                placeholder="Название группы"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={createChat}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateChat(false);
                  setNewChatName('');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              style={{
                padding: '12px',
                background: selectedChat === chat.id ? '#eef2ff' : '#f9fafb',
                borderRadius: '8px',
                cursor: 'pointer',
                border: selectedChat === chat.id ? '2px solid #6366f1' : '2px solid transparent'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {chat.name || otherMembers.map(m => m.name).join(', ') || 'Чат'}
              </div>
              {chat.lastMessage && (
                <div style={{ fontSize: '12px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.lastMessage.content || 'Медиа'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selectedChat ? (
          <>
            <div style={{
              paddingBottom: '16px',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                  {currentChat?.name || otherMembers.map(m => m.name).join(', ') || 'Чат'}
                </h3>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {currentChat?.type === 'group' ? 'Групповой чат' : 'Личный чат'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowCreateConference(true)}
                  style={{
                    padding: '8px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px'
                  }}
                >
                  <Users size={18} />
                  Конференция
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {messages.map((message) => {
                const isOwn = message.user.id === user?.id;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      background: isOwn ? '#6366f1' : '#f3f4f6',
                      color: isOwn ? 'white' : '#333',
                      borderRadius: '12px',
                      wordWrap: 'break-word'
                    }}>
                      {!isOwn && (
                        <div style={{ fontSize: '12px', marginBottom: '4px', opacity: 0.8 }}>
                          {message.user.name}
                        </div>
                      )}
                      {message.type === 'image' && message.mediaUrl && (
                        <img
                          src={message.mediaUrl}
                          alt="Message"
                          style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '4px' }}
                        />
                      )}
                      {message.content && (
                        <div>{message.content}</div>
                      )}
                      <div style={{
                        fontSize: '11px',
                        marginTop: '4px',
                        opacity: 0.7
                      }}>
                        {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Написать сообщение..."
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '12px 20px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999'
          }}>
            Выберите чат для общения
          </div>
        )}
      </div>

      {showCreateConference && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Создать конференцию</h2>
            <input
              type="text"
              placeholder="Название конференции"
              value={newConferenceTitle}
              onChange={(e) => setNewConferenceTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={createConference}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateConference(false);
                  setNewConferenceTitle('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
