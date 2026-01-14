import { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, ExternalLink, Video, FileText, Headphones, Film, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Leisure {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: string;
  thumbnail?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const typeIcons: Record<string, any> = {
  video: Video,
  article: FileText,
  podcast: Headphones,
  movie: Film,
  other: ExternalLink
};

const typeLabels: Record<string, string> = {
  video: 'Видео',
  article: 'Статья',
  podcast: 'Подкаст',
  movie: 'Фильм',
  other: 'Другое'
};

export default function Leisure() {
  const [items, setItems] = useState<Leisure[]>([]);
  const [myItems, setMyItems] = useState<Leisure[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'my'>('feed');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Leisure | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [, setLoading] = useState(true);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'video',
    thumbnail: '',
    tags: [] as string[],
    isPublic: true
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadItems();
    loadMyItems();
  }, [activeTab, filterType]);

  const loadItems = async () => {
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      const response = await api.get('/leisure', { params });
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyItems = async () => {
    try {
      const response = await api.get('/leisure/my');
      setMyItems(response.data);
    } catch (error) {
      console.error('Error loading my items:', error);
    }
  };

  const submitItem = async () => {
    if (!formData.title || !formData.url) {
      alert('Заполните название и ссылку');
      return;
    }

    try {
      if (editing) {
        await api.put(`/leisure/${editing.id}`, formData);
      } else {
        await api.post('/leisure', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', description: '', url: '', type: 'video', thumbnail: '', tags: [], isPublic: true });
      setTagInput('');
      loadItems();
      loadMyItems();
    } catch (error) {
      console.error('Error submitting item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить эту ссылку?')) return;

    try {
      await api.delete(`/leisure/${id}`);
      loadItems();
      loadMyItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const displayItems = activeTab === 'feed' ? items : myItems;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Досуг</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ title: '', description: '', url: '', type: 'video', thumbnail: '', tags: [], isPublic: true });
            setTagInput('');
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
          Добавить ссылку
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
          Общая лента
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
          Мои ссылки
        </button>
        {activeTab === 'feed' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <option value="">Все типы</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        )}
      </div>

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
              {editing ? 'Редактировать ссылку' : 'Новая ссылка'}
            </h2>
            <input
              type="text"
              placeholder="Название *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              required
            />
            <input
              type="url"
              placeholder="Ссылка *"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
              required
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'inherit'
              }}
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="Превью изображение (URL, необязательно)"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Добавить тег"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  style={{
                    padding: '8px 16px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Добавить
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      background: '#eef2ff',
                      color: '#6366f1',
                      borderRadius: '16px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
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
                onClick={submitItem}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {displayItems.map((item) => {
          const Icon = typeIcons[item.type] || ExternalLink;
          return (
            <div
              key={item.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                <Icon size={24} color="#6366f1" />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{typeLabels[item.type]}</span>
                    <span>•</span>
                    <span>{item.user.name}</span>
                  </div>
                </div>
                {item.user.id === user?.id && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(item);
                        setFormData({
                          title: item.title,
                          description: item.description || '',
                          url: item.url,
                          type: item.type,
                          thumbnail: item.thumbnail || '',
                          tags: item.tags,
                          isPublic: item.isPublic
                        });
                        setShowForm(true);
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                )}
              </div>
              {item.description && (
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px', lineHeight: '1.5' }}>
                  {item.description}
                </p>
              )}
              {item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        color: '#666',
                        borderRadius: '12px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: '#6366f1',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: 'auto'
                }}
              >
                <ExternalLink size={16} />
                Открыть ссылку
              </a>
            </div>
          );
        })}
      </div>

      {displayItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          {activeTab === 'feed' ? 'Нет ссылок в ленте' : 'У вас пока нет ссылок'}
        </div>
      )}
    </div>
  );
}
