'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { careerRoadmapService } from '@/services/careerRoadmapService';
import type { CareerRoadmap, CareerModule, CareerWeek, CareerDay, CareerTopic, CareerResource } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Edit2, RefreshCw, X, ChevronDown, ChevronRight } from 'lucide-react';

// ── Modal State ────────────────────────────────────────────────────────────────

type ModalKind = 'career' | 'career-edit' | 'module' | 'module-edit' | 'week' | 'week-edit' | 'day' | 'day-edit' | 'topic' | 'topic-edit' | 'resource' | 'resource-edit' | null;

interface ModalState {
  kind: ModalKind;
  careerId?: string;
  moduleId?: string;
  weekId?: string;
  dayId?: string;
  topicId?: string;
  id?: string;
  title: string;
  description: string;
  number: string;
  hours: string;
  objective: string;
  url: string;
  provider: string;
}

const EMPTY_MODAL: ModalState = {
  kind: null,
  title: '',
  description: '',
  number: '',
  hours: '',
  objective: '',
  url: '',
  provider: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const getCareerTitle = (c: CareerRoadmap) => c.title || c.name || 'Untitled';
const isPublished = (c?: CareerRoadmap | null) => Boolean(c?.approved || c?.status === 'published');
const isLegacy = (c?: CareerRoadmap | null) => c?.source === 'legacy-roadmap';
const formatDate = (v?: string) => (v ? new Date(v).toLocaleDateString() : '—');

function getErr(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message || fallback;
  if (e && typeof e === 'object') {
    const x = e as { response?: { data?: { message?: string } }; message?: string };
    return x.response?.data?.message || x.message || fallback;
  }
  return fallback;
}

// ── Simple Modal Dialog ────────────────────────────────────────────────────────

function ModalDialog({
  open,
  title,
  onClose,
  onSave,
  isSaving,
  error,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  error: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
        </div>
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        <div style={{ marginBottom: '1rem' }}>{children}</div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 style={{ width: 16, height: 16, marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Notification ────────────────────────────────────────────────────────

function Toast({
  message,
  type,
}: {
  message: string;
  type: 'ok' | 'err';
}) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: type === 'ok' ? '#dcfce7' : '#fee2e2',
      color: type === 'ok' ? '#166534' : '#991b1b',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 40,
      maxWidth: '300px',
    }}>
      {message}
    </div>
  );
}

// ── Collapsible Panel ──────────────────────────────────────────────────────────

function Collapsible({
  open,
  onToggle,
  header,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem', overflow: 'hidden', marginBottom: '0.5rem' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.75rem',
          backgroundColor: '#f8fafc',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.875rem',
          fontWeight: '500',
        }}
      >
        {open ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
        {header}
      </button>
      {open && <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>{children}</div>}
    </div>
  );
}

// ── Resource Row ───────────────────────────────────────────────────────────────

function ResourceRow({
  resource,
  onEdit,
  onDelete,
  isDeleting,
}: {
  resource: CareerResource;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      backgroundColor: '#f1f5f9',
      borderRadius: '0.375rem',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
    }}>
      <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {resource.title || resource.url}
      </a>
      <Button size="sm" variant="ghost" onClick={onEdit} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }}>Edit</Button>
      <Button size="sm" variant="ghost" onClick={onDelete} disabled={isDeleting} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', color: '#ef4444' }}>
        {isDeleting ? '...' : 'Del'}
      </Button>
    </div>
  );
}

// ── Topic Panel ────────────────────────────────────────────────────────────────

function TopicPanel({
  topic,
  onEditTopic,
  onDeleteTopic,
  onAddResource,
  onEditResource,
  onDeleteResource,
  isTopicDeleting,
  isDeletingResourceId,
}: {
  topic: CareerTopic;
  onEditTopic: (t: CareerTopic) => void;
  onDeleteTopic: (id: string) => void;
  onAddResource: (topicId: string) => void;
  onEditResource: (r: CareerResource) => void;
  onDeleteResource: (id: string) => void;
  isTopicDeleting: boolean;
  isDeletingResourceId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const resources = topic.resources || [];

  return (
    <Collapsible
      open={expanded}
      onToggle={() => setExpanded(!expanded)}
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ flex: 1 }}>{topic.title} ({resources.length})</span>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditTopic(topic); }} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic.id); }} disabled={isTopicDeleting} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', color: '#ef4444' }}>
            {isTopicDeleting ? '...' : 'Del'}
          </Button>
        </div>
      }
    >
      <div style={{ paddingLeft: '1rem' }}>
        {resources.length === 0 && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>No resources yet</p>}
        {resources.map(r => (
          <ResourceRow key={r.id} resource={r} onEdit={() => onEditResource(r)} onDelete={() => onDeleteResource(r.id!)} isDeleting={isDeletingResourceId === r.id} />
        ))}
        <Button size="sm" variant="outline" onClick={() => onAddResource(topic.id)} style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <Plus style={{ width: 12, height: 12, marginRight: '0.25rem' }} /> Add Resource
        </Button>
      </div>
    </Collapsible>
  );
}

// ── Day Panel ──────────────────────────────────────────────────────────────────

function DayPanel({
  day,
  onEditDay,
  onDeleteDay,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onAddResource,
  onEditResource,
  onDeleteResource,
  isDayDeleting,
  isTopicDeleting,
  isDeletingResourceId,
}: {
  day: CareerDay;
  onEditDay: (d: CareerDay) => void;
  onDeleteDay: (id: string) => void;
  onAddTopic: (dayId: string) => void;
  onEditTopic: (t: CareerTopic) => void;
  onDeleteTopic: (id: string) => void;
  onAddResource: (topicId: string) => void;
  onEditResource: (r: CareerResource) => void;
  onDeleteResource: (id: string) => void;
  isDayDeleting: boolean;
  isTopicDeleting: string;
  isDeletingResourceId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const topics = day.topics || [];

  return (
    <Collapsible
      open={expanded}
      onToggle={() => setExpanded(!expanded)}
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ flex: 1 }}>Day {day.dayNumber}: {day.title} ({topics.length})</span>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditDay(day); }} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDeleteDay(day.id); }} disabled={isDayDeleting} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', color: '#ef4444' }}>
            {isDayDeleting ? '...' : 'Del'}
          </Button>
        </div>
      }
    >
      <div style={{ paddingLeft: '1rem' }}>
        {topics.length === 0 && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>No topics yet</p>}
        {topics.map((t: CareerTopic) => (
          <TopicPanel
            key={t.id}
            topic={t}
            onEditTopic={onEditTopic}
            onDeleteTopic={onDeleteTopic}
            onAddResource={onAddResource}
            onEditResource={onEditResource}
            onDeleteResource={onDeleteResource}
            isTopicDeleting={isTopicDeleting === t.id}
            isDeletingResourceId={isDeletingResourceId}
          />
        ))}
        <Button size="sm" variant="outline" onClick={() => onAddTopic(day.id)} style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <Plus style={{ width: 12, height: 12, marginRight: '0.25rem' }} /> Add Topic
        </Button>
      </div>
    </Collapsible>
  );
}

// ── Week Panel ─────────────────────────────────────────────────────────────────

function WeekPanel({
  week,
  onEditWeek,
  onDeleteWeek,
  onAddDay,
  onEditDay,
  onDeleteDay,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onAddResource,
  onEditResource,
  onDeleteResource,
  isWeekDeleting,
  isDayDeleting,
  isTopicDeleting,
  isDeletingResourceId,
}: {
  week: CareerWeek;
  onEditWeek: (w: CareerWeek) => void;
  onDeleteWeek: (id: string) => void;
  onAddDay: (weekId: string) => void;
  onEditDay: (d: CareerDay) => void;
  onDeleteDay: (id: string) => void;
  onAddTopic: (dayId: string) => void;
  onEditTopic: (t: CareerTopic) => void;
  onDeleteTopic: (id: string) => void;
  onAddResource: (topicId: string) => void;
  onEditResource: (r: CareerResource) => void;
  onDeleteResource: (id: string) => void;
  isWeekDeleting: boolean;
  isDayDeleting: string;
  isTopicDeleting: string;
  isDeletingResourceId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = week.days || [];

  return (
    <Collapsible
      open={expanded}
      onToggle={() => setExpanded(!expanded)}
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ flex: 1 }}>Week {week.weekNumber}: {week.title} ({days.length})</span>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditWeek(week); }} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDeleteWeek(week.id); }} disabled={isWeekDeleting} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', color: '#ef4444' }}>
            {isWeekDeleting ? '...' : 'Del'}
          </Button>
        </div>
      }
    >
      <div style={{ paddingLeft: '1rem' }}>
        {days.length === 0 && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>No days yet</p>}
        {days.map((d: CareerDay) => (
          <DayPanel
            key={d.id}
            day={d}
            onEditDay={onEditDay}
            onDeleteDay={onDeleteDay}
            onAddTopic={onAddTopic}
            onEditTopic={onEditTopic}
            onDeleteTopic={onDeleteTopic}
            onAddResource={onAddResource}
            onEditResource={onEditResource}
            onDeleteResource={onDeleteResource}
            isDayDeleting={isDayDeleting === d.id}
            isTopicDeleting={isTopicDeleting}
            isDeletingResourceId={isDeletingResourceId}
          />
        ))}
        <Button size="sm" variant="outline" onClick={() => onAddDay(week.id)} style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <Plus style={{ width: 12, height: 12, marginRight: '0.25rem' }} /> Add Day
        </Button>
      </div>
    </Collapsible>
  );
}

// ── Module Panel ───────────────────────────────────────────────────────────────

function ModulePanel({
  mod,
  onEditModule,
  onDeleteModule,
  onAddWeek,
  onEditWeek,
  onDeleteWeek,
  onAddDay,
  onEditDay,
  onDeleteDay,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onAddResource,
  onEditResource,
  onDeleteResource,
  isModuleDeleting,
  isWeekDeleting,
  isDayDeleting,
  isTopicDeleting,
  isDeletingResourceId,
}: {
  mod: CareerModule;
  onEditModule: (m: CareerModule) => void;
  onDeleteModule: (id: string) => void;
  onAddWeek: (moduleId: string) => void;
  onEditWeek: (w: CareerWeek) => void;
  onDeleteWeek: (id: string) => void;
  onAddDay: (weekId: string) => void;
  onEditDay: (d: CareerDay) => void;
  onDeleteDay: (id: string) => void;
  onAddTopic: (dayId: string) => void;
  onEditTopic: (t: CareerTopic) => void;
  onDeleteTopic: (id: string) => void;
  onAddResource: (topicId: string) => void;
  onEditResource: (r: CareerResource) => void;
  onDeleteResource: (id: string) => void;
  isModuleDeleting: boolean;
  isWeekDeleting: string;
  isDayDeleting: string;
  isTopicDeleting: string;
  isDeletingResourceId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const weeks = mod.weeks || [];

  return (
    <Collapsible
      open={expanded}
      onToggle={() => setExpanded(!expanded)}
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ flex: 1, fontWeight: '600' }}>Module: {mod.title} ({weeks.length})</span>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditModule(mod); }} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDeleteModule(mod.id); }} disabled={isModuleDeleting} style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem', color: '#ef4444' }}>
            {isModuleDeleting ? '...' : 'Del'}
          </Button>
        </div>
      }
    >
      <div style={{ paddingLeft: '1rem' }}>
        {weeks.length === 0 && <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>No weeks yet</p>}
        {weeks.map((w: CareerWeek) => (
          <WeekPanel
            key={w.id}
            week={w}
            onEditWeek={onEditWeek}
            onDeleteWeek={onDeleteWeek}
            onAddDay={onAddDay}
            onEditDay={onEditDay}
            onDeleteDay={onDeleteDay}
            onAddTopic={onAddTopic}
            onEditTopic={onEditTopic}
            onDeleteTopic={onDeleteTopic}
            onAddResource={onAddResource}
            onEditResource={onEditResource}
            onDeleteResource={onDeleteResource}
            isWeekDeleting={isWeekDeleting === w.id}
            isDayDeleting={isDayDeleting}
            isTopicDeleting={isTopicDeleting}
            isDeletingResourceId={isDeletingResourceId}
          />
        ))}
        <Button size="sm" variant="outline" onClick={() => onAddWeek(mod.id)} style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }}>
          <Plus style={{ width: 12, height: 12, marginRight: '0.25rem' }} /> Add Week
        </Button>
      </div>
    </Collapsible>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminRoadmapBuilder() {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);
  const [modalErr, setModalErr] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Deletion pending states
  const [delModuleId, setDelModuleId] = useState('');
  const [delWeekId, setDelWeekId] = useState('');
  const [delDayId, setDelDayId] = useState('');
  const [delTopicId, setDelTopicId] = useState('');
  const [delResourceId, setDelResourceId] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: careers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-careers'],
    queryFn: () => careerRoadmapService.listAdminCareers(),
    staleTime: 5 * 60 * 1000,
  });

  const selected = careers.find(c => c.id === selectedId);
  const filtered = careers.filter(c =>
    getCareerTitle(c).toLowerCase().includes(search.toLowerCase()) ||
    (c.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const notify = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), type === 'ok' ? 3000 : 4000);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-careers'] });
  const openModal = (partial: Partial<ModalState>) => { setModal({ ...EMPTY_MODAL, ...partial }); setModalErr(''); };
  const closeModal = () => { setModal(EMPTY_MODAL); setModalErr(''); };

  // ── Career mutations ───────────────────────────────────────────────────────
  const createCareerMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.createCareer(d),
    onSuccess: () => { invalidate(); notify('ok', 'Career created'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to create')),
  });

  const updateCareerMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateCareer(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Career updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteCareerMut = useMutation({
    mutationFn: (id: string) => careerRoadmapService.deleteCareer(id),
    onSuccess: () => { invalidate(); notify('ok', 'Career deleted'); setSelectedId(''); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => careerRoadmapService.publishCareer(id, !isPublished(selected)),
    onSuccess: () => { invalidate(); notify('ok', 'Status updated'); },
    onError: (e) => notify('err', getErr(e, 'Failed to update')),
  });

  // ── Module mutations ───────────────────────────────────────────────────────
  const createModuleMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.createModule(d),
    onSuccess: () => { invalidate(); notify('ok', 'Module added'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to add')),
  });

  const updateModuleMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateModule(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Module updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteModuleMut = useMutation({
    mutationFn: (id: string) => { setDelModuleId(id); return careerRoadmapService.deleteModule(id); },
    onSettled: () => setDelModuleId(''),
    onSuccess: () => { invalidate(); notify('ok', 'Module deleted'); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  // ── Week mutations ─────────────────────────────────────────────────────────
  const createWeekMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.createWeek(d),
    onSuccess: () => { invalidate(); notify('ok', 'Week added'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to add')),
  });

  const updateWeekMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateWeek(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Week updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteWeekMut = useMutation({
    mutationFn: (id: string) => { setDelWeekId(id); return careerRoadmapService.deleteWeek(id); },
    onSettled: () => setDelWeekId(''),
    onSuccess: () => { invalidate(); notify('ok', 'Week deleted'); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  // ── Day mutations ──────────────────────────────────────────────────────────
  const createDayMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.createDay(d),
    onSuccess: () => { invalidate(); notify('ok', 'Day added'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to add')),
  });

  const updateDayMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateDay(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Day updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteDayMut = useMutation({
    mutationFn: (id: string) => { setDelDayId(id); return careerRoadmapService.deleteDay(id); },
    onSettled: () => setDelDayId(''),
    onSuccess: () => { invalidate(); notify('ok', 'Day deleted'); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  // ── Topic mutations ────────────────────────────────────────────────────────
  const createTopicMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.createTopic(d),
    onSuccess: () => { invalidate(); notify('ok', 'Topic added'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to add')),
  });

  const updateTopicMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateTopic(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Topic updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteTopicMut = useMutation({
    mutationFn: (id: string) => { setDelTopicId(id); return careerRoadmapService.deleteTopic(id); },
    onSettled: () => setDelTopicId(''),
    onSuccess: () => { invalidate(); notify('ok', 'Topic deleted'); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  // ── Resource mutations ─────────────────────────────────────────────────────
  const addResourceMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.addResource(d),
    onSuccess: () => { invalidate(); notify('ok', 'Resource added'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to add')),
  });

  const updateResourceMut = useMutation({
    mutationFn: (d: any) => careerRoadmapService.updateResource(d.id, d.data),
    onSuccess: () => { invalidate(); notify('ok', 'Resource updated'); closeModal(); },
    onError: (e) => setModalErr(getErr(e, 'Failed to update')),
  });

  const deleteResourceMut = useMutation({
    mutationFn: (id: string) => { setDelResourceId(id); return careerRoadmapService.deleteResource(id); },
    onSettled: () => setDelResourceId(''),
    onSuccess: () => { invalidate(); notify('ok', 'Resource deleted'); },
    onError: (e) => notify('err', getErr(e, 'Failed to delete')),
  });

  const isSaving = createCareerMut.isPending || updateCareerMut.isPending || createModuleMut.isPending || updateModuleMut.isPending || createWeekMut.isPending || updateWeekMut.isPending || createDayMut.isPending || updateDayMut.isPending || createTopicMut.isPending || updateTopicMut.isPending || addResourceMut.isPending || updateResourceMut.isPending;

  // ── Modal save handler ─────────────────────────────────────────────────────
  const handleModalSave = async () => {
    setModalErr('');
    const m = modal;
    const title = m.title.trim();
    if (!title) { setModalErr('Title is required'); return; }

    try {
      if (m.kind === 'career') {
        if (!m.description.trim()) { setModalErr('Description is required'); return; }
        await createCareerMut.mutateAsync({ name: title, description: m.description.trim(), status: 'draft' });
      } else if (m.kind === 'career-edit' && m.id) {
        if (!m.description.trim()) { setModalErr('Description is required'); return; }
        await updateCareerMut.mutateAsync({ id: m.id, data: { title, name: title, description: m.description.trim() } });
      } else if (m.kind === 'module' && m.careerId) {
        await createModuleMut.mutateAsync({ careerId: m.careerId, title, description: m.description.trim() || undefined });
      } else if (m.kind === 'module-edit' && m.id) {
        await updateModuleMut.mutateAsync({ id: m.id, data: { title, description: m.description.trim() || undefined } });
      } else if (m.kind === 'week' && m.moduleId) {
        const num = parseInt(m.number) || 1;
        await createWeekMut.mutateAsync({ moduleId: m.moduleId, weekNumber: num, title, description: m.description.trim() || undefined });
      } else if (m.kind === 'week-edit' && m.id) {
        const num = parseInt(m.number) || 1;
        await updateWeekMut.mutateAsync({ id: m.id, data: { weekNumber: num, title, description: m.description.trim() || undefined } });
      } else if (m.kind === 'day' && m.weekId) {
        const num = parseInt(m.number) || 1;
        await createDayMut.mutateAsync({ weekId: m.weekId, dayNumber: num, title, description: m.description.trim() || undefined, estimatedHours: parseFloat(m.hours) || undefined });
      } else if (m.kind === 'day-edit' && m.id) {
        const num = parseInt(m.number) || 1;
        await updateDayMut.mutateAsync({ id: m.id, data: { dayNumber: num, title, description: m.description.trim() || undefined, estimatedHours: parseFloat(m.hours) || undefined } });
      } else if (m.kind === 'topic' && m.dayId) {
        await createTopicMut.mutateAsync({ dayId: m.dayId, title, description: m.description.trim() || undefined, objective: m.objective.trim() || undefined, difficulty: 'Intermediate', order: 0 });
      } else if (m.kind === 'topic-edit' && m.id) {
        await updateTopicMut.mutateAsync({ id: m.id, data: { title, description: m.description.trim() || undefined, objective: m.objective.trim() || undefined } });
      } else if (m.kind === 'resource' && m.topicId) {
        if (!m.url.trim()) { setModalErr('URL is required'); return; }
        if (!m.provider.trim()) { setModalErr('Provider is required'); return; }
        try { new URL(m.url.trim()); } catch { setModalErr('Invalid URL'); return; }
        await addResourceMut.mutateAsync({ topicId: m.topicId, title: title || m.url.trim(), url: m.url.trim(), provider: m.provider.trim(), isFree: true });
      } else if (m.kind === 'resource-edit' && m.id) {
        const updates: any = { title: title || undefined };
        if (m.url.trim()) updates.url = m.url.trim();
        if (m.provider.trim()) updates.provider = m.provider.trim();
        await updateResourceMut.mutateAsync({ id: m.id, data: updates });
      }
    } catch { /* error handled by mutation */ }
  };

  const canMutate = selected && !isLegacy(selected);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Roadmap Builder</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Sidebar */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Careers</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button onClick={() => openModal({ kind: 'career' })} style={{ width: '100%' }}>+ New Career</Button>
              <Button variant="outline" onClick={() => refetch()} style={{ width: '100%' }}>{isLoading ? 'Loading...' : 'Refresh'}</Button>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {filtered.map(c => (
                <div key={c.id} onClick={() => setSelectedId(c.id)} style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  backgroundColor: selectedId === c.id ? '#e6e6ff' : '#f8fafc',
                  border: selectedId === c.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                }}>
                  <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{getCareerTitle(c)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {c.modules?.length || 0} modules · {isPublished(c) ? 'Published' : 'Draft'}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>No careers found</p>}
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.5rem' }}>
            {!selected ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>Select a career to view details</p>
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', flex: 1 }}>{getCareerTitle(selected)}</h2>
                    <Button size="sm" variant="outline" onClick={() => openModal({ kind: 'career-edit', id: selected.id, title: getCareerTitle(selected), description: selected.description || '' })}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => publishMut.mutate(selected.id)} disabled={publishMut.isPending || isLegacy(selected)}>
                      {isPublished(selected) ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteCareerMut.mutate(selected.id)} disabled={deleteCareerMut.isPending}>Delete</Button>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{selected.description}</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>Status: {isPublished(selected) ? 'Published' : 'Draft'} · Created: {formatDate(selected.createdAt)} {isLegacy(selected) && ' · Legacy'}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', flex: 1 }}>Modules</h3>
                    <Button size="sm" variant="outline" onClick={() => openModal({ kind: 'module', careerId: selected.id })} disabled={!canMutate}>
                      <Plus style={{ width: 12, height: 12, marginRight: '0.25rem' }} /> Add Module
                    </Button>
                  </div>

                  <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {(selected.modules || []).map((mod: CareerModule) => (
                      <ModulePanel
                        key={mod.id}
                        mod={mod}
                        onEditModule={(m: CareerModule) => openModal({ kind: 'module-edit', id: m.id, title: m.title, description: m.description || '' })}
                        onDeleteModule={(id: string) => deleteModuleMut.mutate(id)}
                        onAddWeek={(mid: string) => openModal({ kind: 'week', moduleId: mid })}
                        onEditWeek={(w: CareerWeek) => openModal({ kind: 'week-edit', id: w.id, title: w.title, description: w.description || '', number: String(w.weekNumber || '') })}
                        onDeleteWeek={(id: string) => deleteWeekMut.mutate(id)}
                        onAddDay={(wid: string) => openModal({ kind: 'day', weekId: wid })}
                        onEditDay={(d: CareerDay) => openModal({ kind: 'day-edit', id: d.id, title: d.title, description: d.description || '', number: String(d.dayNumber || ''), hours: String(d.estimatedHours || '') })}
                        onDeleteDay={(id: string) => deleteDayMut.mutate(id)}
                        onAddTopic={(did: string) => openModal({ kind: 'topic', dayId: did })}
                        onEditTopic={(t: CareerTopic) => openModal({ kind: 'topic-edit', id: t.id, title: t.title, description: t.description || '', objective: t.objective || '' })}
                        onDeleteTopic={(id: string) => deleteTopicMut.mutate(id)}
                        onAddResource={(tid: string) => openModal({ kind: 'resource', topicId: tid })}
                        onEditResource={(r: CareerResource) => openModal({ kind: 'resource-edit', id: r.id, title: r.title || '', url: r.url, provider: r.provider || '' })}
                        onDeleteResource={(id: string) => deleteResourceMut.mutate(id)}
                        isModuleDeleting={delModuleId === mod.id}
                        isWeekDeleting={delWeekId}
                        isDayDeleting={delDayId}
                        isTopicDeleting={delTopicId}
                        isDeletingResourceId={delResourceId}
                      />
                    ))}
                    {(selected.modules || []).length === 0 && <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No modules yet. Add one to get started.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ModalDialog
        open={modal.kind !== null}
        title={
          modal.kind === 'career' ? 'New Career' :
          modal.kind === 'career-edit' ? 'Edit Career' :
          modal.kind === 'module' ? 'New Module' :
          modal.kind === 'module-edit' ? 'Edit Module' :
          modal.kind === 'week' ? 'New Week' :
          modal.kind === 'week-edit' ? 'Edit Week' :
          modal.kind === 'day' ? 'New Day' :
          modal.kind === 'day-edit' ? 'Edit Day' :
          modal.kind === 'topic' ? 'New Topic' :
          modal.kind === 'topic-edit' ? 'Edit Topic' :
          modal.kind === 'resource' ? 'New Resource' :
          'Edit Resource'
        }
        onClose={closeModal}
        onSave={handleModalSave}
        isSaving={isSaving}
        error={modalErr}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(modal.kind?.includes('career') || modal.kind?.includes('module') || modal.kind?.includes('week') || modal.kind?.includes('day') || modal.kind?.includes('topic')) && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Title</label>
                <Input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="Enter title" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Description</label>
                <Textarea value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} placeholder="Enter description" rows={3} />
              </div>
              {(modal.kind?.includes('week') || modal.kind?.includes('day')) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Number</label>
                  <Input type="number" value={modal.number} onChange={(e) => setModal({ ...modal, number: e.target.value })} placeholder="e.g., 1" />
                </div>
              )}
              {modal.kind?.includes('day') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Estimated Hours</label>
                  <Input type="number" value={modal.hours} onChange={(e) => setModal({ ...modal, hours: e.target.value })} placeholder="e.g., 8" />
                </div>
              )}
              {modal.kind?.includes('topic') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Objective</label>
                  <Textarea value={modal.objective} onChange={(e) => setModal({ ...modal, objective: e.target.value })} placeholder="Enter objective" rows={2} />
                </div>
              )}
            </>
          )}
          {modal.kind?.includes('resource') && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Title</label>
                <Input value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} placeholder="Resource title (optional)" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>URL</label>
                <Input value={modal.url} onChange={(e) => setModal({ ...modal, url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Provider</label>
                <Input value={modal.provider} onChange={(e) => setModal({ ...modal, provider: e.target.value })} placeholder="e.g., Udemy, Coursera" />
              </div>
            </>
          )}
        </div>
      </ModalDialog>

      {/* Toast */}
      {toast && <Toast message={toast.text} type={toast.type} />}
    </div>
  );
}
