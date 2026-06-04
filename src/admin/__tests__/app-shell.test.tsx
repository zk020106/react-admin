import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import App from "../../App"
import { preferenceStore } from "../preferences"

describe("admin app shell", () => {
  afterEach(() => {
    cleanup()
    preferenceStore.getState().resetPreferences()
    document.body.style.pointerEvents = ""
    document.body.removeAttribute("data-scroll-locked")
  })

  it("renders the vben-style admin shell and opens preferences", async () => {
    preferenceStore.getState().resetPreferences()
    render(<App />)

    expect(screen.getByRole("heading", { name: "Vben React Admin" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Preferences" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Dashboard" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Users/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Preferences" }))

    expect(screen.getByRole("dialog", { name: "Preferences" })).toBeInTheDocument()
    expect(screen.getByText("Navigation mode")).toBeInTheDocument()
  })

  it("renders menu records in the header when header layout is selected", () => {
    preferenceStore.getState().resetPreferences()
    preferenceStore.getState().setPreferences({ layout: "header-nav" })

    render(<App />)

    const headerNavigation = screen.getByRole("navigation", {
      name: "Header navigation",
    })

    expect(headerNavigation).toBeInTheDocument()
    expect(headerNavigation).toHaveTextContent("Dashboard")
    expect(headerNavigation).toHaveTextContent("System")
    expect(screen.queryByText("Admin suite")).not.toBeInTheDocument()
  })
})
