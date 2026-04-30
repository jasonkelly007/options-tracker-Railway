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
        policy.WithOrigins(
                "https://options-tracker-production.up.railway.app",
                "http://localhost:3000", 
                "http://localhost:5173"
              )
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

app.UseAuthorization();

app.MapControllers();

app.Run();
