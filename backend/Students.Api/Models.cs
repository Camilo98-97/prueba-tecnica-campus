using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Students.Api;

public class Student
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public List<Enrollment> Enrollments { get; set; } = [];
}

public class Professor
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int Credits { get; set; } = 3;
    public int ProfessorId { get; set; }
    public Professor Professor { get; set; } = null!;
}

public class Enrollment
{
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public int CourseId { get; set; }
    public int ProfessorId { get; set; }
    public Course Course { get; set; } = null!;
}

public record RegisterRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email,
    [Required, StringLength(128, MinimumLength = 8)] string Password);
public record UpdateRequest(
    [Required, StringLength(100, MinimumLength = 2)] string Name,
    [Required, EmailAddress, StringLength(254)] string Email);
public record EnrollmentRequest([Required] int[] CourseIds);
public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
public record CourseDto(int Id, string Name, int Credits, int ProfessorId, string ProfessorName);
public record ProfileDto(int Id, string Name, string Email, CourseDto[] Courses, int TotalCredits);

public class SchoolDb(DbContextOptions<SchoolDb> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Professor> Professors => Set<Professor>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<Student>().Property(s => s.Name).HasMaxLength(100);
        model.Entity<Student>().Property(s => s.Email).HasMaxLength(254);
        model.Entity<Student>().Property(s => s.PasswordHash).HasMaxLength(512);
        model.Entity<Student>().HasIndex(s => s.Email).IsUnique();
        model.Entity<Professor>().Property(p => p.Name).HasMaxLength(100);
        model.Entity<Course>().Property(c => c.Name).HasMaxLength(100);
        model.Entity<Course>().ToTable(t => t.HasCheckConstraint("CK_Course_Credits", "Credits = 3"));
        model.Entity<Course>().HasAlternateKey(c => new { c.Id, c.ProfessorId });
        model.Entity<Course>().HasOne(c => c.Professor).WithMany().HasForeignKey(c => c.ProfessorId).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Enrollment>().HasKey(e => new { e.StudentId, e.CourseId });
        model.Entity<Enrollment>().HasIndex(e => new { e.StudentId, e.ProfessorId }).IsUnique();
        model.Entity<Enrollment>().HasOne(e => e.Student).WithMany(s => s.Enrollments).HasForeignKey(e => e.StudentId);
        model.Entity<Enrollment>().HasOne(e => e.Course).WithMany().HasForeignKey(e => new { e.CourseId, e.ProfessorId })
            .HasPrincipalKey(c => new { c.Id, c.ProfessorId }).OnDelete(DeleteBehavior.Restrict);
        model.Entity<Professor>().HasData(
            new Professor { Id = 1, Name = "Laura Méndez" }, new Professor { Id = 2, Name = "Carlos Rojas" },
            new Professor { Id = 3, Name = "Diana Torres" }, new Professor { Id = 4, Name = "Andrés Ruiz" },
            new Professor { Id = 5, Name = "Sofía Castro" });
        string[] names = ["Matemáticas", "Estadística", "Programación", "Bases de datos", "Física", "Electrónica", "Comunicación", "Literatura", "Inglés", "Emprendimiento"];
        model.Entity<Course>().HasData(names.Select((name, i) => new Course { Id = i + 1, Name = name, ProfessorId = i / 2 + 1, Credits = 3 }));
    }
}

public static class EnrollmentRules
{
    public static string? Validate(int[]? ids, IReadOnlyCollection<Course> courses)
    {
        if (ids is null || ids.Length != 3 || ids.Distinct().Count() != 3)
            return "Debes seleccionar exactamente tres materias diferentes.";
        if (courses.Count != 3 || courses.Any(c => !ids.Contains(c.Id)))
            return "Una o más materias no existen.";
        if (courses.Select(c => c.ProfessorId).Distinct().Count() != 3)
            return "No puedes seleccionar dos materias del mismo profesor.";
        return null;
    }
}
