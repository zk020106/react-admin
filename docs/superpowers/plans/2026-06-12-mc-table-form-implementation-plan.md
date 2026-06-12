# MC Table and Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Mo Chou `MCTable`, `MCForm`, and `MCSearchForm` component API with React and Ant Design naming while reusing the existing admin component internals.

**Architecture:** Add a new `src/components/mc` public layer. `MCTable` delegates to `AdminTable`; `MCForm` and `MCSearchForm` convert React-style `fields` into the existing `FormSchema` pipeline. `SchemaForm` receives a small compatibility expansion for `initialValues`, `formItemProps`, and `onValuesChange`.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, existing `AdminTable`, `SchemaForm`, and `AdminSearchForm`.

---

## File Structure

- Create `src/components/mc/form/types.ts`: MC form public types.
- Create `src/components/mc/form/field-adapter.ts`: converts `MCFormField[]` and `MCFormControl` into existing `FormSchema[]`.
- Create `src/components/mc/form/mc-form.tsx`: React-friendly configuration form.
- Create `src/components/mc/form/mc-search-form.tsx`: React-friendly search form wrapper.
- Create `src/components/mc/form/index.ts`: form exports.
- Create `src/components/mc/table/types.ts`: MC table public type aliases.
- Create `src/components/mc/table/mc-table.tsx`: table wrapper around `AdminTable`.
- Create `src/components/mc/table/index.ts`: table exports.
- Create `src/components/mc/index.ts`: public MC barrel export.
- Modify `src/types/admin.ts`: add `formItemProps` to `FormSchema`.
- Modify `src/components/admin/form/schema-form.tsx`: accept `initialValues`, `formItemProps`, and `onValuesChange`.
- Add `src/__tests__/mc-form.test.tsx`.
- Add `src/__tests__/mc-search-form.test.tsx`.
- Add `src/__tests__/mc-table.test.tsx`.

## Task 1: MC Form Types and Field Adapter

**Files:**
- Create: `src/components/mc/form/types.ts`
- Create: `src/components/mc/form/field-adapter.ts`
- Test: `src/__tests__/mc-form.test.tsx`

- [ ] **Step 1: Write the failing adapter and form public API tests**

Create `src/__tests__/mc-form.test.tsx`:

```tsx
import { Button, Form } from 'antd'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCForm } from '@/components/mc'
import { toFormSchema } from '@/components/mc/form/field-adapter'
import type { MCFormField } from '@/components/mc'

describe('MCForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('adapts React-style field names to the existing schema shape', () => {
    const fields: MCFormField[] = [
      {
        component: 'input',
        componentProps: { placeholder: 'Enter username' },
        label: 'Username',
        name: 'username',
        required: true
      }
    ]

    expect(toFormSchema(fields)).toMatchObject([
      {
        component: 'input',
        componentProps: { placeholder: 'Enter username' },
        fieldName: 'username',
        label: 'Username'
      }
    ])
    expect(toFormSchema(fields)[0]?.rules).toEqual([
      { message: 'Please enter Username', required: true }
    ])
  })

  it('renders fields, validates required fields, and submits values', async () => {
    const onFinish = vi.fn()

    render(
      <MCForm
        fields={[
          {
            component: 'input',
            label: 'Username',
            name: 'username',
            required: true
          }
        ]}
        onFinish={onFinish}
      >
        <Button htmlType="submit">Save</Button>
      </MCForm>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Please enter Username')).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Username'), 'moc chou')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith({ username: 'moc chou' })
    })
  })

  it('applies control hidden, disabled, and required overrides', async () => {
    render(
      <MCForm
        control={{
          role: { hidden: true },
          status: { disabled: true },
          username: { required: 'Username is required by control' }
        }}
        fields={[
          { component: 'input', label: 'Username', name: 'username' },
          { component: 'input', label: 'Status', name: 'status' },
          { component: 'input', label: 'Role', name: 'role' }
        ]}
      >
        <Button htmlType="submit">Save</Button>
      </MCForm>
    )

    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Username is required by control')).toBeInTheDocument()
  })

  it('uses external form instances, initialValues, and onValuesChange', async () => {
    const onValuesChange = vi.fn()

    function Harness() {
      const [form] = Form.useForm()

      return (
        <MCForm
          fields={[{ component: 'input', label: 'Username', name: 'username' }]}
          form={form}
          initialValues={{ username: 'initial' }}
          onValuesChange={onValuesChange}
        />
      )
    }

    render(<Harness />)

    expect(screen.getByLabelText('Username')).toHaveValue('initial')
    await userEvent.clear(screen.getByLabelText('Username'))
    await userEvent.type(screen.getByLabelText('Username'), 'next')

    expect(onValuesChange).toHaveBeenLastCalledWith({ username: 'next' }, { username: 'next' })
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm vitest run src/__tests__/mc-form.test.tsx
```

Expected: FAIL because `@/components/mc`, `MCForm`, and `toFormSchema` do not exist.

- [ ] **Step 3: Add MC form public types**

Create `src/components/mc/form/types.ts`:

```ts
import type { FormInstance, FormItemProps } from 'antd'
import type { Rule } from 'antd/es/form'
import type { ReactNode } from 'react'

import type { FormComponentType, FormValueFormat } from '@/types/admin'

export type MCFormControl = Record<
  string,
  {
    disabled?: boolean
    hidden?: boolean
    required?: boolean | string
  }
>

export interface MCFormField {
  component: FormComponentType
  componentProps?: Record<string, unknown>
  defaultValue?: unknown
  disabled?: boolean | ((values: Record<string, unknown>) => boolean)
  extra?: ReactNode
  formItemProps?: Omit<FormItemProps, 'children' | 'help' | 'label' | 'name' | 'rules'>
  help?: ReactNode
  hidden?: boolean | ((values: Record<string, unknown>) => boolean)
  label?: ReactNode
  name: string
  required?: boolean | string
  rules?: Rule[]
  span?: number
  valueFormat?: FormValueFormat
}

export interface MCFormProps {
  children?: ReactNode
  control?: MCFormControl
  disabled?: boolean
  fields: MCFormField[]
  form?: FormInstance
  grid?: boolean
  gutter?: number
  initialValues?: Record<string, unknown>
  layout?: 'horizontal' | 'inline' | 'vertical'
  onFinish?: (values: Record<string, unknown>) => void
  onValuesChange?: (
    changedValues: Record<string, unknown>,
    values: Record<string, unknown>
  ) => void
}

export interface MCSearchFormProps {
  collapsedCount?: number
  defaultCollapsed?: boolean
  defaultValues?: Record<string, unknown>
  fields: MCFormField[]
  form?: FormInstance
  onReset?: () => Promise<void> | void
  onSearch: (values: Record<string, unknown>) => Promise<void> | void
}
```

- [ ] **Step 4: Add the field adapter**

Create `src/components/mc/form/field-adapter.ts`:

```ts
import type { ReactNode } from 'react'

import type { FormSchema } from '@/types/admin'
import type { MCFormControl, MCFormField } from './types'

function getLabelText(label: ReactNode) {
  return typeof label === 'string' && label.trim().length > 0 ? label : 'this field'
}

function createRequiredRule(required: boolean | string | undefined, label: ReactNode) {
  if (!required) {
    return undefined
  }

  return {
    message: typeof required === 'string' ? required : `Please enter ${getLabelText(label)}`,
    required: true
  }
}

function mergeBooleanControl(
  fieldValue: boolean | ((values: Record<string, unknown>) => boolean) | undefined,
  controlValue: boolean | undefined
) {
  if (controlValue === true) {
    return true
  }

  return fieldValue
}

export function toFormSchema(fields: MCFormField[], control: MCFormControl = {}): FormSchema[] {
  return fields.map(field => {
    const fieldControl = control[field.name]
    const required = fieldControl?.required ?? field.required
    const requiredRule = createRequiredRule(required, field.label)

    return {
      component: field.component,
      componentProps: field.componentProps,
      defaultValue: field.defaultValue,
      disabled: mergeBooleanControl(field.disabled, fieldControl?.disabled),
      extra: field.extra,
      fieldName: field.name,
      formItemProps: field.formItemProps,
      help: field.help,
      hidden: mergeBooleanControl(field.hidden, fieldControl?.hidden),
      label: field.label,
      rules: requiredRule ? [requiredRule, ...(field.rules ?? [])] : field.rules,
      span: field.span,
      valueFormat: field.valueFormat
    }
  })
}
```

- [ ] **Step 5: Run the test to confirm the missing component is the next failure**

Run:

```bash
pnpm vitest run src/__tests__/mc-form.test.tsx
```

Expected: FAIL because `MCForm` and the MC barrel export do not exist yet.

## Task 2: SchemaForm Compatibility and MCForm

**Files:**
- Modify: `src/types/admin.ts`
- Modify: `src/components/admin/form/schema-form.tsx`
- Create: `src/components/mc/form/mc-form.tsx`
- Create: `src/components/mc/form/index.ts`
- Create: `src/components/mc/index.ts`
- Test: `src/__tests__/mc-form.test.tsx`

- [ ] **Step 1: Extend `FormSchema` for form item props**

Modify `src/types/admin.ts`.

Add this import near the top:

```ts
import type { FormItemProps } from 'antd'
```

Inside `export interface FormSchema`, add:

```ts
  formItemProps?: Omit<FormItemProps, 'children' | 'help' | 'label' | 'name' | 'rules'>
```

- [ ] **Step 2: Extend `SchemaForm` props and render behavior**

Modify `src/components/admin/form/schema-form.tsx`.

Update the import:

```ts
import { Col, Form, Row, type FormInstance } from 'antd'
```

Keep the same import, then update the component props destructuring to include `initialValues` and
`onValuesChange`:

```tsx
export function SchemaForm({
  api,
  children,
  disabled = false,
  form,
  grid = false,
  gutter = 16,
  initialValues,
  layout = 'vertical',
  onFinish,
  onValuesChange
}: {
  api: FormApi
  children?: ReactNode
  disabled?: boolean
  form: FormInstance
  grid?: boolean
  gutter?: number
  initialValues?: Record<string, unknown>
  layout?: 'horizontal' | 'inline' | 'vertical'
  onFinish?: (values: Record<string, unknown>) => void
  onValuesChange?: (
    changedValues: Record<string, unknown>,
    values: Record<string, unknown>
  ) => void
}) {
```

Rename the existing local `initialValues` constant to `schemaInitialValues`, then add
`resolvedInitialValues`:

```ts
  const schemaInitialValues = Object.fromEntries(
    schema
      .filter(item => item.defaultValue !== undefined)
      .map(item => [item.fieldName, item.defaultValue])
  )
  const resolvedInitialValues = { ...schemaInitialValues, ...initialValues }
```

Spread `item.formItemProps` into `Form.Item` before the controlled props:

```tsx
      <Form.Item
        {...item.formItemProps}
        extra={item.extra}
        help={item.help}
        label={item.label}
        name={toNamePath(item.fieldName)}
        rules={item.rules as Rule[] | undefined}
        valuePropName={CHECKED_COMPONENTS.has(item.component) ? 'checked' : 'value'}
      >
```

Update the returned `Form`:

```tsx
    <Form
      form={form}
      initialValues={resolvedInitialValues}
      layout={layout}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
```

- [ ] **Step 3: Add `MCForm`**

Create `src/components/mc/form/mc-form.tsx`:

```tsx
import { Form } from 'antd'
import { useMemo } from 'react'

import { SchemaForm } from '@/components/admin/form/schema-form'
import { FormApi } from '@/utils/form-api'
import { toFormSchema } from './field-adapter'
import type { MCFormProps } from './types'

export function MCForm({
  children,
  control,
  disabled,
  fields,
  form: externalForm,
  grid,
  gutter,
  initialValues,
  layout,
  onFinish,
  onValuesChange
}: MCFormProps) {
  const [internalForm] = Form.useForm()
  const form = externalForm ?? internalForm
  const schema = useMemo(() => toFormSchema(fields, control), [control, fields])
  const api = useMemo(() => new FormApi({ schema }), [schema])

  return (
    <SchemaForm
      api={api}
      disabled={disabled}
      form={form}
      grid={grid}
      gutter={gutter}
      initialValues={initialValues}
      layout={layout}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      {children}
    </SchemaForm>
  )
}
```

- [ ] **Step 4: Add MC exports**

Create `src/components/mc/form/index.ts`:

```ts
export { MCForm } from './mc-form'
export { toFormSchema } from './field-adapter'
export type { MCFormControl, MCFormField, MCFormProps, MCSearchFormProps } from './types'
```

Create `src/components/mc/index.ts`:

```ts
export * from './form'
```

- [ ] **Step 5: Run the MC form test**

Run:

```bash
pnpm vitest run src/__tests__/mc-form.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run existing schema form tests**

Run:

```bash
pnpm vitest run src/__tests__/schema-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit form foundation**

Run:

```bash
git add src/types/admin.ts src/components/admin/form/schema-form.tsx src/components/mc src/__tests__/mc-form.test.tsx
git commit -m "feat: add MC form wrapper"
```

Expected: commit succeeds.

## Task 3: MCSearchForm

**Files:**
- Create: `src/components/mc/form/mc-search-form.tsx`
- Modify: `src/components/mc/form/index.ts`
- Test: `src/__tests__/mc-search-form.test.tsx`

- [ ] **Step 1: Write the failing MCSearchForm test**

Create `src/__tests__/mc-search-form.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCSearchForm } from '@/components/mc'
import type { MCFormField } from '@/components/mc'

const fields: MCFormField[] = [
  { component: 'input', label: 'Keyword', name: 'keyword' },
  {
    component: 'select',
    componentProps: { options: [{ label: 'Enabled', value: 'enabled' }] },
    label: 'Status',
    name: 'status'
  },
  { component: 'input', label: 'Department', name: 'department' }
]

describe('MCSearchForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a collapsed search form and submits cleaned values', async () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()

    render(
      <MCSearchForm
        collapsedCount={2}
        defaultValues={{ status: 'enabled' }}
        fields={fields}
        onReset={onReset}
        onSearch={onSearch}
      />
    )

    expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Keyword'), 'audit')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    expect(onSearch).toHaveBeenLastCalledWith({ keyword: 'audit', status: 'enabled' })

    await userEvent.click(screen.getByRole('button', { name: '展开' }))
    expect(screen.getByLabelText('Department')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Keyword'))
    await userEvent.click(screen.getByRole('button', { name: '重置' }))

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenLastCalledWith({ status: 'enabled' })
  })
})
```

- [ ] **Step 2: Run the new search form test to verify it fails**

Run:

```bash
pnpm vitest run src/__tests__/mc-search-form.test.tsx
```

Expected: FAIL because `MCSearchForm` is not exported.

- [ ] **Step 3: Add `MCSearchForm`**

Create `src/components/mc/form/mc-search-form.tsx`:

```tsx
import { AdminSearchForm } from '@/components/admin/form/admin-search-form'
import { toFormSchema } from './field-adapter'
import type { MCSearchFormProps } from './types'

export function MCSearchForm({
  collapsedCount,
  defaultCollapsed,
  defaultValues,
  fields,
  form,
  onReset,
  onSearch
}: MCSearchFormProps) {
  return (
    <AdminSearchForm
      collapsedCount={collapsedCount}
      defaultCollapsed={defaultCollapsed}
      defaultValues={defaultValues}
      form={form}
      onReset={onReset}
      onSearch={onSearch}
      schema={toFormSchema(fields)}
    />
  )
}
```

- [ ] **Step 4: Export `MCSearchForm`**

Modify `src/components/mc/form/index.ts`:

```ts
export { MCForm } from './mc-form'
export { MCSearchForm } from './mc-search-form'
export { toFormSchema } from './field-adapter'
export type { MCFormControl, MCFormField, MCFormProps, MCSearchFormProps } from './types'
```

- [ ] **Step 5: Run MC search form tests**

Run:

```bash
pnpm vitest run src/__tests__/mc-search-form.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run existing search form tests**

Run:

```bash
pnpm vitest run src/__tests__/admin-search-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit search form**

Run:

```bash
git add src/components/mc/form src/__tests__/mc-search-form.test.tsx
git commit -m "feat: add MC search form"
```

Expected: commit succeeds.

## Task 4: MCTable

**Files:**
- Create: `src/components/mc/table/types.ts`
- Create: `src/components/mc/table/mc-table.tsx`
- Create: `src/components/mc/table/index.ts`
- Modify: `src/components/mc/index.ts`
- Test: `src/__tests__/mc-table.test.tsx`

- [ ] **Step 1: Write the failing MCTable test**

Create `src/__tests__/mc-table.test.tsx`:

```tsx
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MCTable } from '@/components/mc'
import type { MCTableAction, MCTableColumn } from '@/components/mc'

interface UserRecord {
  id: string
  name: string
  status: string
}

const dataSource: UserRecord[] = [
  { id: '1', name: 'Moc Chou', status: 'enabled' },
  { id: '2', name: 'Operator', status: 'disabled' }
]

const columns: MCTableColumn<UserRecord>[] = [
  { dataIndex: 'name', key: 'name', title: 'Name' },
  {
    dataIndex: 'status',
    key: 'status',
    render: value => <span>Status: {value}</span>,
    title: 'Status'
  }
]

describe('MCTable', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('renders Ant Design-style columns, rows, and toolbar', () => {
    render(
      <MCTable<UserRecord>
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        toolbar={<button type="button">Create user</button>}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Moc Chou')).toBeInTheDocument()
    expect(screen.getByText('Status: enabled')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })

  it('passes refresh and column setting tools through', async () => {
    const onRefresh = vi.fn()

    render(
      <MCTable<UserRecord>
        columns={columns}
        dataSource={dataSource}
        onRefresh={onRefresh}
        persistKey="mc:user:table"
        rowKey="id"
        tools={{ columns: true, refresh: true }}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: '刷新表格' }))
    expect(onRefresh).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: '列设置' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Status' }))

    expect(within(screen.getByRole('table')).queryByText('Status')).not.toBeInTheDocument()
  })

  it('renders action columns through MC action types', async () => {
    const edit = vi.fn()
    const actions: MCTableAction<UserRecord>[] = [
      { key: 'edit', label: 'Edit', onClick: edit }
    ]

    render(
      <MCTable<UserRecord>
        actions={actions}
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
      />
    )

    expect(screen.getByText('操作')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(edit).toHaveBeenCalledWith(dataSource[0])
  })
})
```

- [ ] **Step 2: Run the new table test to verify it fails**

Run:

```bash
pnpm vitest run src/__tests__/mc-table.test.tsx
```

Expected: FAIL because `MCTable` and table types do not exist.

- [ ] **Step 3: Add MC table types**

Create `src/components/mc/table/types.ts`:

```ts
import type { AnyObject } from 'antd/es/_util/type'

import type { AdminTableProps, AdminTableTools } from '@/components/admin/table/admin-table'
import type {
  AdminActionColumnConfig,
  AdminColumn,
  AdminTableAction,
  AdminTableBatchContext
} from '@/components/admin/table/types'

export type MCActionColumnConfig = AdminActionColumnConfig
export type MCTableAction<RecordType extends AnyObject> = AdminTableAction<RecordType>
export type MCTableBatchContext<RecordType extends AnyObject> = AdminTableBatchContext<RecordType>
export type MCTableColumn<RecordType extends AnyObject> = AdminColumn<RecordType>
export type MCTableProps<RecordType extends AnyObject> = AdminTableProps<RecordType>
export type MCTableTools = AdminTableTools
```

- [ ] **Step 4: Add `MCTable`**

Create `src/components/mc/table/mc-table.tsx`:

```tsx
import type { AnyObject } from 'antd/es/_util/type'

import { AdminTable } from '@/components/admin/table/admin-table'
import type { MCTableProps } from './types'

export function MCTable<RecordType extends AnyObject>(props: MCTableProps<RecordType>) {
  return <AdminTable<RecordType> {...props} />
}
```

- [ ] **Step 5: Add table exports and update MC barrel**

Create `src/components/mc/table/index.ts`:

```ts
export { MCTable } from './mc-table'
export type {
  MCActionColumnConfig,
  MCTableAction,
  MCTableBatchContext,
  MCTableColumn,
  MCTableProps,
  MCTableTools
} from './types'
```

Modify `src/components/mc/index.ts`:

```ts
export * from './form'
export * from './table'
```

- [ ] **Step 6: Run MC table tests**

Run:

```bash
pnpm vitest run src/__tests__/mc-table.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Run existing admin table tests**

Run:

```bash
pnpm vitest run src/__tests__/admin-table.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit table wrapper**

Run:

```bash
git add src/components/mc/table src/components/mc/index.ts src/__tests__/mc-table.test.tsx
git commit -m "feat: add MC table wrapper"
```

Expected: commit succeeds.

## Task 5: Final Verification and Documentation Touchpoint

**Files:**
- Modify: `docs/admin-components-roadmap.md`

- [ ] **Step 1: Add MC component note to roadmap**

Append this section near the first-phase component usage area in `docs/admin-components-roadmap.md`:

```md
### MC 组件层

新增业务侧组件命名使用 `MC` 前缀，代表莫愁组件层。`MCTable`、`MCForm` 和
`MCSearchForm` 的能力参考 `gi-component` 的 table/form 思路，但对外属性采用 React 和
Ant Design 习惯命名，例如 `dataSource`、`fields`、`name`、`component`、
`componentProps` 和 `control`。现有 `Admin*` 组件继续作为底层实现和兼容层保留。
```

- [ ] **Step 2: Run targeted tests**

Run:

```bash
pnpm vitest run src/__tests__/mc-form.test.tsx src/__tests__/mc-search-form.test.tsx src/__tests__/mc-table.test.tsx src/__tests__/schema-form.test.tsx src/__tests__/admin-search-form.test.tsx src/__tests__/admin-table.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
pnpm exec tsc -b --pretty false
```

Expected: exits with code 0 and no TypeScript errors.

- [ ] **Step 4: Run lint**

Run:

```bash
pnpm lint
```

Expected: exits with code 0 and no lint errors.

- [ ] **Step 5: Run format check**

Run:

```bash
pnpm format:check
```

Expected: exits with code 0. If formatting fails, run `pnpm format`, then rerun `pnpm format:check`.

- [ ] **Step 6: Inspect git status**

Run:

```bash
git status --short
```

Expected: only the intended MC component, tests, and roadmap files are modified.

- [ ] **Step 7: Commit final docs and formatting**

Run:

```bash
git add docs/admin-components-roadmap.md src/components/admin/form/schema-form.tsx src/types/admin.ts src/components/mc src/__tests__/mc-form.test.tsx src/__tests__/mc-search-form.test.tsx src/__tests__/mc-table.test.tsx
git commit -m "docs: document MC component layer"
```

Expected: commit succeeds if there are remaining changes after the prior task commits.

## Self-Review

- Spec coverage: `MCTable`, `MCForm`, `MCSearchForm`, MC naming, React-style props, reuse of existing admin internals, and test coverage are all mapped to tasks.
- Placeholder scan: no unresolved placeholders are present in the implementation steps.
- Type consistency: `MCFormField`, `MCFormControl`, `MCTableColumn`, `MCTableAction`, `toFormSchema`, `MCTable`, `MCForm`, and `MCSearchForm` are named consistently across tests, implementation, and exports.
