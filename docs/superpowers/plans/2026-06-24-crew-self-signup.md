# Crew Self-Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let people self-sign up as video "crew" with their Gmail account, save their phone + skills, recognize them on return, land them on a crew-only page, and let admins deactivate any crew email.

**Architecture:** A third role ("crew") alongside admin/blocked. Crew accounts live in the existing `videoCrew` Firestore collection keyed by lowercased email (same pattern as `admins`). `AuthProvider` gains a parallel crew lookup exposing `crew`/`isCrew`. Two new routes (`/crew/join`, `/crew`) run a self-contained gate, fully separate from the admin `ProtectedRoute`. The admin video section is untouched.

**Tech Stack:** React 18 (CRA), React Router v6, Firebase Firestore + Google Auth, MUI v5, Jest + React Testing Library.

## Global Constraints

- All Firestore reads/writes for crew live in `src/firebase/video/crew.js`. UI never imports `firebase/firestore` directly.
- Crew doc ID is the **lowercased** email; stored `email` field is also lowercased.
- Skills come from the single source `src/utils/crewSkills.js` (`CREW_SKILLS`) — never hardcode the list elsewhere.
- Phone: free text, validation is non-empty (trimmed) only.
- Self-signup creates `active: true` immediately. "Crew access" requires `active !== false`.
- Theme: warm amber/cream. Reuse `amberButtonSx`/`cardSx` from `src/pages/Videos/ui.js` and the `AdminRouteGate` background/card styling. Mobile-first responsive.
- Tests run with `npm test -- --watchAll=false`.
- Bump `package.json` minor version (new feature) — last task.

---

### Task 1: Skills constant + crew firebase helpers

**Files:**
- Create: `src/utils/crewSkills.js`
- Modify: `src/firebase/video/crew.js`
- Test: `src/firebase/video/crew.test.js` (create)

**Interfaces:**
- Produces:
  - `CREW_SKILLS: string[]` (default-less named export)
  - `fetchCrewByEmail(email: string): Promise<{ id, name, email, phone, skills, active, createdAt } | null>`
  - `registerCrew({ email, name, phone, skills }): Promise<void>`
  - `setCrewActive(id: string, active: boolean): Promise<void>`

- [ ] **Step 1: Create the skills constant**

```js
// src/utils/crewSkills.js
// The fixed set of skills a crew member can declare at signup. Single source
// of truth — referenced by the register form. Order here is the display order.
export const CREW_SKILLS = [
  "Shorts",
  "Long",
  "Promo",
  "Thumbnail",
  "Caption",
  "Before editing content checking",
  "After editing content checking",
];
```

- [ ] **Step 2: Write the failing test for the new helpers**

```js
// src/firebase/video/crew.test.js
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { fetchCrewByEmail, registerCrew, setCrewActive } from "./crew";

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TS"),
  updateDoc: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({ DB: { __db: true } }));

describe("crew accounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue("crewRef");
  });

  describe("fetchCrewByEmail", () => {
    it("returns the record keyed by lowercased email", async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        id: "person@example.com",
        data: () => ({ name: "Person", phone: "999", skills: ["Shorts"], active: true }),
      });
      const result = await fetchCrewByEmail("Person@Example.com");
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(result).toEqual({
        id: "person@example.com",
        name: "Person",
        phone: "999",
        skills: ["Shorts"],
        active: true,
      });
    });

    it("returns null when the doc is missing", async () => {
      getDoc.mockResolvedValue({ exists: () => false });
      expect(await fetchCrewByEmail("nobody@example.com")).toBeNull();
    });

    it("returns null for a falsy email without querying", async () => {
      expect(await fetchCrewByEmail("")).toBeNull();
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe("registerCrew", () => {
    it("writes an active record keyed by lowercased, trimmed email", async () => {
      await registerCrew({
        email: " Person@Example.com ",
        name: "  Person  ",
        phone: " 99999 ",
        skills: ["Shorts", "Promo"],
      });
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(setDoc).toHaveBeenCalledWith("crewRef", {
        name: "Person",
        email: "person@example.com",
        phone: "99999",
        skills: ["Shorts", "Promo"],
        active: true,
        createdAt: "SERVER_TS",
      });
    });

    it("throws when name, phone, email, or skills are missing", async () => {
      await expect(registerCrew({ email: "", name: "A", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: " ", phone: "1", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: "A", phone: " ", skills: ["Shorts"] })).rejects.toThrow();
      await expect(registerCrew({ email: "a@b.com", name: "A", phone: "1", skills: [] })).rejects.toThrow();
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe("setCrewActive", () => {
    it("updates only the active flag", async () => {
      await setCrewActive("person@example.com", false);
      expect(doc).toHaveBeenCalledWith({ __db: true }, "videoCrew", "person@example.com");
      expect(updateDoc).toHaveBeenCalledWith("crewRef", { active: false });
    });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern="firebase/video/crew"`
Expected: FAIL — `fetchCrewByEmail`/`registerCrew`/`setCrewActive` are not exported.

- [ ] **Step 4: Implement the helpers**

Edit `src/firebase/video/crew.js`. Add `getDoc` and `setDoc` to the existing `firebase/firestore` import, then append the new functions:

```js
// add getDoc, setDoc to the existing import from "firebase/firestore"

export const fetchCrewByEmail = async (email) => {
  if (!email) {
    return null;
  }
  const snapshot = await getDoc(doc(DB, CREW, email.toLowerCase()));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() };
};

export const registerCrew = async ({ email, name, phone, skills }) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanName = (name || "").trim();
  const cleanPhone = (phone || "").trim();
  const cleanSkills = Array.isArray(skills) ? skills : [];
  if (!cleanEmail) throw new Error("Email is required.");
  if (!cleanName) throw new Error("Name is required.");
  if (!cleanPhone) throw new Error("Phone number is required.");
  if (cleanSkills.length === 0) throw new Error("Pick at least one skill.");
  await setDoc(doc(DB, CREW, cleanEmail), {
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    skills: cleanSkills,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const setCrewActive = async (id, active) => {
  await updateDoc(doc(DB, CREW, id), { active });
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern="firebase/video/crew"`
Expected: PASS (all crew-account tests green).

- [ ] **Step 6: Commit**

```bash
git add src/utils/crewSkills.js src/firebase/video/crew.js src/firebase/video/crew.test.js
git commit -m "feat: crew skills constant and account firebase helpers"
```

---

### Task 2: AuthProvider crew awareness

**Files:**
- Modify: `src/components/AuthProvider/index.js`
- Test: `src/components/AuthProvider/index.test.js`

**Interfaces:**
- Consumes: `fetchCrewByEmail` (Task 1), existing `fetchAdmin`.
- Produces: `useAuth()` context now also returns `crew: object | null` and `isCrew: boolean` (true when a crew record exists and `active !== false`). Existing `user`/`isAllowed`/`isOwner`/`loading` unchanged.

- [ ] **Step 1: Update the test for crew state**

Replace the contents of `src/components/AuthProvider/index.test.js` with the version below (adds a crew mock + crew assertions, keeps existing admin behavior):

```js
import React from "react";
import { render, screen, act } from "@testing-library/react";
import { onAuthStateChanged } from "firebase/auth";
import { fetchAdmin } from "../../firebase/auth";
import { fetchCrewByEmail } from "../../firebase/video/crew";
import { AuthProvider, useAuth } from "./index";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ fetchAdmin: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ fetchCrewByEmail: jest.fn() }));
jest.mock("../../config/firebase", () => ({ AUTH: { __auth: true } }));

function Consumer() {
  const { user, isAllowed, isOwner, isCrew, loading } = useAuth();
  if (loading) return <div>state: loading</div>;
  return (
    <div>
      state: ready user:{user ? user.email : "none"} allowed:{String(isAllowed)}{" "}
      owner:{String(isOwner)} crew:{String(isCrew)}
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

describe("AuthProvider", () => {
  let authCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    authCallback = null;
    fetchAdmin.mockResolvedValue(null);
    fetchCrewByEmail.mockResolvedValue(null);
    onAuthStateChanged.mockImplementation((auth, cb) => {
      authCallback = cb;
      return jest.fn();
    });
  });

  it("starts loading until the first auth event resolves", () => {
    renderProvider();
    expect(screen.getByText(/state: loading/)).toBeInTheDocument();
  });

  it("resolves to signed-out when there is no user", async () => {
    renderProvider();
    await act(async () => authCallback(null));
    expect(
      screen.getByText(/state: ready user:none allowed:false owner:false crew:false/)
    ).toBeInTheDocument();
  });

  it("flags an allowlisted admin", async () => {
    fetchAdmin.mockResolvedValue({ email: "owner@example.com", role: "owner" });
    renderProvider();
    await act(async () => authCallback({ email: "owner@example.com" }));
    expect(fetchCrewByEmail).toHaveBeenCalledWith("owner@example.com");
    expect(
      screen.getByText(/allowed:true owner:true crew:false/)
    ).toBeInTheDocument();
  });

  it("flags an active crew member", async () => {
    fetchCrewByEmail.mockResolvedValue({ id: "c@example.com", active: true });
    renderProvider();
    await act(async () => authCallback({ email: "c@example.com" }));
    expect(screen.getByText(/allowed:false owner:false crew:true/)).toBeInTheDocument();
  });

  it("does not flag a deactivated crew member as crew", async () => {
    fetchCrewByEmail.mockResolvedValue({ id: "c@example.com", active: false });
    renderProvider();
    await act(async () => authCallback({ email: "c@example.com" }));
    expect(screen.getByText(/crew:false/)).toBeInTheDocument();
  });

  it("treats a failed lookup as not allowed and not crew", async () => {
    fetchAdmin.mockRejectedValue(new Error("network"));
    renderProvider();
    await act(async () => authCallback({ email: "x@example.com" }));
    expect(
      screen.getByText(/allowed:false owner:false crew:false/)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern="AuthProvider"`
Expected: FAIL — `isCrew` is undefined (renders `crew:undefined`), and `fetchCrewByEmail` not called.

- [ ] **Step 3: Implement crew lookup in AuthProvider**

Edit `src/components/AuthProvider/index.js`:

Add the import:
```js
import { fetchCrewByEmail } from "../../firebase/video/crew";
```

Add state and extend the context default + value with `crew`/`isCrew`:
```js
const [crew, setCrew] = useState(null);
const [isCrew, setIsCrew] = useState(false);
```

Update the default context object to include `crew: null, isCrew: false`.

Replace the body of the `onAuthStateChanged` callback's signed-out branch and try block:
```js
      if (!nextUser) {
        setIsAllowed(false);
        setIsOwner(false);
        setCrew(null);
        setIsCrew(false);
        setLoading(false);
        return;
      }

      try {
        const [admin, crewRecord] = await Promise.all([
          fetchAdmin(nextUser.email),
          fetchCrewByEmail(nextUser.email),
        ]);
        setIsAllowed(admin !== null);
        setIsOwner(admin?.role === "owner");
        setCrew(crewRecord);
        setIsCrew(crewRecord !== null && crewRecord.active !== false);
      } catch (error) {
        console.error("auth lookup :", error);
        setIsAllowed(false);
        setIsOwner(false);
        setCrew(null);
        setIsCrew(false);
      } finally {
        setLoading(false);
      }
```

Update the provider value:
```jsx
    <AuthContext.Provider value={{ user, isAllowed, isOwner, crew, isCrew, loading }}>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern="AuthProvider"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AuthProvider/index.js src/components/AuthProvider/index.test.js
git commit -m "feat: expose crew membership from AuthProvider"
```

---

### Task 3: CrewJoin register screen

**Files:**
- Create: `src/pages/CrewJoin/index.jsx`
- Test: `src/pages/CrewJoin/index.test.jsx` (create)

**Interfaces:**
- Consumes: `useAuth()` (`user`, `isAllowed`, `isCrew`, `crew`, `loading`), `signInWithGoogle` from `src/firebase/auth`, `registerCrew` from `src/firebase/video/crew`, `CREW_SKILLS`, `SnackbarContext`.
- Produces: default-exported `CrewJoin` React component for the `/crew/join` route.

Behavior by auth state:
- `loading` → centered spinner.
- no `user` → themed sign-in card with a "Sign in with Google to join the crew" button.
- `isCrew` → `<Navigate to="/crew" replace />`.
- `isAllowed` (admin) → note "You're an admin" + link to `/videos`.
- `user` + `crew` exists but `crew.active === false` → "Your crew access is paused. Please contact an admin."
- `user`, not admin, not crew → register form (name/email read-only from `user.displayName`/`user.email`; phone text field; skills multi-select from `CREW_SKILLS`). Submit → `registerCrew` → on success `setRegistered(true)` then `<Navigate to="/crew" replace />`; on error show snackbar.

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/CrewJoin/index.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import CrewJoin from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signInWithGoogle: jest.fn() }));
jest.mock("../../firebase/video/crew", () => ({ registerCrew: jest.fn() }));
jest.mock("../../components/Snackbar", () => ({
  SnackbarContext: { Provider: ({ children }) => children },
  SNACK_BAR_SEVERITY_TYPES: { ERROR: "error", SUCCESS: "success" },
}));

const renderJoin = () =>
  render(
    <MemoryRouter initialEntries={["/crew/join"]}>
      <CrewJoin />
    </MemoryRouter>
  );

describe("CrewJoin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the Google sign-in prompt when signed out", () => {
    useAuth.mockReturnValue({ user: null, isAllowed: false, isCrew: false, crew: null, loading: false });
    renderJoin();
    expect(screen.getByRole("button", { name: /sign in with google/i })).toBeInTheDocument();
  });

  it("shows the register form (with prefilled name) for a signed-in non-crew user", () => {
    useAuth.mockReturnValue({
      user: { displayName: "New Person", email: "new@example.com" },
      isAllowed: false, isCrew: false, crew: null, loading: false,
    });
    renderJoin();
    expect(screen.getByDisplayValue("New Person")).toBeInTheDocument();
    expect(screen.getByDisplayValue("new@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  it("shows a paused message for a deactivated crew member", () => {
    useAuth.mockReturnValue({
      user: { email: "old@example.com" },
      isAllowed: false, isCrew: false, crew: { id: "old@example.com", active: false }, loading: false,
    });
    renderJoin();
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });

  it("redirects active crew to the crew home", () => {
    useAuth.mockReturnValue({
      user: { email: "c@example.com" },
      isAllowed: false, isCrew: true, crew: { id: "c@example.com", active: true }, loading: false,
    });
    renderJoin();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern="CrewJoin"`
Expected: FAIL — module `./index` not found.

- [ ] **Step 3: Implement CrewJoin**

```jsx
// src/pages/CrewJoin/index.jsx
import React, { useContext, useState } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container,
  MenuItem, OutlinedInput, Select, Stack, TextField, Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../../components/AuthProvider";
import { signInWithGoogle } from "../../firebase/auth";
import { registerCrew } from "../../firebase/video/crew";
import { CREW_SKILLS } from "../../utils/crewSkills";
import { SnackbarContext, SNACK_BAR_SEVERITY_TYPES } from "../../components/Snackbar";
import { amberButtonSx, cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  py: { xs: 4, sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const Centered = ({ children }) => (
  <Box sx={pageSx}>
    <Container maxWidth="sm">
      <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>{children}</CardContent>
      </Card>
    </Container>
  </Box>
);

const CrewJoin = () => {
  const { user, isAllowed, isCrew, crew, loading } = useAuth();
  const { showSnackbar } = useContext(SnackbarContext);
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState([]);
  const [signingIn, setSigningIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (loading) {
    return (
      <Box sx={{ ...pageSx, justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isCrew || registered) return <Navigate to="/crew" replace />;

  if (!user) {
    const handleSignIn = async () => {
      setSigningIn(true);
      try {
        await signInWithGoogle();
      } catch (err) {
        if (err?.code !== "auth/popup-closed-by-user") {
          showSnackbar("Could not sign in. Please try again.", SNACK_BAR_SEVERITY_TYPES.ERROR);
        }
        setSigningIn(false);
      }
    };
    return (
      <Centered>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13" }}>
            Join the video crew
          </Typography>
          <Typography sx={{ color: "#5b6472" }}>
            Sign in with your Google account to register.
          </Typography>
          <Button
            variant="contained" startIcon={<GoogleIcon />} disabled={signingIn}
            onClick={handleSignIn} sx={amberButtonSx} fullWidth
          >
            Sign in with Google
          </Button>
        </Stack>
      </Centered>
    );
  }

  if (crew && crew.active === false) {
    return (
      <Centered>
        <Typography sx={{ color: "#8a6a36", textAlign: "center", fontWeight: 600 }}>
          Your crew access is paused. Please contact an admin.
        </Typography>
      </Centered>
    );
  }

  if (isAllowed) {
    return (
      <Centered>
        <Stack spacing={1.5} textAlign="center">
          <Typography sx={{ color: "#3b2a13", fontWeight: 700 }}>
            You're an admin — no need to register as crew.
          </Typography>
          <Button component={RouterLink} to="/videos" variant="contained" sx={amberButtonSx}>
            Go to Videos
          </Button>
        </Stack>
      </Centered>
    );
  }

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await registerCrew({
        email: user.email,
        name: user.displayName || user.email,
        phone,
        skills,
      });
      showSnackbar("You're registered!", SNACK_BAR_SEVERITY_TYPES.SUCCESS);
      setRegistered(true);
    } catch (e) {
      showSnackbar(e?.message || "Could not register.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      setSaving(false);
    }
  };

  const canSubmit = phone.trim().length > 0 && skills.length > 0 && !saving;

  return (
    <Centered>
      <Stack spacing={2.5}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13" }}>
          Register as crew
        </Typography>
        <TextField label="Name" value={user.displayName || ""} fullWidth InputProps={{ readOnly: true }} />
        <TextField label="Email" value={user.email || ""} fullWidth InputProps={{ readOnly: true }} />
        <TextField
          label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)}
          fullWidth required placeholder="Your contact number"
        />
        <Select
          multiple displayEmpty value={skills}
          onChange={(e) => setSkills(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
          input={<OutlinedInput />}
          renderValue={(selected) =>
            selected.length === 0 ? (
              <Typography sx={{ color: "#9aa0a6" }}>Select your skills</Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((s) => <Chip key={s} label={s} size="small" />)}
              </Box>
            )
          }
        >
          {CREW_SKILLS.map((skill) => (
            <MenuItem key={skill} value={skill}>{skill}</MenuItem>
          ))}
        </Select>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit} sx={amberButtonSx}>
          Complete signup
        </Button>
      </Stack>
    </Centered>
  );
};

export default CrewJoin;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern="CrewJoin"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CrewJoin/index.jsx src/pages/CrewJoin/index.test.jsx
git commit -m "feat: crew self-signup register screen"
```

---

### Task 4: CrewHome landing placeholder

**Files:**
- Create: `src/pages/CrewHome/index.jsx`
- Test: `src/pages/CrewHome/index.test.jsx` (create)

**Interfaces:**
- Consumes: `useAuth()` (`crew`, `isCrew`, `loading`), `signOutUser` from `src/firebase/auth`.
- Produces: default-exported `CrewHome` React component for the `/crew` route.

Behavior:
- `loading` → spinner.
- not `isCrew` → `<Navigate to="/crew/join" replace />`.
- `isCrew` → themed card with `crew.name`, `crew.email`, `crew.phone`, skill chips, a sign-out button, and a "Availability & your work list — coming soon" note.

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/CrewHome/index.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import CrewHome from "./index";

jest.mock("../../components/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("../../firebase/auth", () => ({ signOutUser: jest.fn() }));

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/crew"]}>
      <CrewHome />
    </MemoryRouter>
  );

describe("CrewHome", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to join when the user is not crew", () => {
    useAuth.mockReturnValue({ crew: null, isCrew: false, loading: false });
    renderHome();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("renders the crew profile for an active crew member", () => {
    useAuth.mockReturnValue({
      crew: { name: "Person", email: "p@example.com", phone: "999", skills: ["Shorts", "Promo"] },
      isCrew: true, loading: false,
    });
    renderHome();
    expect(screen.getByText("Person")).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --watchAll=false --testPathPattern="CrewHome"`
Expected: FAIL — module `./index` not found.

- [ ] **Step 3: Implement CrewHome**

```jsx
// src/pages/CrewHome/index.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Container, Divider, Stack, Typography,
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../components/AuthProvider";
import { signOutUser } from "../../firebase/auth";
import { cardSx } from "../Videos/ui";

const pageSx = {
  minHeight: "100vh",
  py: { xs: 4, sm: 6 },
  background:
    "radial-gradient(circle at top, rgba(255, 232, 208, 0.95) 0%, rgba(255, 247, 236, 0.96) 34%, #fffdf8 100%)",
};

const CrewHome = () => {
  const { crew, isCrew, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isCrew) return <Navigate to="/crew/join" replace />;

  return (
    <Box sx={pageSx}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ ...cardSx, borderRadius: { xs: 4, sm: 5 } }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#3b2a13" }}>
                {crew?.name}
              </Typography>
              <Typography sx={{ color: "#5b6472" }}>{crew?.email}</Typography>
              <Typography sx={{ color: "#5b6472" }}>{crew?.phone}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {(crew?.skills || []).map((s) => (
                  <Chip key={s} label={s} size="small" sx={{ backgroundColor: "rgba(147,81,0,0.10)", color: "#935100" }} />
                ))}
              </Box>
              <Divider />
              <Typography sx={{ color: "#8a6a36", fontWeight: 600 }}>
                Availability & your work list — coming soon.
              </Typography>
              <Button
                variant="outlined" startIcon={<LogoutRoundedIcon />}
                onClick={() => signOutUser()}
                sx={{ textTransform: "none", fontWeight: 700, alignSelf: "flex-start" }}
              >
                Sign out
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CrewHome;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --watchAll=false --testPathPattern="CrewHome"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CrewHome/index.jsx src/pages/CrewHome/index.test.jsx
git commit -m "feat: crew landing placeholder page"
```

---

### Task 5: Wire crew routes into App.js

**Files:**
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `CrewJoin` (Task 3), `CrewHome` (Task 4).
- Produces: live routes `/crew/join` and `/crew`. These are NOT wrapped in `ProtectedRoute` — each page runs its own gate via `useAuth`.

- [ ] **Step 1: Add the imports**

Near the other page imports in `src/App.js`:
```js
import CrewJoin from "./pages/CrewJoin";
import CrewHome from "./pages/CrewHome";
```

- [ ] **Step 2: Add the routes**

Inside `<Routes>` (alongside the other top-level routes, e.g. just after the `/video-config` route):
```jsx
          <Route path="/crew/join" element={<CrewJoin />} />
          <Route path="/crew" element={<CrewHome />} />
```

- [ ] **Step 3: Verify the build compiles and the full suite passes**

Run: `npm test -- --watchAll=false`
Expected: PASS (whole suite). No console errors about missing modules.

- [ ] **Step 4: Manually sanity-check route wiring (no browser automation)**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.js
git commit -m "feat: add /crew and /crew/join routes"
```

---

### Task 6: Admin deactivation in CrewTab

**Files:**
- Modify: `src/pages/VideoConfig/CrewTab.jsx`

**Interfaces:**
- Consumes: `setCrewActive` (Task 1), existing `listCrew`.
- Produces: per-row Active toggle calling `setCrewActive(member.id, nextActive)`, and each row now displays email/phone/skill chips when present.

- [ ] **Step 1: Import `setCrewActive`**

In `src/pages/VideoConfig/CrewTab.jsx`, extend the crew import:
```js
import { addCrew, deleteCrew, listCrew, setCrewActive, updateCrew } from "../../firebase/video/crew";
```

- [ ] **Step 2: Add a row-level toggle handler**

Inside the `CrewTab` component, add:
```js
  const handleToggleActive = async (member) => {
    try {
      await setCrewActive(member.id, member.active === false);
    } catch (e) {
      showSnackbar("Could not update.", SNACK_BAR_SEVERITY_TYPES.ERROR);
      return;
    }
    await reload();
  };
```

- [ ] **Step 3: Show email/phone/skills and an Active switch in each row**

Replace the row `<Paper>` body's name `<Typography>` block so the row renders contact details, skill chips, and an inline Active `Switch`. Add `Switch` and `FormControlLabel` are already imported. Update the row to:
```jsx
          <Paper key={member.id} elevation={0} sx={{ ...cardSx, display: "flex", alignItems: "center", gap: 1, opacity: member.active === false ? 0.55 : 1 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, color: "#3b2a13" }}>{member.name}</Typography>
              {member.email ? <Typography variant="body2" sx={{ color: "#5b6472" }}>{member.email}</Typography> : null}
              {member.phone ? <Typography variant="body2" sx={{ color: "#5b6472" }}>{member.phone}</Typography> : null}
              {(member.skills || []).length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {member.skills.map((s) => (
                    <Chip key={s} size="small" label={s} sx={{ backgroundColor: "rgba(147,81,0,0.10)", color: "#935100" }} />
                  ))}
                </Box>
              ) : null}
            </Box>
            <FormControlLabel
              control={<Switch checked={member.active !== false} onChange={() => handleToggleActive(member)} />}
              label={member.active === false ? "Paused" : "Active"}
              sx={{ mr: 0, "& .MuiFormControlLabel-label": { fontSize: 13, color: "#5b6472" } }}
            />
            <IconButton aria-label={`Edit ${member.name}`} onClick={() => openDialog(member)} sx={{ color: "#935100" }}><EditRoundedIcon /></IconButton>
            <IconButton aria-label={`Delete ${member.name}`} onClick={() => setDeleteTarget(member)} sx={{ color: "#b3261e" }}><DeleteOutlineRoundedIcon /></IconButton>
          </Paper>
```

- [ ] **Step 4: Preserve skills/phone/email when editing via the dialog**

In `handleSave`, build the payload by spreading the existing record so name/active edits don't wipe crew-account fields. Change the `updateCrew` branch:
```js
      const existing = crew.find((m) => m.id === dialog.id) || {};
      const payload = dialog.id
        ? { name, active: dialog.active, skills: existing.skills || [], linkedEmail: existing.email || existing.linkedEmail || "" }
        : { name, active: dialog.active };
      if (dialog.id) {
        await updateCrew(dialog.id, payload);
      } else {
        await addCrew(payload);
      }
```
(Replace the current `const payload = { name, active: dialog.active };` and the if/else that follows.)

- [ ] **Step 5: Verify the suite still passes**

Run: `npm test -- --watchAll=false`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/VideoConfig/CrewTab.jsx
git commit -m "feat: admin can deactivate crew and view their details"
```

---

### Task 7: Version bump

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump the minor version**

Run: `npm version minor --no-git-tag-version`
Expected: prints the new version, updates `package.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: bump version for crew self-signup"
```

---

## Self-Review Notes

- **Spec coverage:** access model → Task 2 (`isCrew`) + Task 5 (separate routes); register flow/states → Task 3; data model + helpers → Task 1; skills constant → Task 1; crew landing placeholder → Task 4; admin deactivation → Task 6; versioning → Task 7. All spec sections mapped.
- **Type consistency:** `fetchCrewByEmail`/`registerCrew`/`setCrewActive` signatures used identically across Tasks 1, 2, 6. `useAuth()` additions (`crew`, `isCrew`) defined in Task 2 and consumed in Tasks 3, 4. Crew record shape (`name`, `email`, `phone`, `skills`, `active`) consistent across tasks.
- **No placeholders:** every code step contains full code; every run step has an expected result.
