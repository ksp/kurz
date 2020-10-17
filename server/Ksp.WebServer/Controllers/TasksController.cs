using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Ksp.WebServer.Controllers
{
    [ApiController]
    [Route("tasks.json")]
    public class TasksController : ControllerBase
    {
        private readonly ILogger<TasksController> logger;
        private readonly IWebHostEnvironment env;

        public TasksController(ILogger<TasksController> logger, IWebHostEnvironment env)
        {
            this.env = env;
            this.logger = logger;
        }

        string TasksJsonFile => Path.Combine(env.ContentRootPath, "../../tasks.json");

        [HttpGet]
        public IActionResult Get()
        {
            return this.PhysicalFile(TasksJsonFile, "text/json");
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            if (env.IsProduction())
                return this.Forbid();

            // TODO: auth org
            using var rdr = new StreamReader(HttpContext.Request.Body);
            await System.IO.File.WriteAllTextAsync(TasksJsonFile, await rdr.ReadToEndAsync());
            return Ok();
        }
    }
}
