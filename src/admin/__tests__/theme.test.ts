import { afterEach, describe, expect, it } from "vitest"

import { applyVbenTheme, BUILT_IN_THEME_PRESETS } from "../theme"

describe("vben theme", () => {
  afterEach(() => {
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
    document.documentElement.removeAttribute("style")
    document.querySelector("#__vben-styles__")?.remove()
  })

  it("applies vben default light theme variables to document root", () => {
    applyVbenTheme({
      builtinType: "default",
      fontSize: 16,
      mode: "light",
      radius: "0.5",
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(document.documentElement.dataset.theme).toBe("default")
    expect(document.documentElement.style.getPropertyValue("--radius")).toBe("0.5rem")
    expect(document.documentElement.style.getPropertyValue("--font-size-base")).toBe("16px")
    expect(document.documentElement.style.getPropertyValue("--menu-font-size")).toBe("calc(16px * 0.875)")
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("212 100% 45%")
  })

  it("uses builtin dark primary color overrides where vben defines them", () => {
    const zinc = BUILT_IN_THEME_PRESETS.find((preset) => preset.type === "zinc")

    applyVbenTheme({
      builtinType: "zinc",
      fontSize: 15,
      mode: "dark",
      radius: "0.75",
    })

    expect(zinc?.darkPrimaryColor).toBe("hsl(0 0% 98%)")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.dataset.theme).toBe("zinc")
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("0 0% 98%")
    expect(document.documentElement.style.getPropertyValue("--font-size-base")).toBe("15px")
  })
})
