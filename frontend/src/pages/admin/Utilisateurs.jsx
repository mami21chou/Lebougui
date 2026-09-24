import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Users, Ban, Check, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { AdminService } from '../../services/adminService';
import {
  AdminPage, SummaryCard, SearchInput, Tabs, Toolbar, DataTable, StatusPill,
  Avatar, ActionButton, ConfirmDialog, LoadingState, ErrorState,
  useAdminQuery, useToast, formatDate, nameOf, formatNumber,
} from '../../components/AdminUI';

const isVerified = (u) => Boolean(u.profil_pecheur?.est_verifie || u.profil_livreur?.est_verifie);
const joinedAt = (u) => u.date_creation ?? u.date_joined ?? u.created_at;

/**
 * Liste d'utilisateurs filtrée par rôle.
 * - verifiable : le rôle nécessite une validation (pêcheur, livreur)
 */
export default function UsersList({ role, title, subtitle, icon, color, verifiable = false, singular }) {
  const { data, loading, error, reload } = useAdminQuery(() => AdminService.getUtilisateurs());
  const { toast, notify } = useToast();
  const [tab, setTab] = useState('tous');
  const [term, setTerm] = useState('');
  const [toRefuse, setToRefuse] = useState(null);

  const users = useMemo(() => (Array.isArray(data) ? data.filter((u) => u.role === role) : []), [data, role]);

  const counts = useMemo(() => {
    const verified = users.filter(isVerified).length;
    return {
      total: users.length,
      verified,
      pending: users.length - verified,
      active: users.filter((u) => u.is_active !== false).length,
    };
  }, [users]);

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return users.filter((u) => {
      if (verifiable && tab === 'attente' && isVerified(u)) return false;
      if (verifiable && tab === 'verifies' && !isVerified(u)) return false;
      if (!q) return true;
      return `${u.prenom || ''} ${u.nom || ''} ${u.telephone || ''}`.toLowerCase().includes(q);
    });
  }, [users, tab, term, verifiable]);

  const valider = async (u) => {
    try {
      await AdminService.validerUtilisateur(u.id);
      notify(`${nameOf(u)} a été validé`);
      reload(true);
    } catch (err) {
      console.error(err);
      notify('La validation a échoué', 'error');
    }
  };

  const refuser = async () => {
    const u = toRefuse;
    try {
      await AdminService.refuserUtilisateur(u.id);
      notify(`La demande de ${nameOf(u)} a été refusée`);
      reload(true);
    } catch (err) {
      console.error(err);
      notify('Le refus a échoué', 'error');
    } finally {
      setToRefuse(null);
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'Utilisateur',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.prenom || u.nom} color={color} />
          <p className="truncate font-semibold text-slate-900">{nameOf(u)}</p>
        </div>
      ),
    },
    { key: 'telephone', header: 'Téléphone', render: (u) => u.telephone || '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (u) => {
        if (verifiable) {
          return isVerified(u) ? (
            <StatusPill tone="success" icon={CheckCircle2}>Vérifié</StatusPill>
          ) : (
            <StatusPill tone="warning" icon={Clock}>En attente</StatusPill>
          );
        }
        return u.is_active === false ? (
          <StatusPill tone="danger" icon={Ban}>Suspendu</StatusPill>
        ) : (
          <StatusPill tone="success" icon={CheckCircle2}>Actif</StatusPill>
        );
      },
    },
    { key: 'date', header: 'Inscription', render: (u) => formatDate(joinedAt(u)) },
  ];

  if (verifiable) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) =>
        isVerified(u) ? null : (
          <div className="flex justify-end gap-2">
            <ActionButton variant="primary" icon={Check} onClick={() => valider(u)}>
              Valider
            </ActionButton>
            <ActionButton variant="danger" icon={X} onClick={() => setToRefuse(u)}>
              Refuser
            </ActionButton>
          </div>
        ),
    });
  }

  const tabs = verifiable
    ? [
        { id: 'tous', label: 'Tous', count: counts.total },
        { id: 'attente', label: 'En attente', count: counts.pending },
        { id: 'verifies', label: 'Vérifiés', count: counts.verified },
      ]
    : null;

  return (
    <AdminLayout title={title} subtitle={subtitle}>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <AdminPage>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <SummaryCard label={`Total ${title.toLowerCase()}`} value={formatNumber(counts.total)} icon={icon} color={color} />
            {verifiable ? (
              <>
                <SummaryCard label="À valider" value={formatNumber(counts.pending)} icon={Clock} color="#F59E0B" />
                <SummaryCard label="Vérifiés" value={formatNumber(counts.verified)} icon={CheckCircle2} color="#0A8A5F" />
              </>
            ) : (
              <>
                <SummaryCard label="Comptes actifs" value={formatNumber(counts.active)} icon={Users} color="#0A8A5F" />
                <SummaryCard label="Comptes suspendus" value={formatNumber(counts.total - counts.active)} icon={Ban} color="#E11D48" />
              </>
            )}
          </div>

          <Toolbar>
            {tabs ? <Tabs tabs={tabs} value={tab} onChange={setTab} /> : <div />}
            <SearchInput value={term} onChange={setTerm} placeholder="Nom ou téléphone" />
          </Toolbar>

          <DataTable
            columns={columns}
            rows={rows}
            emptyText={term ? 'Aucun résultat pour cette recherche.' : `Aucun ${singular || 'utilisateur'} pour le moment.`}
          />
        </AdminPage>
      )}

      <ConfirmDialog
        open={Boolean(toRefuse)}
        title="Refuser cette demande ?"
        message={`Le compte de ${nameOf(toRefuse)} ne sera pas validé. Cette action est définitive.`}
        confirmLabel="Refuser"
        onConfirm={refuser}
        onCancel={() => setToRefuse(null)}
      />
      {toast}
    </AdminLayout>
  );
}