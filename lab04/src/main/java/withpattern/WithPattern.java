package withpattern;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;


interface LazyLoadable {
    boolean isLoaded();
}

class Department implements LazyLoadable {
    public long id;
    public String name;
    public List<Division> divisions = null;

    public Department(long id, String name) {
        this.id = id;
        this.name = name;
    }

    public List<Division> getDivisions(DataLoader loader) {
        if (divisions == null) {
            divisions = loader.loadDivisions(this.id);
        }
        return divisions;
    }

    @Override
    public boolean isLoaded() { return divisions != null; }
}

class Division implements LazyLoadable {
    public long id;
    public String name;
    public List<Employee> employees = null;

    public Division(long id, String name) {
        this.id = id;
        this.name = name;
    }

    public List<Employee> getEmployees(DataLoader loader) {
        if (employees == null) {
            employees = loader.loadEmployees(this.id);
        }
        return employees;
    }

    @Override
    public boolean isLoaded() { return employees != null; }
}

class Employee implements LazyLoadable {
    public long id;
    public String name;
    public String position;
    public List<Project> projects = null;

    public Employee(long id, String name, String position) {
        this.id = id;
        this.name = name;
        this.position = position;
    }

    public List<Project> getProjects(DataLoader loader) {
        if (projects == null) {
            projects = loader.loadProjects(this.id);
        }
        return projects;
    }

    @Override
    public boolean isLoaded() { return projects != null; }
}

class Project implements LazyLoadable {
    public long id;
    public String title;
    public List<Report> reports = null;

    public Project(long id, String title) {
        this.id = id;
        this.title = title;
    }

    public List<Report> getReports(DataLoader loader) {
        if (reports == null) {
            reports = loader.loadReports(this.id);
        }
        return reports;
    }

    @Override
    public boolean isLoaded() { return reports != null; }
}

class Report {
    public long id;
    public String content;

    public Report(long id, String content) {
        this.id = id;
        this.content = content;
    }
}

class DataLoader {
    private final Connection connection;

    public DataLoader(Connection connection) {
        this.connection = connection;
    }

    public List<Department> loadDepartments() {
        List<Department> list = new ArrayList<>();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT id, name FROM department")) {
            while (rs.next())
                list.add(new Department(rs.getLong("id"), rs.getString("name")));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }

    public List<Division> loadDivisions(long deptId) {
        List<Division> list = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT id, name FROM division WHERE department_id = ?")) {
            ps.setLong(1, deptId);
            ResultSet rs = ps.executeQuery();
            while (rs.next())
                list.add(new Division(rs.getLong("id"), rs.getString("name")));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }

    public List<Employee> loadEmployees(long divId) {
        List<Employee> list = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT id, name, position FROM employee WHERE division_id = ?")) {
            ps.setLong(1, divId);
            ResultSet rs = ps.executeQuery();
            while (rs.next())
                list.add(new Employee(rs.getLong("id"), rs.getString("name"), rs.getString("position")));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }

    public List<Project> loadProjects(long empId) {
        List<Project> list = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT id, title FROM project WHERE employee_id = ?")) {
            ps.setLong(1, empId);
            ResultSet rs = ps.executeQuery();
            while (rs.next())
                list.add(new Project(rs.getLong("id"), rs.getString("title")));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }

    public List<Report> loadReports(long projId) {
        List<Report> list = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT id, content FROM report WHERE project_id = ?")) {
            ps.setLong(1, projId);
            ResultSet rs = ps.executeQuery();
            while (rs.next())
                list.add(new Report(rs.getLong("id"), rs.getString("content")));
        } catch (SQLException e) { throw new RuntimeException(e); }
        return list;
    }
}

@Configuration
class DatabaseConfig {

    @Bean
    public Connection connection() throws Exception {
        Connection conn = DriverManager.getConnection("jdbc:sqlite:company.db");
        try (Statement st = conn.createStatement()) {
            st.executeUpdate("CREATE TABLE IF NOT EXISTS department (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)");
            st.executeUpdate("CREATE TABLE IF NOT EXISTS division (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, department_id INTEGER NOT NULL)");
            st.executeUpdate("CREATE TABLE IF NOT EXISTS employee (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, position TEXT NOT NULL, division_id INTEGER NOT NULL)");
            st.executeUpdate("CREATE TABLE IF NOT EXISTS project (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, employee_id INTEGER NOT NULL)");
            st.executeUpdate("CREATE TABLE IF NOT EXISTS report (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, project_id INTEGER NOT NULL)");

            ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM department");
            if (rs.next() && rs.getInt(1) == 0) {
                st.executeUpdate("INSERT INTO department (name) VALUES ('Департамент разработки'), ('Департамент маркетинга')");
                st.executeUpdate("INSERT INTO division (name, department_id) VALUES ('Backend-отдел', 1), ('Frontend-отдел', 1), ('Отдел рекламы', 2)");
                st.executeUpdate("INSERT INTO employee (name, position, division_id) VALUES ('Иван Петров', 'Senior Developer', 1), ('Анна Смирнова', 'Junior Developer', 1), ('Олег Козлов', 'Tech Lead', 2)");
                st.executeUpdate("INSERT INTO project (title, employee_id) VALUES ('Проект Альфа', 1), ('Проект Бета', 1), ('Проект Гамма', 3)");
                st.executeUpdate("INSERT INTO report (content, project_id) VALUES ('Отчёт 1 по Альфе', 1), ('Отчёт 2 по Альфе', 1), ('Отчёт по Бете', 2)");
            }
        }
        return conn;
    }

    @Bean
    public DataLoader dataLoader(Connection connection) {
        return new DataLoader(connection);
    }
}

@RestController
@RequestMapping("/api/lazy")
@CrossOrigin(origins = "*")
class LazyController {

    private final DataLoader loader;
    private List<Department> departments = null;

    public LazyController(DataLoader loader) {
        this.loader = loader;
    }

    @GetMapping("/departments")
    public List<Department> getDepartments() {
        if (departments == null) {
            departments = loader.loadDepartments();
        }
        return departments;
    }

    @GetMapping("/departments/{id}/divisions")
    public List<Division> getDivisions(@PathVariable long id) {
        return getDepartments().stream()
            .filter(d -> d.id == id).findFirst().orElseThrow()
            .getDivisions(loader);
    }

    @GetMapping("/divisions/{id}/employees")
    public List<Employee> getEmployees(@PathVariable long id) {
        return getDepartments().stream()
            .flatMap(d -> d.getDivisions(loader).stream())
            .filter(div -> div.id == id).findFirst().orElseThrow()
            .getEmployees(loader);
    }

    @GetMapping("/employees/{id}/projects")
    public List<Project> getProjects(@PathVariable long id) {
        return getDepartments().stream()
            .flatMap(d -> d.getDivisions(loader).stream())
            .flatMap(div -> div.getEmployees(loader).stream())
            .filter(e -> e.id == id).findFirst().orElseThrow()
            .getProjects(loader);
    }

    @GetMapping("/projects/{id}/reports")
    public List<Report> getReports(@PathVariable long id) {
        return getDepartments().stream()
            .flatMap(d -> d.getDivisions(loader).stream())
            .flatMap(div -> div.getEmployees(loader).stream())
            .flatMap(e -> e.getProjects(loader).stream())
            .filter(p -> p.id == id).findFirst().orElseThrow()
            .getReports(loader);
    }
}

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
class AdminController {

    private final Connection connection;

    public AdminController(Connection connection) {
        this.connection = connection;
    }

    @PostMapping("/departments")
    public String addDepartment(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO department (name) VALUES (?)");
        ps.setString(1, body.get("name"));
        ps.executeUpdate();
        return "ok";
    }

    @DeleteMapping("/departments/{id}")
    public String deleteDepartment(@PathVariable long id) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("DELETE FROM department WHERE id = ?");
        ps.setLong(1, id);
        ps.executeUpdate();
        return "ok";
    }

    @PostMapping("/divisions")
    public String addDivision(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO division (name, department_id) VALUES (?, ?)");
        ps.setString(1, body.get("name"));
        ps.setLong(2, Long.parseLong(body.get("departmentId")));
        ps.executeUpdate();
        return "ok";
    }

    @DeleteMapping("/divisions/{id}")
    public String deleteDivision(@PathVariable long id) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("DELETE FROM division WHERE id = ?");
        ps.setLong(1, id);
        ps.executeUpdate();
        return "ok";
    }

    @PostMapping("/employees")
    public String addEmployee(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO employee (name, position, division_id) VALUES (?, ?, ?)");
        ps.setString(1, body.get("name"));
        ps.setString(2, body.get("position"));
        ps.setLong(3, Long.parseLong(body.get("divisionId")));
        ps.executeUpdate();
        return "ok";
    }

    @DeleteMapping("/employees/{id}")
    public String deleteEmployee(@PathVariable long id) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("DELETE FROM employee WHERE id = ?");
        ps.setLong(1, id);
        ps.executeUpdate();
        return "ok";
    }

    @GetMapping("/departments")
    public java.util.List<java.util.Map<String, Object>> getDepartments() throws SQLException {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        ResultSet rs = connection.createStatement().executeQuery("SELECT id, name FROM department");
        while (rs.next()) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("name", rs.getString("name"));
            list.add(m);
        }
        return list;
    }

    @GetMapping("/divisions")
    public java.util.List<java.util.Map<String, Object>> getDivisions() throws SQLException {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        ResultSet rs = connection.createStatement().executeQuery("SELECT id, name, department_id FROM division");
        while (rs.next()) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("name", rs.getString("name"));
            m.put("departmentId", rs.getLong("department_id"));
            list.add(m);
        }
        return list;
    }

    @GetMapping("/employees")
    public java.util.List<java.util.Map<String, Object>> getEmployees() throws SQLException {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        ResultSet rs = connection.createStatement().executeQuery("SELECT id, name, position, division_id FROM employee");
        while (rs.next()) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("name", rs.getString("name"));
            m.put("position", rs.getString("position"));
            m.put("divisionId", rs.getLong("division_id"));
            list.add(m);
        }
        return list;
    }

    // --- Projects ---

    @GetMapping("/projects")
    public java.util.List<java.util.Map<String, Object>> getProjects() throws SQLException {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        ResultSet rs = connection.createStatement().executeQuery("SELECT id, title, employee_id FROM project");
        while (rs.next()) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("title", rs.getString("title"));
            m.put("employeeId", rs.getLong("employee_id"));
            list.add(m);
        }
        return list;
    }

    @PostMapping("/projects")
    public String addProject(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO project (title, employee_id) VALUES (?, ?)");
        ps.setString(1, body.get("title"));
        ps.setLong(2, Long.parseLong(body.get("employeeId")));
        ps.executeUpdate();
        return "ok";
    }

    @PutMapping("/projects/{id}")
    public String updateProject(@PathVariable long id, @RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("UPDATE project SET title = ? WHERE id = ?");
        ps.setString(1, body.get("title"));
        ps.setLong(2, id);
        ps.executeUpdate();
        return "ok";
    }

    @DeleteMapping("/projects/{id}")
    public String deleteProject(@PathVariable long id) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("DELETE FROM project WHERE id = ?");
        ps.setLong(1, id);
        ps.executeUpdate();
        return "ok";
    }

    // --- Reports ---

    @GetMapping("/reports")
    public java.util.List<java.util.Map<String, Object>> getReports() throws SQLException {
        java.util.List<java.util.Map<String, Object>> list = new java.util.ArrayList<>();
        ResultSet rs = connection.createStatement().executeQuery("SELECT id, content, project_id FROM report");
        while (rs.next()) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("content", rs.getString("content"));
            m.put("projectId", rs.getLong("project_id"));
            list.add(m);
        }
        return list;
    }

    @PostMapping("/reports")
    public String addReport(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO report (content, project_id) VALUES (?, ?)");
        ps.setString(1, body.get("content"));
        ps.setLong(2, Long.parseLong(body.get("projectId")));
        ps.executeUpdate();
        return "ok";
    }

    @PutMapping("/reports/{id}")
    public String updateReport(@PathVariable long id, @RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("UPDATE report SET content = ? WHERE id = ?");
        ps.setString(1, body.get("content"));
        ps.setLong(2, id);
        ps.executeUpdate();
        return "ok";
    }

    @DeleteMapping("/reports/{id}")
    public String deleteReport(@PathVariable long id) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("DELETE FROM report WHERE id = ?");
        ps.setLong(1, id);
        ps.executeUpdate();
        return "ok";
    }
}

@SpringBootApplication
public class WithPattern {
    public static void main(String[] args) {
        SpringApplication.run(WithPattern.class, args);
    }
}