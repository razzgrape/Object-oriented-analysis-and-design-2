package withoutpattern;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.*;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

class Department {
    public long id;
    public String name;
    public List<Division> divisions;

    public Department(long id, String name, List<Division> divisions) {
        this.id = id;
        this.name = name;
        this.divisions = divisions;
    }
}

class Division {
    public long id;
    public String name;
    public List<Employee> employees;

    public Division(long id, String name, List<Employee> employees) {
        this.id = id;
        this.name = name;
        this.employees = employees;
    }
}

class Employee {
    public long id;
    public String name;
    public String position;
    public List<Project> projects;

    public Employee(long id, String name, String position, List<Project> projects) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.projects = projects;
    }
}

class Project {
    public long id;
    public String title;
    public List<Report> reports;

    public Project(long id, String title, List<Report> reports) {
        this.id = id;
        this.title = title;
        this.reports = reports;
    }
}

class Report {
    public long id;
    public String content;

    public Report(long id, String content) {
        this.id = id;
        this.content = content;
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
}

@RestController
@RequestMapping("/api/eager")
@CrossOrigin(origins = "*")
class EagerController {

    private final Connection connection;

    public EagerController(Connection connection) {
        this.connection = connection;
    }

    @GetMapping("/company")
    public List<Department> getFullCompany() throws SQLException {
        List<Department> departments = new ArrayList<>();

        ResultSet deptRs = connection.createStatement()
            .executeQuery("SELECT id, name FROM department");

        while (deptRs.next()) {
            long deptId = deptRs.getLong("id");

            List<Division> divisions = new ArrayList<>();
            PreparedStatement divPs = connection.prepareStatement(
                "SELECT id, name FROM division WHERE department_id = ?");
            divPs.setLong(1, deptId);
            ResultSet divRs = divPs.executeQuery();

            while (divRs.next()) {
                long divId = divRs.getLong("id");

                List<Employee> employees = new ArrayList<>();
                PreparedStatement empPs = connection.prepareStatement(
                    "SELECT id, name, position FROM employee WHERE division_id = ?");
                empPs.setLong(1, divId);
                ResultSet empRs = empPs.executeQuery();

                while (empRs.next()) {
                    long empId = empRs.getLong("id");

                    List<Project> projects = new ArrayList<>();
                    PreparedStatement projPs = connection.prepareStatement(
                        "SELECT id, title FROM project WHERE employee_id = ?");
                    projPs.setLong(1, empId);
                    ResultSet projRs = projPs.executeQuery();

                    while (projRs.next()) {
                        long projId = projRs.getLong("id");

                        List<Report> reports = new ArrayList<>();
                        PreparedStatement repPs = connection.prepareStatement(
                            "SELECT id, content FROM report WHERE project_id = ?");
                        repPs.setLong(1, projId);
                        ResultSet repRs = repPs.executeQuery();

                        while (repRs.next())
                            reports.add(new Report(repRs.getLong("id"), repRs.getString("content")));

                        projects.add(new Project(projRs.getLong("id"), projRs.getString("title"), reports));
                    }
                    employees.add(new Employee(empRs.getLong("id"), empRs.getString("name"), empRs.getString("position"), projects));
                }
                divisions.add(new Division(divRs.getLong("id"), divRs.getString("name"), employees));
            }
            departments.add(new Department(deptId, deptRs.getString("name"), divisions));
        }
        return departments;
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

    // --- Departments ---

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

    @PostMapping("/departments")
    public String addDepartment(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO department (name) VALUES (?)");
        ps.setString(1, body.get("name"));
        ps.executeUpdate();
        return "ok";
    }

    @PutMapping("/departments/{id}")
    public String updateDepartment(@PathVariable long id, @RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("UPDATE department SET name = ? WHERE id = ?");
        ps.setString(1, body.get("name"));
        ps.setLong(2, id);
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

    // --- Divisions ---

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

    @PostMapping("/divisions")
    public String addDivision(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO division (name, department_id) VALUES (?, ?)");
        ps.setString(1, body.get("name"));
        ps.setLong(2, Long.parseLong(body.get("departmentId")));
        ps.executeUpdate();
        return "ok";
    }

    @PutMapping("/divisions/{id}")
    public String updateDivision(@PathVariable long id, @RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("UPDATE division SET name = ? WHERE id = ?");
        ps.setString(1, body.get("name"));
        ps.setLong(2, id);
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

    // --- Employees ---

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

    @PostMapping("/employees")
    public String addEmployee(@RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("INSERT INTO employee (name, position, division_id) VALUES (?, ?, ?)");
        ps.setString(1, body.get("name"));
        ps.setString(2, body.get("position"));
        ps.setLong(3, Long.parseLong(body.get("divisionId")));
        ps.executeUpdate();
        return "ok";
    }

    @PutMapping("/employees/{id}")
    public String updateEmployee(@PathVariable long id, @RequestBody java.util.Map<String, String> body) throws SQLException {
        PreparedStatement ps = connection.prepareStatement("UPDATE employee SET name = ?, position = ? WHERE id = ?");
        ps.setString(1, body.get("name"));
        ps.setString(2, body.get("position"));
        ps.setLong(3, id);
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
public class WithoutPattern {
    public static void main(String[] args) {
        SpringApplication.run(WithoutPattern.class, args);
    }
}