import { afterEach, describe, expect, it } from 'vitest'

import { applyAdminTheme, BUILT_IN_THEME_PRESETS } from '@/theme'

describe('admin theme', () => {
  afterEach(() => {
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('style')
    document.querySelector('#__admin-theme-styles__')?.remove()
  })

  it('applies admin default light theme variables to document root', () => {
    applyAdminTheme({
      builtinType: 'default',
      fontSize: 16,
      mode: 'light',
      radius: '0.5'
    })

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('default')
    expect(document.documentElement.style.getPropertyValue('--radius')).toBe('0.5rem')
    expect(document.documentElement.style.getPropertyValue('--font-size-base')).toBe('16px')
    expect(document.documentElement.style.getPropertyValue('--menu-font-size')).toBe(
      'calc(16px * 0.875)'
    )
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('212 100% 45%')
    expect(document.documentElement.style.getPropertyValue('--semi-border-radius-small')).toBe(
      '0.5rem'
    )
    expect(document.documentElement.style.getPropertyValue('--semi-color-primary')).toBe('#006be6')
    expect(document.body.style.getPropertyValue('--semi-border-radius-small')).toBe('0.5rem')
    expect(document.documentElement.style.getPropertyValue('--sidebar-active')).toBe(
      'var(--primary) / 15%'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-active-foreground')).toBe(
      'var(--primary)'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-active-indicator')).toBe(
      'var(--primary)'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-hover-foreground')).toBe(
      '210 6% 21%'
    )
  })

  it('synchronizes 0px sharp corners to Semi Design tokens', () => {
    applyAdminTheme({
      builtinType: 'default',
      fontSize: 16,
      mode: 'light',
      radius: '0'
    })

    expect(document.documentElement.style.getPropertyValue('--semi-border-radius-small')).toBe(
      '0px'
    )
    expect(document.documentElement.style.getPropertyValue('--semi-border-radius-medium')).toBe(
      '0px'
    )
    expect(document.documentElement.style.getPropertyValue('--semi-border-radius-large')).toBe(
      '0px'
    )
    expect(document.body.style.getPropertyValue('--semi-border-radius-small')).toBe('0px')
  })

  it('uses builtin dark primary color overrides where admin presets define them', () => {
    const zinc = BUILT_IN_THEME_PRESETS.find(preset => preset.type === 'zinc')

    applyAdminTheme({
      builtinType: 'zinc',
      fontSize: 15,
      mode: 'dark',
      radius: '0.75'
    })

    expect(zinc?.darkPrimaryColor).toBe('hsl(0 0% 98%)')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('zinc')
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('0 0% 98%')
    expect(document.documentElement.style.getPropertyValue('--font-size-base')).toBe('15px')
  })

  it('applies admin dark sidebar menu surface variables', () => {
    applyAdminTheme({
      builtinType: 'default',
      fontSize: 16,
      mode: 'dark',
      radius: '0.5'
    })

    expect(document.documentElement.style.getPropertyValue('--sidebar')).toBe(
      '222.34deg 10.43% 12.27%'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-deep')).toBe(
      '220deg 13.06% 9%'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-hover')).toBe('216 5% 24%')
    expect(document.documentElement.style.getPropertyValue('--sidebar-hover-foreground')).toBe(
      '0 0% 95%'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-active')).toBe('216 5% 19%')
    expect(document.documentElement.style.getPropertyValue('--sidebar-active-foreground')).toBe(
      '0 0% 95%'
    )
    expect(document.documentElement.style.getPropertyValue('--sidebar-active-indicator')).toBe(
      '0 0% 95%'
    )
  })

  it('applies cyber-blue theme preset correctly in light and dark modes', () => {
    const cyberPreset = BUILT_IN_THEME_PRESETS.find(preset => preset.type === 'cyber-blue')
    expect(cyberPreset).toBeDefined()
    expect(cyberPreset?.color).toBe('#07bdfd')

    // Light mode
    applyAdminTheme({
      builtinType: 'cyber-blue',
      fontSize: 16,
      mode: 'light',
      radius: '0.5'
    })
    expect(document.documentElement.dataset.theme).toBe('cyber-blue')
    expect(document.documentElement.style.getPropertyValue('--semi-color-primary')).toBe('#006be6')

    // Dark mode
    applyAdminTheme({
      builtinType: 'cyber-blue',
      fontSize: 16,
      mode: 'dark',
      radius: '0.5'
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--semi-color-primary')).toBe('#07bdfd')
  })
})
