"use client";

/* ------------------------------------------------------------------ */
/*  Content store: events, gallery, committee, announcements, and the   */
/*  editable site content (About page).                                 */
/*  DEMO MODE: seeded from demo-data, persisted to localStorage.        */
/*  LIVE MODE: Firestore collections + `site/content` document.         */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isFirebaseConfigured, db } from "./firebase";
import {
  DEMO_EVENTS,
  DEMO_GALLERY,
  DEMO_COMMITTEE,
  DEMO_ANNOUNCEMENTS,
  DEMO_JOBS,
} from "./demo-data";
import { DEFAULT_SITE_CONTENT } from "./types";
import type {
  AnnouncementItem,
  CommitteeSeat,
  GalleryPhoto,
  JobPost,
  PortalEvent,
  SiteContent,
} from "./types";

const CONTENT_STORAGE_KEY = "bcbhs-demo-content-v1";

interface DemoContent {
  events: PortalEvent[];
  gallery: GalleryPhoto[];
  committee: CommitteeSeat[];
  announcements: AnnouncementItem[];
  jobs: JobPost[];
  siteContent: SiteContent;
}

function seedContent(): DemoContent {
  return {
    events: DEMO_EVENTS,
    gallery: DEMO_GALLERY,
    committee: DEMO_COMMITTEE,
    announcements: DEMO_ANNOUNCEMENTS,
    jobs: DEMO_JOBS,
    siteContent: DEFAULT_SITE_CONTENT,
  };
}

interface ContentContextValue {
  events: PortalEvent[];
  gallery: GalleryPhoto[];
  committee: CommitteeSeat[];
  announcements: AnnouncementItem[];
  jobs: JobPost[];
  siteContent: SiteContent;
  loading: boolean;
  addEvent: (e: Omit<PortalEvent, "id">) => Promise<void>;
  updateEvent: (id: string, e: Partial<PortalEvent>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  addPhoto: (p: Omit<GalleryPhoto, "id" | "createdAt">) => Promise<void>;
  updatePhoto: (id: string, p: Partial<GalleryPhoto>) => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  addSeat: (s: Omit<CommitteeSeat, "id">) => Promise<void>;
  updateSeat: (id: string, s: Partial<CommitteeSeat>) => Promise<void>;
  removeSeat: (id: string) => Promise<void>;
  addAnnouncement: (a: Omit<AnnouncementItem, "id" | "createdAt">) => Promise<void>;
  updateAnnouncement: (id: string, a: Partial<AnnouncementItem>) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
  addJob: (j: Omit<JobPost, "id" | "createdAt">) => Promise<void>;
  updateJob: (id: string, j: Partial<JobPost>) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  saveSiteContent: (c: SiteContent) => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<DemoContent>(seedContent);
  const [loading, setLoading] = useState(true);
  const persistArmed = useRef(false);

  /* Rehydrate demo store (client only). */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    try {
      const raw = window.localStorage.getItem(CONTENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoContent>;
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client hydration
          setContent((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      /* corrupted storage — fall back to seed data */
    }
    setLoading(false);
  }, []);

  /* Persist demo mutations (never on the effect's first run). */
  useEffect(() => {
    if (isFirebaseConfigured) return;
    if (!persistArmed.current) {
      persistArmed.current = true;
      return;
    }
    try {
      window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    } catch {
      /* storage full — demo still works in memory */
    }
  }, [content]);

  /* Live-mode Firestore subscriptions. */
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, doc, onSnapshot } = await import("firebase/firestore");
        const unsubs = [
          onSnapshot(collection(db, "events"), (snap) => {
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              events: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PortalEvent, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "gallery"), (snap) => {
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              gallery: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryPhoto, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "committee"), (snap) => {
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              committee: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommitteeSeat, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "announcements"), (snap) => {
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              announcements: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<AnnouncementItem, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "jobs"), (snap) => {
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              jobs: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<JobPost, "id">),
              })),
            }));
          }),
          onSnapshot(doc(db, "site", "content"), (snap) => {
            if (cancelled || !snap.exists()) return;
            setContent((p) => ({ ...p, siteContent: snap.data() as SiteContent }));
          }),
        ];
        setLoading(false);
        return () => unsubs.forEach((u) => u());
      } catch {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mutate = useCallback(
    async (
      collection: "events" | "gallery" | "committee" | "announcements" | "jobs",
      op: "add" | "update" | "remove",
      id: string | null,
      data?: Record<string, unknown>,
    ) => {
      if (!isFirebaseConfigured || !db) {
        setContent((prev) => {
          const list = [...prev[collection]] as { id: string }[];
          if (op === "add") {
            return { ...prev, [collection]: [...list, { id: `x-${Date.now()}`, ...data }] };
          }
          if (op === "update") {
            return {
              ...prev,
              [collection]: list.map((it) => (it.id === id ? { ...it, ...data } : it)),
            };
          }
          return { ...prev, [collection]: list.filter((it) => it.id !== id) };
        });
        return;
      }
      const { collection: col, doc, addDoc, updateDoc, deleteDoc } = await import(
        "firebase/firestore"
      );
      if (op === "add") await addDoc(col(db, collection), data);
      else if (op === "update" && id) await updateDoc(doc(db, collection, id), data!);
      else if (op === "remove" && id) await deleteDoc(doc(db, collection, id));
    },
    [],
  );

  const value = useMemo<ContentContextValue>(
    () => ({
      events: content.events,
      gallery: content.gallery,
      committee: content.committee,
      announcements: content.announcements,
      jobs: content.jobs,
      siteContent: content.siteContent,
      loading,
      addEvent: (e) => mutate("events", "add", null, e as Record<string, unknown>),
      updateEvent: (id, e) => mutate("events", "update", id, e as Record<string, unknown>),
      removeEvent: (id) => mutate("events", "remove", id),
      addPhoto: (p) =>
        mutate("gallery", "add", null, {
          ...p,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      updatePhoto: (id, p) => mutate("gallery", "update", id, p as Record<string, unknown>),
      removePhoto: (id) => mutate("gallery", "remove", id),
      addSeat: (s) => mutate("committee", "add", null, s as Record<string, unknown>),
      updateSeat: (id, s) => mutate("committee", "update", id, s as Record<string, unknown>),
      removeSeat: (id) => mutate("committee", "remove", id),
      addAnnouncement: (a) =>
        mutate("announcements", "add", null, {
          ...a,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      updateAnnouncement: (id, a) =>
        mutate("announcements", "update", id, a as Record<string, unknown>),
      removeAnnouncement: (id) => mutate("announcements", "remove", id),
      addJob: (j) =>
        mutate("jobs", "add", null, {
          ...j,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      updateJob: (id, j) => mutate("jobs", "update", id, j as Record<string, unknown>),
      removeJob: (id) => mutate("jobs", "remove", id),
      saveSiteContent: async (c) => {
        if (!isFirebaseConfigured || !db) {
          setContent((prev) => ({ ...prev, siteContent: c }));
          return;
        }
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "site", "content"), c as unknown as Record<string, unknown>);
      },
    }),
    [content, loading, mutate],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
