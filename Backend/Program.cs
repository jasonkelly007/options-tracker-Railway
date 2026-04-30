using Microsoft.EntityFrameworkCore;
using OptionsTracker.Data;
using OptionsTracker.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var isPostgres = (connectionString?.StartsWith("postgres", StringComparison.OrdinalIgnoreCase) ?? false) || (connectionString?.Contains("Host=") ?? false);
var useSqlite = connectionString?.Contains("Data Source=") ?? false;

if (isPostgres)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else if (useSqlite)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// Services
builder.Services.AddScoped<IPositionService, PositionService>();
builder.Services.AddScoped<IOptionsService, OptionsService>();
builder.Services.AddScoped<ICsvImportService, CsvImportService>();

// CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
        var origins = new List<string> { "http://localhost:3000", "http://localhost:5173" };
        
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            // Support comma-separated URLs and handle trailing slashes
            var urls = frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries);
            foreach (var url in urls)
            {
                origins.Add(url.Trim().TrimEnd('/'));
            }
        }
        
        policy.WithOrigins(origins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-create database on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated(); // Creates database if it doesn't exist
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseCors("AllowFrontend");

// Simple Password Protection Middleware
app.Use(async (context, next) =>
{
    var appPassword = Environment.GetEnvironmentVariable("APP_PASSWORD");
    
    // If no password is set in env, skip protection
    if (string.IsNullOrEmpty(appPassword))
    {
        await next();
        return;
    }

    // Allow health check and CORS preflight without password
    if (context.Request.Path.Value == "/health" || context.Request.Method == "OPTIONS")
    {
        await next();
        return;
    }

    if (!context.Request.Headers.TryGetValue("X-App-Password", out var extractedPassword) || extractedPassword != appPassword)
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized");
        return;
    }

    await next();
});

app.UseAuthorization();

app.MapGet("/health", () => "OK");

app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "80";
app.Run($"http://0.0.0.0:{port}");
