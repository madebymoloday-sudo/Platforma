import { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Edit, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Report {
  id: string;
  title?: string;
  content: string;
  isPublic: boolean;
  images: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function Community() {
  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'my'>('feed');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPublic: false,
    images: [] as string[],
    videos: [] as string[]
  });

  useEffect(() => {
    loadReports();
    loadMyReports();
  }, [activeTab]);

  const loadReports = async () => {
    try {
      const params = selectedUserId ? { userId: selectedUserId } : {};
      const response = await api.get('/community/reports', { params });
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReports = async () => {
    try {
      const response = await api.get('/community/reports/my');
      setMyReports(response.data);
    } catch (error) {
      console.error('Error loading my reports:', error);
    }
  };

  const submitReport = async () => {
    try {
      if (editing) {
        await api.put(`/community/reports/${editing.id}`, formData);
      } else {
        await api.post('/community/reports', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', content: '', isPublic: false, images: [], videos: [] });
      loadReports();
      loadMyReports();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const analyzeUser = async (userId: string) => {
    try {
      const response = await api.post(`/community/reports/analyze/${userId}`);
      setAnalysis(response.data.summary);
    } catch (error) {
      console.error('Error analyzing:', error);
      setAnalysis('Ошибка анализа. Убедитесь, что OPENAI_API_KEY настроен.');
    }
  };

  const displayReports = activeTab === 'feed' ? reports : myReports;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Сообщество</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ title: '', content: '', isPublic: false, images: [], videos: [] });
          }}
          style={{
            padding: '12px 24px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Новый отчёт
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('feed')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'feed' ? '#6366f1' : '#e5e7eb',
            color: activeTab === 'feed' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Лента сообщества
        </button>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'my' ? '#6366f1' : '#e5e7eb',
            color: activeTab === 'my' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Мои отчёты
        </button>
      </div>

      {selectedUserId && (
        <div style={{
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Показаны отчёты пользователя</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => analyzeUser(selectedUserId)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={16} />
                Анализ GPT
              </button>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  loadReports();
                }}
                style={{
                  padding: '8px 16px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Показать всех
              </button>
            </div>
          </div>
          {analysis && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              {analysis}
            </div>
          )}
        </div>
      )}

      {showForm && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
              {editing ? 'Редактировать отчёт' : 'Новый отчёт'}
            </h2>
            <input
              type="text"
              placeholder="Заголовок (необязательно)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
            <textarea
              placeholder="Содержание отчёта"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'inherit'
              }}
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span>Опубликовать в общую ленту</span>
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={submitReport}
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
                {editing ? 'Сохранить' : 'Создать'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {displayReports.map((report) => (
          <div
            key={report.id}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {report.user.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{report.user.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {new Date(report.createdAt).toLocaleString('ru-RU')}
                    {report.updatedAt !== report.createdAt && ' (изменён)'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {report.user.id === user?.id && (
                  <button
                    onClick={() => {
                      setEditing(report);
                      setFormData({
                        title: report.title || '',
                        content: report.content,
                        isPublic: report.isPublic,
                        images: report.images,
                        videos: report.videos
                      });
                      setShowForm(true);
                    }}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit size={18} />
                  </button>
                )}
                {activeTab === 'feed' && (
                  <button
                    onClick={() => {
                      setSelectedUserId(report.user.id);
                      setAnalysis(null);
                      loadReports();
                    }}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedUserId === report.user.id ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
            {report.title && (
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {report.title}
              </h3>
            )}
            <div style={{ fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
              {report.content}
            </div>
            {report.images.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {report.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Image ${idx + 1}`}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                ))}
              </div>
            )}
            {report.videos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {report.videos.map((video, idx) => (
                  <video
                    key={idx}
                    src={video}
                    controls
                    style={{
                      maxWidth: '300px',
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {displayReports.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          {activeTab === 'feed' ? 'Нет отчётов в ленте' : 'У вас пока нет отчётов'}
        </div>
      )}
    </div>
  );
}
