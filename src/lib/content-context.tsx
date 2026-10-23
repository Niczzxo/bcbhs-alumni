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
  DEMO_BLOOD_REQUESTS,
  DEMO_POLLS,
  DEMO_POLL_VOTES,
  DEMO_STORIES,
  DEMO_BUSINESSES,
  DEMO_WALL,
  DEMO_MENTORS,
  DEMO_FUND_DONORS,
  DEMO_BATCH_LINKS,
} from "./demo-data";
import { DEFAULT_FUND_INFO, DEFAULT_SITE_CONTENT } from "./types";
import type {
  AnnouncementItem,
  BatchLink,
  BloodRequest,
  Business,
  CommitteeSeat,
  FundDonor,
  FundInfo,
  GalleryPhoto,
  JobPost,
  MentorProfile,
  Poll,
  PollVote,
  PortalEvent,
  SiteContent,
  SuccessStory,
  WallPhoto,
} from "./types";

const CONTENT_STORAGE_KEY = "bcbhs-demo-content-v1";

interface DemoContent {
  events: PortalEvent[];
  gallery: GalleryPhoto[];
  committee: CommitteeSeat[];
  announcements: AnnouncementItem[];
  jobs: JobPost[];
  bloodRequests: BloodRequest[];
  polls: Poll[];
  pollVotes: PollVote[];
  stories: SuccessStory[];
  businesses: Business[];
  wallPhotos: WallPhoto[];
  mentors: MentorProfile[];
  fundDonors: FundDonor[];
  fundInfo: FundInfo;
  batchLinks: BatchLink[];
  siteContent: SiteContent;
}

function seedContent(): DemoContent {
  return {
    events: DEMO_EVENTS,
    gallery: DEMO_GALLERY,
    committee: DEMO_COMMITTEE,
    announcements: DEMO_ANNOUNCEMENTS,
    jobs: DEMO_JOBS,
    bloodRequests: DEMO_BLOOD_REQUESTS,
    polls: DEMO_POLLS,
    pollVotes: DEMO_POLL_VOTES,
    stories: DEMO_STORIES,
    businesses: DEMO_BUSINESSES,
    wallPhotos: DEMO_WALL,
    mentors: DEMO_MENTORS,
    fundDonors: DEMO_FUND_DONORS,
    fundInfo: DEFAULT_FUND_INFO,
    batchLinks: DEMO_BATCH_LINKS,
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
  /** Collections whose first snapshot has arrived; pages gate on
      their own slice instead of waiting for all sixteen. */
  ready: ReadonlySet<string>;
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
  bloodRequests: BloodRequest[];
  addBloodRequest: (r: Omit<BloodRequest, "id" | "createdAt">) => Promise<void>;
  updateBloodRequest: (id: string, r: Partial<BloodRequest>) => Promise<void>;
  removeBloodRequest: (id: string) => Promise<void>;
  polls: Poll[];
  pollVotes: PollVote[];
  addPoll: (p: Omit<Poll, "id" | "createdAt">) => Promise<void>;
  updatePoll: (id: string, p: Partial<Poll>) => Promise<void>;
  removePoll: (id: string) => Promise<void>;
  castVote: (pollId: string, uid: string, optionIndex: number) => Promise<void>;
  stories: SuccessStory[];
  addStory: (s: Omit<SuccessStory, "id" | "createdAt">) => Promise<void>;
  removeStory: (id: string) => Promise<void>;
  businesses: Business[];
  addBusiness: (b: Omit<Business, "id" | "createdAt">) => Promise<void>;
  removeBusiness: (id: string) => Promise<void>;
  wallPhotos: WallPhoto[];
  addWallPhoto: (p: Omit<WallPhoto, "id" | "createdAt">) => Promise<void>;
  removeWallPhoto: (id: string) => Promise<void>;
  mentors: MentorProfile[];
  addMentor: (m: Omit<MentorProfile, "id" | "createdAt">) => Promise<void>;
  removeMentor: (id: string) => Promise<void>;
  fundDonors: FundDonor[];
  fundInfo: FundInfo;
  addFundDonor: (d: Omit<FundDonor, "id" | "createdAt">) => Promise<void>;
  removeFundDonor: (id: string) => Promise<void>;
  saveFundInfo: (f: FundInfo) => Promise<void>;
  batchLinks: BatchLink[];
  setBatchLink: (batch: string, link: string) => Promise<void>;
  saveSiteContent: (c: SiteContent) => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

function emptyContent(): DemoContent {
  /* Live mode starts empty so the public site never flashes demo
     placeholders on first paint, Firestore snapshots fill it in. */
  return {
    events: [],
    gallery: [],
    committee: [],
    announcements: [],
    jobs: [],
    bloodRequests: [],
    polls: [],
    pollVotes: [],
    stories: [],
    businesses: [],
    wallPhotos: [],
    mentors: [],
    fundDonors: [],
    fundInfo: DEFAULT_FUND_INFO,
    batchLinks: [],
    siteContent: DEFAULT_SITE_CONTENT,
  };
}

const CONTENT_KEYS = [
  "events", "gallery", "committee", "announcements", "jobs", "bloodRequests",
  "polls", "pollVotes", "stories", "businesses", "wallPhotos", "mentors",
  "fundDonors", "batchLinks", "fundInfo", "siteContent",
] as const;

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<DemoContent>(() =>
    isFirebaseConfigured ? emptyContent() : seedContent(),
  );
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState<ReadonlySet<string>>(new Set());
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
      /* corrupted storage, fall back to seed data */
    }
    setLoading(false);
    setReady(new Set(CONTENT_KEYS));
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
      /* storage full, demo still works in memory */
    }
  }, [content]);

  /* Live-mode Firestore subscriptions. */
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const { collection, doc, onSnapshot } = await import("firebase/firestore");
        /* Loading stays true until every subscription has delivered
           its first snapshot (or errored, e.g. member-only collections
           for a guest), with a hard fallback, so pages can show a real
           loading state instead of flashing empty copy like "No photos
           yet" while the first fetch is in flight (perf fix, 2026-10-23). */
        const TOTAL_SUBS = 16;
        let arrived = 0;
        const markArrived = (key: string) => {
          arrived += 1;
          if (arrived >= TOTAL_SUBS && !cancelled) setLoading(false);
          if (!cancelled)
            setReady((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
        };
        const fallback = setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 6000);
        const unsubs = [
          onSnapshot(collection(db, "events"), (snap) => {
            markArrived("events");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              events: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PortalEvent, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "gallery"), (snap) => {
            markArrived("gallery");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              gallery: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryPhoto, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "committee"), (snap) => {
            markArrived("committee");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              committee: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommitteeSeat, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "announcements"), (snap) => {
            markArrived("announcements");
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
            markArrived("jobs");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              jobs: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<JobPost, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "requests"), (snap) => {
            markArrived("bloodRequests");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              bloodRequests: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BloodRequest, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "polls"), (snap) => {
            markArrived("polls");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              polls: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poll, "id">) })),
            }));
          }),
          onSnapshot(collection(db, "pollVotes"), (snap) => {
            markArrived("pollVotes");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              pollVotes: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<PollVote, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "stories"), (snap) => {
            markArrived("stories");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              stories: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<SuccessStory, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "businesses"), (snap) => {
            markArrived("businesses");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              businesses: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Business, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "wallPhotos"), (snap) => {
            markArrived("wallPhotos");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              wallPhotos: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<WallPhoto, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "mentors"), (snap) => {
            markArrived("mentors");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              mentors: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<MentorProfile, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "fundDonors"), (snap) => {
            markArrived("fundDonors");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              fundDonors: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<FundDonor, "id">),
              })),
            }));
          }),
          onSnapshot(collection(db, "batchLinks"), (snap) => {
            markArrived("batchLinks");
            if (cancelled) return;
            setContent((p) => ({
              ...p,
              batchLinks: snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BatchLink, "id">),
              })),
            }));
          }),
          onSnapshot(doc(db, "site", "fund"), (snap) => {
            markArrived("fundInfo");
            if (cancelled || !snap.exists()) return;
            setContent((p) => ({ ...p, fundInfo: { ...DEFAULT_FUND_INFO, ...(snap.data() as FundInfo) } }));
          }),
          onSnapshot(doc(db, "site", "content"), (snap) => {
            markArrived("siteContent");
            if (cancelled || !snap.exists()) return;
            setContent((p) => ({ ...p, siteContent: snap.data() as SiteContent }));
          }),
        ];
        return () => {
          clearTimeout(fallback);
          unsubs.forEach((u) => u());
        };
      } catch {
        setLoading(false);
        setReady(new Set(CONTENT_KEYS));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mutate = useCallback(
    async (
      collection:
        | "events"
        | "gallery"
        | "committee"
        | "announcements"
        | "jobs"
        | "requests"
        | "polls"
        | "stories"
        | "businesses"
        | "wallPhotos"
        | "mentors"
        | "fundDonors",
      op: "add" | "update" | "remove",
      id: string | null,
      data?: Record<string, unknown>,
    ) => {
      if (!isFirebaseConfigured || !db) {
        /* Firestore calls the blood-request collection `requests`; the
         * state key is `bloodRequests`. Everything else matches. */
        const key = (collection === "requests" ? "bloodRequests" : collection) as keyof DemoContent;
        setContent((prev) => {
          const list = [...(prev[key] as { id: string }[])];
          if (op === "add") {
            return { ...prev, [key]: [...list, { id: `x-${Date.now()}`, ...data }] };
          }
          if (op === "update") {
            return {
              ...prev,
              [key]: list.map((it) => (it.id === id ? { ...it, ...data } : it)),
            };
          }
          return { ...prev, [key]: list.filter((it) => it.id !== id) };
        });
        return;
      }
      const { collection: col, doc, addDoc, updateDoc, deleteDoc } = await import(
        "firebase/firestore"
      );
      /* Firestore rejects payloads containing `undefined` values, one
       * unset optional form field would fail the whole write. Strip
       * them centrally so every collection/form is safe. */
      const clean = data
        ? Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
        : data;
      if (op === "add") await addDoc(col(db, collection), clean);
      else if (op === "update" && id) await updateDoc(doc(db, collection, id), clean!);
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
      ready,
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
      bloodRequests: content.bloodRequests,
      addBloodRequest: (r) =>
        mutate("requests", "add", null, {
          ...r,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      updateBloodRequest: (id, r) => mutate("requests", "update", id, r as Record<string, unknown>),
      removeBloodRequest: (id) => mutate("requests", "remove", id),
      polls: content.polls,
      pollVotes: content.pollVotes,
      addPoll: (p) =>
        mutate("polls", "add", null, {
          ...p,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      updatePoll: (id, p) => mutate("polls", "update", id, p as Record<string, unknown>),
      removePoll: (id) => mutate("polls", "remove", id),
      castVote: async (pollId, uid, optionIndex) => {
        const vote: PollVote = { id: `${pollId}_${uid}`, pollId, uid, optionIndex };
        if (!isFirebaseConfigured || !db) {
          setContent((prev) => ({
            ...prev,
            pollVotes: [...prev.pollVotes.filter((v) => v.id !== vote.id), vote],
          }));
          return;
        }
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "pollVotes", vote.id), { pollId, uid, optionIndex });
      },
      stories: content.stories,
      addStory: (s) =>
        mutate("stories", "add", null, {
          ...s,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      removeStory: (id) => mutate("stories", "remove", id),
      businesses: content.businesses,
      addBusiness: (b) =>
        mutate("businesses", "add", null, {
          ...b,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      removeBusiness: (id) => mutate("businesses", "remove", id),
      wallPhotos: content.wallPhotos,
      addWallPhoto: (p) =>
        mutate("wallPhotos", "add", null, {
          ...p,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      removeWallPhoto: (id) => mutate("wallPhotos", "remove", id),
      mentors: content.mentors,
      addMentor: (m) =>
        mutate("mentors", "add", null, {
          ...m,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      removeMentor: (id) => mutate("mentors", "remove", id),
      fundDonors: content.fundDonors,
      fundInfo: content.fundInfo,
      addFundDonor: (d) =>
        mutate("fundDonors", "add", null, {
          ...d,
          createdAt: new Date().toISOString(),
        } as Record<string, unknown>),
      removeFundDonor: (id) => mutate("fundDonors", "remove", id),
      saveFundInfo: async (f) => {
        if (!isFirebaseConfigured || !db) {
          setContent((prev) => ({ ...prev, fundInfo: f }));
          return;
        }
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "site", "fund"), f as unknown as Record<string, unknown>);
      },
      batchLinks: content.batchLinks,
      setBatchLink: async (batch, link) => {
        if (!isFirebaseConfigured || !db) {
          setContent((prev) => ({
            ...prev,
            batchLinks: [
              ...prev.batchLinks.filter((b) => b.id !== batch),
              ...(link ? [{ id: batch, link }] : []),
            ],
          }));
          return;
        }
        const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
        if (link) await setDoc(doc(db, "batchLinks", batch), { link });
        else await deleteDoc(doc(db, "batchLinks", batch));
      },
      saveSiteContent: async (c) => {
        if (!isFirebaseConfigured || !db) {
          setContent((prev) => ({ ...prev, siteContent: c }));
          return;
        }
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "site", "content"), c as unknown as Record<string, unknown>);
      },
    }),
    [content, loading, ready, mutate],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
