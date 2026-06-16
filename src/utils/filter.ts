/**
 * 把任意值归一化为小写去空格的字符串，用于列表页关键词匹配。
 *
 * 仅 string 会进入匹配，其余类型（number/boolean/object/null/undefined）一律视为无关键词，
 * 避免对 unknown 调 String() 产生 "[object Object]"。
 *
 * 典型场景：配合 useTable 的 filter 函数，对筛选条件与记录字段做大小写无关的包含判断。
 */
export function normalizeKeyword(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}
