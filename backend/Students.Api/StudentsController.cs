using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

namespace Students.Api;

[ApiController]
[Route("api")]
public class StudentsController(SchoolDb db, IPasswordHasher<Student> hasher) : ControllerBase
{
    private int StudentId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("courses")]
    public async Task<IActionResult> Courses() => Ok(await db.Courses.OrderBy(c => c.Id)
        .Select(c => new CourseDto(c.Id, c.Name, c.Credits, c.ProfessorId, c.Professor.Name)).ToArrayAsync());

    [HttpPost("auth/register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (request.Name.Trim().Length < 2) return Problem("Escribe un nombre válido.", statusCode: 400);
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Students.AnyAsync(s => s.Email == email)) return Problem("El correo ya está registrado.", statusCode: 409);
        var student = new Student { Name = request.Name.Trim(), Email = email };
        student.PasswordHash = hasher.HashPassword(student, request.Password);
        db.Students.Add(student);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (IsDuplicate(ex)) { return Problem("El correo ya está registrado.", statusCode: 409); }
        await SignIn(student);
        return Created("/api/students/me", await Profile(student.Id));
    }

    [HttpPost("auth/login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var student = await db.Students.SingleOrDefaultAsync(s => s.Email == request.Email.Trim().ToLowerInvariant());
        if (student is null || hasher.VerifyHashedPassword(student, student.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return Problem("Correo o contraseña incorrectos.", statusCode: 401);
        await SignIn(student);
        return Ok(await Profile(student.Id));
    }

    [Authorize, HttpPost("auth/logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync();
        return NoContent();
    }

    [Authorize, HttpGet("students/me")]
    public async Task<IActionResult> Me()
    {
        var profile = await Profile(StudentId);
        return profile is null ? NotFound() : Ok(profile);
    }

    [Authorize, HttpPut("students/me")]
    public async Task<IActionResult> Update(UpdateRequest request)
    {
        if (request.Name.Trim().Length < 2) return Problem("Escribe un nombre válido.", statusCode: 400);
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Students.AnyAsync(s => s.Email == email && s.Id != StudentId)) return Problem("El correo ya está registrado.", statusCode: 409);
        var student = await db.Students.SingleOrDefaultAsync(s => s.Id == StudentId);
        if (student is null) return NotFound();
        student.Name = request.Name.Trim();
        student.Email = email;
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateException ex) when (IsDuplicate(ex)) { return Problem("El correo ya está registrado.", statusCode: 409); }
        return Ok(await Profile(student.Id));
    }

    [Authorize, HttpPut("students/me/enrollment")]
    public async Task<IActionResult> Enroll(EnrollmentRequest request)
    {
        var courses = await db.Courses.Where(c => request.CourseIds.Contains(c.Id)).ToListAsync();
        var error = EnrollmentRules.Validate(request.CourseIds, courses);
        if (error is not null) return Problem(error, statusCode: 400);
        await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        var student = await db.Students.Include(s => s.Enrollments).SingleOrDefaultAsync(s => s.Id == StudentId);
        if (student is null) return NotFound();
        db.Enrollments.RemoveRange(student.Enrollments);
        await db.SaveChangesAsync();
        student.Enrollments = courses.Select(c => new Enrollment { StudentId = student.Id, CourseId = c.Id, ProfessorId = c.ProfessorId }).ToList();
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(await Profile(student.Id));
    }

    [Authorize, HttpDelete("students/me")]
    public async Task<IActionResult> Delete()
    {
        var student = await db.Students.FindAsync(StudentId);
        if (student is null) return NotFound();
        db.Students.Remove(student);
        await db.SaveChangesAsync();
        await HttpContext.SignOutAsync();
        return NoContent();
    }

    [Authorize, HttpGet("students")]
    public async Task<IActionResult> Directory() => Ok(await db.Students.AsNoTracking().OrderBy(s => s.Name)
        .Select(s => new { s.Id, s.Name, Courses = s.Enrollments.OrderBy(e => e.CourseId).Select(e => e.Course.Name).ToArray() }).ToArrayAsync());

    [Authorize, HttpGet("students/me/classes")]
    public async Task<IActionResult> Classmates()
    {
        var courses = await db.Enrollments.Where(e => e.StudentId == StudentId).Select(e => e.CourseId).ToArrayAsync();
        return Ok(await db.Courses.Where(c => courses.Contains(c.Id)).OrderBy(c => c.Id).Select(c => new
        {
            c.Id, c.Name, c.Credits, ProfessorName = c.Professor.Name,
            Classmates = db.Enrollments.Where(e => e.CourseId == c.Id && e.StudentId != StudentId)
                .OrderBy(e => e.Student.Name).Select(e => new { e.Student.Name }).ToArray()
        }).ToArrayAsync());
    }

    private async Task<ProfileDto?> Profile(int id) => await db.Students.AsNoTracking().Where(s => s.Id == id)
        .Select(s => new ProfileDto(s.Id, s.Name, s.Email,
            s.Enrollments.OrderBy(e => e.CourseId).Select(e => new CourseDto(e.CourseId, e.Course.Name, e.Course.Credits, e.ProfessorId, e.Course.Professor.Name)).ToArray(),
            s.Enrollments.Sum(e => (int?)e.Course.Credits) ?? 0)).SingleOrDefaultAsync();

    private Task SignIn(Student student) => HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, student.Id.ToString())], CookieAuthenticationDefaults.AuthenticationScheme)));

    private static bool IsDuplicate(DbUpdateException ex) => ex.InnerException is MySqlException { Number: 1062 };
}
