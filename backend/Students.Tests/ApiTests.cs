using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Students.Api;
using Xunit;

namespace Students.Tests;

public sealed class CampusFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    public CampusFactory() { connection.Open(); }
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> { ["Database:Initialize"] = "true" }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<SchoolDb>();
            services.RemoveAll<DbContextOptions<SchoolDb>>();
            services.RemoveAll<IDbContextOptionsConfiguration<SchoolDb>>();
            services.AddDbContext<SchoolDb>(options => options.UseSqlite(connection));
        });
    }
    public HttpClient Client()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("X-Campus-Request", "1");
        return client;
    }
    protected override void Dispose(bool disposing) { base.Dispose(disposing); if (disposing) connection.Dispose(); }
}

public class ApiTests
{
    private static Task<HttpResponseMessage> Register(HttpClient client, string email = "ana@example.com", string name = "Ana Pérez") =>
        client.PostAsJsonAsync("/api/auth/register", new { name, email, password = "Campus123!" });
    private static Task<HttpResponseMessage> Enroll(HttpClient client, int[] ids) =>
        client.PutAsJsonAsync("/api/students/me/enrollment", new { courseIds = ids });

    [Fact]
    public async Task AccountCanExistWithoutEnrollmentAndProfileEditingDoesNotEnroll()
    {
        using var factory = new CampusFactory(); using var client = factory.Client();
        var response = await Register(client);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var profile = (await response.Content.ReadFromJsonAsync<ProfileDto>())!;
        Assert.Empty(profile.Courses); Assert.Equal(0, profile.TotalCredits);
        Assert.Empty((await client.GetFromJsonAsync<JsonElement>("/api/students/me/classes")).EnumerateArray());
        var updated = await client.PutAsJsonAsync("/api/students/me", new { name = "Ana Editada", email = "editada@example.com" });
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Empty((await updated.Content.ReadFromJsonAsync<ProfileDto>())!.Courses);
        Assert.Equal(HttpStatusCode.OK, (await Enroll(client, [1, 3, 5])).StatusCode);
    }

    [Fact]
    public async Task CatalogHasTenCoursesThreeCreditsAndFiveProfessors()
    {
        using var factory = new CampusFactory(); using var client = factory.Client();
        var courses = (await client.GetFromJsonAsync<CourseDto[]>("/api/courses"))!;
        Assert.Equal(10, courses.Length); Assert.All(courses, c => Assert.Equal(3, c.Credits));
        Assert.Equal(5, courses.GroupBy(c => c.ProfessorId).Count());
        Assert.All(courses.GroupBy(c => c.ProfessorId), group => Assert.Equal(2, group.Count()));
    }

    [Theory]
    [InlineData(new int[] { 1, 2, 3 })]
    [InlineData(new int[] { 1, 3 })]
    [InlineData(new int[] { 1, 3, 5, 7 })]
    [InlineData(new int[] { 1, 1, 3 })]
    [InlineData(new int[] { 1, 3, 99 })]
    [InlineData(new int[] { })]
    public async Task InvalidEnrollmentIsRejectedWithoutChangingAccount(int[] ids)
    {
        using var factory = new CampusFactory(); using var client = factory.Client();
        Assert.Equal(HttpStatusCode.Created, (await Register(client)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enroll(client, ids)).StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Equal(1, await scope.ServiceProvider.GetRequiredService<SchoolDb>().Students.CountAsync());
        Assert.Equal(0, await scope.ServiceProvider.GetRequiredService<SchoolDb>().Enrollments.CountAsync());
    }

    [Fact]
    public async Task FullCrudAndLoginWorkAndInvalidUpdateKeepsEnrollment()
    {
        using var factory = new CampusFactory(); using var client = factory.Client();
        Assert.Equal(HttpStatusCode.Created, (await Register(client)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Enroll(client, [1, 3, 5])).StatusCode);
        Assert.Equal(9, (await client.GetFromJsonAsync<ProfileDto>("/api/students/me"))!.TotalCredits);
        Assert.Equal(HttpStatusCode.BadRequest, (await Enroll(client, [1, 2, 3])).StatusCode);
        Assert.Equal(new[] { 1, 3, 5 }, (await client.GetFromJsonAsync<ProfileDto>("/api/students/me"))!.Courses.Select(c => c.Id));
        var update = await client.PutAsJsonAsync("/api/students/me", new { name = "Ana Actualizada", email = "ana2@example.com" });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        Assert.Equal(new[] { 1, 3, 5 }, (await update.Content.ReadFromJsonAsync<ProfileDto>())!.Courses.Select(c => c.Id));
        var enrollment = await Enroll(client, [2, 4, 6]);
        Assert.Equal(HttpStatusCode.OK, enrollment.StatusCode);
        Assert.Equal(new[] { 2, 4, 6 }, (await enrollment.Content.ReadFromJsonAsync<ProfileDto>())!.Courses.Select(c => c.Id));
        Assert.Equal("ana2@example.com", (await client.GetFromJsonAsync<ProfileDto>("/api/students/me"))!.Email);
        Assert.Equal(HttpStatusCode.NoContent, (await client.PostAsJsonAsync("/api/auth/logout", new { })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/students/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new { email = "ana2@example.com", password = "incorrect" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync("/api/auth/login", new { email = "ana2@example.com", password = "Campus123!" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync("/api/students/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/students/me")).StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<SchoolDb>().Enrollments.ToListAsync());
    }

    [Fact]
    public async Task ClassmatesContainOnlyNamesAndOnlySharedClasses()
    {
        using var factory = new CampusFactory(); using var ana = factory.Client(); using var luis = factory.Client();
        Assert.Equal(HttpStatusCode.Created, (await Register(ana)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Register(luis, "luis@example.com", "Luis López")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Enroll(ana, [1, 3, 5])).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Enroll(luis, [1, 4, 6])).StatusCode);
        var groups = (await ana.GetFromJsonAsync<JsonElement>("/api/students/me/classes")).EnumerateArray().ToArray();
        Assert.Equal(3, groups.Length);
        var peers = groups.Single(g => g.GetProperty("id").GetInt32() == 1).GetProperty("classmates").EnumerateArray().ToArray();
        Assert.Single(peers); Assert.Equal("Luis López", peers[0].GetProperty("name").GetString()); Assert.Single(peers[0].EnumerateObject());
        Assert.All(groups.Where(g => g.GetProperty("id").GetInt32() != 1), g => Assert.Empty(g.GetProperty("classmates").EnumerateArray()));
        var directory = (await ana.GetFromJsonAsync<JsonElement>("/api/students")).EnumerateArray().ToArray();
        Assert.Equal(2, directory.Length);
        Assert.All(directory, s => { Assert.False(s.TryGetProperty("email", out _)); Assert.False(s.TryGetProperty("passwordHash", out _)); });
    }

    [Fact]
    public async Task AuthDuplicateEmailAndCsrfAreEnforced()
    {
        using var factory = new CampusFactory(); using var client = factory.Client(); using var anonymous = factory.Client();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/students")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.DeleteAsync("/api/students/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Enroll(client, [1, 3, 5])).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Register(client)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Register(anonymous, "ANA@EXAMPLE.COM")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/students/me/classes")).StatusCode);
        client.DefaultRequestHeaders.Remove("X-Campus-Request");
        Assert.Equal(HttpStatusCode.Forbidden, (await client.DeleteAsync("/api/students/me")).StatusCode);
    }
}
