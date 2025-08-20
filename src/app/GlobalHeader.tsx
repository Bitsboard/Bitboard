"use client";

import React from "react";
import { Nav } from "@/components";

export default function GlobalHeader() {
  function onPost() { window.location.assign("/#post"); }
  function onToggleTheme() {
    try {
      const el = document.documentElement;
      el.classList.toggle('dark');
      localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
    } catch {}
  }
  function onAuth() { window.location.assign("/en/profile"); }
  return (
    <Nav
      onPost={onPost}
      onToggleTheme={onToggleTheme}
      dark={true}
      user={null}
      onAuth={onAuth}
      unit={"sats"}
      setUnit={() => {}}
      layout={"grid"}
      setLayout={() => {}}
    />
  );
}


