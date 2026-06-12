# MC Table and Form Design

## Background

This project already has a first admin component layer under `src/components/admin`, including
`AdminTable`, `SchemaForm`, `AdminSearchForm`, and `AdminFormModal`. Those components are tested and
used by the current users page.

The next layer should expose a cleaner business-facing component API inspired by
`lin-97/gi-component`, especially its table and form productivity patterns. The public API should
not copy Vue or Element Plus naming directly. It should use React and Ant Design conventions, and it
should not be named `Gi*` or `Admin*`.

The new component family is named `MC`, short for Mo Chou.

## Goals

- Add `MCTable`, `MCForm`, and `MCSearchForm`.
- Keep the public API React-friendly and Ant Design-friendly.
- Reuse the existing admin implementation where that reduces risk.
- Avoid breaking existing `Admin*` components and pages.
- Make list pages express table, search, and form structure mainly through configuration.

## Non-Goals

- Do not migrate every existing page in the first implementation.
- Do not rename or remove existing `Admin*` components.
- Do not implement a full clone of Vue `gi-component`.
- Do not add dictionary loading, upload, transfer, cascader, or custom slot systems in the first
  pass unless they are already supported by the current field registry.

## Component Structure

New files should live under:

```txt
src/components/mc/
src/components/mc/table/
src/components/mc/form/
```

The public barrel export should be:

```txt
src/components/mc/index.ts
```

Recommended exports:

- `MCTable`
- `MCForm`
- `MCSearchForm`
- `type MCTableColumn`
- `type MCTableAction`
- `type MCFormField`
- `type MCFormControl`

## MCTable

`MCTable` is the list-table component. It should expose Ant Design-compatible naming and keep
table behavior predictable for React users.

Example:

```tsx
<MCTable<UserRecord>
  columns={[
    { dataIndex: 'name', key: 'name', title: 'Name' },
    {
      key: 'status',
      title: 'Status',
      render: (_, record) => <Tag>{record.status}</Tag>
    }
  ]}
  dataSource={users}
  onRefresh={refetch}
  rowKey="id"
  toolbar={<Button type="primary">Create</Button>}
  tools={{ columns: true, density: true, refresh: true }}
/>
```

### API

`MCTableProps<RecordType>` should extend the useful parts of Ant Design `TableProps<RecordType>`.

Primary props:

- `columns?: MCTableColumn<RecordType>[]`
- `dataSource?: RecordType[]`
- `actions?: MCTableAction<RecordType>[]`
- `actionColumn?: MCActionColumnConfig`
- `toolbar?: ReactNode`
- `toolbarLeft?: ReactNode`
- `tools?: { columns?: boolean; density?: boolean; refresh?: boolean }`
- `onRefresh?: () => Promise<void> | void`
- `persistKey?: string`
- `batchToolbar?: (context: MCTableBatchContext<RecordType>) => ReactNode`
- `rowSelection?: TableRowSelection<RecordType> | boolean`

Column naming should follow Ant Design:

- Use `dataIndex`, not Vue `prop`.
- Use `title`, not `label`.
- Use Ant Design `render(value, record, index)`, not Vue slot scope.
- Use `children` for nested columns.
- Use `columnLabel` only as optional metadata for the column setting panel.

Implementation can delegate to the current `AdminTable` internally. The MC type aliases can wrap or
re-export compatible admin table types while keeping the public name `MC`.

## MCForm

`MCForm` is the configuration form for create, edit, and detail-like screens. It should favor
React and Ant Design naming.

Example:

```tsx
<MCForm
  control={{
    status: { disabled: false, hidden: false, required: true }
  }}
  fields={[
    {
      component: 'input',
      componentProps: { placeholder: 'Enter username' },
      label: 'Username',
      name: 'username',
      required: true
    },
    {
      component: 'select',
      componentProps: { options: statusOptions },
      label: 'Status',
      name: 'status'
    }
  ]}
  form={form}
  grid
  layout="vertical"
  onFinish={handleSubmit}
/>
```

### API

Primary props:

- `fields: MCFormField[]`
- `form?: FormInstance`
- `layout?: 'horizontal' | 'inline' | 'vertical'`
- `grid?: boolean`
- `gutter?: number`
- `disabled?: boolean`
- `control?: MCFormControl`
- `initialValues?: Record<string, unknown>`
- `onFinish?: (values: Record<string, unknown>) => void`
- `onValuesChange?: (changedValues: Record<string, unknown>, values: Record<string, unknown>) => void`
- `children?: ReactNode`

Field naming:

- Use `fields`, not `columns`.
- Use `name`, not `field` or `fieldName`.
- Use `component`, not `type`.
- Use `componentProps`, not `props`.
- Use `hidden`, not `hide`.
- Use `help` and `extra` to match Ant Design `Form.Item`.
- Use `required` as a shorthand that prepends a required rule.

`MCFormField` should support:

- `name: string`
- `label?: ReactNode`
- `component: FormComponentType`
- `componentProps?: Record<string, unknown>`
- `formItemProps?: Omit<FormItemProps, 'name' | 'label' | 'rules'>`
- `span?: number`
- `required?: boolean | string`
- `rules?: Rule[]`
- `hidden?: boolean | ((values: Record<string, unknown>) => boolean)`
- `disabled?: boolean | ((values: Record<string, unknown>) => boolean)`
- `help?: ReactNode`
- `extra?: ReactNode`
- `defaultValue?: unknown`
- `valueFormat?: FormValueFormat`

`MCFormControl` should be:

```ts
type MCFormControl = Record<
  string,
  {
    disabled?: boolean
    hidden?: boolean
    required?: boolean | string
  }
>
```

Implementation can adapt MC fields to the existing `FormSchema` and render through `SchemaForm`.
This preserves the current field registry and existing tests.

## MCSearchForm

`MCSearchForm` is separate from `MCForm` rather than a `search` boolean on `MCForm`. This is more
idiomatic in React because the query form has distinct submit, reset, collapse, and value cleaning
behavior.

Example:

```tsx
<MCSearchForm
  collapsedCount={3}
  defaultCollapsed
  defaultValues={{ status: 'all' }}
  fields={searchFields}
  onReset={resetFilters}
  onSearch={setFilters}
/>
```

### API

Primary props:

- `fields: MCFormField[]`
- `defaultValues?: Record<string, unknown>`
- `collapsedCount?: number`
- `defaultCollapsed?: boolean`
- `form?: FormInstance`
- `onSearch: (values: Record<string, unknown>) => Promise<void> | void`
- `onReset?: () => Promise<void> | void`

Implementation can adapt fields to `AdminSearchForm`.

## Data Flow

`MCTable`:

1. Receives Ant Design-style props from the page.
2. Passes compatible props to `AdminTable`.
3. `AdminTable` owns density, column setting state, refresh loading, row selection state, and table
   rendering.

`MCForm`:

1. Receives `fields`, optional `form`, and control props.
2. Converts `MCFormField[]` to existing `FormSchema[]`.
3. Adds required rules from `required` and `control[name].required`.
4. Merges disabled and hidden behavior from field-level config plus `control`.
5. Renders through `SchemaForm`.

`MCSearchForm`:

1. Converts `fields` to `FormSchema[]`.
2. Delegates collapse, reset, search, and empty-value cleanup to `AdminSearchForm`.

## Error Handling

- `onRefresh` should keep the refresh button loading until the promise settles.
- `onSearch` and `onReset` should preserve existing `AdminSearchForm` loading behavior.
- Form validation should use Ant Design rules and keep errors inside the form.
- Unsupported field components should fall back to the current registry behavior, which renders an
  input when a component key is unknown.

## Testing

Add focused tests for the new public API:

- `MCTable` renders Ant Design-style columns and rows.
- `MCTable` passes toolbar, tools, actions, and refresh behavior through.
- `MCForm` renders fields using `name`, `component`, and `componentProps`.
- `MCForm` applies `required`, `control.hidden`, and `control.disabled`.
- `MCSearchForm` submits cleaned values and handles reset.

Existing `Admin*` tests should continue to pass unchanged.

## Open Extension Points

Later phases can add:

- `MCFormModal`
- `MCFormDrawer`
- `MCPage`
- dictionary option loading
- async field options
- richer field components
- table header search
- CRUD hooks

These should build on the MC naming and React-style API established in this design.
