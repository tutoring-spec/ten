import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Check, X, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { printCertificate } from '@/components/shared/CertificatePrint';

// ── Richieste Tab ─────────────────────────────────────────────────────────────

function RichiesteTab({ pendingCount }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('in_attesa');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [] } = useQuery({
    queryKey: ['course-requests'],
    queryFn: () => base44.entities.CourseRegistrationRequest.list('-created_date', 100),
  });

  const approvaMutation = useMutation({
    mutationFn: async (req) => {
      await base44.entities.CourseRegistrationRequest.update(req.id, { status: 'approvato' });
      await base44.entities.CoachCourseAccess.create({
        coach_name:   req.full_name,
        coach_email:  req.email,
        access_level: 'completo',
        active:       true,
        granted_date: format(new Date(), 'yyyy-MM-dd'),
      });
      return req;
    },
    onSuccess: (req) => {
      queryClient.invalidateQueries({ queryKey: ['course-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      toast.success('Accesso approvato!');
      // Messaggio WhatsApp coerente con auth email+password
      const loginUrl = window.location.origin + '/accesso';
      const waMsg = encodeURIComponent(
        `Ciao ${req.full_name}! 🎓 Il tuo accesso al Videocorso TEN Training è attivo.\n` +
        `Accedi con email e password qui: ${loginUrl}\n` +
        `Benvenuto! ⚡ — Staff TEN Training`
      );
      const phone = (req.phone || '').replace(/\D/g, '');
      if (phone) window.open(`https://wa.me/${phone.startsWith('39') ? phone : '39' + phone}?text=${waMsg}`, '_blank');
    },
  });

  const rifiutaMutation = useMutation({
    mutationFn: async ({ req, reason }) => {
      await base44.entities.CourseRegistrationRequest.update(req.id, { status: 'rifiutato', notes: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      toast.success('Richiesta rifiutata');
      setRejectModal(null);
      setRejectReason('');
    },
  });

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);
  const STATUS_COLORS = { in_attesa: '#f59e0b', approvato: '#16a34a', rifiutato: '#dc2626' };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'in_attesa', 'approvato', 'rifiutato'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: 'Montserrat', cursor: 'pointer', border: `2px solid ${filter === s ? '#C8F000' : 'hsl(var(--border))'}`, backgroundColor: filter === s ? '#C8F000' : 'transparent', color: filter === s ? '#0A0A0A' : 'hsl(var(--muted-foreground))' }}>
            {s === 'all' ? 'Tutte' : s === 'in_attesa' ? `In Attesa (${pendingCount})` : s === 'approvato' ? 'Approvate' : 'Rifiutate'}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#0A0A0A', color: '#C8F000' }}>
              {['Nome', 'Email', 'Telefono', 'Club', 'Anni Esp.', 'Data', 'Stato', 'Azioni'].map(h => (
                <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nessuna richiesta</td></tr>}
            {filtered.map(req => (
              <tr key={req.id} className="border-t border-border hover:bg-accent/50">
                <td className="px-4 py-3 font-semibold" style={{ fontSize: '13px' }}>{req.full_name}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{req.email}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{req.phone || '—'}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{req.club || '—'}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{req.years_experience || '—'}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{req.created_date?.split('T')[0]}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" style={{ fontSize: '10px', color: STATUS_COLORS[req.status], borderColor: STATUS_COLORS[req.status] }}>{req.status?.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3">
                  {req.status === 'in_attesa' && (
                    <div className="flex gap-1">
                      <Button size="sm" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700, fontSize: '11px', height: '28px' }}
                        onClick={() => approvaMutation.mutate(req)} disabled={approvaMutation.isPending}>
                        <Check className="w-3 h-3 mr-1" /> Approva
                      </Button>
                      <Button size="sm" variant="outline" style={{ fontSize: '11px', height: '28px', color: '#dc2626', borderColor: '#dc2626' }}
                        onClick={() => setRejectModal(req)}>
                        <X className="w-3 h-3 mr-1" /> Rifiuta
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!rejectModal} onOpenChange={() => setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rifiuta Richiesta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p style={{ fontSize: '13px' }}>Motivazione per <strong>{rejectModal?.full_name}</strong></p>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Inserisci la motivazione del rifiuto..." />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Annulla</Button>
              <Button className="flex-1" style={{ backgroundColor: '#dc2626', color: '#fff', fontWeight: 700 }}
                onClick={() => rifiutaMutation.mutate({ req: rejectModal, reason: rejectReason })}>
                Conferma Rifiuto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Drive link utils ───────────────────────────────────────────────────────────

function extractDriveId(url) {
  if (!url) return null;
  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(url.trim())) return url.trim();
  return null;
}

// FIX: raw state inizializzato dal value prop; extractedId sincronizzato correttamente
function DriveLinkInput({ value, onChange }) {
  const initialId = value || null;
  const [raw, setRaw] = useState(
    initialId ? `https://drive.google.com/file/d/${initialId}/view` : ''
  );
  const [extractedId, setExtractedId] = useState(initialId);
  const [parseError, setParseError] = useState(false);
  const previewUrl = extractedId ? `https://drive.google.com/file/d/${extractedId}/preview` : null;

  const parse = (input) => {
    const id = extractDriveId(input);
    if (id) {
      setExtractedId(id);
      setParseError(false);
      onChange(id);
    } else if (input.trim()) {
      setExtractedId(null);
      setParseError(true);
      onChange('');
    }
  };

  return (
    <div style={{ border: '2px solid #C8F000', borderRadius: '12px', padding: '16px', backgroundColor: 'rgba(200,240,0,0.03)' }}>
      <p style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '13px', color: 'hsl(var(--foreground))', marginBottom: '10px' }}>
        📎 Link Google Drive
      </p>

      <textarea
        rows={2}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={e => parse(e.target.value)}
        onPaste={e => setTimeout(() => parse(e.target.value), 50)}
        placeholder="Incolla qui il link del video da Google Drive"
        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid hsl(var(--border))', fontFamily: 'Montserrat', fontSize: '13px', resize: 'none', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
      />

      <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(200,240,0,0.08)', fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontFamily: 'Montserrat', lineHeight: 1.8 }}>
        <p style={{ fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '4px' }}>💡 Come copiare il link:</p>
        <p>1. Apri il file su drive.google.com</p>
        <p>2. Tasto destro → "Condividi"</p>
        <p>3. Imposta "Chiunque con il link" → Copia</p>
        <p style={{ marginTop: '6px', color: '#f59e0b', fontWeight: 600 }}>⚠️ Il video deve essere condiviso pubblicamente, altrimenti gli allenatori non potranno vederlo.</p>
      </div>

      {extractedId && !parseError && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(22,163,74,0.1)', border: '1px solid #16a34a', fontSize: '12px', color: '#16a34a', fontFamily: 'Montserrat', fontWeight: 700, marginBottom: '10px' }}>
            ✅ Video riconosciuto!
          </div>
          <p style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginBottom: '6px', fontFamily: 'Montserrat' }}>Anteprima</p>
          <iframe
            src={previewUrl}
            width="100%"
            height="200px"
            frameBorder="0"
            allow="autoplay"
            style={{ borderRadius: '8px', border: '2px solid #C8F000', display: 'block' }}
          />
          <p style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))', marginTop: '4px', fontFamily: 'Montserrat' }}>ID estratto: {extractedId}</p>
        </div>
      )}
      {parseError && (
        <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', fontSize: '12px', color: '#92400e', fontFamily: 'Montserrat' }}>
          <p style={{ fontWeight: 700, marginBottom: '2px' }}>⚠️ Link non riconosciuto</p>
          <p>Assicurati di copiare il link direttamente da Google Drive.</p>
          <p style={{ marginTop: '4px', opacity: 0.7 }}>Esempio valido: https://drive.google.com/file/d/1BxiMV.../view</p>
        </div>
      )}
    </div>
  );
}

// ── Moduli & Lezioni Tab ───────────────────────────────────────────────────────

// FIX: corretto il nome (era ModuliLezioniiTab con doppia 'i')
function ModuliLezioniTab() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleModal, setModuleModal] = useState(false);
  const [lessonModal, setLessonModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({});
  const [lessonForm, setLessonForm] = useState({});

  const { data: modules = [] } = useQuery({ queryKey: ['course-modules'], queryFn: () => base44.entities.VideoCourseModule.list('order', 50) });
  const { data: lessons = [] } = useQuery({ queryKey: ['course-lessons'], queryFn: () => base44.entities.VideoCourseLesson.list('order', 200) });

  const createModule = useMutation({
    mutationFn: (data) => base44.entities.VideoCourseModule.create({ ...data, order: modules.length + 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-modules'] }); setModuleModal(false); setModuleForm({}); toast.success('Modulo creato'); },
  });

  const createLesson = useMutation({
    mutationFn: (data) => base44.entities.VideoCourseLesson.create({ ...data, module_id: selectedModule?.id, order: lessons.filter(l => l.module_id === selectedModule?.id).length + 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-lessons'] }); setLessonModal(false); setLessonForm({}); toast.success('Lezione creata'); },
  });

  const deleteModule = useMutation({
    mutationFn: id => base44.entities.VideoCourseModule.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['course-modules'] }); setSelectedModule(null); },
  });

  const deleteLesson = useMutation({
    mutationFn: id => base44.entities.VideoCourseLesson.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['course-lessons'] }),
  });

  const moduleLessons = lessons.filter(l => l.module_id === selectedModule?.id);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Modules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="ten-label">Moduli</p>
          <Button size="sm" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => setModuleModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Modulo
          </Button>
        </div>
        <div className="space-y-2">
          {modules.map(mod => (
            <div key={mod.id} onClick={() => setSelectedModule(mod)}
              className="cursor-pointer border rounded-lg p-3 transition-all"
              style={{ borderColor: selectedModule?.id === mod.id ? '#C8F000' : 'hsl(var(--border))', backgroundColor: selectedModule?.id === mod.id ? 'rgba(200,240,0,0.07)' : 'hsl(var(--card))' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 700, fontSize: '13px' }}>{mod.title}</p>
                  <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{lessons.filter(l => l.module_id === mod.id).length} lezioni</p>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteModule.mutate(mod.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {modules.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nessun modulo. Crea il primo!</p>}
        </div>
      </div>

      {/* Lessons */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="ten-label">{selectedModule ? `Lezioni: ${selectedModule.title}` : 'Seleziona un modulo'}</p>
          {selectedModule && (
            <Button size="sm" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => setLessonModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Lezione
            </Button>
          )}
        </div>
        {selectedModule && (
          <div className="space-y-2">
            {moduleLessons.map(l => (
              <div key={l.id} className="border rounded-lg p-3 flex items-center gap-3" style={{ borderColor: 'hsl(var(--border))' }}>
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {l.type === 'video' && (
                  <div style={{ width: '32px', height: '24px', borderRadius: '4px', backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#C8F000', fontSize: '12px' }}>▶</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p style={{ fontWeight: 600, fontSize: '13px' }} className="truncate">{l.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{l.type}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ''}</p>
                    {l.type === 'video' && (
                      <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'Montserrat', color: l.drive_file_id ? '#16a34a' : '#f59e0b' }}>
                        {l.drive_file_id ? '✅ Video collegato' : '⚠️ Nessun video'}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteLesson.mutate(l.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {moduleLessons.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nessuna lezione. Aggiungine una!</p>}
          </div>
        )}
      </div>

      {/* Module Modal */}
      <Dialog open={moduleModal} onOpenChange={setModuleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuovo Modulo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titolo *</Label><Input value={moduleForm.title || ''} onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Descrizione</Label><Textarea rows={2} value={moduleForm.description || ''} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setModuleModal(false)}>Annulla</Button>
              <Button className="flex-1" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => createModule.mutate(moduleForm)}>Crea</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={lessonModal} onOpenChange={v => { setLessonModal(v); if (!v) setLessonForm({}); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '16px' }}>
              Nuova Lezione — {selectedModule?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Titolo lezione *</Label>
              <Input value={lessonForm.title || ''} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="es. Introduzione alla tecnica individuale" className="mt-1" style={{ fontSize: '14px' }} />
            </div>

            <div>
              <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Tipo di contenuto</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {[
                  { v: 'video', l: '▶ Video' },
                  { v: 'pdf', l: '📄 PDF' },
                  { v: 'folder', l: '📁 Cartella Drive' },
                  { v: 'link_esterno', l: '🔗 Link esterno' },
                ].map(({ v, l }) => {
                  const active = (lessonForm.type || 'video') === v;
                  return (
                    <button key={v} onClick={() => setLessonForm(p => ({ ...p, type: v }))}
                      style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat', border: `2px solid ${active ? '#C8F000' : 'hsl(var(--border))'}`, backgroundColor: active ? '#C8F000' : 'transparent', color: active ? '#0A0A0A' : 'hsl(var(--muted-foreground))', transition: 'all 0.15s' }}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {(lessonForm.type === 'video' || !lessonForm.type) && (
              <DriveLinkInput
                value={lessonForm.drive_file_id || ''}
                onChange={id => setLessonForm(p => ({ ...p, drive_file_id: id, drive_embed_url: id ? `https://drive.google.com/file/d/${id}/preview` : '' }))}
              />
            )}

            {lessonForm.type === 'folder' && (
              <div>
                <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Link cartella Google Drive</Label>
                <Input className="mt-1" value={lessonForm.drive_folder_url || ''} onChange={e => setLessonForm(p => ({ ...p, drive_folder_url: e.target.value }))} placeholder="https://drive.google.com/drive/folders/..." />
              </div>
            )}

            {lessonForm.type === 'pdf' && (
              <div>
                <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>URL del PDF</Label>
                <Input className="mt-1" value={lessonForm.pdf_url || ''} onChange={e => setLessonForm(p => ({ ...p, pdf_url: e.target.value }))} placeholder="https://drive.google.com/file/d/.../view" />
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px', fontFamily: 'Montserrat' }}>Incolla il link del PDF da Google Drive o qualsiasi URL pubblico</p>
              </div>
            )}

            {lessonForm.type === 'link_esterno' && (
              <div>
                <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>URL risorsa esterna</Label>
                <Input className="mt-1" value={lessonForm.drive_folder_url || ''} onChange={e => setLessonForm(p => ({ ...p, drive_folder_url: e.target.value }))} placeholder="https://..." />
              </div>
            )}

            <div>
              <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Descrizione (opzionale)</Label>
              <Textarea className="mt-1" rows={2} value={lessonForm.description || ''} onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} placeholder="Breve descrizione del contenuto della lezione" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Durata stimata (minuti)</Label>
                <Input className="mt-1" type="number" value={lessonForm.duration_minutes || ''} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))} placeholder="es. 15" />
              </div>
              <div>
                <Label style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Ordine nel modulo</Label>
                <Input className="mt-1" type="number" value={lessonForm.order || ''} onChange={e => setLessonForm(p => ({ ...p, order: parseInt(e.target.value) }))} placeholder="auto" />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => { setLessonModal(false); setLessonForm({}); }}>Annulla</Button>
              <Button className="flex-1" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 800, fontSize: '14px' }}
                onClick={() => createLesson.mutate({ ...lessonForm, type: lessonForm.type || 'video' })}
                disabled={!lessonForm.title}>
                💾 Salva Lezione
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Quiz Builder Tab ───────────────────────────────────────────────────────────

function QuizBuilderTab() {
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState(null);
  const [questionModal, setQuestionModal] = useState(false);
  const [qForm, setQForm] = useState({ question_type: 'singola', options: ['', ''], correct_answers: [], points: 1 });

  const { data: modules = [] } = useQuery({ queryKey: ['course-modules'], queryFn: () => base44.entities.VideoCourseModule.list('order', 50) });
  const { data: questions = [] } = useQuery({ queryKey: ['quiz-questions'], queryFn: () => base44.entities.QuizQuestion.list('order', 200) });

  const createQ = useMutation({
    mutationFn: (data) => base44.entities.QuizQuestion.create({ ...data, module_id: selectedModule?.id, order: questions.filter(q => q.module_id === selectedModule?.id).length + 1, options: JSON.stringify(data.options), correct_answers: JSON.stringify(data.correct_answers) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quiz-questions'] }); setQuestionModal(false); setQForm({ question_type: 'singola', options: ['', ''], correct_answers: [], points: 1 }); toast.success('Domanda aggiunta'); },
  });

  const deleteQ = useMutation({
    mutationFn: id => base44.entities.QuizQuestion.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quiz-questions'] }),
  });

  const moduleQs = questions.filter(q => q.module_id === selectedModule?.id && !(q.question_type === 'settings' && q.order === 0));

  const addOption = () => setQForm(p => ({ ...p, options: [...p.options, ''] }));
  const setOption = (i, v) => setQForm(p => { const o = [...p.options]; o[i] = v; return { ...p, options: o }; });

  // FIX: impedisce di marcare come corretta un'opzione con testo vuoto
  const toggleCorrect = (opt) => {
    if (!opt.trim()) return;
    setQForm(p => {
      const has = p.correct_answers.includes(opt);
      if (p.question_type === 'singola' || p.question_type === 'vero_falso') {
        return { ...p, correct_answers: [opt] };
      }
      return { ...p, correct_answers: has ? p.correct_answers.filter(x => x !== opt) : [...p.correct_answers, opt] };
    });
  };

  const TYPE_COLORS = { singola: '#2563eb', multipla: '#7c3aed', vero_falso: '#16a34a', testo_libero: '#f59e0b' };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <p className="ten-label mb-3">Moduli</p>
        <div className="space-y-2">
          {modules.map(mod => {
            const count = questions.filter(q => q.module_id === mod.id && !(q.question_type === 'settings' && q.order === 0)).length;
            return (
              <div key={mod.id} onClick={() => setSelectedModule(mod)} className="cursor-pointer border rounded-lg p-3 transition-all flex items-center justify-between"
                style={{ borderColor: selectedModule?.id === mod.id ? '#C8F000' : 'hsl(var(--border))', backgroundColor: selectedModule?.id === mod.id ? 'rgba(200,240,0,0.07)' : 'hsl(var(--card))' }}>
                <p style={{ fontWeight: 700, fontSize: '13px' }}>{mod.title}</p>
                <Badge style={{ backgroundColor: count > 0 ? '#C8F000' : 'hsl(var(--muted))', color: count > 0 ? '#0A0A0A' : 'hsl(var(--muted-foreground))', fontWeight: 700 }}>{count}Q</Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {selectedModule ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="ten-label">Quiz: {selectedModule.title}</p>
              <Button size="sm" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => setQuestionModal(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Domanda
              </Button>
            </div>
            <div className="space-y-3">
              {moduleQs.map((q, i) => {
                const opts = JSON.parse(q.options || '[]');
                const correct = JSON.parse(q.correct_answers || '[]');
                return (
                  <Card key={q.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge style={{ fontSize: '10px', backgroundColor: TYPE_COLORS[q.question_type] || '#6b6b6b', color: '#fff' }}>{q.question_type}</Badge>
                          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{q.points || 1} pt</span>
                        </div>
                        <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>{i + 1}. {q.question_text}</p>
                        <div className="space-y-1">
                          {opts.map((opt, j) => (
                            <p key={j} style={{ fontSize: '12px', color: correct.includes(opt) ? '#16a34a' : 'hsl(var(--muted-foreground))', fontWeight: correct.includes(opt) ? 700 : 400 }}>
                              {correct.includes(opt) ? '✅ ' : '○ '}{opt}
                            </p>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => deleteQ.mutate(q.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </Card>
                );
              })}
              {moduleQs.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nessuna domanda ancora.</p>}
            </div>
          </>
        ) : <p className="text-sm text-muted-foreground py-8 text-center">Seleziona un modulo per gestire il quiz</p>}
      </div>

      <Dialog open={questionModal} onOpenChange={setQuestionModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Aggiungi Domanda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Testo Domanda *</Label><Textarea rows={3} value={qForm.question_text || ''} onChange={e => setQForm(p => ({ ...p, question_text: e.target.value }))} /></div>
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {['singola', 'multipla', 'vero_falso', 'testo_libero'].map(t => (
                  <button key={t} onClick={() => {
                    let opts = qForm.options;
                    if (t === 'vero_falso') opts = ['Vero', 'Falso'];
                    setQForm(p => ({ ...p, question_type: t, options: opts, correct_answers: [] }));
                  }} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `2px solid ${qForm.question_type === t ? '#C8F000' : 'hsl(var(--border))'}`, backgroundColor: qForm.question_type === t ? '#C8F000' : 'transparent', color: qForm.question_type === t ? '#0A0A0A' : 'hsl(var(--foreground))' }}>
                    {t === 'singola' ? 'Singola' : t === 'multipla' ? 'Multipla' : t === 'vero_falso' ? 'Vero/Falso' : 'Testo Libero'}
                  </button>
                ))}
              </div>
            </div>
            {qForm.question_type !== 'testo_libero' && (
              <div>
                <Label>Opzioni (clicca "✓ Corretta" per marcare)</Label>
                <div className="space-y-2 mt-1">
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Opzione ${i + 1}`} disabled={qForm.question_type === 'vero_falso'} />
                      <button
                        onClick={() => toggleCorrect(opt)}
                        disabled={!opt.trim()}
                        title={!opt.trim() ? 'Scrivi prima il testo dell\'opzione' : ''}
                        style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', cursor: opt.trim() ? 'pointer' : 'not-allowed', border: `2px solid ${qForm.correct_answers.includes(opt) ? '#16a34a' : 'hsl(var(--border))'}`, backgroundColor: qForm.correct_answers.includes(opt) ? 'rgba(22,163,74,0.1)' : 'transparent', color: qForm.correct_answers.includes(opt) ? '#16a34a' : 'hsl(var(--muted-foreground))', opacity: opt.trim() ? 1 : 0.4 }}>
                        ✓ Corretta
                      </button>
                    </div>
                  ))}
                  {qForm.question_type !== 'vero_falso' && <Button variant="outline" size="sm" onClick={addOption}>+ Opzione</Button>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Punti</Label><Input type="number" min={1} value={qForm.points || 1} onChange={e => setQForm(p => ({ ...p, points: parseInt(e.target.value) }))} /></div>
            </div>
            <div><Label>Spiegazione (opzionale)</Label><Textarea rows={2} value={qForm.explanation || ''} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setQuestionModal(false)}>Annulla</Button>
              <Button className="flex-1" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => createQ.mutate(qForm)} disabled={!qForm.question_text}>Aggiungi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Accessi Tab ────────────────────────────────────────────────────────────────

function AccessiTab() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ access_level: 'completo', active: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: accesses = [] } = useQuery({ queryKey: ['coach-accesses'], queryFn: () => base44.entities.CoachCourseAccess.list('-created_date', 100) });

  const createAccess = useMutation({
    mutationFn: data => base44.entities.CoachCourseAccess.create({ ...data, granted_date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-accesses'] }); setModal(false); setForm({ access_level: 'completo', active: true }); toast.success('Accesso concesso'); },
  });

  const revokeAccess = useMutation({
    mutationFn: id => base44.entities.CoachCourseAccess.update(id, { active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-accesses'] }); toast.success('Accesso revocato'); },
  });

  const deleteAccess = useMutation({
    mutationFn: id => base44.entities.CoachCourseAccess.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-accesses'] }); toast.success('Accesso eliminato'); setDeleteConfirm(null); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => setModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Concedi Accesso
        </Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#0A0A0A', color: '#C8F000' }}>
              {['Coach', 'Email', 'Livello', 'Scadenza', 'Data Accesso', 'Stato', 'Azioni'].map(h => (
                <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accesses.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nessun accesso</td></tr>}
            {accesses.map(a => (
              <tr key={a.id} className="border-t border-border hover:bg-accent/50">
                <td className="px-4 py-3 font-semibold" style={{ fontSize: '13px' }}>{a.coach_name}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{a.coach_email}</td>
                <td className="px-4 py-3"><Badge variant="outline" style={{ fontSize: '10px' }}>{a.access_level}</Badge></td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{a.expiry_date || '∞'}</td>
                <td className="px-4 py-3" style={{ fontSize: '12px' }}>{a.last_access || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" style={{ fontSize: '10px', color: a.active ? '#16a34a' : '#dc2626', borderColor: a.active ? '#16a34a' : '#dc2626' }}>{a.active ? 'Attivo' : 'Revocato'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.active && <button onClick={() => revokeAccess.mutate(a.id)} className="text-xs font-semibold text-destructive hover:underline">Revoca</button>}
                    <button onClick={() => setDeleteConfirm(a)} title="Elimina" style={{ padding: '4px 7px', borderRadius: '6px', border: '1.5px solid #fca5a5', backgroundColor: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '36px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', fontFamily: 'Montserrat' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#0A0A0A', marginBottom: '8px' }}>Elimina accesso videocorso</h3>
            <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.6, marginBottom: '6px' }}>Sei sicuro di voler eliminare l'accesso di:</p>
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#0A0A0A', marginBottom: '4px' }}>{deleteConfirm.coach_name}</p>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>{deleteConfirm.coach_email}</p>
            <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '24px', fontWeight: 600 }}>⚠️ Questa azione è irreversibile.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', backgroundColor: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Montserrat' }}>Annulla</button>
              <button onClick={() => deleteAccess.mutate(deleteConfirm.id)} disabled={deleteAccess.isPending} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'Montserrat', opacity: deleteAccess.isPending ? 0.6 : 1 }}>
                {deleteAccess.isPending ? '⏳ Eliminazione...' : 'Sì, elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Concedi Accesso Coach</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome Coach *</Label><Input value={form.coach_name || ''} onChange={e => setForm(p => ({ ...p, coach_name: e.target.value }))} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.coach_email || ''} onChange={e => setForm(p => ({ ...p, coach_email: e.target.value }))} /></div>
            <div>
              <Label>Livello Accesso</Label>
              <Select value={form.access_level} onValueChange={v => setForm(p => ({ ...p, access_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completo">Completo</SelectItem>
                  <SelectItem value="parziale">Parziale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Scadenza (opzionale)</Label><Input type="date" value={form.expiry_date || ''} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Annulla</Button>
              <Button className="flex-1" style={{ backgroundColor: '#C8F000', color: '#0A0A0A', fontWeight: 700 }} onClick={() => createAccess.mutate(form)} disabled={!form.coach_name || !form.coach_email}>Concedi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Attestati Tab ──────────────────────────────────────────────────────────────

function AttestatiTab() {
  const { data: certs = [] } = useQuery({ queryKey: ['all-certs'], queryFn: () => base44.entities.CoachCertification.list('-created_date', 100) });
  const queryClient = useQueryClient();

  const revokeCert = useMutation({
    mutationFn: id => base44.entities.CoachCertification.update(id, { status: 'revocato' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-certs'] }); toast.success('Attestato revocato'); },
  });

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#0A0A0A', color: '#C8F000' }}>
            {['N°', 'Coach', 'Email', 'Modulo', 'Punteggio', 'Data', 'Stato', 'Azioni'].map(h => (
              <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {certs.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nessun attestato</td></tr>}
          {certs.map(c => (
            <tr key={c.id} className="border-t border-border hover:bg-accent/50">
              <td className="px-4 py-3 font-bold" style={{ fontSize: '12px' }}>{c.cert_number}</td>
              <td className="px-4 py-3 font-semibold" style={{ fontSize: '13px' }}>{c.coach_name}</td>
              <td className="px-4 py-3" style={{ fontSize: '12px' }}>{c.coach_email}</td>
              <td className="px-4 py-3 max-w-xs truncate" style={{ fontSize: '12px' }}>{c.module_title}</td>
              <td className="px-4 py-3 font-bold" style={{ fontSize: '13px', color: '#C8F000' }}>{c.score}%</td>
              <td className="px-4 py-3" style={{ fontSize: '12px' }}>{c.issued_date}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" style={{ fontSize: '10px', color: c.status === 'attivo' ? '#16a34a' : '#dc2626', borderColor: c.status === 'attivo' ? '#16a34a' : '#dc2626' }}>{c.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => printCertificate(c)} className="text-xs font-semibold hover:underline" style={{ color: '#C8F000' }}>🖨️ Stampa</button>
                  {c.status === 'attivo' && <button onClick={() => revokeCert.mutate(c.id)} className="text-xs font-semibold text-destructive hover:underline">Revoca</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ── Stats Tab ──────────────────────────────────────────────────────────────────

function StatsTab() {
  const { data: progress = [] } = useQuery({ queryKey: ['all-progress'], queryFn: () => base44.entities.CoachLessonProgress.list('-created_date', 500) });
  const { data: lessons = [] } = useQuery({ queryKey: ['course-lessons'], queryFn: () => base44.entities.VideoCourseLesson.list('order', 200) });
  const { data: accesses = [] } = useQuery({ queryKey: ['coach-accesses'], queryFn: () => base44.entities.CoachCourseAccess.filter({ active: true }) });

  const coachStats = accesses.map(a => {
    const done = progress.filter(p => p.coach_email === a.coach_email && p.completed).length;
    const pct  = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
    return { name: a.coach_name, email: a.coach_email, completed: done, total: lessons.length, pct };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Coach con accesso', value: accesses.length },
          { label: 'Lezioni totali',    value: lessons.length },
          { label: 'Completamenti',     value: progress.filter(p => p.completed).length },
        ].map(k => (
          <Card key={k.label} className="p-5" style={{ borderLeft: '4px solid #C8F000' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>{k.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 800 }}>{k.value}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border"><p className="ten-label">Completamento per Coach</p></div>
        <div className="divide-y divide-border">
          {coachStats.map(s => (
            <div key={s.email} className="px-4 py-3 flex items-center gap-4">
              <div className="w-32 flex-shrink-0">
                <p style={{ fontSize: '13px', fontWeight: 700 }} className="truncate">{s.name}</p>
                <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{s.email}</p>
              </div>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.pct === 100 ? '#16a34a' : '#C8F000' }} />
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, width: '48px', textAlign: 'right' }}>{s.pct}%</span>
            </div>
          ))}
          {coachStats.length === 0 && <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nessun dato</p>}
        </div>
      </Card>
    </div>
  );
}

// ── Link Card ─────────────────────────────────────────────────────────────────

function LinkCard() {
  // FIX: link corretto alla pagina di registrazione/login coach, non alla root
  const registrationUrl = window.location.origin + '/accesso';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', border: '1px solid rgba(200,240,0,0.25)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p style={{ fontFamily: 'Montserrat', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(200,240,0,0.6)', marginBottom: '6px' }}>🔗 Link registrazione allenatori</p>
        <p style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>{registrationUrl}</p>
        <p style={{ fontFamily: 'Montserrat', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Gli allenatori si registrano con email e password → approvali dalla tab "Richieste".</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={copy} style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: copied ? 'rgba(22,163,74,0.2)' : 'rgba(200,240,0,0.15)', border: `1px solid ${copied ? '#16a34a' : 'rgba(200,240,0,0.4)'}`, color: copied ? '#4ade80' : '#C8F000', fontFamily: 'Montserrat', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          {copied ? '✅ Copiato!' : '📋 Copia link'}
        </button>
        <button onClick={() => window.open('/accesso', '_blank')} style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: '#C8F000', border: 'none', color: '#0A0A0A', fontFamily: 'Montserrat', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          Apri ↗
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Videocorso() {
  const { data: pendingReqs = [] } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: () => base44.entities.CourseRegistrationRequest.filter({ status: 'in_attesa' }),
  });
  const pendingCount = pendingReqs.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="ten-title">🎓 Videocorso</h1>
        <p className="ten-label mt-1">Gestione moduli, quiz, accessi e attestati</p>
      </div>
      <LinkCard />
      <Tabs defaultValue="moduli">
        <TabsList className="mb-6" style={{ backgroundColor: '#0A0A0A' }}>
          {[
            { v: 'moduli',    l: '📚 Moduli & Lezioni' },
            { v: 'richieste', l: `📥 Richieste${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { v: 'quiz',      l: '📝 Quiz' },
            { v: 'accessi',   l: '👥 Accessi' },
            { v: 'attestati', l: '🏅 Attestati' },
            { v: 'stats',     l: '📊 Statistiche' }, // FIX: tab mancante aggiunta
          ].map(t => (
            <TabsTrigger key={t.v} value={t.v} style={{ fontFamily: 'Montserrat', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="moduli">
          <div style={{ padding: '16px 20px', borderRadius: '10px', backgroundColor: '#FFFBEA', borderLeft: '4px solid #C8F000', marginBottom: '24px' }}>
            <p style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '13px', color: '#0A0A0A', marginBottom: '8px' }}>📹 Come caricare i video delle lezioni</p>
            <ol style={{ fontFamily: 'Montserrat', fontSize: '12px', color: '#3d3d1a', paddingLeft: '18px', lineHeight: 1.9, margin: '0 0 10px' }}>
              <li>Carica il video su Google Drive (o usane uno già presente)</li>
              <li>Clicca col tasto destro sul file → "Condividi"</li>
              <li>In "Accesso generale" → "Chiunque abbia il link" → "Visualizzatore"</li>
              <li>Copia il link e incollalo nel campo "Link Google Drive" della lezione</li>
              <li>L'app mostrerà un'anteprima immediata — se il video appare, è tutto ok!</li>
            </ol>
            <p style={{ fontFamily: 'Montserrat', fontSize: '11px', color: '#6b5e00', marginBottom: '10px' }}>
              💡 <strong>Suggerimento:</strong> crea una cartella Drive dedicata "TEN Training — Videocorso" e carica tutti i video lì.
            </p>
            <button onClick={() => window.open('https://drive.google.com', '_blank')} style={{ padding: '7px 16px', borderRadius: '6px', backgroundColor: '#C8F000', border: 'none', color: '#0A0A0A', fontFamily: 'Montserrat', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Apri Google Drive ↗
            </button>
          </div>
          <ModuliLezioniTab /> {/* FIX: nome corretto senza doppia 'i' */}
        </TabsContent>

        <TabsContent value="richieste"><RichiesteTab pendingCount={pendingCount} /></TabsContent>
        <TabsContent value="quiz"><QuizBuilderTab /></TabsContent>
        <TabsContent value="accessi"><AccessiTab /></TabsContent>
        <TabsContent value="attestati"><AttestatiTab /></TabsContent>
        <TabsContent value="stats"><StatsTab /></TabsContent> {/* FIX: tab aggiunta */}
      </Tabs>
    </div>
  );
}
