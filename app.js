
// UW Student Portal - frontend security training app.
// All users and data are fake. This is not real authentication.

const USERS = [
  {
    id: 1001,
    name: "Ayesha Khan",
    email: "ayesha@uw.test",
    passwordHash: "0de3941069a81cbdd8599056e4e5237a1fd47d823936af137b04e86c7257087b",
    role: "student",
    cnic: "35202-1234567-1"
  },
  {
    id: 1002,
    name: "Bilal Ahmed",
    email: "bilal@uw.test",
    passwordHash: "e247b9b93ead545ebf4eaf13885cbdcfab5da5d000b922e1394e03b5acde4a1a",
    role: "student",
    cnic: "35202-7654321-9"
  },
  {
    id: 2001,
    name: "Dr. Sana Malik",
    email: "sana@uw.test",
    passwordHash: "cde383eee8ee7a4400adf7a15f716f179a2eb97646b37e089eb8d6d04e663416",
    role: "teacher",
    cnic: "35202-1111111-2"
  },
  {
    id: 9001,
    name: "Admin",
    email: "admin@uw.test",
    passwordHash: "e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7",
    role: "admin",
    cnic: "35202-9999999-3"
  }
];

const RESULTS = {
  1001: { course: "CYS-331L", marks: 88 },
  1002: { course: "CYS-331L", marks: 54 },
  2001: { course: "n/a", marks: 0 }
};

const COURSES = [
  "CYS-331L Secure Software Design",
  "CS-101 Programming",
  "MT-210 Discrete Maths"
];

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

let failedAttempts = 0;
let lockedUntil = 0;

function getSession() {
  const session = sessionStorage.getItem("session");
  return session ? JSON.parse(session) : null;
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeNextTarget(value) {
  // Only this fixed relative destination is permitted.
  if (value === "index.html") {
    return "index.html";
  }

  return null;
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (Date.now() < lockedUntil) {
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
    $("loginMsg").textContent =
      "Too many failed attempts. Try again in " + remaining + " seconds.";
    return;
  }

  if (lockedUntil > 0 && Date.now() >= lockedUntil) {
    failedAttempts = 0;
    lockedUntil = 0;
  }

  const email = $("email").value.trim();
  const password = $("password").value;
  const passwordHash = await hashPassword(password);

  const user = USERS.find(
    (item) => item.email === email && item.passwordHash === passwordHash
  );

  if (!user) {
    failedAttempts++;

    if (failedAttempts >= 3) {
      lockedUntil = Date.now() + 30000;
      $("loginMsg").textContent =
        "Too many failed attempts. Sign-in blocked for 30 seconds.";
    } else {
      $("loginMsg").textContent = "Login failed. Check your email and password.";
    }

    return;
  }

  failedAttempts = 0;
  lockedUntil = 0;

  sessionStorage.setItem(
    "session",
    JSON.stringify({ id: user.id })
  );

  const next = params.get("next");

  if (next) {
    const safeTarget = safeNextTarget(next);

    if (safeTarget) {
      window.location.assign(safeTarget);
      return;
    }
  }

  render();
});

$("resultForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult($("rid").value);
});

function showResult(id) {
  const session = getSession();
  if (!session) return;

  const user = USERS.find((item) => item.id === session.id);
  if (!user) return;

  if (String(id) !== String(session.id) && user.role === "student") {
    $("resultOut").textContent =
      "Access denied: you can only view your own result.";
    return;
  }

  const result = RESULTS[id];
  const resultUser = USERS.find((item) => String(item.id) === String(id));

  $("resultOut").textContent = result && resultUser
    ? resultUser.name + ": " + result.course + " = " + result.marks
    : "No result found.";
}

$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const query = $("q").value;
  const hits = COURSES.filter((course) =>
    course.toLowerCase().includes(query.toLowerCase())
  );

  $("searchOut").textContent = hits.length
    ? hits.join("\n")
    : "No courses match: " + query;
});

$("logout").addEventListener("click", () => {
  sessionStorage.removeItem("session");
  render();
});

function render() {
  const session = getSession();
  const user = session
    ? USERS.find((item) => item.id === session.id)
    : null;

  $("loginBox").classList.toggle("hidden", !!user);
  $("dash").classList.toggle("hidden", !user);

  if (!user) return;

  $("welcome").textContent =
    "Welcome, " + (params.get("name") || user.name);

  if (params.get("id")) {
    showResult(params.get("id"));
  }

  if (user.role === "admin") {
    $("admin").classList.remove("hidden");

    $("userList").replaceChildren(
      ...USERS.map((item) => {
        const li = document.createElement("li");
        li.textContent =
          item.name + " (" + item.role + ") CNIC " + item.cnic;
        return li;
      })
    );
  } else {
    $("admin").classList.add("hidden");
  }
}

render();
