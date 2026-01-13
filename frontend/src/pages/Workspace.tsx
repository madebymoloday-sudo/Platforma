import { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, FileText, Book, Calendar, Table, Target } from 'lucide-react';

interface WorkspaceItem {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const typeIcons: Record<string, any> = {
  table: Table,
  tracker: Target,
  note: FileText,
  book: Book,
  schedule: Calendar
};

const typeLabels: Record<string, string> = {
  table: 'Таблица',
  tracker: 'Трекер',
  note: 'Заметка',
  book: 'Книга',
  schedule: 'Расписание'
};

export default function Workspace() {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [selected, setSelected] = useState<WorkspaceItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newItemType, setNewItemType] = useState('note');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await api.get('/workspace');
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async () => {
    if (!newItemTitle.trim()) return;

    try {
      const response = await api.post('/workspace', {
        type: newItemType,
        title: newItemTitle,
        content: '{}'
      });
      setItems([response.data, ...items]);
      setSelected(response.data);
      setShowCreate(false);
      setNewItemTitle('');
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const updateItem = async (id: string, content: string) => {
    try {
      const response = await api.put(`/workspace/${id}`, { content });
      setItems(items.map(item => item.id === id ? response.data : item));
      setSelected(response.data);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '30px', height: '100%' }}>
      <div style={{
        width: '300px',
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 100px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Элементы</h2>
          <button
            onClick={() => setShowCreate(true)}
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

        {showCreate && (
          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <select
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Название"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={createItem}
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
                  setShowCreate(false);
                  setNewItemTitle('');
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  padding: '12px',
                  background: selected?.id === item.id ? '#eef2ff' : '#f9fafb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: selected?.id === item.id ? '2px solid #6366f1' : '2px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {typeLabels[item.type]}
                    </div>
                  </div>
                </div>
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
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>{selected.title}</h1>
            <textarea
              value={selected.content}
              onChange={(e) => {
                const updated = { ...selected, content: e.target.value };
                setSelected(updated);
                updateItem(selected.id, e.target.value);
              }}
              style={{
                width: '100%',
                minHeight: '400px',
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
              placeholder="Содержимое..."
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '60px' }}>
            Выберите элемент или создайте новый
          </div>
        )}
      </div>
    </div>
  );
}
