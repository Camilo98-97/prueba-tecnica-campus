using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Students.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<SchoolDb>(options => options.UseMySQL(builder.Configuration.GetConnectionString("School")!));
builder.Services.AddScoped<IPasswordHasher<Student>, PasswordHasher<Student>>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
    options.Cookie.Name = "campus.session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
    options.Events.OnValidatePrincipal = async context =>
    {
        var id = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var db = context.HttpContext.RequestServices.GetRequiredService<SchoolDb>();
        if (!int.TryParse(id, out var studentId) || !await db.Students.AnyAsync(s => s.Id == studentId)) context.RejectPrincipal();
    };
});
builder.Services.AddAuthorization();
var app = builder.Build();
if (args.Length == 2 && args[0] == "--script")
{
    using var scope = app.Services.CreateScope();
    var sql = scope.ServiceProvider.GetRequiredService<SchoolDb>().Database.GenerateCreateScript();
    await File.WriteAllTextAsync(args[1], "CREATE DATABASE IF NOT EXISTS `CampusStudents` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;\nUSE `CampusStudents`;\n\n" + sql);
    return;
}
app.UseExceptionHandler();
// A custom request header blocks cross-origin HTML form submissions, including login CSRF.
// The Angular development proxy and production reverse proxy expose /api on the same origin.
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") &&
        !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) &&
        context.Request.Headers["X-Campus-Request"] != "1")
    {
        await Results.Problem("Falta el encabezado X-Campus-Request.", statusCode: 403).ExecuteAsync(context);
        return;
    }
    await next();
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
if (builder.Configuration.GetValue<bool>("Database:Initialize"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<SchoolDb>().Database.EnsureCreatedAsync();
}
app.Run();
public partial class Program { }
