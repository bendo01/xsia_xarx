import { Title } from '@solidjs/meta';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../../components/student/PageHeader';
import WriteForm from '../../../../components/rectorat/WriteForm';
import { t } from '../../../../i18n';
import { createUserRow, searchAdminOptions } from '../../../../lib/admin-crud-data';
import { MIN_PASSWORD } from '../../../../lib/new-user';

/** Create a login account for an existing person; it can be usable at once or wait for email verification. */
export default function CreateUserPage() {
  const save = (v: Record<string, string | boolean>) => createUserRow(v);
  return (
    <>
      <Title>{`${t('cd.addNew')} · ${t('ad.users')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={`${t('cd.addNew')} · ${t('ad.users')}`} description={t('ad.newUserHint', { min: MIN_PASSWORD })} />
      <WriteForm
        fields={[
          { name: 'name', label: 'ad.name', kind: 'text', required: true },
          { name: 'email', label: 'ad.email', kind: 'text', required: true },
          { name: 'password', label: 'ad.password', kind: 'password', required: true },
          { name: 'individual_id', label: 'rt.person', kind: 'lookup', source: 'individual', required: true },
          { name: 'is_active', label: 'ad.activateNow', kind: 'check' },
        ]}
        initial={{ name: '', email: '', password: '', individual_id: '', is_active: true }}
        lookup={(source, q) => searchAdminOptions('auth-user', source, q)}
        save={save}
        backHref="/administrator/auth/user"
      />
    </>
  );
}
