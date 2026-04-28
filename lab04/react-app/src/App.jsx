import { useState, useEffect } from "react";

const LAZY_BASE  = "http://localhost:8080/api/lazy";
const EAGER_BASE = "http://localhost:8080/api/eager";
const ADMIN_BASE = "http://localhost:8080/api/admin";

// ─── Стили ─────────────────────────────────────────────────────

const styles = {
  app: { fontFamily: "sans-serif", maxWidth: 700, margin: "40px auto", padding: "0 20px" },
  nav: { display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: 24, gap: 4 },
  tab: (active) => ({
    padding: "10px 24px", border: "none", cursor: "pointer", fontSize: 15,
    borderBottom: active ? "2px solid #4f46e5" : "2px solid transparent",
    marginBottom: -2, background: "none",
    fontWeight: active ? 600 : 400,
    color: active ? "#4f46e5" : "#666",
  }),
  hint: {
    fontSize: 13, color: "#888", marginBottom: 20, padding: "8px 12px",
    background: "#f9fafb", borderRadius: 6, borderLeft: "3px solid #4f46e5",
  },
  node: (open) => ({
    cursor: "pointer", padding: "6px 10px", borderRadius: 6,
    userSelect: "none", display: "flex", alignItems: "center", gap: 8,
    background: open ? "#ede9fe" : "transparent", transition: "background 0.15s",
  }),
  children: { borderLeft: "2px solid #e5e7eb", marginLeft: 18 },
  leaf:     { padding: "4px 16px", color: "#555", fontSize: 14 },
  loading:  { padding: "4px 16px", color: "#aaa", fontSize: 13 },

  // Админ
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#374151" },
  form: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  input: {
    padding: "7px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 14, flex: 1, minWidth: 160,
  },
  select: {
    padding: "7px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 14, flex: 1, minWidth: 160, background: "#fff",
  },
  btnAdd: {
    padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
    background: "#4f46e5", color: "#fff", fontSize: 14, whiteSpace: "nowrap",
  },
  btnDel: {
    padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
    background: "#fee2e2", color: "#dc2626", fontSize: 13,
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e5e7eb",
    color: "#6b7280", fontWeight: 500,
  },
  td: { padding: "8px 12px", borderBottom: "1px solid #f3f4f6" },
};

// ─── Базовый узел дерева ───────────────────────────────────────

function TreeNode({ label, onExpand, children, loaded }) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!open && !loaded) onExpand();
    setOpen(!open);
  };

  return (
    <div style={{ marginLeft: 16 }}>
      <div style={styles.node(open)} onClick={handleClick}>
        <span style={{ fontSize: 11, color: "#999", width: 10 }}>
          {open ? "▼" : "▶"}
        </span>
        <span>{label}</span>
      </div>
      {open && <div style={styles.children}>{children}</div>}
    </div>
  );
}

// ─── СТРАНИЦА 1: С паттерном ───────────────────────────────────

function LazyPage() {
  const [departments, setDepartments] = useState(null);

  useEffect(() => {
    fetch(`${LAZY_BASE}/departments`).then((r) => r.json()).then(setDepartments);
  }, []);

  return (
    <div>
      <p style={styles.hint}>
        Данные подгружаются по клику. Открой DevTools → Network и смотри
        как появляются новые запросы при каждом раскрытии узла.
      </p>
      {!departments
        ? <p style={styles.loading}>Загрузка департаментов...</p>
        : departments.map((dept) => <LazyDepartment key={dept.id} dept={dept} />)}
    </div>
  );
}

function LazyDepartment({ dept }) {
  const [divisions, setDivisions] = useState(null);
  return (
    <TreeNode label={`🏢 ${dept.name}`} loaded={divisions !== null}
      onExpand={() => fetch(`${LAZY_BASE}/departments/${dept.id}/divisions`)
        .then((r) => r.json()).then(setDivisions)}>
      {divisions
        ? divisions.map((div) => <LazyDivision key={div.id} div={div} />)
        : <p style={styles.loading}>Загрузка...</p>}
    </TreeNode>
  );
}

function LazyDivision({ div }) {
  const [employees, setEmployees] = useState(null);
  return (
    <TreeNode label={`🏬 ${div.name}`} loaded={employees !== null}
      onExpand={() => fetch(`${LAZY_BASE}/divisions/${div.id}/employees`)
        .then((r) => r.json()).then(setEmployees)}>
      {employees
        ? employees.map((emp) => <LazyEmployee key={emp.id} emp={emp} />)
        : <p style={styles.loading}>Загрузка...</p>}
    </TreeNode>
  );
}

function LazyEmployee({ emp }) {
  const [projects, setProjects] = useState(null);
  return (
    <TreeNode label={`👤 ${emp.name} — ${emp.position}`} loaded={projects !== null}
      onExpand={() => fetch(`${LAZY_BASE}/employees/${emp.id}/projects`)
        .then((r) => r.json()).then(setProjects)}>
      {projects
        ? projects.map((proj) => <LazyProject key={proj.id} proj={proj} />)
        : <p style={styles.loading}>Загрузка...</p>}
    </TreeNode>
  );
}

function LazyProject({ proj }) {
  const [reports, setReports] = useState(null);
  return (
    <TreeNode label={`📁 ${proj.title}`} loaded={reports !== null}
      onExpand={() => fetch(`${LAZY_BASE}/projects/${proj.id}/reports`)
        .then((r) => r.json()).then(setReports)}>
      {reports
        ? reports.map((rep) => <div key={rep.id} style={styles.leaf}>📄 {rep.content}</div>)
        : <p style={styles.loading}>Загрузка...</p>}
    </TreeNode>
  );
}

// ─── СТРАНИЦА 2: Без паттерна ──────────────────────────────────

function EagerPage() {
  const [tree, setTree] = useState(null);

  useEffect(() => {
    fetch(`${EAGER_BASE}/company`).then((r) => r.json()).then(setTree);
  }, []);

  return (
    <div>
      <p style={styles.hint}>
        Всё дерево загружено одним запросом при открытии страницы.
        Клики только раскрывают узлы — новых запросов нет.
      </p>
      {!tree
        ? <p style={styles.loading}>Загрузка всей структуры компании...</p>
        : tree.map((dept) => (
            <TreeNode key={dept.id} label={`🏢 ${dept.name}`} loaded={true} onExpand={() => {}}>
              {dept.divisions.map((div) => (
                <TreeNode key={div.id} label={`🏬 ${div.name}`} loaded={true} onExpand={() => {}}>
                  {div.employees.map((emp) => (
                    <TreeNode key={emp.id} label={`👤 ${emp.name} — ${emp.position}`} loaded={true} onExpand={() => {}}>
                      {emp.projects.map((proj) => (
                        <TreeNode key={proj.id} label={`📁 ${proj.title}`} loaded={true} onExpand={() => {}}>
                          {proj.reports.map((rep) => (
                            <div key={rep.id} style={styles.leaf}>📄 {rep.content}</div>
                          ))}
                        </TreeNode>
                      ))}
                    </TreeNode>
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}
    </div>
  );
}

// ─── СТРАНИЦА 3: Админ ─────────────────────────────────────────

function AdminPage() {
  const [adminTab, setAdminTab] = useState("departments");

  const tabs = [
    { key: "departments", label: "🏢 Департаменты" },
    { key: "divisions",   label: "🏬 Отделы" },
    { key: "employees",   label: "👤 Сотрудники" },
    { key: "projects",    label: "📁 Проекты" },
    { key: "reports",     label: "📄 Отчёты" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setAdminTab(t.key)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid #d1d5db",
            cursor: "pointer", fontSize: 13,
            background: adminTab === t.key ? "#4f46e5" : "#fff",
            color: adminTab === t.key ? "#fff" : "#374151",
            fontWeight: adminTab === t.key ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>
      {adminTab === "departments" && <DepartmentsTab />}
      {adminTab === "divisions"   && <DivisionsTab />}
      {adminTab === "employees"   && <EmployeesTab />}
      {adminTab === "projects"    && <ProjectsTab />}
      {adminTab === "reports"     && <ReportsTab />}
    </div>
  );
}

// ── Департаменты ──

function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState("");

  const reload = () => fetch(`${ADMIN_BASE}/departments`).then((r) => r.json()).then(setDepartments);
  useEffect(() => { reload(); }, []);

  const add = () => {
    if (!newName.trim()) return;
    fetch(`${ADMIN_BASE}/departments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    }).then(() => { setNewName(""); reload(); });
  };

  const del = (id) => fetch(`${ADMIN_BASE}/departments/${id}`, { method: "DELETE" }).then(reload);

  return (
    <div style={styles.section}>
      <div style={styles.form}>
        <input style={styles.input} placeholder="Название департамента"
          value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} />
        <button style={styles.btnAdd} onClick={add}>Добавить</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Название</th>
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id}>
              <td style={styles.td}>{d.id}</td>
              <td style={styles.td}>{d.name}</td>
              <td style={styles.td}><button style={styles.btnDel} onClick={() => del(d.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Отделы ──

function DivisionsTab() {
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDeptId, setNewDeptId] = useState("");

  const reload = () => {
    fetch(`${ADMIN_BASE}/divisions`).then((r) => r.json()).then(setDivisions);
    fetch(`${ADMIN_BASE}/departments`).then((r) => r.json()).then((data) => {
      setDepartments(data);
      if (!newDeptId && data.length > 0) setNewDeptId(data[0].id);
    });
  };
  useEffect(() => { reload(); }, []);

  const add = () => {
    if (!newName.trim() || !newDeptId) return;
    fetch(`${ADMIN_BASE}/divisions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, departmentId: String(newDeptId) }),
    }).then(() => { setNewName(""); reload(); });
  };

  const del = (id) => fetch(`${ADMIN_BASE}/divisions/${id}`, { method: "DELETE" }).then(reload);
  const getDeptName = (id) => departments.find((d) => d.id === id)?.name ?? "—";

  return (
    <div style={styles.section}>
      <div style={styles.form}>
        <input style={styles.input} placeholder="Название отдела"
          value={newName} onChange={(e) => setNewName(e.target.value)} />
        <select style={styles.select} value={newDeptId} onChange={(e) => setNewDeptId(e.target.value)}>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button style={styles.btnAdd} onClick={add}>Добавить</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Название</th>
          <th style={styles.th}>Департамент</th>
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {divisions.map((d) => (
            <tr key={d.id}>
              <td style={styles.td}>{d.id}</td>
              <td style={styles.td}>{d.name}</td>
              <td style={styles.td}>{getDeptName(d.departmentId)}</td>
              <td style={styles.td}><button style={styles.btnDel} onClick={() => del(d.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Сотрудники ──

function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPos,  setNewPos]  = useState("");
  const [newDivId, setNewDivId] = useState("");

  const reload = () => {
    fetch(`${ADMIN_BASE}/employees`).then((r) => r.json()).then(setEmployees);
    fetch(`${ADMIN_BASE}/divisions`).then((r) => r.json()).then((data) => {
      setDivisions(data);
      if (!newDivId && data.length > 0) setNewDivId(data[0].id);
    });
  };
  useEffect(() => { reload(); }, []);

  const add = () => {
    if (!newName.trim() || !newPos.trim() || !newDivId) return;
    fetch(`${ADMIN_BASE}/employees`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, position: newPos, divisionId: String(newDivId) }),
    }).then(() => { setNewName(""); setNewPos(""); reload(); });
  };

  const del = (id) => fetch(`${ADMIN_BASE}/employees/${id}`, { method: "DELETE" }).then(reload);
  const getDivName = (id) => divisions.find((d) => d.id === id)?.name ?? "—";

  return (
    <div style={styles.section}>
      <div style={styles.form}>
        <input style={styles.input} placeholder="Имя"
          value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input style={styles.input} placeholder="Должность"
          value={newPos} onChange={(e) => setNewPos(e.target.value)} />
        <select style={styles.select} value={newDivId} onChange={(e) => setNewDivId(e.target.value)}>
          {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button style={styles.btnAdd} onClick={add}>Добавить</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Имя</th>
          <th style={styles.th}>Должность</th>
          <th style={styles.th}>Отдел</th>
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id}>
              <td style={styles.td}>{e.id}</td>
              <td style={styles.td}>{e.name}</td>
              <td style={styles.td}>{e.position}</td>
              <td style={styles.td}>{getDivName(e.divisionId)}</td>
              <td style={styles.td}><button style={styles.btnDel} onClick={() => del(e.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Проекты ──

function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newEmpId, setNewEmpId] = useState("");

  const reload = () => {
    fetch(`${ADMIN_BASE}/projects`).then((r) => r.json()).then(setProjects);
    fetch(`${ADMIN_BASE}/employees`).then((r) => r.json()).then((data) => {
      setEmployees(data);
      if (!newEmpId && data.length > 0) setNewEmpId(data[0].id);
    });
  };
  useEffect(() => { reload(); }, []);

  const add = () => {
    if (!newTitle.trim() || !newEmpId) return;
    fetch(`${ADMIN_BASE}/projects`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, employeeId: String(newEmpId) }),
    }).then(() => { setNewTitle(""); reload(); });
  };

  const del = (id) => fetch(`${ADMIN_BASE}/projects/${id}`, { method: "DELETE" }).then(reload);
  const getEmpName = (id) => employees.find((e) => e.id === id)?.name ?? "—";

  return (
    <div style={styles.section}>
      <div style={styles.form}>
        <input style={styles.input} placeholder="Название проекта"
          value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <select style={styles.select} value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <button style={styles.btnAdd} onClick={add}>Добавить</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Название</th>
          <th style={styles.th}>Сотрудник</th>
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td style={styles.td}>{p.id}</td>
              <td style={styles.td}>{p.title}</td>
              <td style={styles.td}>{getEmpName(p.employeeId)}</td>
              <td style={styles.td}><button style={styles.btnDel} onClick={() => del(p.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Отчёты ──

function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newProjId, setNewProjId] = useState("");

  const reload = () => {
    fetch(`${ADMIN_BASE}/reports`).then((r) => r.json()).then(setReports);
    fetch(`${ADMIN_BASE}/projects`).then((r) => r.json()).then((data) => {
      setProjects(data);
      if (!newProjId && data.length > 0) setNewProjId(data[0].id);
    });
  };
  useEffect(() => { reload(); }, []);

  const add = () => {
    if (!newContent.trim() || !newProjId) return;
    fetch(`${ADMIN_BASE}/reports`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent, projectId: String(newProjId) }),
    }).then(() => { setNewContent(""); reload(); });
  };

  const del = (id) => fetch(`${ADMIN_BASE}/reports/${id}`, { method: "DELETE" }).then(reload);
  const getProjTitle = (id) => projects.find((p) => p.id === id)?.title ?? "—";

  return (
    <div style={styles.section}>
      <div style={styles.form}>
        <input style={styles.input} placeholder="Содержание отчёта"
          value={newContent} onChange={(e) => setNewContent(e.target.value)} />
        <select style={styles.select} value={newProjId} onChange={(e) => setNewProjId(e.target.value)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button style={styles.btnAdd} onClick={add}>Добавить</button>
      </div>
      <table style={styles.table}>
        <thead><tr>
          <th style={styles.th}>ID</th>
          <th style={styles.th}>Содержание</th>
          <th style={styles.th}>Проект</th>
          <th style={styles.th}></th>
        </tr></thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td style={styles.td}>{r.id}</td>
              <td style={styles.td}>{r.content}</td>
              <td style={styles.td}>{getProjTitle(r.projectId)}</td>
              <td style={styles.td}><button style={styles.btnDel} onClick={() => del(r.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Главный компонент ─────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("lazy");

  return (
    <div style={styles.app}>
      <h2 style={{ marginBottom: 20 }}>Корпоративная структура</h2>

      <nav style={styles.nav}>
        <button style={styles.tab(page === "lazy")}  onClick={() => setPage("lazy")}>
          С паттерном (Lazy)
        </button>
        <button style={styles.tab(page === "eager")} onClick={() => setPage("eager")}>
          Без паттерна (Eager)
        </button>
        <button style={styles.tab(page === "admin")} onClick={() => setPage("admin")}>
          ⚙️ Админ
        </button>
      </nav>

      {page === "lazy"  && <LazyPage  key="lazy"  />}
      {page === "eager" && <EagerPage key="eager" />}
      {page === "admin" && <AdminPage key="admin" />}
    </div>
  );
}