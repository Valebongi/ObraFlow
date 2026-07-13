import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Table, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';

interface Material {
  id: string;
  name: string;
  code?: string | null;
  unit: string;
  unitCost: number;
  stockTotal: number;
  stockMin?: number | null;
  description?: string | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

interface FormState {
  name: string;
  code: string;
  unit: string;
  unitCost: string;
  stockTotal: string;
  stockMin: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  code: '',
  unit: '',
  unitCost: '',
  stockTotal: '',
  stockMin: '',
  description: '',
};

export default function MaterialsPage() {
  const [rows, setRows] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, lastPage: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/materials', { params: { page, limit: 20, search } });
      setRows(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Material) => {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      code: row.code ?? '',
      unit: row.unit ?? '',
      unitCost: row.unitCost != null ? String(row.unitCost) : '',
      stockTotal: row.stockTotal != null ? String(row.stockTotal) : '',
      stockMin: row.stockMin != null ? String(row.stockMin) : '',
      description: row.description ?? '',
    });
    setError(null);
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      unit: form.unit.trim(),
      unitCost: Number(form.unitCost || 0),
      stockTotal: Number(form.stockTotal || 0),
      stockMin: form.stockMin !== '' ? Number(form.stockMin) : undefined,
      description: form.description.trim() || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/materials/${editing.id}`, payload);
      } else {
        await api.post('/materials', payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el material'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Material) => {
    if (!window.confirm(`¿Eliminar el material "${row.name}"?`)) return;
    try {
      await api.delete(`/materials/${row.id}`);
      await load();
    } catch (err) {
      window.alert(apiErrorMessage(err, 'No se pudo eliminar el material'));
    }
  };

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="p-6 flex-1">
      <PageHeader
        title="Materiales e Inventario"
        subtitle={`${meta.total} materiales`}
        actions={
          <>
            <Button variant="secondary" onClick={load}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo material
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <CardBody className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar por nombre, código o categoría..."
              className="pl-9"
            />
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Package}
            title={search ? 'Sin resultados' : 'Sin materiales'}
            description={
              search
                ? 'Probá ajustando los filtros de búsqueda'
                : 'Agregá los materiales del catálogo para hacer seguimiento de costos'
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Material</TH>
                  <TH style={{ width: 90 }}>Unidad</TH>
                  <TH style={{ width: 150 }}>Stock</TH>
                  <TH style={{ width: 130 }}>Precio unitario</TH>
                  <TH style={{ width: 130 }}>Valor stock</TH>
                  <TH style={{ width: 80 }} />
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const min = row.stockMin ?? 0;
                  const low = row.stockTotal <= min;
                  return (
                    <TR key={row.id}>
                      <TD>
                        <div className="font-medium text-text-primary">{row.name}</div>
                        {row.code && <div className="text-xs text-text-muted">{row.code}</div>}
                      </TD>
                      <TD>{row.unit}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className={low ? 'font-medium text-red-600' : 'text-text-primary'}>
                            {formatNumber(row.stockTotal)}
                          </span>
                          {low && <Badge tone="red">Stock bajo</Badge>}
                        </div>
                        <div className="text-xs text-text-muted">Mín: {formatNumber(min)}</div>
                      </TD>
                      <TD>{formatCurrency(row.unitCost)}</TD>
                      <TD>{formatCurrency(row.stockTotal * row.unitCost)}</TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(row)}
                            className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              page={meta.page}
              lastPage={meta.lastPage}
              total={meta.total}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar material' : 'Nuevo material'}
        description={
          editing ? 'Actualizá los datos del material' : 'Agregá un material al catálogo'
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="material-form" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear material'}
            </Button>
          </>
        }
      >
        <form id="material-form" onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <Field label="Nombre" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Cable eléctrico 2.5mm"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Código">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="MAT-001"
              />
            </Field>
            <Field label="Unidad" required>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="M, KG, UN..."
                required
              />
            </Field>
          </div>
          <Field label="Precio unitario" required>
            <Input
              type="number"
              min={0}
              step="any"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              placeholder="0"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stock actual" required>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.stockTotal}
                onChange={(e) => setForm({ ...form, stockTotal: e.target.value })}
                placeholder="0"
                required
              />
            </Field>
            <Field label="Stock mínimo">
              <Input
                type="number"
                min={0}
                step="any"
                value={form.stockMin}
                onChange={(e) => setForm({ ...form, stockMin: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>
          <Field label="Descripción">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalle opcional del material"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
