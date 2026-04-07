import { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { injectDashStyles } from "../styles/dashstyles";
import API from "../api.js";

injectDashStyles();

const STYLE_ID = "campus-layout-v4";
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --sw:   240px;
      --swc:   68px;
      --hh:    58px;
      --acc:  #3b82f6;
      --acc2: #8b5cf6;
      --acc3: #06b6d4;
    }

    /* ══════════════════════════════════════
       ANIMATED BACKGROUND
    ══════════════════════════════════════ */
    .layout-shell {
      display: flex;
      min-height: 100vh;
      background: #03030d;
      position: relative;
      overflow: hidden;
    }

    /* mesh gradient base */
    .layout-shell::before {
      content: '';
      position: fixed; inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 10% 0%,   rgba(59,130,246,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 100%, rgba(139,92,246,0.10) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 50% 50%,  rgba(6,182,212,0.05)  0%, transparent 70%);
      pointer-events: none; z-index: 0;
    }

    /* floating ambient orbs */
    .bg-orb {
      position: fixed; border-radius: 50%;
      filter: blur(100px); pointer-events: none;
      z-index: 0; animation: orbFloat 18s ease-in-out infinite alternate;
    }
    .bg-orb-1 {
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%);
      top: -200px; left: -100px;
      animation-duration: 20s;
    }
    .bg-orb-2 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%);
      bottom: -150px; right: -100px;
      animation-duration: 16s; animation-delay: -7s;
    }
    .bg-orb-3 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%);
      top: 40%; left: 45%;
      animation-duration: 24s; animation-delay: -12s;
    }
    @keyframes orbFloat {
      0%   { transform: translate(0,0)    scale(1);    }
      33%  { transform: translate(40px,-50px) scale(1.07); }
      66%  { transform: translate(-30px,35px) scale(0.94); }
      100% { transform: translate(20px,-20px) scale(1.03); }
    }

    /* subtle grid lines */
    .bg-grid {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
    }

    /* ══════════════════════════════════════
       TOP HEADER
    ══════════════════════════════════════ */
    .top-bar {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--hh); z-index: 300;
      background: rgba(3,3,15,0.75);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; padding: 0 16px 0 0;
      animation: headerSlide 0.5s cubic-bezier(.22,1,.36,1) both;
    }
    /* glow line under header */
    .top-bar::after {
      content: '';
      position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(59,130,246,0.5) 30%,
        rgba(139,92,246,0.5) 60%,
        transparent 100%);
    }
    @keyframes headerSlide {
      from { opacity:0; transform: translateY(-100%); }
      to   { opacity:1; transform: none; }
    }

    .top-bar-left {
      display: flex; align-items: center; gap: 13px;
      width: var(--sw); min-width: var(--sw);
      padding: 0 16px; height: 100%;
      border-right: 1px solid rgba(255,255,255,0.05);
      transition: width 0.32s cubic-bezier(.22,1,.36,1),
                  min-width 0.32s cubic-bezier(.22,1,.36,1);
      overflow: hidden;
    }
    .top-bar-left.collapsed { width: var(--swc); min-width: var(--swc); }

    /* hamburger */
    .hbg {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; cursor: pointer; flex-shrink: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 5px;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .hbg:hover {
      background: rgba(59,130,246,0.15);
      border-color: rgba(59,130,246,0.35);
      box-shadow: 0 0 12px rgba(59,130,246,0.2);
    }
    .hbg span {
      display: block; height: 2px; border-radius: 2px;
      background: rgba(255,255,255,0.75);
      transition: transform 0.28s cubic-bezier(.22,1,.36,1),
                  opacity 0.2s, width 0.28s;
    }
    .hbg span:nth-child(1) { width: 16px; }
    .hbg span:nth-child(2) { width: 11px; }
    .hbg span:nth-child(3) { width: 16px; }
    .hbg.open span:nth-child(1) { width:16px; transform: translateY(7px) rotate(45deg); }
    .hbg.open span:nth-child(2) { opacity:0; transform: scaleX(0); }
    .hbg.open span:nth-child(3) { width:16px; transform: translateY(-7px) rotate(-45deg); }

    .top-bar-brand {
      display: flex; align-items: center; gap: 9px;
      overflow: hidden; white-space: nowrap;
      transition: opacity 0.2s, transform 0.2s;
    }
    .top-bar-brand.hidden { opacity:0; transform: translateX(-8px); pointer-events: none; }

    .brand-icon {
      width: 30px; height: 30px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 9px; font-size: 15px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 16px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .brand-icon:hover { transform: rotate(-10deg) scale(1.12); box-shadow: 0 0 24px rgba(139,92,246,0.6); }

    .brand-name {
      font-size: 16px; font-weight: 800; color: #fff; letter-spacing: -0.3px;
      background: linear-gradient(135deg, #fff 40%, rgba(139,92,246,0.9));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .top-bar-center { flex: 1; display: flex; align-items: center; padding-left: 20px; }
    .top-bar-page-title {
      font-size: 14px; font-weight: 700;
      color: rgba(255,255,255,0.7); letter-spacing: -0.1px;
    }

    .top-bar-right { display: flex; align-items: center; gap: 10px; }

    /* notification dot */
    .notif-btn {
      width: 34px; height: 34px; position: relative;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      transition: background 0.2s;
    }
    .notif-btn:hover { background: rgba(255,255,255,0.1); }
    .notif-dot {
      position: absolute; top: 6px; right: 7px;
      width: 7px; height: 7px; border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239,68,68,0.8);
      animation: pulse 1.8s ease infinite;
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity:1; }
      50%      { transform: scale(1.3); opacity:0.7; }
    }

    .top-bar-avatar {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%; font-size: 13px; font-weight: 800; color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; overflow: hidden;
      box-shadow: 0 0 0 2px rgba(59,130,246,0.35), 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .top-bar-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .top-bar-avatar:hover {
      transform: scale(1.1);
      box-shadow: 0 0 0 3px rgba(139,92,246,0.5), 0 6px 16px rgba(0,0,0,0.4);
    }

    /* ══════════════════════════════════════
       SIDEBAR
    ══════════════════════════════════════ */
    .sidebar {
      position: fixed; top: var(--hh); left: 0; bottom: 0;
      width: var(--sw); z-index: 200;
      background: rgba(5,5,18,0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-right: 1px solid rgba(255,255,255,0.05);
      display: flex; flex-direction: column;
      padding: 16px 10px;
      overflow-y: auto; overflow-x: hidden;
      transition: width 0.32s cubic-bezier(.22,1,.36,1);
      animation: sidebarIn 0.45s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes sidebarIn {
      from { opacity:0; transform: translateX(-20px); }
      to   { opacity:1; transform: none; }
    }
    /* glow edge */
    .sidebar::after {
      content: '';
      position: absolute; top: 0; right: -1px; bottom: 0; width: 1px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(59,130,246,0.3) 30%,
        rgba(139,92,246,0.3) 70%,
        transparent 100%);
    }
    .sidebar.collapsed { width: var(--swc); }
    .sidebar::-webkit-scrollbar { width: 3px; }
    .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }

    /* section labels */
    .nav-sec {
      font-size: 10px; font-weight: 700; letter-spacing: 1.3px;
      color: rgba(255,255,255,0.18); text-transform: uppercase;
      padding: 0 11px; margin: 16px 0 5px;
      white-space: nowrap; overflow: hidden;
      transition: opacity 0.2s;
    }
    .sidebar.collapsed .nav-sec { opacity: 0; }

    /* nav items */
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 10px 12px; border-radius: 12px;
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px; font-weight: 500;
      color: rgba(255,255,255,0.4);
      text-decoration: none; position: relative;
      white-space: nowrap; overflow: hidden;
      margin-bottom: 2px;
      transition: background 0.18s, color 0.18s,
                  transform 0.18s, padding 0.32s;
      animation: navItemIn 0.4s ease both;
    }
    .sidebar.collapsed .nav-item {
      padding: 10px; justify-content: center;
    }
    .sidebar.collapsed .nav-label { display: none; }

    /* left accent bar */
    .nav-item::before {
      content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; border-radius: 0 3px 3px 0;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      transform: scaleY(0); transition: transform 0.2s cubic-bezier(.22,1,.36,1);
    }
    /* right glow on active */
    .nav-item::after {
      content: ''; position: absolute; right: 8px; top: 50%;
      transform: translateY(-50%) scale(0);
      width: 6px; height: 6px; border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 8px #3b82f6;
      transition: transform 0.2s;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.85);
      transform: translateX(3px);
    }
    .sidebar.collapsed .nav-item:hover { transform: scale(1.08); }

    .nav-item.active {
      background: linear-gradient(135deg,
        rgba(59,130,246,0.18) 0%,
        rgba(139,92,246,0.12) 100%);
      color: #93c5fd; font-weight: 600;
      border: 1px solid rgba(59,130,246,0.2);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05),
                  0 4px 16px rgba(59,130,246,0.1);
    }
    .nav-item.active::before { transform: scaleY(1); }
    .nav-item.active::after  { transform: translateY(-50%) scale(1); }

    .nav-icon {
      font-size: 17px; flex-shrink: 0; width: 22px; text-align: center;
      transition: transform 0.2s;
      filter: drop-shadow(0 0 0px transparent);
    }
    .nav-item:hover .nav-icon { transform: scale(1.18); }
    .nav-item.active .nav-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 0 6px rgba(59,130,246,0.6));
    }
    .nav-label { transition: opacity 0.2s; }

    /* tooltip when collapsed */
    .nav-item[data-tip]:hover::after {
      content: attr(data-tip) !important;
      position: absolute; left: calc(100% + 12px); top: 50%;
      transform: translateY(-50%) !important;
      width: auto; height: auto;
      background: #1a1a35; border: 1px solid rgba(59,130,246,0.3);
      color: #fff; font-size: 12px; font-weight: 600;
      padding: 5px 11px; border-radius: 8px;
      white-space: nowrap; pointer-events: none;
      z-index: 999; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      animation: tipIn 0.15s ease both;
      box-shadow: none; background: #1a1a35;
    }
    @keyframes tipIn {
      from { opacity:0; transform: translateY(-50%) translateX(-6px); }
      to   { opacity:1; transform: translateY(-50%) translateX(0); }
    }

    @keyframes navItemIn {
      from { opacity:0; transform: translateX(-14px); }
      to   { opacity:1; transform: none; }
    }

    /* sidebar footer */
    .sidebar-foot {
      margin-top: auto; padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    /* ── user card in sidebar ── */
    .sidebar-user {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 14px;
      margin-bottom: 6px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      overflow: hidden; white-space: nowrap;
      transition: background 0.2s, padding 0.32s;
      text-decoration: none;
    }
    .sidebar-user:hover { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); }
    .sidebar.collapsed .sidebar-user { padding: 10px; justify-content: center; }
    .sidebar-user-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg,#3b82f6,#8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: #fff;
      overflow: hidden;
      border: 2px solid rgba(59,130,246,0.4);
      box-shadow: 0 0 10px rgba(59,130,246,0.25);
    }
    .sidebar-user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .sidebar-user-info { overflow: hidden; }
    .sidebar-user-name {
      font-size: 13px; font-weight: 700; color: #fff;
      overflow: hidden; text-overflow: ellipsis;
    }
    .sidebar-user-handle {
      font-size: 11px; color: rgba(255,255,255,0.35);
      overflow: hidden; text-overflow: ellipsis;
    }
    .sidebar.collapsed .sidebar-user-info { display: none; }
    .logout-btn {
      width: 100%; display: flex; align-items: center;
      gap: 11px; padding: 10px 12px; border-radius: 12px;
      background: none; border: none; cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-size: 13.5px; font-weight: 500;
      color: rgba(239,68,68,0.55);
      white-space: nowrap; overflow: hidden;
      transition: background 0.18s, color 0.18s, transform 0.18s;
    }
    .sidebar.collapsed .logout-btn { justify-content: center; }
    .sidebar.collapsed .logout-label { display: none; }
    .logout-btn:hover {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.2);
      color: #f87171; transform: translateX(3px);
    }
    .sidebar.collapsed .logout-btn:hover { transform: scale(1.08); }

    /* ══════════════════════════════════════
       MAIN CONTENT AREA
    ══════════════════════════════════════ */
    .main-wrap {
      flex: 1;
      margin-top: var(--hh);
      margin-left: var(--sw);
      min-height: calc(100vh - var(--hh));
      position: relative; z-index: 1;
      transition: margin-left 0.32s cubic-bezier(.22,1,.36,1);
      overflow-y: auto;
      overflow-x: hidden;
    }
    .main-wrap.collapsed { margin-left: var(--swc); }

    /* page slide-in */
    .page-anim {
      animation: pageIn 0.35s cubic-bezier(.22,1,.36,1) both;
      min-height: 100%;
    }
    /* full-height pages — exchange chat and social chat */
    .page-anim:has(.chat-shell),
    .page-anim:has(.sc-root) {
      display: flex;
      flex-direction: column;
      height: calc(100vh - var(--hh));
      min-height: 0;
      overflow: hidden;
    }
    /* prevent main-wrap from double-scrolling on full-height pages */
    .main-wrap:has(.chat-shell),
    .main-wrap:has(.sc-root) {
      overflow: hidden;
    }
    @keyframes pageIn {
      from { opacity:0; transform: translateY(14px); }
      to   { opacity:1; transform: none; }
    }

    /* ══════════════════════════════════════
       LOGOUT MODAL
    ══════════════════════════════════════ */
    .lout-backdrop {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: bdIn 0.22s ease both;
    }
    @keyframes bdIn { from { opacity:0; } to { opacity:1; } }

    .lout-box {
      background: linear-gradient(160deg, #0d0d24 0%, #0a0a1e 100%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px; padding: 40px 32px 32px;
      width: 100%; max-width: 360px; text-align: center;
      box-shadow: 0 40px 100px rgba(0,0,0,0.8),
                  inset 0 1px 0 rgba(255,255,255,0.06),
                  0 0 0 1px rgba(59,130,246,0.08);
      animation: boxPop 0.32s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes boxPop {
      from { opacity:0; transform: scale(0.84) translateY(28px); }
      to   { opacity:1; transform: none; }
    }

    .lout-icon {
      width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 22px;
      background: radial-gradient(circle, rgba(239,68,68,0.2), rgba(239,68,68,0.05));
      border: 1px solid rgba(239,68,68,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 30px rgba(239,68,68,0.2);
      animation: iconPop 0.4s 0.1s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes iconPop {
      from { opacity:0; transform: scale(0.4) rotate(-15deg); }
      to   { opacity:1; transform: none; }
    }

    .lout-box h2 {
      font-family: 'Outfit', sans-serif; font-size: 21px; font-weight: 800;
      color: #fff; margin-bottom: 10px; letter-spacing: -0.4px;
    }
    .lout-box p {
      font-family: 'Outfit', sans-serif; font-size: 14px;
      color: rgba(255,255,255,0.4); line-height: 1.65; margin-bottom: 28px;
    }

    .lout-btns { display: flex; gap: 10px; }
    .lout-stay {
      flex: 1; padding: 13px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.09); border-radius: 13px;
      font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;
      color: rgba(255,255,255,0.55); cursor: pointer;
      transition: all 0.18s;
    }
    .lout-stay:hover { background: rgba(255,255,255,0.11); color: #fff; }

    .lout-go {
      flex: 1; padding: 13px;
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      border: none; border-radius: 13px;
      font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
      color: #fff; cursor: pointer;
      box-shadow: 0 6px 22px rgba(239,68,68,0.4);
      transition: transform 0.18s, box-shadow 0.18s;
    }
    .lout-go:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(239,68,68,0.55); }
    .lout-go:active { transform: scale(0.97); }

    @media (max-width: 640px) {
      /* hide sidebar off-screen by default on mobile */
      .sidebar {
        transform: translateX(-100%);
        width: 280px !important;
        z-index: 400;
        box-shadow: 4px 0 40px rgba(0,0,0,0.7);
        transition: transform 0.3s cubic-bezier(.22,1,.36,1) !important;
        /* always show labels on mobile drawer */
        padding: 16px 10px !important;
      }
      .sidebar.collapsed {
        width: 280px !important;
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0) !important;
      }
      /* always show labels in mobile drawer regardless of collapsed state */
      .sidebar .nav-label { display: block !important; }
      .sidebar .nav-sec { opacity: 1 !important; }
      .sidebar .nav-item { padding: 10px 12px !important; justify-content: flex-start !important; }
      .sidebar .logout-btn { justify-content: flex-start !important; }
      .sidebar .logout-label { display: block !important; }
      .sidebar .sidebar-user { padding: 10px 12px !important; justify-content: flex-start !important; }
      .sidebar .sidebar-user-info { display: block !important; }
      /* overlay */
      .sidebar-overlay { display: block !important; }
      /* no left margin on mobile */
      .main-wrap, .main-wrap.collapsed { margin-left: 0 !important; }
      /* shrink top-bar left section */
      .top-bar-left, .top-bar-left.collapsed { width: 56px !important; min-width: 56px !important; border-right: none; }
      .lout-box { padding: 28px 20px 24px; }
      /* bottom nav visible */
      .bottom-nav { display: flex !important; }
      /* add padding so content isn't hidden behind bottom nav */
      .dash-page { padding-bottom: 80px !important; }
      /* notification dropdown full width on mobile */
      .notif-dropdown { width: calc(100vw - 32px); right: -8px; }
    }
    @media (max-width: 768px) {
      :root { --sw: 200px; }
    }

    /* overlay (hidden on desktop) */
    .sidebar-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      z-index: 350;
    }

    /* bottom nav (hidden on desktop) */
    .bottom-nav {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0;
      height: 60px; z-index: 300;
      background: rgba(5,5,18,0.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255,255,255,0.08);
      align-items: center; justify-content: space-around;
      padding: 0 4px;
    }
    .bottom-nav-item {
      display: flex; flex-direction: column; align-items: center;
      gap: 2px; padding: 5px 8px; border-radius: 10px;
      text-decoration: none; color: rgba(255,255,255,0.38);
      font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 600;
      transition: color 0.18s; flex: 1; max-width: 72px;
    }
    .bottom-nav-item .bn-icon { font-size: 22px; line-height: 1; }
    .bottom-nav-item.active { color: #60a5fa; }
    .bottom-nav-item.active .bn-icon { filter: drop-shadow(0 0 5px rgba(59,130,246,0.7)); }

    /* ── notification bell ── */
    .notif-wrap { position: relative; }
    .notif-btn {
      width: 34px; height: 34px; position: relative;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      transition: background 0.2s;
    }
    .notif-btn:hover { background: rgba(255,255,255,0.1); }
    .notif-count {
      position: absolute; top: -6px; right: -6px;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239,68,68,0.7);
      color: #fff; font-size: 10px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      padding: 0 4px;
      animation: popIn 0.25s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes popIn {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .notif-dot {
      position: absolute; top: 6px; right: 7px;
      width: 7px; height: 7px; border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 6px rgba(239,68,68,0.8);
      animation: pulse 1.8s ease infinite;
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity:1; }
      50%      { transform: scale(1.3); opacity:0.7; }
    }
    .notif-dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 300px; z-index: 500;
      background: #0d0d22;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.7);
      overflow: hidden;
      animation: dropIn 0.2s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes dropIn {
      from { opacity:0; transform: translateY(-8px) scale(0.97); }
      to   { opacity:1; transform: none; }
    }
    .notif-header {
      padding: 14px 16px 10px;
      font-size: 13px; font-weight: 700;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; justify-content: space-between; align-items: center;
    }
    .notif-item {
      padding: 12px 16px; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.15s;
      display: flex; gap: 10px; align-items: flex-start;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: rgba(255,255,255,0.05); }
    .notif-item-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #3b82f6; flex-shrink: 0; margin-top: 5px;
    }
    .notif-item-dot.read { background: rgba(255,255,255,0.15); }
    .notif-empty {
      padding: 28px 16px; text-align: center;
      font-size: 13px; color: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(s);
}

/* ── nav data ── */
const NAV = [
  { section: "Overview" },
  { to: "/student/dashboard", icon: "🏠", label: "Dashboard",   d: "0.06s" },
  { to: "/student/profile",   icon: "👤", label: "Profile",     d: "0.09s" },
  { to: "/student/wallet",    icon: "💰", label: "Wallet",      d: "0.12s" },
  { to: "/student/exchange",    icon: "🔄", label: "Exchange",     d: "0.15s" },
  { to: "/student/my-requests", icon: "📋", label: "My Requests",  d: "0.17s" },
  { to: "/student/messages",    icon: "💬", label: "Messages",     d: "0.18s" },
  { to: "/student/social",      icon: "🌐", label: "Social Chat",   d: "0.19s" },

  { section: "Academic" },
  { to: "/student/academic",    icon: "📚", label: "Academic",    d: "0.18s" },
  { to: "/student/notes",       icon: "📝", label: "Notes",       d: "0.20s" },
  { to: "/student/assignments", icon: "📋", label: "Assignments", d: "0.22s" },
  { to: "/student/timetable",   icon: "📅", label: "Timetable",   d: "0.24s" },
  { to: "/student/results",     icon: "📊", label: "Results",     d: "0.26s" },
  { to: "/student/doubts",      icon: "💬", label: "Doubts",      d: "0.28s" },
  { to: "/student/groups",      icon: "👥", label: "Groups",      d: "0.30s" },

  { section: "Emergency" },
  { to: "/student/emergency", icon: "🚨", label: "Emergency",    d: "0.33s" },
  { to: "/student/security",  icon: "🛡️",  label: "Security",    d: "0.35s" },
  { to: "/student/medical",   icon: "🏥", label: "Medical",      d: "0.37s" },
  { to: "/student/report",    icon: "⚠️",  label: "Report Issue", d: "0.39s" },
  { to: "/student/support",   icon: "🎧", label: "Support",      d: "0.41s" },

  { section: "More" },
  { to: "/student/settings", icon: "⚙️", label: "Settings", d: "0.42s" },
  { to: "/student/about",    icon: "ℹ️", label: "About",    d: "0.43s" },
  { to: "/student/readme",   icon: "📖", label: "README",   d: "0.45s" },
];

function pageLabel(path) {
  const m = NAV.filter(n => n.to).find(n => path === n.to || path.startsWith(n.to + "/"));
  return m ? m.label : "Dashboard";
}

/* ── Logout Modal ── */
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="lout-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="lout-box">
        <div className="lout-icon">🚪</div>
        <h2>Leaving so soon?</h2>
        <p>Are you sure you want to log out of your CampUs account?</p>
        <div className="lout-btns">
          <button className="lout-stay" onClick={onCancel}>Stay</button>
          <button className="lout-go"   onClick={onConfirm}>Yes, Logout</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   STUDENT LAYOUT
══════════════════════════════════════ */
function StudentLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth <= 640);
  const [showLogout,  setShowLogout]  = useState(false);
  const [user,        setUser]        = useState(null);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [chatSummary, setChatSummary] = useState({ totalUnread: 0, chats: [] });
  const notifRef  = useRef();
  const socketRef = useRef();

  /* track mobile breakpoint */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const authHdr = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API}/auth/me`, { headers: authHdr() })
      .then(r => setUser(r.data.user)).catch(() => {});
  }, []);

  /* fetch summary via HTTP (initial load + fallback) */
  const fetchSummary = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API}/chat/summary`, { headers: authHdr() })
      .then(r => setChatSummary(r.data)).catch(() => {});
  };

  /* real-time summary via socket */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchSummary(); // initial load

    const socket = io(API, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    /* server pushes fresh summary whenever someone messages us */
    socket.on("summary_update", (data) => {
      setChatSummary(data);
    });

    /* fallback poll every 30s in case socket misses something */
    const fallback = setInterval(fetchSummary, 30000);

    return () => {
      socket.disconnect();
      clearInterval(fallback);
    };
  }, []);

  useEffect(() => {
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* close drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggle = () => {
    if (isMobile) setMobileOpen(o => !o);
    else setCollapsed(c => !c);
  };

  const confirmLogout = () => { localStorage.removeItem("token"); navigate("/"); };
  const curLabel      = pageLabel(location.pathname);
  const initials      = user?.name?.[0]?.toUpperCase() ?? "S";
  const avatar        = user?.avatar || null;
  const unread        = chatSummary.totalUnread;

  /* hamburger is "open" (X) when: desktop=expanded, mobile=drawer open */
  const hbgOpen = isMobile ? mobileOpen : !collapsed;

  const BOTTOM_NAV = [
    { to: "/student/dashboard",   icon: "🏠", label: "Home"     },
    { to: "/student/exchange",    icon: "🔄", label: "Exchange" },
    { to: "/student/messages",    icon: "💬", label: "Messages" },
    { to: "/student/my-requests", icon: "📋", label: "Requests" },
    { to: "/student/profile",     icon: "👤", label: "Profile"  },
  ];

  return (
    <div className="layout-shell">

      {/* ── animated bg ── */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid" />

      {/* ══ HEADER ══ */}
      <header className="top-bar">
        <div className={`top-bar-left ${!isMobile && collapsed ? "collapsed" : ""}`}>
          <button className={`hbg ${hbgOpen ? "open" : ""}`} onClick={toggle} aria-label="Toggle sidebar">
            <span /><span /><span />
          </button>
          <div className={`top-bar-brand ${!isMobile && collapsed ? "hidden" : ""}`}>
            <div className="brand-icon">🎓</div>
            <span className="brand-name">CampUs</span>
          </div>
        </div>

        <div className="top-bar-center">
          <span className="top-bar-page-title">{curLabel}</span>
        </div>

        <div className="top-bar-right">
          <div className="notif-wrap" ref={notifRef}>
            <button className="notif-btn" onClick={() => setNotifOpen(o => !o)} title="Messages">
              🔔
              {unread > 0
                ? <span className="notif-count">{unread > 99 ? "99+" : unread}</span>
                : <span className="notif-dot" />
              }
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span>💬 Messages</span>
                  {unread > 0 && (
                    <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 600 }}>
                      {unread} unread
                    </span>
                  )}
                </div>

                {chatSummary.chats.length === 0 ? (
                  <div className="notif-empty">
                    <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                    No active chats yet.<br />Accept an exchange request to start chatting.
                  </div>
                ) : (
                  chatSummary.chats.map(c => (
                    <div key={c.requestId} className="notif-item"
                      onClick={() => { navigate(`/student/chat/${c.requestId}`); setNotifOpen(false); }}>
                      <div className={`notif-item-dot ${c.unread === 0 ? "read" : ""}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.lastMessage
                            ? `${c.lastMessage.sender === c.otherUser ? `@${c.otherUser}` : "You"}: ${c.lastMessage.text}`
                            : `Chat with @${c.otherUser}`}
                        </div>
                      </div>
                      {c.unread > 0 && (
                        <span style={{
                          minWidth: 20, height: 20, borderRadius: 10,
                          background: "#3b82f6", color: "#fff",
                          fontSize: 11, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "0 5px", flexShrink: 0,
                        }}>{c.unread}</span>
                      )}
                    </div>
                  ))
                )}

                <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button style={{
                    width: "100%", padding: "8px", borderRadius: 9,
                    background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
                    color: "#60a5fa", fontFamily: "Outfit,sans-serif",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }} onClick={() => { navigate("/student/my-requests"); setNotifOpen(false); }}>
                    View All Requests →
                  </button>
                </div>
              </div>
            )}
          </div>

          <NavLink to="/student/profile" className="top-bar-avatar" title="Profile">
            {avatar
              ? <img src={avatar} alt="avatar" />
              : initials}
          </NavLink>
          <NavLink to="/student/settings" title="Settings" style={{ width:34, height:34, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, textDecoration:"none", transition:"background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
            ⚙️
          </NavLink>
        </div>
      </header>

      {/* ══ SIDEBAR ══ */}
      {/* mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${!isMobile && collapsed ? "collapsed" : ""} ${isMobile && mobileOpen ? "mobile-open" : ""}`}>
        {NAV.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-sec">{item.section}</div>
          ) : (
            <NavLink
              key={i}
              to={item.to}
              data-tip={collapsed ? item.label : undefined}
              style={{ animationDelay: item.d }}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          )
        )}

        <div className="sidebar-foot">
          <button className="logout-btn" onClick={() => setShowLogout(true)}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🚪</span>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`main-wrap ${!isMobile && collapsed ? "collapsed" : ""}`}>
        <div key={location.pathname} className="page-anim">
          <Outlet />
        </div>
      </main>

      {/* ══ BOTTOM NAV (mobile only) ══ */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="bn-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ══ LOGOUT MODAL ══ */}
      {showLogout && (
        <LogoutModal onConfirm={confirmLogout} onCancel={() => setShowLogout(false)} />
      )}
    </div>
  );
}

export default StudentLayout;