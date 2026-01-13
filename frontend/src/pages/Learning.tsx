import { useState, useEffect } from 'react';
import api from '../api/client';
import { Play, Headphones, FileText, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LearningCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  image?: string;
  order: number;
  _count?: {
    contents: number;
  };
}

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  type: string;
  content: string;
  images: string[];
  audioUrl?: string;
  videoUrl?: string;
  categoryId?: string;
  category?: LearningCategory;
  order: number;
}

export default function Learning() {
  const [content, setContent] = useState<LearningContent[]>([]);
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [selected, setSelected] = useState<LearningContent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editing, setEditing] = useState<LearningContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'text',
    content: '',
    images: [] as string[],
    audioUrl: '',
    videoUrl: '',
    categoryId: '',
    order: 0
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    image: ''
  });

  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    loadCategories();
    loadContent();
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/learning/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadContent = async () => {
    try {
      const params = selectedCategory ? { categoryId: selectedCategory } : {};
      const response = await api.get('/learning', { params });
      setContent(response.data);
      if (response.data.length > 0 && !selected) {
        setSelected(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitContent = async () => {
    if (!formData.title) {
      alert('Заполните название');
      return;
    }

    try {
      if (editing) {
        await api.put(`/learning/${editing.id}`, formData);
      } else {
        await api.post('/learning', formData);
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', description: '', type: 'text', content: '', images: [], audioUrl: '', videoUrl: '', categoryId: '', order: 0 });
      setImageInput('');
      loadContent();
    } catch (error) {
      console.error('Error submitting content:', error);
    }
  };

  const submitCategory = async () => {
    if (!categoryFormData.name) {
      alert('Заполните название категории');
      return;
    }

    try {
      await api.post('/learning/categories', categoryFormData);
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', description: '', color: '#6366f1' });
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка создания категории');
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Удалить этот материал?')) return;

    try {
      await api.delete(`/learning/${id}`);
      if (selected?.id === id) {
        setSelected(null);
      }
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({ ...formData, images: [...formData.images, imageInput.trim()] });
      setImageInput('');
    }
  };

  const removeImage = (img: string) => {
    setFormData({ ...formData, images: formData.images.filter(i => i !== img) });
  };

  const filteredContent = selectedCategory
    ? content.filter(item => item.categoryId === selectedCategory)
    : content;

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '30px', height: '100%' }}>
      <div style={{
        width: '350px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 100px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Категории</h2>
          {user && (
            <button
              onClick={() => setShowCategoryForm(true)}
              style={{
                padding: '6px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              width: '100%',
              padding: '12px',
              background: !selectedCategory ? '#eef2ff' : '#f9fafb',
              color: !selectedCategory ? '#6366f1' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: !selectedCategory ? '600' : '400',
              marginBottom: '8px',
              textAlign: 'left'
            }}
          >
            Все материалы
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                width: '100%',
                padding: '12px',
                background: selectedCategory === category.id ? '#eef2ff' : '#f9fafb',
                color: selectedCategory === category.id ? '#6366f1' : '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: selectedCategory === category.id ? '600' : '400',
                marginBottom: '8px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : category.color ? (
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: category.color
                }} />
              ) : null}
              <span style={{ flex: 1 }}>{category.name}</span>
              {category._count && (
                <span style={{ fontSize: '12px', opacity: 0.7 }}>{category._count.contents}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Материалы</h2>
          {user && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditing(null);
                setFormData({ title: '', description: '', type: 'text', content: '', images: [], audioUrl: '', videoUrl: '', categoryId: selectedCategory || '', order: 0 });
                setImageInput('');
              }}
              style={{
                padding: '6px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredContent.map((item) => {
            const Icon = item.type === 'video' ? Play : item.type === 'audio' ? Headphones : FileText;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  padding: '16px',
                  background: selected?.id === item.id ? '#eef2ff' : '#f9fafb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selected?.id === item.id ? '2px solid #6366f1' : '2px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Icon size={20} color={selected?.id === item.id ? '#6366f1' : '#666'} />
                  <h3 style={{ fontSize: '16px', fontWeight: '600', flex: 1 }}>{item.title}</h3>
                  {user && (
                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditing(item);
                          setFormData({
                            title: item.title,
                            description: item.description || '',
                            type: item.type,
                            content: item.content,
                            images: item.images,
                            audioUrl: item.audioUrl || '',
                            videoUrl: item.videoUrl || '',
                            categoryId: item.categoryId || '',
                            order: item.order
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
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deleteContent(item.id)}
                        style={{
                          padding: '4px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  )}
                </div>
                {item.description && (
                  <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    {item.description}
                  </p>
                )}
                {item.category && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={12} />
                    <span style={{ fontSize: '12px', color: '#999' }}>{item.category.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        flex: 1,
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 100px)'
      }}>
        {selected ? (
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '16px', fontWeight: '700' }}>
              {selected.title}
            </h1>
            
            {selected.images && selected.images.length > 0 && (
              <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {selected.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${selected.title} ${idx + 1}`}
                    style={{
                      maxWidth: '100%',
                      borderRadius: '8px',
                      maxHeight: '400px'
                    }}
                  />
                ))}
              </div>
            )}

            {selected.videoUrl && (
              <div style={{ marginBottom: '24px' }}>
                <video
                  controls
                  style={{ width: '100%', borderRadius: '8px' }}
                  src={selected.videoUrl}
                />
              </div>
            )}

            {selected.audioUrl && (
              <div style={{ marginBottom: '24px' }}>
                <audio controls style={{ width: '100%' }} src={selected.audioUrl} />
              </div>
            )}

            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#333',
                whiteSpace: 'pre-wrap'
              }}
              dangerouslySetInnerHTML={{ __html: selected.content }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '60px' }}>
            Выберите материал для изучения
          </div>
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
              {editing ? 'Редактировать материал' : 'Новый материал'}
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
            <textarea
              placeholder="Описание"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                minHeight: '60px',
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
              <option value="text">Текст</option>
              <option value="audio">Аудио</option>
              <option value="video">Видео</option>
            </select>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              <option value="">Без категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {formData.type === 'text' && (
              <textarea
                placeholder="Содержание текста"
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
              />
            )}
            {formData.type === 'audio' && (
              <input
                type="url"
                placeholder="URL аудио файла"
                value={formData.audioUrl}
                onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            )}
            {formData.type === 'video' && (
              <input
                type="url"
                placeholder="URL видео файла"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            )}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="url"
                  placeholder="Добавить изображение (URL)"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
                <button
                  type="button"
                  onClick={addImage}
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
              {formData.images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {formData.images.map((img) => (
                    <div key={img} style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={img}
                        alt="Preview"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={submitContent}
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

      {showCategoryForm && (
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
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Новая категория</h2>
            <input
              type="text"
              placeholder="Название категории *"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
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
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Цвет категории</label>
              <input
                type="color"
                value={categoryFormData.color}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              />
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>Изображение категории (URL)</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={categoryFormData.image}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
              {categoryFormData.image && (
                <img
                  src={categoryFormData.image}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={submitCategory}
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
                  setShowCategoryForm(false);
                  setCategoryFormData({ name: '', description: '', color: '#6366f1', image: '' });
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
