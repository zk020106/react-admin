import { AdminSearchForm } from '@/components/admin/form/admin-search-form'
import { toFormSchema } from './field-adapter'
import type { MCSearchFormProps } from './types'

export function MCSearchForm({
  collapsedCount,
  defaultCollapsed,
  defaultValues,
  fields,
  form,
  mode,
  onReset,
  onSearch
}: MCSearchFormProps) {
  return (
    <AdminSearchForm
      collapsedCount={collapsedCount}
      defaultCollapsed={defaultCollapsed}
      defaultValues={defaultValues}
      form={form}
      mode={mode}
      onReset={onReset}
      onSearch={onSearch}
      schema={toFormSchema(fields)}
    />
  )
}
