// 类型：PageQuery。分页请求参数，可与服务端筛选条件合并使用。
export interface PageQuery {
  /** 当前页码，从 1 开始。 */
  page: number
  /** 每页条数。 */
  size: number
}

// 类型：PageRes。分页响应结构，list 为当前页数据，total 为满足筛选条件的总条数。
export interface PageRes<T> {
  /** 当前页数据。 */
  list: T[]
  /** 满足筛选条件的总条数（非当前页条数）。 */
  total: number
}
