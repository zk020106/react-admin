import type { ReactNode } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { FormComponentType, FormSchema } from '@/types/admin'

// 类型：CFieldBinding。注册表渲染字段需要的最小 RHF 绑定信息（值层面，与 DOM 事件解耦）。
export interface CFieldBinding {
  // 方法：onBlur。字段失焦回调。
  onBlur: () => void
  // 方法：onChange。值变更回调，接收控件的业务值而非 DOM 事件。
  onChange: (value: unknown) => void
  // 参数：value。当前字段值。
  value: unknown
}

// 类型：SelectOption。select 控件的选项形状，从 schema.componentProps.options 读取。
export interface SelectOption {
  // 参数：label。选项展示文本，缺省时用 value。
  label?: ReactNode
  // 参数：value。选项值（Radix Select 要求字符串）。
  value: string
}

// 类型：CFieldRenderProps。renderCField 的渲染上下文。
export interface CFieldRenderProps {
  // 参数：binding。RHF 字段绑定。
  binding: CFieldBinding
  // 参数：error。校验失败时为 true；注册表把它转成 aria-invalid，
  // ui 控件已内置 aria-invalid 的红边框 + ring 样式（浅色/暗色均覆盖）。
  error?: boolean
  // 参数：id。控件 id，用于与 label 的 htmlFor 关联。
  id: string
  // 参数：schema。字段配置，componentProps 原样透传给控件。
  schema: FormSchema
}

// 函数：invalid。error → aria-invalid 属性；undefined 时不输出属性，避免污染 DOM。
function invalid(error?: boolean) {
  return { 'aria-invalid': error ? true : undefined } as const
}

// 组件：CInput。文本输入框；password 共用此前缀 type="password" 的变体。
function CInput({ binding, error, id, schema }: CFieldRenderProps) {
  const props = (schema.componentProps ?? {}) as React.ComponentProps<typeof Input>

  return (
    <Input
      {...props}
      id={id}
      {...invalid(error)}
      value={(binding.value ?? '') as string}
      onChange={event => binding.onChange(event.target.value)}
      onBlur={binding.onBlur}
    />
  )
}

// 组件：CPassword。密码输入框（旧 antd Input.Password 的等价实现）。
function CPassword(props: CFieldRenderProps) {
  const componentProps = (props.schema.componentProps ?? {}) as React.ComponentProps<typeof Input>

  return (
    <CInput
      {...props}
      schema={{ ...props.schema, componentProps: { ...componentProps, type: 'password' } }}
    />
  )
}

// 组件：CTextarea。多行文本框。
function CTextarea({ binding, error, id, schema }: CFieldRenderProps) {
  const props = (schema.componentProps ?? {}) as React.ComponentProps<typeof Textarea>

  return (
    <Textarea
      {...props}
      id={id}
      {...invalid(error)}
      value={(binding.value ?? '') as string}
      onChange={event => binding.onChange(event.target.value)}
      onBlur={binding.onBlur}
    />
  )
}

// 组件：CCheckbox。勾选框；checked 受控。
function CCheckbox({ binding, error, id, schema }: CFieldRenderProps) {
  const props = (schema.componentProps ?? {}) as React.ComponentProps<typeof Checkbox>

  return (
    <Checkbox
      {...props}
      id={id}
      {...invalid(error)}
      checked={Boolean(binding.value)}
      onCheckedChange={value => binding.onChange(value)}
      onBlur={binding.onBlur}
    />
  )
}

// 组件：CSwitch。开关；checked 受控。
function CSwitch({ binding, error, id, schema }: CFieldRenderProps) {
  const props = (schema.componentProps ?? {}) as React.ComponentProps<typeof Switch>

  return (
    <Switch
      {...props}
      id={id}
      {...invalid(error)}
      checked={Boolean(binding.value)}
      onCheckedChange={value => binding.onChange(value)}
      onBlur={binding.onBlur}
    />
  )
}

// 组件：CSelect。下拉选择（Radix Select）；选项从 componentProps.options 读取。
function CSelect({ binding, error, id, schema }: CFieldRenderProps) {
  const {
    options = [],
    placeholder,
    ...rest
  } = (schema.componentProps ?? {}) as {
    options?: SelectOption[]
    placeholder?: string
  } & React.ComponentProps<typeof Select>
  // Radix 的 value 必须是字符串；空值传 undefined 表示未选。
  // 只接受 string/number/boolean，其他类型无法对应 SelectItem，直接视为未选。
  const rawValue = binding.value
  const value =
    typeof rawValue === 'string'
      ? rawValue === ''
        ? undefined
        : rawValue
      : typeof rawValue === 'number' || typeof rawValue === 'boolean'
        ? String(rawValue)
        : undefined

  return (
    <Select {...rest} value={value} onValueChange={next => binding.onChange(next)}>
      <SelectTrigger id={id} {...invalid(error)} className="w-full">
        <SelectValue placeholder={placeholder ?? '请选择'} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label ?? option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// 组件：CDateRange。日期范围的显式降级实现。
// 背景：全项目没有生产 schema 使用 'date-range'（仅 form-api 的值转换单测引用它），
// 且项目 ui/ 暂无 DatePicker 控件，因此不静默错——用两个原生 date 输入渲染，
// 值保持 [开始, 结束] 的数组形状，与 FormApi 的 fieldMappingTime / valueFormat 转换逻辑兼容。
// 后续接入正式日期控件时，把这里替换为真正的 DateRangePicker 即可。
function CDateRange({ binding, error, schema }: CFieldRenderProps) {
  const [start, end] = (Array.isArray(binding.value) ? binding.value : []) as [
    string | undefined,
    string | undefined
  ]

  const update = (index: 0 | 1, next: string) => {
    const pair: [string | undefined, string | undefined] = [start, end]
    pair[index] = next === '' ? undefined : next
    binding.onChange(pair)
  }

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={typeof schema.label === 'string' ? schema.label : '日期范围'}
    >
      <Input
        type="date"
        aria-label="开始日期"
        {...invalid(error)}
        value={start ?? ''}
        onChange={event => update(0, event.target.value)}
        onBlur={binding.onBlur}
      />
      <span aria-hidden="true" className="shrink-0 text-sm text-muted-foreground">
        至
      </span>
      <Input
        type="date"
        aria-label="结束日期"
        {...invalid(error)}
        value={end ?? ''}
        onChange={event => update(1, event.target.value)}
        onBlur={binding.onBlur}
      />
    </div>
  )
}

// schema 组件类型到 C-UI 控件的渲染映射；componentProps 原样透传。
// 注意：'pin'（旧 antd Input.OTP）在 ui/ 暂无对应控件，按未知类型回退为普通输入框。
const fieldRegistry: Record<FormComponentType, (props: CFieldRenderProps) => ReactNode> = {
  checkbox: props => <CCheckbox {...props} />,
  'date-range': props => <CDateRange {...props} />,
  input: props => <CInput {...props} />,
  password: props => <CPassword {...props} />,
  pin: props => <CInput {...props} />,
  select: props => <CSelect {...props} />,
  switch: props => <CSwitch {...props} />,
  textarea: props => <CTextarea {...props} />
}

/** 函数：renderCField。按 schema 渲染单个表单控件；未注册类型回退为输入框（沿用旧行为）。 */
export function renderCField(props: CFieldRenderProps): ReactNode {
  const renderer = fieldRegistry[props.schema.component] ?? fieldRegistry.input

  return renderer(props)
}
