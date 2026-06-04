import { createStore, type StoreApi } from "zustand/vanilla"

type BeforeClose = () => boolean | Promise<boolean>
type PopupPlacement = "bottom" | "left" | "right" | "top"

interface PopupCallbacks {
  onBeforeClose?: BeforeClose
  onCancel?: () => void
  onClosed?: () => void
  onConfirm?: () => void
  onOpenChange?: (open: boolean) => void
  onOpened?: () => void
}

export interface PopupState {
  cancelText?: string
  confirmText?: string
  footer: boolean
  fullscreen?: boolean
  header: boolean
  isOpen: boolean
  loading: boolean
  placement?: PopupPlacement
  showCancelButton: boolean
  showConfirmButton: boolean
  submitting: boolean
  title: string
}

type PopupOptions = Partial<PopupState> & PopupCallbacks

const DEFAULT_MODAL_STATE: PopupState = {
  footer: true,
  fullscreen: false,
  header: true,
  isOpen: false,
  loading: false,
  showCancelButton: true,
  showConfirmButton: true,
  submitting: false,
  title: "",
}

const DEFAULT_DRAWER_STATE: PopupState = {
  footer: true,
  header: true,
  isOpen: false,
  loading: false,
  placement: "right",
  showCancelButton: true,
  showConfirmButton: true,
  submitting: false,
  title: "",
}

class PopupApi {
  protected callbacks: PopupCallbacks
  protected data: unknown = {}
  protected store: StoreApi<PopupState>

  constructor(defaultState: PopupState, options: PopupOptions = {}) {
    const {
      onBeforeClose,
      onCancel,
      onClosed,
      onConfirm,
      onOpenChange,
      onOpened,
      ...state
    } = options

    this.callbacks = {
      onBeforeClose,
      onCancel,
      onClosed,
      onConfirm,
      onOpenChange,
      onOpened,
    }
    this.store = createStore<PopupState>()(() => ({ ...defaultState, ...state }))
    this.store.subscribe((next, previous) => {
      if (next.isOpen !== previous.isOpen) {
        this.callbacks.onOpenChange?.(next.isOpen)
      }
    })
  }

  async close() {
    const allowClose = (await this.callbacks.onBeforeClose?.()) ?? true

    if (allowClose) {
      this.setState({ isOpen: false, submitting: false })
    }

    return this
  }

  getData<T = unknown>() {
    return this.data as T
  }

  getState() {
    return this.store.getState()
  }

  lock() {
    return this.setState({ submitting: true })
  }

  onCancel() {
    if (this.callbacks.onCancel) {
      this.callbacks.onCancel()
      return this
    }

    void this.close()
    return this
  }

  onClosed() {
    if (!this.getState().isOpen) {
      this.callbacks.onClosed?.()
    }
    return this
  }

  onConfirm() {
    this.callbacks.onConfirm?.()
    return this
  }

  onOpened() {
    if (this.getState().isOpen) {
      this.callbacks.onOpened?.()
    }
    return this
  }

  open() {
    return this.setState({ isOpen: true, submitting: false })
  }

  setData<T>(payload: T) {
    this.data = payload
    return this
  }

  setState(stateOrUpdater: ((state: PopupState) => Partial<PopupState>) | Partial<PopupState>) {
    const patch =
      typeof stateOrUpdater === "function"
        ? stateOrUpdater(this.store.getState())
        : stateOrUpdater

    this.store.setState((state) => ({ ...state, ...patch }))
    return this
  }

  subscribe(listener: (state: PopupState, previousState: PopupState) => void) {
    return this.store.subscribe(listener)
  }

  unlock() {
    return this.setState({ submitting: false })
  }
}

export class ModalApi extends PopupApi {
  constructor(options: PopupOptions = {}) {
    super(DEFAULT_MODAL_STATE, options)
  }
}

export class DrawerApi extends PopupApi {
  constructor(options: PopupOptions = {}) {
    super(DEFAULT_DRAWER_STATE, options)
  }
}
